-- ===============================================================
-- VCT Platform — Migration 0012: ADVANCED ENTERPRISE (Phase 2A)
-- Table Partitioning, Vietnamese FTS, Transactional Outbox,
-- Generic Auto Audit Trigger
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ════════════════════════════════════════════════════════
-- 2. VIETNAMESE FULL-TEXT SEARCH CONFIGURATION
-- ════════════════════════════════════════════════════════

DO $$
BEGIN
  CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);
EXCEPTION WHEN unique_violation THEN
  NULL; -- already exists
END $$;

ALTER TEXT SEARCH CONFIGURATION vietnamese
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, simple;

-- ════════════════════════════════════════════════════════
-- 3. PARTITIONED MATCH EVENTS
--    Declarative RANGE partitioning on recorded_at
--    Each partition = 1 quarter (~90 days)
--    PG17: partition pruning is automatic at query time
-- ════════════════════════════════════════════════════════

-- 3a. Create new partitioned table in tournament schema
CREATE TABLE IF NOT EXISTS tournament.match_events (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL,
  match_id          UUID NOT NULL,
  event_type        VARCHAR(50) NOT NULL,
  event_data        JSONB NOT NULL DEFAULT '{}',
  sequence_number   BIGINT NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by       UUID,
  device_id         VARCHAR(100),
  round_number      INT,
  is_confirmed      BOOLEAN DEFAULT false,
  source            VARCHAR(20) DEFAULT 'panel',
  is_deleted        BOOLEAN DEFAULT false,
  metadata          JSONB DEFAULT '{}',
  -- PK must include partition key
  PRIMARY KEY (recorded_at, tenant_id, id)
) PARTITION BY RANGE (recorded_at);

-- 3b. Create partitions: Q4-2025 through Q4-2026 (5 quarters ahead)
CREATE TABLE IF NOT EXISTS tournament.match_events_2025_q4
  PARTITION OF tournament.match_events
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS tournament.match_events_2026_q1
  PARTITION OF tournament.match_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS tournament.match_events_2026_q2
  PARTITION OF tournament.match_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS tournament.match_events_2026_q3
  PARTITION OF tournament.match_events
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS tournament.match_events_2026_q4
  PARTITION OF tournament.match_events
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- 3c. DEFAULT partition for anything outside defined ranges
CREATE TABLE IF NOT EXISTS tournament.match_events_default
  PARTITION OF tournament.match_events DEFAULT;

