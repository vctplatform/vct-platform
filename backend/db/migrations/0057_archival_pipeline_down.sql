-- Rollback 0057: Archival Pipeline
BEGIN;
DROP FUNCTION IF EXISTS system.archive_old_data CASCADE;
DROP FUNCTION IF EXISTS system.restore_archived_data CASCADE;
DROP TABLE IF EXISTS system.archive_log CASCADE;
DROP TABLE IF EXISTS system.archival_config CASCADE;
DELETE FROM system.scheduled_tasks WHERE name LIKE 'archive_%';
COMMIT;
