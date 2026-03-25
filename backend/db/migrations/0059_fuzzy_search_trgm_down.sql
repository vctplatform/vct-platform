-- Rollback 0059: Fuzzy Search (pg_trgm)
BEGIN;
DROP VIEW IF EXISTS system.v_popular_searches CASCADE;
DROP TABLE IF EXISTS system.search_log CASCADE;
DROP FUNCTION IF EXISTS system.search_suggest CASCADE;
DROP FUNCTION IF EXISTS system.search_fuzzy CASCADE;
DROP INDEX IF EXISTS idx_athletes_name_trgm;
DROP INDEX IF EXISTS idx_coaches_name_trgm;
DROP INDEX IF EXISTS idx_clubs_name_trgm;
DROP INDEX IF EXISTS idx_schools_name_trgm;
DROP INDEX IF EXISTS idx_tournaments_name_trgm;
DROP INDEX IF EXISTS idx_techniques_name_trgm;
DROP INDEX IF EXISTS idx_glossary_term_trgm;
DROP INDEX IF EXISTS idx_teams_name_trgm;
DROP INDEX IF EXISTS idx_posts_title_trgm;
-- Keep pg_trgm extension (might be used elsewhere)
COMMIT;
