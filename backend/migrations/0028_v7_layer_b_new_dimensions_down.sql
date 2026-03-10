-- ===============================================================
-- VCT Platform — Migration 0028 DOWN: V7.0 LAYER B ROLLBACK
-- ===============================================================

BEGIN;

DROP TABLE IF EXISTS system.notification_templates CASCADE;
DROP TABLE IF EXISTS system.notification_deliveries CASCADE;
DROP TABLE IF EXISTS system.notification_preferences CASCADE;
DROP TABLE IF EXISTS system.access_audit_log CASCADE;
DROP TABLE IF EXISTS system.data_quality_scores CASCADE;
DROP TABLE IF EXISTS system.data_quality_results CASCADE;
DROP TABLE IF EXISTS system.data_quality_rules CASCADE;
DROP TABLE IF EXISTS platform.federation_locales CASCADE;
DROP TABLE IF EXISTS platform.translations CASCADE;
DROP TABLE IF EXISTS core.digital_signatures CASCADE;
DROP TABLE IF EXISTS core.signing_keys CASCADE;
DROP TABLE IF EXISTS core.authorization_rules CASCADE;
DROP TABLE IF EXISTS core.authorization_tuples CASCADE;
DROP TABLE IF EXISTS tournament.event_schemas CASCADE;

COMMIT;
