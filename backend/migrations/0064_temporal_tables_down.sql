-- Rollback 0064: Temporal Tables
BEGIN;
DROP TRIGGER IF EXISTS temporal_version ON athletes;
DROP TRIGGER IF EXISTS temporal_version ON tournaments;
DROP TRIGGER IF EXISTS temporal_version ON combat_matches;
DROP FUNCTION IF EXISTS temporal.cleanup_old_history CASCADE;
DROP FUNCTION IF EXISTS temporal.version_diff CASCADE;
DROP FUNCTION IF EXISTS temporal.version_history CASCADE;
DROP FUNCTION IF EXISTS temporal.as_of CASCADE;
DROP FUNCTION IF EXISTS trigger_temporal_versioning CASCADE;
DROP TABLE IF EXISTS temporal.combat_matches_history CASCADE;
DROP TABLE IF EXISTS temporal.tournaments_history CASCADE;
DROP TABLE IF EXISTS temporal.athletes_history CASCADE;
COMMIT;
