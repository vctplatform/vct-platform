-- ===============================================================
-- VCT Platform — Migration 0025 DOWN
-- ===============================================================
BEGIN;

DELETE FROM system.scheduled_tasks
WHERE task_name IN ('maintain_partitions', 'execute_retention', 'cleanup_sessions');

DROP FUNCTION IF EXISTS core.cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS system.lock_rows_in_order(TEXT, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS system.refresh_all_matviews() CASCADE;
DROP FUNCTION IF EXISTS system.execute_retention_policies(BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS system.maintain_partitions() CASCADE;
DROP TYPE IF EXISTS api_v1.pagination_info CASCADE;

COMMIT;
