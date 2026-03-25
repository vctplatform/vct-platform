-- ===============================================================
-- VCT Platform — Migration 0026 DOWN
-- ===============================================================
BEGIN;

-- Drop roles (must revoke grants first)
DO $$
BEGIN
  REVOKE ALL ON ALL TABLES IN SCHEMA api_v1 FROM vct_readonly;
  REVOKE ALL ON ALL TABLES IN SCHEMA api_v1 FROM vct_api;
  REVOKE ALL ON ALL TABLES IN SCHEMA core FROM vct_api;
  REVOKE ALL ON ALL TABLES IN SCHEMA tournament FROM vct_api;
  REVOKE ALL ON ALL TABLES IN SCHEMA core FROM vct_admin;
  REVOKE ALL ON ALL TABLES IN SCHEMA tournament FROM vct_admin;
  REVOKE ALL ON ALL TABLES IN SCHEMA system FROM vct_admin;
  DROP ROLE IF EXISTS vct_readonly;
  DROP ROLE IF EXISTS vct_api;
  DROP ROLE IF EXISTS vct_admin;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP VIEW IF EXISTS api_v1.tournament_detail CASCADE;
DROP VIEW IF EXISTS system.v_check_constraints CASCADE;
DROP FUNCTION IF EXISTS system.kill_long_queries(INT, BOOLEAN) CASCADE;
DROP VIEW IF EXISTS system.v_connection_stats CASCADE;
DROP VIEW IF EXISTS api_v1.system_dashboard CASCADE;
DROP FUNCTION IF EXISTS system.estimate_count(TEXT) CASCADE;

-- Drop GIN indexes
DROP INDEX IF EXISTS idx_feature_flags_rules_gin;
DROP INDEX IF EXISTS idx_import_errors_gin;
DROP INDEX IF EXISTS idx_notifications_data_gin;
DROP INDEX IF EXISTS idx_event_store_metadata_gin;
DROP INDEX IF EXISTS idx_event_store_data_gin;
DROP INDEX IF EXISTS idx_athletes_metadata_gin;
DROP INDEX IF EXISTS idx_tournaments_config_gin;

COMMIT;
