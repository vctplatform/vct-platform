-- ===============================================================
-- VCT Platform — Migration 0022 DOWN
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS core.user_activity_log CASCADE;
DROP VIEW IF EXISTS api_v1.athletes_public CASCADE;
DROP VIEW IF EXISTS api_v1.users_masked CASCADE;
DROP FUNCTION IF EXISTS core.export_user_data(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS core.execute_erasure(UUID, BOOLEAN) CASCADE;
DROP TABLE IF EXISTS core.erasure_requests CASCADE;
DROP TABLE IF EXISTS core.user_consents CASCADE;

COMMIT;
