-- ===============================================================
-- VCT Platform — Migration 0004 DOWN: Enterprise Foundation
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS core.auth_audit_log CASCADE;
DROP TABLE IF EXISTS core.sessions CASCADE;
DROP TABLE IF EXISTS core.user_roles CASCADE;
DROP TABLE IF EXISTS core.roles CASCADE;
DROP TABLE IF EXISTS core.users CASCADE;
DROP TABLE IF EXISTS core.tenants CASCADE;

DROP FUNCTION IF EXISTS trigger_set_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS trigger_prevent_hard_delete() CASCADE;
DROP FUNCTION IF EXISTS uuidv7() CASCADE;

DROP SCHEMA IF EXISTS api_v1 CASCADE;
DROP SCHEMA IF EXISTS system CASCADE;
DROP SCHEMA IF EXISTS platform CASCADE;
DROP SCHEMA IF EXISTS training CASCADE;
DROP SCHEMA IF EXISTS people CASCADE;
DROP SCHEMA IF EXISTS tournament CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;

COMMIT;
