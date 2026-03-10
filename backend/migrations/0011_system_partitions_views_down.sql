-- ===============================================================
-- VCT Platform — Migration 0011 DOWN
-- ===============================================================
BEGIN;

-- Drop API Views
DROP VIEW IF EXISTS api_v1.feature_flags CASCADE;
DROP VIEW IF EXISTS api_v1.rankings CASCADE;
DROP VIEW IF EXISTS api_v1.matches CASCADE;
DROP VIEW IF EXISTS api_v1.martial_schools CASCADE;
DROP VIEW IF EXISTS api_v1.coaches CASCADE;
DROP VIEW IF EXISTS api_v1.tournaments CASCADE;
DROP VIEW IF EXISTS api_v1.athletes CASCADE;

-- Drop System Tables
DROP TABLE IF EXISTS system.schema_versions CASCADE;
DROP TABLE IF EXISTS system.data_audit_log CASCADE;
DROP TABLE IF EXISTS system.notification_queue CASCADE;
DROP TABLE IF EXISTS system.device_registry CASCADE;
DROP TABLE IF EXISTS system.feature_flags CASCADE;
DROP TABLE IF EXISTS system.sync_conflicts CASCADE;
DROP TABLE IF EXISTS system.sync_queue CASCADE;

COMMIT;
