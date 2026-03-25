-- ===============================================================
-- VCT Platform — Migration 0070: AI/ML DATA PIPELINE
-- P3: Training datasets, predictions, model registry, feature store
-- ===============================================================

BEGIN;

-- Create ML schema
CREATE SCHEMA IF NOT EXISTS ml;

-- ════════════════════════════════════════════════════════
-- 1. MODEL REGISTRY
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ml.model_registry (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  version         VARCHAR(50) NOT NULL,
  model_type      VARCHAR(50) NOT NULL
    CHECK (model_type IN ('bracket_prediction','match_outcome','ranking','anomaly_detection','recommendation')),
  status          VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft','training','validating','active','deprecated','archived')),
  -- Metrics
  accuracy        NUMERIC(5,4),
  precision_val   NUMERIC(5,4),
  recall          NUMERIC(5,4),
  f1_score        NUMERIC(5,4),
  custom_metrics  JSONB DEFAULT '{}',
  -- Config
  hyperparams     JSONB DEFAULT '{}',
  input_features  TEXT[],
  output_schema   JSONB DEFAULT '{}',
  -- Storage
  artifact_path   TEXT,
  file_size       BIGINT,
  -- Lifecycle
  trained_at      TIMESTAMPTZ,
  deployed_at     TIMESTAMPTZ,
  deprecated_at   TIMESTAMPTZ,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, version)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ml.model_registry
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. TRAINING DATASETS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ml.training_datasets (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  dataset_type    VARCHAR(50) NOT NULL
    CHECK (dataset_type IN ('match_history','athlete_stats','tournament_outcomes','scoring_patterns')),
  -- Query that generates the dataset
  source_query    TEXT NOT NULL,
  -- Stats
  row_count       BIGINT DEFAULT 0,
  column_count    INT DEFAULT 0,
  schema_info     JSONB DEFAULT '{}',
  -- Versioning
  version         VARCHAR(50),
  data_hash       TEXT,
  -- Status
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','generating','ready','expired','error')),
  generated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- 3. PREDICTIONS TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ml.predictions (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID,
  model_id        UUID REFERENCES ml.model_registry(id),
  prediction_type VARCHAR(50) NOT NULL,
  -- Input/Output
  input_data      JSONB NOT NULL,
  prediction      JSONB NOT NULL,
  confidence      NUMERIC(5,4),
  -- Validation
  actual_outcome  JSONB,
  was_correct     BOOLEAN,
  -- Context
  entity_type     VARCHAR(50),
  entity_id       UUID,
  -- Timestamp
  predicted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at    TIMESTAMPTZ,
  PRIMARY KEY (predicted_at, id)
) PARTITION BY RANGE (predicted_at);

CREATE TABLE IF NOT EXISTS ml.predictions_2026
  PARTITION OF ml.predictions FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS ml.predictions_default
  PARTITION OF ml.predictions DEFAULT;

CREATE INDEX IF NOT EXISTS idx_predictions_entity
  ON ml.predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model
  ON ml.predictions(model_id, predicted_at DESC);

-- ════════════════════════════════════════════════════════
-- 4. FEATURE STORE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ml.feature_store (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID NOT NULL,
  feature_set     VARCHAR(100) NOT NULL,
  features        JSONB NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  version         INT DEFAULT 1,
  UNIQUE (entity_type, entity_id, feature_set)
);

CREATE INDEX IF NOT EXISTS idx_feature_store_lookup
  ON ml.feature_store(entity_type, entity_id, feature_set);

-- ════════════════════════════════════════════════════════
-- 5. ATHLETE FEATURE COMPUTATION
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ml.compute_athlete_features(p_athlete_id UUID)
RETURNS JSONB AS $$
DECLARE v JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_matches', COALESCE(ar.total_matches, 0),
    'win_rate', CASE WHEN ar.total_matches > 0
      THEN round(ar.wins::NUMERIC / ar.total_matches, 4) ELSE 0 END,
    'current_rating', COALESCE(ar.rating, 1500),
    'rating_trend', COALESCE((
      SELECT avg(rating_change)
      FROM (SELECT rating_change FROM tournament.rating_history WHERE athlete_id = p_athlete_id ORDER BY recorded_at DESC LIMIT 5) r
    ), 0),
    'days_since_last_match', COALESCE(
      EXTRACT(DAY FROM NOW() - ar.last_match_at)::INT, 999),
    'weight_kg', a.can_nang,
    'age_years', EXTRACT(YEAR FROM age(a.ngay_sinh))::INT,
    'win_streak', COALESCE(ar.win_streak, 0)
  ) INTO v
  FROM athletes a
  LEFT JOIN tournament.athlete_ratings ar ON ar.athlete_id = a.id AND ar.is_active = true
  WHERE a.id = p_athlete_id
  LIMIT 1;

  -- Upsert into feature store
  INSERT INTO ml.feature_store (entity_type, entity_id, feature_set, features, expires_at)
  VALUES ('athlete', p_athlete_id, 'match_prediction', COALESCE(v, '{}'::JSONB), NOW() + INTERVAL '1 day')
  ON CONFLICT (entity_type, entity_id, feature_set) DO UPDATE SET
    features = EXCLUDED.features, computed_at = NOW(), expires_at = EXCLUDED.expires_at, version = ml.feature_store.version + 1;

  RETURN v;
END; $$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 6. MATCH OUTCOME PREDICTION (rule-based baseline)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ml.predict_match_outcome(
  p_red_id UUID, p_blue_id UUID
)
RETURNS JSONB AS $$
DECLARE v_red JSONB; v_blue JSONB; v_pred TEXT; v_conf NUMERIC;
BEGIN
  v_red := ml.compute_athlete_features(p_red_id);
  v_blue := ml.compute_athlete_features(p_blue_id);

  IF (v_red->>'current_rating')::NUMERIC > (v_blue->>'current_rating')::NUMERIC THEN
    v_pred := 'red_wins';
    v_conf := LEAST(0.5 + ((v_red->>'current_rating')::NUMERIC - (v_blue->>'current_rating')::NUMERIC) / 800.0, 0.95);
  ELSE
    v_pred := 'blue_wins';
    v_conf := LEAST(0.5 + ((v_blue->>'current_rating')::NUMERIC - (v_red->>'current_rating')::NUMERIC) / 800.0, 0.95);
  END IF;

  RETURN jsonb_build_object(
    'prediction', v_pred, 'confidence', round(v_conf, 4),
    'red_rating', v_red->>'current_rating', 'blue_rating', v_blue->>'current_rating',
    'red_win_rate', v_red->>'win_rate', 'blue_win_rate', v_blue->>'win_rate'
  );
END; $$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 7. ML MONITORING VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS ml.v_model_performance CASCADE;
CREATE VIEW ml.v_model_performance AS
SELECT
  mr.name, mr.version, mr.model_type, mr.status,
  count(p.id) AS total_predictions,
  count(p.id) FILTER (WHERE p.was_correct = true) AS correct,
  count(p.id) FILTER (WHERE p.was_correct = false) AS incorrect,
  CASE WHEN count(p.id) FILTER (WHERE p.was_correct IS NOT NULL) > 0
    THEN round(count(p.id) FILTER (WHERE p.was_correct)::NUMERIC /
      count(p.id) FILTER (WHERE p.was_correct IS NOT NULL) * 100, 2)
    ELSE NULL END AS accuracy_pct,
  avg(p.confidence) AS avg_confidence
FROM ml.model_registry mr
LEFT JOIN ml.predictions p ON p.model_id = mr.id
GROUP BY mr.id;

COMMIT;
