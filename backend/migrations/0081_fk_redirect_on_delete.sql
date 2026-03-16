-- ===============================================================
-- VCT Platform — Migration 0081: FK REDIRECT + ON DELETE POLICIES
-- P1 High: Redirect REFERENCES users(id) → core.users(id)
-- Add missing ON DELETE clauses
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. RE-POINT FKs: public.users → core.users
--    After 0074, public.users is a VIEW, FKs don't enforce
-- ════════════════════════════════════════════════════════

-- sessions (0002) → already handled by 0074 drop
-- auth_audit_log (0002) → already handled by 0074 drop

-- referees.user_id
DO $$ BEGIN
  ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_user_id_fkey;
  ALTER TABLE referees
    ADD CONSTRAINT referees_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- delegates.delegate_user_id
DO $$ BEGIN
  ALTER TABLE delegates DROP CONSTRAINT IF EXISTS delegates_delegate_user_id_fkey;
  ALTER TABLE delegates
    ADD CONSTRAINT delegates_delegate_user_id_fkey
    FOREIGN KEY (delegate_user_id) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- medical_records.user_id
DO $$ BEGIN
  ALTER TABLE medical_records DROP CONSTRAINT IF EXISTS medical_records_user_id_fkey;
  ALTER TABLE medical_records
    ADD CONSTRAINT medical_records_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- appeals.user_id
DO $$ BEGIN
  ALTER TABLE appeals DROP CONSTRAINT IF EXISTS appeals_user_id_fkey;
  ALTER TABLE appeals
    ADD CONSTRAINT appeals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- match_events.recorded_by
DO $$ BEGIN
  ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_recorded_by_fkey;
  ALTER TABLE match_events
    ADD CONSTRAINT match_events_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- notifications.user_id
DO $$ BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
  ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- incidents.reported_by
DO $$ BEGIN
  ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_reported_by_fkey;
  ALTER TABLE incidents
    ADD CONSTRAINT incidents_reported_by_fkey
    FOREIGN KEY (reported_by) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- media.uploaded_by
DO $$ BEGIN
  ALTER TABLE media DROP CONSTRAINT IF EXISTS media_uploaded_by_fkey;
  ALTER TABLE media
    ADD CONSTRAINT media_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- audit_log.changed_by
DO $$ BEGIN
  ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_changed_by_fkey;
  ALTER TABLE audit_log
    ADD CONSTRAINT audit_log_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES core.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. ADD ON DELETE POLICIES FOR TOURNAMENT FKs
-- ════════════════════════════════════════════════════════

-- combat_matches → tournaments
DO $$ BEGIN
  ALTER TABLE combat_matches DROP CONSTRAINT IF EXISTS combat_matches_tournament_id_fkey;
  ALTER TABLE combat_matches
    ADD CONSTRAINT combat_matches_tournament_id_fkey
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- registrations → tournaments
DO $$ BEGIN
  ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_tournament_id_fkey;
  ALTER TABLE registrations
    ADD CONSTRAINT registrations_tournament_id_fkey
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- judge_scores → referees (ON DELETE SET NULL — keep scores even if referee removed)
DO $$ BEGIN
  ALTER TABLE judge_scores DROP CONSTRAINT IF EXISTS judge_scores_referee_id_fkey;
  ALTER TABLE judge_scores
    ADD CONSTRAINT judge_scores_referee_id_fkey
    FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- results → athletes (SET NULL — keep result even if athlete removed)
DO $$ BEGIN
  ALTER TABLE results DROP CONSTRAINT IF EXISTS results_athlete_id_fkey;
  ALTER TABLE results
    ADD CONSTRAINT results_athlete_id_fkey
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

COMMIT;
