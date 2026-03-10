-- ===============================================================
-- VCT Platform — Migration 0023 DOWN
-- ===============================================================
BEGIN;

DROP VIEW IF EXISTS api_v1.live_matches CASCADE;
DROP TABLE IF EXISTS system.announcements CASCADE;
DROP FUNCTION IF EXISTS system.validate_jsonb_keys(JSONB, TEXT[]) CASCADE;
DO $$ BEGIN
  ALTER TABLE tournament.match_scores DROP CONSTRAINT IF EXISTS chk_round_scores_valid;
  ALTER TABLE tournament.event_store DROP CONSTRAINT IF EXISTS chk_event_data_object;
  ALTER TABLE system.webhooks DROP CONSTRAINT IF EXISTS chk_webhook_events_array;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP FUNCTION IF EXISTS system.is_circuit_open(TEXT) CASCADE;
DROP FUNCTION IF EXISTS system.circuit_breaker_record(TEXT, BOOLEAN) CASCADE;
DROP TABLE IF EXISTS system.circuit_breakers CASCADE;
DROP FUNCTION IF EXISTS system.is_feature_enabled(TEXT, UUID, UUID) CASCADE;
DROP TABLE IF EXISTS system.feature_flag_overrides CASCADE;
DROP TABLE IF EXISTS system.feature_flags CASCADE;

COMMIT;
