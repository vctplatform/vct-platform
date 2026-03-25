-- Rollback 0082: Complete RLS Coverage
BEGIN;
DROP VIEW IF EXISTS system.v_rls_coverage CASCADE;
DO $$ DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members','btc_weigh_ins','btc_draws','btc_assignments',
    'btc_team_results','btc_content_results','btc_finance',
    'btc_meetings','btc_protests',
    'tournament_categories','tournament_registrations',
    'tournament_registration_athletes','tournament_schedule_slots',
    'tournament_arena_assignments','tournament_results',
    'tournament_team_standings',
    'parent_links','parent_consents','parent_attendance','parent_results',
    'training_sessions','judge_scores','match_events','results','medals_summary'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS strict_tenant_%s ON %I', replace(tbl,'.','_'), tbl);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
COMMIT;
