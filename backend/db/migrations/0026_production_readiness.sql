-- ===============================================================
-- VCT Platform — Migration 0026: PRODUCTION READINESS (Phase 6C)
-- Search path, GIN indexes on JSONB, row estimates,
-- table statistics, connection hints, final API views
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SEARCH PATH SECURITY
--    Prevent schema injection attacks
-- ════════════════════════════════════════════════════════

-- Set secure search_path for all functions
-- (Prevents CREATE FUNCTION ... SET search_path attacks)
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid, n.nspname, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('core', 'tournament', 'platform', 'system', 'api_v1')
    AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I SET search_path = %I, public',
        fn.nspname, fn.proname, fn.nspname
      );
    EXCEPTION WHEN OTHERS THEN
      -- Some functions have multiple overloads, skip errors
      NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. GIN INDEXES ON JSONB COLUMNS
--    For queries like WHERE metadata @> '{"key": "value"}'
-- ════════════════════════════════════════════════════════

-- Only add GIN on tables where JSONB is actually queried
CREATE INDEX IF NOT EXISTS idx_tournaments_config_gin
  ON tournaments USING GIN (config jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_athletes_metadata_gin
  ON athletes USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_event_store_data_gin
  ON tournament.event_store USING GIN (event_data jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_event_store_metadata_gin
  ON tournament.event_store USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_notifications_data_gin
  ON system.notification_queue USING GIN (data jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_import_errors_gin
  ON system.import_rows USING GIN (errors jsonb_path_ops)
  WHERE status = 'invalid';

CREATE INDEX IF NOT EXISTS idx_feature_flags_rules_gin
  ON system.feature_flags USING GIN (target_rules jsonb_path_ops);

-- ════════════════════════════════════════════════════════
-- 3. ROW COUNT ESTIMATION FUNCTION
--    For fast approximate counts (no seq scan on large tables)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.estimate_count(
  p_table TEXT
)
RETURNS BIGINT AS $$
DECLARE v_count BIGINT;
BEGIN
  SELECT reltuples::BIGINT
  INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname || '.' || c.relname = p_table
     OR c.relname = p_table;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 4. COMPREHENSIVE DASHBOARD VIEW
--    Single query → full system stats
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.system_dashboard AS
SELECT
  (SELECT count(*) FROM core.tenants WHERE is_active = true) AS active_tenants,
  (SELECT system.estimate_count('core.users')) AS total_users,
  (SELECT count(*) FROM tournaments WHERE status = 'thi_dau' AND is_deleted = false) AS active_tournaments,
  (SELECT count(*) FROM combat_matches WHERE trang_thai = 'dang_dau' AND is_deleted = false) AS live_matches,
  (SELECT count(*) FROM system.job_queue WHERE status = 'pending') AS pending_jobs,
  (SELECT count(*) FROM system.notification_queue WHERE status = 'pending') AS pending_notifications,
  (SELECT count(*) FROM core.erasure_requests WHERE status = 'pending') AS pending_erasure_requests,
  (SELECT count(*) FROM system.circuit_breakers WHERE status = 'open') AS open_circuit_breakers,
  (SELECT count(*) FROM system.import_jobs WHERE status IN ('validating', 'importing')) AS active_imports,
  (SELECT pg_database_size(current_database())) AS database_size_bytes,
  NOW() AS snapshot_at;

-- ════════════════════════════════════════════════════════
-- 5. CONNECTION POOL ADVISORY VIEWS
--    Help PgBouncer / app decide pool sizing
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW system.v_connection_stats AS
SELECT
  count(*) AS total_connections,
  count(*) FILTER (WHERE state = 'active') AS active,
  count(*) FILTER (WHERE state = 'idle') AS idle,
  count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_txn,
  count(*) FILTER (WHERE wait_event_type = 'Lock') AS waiting_on_lock,
  max(EXTRACT(EPOCH FROM NOW() - xact_start))::INT AS longest_txn_seconds,
  max(EXTRACT(EPOCH FROM NOW() - query_start))::INT AS longest_query_seconds
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid();

-- ════════════════════════════════════════════════════════
-- 6. LONG RUNNING QUERY KILLER
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.kill_long_queries(
  p_max_seconds INT DEFAULT 300,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  pid INT,
  duration_seconds INT,
  query TEXT,
  action TEXT
) AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT
      sa.pid,
      EXTRACT(EPOCH FROM NOW() - sa.query_start)::INT AS dur,
      left(sa.query, 200) AS q
    FROM pg_stat_activity sa
    WHERE sa.state = 'active'
      AND sa.pid != pg_backend_pid()
      AND sa.datname = current_database()
      AND EXTRACT(EPOCH FROM NOW() - sa.query_start) > p_max_seconds
    ORDER BY sa.query_start
  LOOP
    pid := r.pid;
    duration_seconds := r.dur;
    query := r.q;
    IF p_dry_run THEN
      action := 'DRY_RUN (would cancel)';
    ELSE
      PERFORM pg_cancel_backend(r.pid);
      action := 'cancelled';
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 7. ENUM-LIKE CHECK CONSTRAINT SUMMARY VIEW
--    Show all CHECK constraints with allowed values
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW system.v_check_constraints AS
SELECT
  tc.table_schema,
  tc.table_name,
  cc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc
  ON cc.constraint_name = tc.constraint_name
  AND cc.constraint_schema = tc.constraint_schema
WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND cc.check_clause LIKE '%IN%'
ORDER BY tc.table_schema, tc.table_name;

-- ════════════════════════════════════════════════════════
-- 8. TOURNAMENT SUMMARY VIEW
--    Complete tournament with aggregated stats
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.tournament_detail AS
SELECT
  t.id,
  t.tenant_id,
  t.name,
  t.code,
  t.status,
  t.start_date,
  t.end_date,
  t.location,
  t.config,
  -- Aggregated stats
  (SELECT count(*) FROM athletes a
   WHERE a.tournament_id = t.id AND a.is_deleted = false) AS athlete_count,
  (SELECT count(*) FROM teams tm
   WHERE tm.tournament_id = t.id AND tm.is_deleted = false) AS team_count,
  (SELECT count(*) FROM combat_matches m
   WHERE m.tournament_id = t.id AND m.is_deleted = false) AS match_count,
  (SELECT count(*) FROM combat_matches m
   WHERE m.tournament_id = t.id AND m.trang_thai = 'ket_thuc'
     AND m.is_deleted = false) AS completed_matches,
  (SELECT count(*) FROM registrations r
   WHERE r.tournament_id = t.id AND r.is_deleted = false) AS registration_count,
  (SELECT count(DISTINCT a.current_club_id) FROM athletes a
   WHERE a.tournament_id = t.id AND a.is_deleted = false
     AND a.current_club_id IS NOT NULL) AS club_count,
  t.created_at,
  t.updated_at
FROM tournaments t
WHERE t.is_deleted = false;

-- ════════════════════════════════════════════════════════
-- 9. GRANT READ ACCESS ON API VIEWS TO READONLY ROLE
-- ════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vct_readonly') THEN
    CREATE ROLE vct_readonly NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vct_api') THEN
    CREATE ROLE vct_api NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vct_admin') THEN
    CREATE ROLE vct_admin NOLOGIN;
  END IF;

  -- api_v1 views → readonly
  GRANT USAGE ON SCHEMA api_v1 TO vct_readonly;
  GRANT SELECT ON ALL TABLES IN SCHEMA api_v1 TO vct_readonly;

  -- api_v1 + write schemas → api role
  GRANT USAGE ON SCHEMA api_v1 TO vct_api;
  GRANT USAGE ON SCHEMA core TO vct_api;
  GRANT USAGE ON SCHEMA tournament TO vct_api;
  GRANT USAGE ON SCHEMA people TO vct_api;
  GRANT USAGE ON SCHEMA training TO vct_api;
  GRANT USAGE ON SCHEMA platform TO vct_api;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core TO vct_api;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA tournament TO vct_api;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA people TO vct_api;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA training TO vct_api;
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA platform TO vct_api;
  GRANT SELECT ON ALL TABLES IN SCHEMA api_v1 TO vct_api;

  -- Admin: full access
  GRANT ALL ON ALL TABLES IN SCHEMA core TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA tournament TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA people TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA training TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA platform TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA system TO vct_admin;
  GRANT ALL ON ALL TABLES IN SCHEMA api_v1 TO vct_admin;
EXCEPTION WHEN OTHERS THEN
  -- Roles may already have grants
  NULL;
END $$;

-- Default privileges for future tables
DO $$
BEGIN
  ALTER DEFAULT PRIVILEGES IN SCHEMA api_v1 GRANT SELECT ON TABLES TO vct_readonly;
  ALTER DEFAULT PRIVILEGES IN SCHEMA api_v1 GRANT SELECT ON TABLES TO vct_api;
  ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE ON TABLES TO vct_api;
  ALTER DEFAULT PRIVILEGES IN SCHEMA tournament GRANT SELECT, INSERT, UPDATE ON TABLES TO vct_api;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMIT;
