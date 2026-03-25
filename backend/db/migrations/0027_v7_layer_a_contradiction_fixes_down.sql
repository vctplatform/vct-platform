-- ===============================================================
-- VCT Platform — Migration 0027 DOWN: V7.0 LAYER A ROLLBACK
-- ===============================================================

BEGIN;

DROP TABLE IF EXISTS system.cross_aggregate_references CASCADE;
DROP TABLE IF EXISTS system.config_changelog CASCADE;
DROP TABLE IF EXISTS system.view_contracts CASCADE;
DROP TABLE IF EXISTS system.sync_conflicts CASCADE;
DROP TABLE IF EXISTS system.conflict_resolution_rules CASCADE;
DROP TABLE IF EXISTS core.erasure_tombstones CASCADE;
DROP TABLE IF EXISTS core.athlete_data_keys CASCADE;

COMMIT;
