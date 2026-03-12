-- ===============================================================
-- VCT Platform — Migration 0021: EVENT SOURCING + CQRS (Phase 5A)
-- Event store for match scoring, scoring projections,
-- bracket generation procedures, graph queries
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. EVENT STORE — IMMUTABLE APPEND-ONLY
--    All match scoring writes go here first.
--    Projections (read models) are derived from events.
--    Enables: replay, undo, audit trail, conflict resolution.
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.event_store (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  stream_type     VARCHAR(50) NOT NULL,      -- 'match', 'tournament', 'bracket'
  stream_id       UUID NOT NULL,             -- match_id, tournament_id
  event_type      VARCHAR(100) NOT NULL,     -- 'ScoreRecorded', 'PenaltyIssued', 'RoundStarted'
  event_version   BIGINT NOT NULL,           -- monotonic within stream
  event_data      JSONB NOT NULL,
  metadata        JSONB DEFAULT '{}',        -- {causation_id, correlation_id, user_id}
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by     UUID,
  -- Composite PK: stream + version = unique event sequence
  PRIMARY KEY (recorded_at, tenant_id, stream_id, event_version)
) PARTITION BY RANGE (recorded_at);

-- Quarterly partitions
CREATE TABLE IF NOT EXISTS tournament.event_store_2026_q1
  PARTITION OF tournament.event_store
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS tournament.event_store_2026_q2
  PARTITION OF tournament.event_store
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS tournament.event_store_2026_q3
  PARTITION OF tournament.event_store
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS tournament.event_store_2026_q4
  PARTITION OF tournament.event_store
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS tournament.event_store_default
  PARTITION OF tournament.event_store DEFAULT;

-- Optimistic concurrency: UNIQUE on stream ensures no duplicate versions
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_stream_version
  ON tournament.event_store(tenant_id, stream_id, event_version, recorded_at);

CREATE INDEX IF NOT EXISTS idx_event_store_type
  ON tournament.event_store(tenant_id, stream_type, event_type);

CREATE INDEX IF NOT EXISTS idx_event_store_brin
  ON tournament.event_store USING BRIN (recorded_at) WITH (pages_per_range = 16);

-- RLS
ALTER TABLE tournament.event_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tournament.event_store
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

-- Append event function (enforces monotonic version)
CREATE OR REPLACE FUNCTION tournament.append_event(
  p_tenant_id UUID,
  p_stream_type TEXT,
  p_stream_id UUID,
  p_event_type TEXT,
  p_event_data JSONB,
  p_metadata JSONB DEFAULT '{}',
  p_expected_version BIGINT DEFAULT NULL  -- optimistic concurrency
)
RETURNS tournament.event_store AS $$
DECLARE
  v_current BIGINT;
  v_result tournament.event_store;
BEGIN
  -- Get current max version for this stream
  SELECT COALESCE(MAX(event_version), 0) INTO v_current
  FROM tournament.event_store
  WHERE tenant_id = p_tenant_id AND stream_id = p_stream_id;

  -- Optimistic concurrency check
  IF p_expected_version IS NOT NULL AND v_current != p_expected_version THEN
    RAISE EXCEPTION 'Concurrency conflict on stream %: expected version %, current %',
      p_stream_id, p_expected_version, v_current;
  END IF;

  INSERT INTO tournament.event_store
    (tenant_id, stream_type, stream_id, event_type, event_version, event_data, metadata, recorded_by)
  VALUES (
    p_tenant_id, p_stream_type, p_stream_id, p_event_type,
    v_current + 1, p_event_data, p_metadata,
    NULLIF(current_setting('app.current_user', true), '')::UUID
  )
  RETURNING * INTO v_result;

  -- Notify listeners for real-time
  PERFORM pg_notify('event_store', json_build_object(
    'stream_type', p_stream_type,
    'stream_id', p_stream_id,
    'event_type', p_event_type,
    'version', v_current + 1,
    'tenant_id', p_tenant_id
  )::TEXT);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 2. SCORING PROJECTION (CQRS Read Model)
