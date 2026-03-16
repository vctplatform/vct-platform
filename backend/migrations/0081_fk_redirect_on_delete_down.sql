-- Rollback 0081: FK Redirect + ON DELETE
BEGIN;
-- Remove new FKs (they will be recreated by original migrations if re-run)
DO $$ DECLARE fk RECORD;
BEGIN
  FOR fk IN SELECT conname, conrelid::regclass AS tbl
    FROM pg_constraint
    WHERE conname IN (
      'referees_user_id_fkey','delegates_delegate_user_id_fkey',
      'medical_records_user_id_fkey','appeals_user_id_fkey',
      'match_events_recorded_by_fkey','notifications_user_id_fkey',
      'incidents_reported_by_fkey','media_uploaded_by_fkey',
      'audit_log_changed_by_fkey',
      'combat_matches_tournament_id_fkey',
      'registrations_tournament_id_fkey',
      'judge_scores_referee_id_fkey','results_athlete_id_fkey'
    )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', fk.tbl, fk.conname);
  END LOOP;
END $$;
COMMIT;
