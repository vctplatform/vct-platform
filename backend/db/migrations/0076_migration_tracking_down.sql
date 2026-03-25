-- Rollback 0076: Migration Tracking
BEGIN;
DROP VIEW IF EXISTS system.v_migration_status CASCADE;
DROP FUNCTION IF EXISTS system.current_schema_version CASCADE;
DROP FUNCTION IF EXISTS system.migration_applied CASCADE;
DROP TABLE IF EXISTS system.schema_migrations CASCADE;
COMMIT;
