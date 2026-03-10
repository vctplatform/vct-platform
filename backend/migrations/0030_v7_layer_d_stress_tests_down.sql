-- ===============================================================
-- VCT Platform — Migration 0030 DOWN: V7.0 LAYER D ROLLBACK
-- ===============================================================

BEGIN;

DROP TABLE IF EXISTS system.storage_provider_mappings CASCADE;
DROP TABLE IF EXISTS core.auth_provider_mappings CASCADE;
DROP TABLE IF EXISTS tournament.athlete_daily_loads CASCADE;
DROP TABLE IF EXISTS tournament.match_bouts CASCADE;
DROP TABLE IF EXISTS tournament.team_entries CASCADE;
DROP TABLE IF EXISTS platform.sport_profiles CASCADE;
DROP TABLE IF EXISTS core.federation_merges CASCADE;

COMMIT;
