-- Rollback 0067: Search Path + Webhooks
BEGIN;
DROP VIEW IF EXISTS system.v_webhook_stats CASCADE;
DROP FUNCTION IF EXISTS system.process_webhook_queue CASCADE;
DROP FUNCTION IF EXISTS trigger_queue_webhook CASCADE;
DROP TABLE IF EXISTS system.webhook_events CASCADE;
DROP TABLE IF EXISTS system.db_webhooks CASCADE;
DROP TABLE IF EXISTS system.tenant_schema_config CASCADE;
DROP FUNCTION IF EXISTS system.set_search_path_for_role CASCADE;
DROP TABLE IF EXISTS system.schema_access_matrix CASCADE;
COMMIT;
