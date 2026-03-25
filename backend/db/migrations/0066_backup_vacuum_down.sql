-- Rollback 0066: Backup/Vacuum
BEGIN;
DROP VIEW IF EXISTS system.v_bloat_alerts CASCADE;
DROP VIEW IF EXISTS system.v_vacuum_stats CASCADE;
DROP VIEW IF EXISTS system.v_recovery_points CASCADE;
DROP FUNCTION IF EXISTS system.create_checkpoint CASCADE;
DROP TABLE IF EXISTS system.backup_checkpoints CASCADE;
-- Reset autovacuum to defaults
DO $$ DECLARE tbl TEXT;
BEGIN FOR tbl IN SELECT unnest(ARRAY[
  'system.notification_queue','system.cdc_outbox','system.query_cache','system.job_queue',
  'athletes','combat_matches','registrations','platform.payments','platform.posts',
  'core.tenants','core.roles','ref_belt_ranks','ref_weight_classes','ref_sport_types'
]) LOOP
  BEGIN EXECUTE format('ALTER TABLE %s RESET (
    autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor,
    autovacuum_vacuum_threshold, autovacuum_vacuum_cost_delay
  )', tbl);
  EXCEPTION WHEN undefined_table THEN NULL; END;
END LOOP; END $$;
COMMIT;
