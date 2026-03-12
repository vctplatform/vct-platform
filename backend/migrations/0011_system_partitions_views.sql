-- ===============================================================
-- VCT Platform — Migration 0011: SYSTEM, PARTITIONING & API VIEWS
-- Schema: system.* + api_v1.* | Enterprise infrastructure layer
-- Sync, feature flags, devices, notifications, audit,
-- match_events partitioning, stable API view contracts
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- SYSTEM TABLES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.sync_queue (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  table_name        VARCHAR(100) NOT NULL,
  record_id         UUID NOT NULL,
  operation         VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload           JSONB NOT NULL DEFAULT '{}',
  device_id         VARCHAR(100) NOT NULL,
  status            VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'synced', 'conflict', 'failed')),
  retry_count       INT DEFAULT 0,
  max_retries       INT DEFAULT 5,
  last_error        TEXT,
  priority          INT DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at      TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS system.sync_conflicts (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  sync_queue_id     UUID NOT NULL,
  table_name        VARCHAR(100) NOT NULL,
  record_id         UUID NOT NULL,
  client_data       JSONB NOT NULL,
  server_data       JSONB NOT NULL,
  resolution        VARCHAR(20)
    CHECK (resolution IN ('client_wins', 'server_wins', 'merged', 'manual', 'pending')),
  resolved_by       UUID,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS system.feature_flags (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID REFERENCES core.tenants(id),
  flag_key          VARCHAR(100) NOT NULL,
  flag_value        BOOLEAN DEFAULT false,
  description       TEXT,
  scope             VARCHAR(20) DEFAULT 'global'
    CHECK (scope IN ('global', 'tenant', 'user', 'percentage')),
  rollout_percent   INT DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  target_users      JSONB DEFAULT '[]',
  metadata          JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_flags_tenant_key
  ON system.feature_flags (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), flag_key);

CREATE TABLE IF NOT EXISTS system.device_registry (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  user_id           UUID,
  device_id         VARCHAR(200) NOT NULL,
  device_type       VARCHAR(50) NOT NULL
    CHECK (device_type IN ('scoring_panel', 'mobile', 'tablet', 'desktop', 'kiosk')),
  device_name       VARCHAR(200),
  os_info           VARCHAR(100),
  app_version       VARCHAR(50),
  push_token        TEXT,
  last_sync_at      TIMESTAMPTZ,
  last_seen_at      TIMESTAMPTZ,
  status            VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'blocked', 'pending')),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, device_id)
);

