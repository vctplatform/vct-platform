-- Rollback 0055: Audit System Upgrade
BEGIN;
DROP VIEW IF EXISTS system.v_audit_summary CASCADE;
DROP FUNCTION IF EXISTS system.audit_report CASCADE;
DROP TABLE IF EXISTS system.audit_retention_config CASCADE;
DROP FUNCTION IF EXISTS system.cleanup_audit_logs CASCADE;
DELETE FROM system.scheduled_tasks WHERE name LIKE 'audit_%';
COMMIT;
