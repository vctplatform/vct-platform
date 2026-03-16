-- ===============================================================
-- VCT Platform — Migration 0078: CLEANUP + PERFORMANCE GUARDS
-- P2 Medium: Drop orphan tables, add live scoring trigger control
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. DROP ORPHAN: entity_records (legacy EAV from 0001)
--    Replaced entirely by relational schema in 0002+
-- ════════════════════════════════════════════════════════

-- Backup any remaining data (if any) before drop
CREATE TABLE IF NOT EXISTS system._entity_records_archive AS
  SELECT * FROM entity_records WHERE false;  -- empty clone

INSERT INTO system._entity_records_archive
  SELECT * FROM entity_records
  ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS entity_records CASCADE;

-- ════════════════════════════════════════════════════════
-- 2. ADD unaccent EXTENSION (missing from 0063)
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ════════════════════════════════════════════════════════
-- 3. PERFORMANCE GUARDS: Live Scoring Mode
--    Disable non-critical triggers during real-time matches
--    to reduce per-row overhead for combat_matches table
-- ════════════════════════════════════════════════════════

-- Enable live scoring mode (disables CDC + temporal triggers)
CREATE OR REPLACE FUNCTION system.enable_live_scoring()
RETURNS VOID AS $$
BEGIN
  -- Disable heavy triggers on combat_matches
  EXECUTE 'ALTER TABLE combat_matches DISABLE TRIGGER cdc_capture';
  EXECUTE 'ALTER TABLE combat_matches DISABLE TRIGGER temporal_version';

  -- Keep updated_at trigger active (lightweight)
  SET LOCAL app.live_scoring_mode = 'true';

  RAISE NOTICE 'Live scoring mode ENABLED: CDC + temporal triggers disabled for combat_matches';
END;
$$ LANGUAGE plpgsql;

-- Disable live scoring mode (re-enable all triggers)
CREATE OR REPLACE FUNCTION system.disable_live_scoring()
RETURNS VOID AS $$
BEGIN
  EXECUTE 'ALTER TABLE combat_matches ENABLE TRIGGER cdc_capture';
  EXECUTE 'ALTER TABLE combat_matches ENABLE TRIGGER temporal_version';

  SET LOCAL app.live_scoring_mode = 'false';

  RAISE NOTICE 'Live scoring mode DISABLED: All triggers re-enabled for combat_matches';
END;
$$ LANGUAGE plpgsql;

-- Batch sync: After live scoring, sync all changes to CDC + temporal
CREATE OR REPLACE FUNCTION system.sync_after_live_scoring(
  p_match_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  action TEXT,
  affected_rows INT
) AS $$
DECLARE
  v_count INT;
BEGIN
  -- Re-capture all modified matches to CDC outbox
  IF p_match_ids IS NOT NULL THEN
    INSERT INTO system.cdc_outbox (
      table_name, record_id, operation, payload, created_at
    )
    SELECT
      'combat_matches', cm.id, 'UPDATE',
      to_jsonb(cm), NOW()
    FROM combat_matches cm
    WHERE cm.id = ANY(p_match_ids);
  ELSE
    -- All matches updated in last hour
    INSERT INTO system.cdc_outbox (
      table_name, record_id, operation, payload, created_at
    )
    SELECT
      'combat_matches', cm.id, 'UPDATE',
      to_jsonb(cm), NOW()
    FROM combat_matches cm
    WHERE cm.updated_at > NOW() - INTERVAL '1 hour';
  END IF;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  action := 'cdc_sync';
  affected_rows := v_count;
  RETURN NEXT;

  -- Sync temporal history
  -- (Manual snapshot since triggers were disabled)
  IF p_match_ids IS NOT NULL THEN
    INSERT INTO temporal.combat_matches_history
    SELECT cm.*, NOW(), 'infinity'::TIMESTAMPTZ, NULL, 'UPDATE'
    FROM combat_matches cm
    WHERE cm.id = ANY(p_match_ids)
    ON CONFLICT DO NOTHING;
  END IF;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  action := 'temporal_sync';
  affected_rows := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. MONITORING: Live scoring status
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_trigger_status CASCADE;
CREATE VIEW system.v_trigger_status AS
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE WHEN tgenabled = 'O' THEN 'enabled'
       WHEN tgenabled = 'D' THEN 'disabled'
       WHEN tgenabled = 'R' THEN 'replica_only'
       WHEN tgenabled = 'A' THEN 'always'
  END AS status,
  tgtype
FROM pg_trigger
WHERE tgrelid::regclass::TEXT IN (
  'combat_matches', 'athletes', 'tournaments'
)
AND NOT tgisinternal
ORDER BY tgrelid::regclass, tgname;

COMMIT;
