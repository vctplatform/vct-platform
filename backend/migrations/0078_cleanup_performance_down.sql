-- Rollback 0078: Cleanup + Performance
BEGIN;
DROP VIEW IF EXISTS system.v_trigger_status CASCADE;
DROP FUNCTION IF EXISTS system.sync_after_live_scoring CASCADE;
DROP FUNCTION IF EXISTS system.disable_live_scoring CASCADE;
DROP FUNCTION IF EXISTS system.enable_live_scoring CASCADE;
-- Restore entity_records from archive
CREATE TABLE IF NOT EXISTS entity_records AS
  SELECT * FROM system._entity_records_archive;
DROP TABLE IF EXISTS system._entity_records_archive CASCADE;
COMMIT;
