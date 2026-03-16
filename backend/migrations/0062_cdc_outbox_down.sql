-- Rollback 0062: CDC Outbox
BEGIN;
DROP VIEW IF EXISTS system.v_cdc_lag CASCADE;
DROP VIEW IF EXISTS system.v_cdc_stats CASCADE;
DROP FUNCTION IF EXISTS system.cdc_fail_events CASCADE;
DROP FUNCTION IF EXISTS system.cdc_ack_events CASCADE;
DROP FUNCTION IF EXISTS system.cdc_pull_events CASCADE;
DROP FUNCTION IF EXISTS trigger_cdc_capture CASCADE;
-- Remove triggers from tables
DO $$ DECLARE tbl TEXT;
BEGIN FOR tbl IN SELECT unnest(ARRAY['athletes','tournaments','combat_matches','teams','clubs']) LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS cdc_capture ON %I', tbl);
END LOOP; END $$;
DROP TABLE IF EXISTS system.cdc_subscriptions CASCADE;
DROP TABLE IF EXISTS system.cdc_outbox CASCADE;
DELETE FROM system.scheduled_tasks WHERE name = 'cdc_cleanup';
COMMIT;
