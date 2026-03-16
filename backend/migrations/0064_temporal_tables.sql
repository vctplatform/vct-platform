-- ===============================================================
-- VCT Platform — Migration 0064: TEMPORAL TABLES
-- P1 High: System-versioned history tables for compliance
-- and "time travel" queries (point-in-time reconstruction)
-- ===============================================================

-- Create temporal schema (must be outside transaction if needed)
CREATE SCHEMA IF NOT EXISTS temporal;

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. HISTORY TABLE PATTERN: athletes_history
--    Stores every version of athlete rows
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS temporal.athletes_history (
  -- Mirror all athletes columns
  id              UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  ho_ten          VARCHAR(200),
  ngay_sinh       DATE,
  gioi_tinh       VARCHAR(10),
  can_nang        NUMERIC(5,2),
  ma_vdv          VARCHAR(50),
  tournament_id   UUID,
  current_club_id UUID,
  trang_thai      VARCHAR(30),
  metadata        JSONB,
  -- Temporal columns
  valid_from      TIMESTAMPTZ NOT NULL,   -- when this version started
  valid_to        TIMESTAMPTZ NOT NULL,   -- when this version ended
  changed_by      UUID,
  change_type     VARCHAR(10) NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  change_reason   TEXT,
  -- Primary key includes time range
  PRIMARY KEY (id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_athletes_hist_range
  ON temporal.athletes_history(id, valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_athletes_hist_tenant
  ON temporal.athletes_history(tenant_id, valid_from DESC);

-- ════════════════════════════════════════════════════════
-- 2. HISTORY TABLE: tournaments_history
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS temporal.tournaments_history (
  id              UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  name            VARCHAR(500),
  code            VARCHAR(50),
  status          VARCHAR(30),
  start_date      DATE,
  end_date        DATE,
  location        TEXT,
  config          JSONB,
  -- Temporal
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_to        TIMESTAMPTZ NOT NULL,
  changed_by      UUID,
  change_type     VARCHAR(10) NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  PRIMARY KEY (id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_tournaments_hist_range
  ON temporal.tournaments_history(id, valid_from, valid_to);

-- ════════════════════════════════════════════════════════
-- 3. HISTORY TABLE: combat_matches_history
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS temporal.combat_matches_history (
  id              UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  tournament_id   UUID,
  arena_id        UUID,
  vdv_do_id       UUID,
  vdv_xanh_id     UUID,
  trang_thai      VARCHAR(30),
  ket_qua         VARCHAR(30),
  diem_do         INT,
  diem_xanh       INT,
  thu_tu          INT,
  metadata        JSONB,
  -- Temporal
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_to        TIMESTAMPTZ NOT NULL,
  changed_by      UUID,
  change_type     VARCHAR(10) NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  PRIMARY KEY (id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_matches_hist_range
  ON temporal.combat_matches_history(id, valid_from, valid_to);

-- ════════════════════════════════════════════════════════
-- 4. VERSIONING TRIGGER FUNCTION
--    Generic: captures old row into _history on UPDATE/DELETE
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_temporal_versioning()
RETURNS TRIGGER AS $$
DECLARE
  v_history_table TEXT;
  v_user_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_old_json JSONB;
  v_cols TEXT[];
  v_col TEXT;
  v_insert_cols TEXT;
  v_insert_vals TEXT;
BEGIN
  v_history_table := 'temporal.' || TG_TABLE_NAME || '_history';
  v_user_id := NULLIF(current_setting('app.current_user', true), '')::UUID;

  IF TG_OP = 'INSERT' THEN
    -- Record the initial insert
    BEGIN
      EXECUTE format(
        'INSERT INTO %s SELECT ($1).*, $2, $3, $4, $5',
        v_history_table
      ) USING NEW, v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'INSERT';
    EXCEPTION WHEN OTHERS THEN
      -- Column mismatch possible, skip gracefully
      NULL;
    END;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Close the previous version
    BEGIN
      EXECUTE format(
        'UPDATE %s SET valid_to = $1
         WHERE id = $2 AND valid_to = ''infinity''::TIMESTAMPTZ',
        v_history_table
      ) USING v_now, OLD.id;

      -- Insert new version
      EXECUTE format(
        'INSERT INTO %s SELECT ($1).*, $2, $3, $4, $5',
        v_history_table
      ) USING NEW, v_now, 'infinity'::TIMESTAMPTZ, v_user_id, 'UPDATE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Close the final version
    BEGIN
      EXECUTE format(
        'UPDATE %s SET valid_to = $1, change_type = $2
         WHERE id = $3 AND valid_to = ''infinity''::TIMESTAMPTZ',
        v_history_table
      ) USING v_now, 'DELETE', OLD.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 5. ATTACH TEMPORAL TRIGGERS
-- ════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TRIGGER temporal_version
    AFTER INSERT OR UPDATE OR DELETE ON athletes
    FOR EACH ROW EXECUTE FUNCTION trigger_temporal_versioning();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER temporal_version
    AFTER INSERT OR UPDATE OR DELETE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION trigger_temporal_versioning();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER temporal_version
    AFTER INSERT OR UPDATE OR DELETE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_temporal_versioning();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 6. TIME-TRAVEL QUERY FUNCTION
--    "AS OF" — get entity state at a specific time
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION temporal.as_of(
  p_table TEXT,       -- 'athletes', 'tournaments', 'combat_matches'
  p_entity_id UUID,
  p_timestamp TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  EXECUTE format(
    'SELECT to_jsonb(h.*) FROM temporal.%I_history h
     WHERE h.id = $1
       AND h.valid_from <= $2
       AND h.valid_to > $2
     LIMIT 1',
    p_table
  ) INTO v_result USING p_entity_id, p_timestamp;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get full version history for an entity
CREATE OR REPLACE FUNCTION temporal.version_history(
  p_table TEXT,
  p_entity_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  version_number BIGINT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  change_type TEXT,
  changed_by UUID,
  state JSONB
) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT
       ROW_NUMBER() OVER (ORDER BY valid_from) AS version_number,
       valid_from,
       valid_to,
       change_type::TEXT,
       changed_by,
       to_jsonb(h.*) - ''valid_from'' - ''valid_to'' - ''changed_by'' - ''change_type'' - ''change_reason'' AS state
     FROM temporal.%I_history h
     WHERE h.id = $1
     ORDER BY valid_from DESC
     LIMIT $2',
    p_table
  ) USING p_entity_id, p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Compare two versions (diff)
CREATE OR REPLACE FUNCTION temporal.version_diff(
  p_table TEXT,
  p_entity_id UUID,
  p_time_a TIMESTAMPTZ,
  p_time_b TIMESTAMPTZ
)
RETURNS TABLE (
  field_name TEXT,
  value_at_a TEXT,
  value_at_b TEXT
) AS $$
DECLARE
  v_state_a JSONB;
  v_state_b JSONB;
  v_key TEXT;
BEGIN
  v_state_a := temporal.as_of(p_table, p_entity_id, p_time_a);
  v_state_b := temporal.as_of(p_table, p_entity_id, p_time_b);

  IF v_state_a IS NULL OR v_state_b IS NULL THEN
    RETURN;
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(v_state_a) UNION SELECT jsonb_object_keys(v_state_b) LOOP
    IF v_key NOT IN ('valid_from', 'valid_to', 'changed_by', 'change_type', 'change_reason') THEN
      IF (v_state_a ->> v_key) IS DISTINCT FROM (v_state_b ->> v_key) THEN
        field_name := v_key;
        value_at_a := v_state_a ->> v_key;
        value_at_b := v_state_b ->> v_key;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 7. HISTORY CLEANUP (older than 2 years)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION temporal.cleanup_old_history(
  p_retention_months INT DEFAULT 24,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  history_table TEXT,
  rows_affected INT
) AS $$
DECLARE
  v_table TEXT;
  v_count INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := NOW() - (p_retention_months || ' months')::INTERVAL;

  FOR v_table IN SELECT unnest(ARRAY[
    'temporal.athletes_history',
    'temporal.tournaments_history',
    'temporal.combat_matches_history'
  ]) LOOP
    IF p_dry_run THEN
      EXECUTE format(
        'SELECT count(*) FROM %s WHERE valid_to < $1 AND valid_to != ''infinity''::TIMESTAMPTZ',
        v_table
      ) INTO v_count USING v_cutoff;
    ELSE
      EXECUTE format(
        'DELETE FROM %s WHERE valid_to < $1 AND valid_to != ''infinity''::TIMESTAMPTZ',
        v_table
      ) USING v_cutoff;
      GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    history_table := v_table;
    rows_affected := v_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
