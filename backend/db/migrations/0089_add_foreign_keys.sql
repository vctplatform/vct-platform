-- ═══════════════════════════════════════════════════════════════
-- Migration 0001: Add missing Foreign Key constraints
-- Phase 0 — Data Integrity Hardening
-- ═══════════════════════════════════════════════════════════════
-- Tables that already have FKs: age_groups, content_categories,
-- weight_classes, teams, athletes, registrations, referees, arenas
--
-- Tables MISSING FKs: referee_assignments, combat_matches,
-- form_performances, weigh_ins, schedule_entries, appeals,
-- notifications, medical_records, media_files, data_audit_log
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ── referee_assignments ──────────────────────────────────────
ALTER TABLE referee_assignments
  ADD CONSTRAINT fk_referee_assignments_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE referee_assignments
  ADD CONSTRAINT fk_referee_assignments_referee
    FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE;

ALTER TABLE referee_assignments
  ADD CONSTRAINT fk_referee_assignments_arena
    FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE SET NULL;

-- ── combat_matches ───────────────────────────────────────────
ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_content_category
    FOREIGN KEY (content_category_id) REFERENCES content_categories(id) ON DELETE SET NULL;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_weight_class
    FOREIGN KEY (weight_class_id) REFERENCES weight_classes(id) ON DELETE SET NULL;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_arena
    FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE SET NULL;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_athlete_red
    FOREIGN KEY (athlete_red_id) REFERENCES athletes(id) ON DELETE RESTRICT;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_athlete_blue
    FOREIGN KEY (athlete_blue_id) REFERENCES athletes(id) ON DELETE RESTRICT;

ALTER TABLE combat_matches
  ADD CONSTRAINT fk_combat_matches_winner
    FOREIGN KEY (nguoi_thang_id) REFERENCES athletes(id) ON DELETE SET NULL;

-- ── form_performances ────────────────────────────────────────
ALTER TABLE form_performances
  ADD CONSTRAINT fk_form_performances_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE form_performances
  ADD CONSTRAINT fk_form_performances_content_category
    FOREIGN KEY (content_category_id) REFERENCES content_categories(id) ON DELETE SET NULL;

ALTER TABLE form_performances
  ADD CONSTRAINT fk_form_performances_arena
    FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE SET NULL;

ALTER TABLE form_performances
  ADD CONSTRAINT fk_form_performances_athlete
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE RESTRICT;

-- ── weigh_ins ────────────────────────────────────────────────
ALTER TABLE weigh_ins
  ADD CONSTRAINT fk_weigh_ins_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE weigh_ins
  ADD CONSTRAINT fk_weigh_ins_athlete
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE weigh_ins
  ADD CONSTRAINT fk_weigh_ins_weight_class
    FOREIGN KEY (weight_class_id) REFERENCES weight_classes(id) ON DELETE SET NULL;

-- ── schedule_entries ─────────────────────────────────────────
ALTER TABLE schedule_entries
  ADD CONSTRAINT fk_schedule_entries_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE schedule_entries
  ADD CONSTRAINT fk_schedule_entries_arena
    FOREIGN KEY (arena_id) REFERENCES arenas(id) ON DELETE SET NULL;

ALTER TABLE schedule_entries
  ADD CONSTRAINT fk_schedule_entries_content_category
    FOREIGN KEY (content_category_id) REFERENCES content_categories(id) ON DELETE SET NULL;

-- ── appeals ──────────────────────────────────────────────────
ALTER TABLE appeals
  ADD CONSTRAINT fk_appeals_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE appeals
  ADD CONSTRAINT fk_appeals_team
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ── notifications ────────────────────────────────────────────
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;

-- ── medical_records ──────────────────────────────────────────
ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_athlete
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_match
    FOREIGN KEY (match_id) REFERENCES combat_matches(id) ON DELETE SET NULL;

ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_reported_by
    FOREIGN KEY (reported_by) REFERENCES core.users(id) ON DELETE SET NULL;

-- ── media_files ──────────────────────────────────────────────
ALTER TABLE media_files
  ADD CONSTRAINT fk_media_files_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

ALTER TABLE media_files
  ADD CONSTRAINT fk_media_files_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE media_files
  ADD CONSTRAINT fk_media_files_match
    FOREIGN KEY (match_id) REFERENCES combat_matches(id) ON DELETE SET NULL;

ALTER TABLE media_files
  ADD CONSTRAINT fk_media_files_athlete
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL;

-- ── registrations (missing content_category + weight_class) ──
ALTER TABLE registrations
  ADD CONSTRAINT fk_registrations_content_category
    FOREIGN KEY (content_category_id) REFERENCES content_categories(id) ON DELETE SET NULL;

ALTER TABLE registrations
  ADD CONSTRAINT fk_registrations_weight_class
    FOREIGN KEY (weight_class_id) REFERENCES weight_classes(id) ON DELETE SET NULL;

COMMIT;
