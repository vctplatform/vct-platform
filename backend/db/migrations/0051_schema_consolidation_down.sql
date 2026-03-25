-- Rollback 0051: Schema Consolidation
BEGIN;
DROP VIEW IF EXISTS api_v1.standings_unified CASCADE;
DROP VIEW IF EXISTS api_v1.results_unified CASCADE;
DROP VIEW IF EXISTS api_v1.registrations_unified CASCADE;
DELETE FROM system.schema_registry WHERE migration_ref IN ('0045','0048');
DROP TABLE IF EXISTS system.schema_registry CASCADE;
COMMIT;
