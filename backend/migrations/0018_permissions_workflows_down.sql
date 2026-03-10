-- ===============================================================
-- VCT Platform — Migration 0018 DOWN
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS system.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS system.webhooks CASCADE;
DROP TABLE IF EXISTS system.notification_templates CASCADE;
DROP TABLE IF EXISTS core.approval_actions CASCADE;
DROP TABLE IF EXISTS core.approval_requests CASCADE;
DROP TABLE IF EXISTS core.approval_workflows CASCADE;
DROP FUNCTION IF EXISTS core.has_permission(UUID, TEXT, TEXT, UUID) CASCADE;
DROP TABLE IF EXISTS core.role_permissions CASCADE;
DROP TABLE IF EXISTS core.permissions CASCADE;

COMMIT;
