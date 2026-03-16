-- Rollback 0054: Matview Refresh Strategy
BEGIN;
DROP FUNCTION IF EXISTS system.refresh_matview_smart CASCADE;
DROP FUNCTION IF EXISTS system.refresh_all_matviews CASCADE;
DROP TABLE IF EXISTS system.matview_refresh_log CASCADE;
DROP VIEW IF EXISTS system.v_matview_freshness CASCADE;
DELETE FROM system.scheduled_tasks WHERE name LIKE 'refresh_matview%';
COMMIT;
