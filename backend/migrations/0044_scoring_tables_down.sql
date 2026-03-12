-- ════════════════════════════════════════════════════════════════
-- Migration 0044 DOWN: Drop Scoring tables
-- ════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS scoring_judge_scores;
DROP TABLE IF EXISTS scoring_match_events;
