-- Rollback 0061: Query Cache Layer
BEGIN;
DROP VIEW IF EXISTS system.v_cache_stats CASCADE;
DROP FUNCTION IF EXISTS system.cache_cleanup CASCADE;
DROP FUNCTION IF EXISTS trigger_cache_invalidate CASCADE;
DROP FUNCTION IF EXISTS system.cache_invalidate_table CASCADE;
DROP FUNCTION IF EXISTS system.cache_invalidate_group CASCADE;
DROP FUNCTION IF EXISTS system.cache_invalidate_key CASCADE;
DROP FUNCTION IF EXISTS system.cache_set CASCADE;
DROP FUNCTION IF EXISTS system.cache_get CASCADE;
DROP TABLE IF EXISTS system.cache_config CASCADE;
DROP TABLE IF EXISTS system.query_cache CASCADE;
DELETE FROM system.scheduled_tasks WHERE name = 'cache_cleanup';
COMMIT;
