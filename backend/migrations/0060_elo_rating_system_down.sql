-- Rollback 0060: ELO Rating System
BEGIN;
DROP MATERIALIZED VIEW IF EXISTS api_v1.leaderboard CASCADE;
DROP FUNCTION IF EXISTS tournament.apply_rating_decay CASCADE;
DROP FUNCTION IF EXISTS tournament.calculate_elo CASCADE;
DROP TABLE IF EXISTS tournament.rating_history CASCADE;
DROP TABLE IF EXISTS tournament.athlete_ratings CASCADE;
DELETE FROM system.scheduled_tasks WHERE name IN ('rating_decay', 'refresh_leaderboard');
COMMIT;
