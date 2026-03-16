-- ===============================================================
-- VCT Platform — Migration 0060: ELO/GLICKO RATING SYSTEM
-- P0 Critical: Automated athlete ratings, history, leaderboards
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ATHLETE RATINGS TABLE
--    Stores current ELO rating per athlete per weight class
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.athlete_ratings (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  athlete_id      UUID NOT NULL,
  -- Rating dimensions
  category        VARCHAR(50) NOT NULL DEFAULT 'doi_khang',
    -- 'doi_khang' (combat), 'quyen' (forms)
  weight_class    VARCHAR(50),
  -- ELO values
  rating          NUMERIC(8,2) NOT NULL DEFAULT 1500.00,  -- Starting ELO
  rating_deviation NUMERIC(8,2) DEFAULT 350.00,           -- Glicko RD
  volatility      NUMERIC(8,6) DEFAULT 0.060000,          -- Glicko-2 σ
  -- Stats
  wins            INT DEFAULT 0,
  losses          INT DEFAULT 0,
  draws           INT DEFAULT 0,
  total_matches   INT DEFAULT 0,
  win_streak      INT DEFAULT 0,
  best_rating     NUMERIC(8,2) DEFAULT 1500.00,
  -- Decay tracking
  last_match_at   TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, athlete_id, category, weight_class)
);

CREATE INDEX IF NOT EXISTS idx_ratings_tenant_cat
  ON tournament.athlete_ratings(tenant_id, category, weight_class, rating DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_athlete
  ON tournament.athlete_ratings(athlete_id);

ALTER TABLE tournament.athlete_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tournament.athlete_ratings
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tournament.athlete_ratings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. RATING HISTORY (Bitemporal)
--    Track every rating change after each match
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.rating_history (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  athlete_id      UUID NOT NULL,
  category        VARCHAR(50) NOT NULL,
  weight_class    VARCHAR(50),
  -- Change details
  match_id        UUID,
  opponent_id     UUID,
  result          VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  -- Rating before/after
  rating_before   NUMERIC(8,2) NOT NULL,
  rating_after    NUMERIC(8,2) NOT NULL,
  rating_change   NUMERIC(8,2) GENERATED ALWAYS AS (rating_after - rating_before) STORED,
  rd_before       NUMERIC(8,2),
  rd_after        NUMERIC(8,2),
  -- Context
  tournament_id   UUID,
  tournament_name TEXT,
  opponent_rating NUMERIC(8,2),
  k_factor        NUMERIC(6,2),
  -- Timestamp
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recorded_at, tenant_id, id)
) PARTITION BY RANGE (recorded_at);

-- Yearly partitions
CREATE TABLE IF NOT EXISTS tournament.rating_history_2026
  PARTITION OF tournament.rating_history
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS tournament.rating_history_2027
  PARTITION OF tournament.rating_history
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE IF NOT EXISTS tournament.rating_history_default
  PARTITION OF tournament.rating_history DEFAULT;

CREATE INDEX IF NOT EXISTS idx_rating_hist_athlete
  ON tournament.rating_history(tenant_id, athlete_id, recorded_at DESC);

ALTER TABLE tournament.rating_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tournament.rating_history
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID));

-- ════════════════════════════════════════════════════════
-- 3. ELO CALCULATION FUNCTION
--    Standard ELO with dynamic K-factor
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION tournament.calculate_elo(
  p_tenant_id UUID,
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_is_draw BOOLEAN DEFAULT false,
  p_category VARCHAR DEFAULT 'doi_khang',
  p_weight_class VARCHAR DEFAULT NULL,
  p_tournament_id UUID DEFAULT NULL,
  p_tournament_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  athlete_id UUID,
  old_rating NUMERIC,
  new_rating NUMERIC,
  change NUMERIC
) AS $$
DECLARE
  v_winner tournament.athlete_ratings;
  v_loser tournament.athlete_ratings;
  v_k_winner NUMERIC;
  v_k_loser NUMERIC;
  v_expected_winner NUMERIC;
  v_expected_loser NUMERIC;
  v_score_winner NUMERIC;
  v_score_loser NUMERIC;
  v_new_winner NUMERIC;
  v_new_loser NUMERIC;