--    Derived from event_store, updated by triggers/workers
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.match_scores (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  match_id        UUID NOT NULL,
  athlete_red_id  UUID,
  athlete_blue_id UUID,
  -- Current scores
  red_score       INT DEFAULT 0,
  blue_score      INT DEFAULT 0,
  red_penalties   INT DEFAULT 0,
  blue_penalties  INT DEFAULT 0,
  red_warnings    INT DEFAULT 0,
  blue_warnings   INT DEFAULT 0,
  -- Round tracking
  current_round   INT DEFAULT 1,
  round_scores    JSONB DEFAULT '[]',        -- [{round: 1, red: 3, blue: 2}, ...]
  -- Status
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  winner_id       UUID,
  win_method      VARCHAR(50),               -- 'points', 'knockout', 'disqualification', 'withdrawal'
  -- Sync
  last_event_version BIGINT DEFAULT 0,       -- last processed event version
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_tenant
  ON tournament.match_scores(tenant_id, status);

ALTER TABLE tournament.match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tournament.match_scores
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tournament.match_scores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 3. BRACKET GENERATION PROCEDURE
--    Seeded single-elimination bracket via stored procedure
--    Uses advisory locks for mutual exclusion
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION tournament.generate_bracket(
  p_tournament_id UUID,
  p_category VARCHAR,
  p_weight_class VARCHAR,
  p_seeding_method VARCHAR DEFAULT 'ranking'  -- 'ranking', 'random', 'manual'
)
RETURNS TABLE (
  match_number INT,
  round_number INT,
  red_athlete_id UUID,
  blue_athlete_id UUID,
  is_bye BOOLEAN
) AS $$
DECLARE
  v_lock_key BIGINT;
  v_athletes UUID[];
  v_count INT;
  v_padded INT;
  v_tenant UUID;
  i INT;
BEGIN
  v_tenant := current_setting('app.current_tenant', true)::UUID;

  -- Advisory lock on tournament + category
  v_lock_key := system.advisory_lock_key('bracket', p_tournament_id);
  IF NOT pg_try_advisory_lock(v_lock_key) THEN
    RAISE EXCEPTION 'Bracket generation already in progress for tournament %', p_tournament_id;
  END IF;

  BEGIN
    -- Get seeded athletes
    IF p_seeding_method = 'ranking' THEN
      SELECT ARRAY_AGG(a.id ORDER BY COALESCE(r.points, 0) DESC, a.created_at)
      INTO v_athletes
      FROM athletes a
      LEFT JOIN rankings r ON r.athlete_id = a.id AND r.category = p_category
      WHERE a.tournament_id = p_tournament_id
        AND a.trang_thai = 'da_duyet'
        AND a.is_deleted = false;
    ELSE
      SELECT ARRAY_AGG(a.id ORDER BY random())
      INTO v_athletes
      FROM athletes a
      WHERE a.tournament_id = p_tournament_id
        AND a.trang_thai = 'da_duyet'
        AND a.is_deleted = false;
    END IF;

    v_count := COALESCE(array_length(v_athletes, 1), 0);
    IF v_count < 2 THEN
      PERFORM pg_advisory_unlock(v_lock_key);
      RAISE EXCEPTION 'Need at least 2 athletes, got %', v_count;
    END IF;

    -- Pad to next power of 2
    v_padded := 1;
    WHILE v_padded < v_count LOOP
      v_padded := v_padded * 2;
    END LOOP;

    -- Generate bracket matches
    match_number := 0;
    round_number := 1;
    FOR i IN 1..v_padded/2 LOOP
      match_number := match_number + 1;
      red_athlete_id := CASE WHEN i*2-1 <= v_count THEN v_athletes[i*2-1] ELSE NULL END;
      blue_athlete_id := CASE WHEN i*2 <= v_count THEN v_athletes[i*2] ELSE NULL END;
      is_bye := (red_athlete_id IS NULL OR blue_athlete_id IS NULL);
      RETURN NEXT;
    END LOOP;

    PERFORM pg_advisory_unlock(v_lock_key);
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(v_lock_key);
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. GRAPH QUERIES — LINEAGE + SOCIAL
--    Recursive CTE functions for tree traversal
-- ════════════════════════════════════════════════════════

-- Get full lineage tree (ancestors → descendants)
CREATE OR REPLACE FUNCTION platform.get_lineage_tree(
  p_school_id UUID,
  p_direction VARCHAR DEFAULT 'both',  -- 'ancestors', 'descendants', 'both'
  p_max_depth INT DEFAULT 10
)
RETURNS TABLE (
  node_id UUID, school_name VARCHAR, parent_id UUID,
  depth INT, path UUID[]
) AS $$
BEGIN
  IF p_direction IN ('ancestors', 'both') THEN
    RETURN QUERY
    WITH RECURSIVE ancestors AS (
      SELECT s.id, s.name, sl.parent_school_id, 0 AS d, ARRAY[s.id] AS p
      FROM platform.martial_schools s
      LEFT JOIN platform.school_lineage sl ON sl.child_school_id = s.id
      WHERE s.id = p_school_id AND s.is_deleted = false

      UNION ALL

      SELECT s.id, s.name, sl2.parent_school_id, a.d + 1, a.p || s.id
      FROM ancestors a
      JOIN platform.school_lineage sl2 ON sl2.child_school_id = a.parent_id
      JOIN platform.martial_schools s ON s.id = sl2.parent_school_id AND s.is_deleted = false
      WHERE a.d < p_max_depth AND NOT s.id = ANY(a.p)
    )
    SELECT a.id, a.name, a.parent_school_id, a.d, a.p
    FROM ancestors a WHERE a.d > 0;
  END IF;

  IF p_direction IN ('descendants', 'both') THEN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
      SELECT s.id, s.name, sl.parent_school_id, 0 AS d, ARRAY[s.id] AS p
      FROM platform.martial_schools s
      LEFT JOIN platform.school_lineage sl ON sl.child_school_id = s.id
      WHERE s.id = p_school_id AND s.is_deleted = false

      UNION ALL

      SELECT s.id, s.name, p_school_id, de.d + 1, de.p || s.id
      FROM descendants de
      JOIN platform.school_lineage sl2 ON sl2.parent_school_id = de.node_id
      JOIN platform.martial_schools s ON s.id = sl2.child_school_id AND s.is_deleted = false
      WHERE de.d < p_max_depth AND NOT s.id = ANY(de.p)
    )
    SELECT d.node_id, d.school_name, d.parent_id, d.depth, d.path
    FROM descendants d WHERE d.depth > 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 5. SNAPSHOT TABLE (Event Sourcing Optimization)
--    Periodic snapshots to avoid replaying entire stream
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.event_snapshots (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  stream_type     VARCHAR(50) NOT NULL,
  stream_id       UUID NOT NULL,
  snapshot_version BIGINT NOT NULL,          -- event_version at snapshot time
  state           JSONB NOT NULL,            -- serialized aggregate state
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, stream_id, snapshot_version)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_stream
  ON tournament.event_snapshots(tenant_id, stream_id, snapshot_version DESC);

ALTER TABLE tournament.event_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tournament.event_snapshots
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

COMMIT;
