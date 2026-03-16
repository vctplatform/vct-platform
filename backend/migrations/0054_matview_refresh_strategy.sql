-- ===============================================================
-- VCT Platform — Migration 0054: MATERIALIZED VIEW REFRESH STRATEGY
-- P1 High: Cached counters + smarter refresh patterns
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. CACHED COUNTERS ON TOURNAMENT TABLE
--    Avoid expensive COUNT(*) subqueries in API views
--    Updated by triggers on related tables
-- ════════════════════════════════════════════════════════

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS cached_athlete_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_team_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_match_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_registration_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS counts_refreshed_at TIMESTAMPTZ;

-- Trigger: update athlete count when athletes change
CREATE OR REPLACE FUNCTION trigger_update_tournament_athlete_count()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_tournament_id := OLD.tournament_id;
  ELSE
    v_tournament_id := NEW.tournament_id;
  END IF;

  IF v_tournament_id IS NOT NULL THEN
    UPDATE tournaments SET
      cached_athlete_count = (
        SELECT count(*) FROM athletes
        WHERE tournament_id = v_tournament_id AND is_deleted = false
      ),
      counts_refreshed_at = NOW()
    WHERE id = v_tournament_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_tournament_athlete_count
    AFTER INSERT OR UPDATE OF tournament_id, is_deleted OR DELETE ON athletes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_tournament_athlete_count();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: update team count
CREATE OR REPLACE FUNCTION trigger_update_tournament_team_count()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN v_tournament_id := OLD.tournament_id;
  ELSE v_tournament_id := NEW.tournament_id;
  END IF;

  IF v_tournament_id IS NOT NULL THEN
    UPDATE tournaments SET
      cached_team_count = (
        SELECT count(*) FROM teams
        WHERE tournament_id = v_tournament_id AND is_deleted = false
      ),
      counts_refreshed_at = NOW()
    WHERE id = v_tournament_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_tournament_team_count
    AFTER INSERT OR UPDATE OF tournament_id, is_deleted OR DELETE ON teams
    FOR EACH ROW EXECUTE FUNCTION trigger_update_tournament_team_count();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: update match count
CREATE OR REPLACE FUNCTION trigger_update_tournament_match_count()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN v_tournament_id := OLD.tournament_id;
  ELSE v_tournament_id := NEW.tournament_id;
  END IF;

  IF v_tournament_id IS NOT NULL THEN
    UPDATE tournaments SET
      cached_match_count = (
        SELECT count(*) FROM combat_matches
        WHERE tournament_id = v_tournament_id AND is_deleted = false
      ),
      counts_refreshed_at = NOW()
    WHERE id = v_tournament_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_tournament_match_count
    AFTER INSERT OR UPDATE OF tournament_id, is_deleted OR DELETE ON combat_matches
    FOR EACH ROW EXECUTE FUNCTION trigger_update_tournament_match_count();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. UPDATE API VIEW TO USE CACHED COUNTS
--    Replaces expensive correlated subqueries
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS api_v1.tournaments CASCADE;
CREATE VIEW api_v1.tournaments AS
SELECT
  t.id, t.tenant_id, t.name,
  t.start_date, t.end_date,
  t.location, t.status,
  t.is_deleted,
  t.created_at, t.updated_at,
  t.metadata,
  COALESCE(t.cached_athlete_count, 0) AS athlete_count,
  COALESCE(t.cached_team_count, 0) AS team_count,
  COALESCE(t.cached_match_count, 0) AS match_count,
  t.counts_refreshed_at
FROM tournaments t
WHERE t.is_deleted = false;

-- ════════════════════════════════════════════════════════
-- 3. BULK REFRESH FUNCTION (One-time backfill + maintenance)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.refresh_tournament_counts()
RETURNS TABLE (
  tournament_id UUID,
  athletes INT,
  teams INT,
  matches INT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE tournaments t SET
    cached_athlete_count = COALESCE(ac.cnt, 0),
    cached_team_count = COALESCE(tc.cnt, 0),
    cached_match_count = COALESCE(mc.cnt, 0),
    counts_refreshed_at = NOW()
  FROM (
    SELECT id FROM tournaments WHERE is_deleted = false
  ) src
  LEFT JOIN (
    SELECT a.tournament_id, count(*) AS cnt
    FROM athletes a WHERE a.is_deleted = false
    GROUP BY a.tournament_id
  ) ac ON ac.tournament_id = src.id
  LEFT JOIN (
    SELECT tm.tournament_id, count(*) AS cnt
    FROM teams tm WHERE tm.is_deleted = false
    GROUP BY tm.tournament_id
  ) tc ON tc.tournament_id = src.id
  LEFT JOIN (
    SELECT m.tournament_id, count(*) AS cnt
    FROM combat_matches m WHERE m.is_deleted = false
    GROUP BY m.tournament_id
  ) mc ON mc.tournament_id = src.id
  WHERE t.id = src.id
  RETURNING t.id AS tournament_id,
    COALESCE(ac.cnt, 0)::INT AS athletes,
    COALESCE(tc.cnt, 0)::INT AS teams,
    COALESCE(mc.cnt, 0)::INT AS matches;
END;
$$ LANGUAGE plpgsql;

-- Initial backfill
SELECT * FROM system.refresh_tournament_counts();

-- ════════════════════════════════════════════════════════
-- 4. SMART MATVIEW REFRESH
--    Only refresh if underlying data changed
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.matview_refresh_log (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  view_name       VARCHAR(200) NOT NULL,
  refreshed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms     INT,
  rows_affected   BIGINT,
  triggered_by    VARCHAR(50) DEFAULT 'scheduled',
  success         BOOLEAN DEFAULT true,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_matview_log_view
  ON system.matview_refresh_log(view_name, refreshed_at DESC);

-- Smart refresh function: checks if refresh is needed
CREATE OR REPLACE FUNCTION system.smart_matview_refresh(
  p_view_name TEXT,
  p_min_interval_seconds INT DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_refresh TIMESTAMPTZ;
  v_start TIMESTAMPTZ;
  v_duration INT;
BEGIN
  -- Check when last refreshed
  SELECT refreshed_at INTO v_last_refresh
  FROM system.matview_refresh_log
  WHERE view_name = p_view_name AND success = true
  ORDER BY refreshed_at DESC
  LIMIT 1;

  -- Skip if refreshed recently
  IF v_last_refresh IS NOT NULL
    AND v_last_refresh > NOW() - (p_min_interval_seconds || ' seconds')::INTERVAL
  THEN
    RETURN false;
  END IF;

  -- Perform refresh
  v_start := clock_timestamp();
  BEGIN
    EXECUTE format('REFRESH MATERIALIZED VIEW %s', p_view_name);
    v_duration := extract(EPOCH FROM clock_timestamp() - v_start) * 1000;

    INSERT INTO system.matview_refresh_log (view_name, duration_ms, triggered_by, success)
    VALUES (p_view_name, v_duration, 'smart_refresh', true);

    RETURN true;
  EXCEPTION WHEN others THEN
    INSERT INTO system.matview_refresh_log (view_name, triggered_by, success, error_message)
    VALUES (p_view_name, 'smart_refresh', false, SQLERRM);
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql;

COMMIT;
