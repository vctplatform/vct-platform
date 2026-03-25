-- ===============================================================
-- VCT Platform — Migration 0005 DOWN
-- ===============================================================
BEGIN;

-- Drop RLS policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'teams', 'athletes', 'registrations', 'referees',
    'arenas', 'combat_matches', 'form_performances', 'appeals',
    'match_events', 'rankings', 'federations', 'clubs'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- Note: Added columns are NOT dropped to prevent data loss.

COMMIT;
