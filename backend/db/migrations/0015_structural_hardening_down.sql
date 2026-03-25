-- ===============================================================
-- VCT Platform — Migration 0015 DOWN
-- ===============================================================
BEGIN;

-- Drop statistics targets (revert to defaults)
DO $$ BEGIN
  ALTER TABLE athletes ALTER COLUMN trang_thai SET STATISTICS -1;
  ALTER TABLE combat_matches ALTER COLUMN trang_thai SET STATISTICS -1;
  ALTER TABLE tournaments ALTER COLUMN status SET STATISTICS -1;
  ALTER TABLE platform.payments ALTER COLUMN status SET STATISTICS -1;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
END $$;

-- Drop status validation triggers
DROP TRIGGER IF EXISTS validate_payment_status ON platform.payments;
DROP TRIGGER IF EXISTS validate_match_status ON combat_matches;
DROP TRIGGER IF EXISTS validate_tournament_status ON tournaments;
DROP FUNCTION IF EXISTS trigger_validate_payment_status() CASCADE;
DROP FUNCTION IF EXISTS trigger_validate_match_status() CASCADE;
DROP FUNCTION IF EXISTS trigger_validate_tournament_status() CASCADE;

-- Drop LISTEN/NOTIFY triggers
DROP TRIGGER IF EXISTS notify_on_registration ON registrations;
DROP TRIGGER IF EXISTS notify_on_status_change ON combat_matches;
DROP TRIGGER IF EXISTS notify_on_event ON tournament.match_events;
DROP FUNCTION IF EXISTS notify_registration_change() CASCADE;
DROP FUNCTION IF EXISTS notify_match_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_match_event() CASCADE;

-- Drop immutable triggers
DROP TRIGGER IF EXISTS immutable_belt_result ON training.belt_exam_results;
DROP TRIGGER IF EXISTS immutable_match_status ON combat_matches;
DROP TRIGGER IF EXISTS immutable_payment_fields ON platform.payments;
DROP FUNCTION IF EXISTS trigger_immutable_belt_result() CASCADE;
DROP FUNCTION IF EXISTS trigger_immutable_match() CASCADE;
DROP FUNCTION IF EXISTS trigger_immutable_payment() CASCADE;

-- Drop RLS write policies (bulk)
DO $$
DECLARE tbl TEXT; pol TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'core.users', 'core.roles', 'tournaments', 'athletes',
    'teams', 'combat_matches', 'platform.payments',
    'platform.posts', 'training.curricula'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_write_%s ON %s',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_update_%s ON %s',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl);
      EXECUTE format('DROP POLICY IF EXISTS system_admin_write_%s ON %s',
        replace(replace(tbl, '.', '_'), ' ', ''), tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

COMMIT;
