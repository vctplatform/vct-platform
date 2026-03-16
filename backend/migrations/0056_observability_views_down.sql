-- Rollback 0056: Observability Views
BEGIN;
DROP VIEW IF EXISTS system.v_table_bloat CASCADE;
DROP VIEW IF EXISTS system.v_slow_queries CASCADE;
DROP VIEW IF EXISTS system.v_index_usage CASCADE;
DROP VIEW IF EXISTS system.v_table_stats CASCADE;
DROP VIEW IF EXISTS system.v_database_health CASCADE;
DROP VIEW IF EXISTS system.v_active_connections CASCADE;
DROP VIEW IF EXISTS system.v_lock_conflicts CASCADE;
DROP FUNCTION IF EXISTS system.health_check CASCADE;
COMMIT;