BEGIN
  -- Upsert winner rating
  INSERT INTO tournament.athlete_ratings (tenant_id, athlete_id, category, weight_class)
  VALUES (p_tenant_id, p_winner_id, p_category, p_weight_class)
  ON CONFLICT (tenant_id, athlete_id, category, weight_class) DO NOTHING;

  -- Upsert loser rating
  INSERT INTO tournament.athlete_ratings (tenant_id, athlete_id, category, weight_class)
  VALUES (p_tenant_id, p_loser_id, p_category, p_weight_class)
  ON CONFLICT (tenant_id, athlete_id, category, weight_class) DO NOTHING;

  -- Get current ratings
  SELECT * INTO v_winner FROM tournament.athlete_ratings
  WHERE tenant_id = p_tenant_id AND athlete_id = p_winner_id
    AND category = p_category
    AND weight_class IS NOT DISTINCT FROM p_weight_class;

  SELECT * INTO v_loser FROM tournament.athlete_ratings
  WHERE tenant_id = p_tenant_id AND athlete_id = p_loser_id
    AND category = p_category
    AND weight_class IS NOT DISTINCT FROM p_weight_class;

  -- Dynamic K-factor (higher for new players, lower for established)
  v_k_winner := CASE
    WHEN v_winner.total_matches < 10 THEN 40   -- Newbie
    WHEN v_winner.rating > 2400 THEN 10         -- Master
    ELSE 20                                      -- Standard
  END;
  v_k_loser := CASE
    WHEN v_loser.total_matches < 10 THEN 40
    WHEN v_loser.rating > 2400 THEN 10
    ELSE 20
  END;

  -- Expected scores
  v_expected_winner := 1.0 / (1.0 + power(10, (v_loser.rating - v_winner.rating) / 400.0));
  v_expected_loser := 1.0 - v_expected_winner;

  -- Actual scores
  IF p_is_draw THEN
    v_score_winner := 0.5;
    v_score_loser := 0.5;
  ELSE
    v_score_winner := 1.0;
    v_score_loser := 0.0;
  END IF;

  -- New ratings
  v_new_winner := v_winner.rating + v_k_winner * (v_score_winner - v_expected_winner);
  v_new_loser := GREATEST(v_loser.rating + v_k_loser * (v_score_loser - v_expected_loser), 100);

  -- Update winner
  UPDATE tournament.athlete_ratings SET
    rating = v_new_winner,
    wins = wins + CASE WHEN NOT p_is_draw THEN 1 ELSE 0 END,
    draws = draws + CASE WHEN p_is_draw THEN 1 ELSE 0 END,
    total_matches = total_matches + 1,
    win_streak = CASE WHEN NOT p_is_draw THEN win_streak + 1 ELSE 0 END,
    best_rating = GREATEST(best_rating, v_new_winner),
    last_match_at = NOW(),
    is_active = true
  WHERE id = v_winner.id;

  -- Update loser
  UPDATE tournament.athlete_ratings SET
    rating = v_new_loser,
    losses = losses + CASE WHEN NOT p_is_draw THEN 1 ELSE 0 END,
    draws = draws + CASE WHEN p_is_draw THEN 1 ELSE 0 END,
    total_matches = total_matches + 1,
    win_streak = CASE WHEN p_is_draw THEN 0 ELSE 0 END,
    last_match_at = NOW(),
    is_active = true
  WHERE id = v_loser.id;

  -- Record history
  INSERT INTO tournament.rating_history
    (tenant_id, athlete_id, category, weight_class, match_id,
     opponent_id, result, rating_before, rating_after,
     rd_before, rd_after, tournament_id, tournament_name,
     opponent_rating, k_factor)
  VALUES
    (p_tenant_id, p_winner_id, p_category, p_weight_class, p_match_id,
     p_loser_id, CASE WHEN p_is_draw THEN 'draw' ELSE 'win' END,
     v_winner.rating, v_new_winner,
     v_winner.rating_deviation, v_winner.rating_deviation,
     p_tournament_id, p_tournament_name,
     v_loser.rating, v_k_winner),
    (p_tenant_id, p_loser_id, p_category, p_weight_class, p_match_id,
     p_winner_id, CASE WHEN p_is_draw THEN 'draw' ELSE 'loss' END,
     v_loser.rating, v_new_loser,
     v_loser.rating_deviation, v_loser.rating_deviation,
     p_tournament_id, p_tournament_name,
     v_winner.rating, v_k_loser);

  -- Return results
  athlete_id := p_winner_id; old_rating := v_winner.rating;
  new_rating := v_new_winner; change := v_new_winner - v_winner.rating;
  RETURN NEXT;

  athlete_id := p_loser_id; old_rating := v_loser.rating;
  new_rating := v_new_loser; change := v_new_loser - v_loser.rating;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. RATING DECAY FUNCTION
--    Reduce RD for athletes inactive > 6 months
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION tournament.apply_rating_decay()
RETURNS TABLE (athlete_id UUID, old_rd NUMERIC, new_rd NUMERIC) AS $$
BEGIN
  RETURN QUERY
  UPDATE tournament.athlete_ratings SET
    rating_deviation = LEAST(rating_deviation + 15, 350),
    is_active = CASE WHEN last_match_at < NOW() - INTERVAL '12 months' THEN false ELSE true END,
    updated_at = NOW()
  WHERE last_match_at < NOW() - INTERVAL '6 months'
    AND rating_deviation < 350
  RETURNING
    tournament.athlete_ratings.athlete_id,
    rating_deviation - 15 AS old_rd,
    rating_deviation AS new_rd;
END;
$$ LANGUAGE plpgsql;

-- Register decay as scheduled task
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description)
VALUES ('rating_decay', '0 0 1 * *', 'rating_manager',
        'Apply RD increase for inactive athletes monthly')
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 5. LEADERBOARD MATERIALIZED VIEW
-- ════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS api_v1.leaderboard AS
SELECT
  ar.tenant_id,
  ar.athlete_id,
  a.ho_ten AS athlete_name,
  ar.category,
  ar.weight_class,
  ar.rating,
  ar.rating_deviation,
  ar.wins,
  ar.losses,
  ar.draws,
  ar.total_matches,
  ar.win_streak,
  ar.best_rating,
  ar.last_match_at,
  ar.is_active,
  RANK() OVER (
    PARTITION BY ar.tenant_id, ar.category, ar.weight_class
    ORDER BY ar.rating DESC
  ) AS rank_position
FROM tournament.athlete_ratings ar
JOIN athletes a ON a.id = ar.athlete_id
WHERE ar.is_active = true
  AND ar.total_matches >= 3
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_unique
  ON api_v1.leaderboard(tenant_id, athlete_id, category, weight_class);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON api_v1.leaderboard(tenant_id, category, weight_class, rank_position);

-- Leaderboard refresh scheduled task
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description)
VALUES ('refresh_leaderboard', '*/15 * * * *', 'matview_refresh',
        'Refresh leaderboard every 15 minutes')
ON CONFLICT (name) DO NOTHING;

COMMIT;
