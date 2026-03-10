-- ===============================================================
-- VCT Platform — Migration 0007 DOWN
-- ===============================================================
BEGIN;
DROP TABLE IF EXISTS people.athlete_weight_history CASCADE;
DROP TABLE IF EXISTS people.athlete_belt_history CASCADE;
DROP TABLE IF EXISTS people.certifications CASCADE;
DROP TABLE IF EXISTS people.coaches CASCADE;
DROP TABLE IF EXISTS people.club_memberships CASCADE;
DROP TABLE IF EXISTS people.club_branches CASCADE;
COMMIT;