-- 3d. Migrate existing data from public.match_events → tournament.match_events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'match_events'
  ) THEN
    INSERT INTO tournament.match_events
      (id, tenant_id, match_id, event_type, event_data,
       sequence_number, recorded_at, recorded_by, device_id,
       round_number, is_confirmed, source, is_deleted, metadata)
    SELECT
      id,
      COALESCE(tenant_id, '00000000-0000-7000-8000-000000000001'),
      match_id, event_type,
      COALESCE(event_data, '{}'),
      sequence_number,
      COALESCE(recorded_at, NOW()),
      recorded_by, device_id, round_number,
      false,
      'panel',
      COALESCE(is_deleted, false),
      COALESCE(metadata, '{}')
    FROM public.match_events
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3e. Indexes on partitioned table (applied to all partitions)
CREATE INDEX IF NOT EXISTS idx_tmatch_events_match_seq
  ON tournament.match_events(match_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_tmatch_events_tenant_match
  ON tournament.match_events(tenant_id, match_id);

CREATE INDEX IF NOT EXISTS idx_tmatch_events_brin
  ON tournament.match_events USING BRIN (recorded_at)
  WITH (pages_per_range = 16);

-- 3f. RLS
ALTER TABLE tournament.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tournament.match_events
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- ════════════════════════════════════════════════════════
-- 4. PARTITIONED AUDIT LOG
--    Monthly partitions (higher volume than match events)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.audit_log_partitioned (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL,
  table_name        VARCHAR(100) NOT NULL,
  record_id         UUID NOT NULL,
  action            VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data          JSONB,
  new_data          JSONB,
  changed_fields    JSONB DEFAULT '[]',
  user_id           UUID,
  ip_address        INET,
  user_agent        TEXT,
  request_id        VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (created_at, tenant_id, id)
) PARTITION BY RANGE (created_at);

-- Monthly partitions: 2026 Jan-Dec
DO $$
DECLARE
  m INT;
  start_date TEXT;
  end_date TEXT;
  part_name TEXT;
BEGIN
  FOR m IN 1..12 LOOP
    start_date := format('2026-%s-01', lpad(m::TEXT, 2, '0'));
    IF m = 12 THEN
      end_date := '2027-01-01';
    ELSE
      end_date := format('2026-%s-01', lpad((m+1)::TEXT, 2, '0'));
    END IF;
    part_name := format('system.audit_log_2026_%s', lpad(m::TEXT, 2, '0'));
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.audit_log_partitioned FOR VALUES FROM (%L) TO (%L)',
      part_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Default partition
CREATE TABLE IF NOT EXISTS system.audit_log_default
  PARTITION OF system.audit_log_partitioned DEFAULT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_part_table
  ON system.audit_log_partitioned(tenant_id, table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_part_user
  ON system.audit_log_partitioned(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_part_brin
  ON system.audit_log_partitioned USING BRIN (created_at)
  WITH (pages_per_range = 32);

-- RLS
ALTER TABLE system.audit_log_partitioned ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.audit_log_partitioned
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- ════════════════════════════════════════════════════════
-- 5. GENERIC AUTO AUDIT TRIGGER FUNCTION
--    Attach to any table → auto-logs to partitioned audit
--    Uses NEW audit_log_partitioned (not legacy data_audit_log)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old     JSONB;
  v_new     JSONB;
  v_changed JSONB;
  v_tenant  UUID;
  v_record  UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_tenant := OLD.tenant_id;
    v_record := OLD.id;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_tenant := NEW.tenant_id;
    v_record := NEW.id;
  ELSE -- UPDATE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_tenant := NEW.tenant_id;
    v_record := NEW.id;
    -- Compute changed fields (exclude updated_at, version)
    SELECT jsonb_agg(key) INTO v_changed
    FROM jsonb_each(v_new) AS n(key, val)
    WHERE v_old -> key IS DISTINCT FROM val
      AND key NOT IN ('updated_at', 'version');
    -- Skip if nothing meaningful changed
    IF v_changed IS NULL OR jsonb_array_length(v_changed) = 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO system.audit_log_partitioned
    (tenant_id, table_name, record_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (
    COALESCE(v_tenant, '00000000-0000-7000-8000-000000000001'),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_old, v_new,
    COALESCE(v_changed, '[]'),
    NULLIF(current_setting('app.current_user', true), '')::UUID
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach to critical tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'athletes', 'teams', 'combat_matches',
    'registrations', 'referees', 'rankings'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_audit_log()',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Audit on new-schema tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.payments', 'platform.invoices',
    'platform.sponsorships', 'people.coaches',
    'core.users', 'core.roles'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_audit_log()',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 6. TRANSACTIONAL OUTBOX
--    Guarantees at-least-once event delivery
--    Worker polls → publishes to NATS → marks published
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.event_outbox (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  aggregate_type  VARCHAR(100) NOT NULL,   -- 'match', 'tournament', 'payment'
  aggregate_id    UUID NOT NULL,
  event_type      VARCHAR(100) NOT NULL,   -- 'MatchScoreRecorded', 'PaymentConfirmed'
  event_data      JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ,             -- NULL = not yet published
  retry_count     INT DEFAULT 0,
  last_error      TEXT
);

-- Only scan unpublished events (hot path)
CREATE INDEX IF NOT EXISTS idx_outbox_pending
  ON system.event_outbox(created_at)
  WHERE published_at IS NULL;

-- For correlation queries
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate
  ON system.event_outbox(aggregate_type, aggregate_id);

-- BRIN for time-based archival
CREATE INDEX IF NOT EXISTS idx_outbox_brin
  ON system.event_outbox USING BRIN (created_at);

-- ════════════════════════════════════════════════════════
-- 7. FULL-TEXT SEARCH COLUMNS + TRIGGERS
-- ════════════════════════════════════════════════════════

-- 7a. Athletes
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_athletes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.ho_ten, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.national_id, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF ho_ten, national_id
    ON athletes FOR EACH ROW EXECUTE FUNCTION trigger_athletes_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_athletes_fts ON athletes USING GIN (search_vector);

-- 7b. Martial Schools
ALTER TABLE platform.martial_schools ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_schools_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name_han_nom, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.founder, '')), 'B') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF name, name_han_nom, founder, description
    ON platform.martial_schools FOR EACH ROW EXECUTE FUNCTION trigger_schools_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_schools_fts ON platform.martial_schools USING GIN (search_vector);

-- 7c. Posts
ALTER TABLE platform.posts ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF title, content
    ON platform.posts FOR EACH ROW EXECUTE FUNCTION trigger_posts_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_fts ON platform.posts USING GIN (search_vector);

-- 7d. Heritage Glossary
ALTER TABLE platform.heritage_glossary ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_glossary_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.term_vi, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.term_han_nom, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.definition, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF term_vi, term_han_nom, definition
    ON platform.heritage_glossary FOR EACH ROW EXECUTE FUNCTION trigger_glossary_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_glossary_fts ON platform.heritage_glossary USING GIN (search_vector);

-- 7e. Tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_tournaments_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.location, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF name, location
    ON tournaments FOR EACH ROW EXECUTE FUNCTION trigger_tournaments_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tournaments_fts ON tournaments USING GIN (search_vector);

-- 7f. Heritage Techniques
ALTER TABLE platform.heritage_techniques ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION trigger_heritage_tech_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name_vi, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name_han_nom, '')), 'A') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.name_en, '')), 'B') ||
    setweight(to_tsvector('vietnamese', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_search_vector BEFORE INSERT OR UPDATE OF name_vi, name_han_nom, name_en, description
    ON platform.heritage_techniques FOR EACH ROW EXECUTE FUNCTION trigger_heritage_tech_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_heritage_tech_fts ON platform.heritage_techniques USING GIN (search_vector);

COMMIT;
