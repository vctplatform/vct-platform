-- ===============================================================
-- VCT Platform — Migration 0068: READ-THROUGH MATVIEWS + A/B TEST
-- P3 Long-term: Lazy matviews + experiment infrastructure
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. MATVIEW REGISTRY (Lazy Refresh)
--    Track usage patterns → only refresh hot views
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.matview_registry (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  view_name       VARCHAR(200) NOT NULL UNIQUE,
  -- Refresh config
  refresh_interval_seconds INT DEFAULT 300,   -- minimum refresh interval
  refresh_strategy VARCHAR(20) DEFAULT 'on_demand'
    CHECK (refresh_strategy IN ('on_demand', 'periodic', 'on_write', 'lazy')),
  source_tables   TEXT[] DEFAULT '{}',         -- tables this view depends on
  -- Usage stats
  last_refreshed  TIMESTAMPTZ,
  last_read_at    TIMESTAMPTZ,
  total_reads     BIGINT DEFAULT 0,
  total_refreshes BIGINT DEFAULT 0,
  avg_refresh_ms  NUMERIC(10,2) DEFAULT 0,
  -- Lifecycle
  is_active       BOOLEAN DEFAULT true,
  auto_drop_days  INT DEFAULT 30,              -- drop if unused for N days
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.matview_registry
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Register existing matviews
INSERT INTO system.matview_registry (view_name, refresh_strategy, refresh_interval_seconds, source_tables) VALUES
  ('api_v1.tournament_dashboard', 'periodic', 600, ARRAY['tournaments', 'athletes', 'combat_matches']),
  ('api_v1.rankings_leaderboard', 'periodic', 900, ARRAY['rankings', 'athletes']),
  ('api_v1.leaderboard', 'periodic', 900, ARRAY['tournament.athlete_ratings', 'athletes'])
ON CONFLICT (view_name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 2. LAZY REFRESH FUNCTION
--    Only refresh if: (a) stale, (b) being read
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.lazy_matview_read(p_view_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_reg system.matview_registry%ROWTYPE;
  v_start TIMESTAMPTZ;
  v_elapsed NUMERIC;
BEGIN
  SELECT * INTO v_reg FROM system.matview_registry WHERE view_name = p_view_name;

  IF NOT FOUND OR NOT v_reg.is_active THEN RETURN; END IF;

  -- Track the read
  UPDATE system.matview_registry SET
    last_read_at = NOW(),
    total_reads = total_reads + 1
  WHERE id = v_reg.id;

  -- Check if refresh needed
  IF v_reg.refresh_strategy = 'lazy'
    AND (v_reg.last_refreshed IS NULL
         OR v_reg.last_refreshed < NOW() - (v_reg.refresh_interval_seconds || ' seconds')::INTERVAL)
  THEN
    v_start := clock_timestamp();
    BEGIN
      EXECUTE format('REFRESH MATERIALIZED VIEW %s', p_view_name);
      v_elapsed := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start);

      UPDATE system.matview_registry SET
        last_refreshed = NOW(),
        total_refreshes = total_refreshes + 1,
        avg_refresh_ms = CASE
          WHEN total_refreshes = 0 THEN v_elapsed
          ELSE (avg_refresh_ms * total_refreshes + v_elapsed) / (total_refreshes + 1)
        END
      WHERE id = v_reg.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed lazy refresh of %: %', p_view_name, SQLERRM;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. AUTO-DROP UNUSED MATVIEWS
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.cleanup_unused_matviews(p_dry_run BOOLEAN DEFAULT true)
RETURNS TABLE (view_name TEXT, last_read TIMESTAMPTZ, action TEXT) AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM system.matview_registry
    WHERE is_active = true
      AND last_read_at IS NOT NULL
      AND last_read_at < NOW() - (auto_drop_days || ' days')::INTERVAL
  LOOP
    view_name := r.view_name;
    last_read := r.last_read_at;

    IF p_dry_run THEN
      action := 'WOULD_DROP';
    ELSE
      BEGIN
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %s', r.view_name);
        UPDATE system.matview_registry SET is_active = false WHERE id = r.id;
        action := 'DROPPED';
      EXCEPTION WHEN OTHERS THEN
        action := 'ERROR: ' || SQLERRM;
      END;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. A/B TESTING — EXPERIMENTS TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.experiments (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(200) NOT NULL UNIQUE,
  description     TEXT,
  hypothesis      TEXT,
  -- Configuration
  status          VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  traffic_pct     INT DEFAULT 50 CHECK (traffic_pct BETWEEN 0 AND 100),
  -- Variants
  variants        JSONB NOT NULL DEFAULT '[
    {"name": "control", "weight": 50},
    {"name": "treatment", "weight": 50}
  ]',
  -- Targeting
  target_tenants  UUID[],                  -- NULL = all tenants
  target_roles    TEXT[],                  -- filter by user role
  -- Metrics
  primary_metric  VARCHAR(200),            -- e.g., 'registration_rate'
  secondary_metrics TEXT[],
  -- Timeline
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  auto_end_days   INT DEFAULT 30,
  -- Owner
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.experiments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 5. EXPERIMENT ASSIGNMENTS
--    Which user gets which variant
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.experiment_assignments (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  experiment_id   UUID NOT NULL REFERENCES system.experiments(id) ON DELETE CASCADE,
  user_id         UUID,
  tenant_id       UUID,
  session_id      TEXT,
  variant         VARCHAR(100) NOT NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (experiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_exp_assign_lookup
  ON system.experiment_assignments(experiment_id, user_id);

-- ════════════════════════════════════════════════════════
-- 6. EXPERIMENT EVENTS (Results Tracking)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.experiment_events (
  id              BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  experiment_id   UUID NOT NULL REFERENCES system.experiments(id) ON DELETE CASCADE,
  user_id         UUID,
  variant         VARCHAR(100) NOT NULL,
  event_type      VARCHAR(100) NOT NULL,   -- 'page_view', 'registration', 'purchase'
  event_value     NUMERIC,                 -- optional: amount, duration, etc.
  metadata        JSONB DEFAULT '{}',
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS system.experiment_events_2026
  PARTITION OF system.experiment_events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS system.experiment_events_default
  PARTITION OF system.experiment_events DEFAULT;

-- ════════════════════════════════════════════════════════
-- 7. ASSIGN VARIANT FUNCTION
--    Deterministic assignment based on user_id hash
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.get_experiment_variant(
  p_experiment_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_exp system.experiments%ROWTYPE;
  v_variant TEXT;
  v_hash INT;
  v_variants JSONB;
  v_weight INT;
  v_cumulative INT := 0;
  v_target INT;
  v RECORD;
BEGIN
  SELECT * INTO v_exp FROM system.experiments
  WHERE name = p_experiment_name AND status = 'running';

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Check if already assigned
  SELECT variant INTO v_variant
  FROM system.experiment_assignments
  WHERE experiment_id = v_exp.id AND user_id = p_user_id;

  IF v_variant IS NOT NULL THEN RETURN v_variant; END IF;

  -- Check traffic allocation
  v_hash := abs(hashtext(COALESCE(p_user_id::TEXT, '') || v_exp.id::TEXT)) % 100;
  IF v_hash >= v_exp.traffic_pct THEN
    RETURN 'control';  -- Not in experiment
  END IF;

  -- Assign based on variant weights
  v_target := abs(hashtext(p_user_id::TEXT || v_exp.name)) % 100;
  FOR v IN SELECT * FROM jsonb_array_elements(v_exp.variants) LOOP
    v_weight := (v.value ->> 'weight')::INT;
    v_cumulative := v_cumulative + v_weight;
    IF v_target < v_cumulative THEN
      v_variant := v.value ->> 'name';
      EXIT;
    END IF;
  END LOOP;

  v_variant := COALESCE(v_variant, 'control');

  -- Record assignment
  INSERT INTO system.experiment_assignments (experiment_id, user_id, tenant_id, variant)
  VALUES (v_exp.id, p_user_id, p_tenant_id, v_variant)
  ON CONFLICT (experiment_id, user_id) DO UPDATE SET variant = EXCLUDED.variant;

  RETURN v_variant;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 8. EXPERIMENT RESULTS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_experiment_results CASCADE;
CREATE VIEW system.v_experiment_results AS
SELECT
  e.name AS experiment_name,
  e.status,
  e.traffic_pct,
  ea.variant,
  count(DISTINCT ea.user_id) AS users_in_variant,
  count(ee.id) AS total_events,
  count(DISTINCT ee.user_id) AS users_with_events,
  CASE WHEN count(DISTINCT ea.user_id) > 0
    THEN ROUND(count(DISTINCT ee.user_id)::NUMERIC / count(DISTINCT ea.user_id) * 100, 2)
    ELSE 0
  END AS conversion_rate_pct,
  avg(ee.event_value) AS avg_event_value,
  sum(ee.event_value) AS total_event_value
FROM system.experiments e
LEFT JOIN system.experiment_assignments ea ON ea.experiment_id = e.id
LEFT JOIN system.experiment_events ee ON ee.experiment_id = e.id AND ee.variant = ea.variant
GROUP BY e.name, e.status, e.traffic_pct, ea.variant
ORDER BY e.name, ea.variant;

COMMIT;
