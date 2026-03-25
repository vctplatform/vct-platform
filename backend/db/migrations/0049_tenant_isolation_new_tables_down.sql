-- Rollback 0049: Tenant Isolation for New Tables
BEGIN;
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members','btc_weigh_ins','btc_draws','btc_assignments',
    'btc_team_results','btc_content_results','btc_finance',
    'btc_meetings','btc_protests',
    'tournament_categories','tournament_registrations',
    'tournament_registration_athletes','tournament_schedule_slots',
    'tournament_arena_assignments','tournament_results',
    'tournament_team_standings',
    'parent_links','parent_consents','parent_attendance',
    'parent_results','training_sessions'
  ]) LOOP
    BEGIN
      -- Drop RLS policies
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_write_%s ON %I', replace(tbl,'.','_'), tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_update_%s ON %I', replace(tbl,'.','_'), tbl);
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
      -- Drop indexes
      EXECUTE format('DROP INDEX IF EXISTS idx_%s_tenant', replace(tbl,'.','_'));
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
COMMIT;
