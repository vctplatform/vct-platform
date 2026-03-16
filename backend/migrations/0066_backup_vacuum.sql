-- ===============================================================
-- VCT Platform — Migration 0066: BACKUP/RECOVERY + SMART VACUUM
-- P2 Medium: Pre-migration checkpoints, recovery tracking,
-- per-table vacuum tuning, bloat alerts
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. BACKUP CHECKPOINT TABLE
--    Record state before critical operations
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.backup_checkpoints (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  checkpoint_name VARCHAR(200) NOT NULL,
  checkpoint_type VARCHAR(50) NOT NULL
    CHECK (checkpoint_type IN ('pre_migration', 'pre_bulk_update', 'manual', 'scheduled', 'neon_branch')),
  -- State snapshot
  table_counts    JSONB DEFAULT '{}',       -- {table_name: row_count}
  schema_hash     TEXT,                     -- hash of schema DDL
  -- Neon-specific
  neon_branch_id  TEXT,                     -- Neon branch ID if used
  neon_branch_name TEXT,
  -- Context
  migration_ref   VARCHAR(100),             -- e.g. '0060_elo_rating_system'
  description     TEXT,
  created_by      UUID,
  recovery_notes  TEXT,                     -- instructions for rollback
  -- Status
  status          VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired', 'deleted')),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_type
  ON system.backup_checkpoints(checkpoint_type, created_at DESC);

-- ════════════════════════════════════════════════════════
-- 2. CHECKPOINT CREATION FUNCTION
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.create_checkpoint(
  p_name TEXT,
  p_type TEXT DEFAULT 'manual',
  p_migration_ref TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_counts JSONB := '{}';
  v_hash TEXT;
  r RECORD;
BEGIN
  -- Capture row counts for critical tables
  FOR r IN SELECT unnest(ARRAY[
    'core.users', 'core.tenants', 'athletes', 'tournaments',
    'combat_matches', 'teams', 'clubs', 'registrations',
    'platform.payments', 'platform.invoices'
  ]) AS tbl LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM %s', r.tbl) INTO v_hash;
      v_counts := v_counts || jsonb_build_object(r.tbl, v_hash::INT);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;

  -- Schema hash (simplified: hash of table count)
  SELECT md5(string_agg(
    n.nspname || '.' || c.relname || ':' || c.relnatts::TEXT, ','
    ORDER BY n.nspname, c.relname
  )) INTO v_hash
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast');

  INSERT INTO system.backup_checkpoints
    (checkpoint_name, checkpoint_type, table_counts, schema_hash,
     migration_ref, description, created_by, expires_at)
  VALUES (
    p_name, p_type, v_counts, v_hash,
    p_migration_ref, p_description,
    NULLIF(current_setting('app.current_user', true), '')::UUID,
    NOW() + INTERVAL '30 days'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. RECOVERY POINTS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_recovery_points CASCADE;
CREATE VIEW system.v_recovery_points AS
SELECT
  id,
  checkpoint_name,
  checkpoint_type,
  migration_ref,
  status,
  CASE
    WHEN neon_branch_id IS NOT NULL THEN 'Neon Branch: ' || neon_branch_name
    ELSE 'Table counts snapshot'
  END AS recovery_method,
  table_counts,
  created_at,
  expires_at,
  CASE WHEN expires_at < NOW() THEN true ELSE false END AS is_expired
FROM system.backup_checkpoints
WHERE status = 'active'
ORDER BY created_at DESC;

-- ════════════════════════════════════════════════════════
-- 4. SMART VACUUM CONFIGURATION
--    Per-table AUTO_VACUUM settings for different workloads
-- ════════════════════════════════════════════════════════

-- High-churn tables → aggressive vacuum (lower thresholds)
DO $$
DECLARE tbl TEXT;
BEGIN
  -- Tables with frequent INSERT/UPDATE/DELETE
  FOR tbl IN SELECT unnest(ARRAY[
    'system.notification_queue',
    'system.cdc_outbox',
    'system.query_cache',
    'system.job_queue'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %s SET (
          autovacuum_vacuum_scale_factor = 0.05,
          autovacuum_analyze_scale_factor = 0.02,
          autovacuum_vacuum_threshold = 50,
          autovacuum_vacuum_cost_delay = 10
        )', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;

  -- Medium-churn tables (default-ish but tuned)
  FOR tbl IN SELECT unnest(ARRAY[
    'athletes', 'combat_matches', 'registrations',
    'platform.payments', 'platform.posts'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %s SET (
          autovacuum_vacuum_scale_factor = 0.1,
          autovacuum_analyze_scale_factor = 0.05,
          autovacuum_vacuum_threshold = 100
        )', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;

  -- Low-churn tables (reference data) → less frequent vacuum
  FOR tbl IN SELECT unnest(ARRAY[
    'core.tenants', 'core.roles', 'ref_belt_ranks',
    'ref_weight_classes', 'ref_sport_types'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %s SET (
          autovacuum_vacuum_scale_factor = 0.2,
          autovacuum_analyze_scale_factor = 0.1,
          autovacuum_vacuum_threshold = 500
        )', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. VACUUM MONITORING VIEWS
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_vacuum_stats CASCADE;
CREATE VIEW system.v_vacuum_stats AS
SELECT
  schemaname || '.' || relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE WHEN n_live_tup > 0
    THEN ROUND(n_dead_tup::NUMERIC / n_live_tup * 100, 2)
    ELSE 0
  END AS dead_row_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count + autovacuum_count AS total_vacuums,
  analyze_count + autoanalyze_count AS total_analyzes,
  n_mod_since_analyze AS mods_since_analyze
FROM pg_stat_user_tables
WHERE n_live_tup > 100
ORDER BY dead_row_pct DESC, n_dead_tup DESC;

-- Bloat alert view (tables exceeding threshold)
DROP VIEW IF EXISTS system.v_bloat_alerts CASCADE;
CREATE VIEW system.v_bloat_alerts AS
SELECT
  table_name,
  dead_rows,
  dead_row_pct,
  last_autovacuum,
  CASE
    WHEN dead_row_pct > 30 THEN 'CRITICAL'
    WHEN dead_row_pct > 15 THEN 'WARNING'
    WHEN dead_row_pct > 5 THEN 'INFO'
    ELSE 'OK'
  END AS severity,
  CASE
    WHEN last_autovacuum IS NULL THEN 'Never vacuumed'
    WHEN last_autovacuum < NOW() - INTERVAL '7 days' THEN 'Vacuum overdue'
    ELSE 'Recent vacuum'
  END AS vacuum_status
FROM system.v_vacuum_stats
WHERE dead_row_pct > 5
ORDER BY dead_row_pct DESC;

COMMIT;
