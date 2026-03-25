-- ════════════════════════════════════════════════════════════════
-- Migration 0043 DOWN: Drop Athlete Profile tables
-- ════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS athlete_tournament_entries;
DROP TABLE IF EXISTS athlete_memberships;
DROP TABLE IF EXISTS athlete_profiles;
