-- Rollback 0068: Matviews + A/B Testing
BEGIN;
DROP VIEW IF EXISTS system.v_experiment_results CASCADE;
DROP TABLE IF EXISTS system.experiment_events_2026 CASCADE;
DROP TABLE IF EXISTS system.experiment_events_default CASCADE;
DROP TABLE IF EXISTS system.experiment_events CASCADE;
DROP FUNCTION IF EXISTS system.get_experiment_variant CASCADE;
DROP TABLE IF EXISTS system.experiment_assignments CASCADE;
DROP TABLE IF EXISTS system.experiments CASCADE;
DROP FUNCTION IF EXISTS system.cleanup_unused_matviews CASCADE;
DROP FUNCTION IF EXISTS system.lazy_matview_read CASCADE;
DROP TABLE IF EXISTS system.matview_registry CASCADE;
COMMIT;