CREATE TABLE IF NOT EXISTS system.notification_queue (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  user_id           UUID,
  channel           VARCHAR(20) NOT NULL
    CHECK (channel IN ('push', 'email', 'sms', 'in_app', 'websocket')),
  title             VARCHAR(200) NOT NULL,
  body              TEXT NOT NULL,
  data              JSONB DEFAULT '{}',
  priority          VARCHAR(10) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status            VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  scheduled_at      TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  read_at           TIMESTAMPTZ,
  retry_count       INT DEFAULT 0,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS system.data_audit_log (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
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
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS system.schema_versions (
  id                UUID DEFAULT uuidv7() PRIMARY KEY,
  version           VARCHAR(50) NOT NULL,
  description       TEXT,
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by        VARCHAR(100),
  checksum          VARCHAR(64),
  execution_time_ms INT
);

-- ════════════════════════════════════════════════════════
-- SYSTEM INDEXES (BRIN for append-only tables)
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON system.sync_queue(tenant_id, status)
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_sync_queue_device ON system.sync_queue(tenant_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_brin ON system.sync_queue USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON system.feature_flags(flag_key) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_device_registry_user ON system.device_registry(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_device_registry_type ON system.device_registry(tenant_id, device_type)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notifications_user ON system.notification_queue(tenant_id, user_id)
  WHERE status IN ('pending', 'sent');
CREATE INDEX IF NOT EXISTS idx_notifications_created_brin ON system.notification_queue USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON system.data_audit_log(tenant_id, table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON system.data_audit_log(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_brin ON system.data_audit_log USING BRIN (created_at);

-- RLS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'system.sync_queue', 'system.sync_conflicts', 'system.device_registry',
    'system.notification_queue', 'system.data_audit_log'
  ]) LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s USING (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID, ''00000000-0000-7000-8000-000000000001''::UUID))',
      tbl
    );
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- API VIEWS (Stable contracts — never query tables directly)
-- Views join across schemas to return unified API payloads
-- ════════════════════════════════════════════════════════

-- Athletes View
CREATE OR REPLACE VIEW api_v1.athletes AS
SELECT
  a.id, a.tenant_id, a.ho_ten AS full_name,
  a.ngay_sinh AS date_of_birth,
  a.gioi_tinh AS gender,
  a.can_nang AS weight,
  a.belt_rank_id,
  r.name_vi AS belt_rank_name,
  a.tournament_id,
  t.name AS tournament_name,
  a.team_id,
  tm.ten AS team_name,
  a.current_club_id AS club_id,
  a.trang_thai AS status,
  a.national_id,
  a.insurance_number,
  a.is_deleted,
  a.created_at,
  a.updated_at,
  a.metadata
FROM athletes a
LEFT JOIN ref_belt_ranks r ON a.belt_rank_id = r.id
LEFT JOIN tournaments t ON a.tournament_id = t.id
LEFT JOIN teams tm ON a.team_id = tm.id
WHERE a.is_deleted = false;

-- Tournaments View
CREATE OR REPLACE VIEW api_v1.tournaments AS
SELECT
  t.id, t.tenant_id, t.name,
  t.start_date,
  t.end_date,
  t.location,
  t.status,
  t.is_deleted,
  t.created_at,
  t.updated_at,
  t.metadata,
  (SELECT COUNT(*) FROM athletes a WHERE a.tournament_id = t.id AND a.is_deleted = false) AS athlete_count,
  (SELECT COUNT(*) FROM teams tm WHERE tm.tournament_id = t.id AND tm.is_deleted = false) AS team_count,
  (SELECT COUNT(*) FROM combat_matches m WHERE m.tournament_id = t.id AND m.is_deleted = false) AS match_count
FROM tournaments t
WHERE t.is_deleted = false;

-- Coaches View
CREATE OR REPLACE VIEW api_v1.coaches AS
SELECT
  c.id, c.tenant_id, c.full_name,
  c.date_of_birth, c.gender, c.phone, c.email,
  c.specialization, c.experience_years,
  c.belt_rank_id, c.status, c.avatar_url,
  c.is_deleted, c.created_at, c.updated_at
FROM people.coaches c
WHERE c.is_deleted = false;

-- Martial Schools View
CREATE OR REPLACE VIEW api_v1.martial_schools AS
SELECT
  ms.id, ms.tenant_id, ms.name, ms.name_han_nom,
  ms.code, ms.founder, ms.founded_year,
  ms.origin_location, ms.description,
  ms.logo_url, ms.is_recognized, ms.status,
  ms.created_at, ms.updated_at,
  (SELECT COUNT(*) FROM platform.lineage_nodes ln WHERE ln.school_id = ms.id) AS lineage_count,
  (SELECT COUNT(*) FROM platform.heritage_techniques ht WHERE ht.school_id = ms.id AND ht.is_deleted = false) AS technique_count
FROM platform.martial_schools ms
WHERE ms.is_deleted = false;

-- Matches View (for live scoring)
CREATE OR REPLACE VIEW api_v1.matches AS
SELECT
  m.id, m.tenant_id, m.tournament_id,
  m.content_category_id,
  m.vong AS round,
  m.bracket_position AS match_number,
  m.trang_thai AS status,
  m.arena_id,
  ar.ten AS arena_name,
  m.thoi_gian_bat_dau AS match_date,
  m.is_deleted,
  m.created_at,
  m.updated_at
FROM combat_matches m
LEFT JOIN arenas ar ON m.arena_id = ar.id
WHERE m.is_deleted = false;

-- Rankings View
CREATE OR REPLACE VIEW api_v1.rankings AS
SELECT
  r.id, r.tenant_id,
  r.category, r.weight_class,
  r.national_rank AS rank,
  r.points,
  r.athlete_id,
  a.ho_ten AS athlete_name,
  r.metadata,
  r.last_updated AS updated_at
FROM rankings r
LEFT JOIN athletes a ON r.athlete_id = a.id
WHERE r.is_deleted = false;

-- Feature Flags View (non-tenant-specific)
CREATE OR REPLACE VIEW api_v1.feature_flags AS
SELECT
  ff.flag_key, ff.flag_value, ff.scope,
  ff.rollout_percent, ff.description
FROM system.feature_flags ff
WHERE ff.is_active = true;

-- ════════════════════════════════════════════════════════
-- SEED DEFAULT FEATURE FLAGS
-- ════════════════════════════════════════════════════════

INSERT INTO system.feature_flags (flag_key, flag_value, description, scope) VALUES
  ('scoring.live_enabled', true, 'Enable live scoring via WebSocket', 'global'),
  ('scoring.video_review', false, 'Enable video review for matches', 'global'),
  ('community.posts_enabled', true, 'Enable community posts', 'global'),
  ('community.marketplace_enabled', false, 'Enable marketplace', 'global'),
  ('training.elearning_enabled', false, 'Enable e-learning courses', 'global'),
  ('finance.online_payment', false, 'Enable online payment processing', 'global'),
  ('heritage.public_lineage', true, 'Allow public viewing of lineage trees', 'global'),
  ('system.offline_mode', true, 'Enable offline scoring capability', 'global'),
  ('system.maintenance_mode', false, 'Put system in maintenance mode', 'global'),
  ('system.multi_language', false, 'Enable multi-language support', 'global')
ON CONFLICT DO NOTHING;

COMMIT;
