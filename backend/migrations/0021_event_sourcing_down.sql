-- ===============================================================
-- VCT Platform — Migration 0021 DOWN
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS tournament.event_snapshots CASCADE;
DROP FUNCTION IF EXISTS platform.get_lineage_tree(UUID, VARCHAR, INT) CASCADE;
DROP FUNCTION IF EXISTS tournament.generate_bracket(UUID, VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP TABLE IF EXISTS tournament.match_scores CASCADE;
DROP FUNCTION IF EXISTS tournament.append_event(UUID, TEXT, UUID, TEXT, JSONB, JSONB, BIGINT) CASCADE;
DROP TABLE IF EXISTS tournament.event_store CASCADE;

COMMIT;
