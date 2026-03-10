-- ===============================================================
-- VCT Platform — Migration 0020 DOWN
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS system.export_jobs CASCADE;
DROP TABLE IF EXISTS system.translations CASCADE;
DROP FUNCTION IF EXISTS system.get_config(TEXT, UUID) CASCADE;
DROP TRIGGER IF EXISTS track_config_changes ON system.configurations;
DROP FUNCTION IF EXISTS trigger_config_history() CASCADE;
DROP TABLE IF EXISTS system.configuration_history CASCADE;
DROP TABLE IF EXISTS system.configurations CASCADE;
DROP TABLE IF EXISTS system.import_rows CASCADE;
DROP TABLE IF EXISTS system.import_jobs CASCADE;

COMMIT;
