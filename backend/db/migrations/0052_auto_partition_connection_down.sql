-- Rollback 0052: Auto Partition + Connection
BEGIN;
DROP FUNCTION IF EXISTS system.create_future_partitions CASCADE;
DROP FUNCTION IF EXISTS system.connection_pool_advisory CASCADE;
DROP VIEW IF EXISTS system.v_connection_stats CASCADE;
DROP VIEW IF EXISTS system.v_partition_info CASCADE;
DELETE FROM system.scheduled_tasks WHERE name IN ('create_partitions','cleanup_partitions');
COMMIT;
