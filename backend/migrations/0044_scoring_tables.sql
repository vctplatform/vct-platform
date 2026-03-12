-- ════════════════════════════════════════════════════════════════
-- Migration 0044: Scoring — Match Events & Judge Scores
-- Supports the scoring.ScoringRepository (event sourcing pattern)
-- ════════════════════════════════════════════════════════════════

-- Match events (event sourcing — append-only)
CREATE TABLE IF NOT EXISTS scoring_match_events (
    id              TEXT PRIMARY KEY,
    match_id        TEXT NOT NULL,
    match_type      TEXT NOT NULL DEFAULT 'combat',  -- combat, forms
    event_type      TEXT NOT NULL,
    event_data      JSONB NOT NULL DEFAULT '{}',
    sequence_number BIGINT NOT NULL,
    round_number    INT NOT NULL DEFAULT 0,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by     TEXT NOT NULL DEFAULT '',
    device_id       TEXT NOT NULL DEFAULT '',
    sync_status     TEXT NOT NULL DEFAULT 'synced'
);

CREATE INDEX IF NOT EXISTS idx_scoring_events_match ON scoring_match_events (match_id, sequence_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_events_unique ON scoring_match_events (match_id, sequence_number);

-- Judge scores (for forms/quyền thuật scoring)
CREATE TABLE IF NOT EXISTS scoring_judge_scores (
    id           TEXT PRIMARY KEY,
    match_id     TEXT NOT NULL,
    referee_id   TEXT NOT NULL,
    athlete_id   TEXT NOT NULL,
    score        NUMERIC(5,2) NOT NULL DEFAULT 0,
    penalties    NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_final     BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoring_judges_match ON scoring_judge_scores (match_id);
