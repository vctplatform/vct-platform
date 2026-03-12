-- ===============================================================
-- VCT Platform — Migration 0023: FEATURE FLAGS + CIRCUIT BREAKER
--    + JSON validation, connection pooling hints (Phase 5C)
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. FEATURE FLAGS
--    Toggle features per tenant without deployments
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.feature_flags (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  flag_key        VARCHAR(200) NOT NULL UNIQUE,
  description     TEXT,
  flag_value      BOOLEAN DEFAULT false,
  scope           VARCHAR(20) DEFAULT 'global',
  rollout_percent INT DEFAULT 0,
  target_users    JSONB DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1,
  tenant_id       UUID
);

-- Add columns needed by flag feature system
ALTER TABLE system.feature_flags
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rollout_pct INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_rules JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS system.feature_flag_overrides (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  flag_id         UUID NOT NULL REFERENCES system.feature_flags(id) ON DELETE CASCADE,
  tenant_id       UUID REFERENCES core.tenants(id),
  user_id         UUID REFERENCES core.users(id),
  is_enabled      BOOLEAN NOT NULL,
  reason          TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flag_id, tenant_id, user_id)
);

-- Check if feature is enabled for current context
CREATE OR REPLACE FUNCTION system.is_feature_enabled(
  p_flag_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag system.feature_flags%ROWTYPE;
  v_override BOOLEAN;
  v_tenant UUID;
BEGIN
  v_tenant := COALESCE(p_tenant_id,
    current_setting('app.current_tenant', true)::UUID);

  SELECT * INTO v_flag FROM system.feature_flags WHERE flag_key = p_flag_name;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Check user-specific override
  IF p_user_id IS NOT NULL THEN
    SELECT is_enabled INTO v_override
    FROM system.feature_flag_overrides
    WHERE flag_id = v_flag.id AND user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > NOW());
    IF v_override IS NOT NULL THEN RETURN v_override; END IF;
  END IF;

  -- Check tenant-specific override
  SELECT is_enabled INTO v_override
  FROM system.feature_flag_overrides
  WHERE flag_id = v_flag.id AND tenant_id = v_tenant AND user_id IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  -- Global flag
  RETURN v_flag.is_enabled;
END;
$$ LANGUAGE plpgsql STABLE;

-- Seed default flags
DO $$
BEGIN
  INSERT INTO system.feature_flags (flag_key, description, is_enabled, flag_value) VALUES
    ('live_scoring', 'Tính năng chấm điểm trực tiếp', true, true),
    ('event_sourcing', 'Event sourcing cho trận đấu', false, false),
    ('ai_bracket_prediction', 'Dự đoán bảng đấu bằng AI', false, false),
    ('bulk_import', 'Upload danh sách VĐV từ Excel', true, true),
    ('multi_currency', 'Thanh toán đa tiền tệ', false, false),
    ('heritage_3d', 'Xem kỹ thuật di sản 3D', false, false),
    ('community_marketplace', 'Chợ trao đổi cộng đồng', true, true),
    ('geospatial_search', 'Tìm CLB theo vị trí', true, true),
    ('video_streaming', 'Phát trực tiếp trận đấu', false, false),
    ('advanced_analytics', 'Phân tích nâng cao', false, false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.feature_flags
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. CIRCUIT BREAKER PATTERN
--    Track external service health, auto-disable on failures
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.circuit_breakers (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  service_name    VARCHAR(200) NOT NULL UNIQUE,   -- 'nats', 's3', 'meilisearch', 'email_provider'
  status          VARCHAR(20) NOT NULL DEFAULT 'closed'
    CHECK (status IN ('closed', 'open', 'half_open')),
  failure_count   INT DEFAULT 0,
  success_count   INT DEFAULT 0,
  failure_threshold INT DEFAULT 5,
  reset_timeout_seconds INT DEFAULT 60,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  half_open_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Record failure/success + auto-transition states
CREATE OR REPLACE FUNCTION system.circuit_breaker_record(
  p_service TEXT,
  p_success BOOLEAN
)
RETURNS system.circuit_breakers AS $$
DECLARE
  v_cb system.circuit_breakers;
BEGIN
  -- Upsert
  INSERT INTO system.circuit_breakers (service_name) VALUES (p_service)
  ON CONFLICT (service_name) DO NOTHING;

  SELECT * INTO v_cb FROM system.circuit_breakers WHERE service_name = p_service FOR UPDATE;

  IF p_success THEN
    -- Success
    IF v_cb.status = 'half_open' THEN
      UPDATE system.circuit_breakers SET
        status = 'closed', failure_count = 0,
        success_count = success_count + 1,
        last_success_at = NOW(), updated_at = NOW()
      WHERE id = v_cb.id RETURNING * INTO v_cb;
    ELSE
      UPDATE system.circuit_breakers SET
        success_count = success_count + 1,
        last_success_at = NOW(), updated_at = NOW()
      WHERE id = v_cb.id RETURNING * INTO v_cb;
    END IF;
  ELSE
    -- Failure
    UPDATE system.circuit_breakers SET
      failure_count = failure_count + 1,
      last_failure_at = NOW(), updated_at = NOW()
    WHERE id = v_cb.id RETURNING * INTO v_cb;

    -- Trip breaker if threshold exceeded
    IF v_cb.failure_count >= v_cb.failure_threshold AND v_cb.status = 'closed' THEN
      UPDATE system.circuit_breakers SET
        status = 'open', opened_at = NOW(), updated_at = NOW()
      WHERE id = v_cb.id RETURNING * INTO v_cb;

      PERFORM pg_notify('circuit_breaker', json_build_object(
        'service', p_service, 'status', 'open', 'failures', v_cb.failure_count
      )::TEXT);
    END IF;
  END IF;

  RETURN v_cb;
END;
$$ LANGUAGE plpgsql;

-- Check if service is available
CREATE OR REPLACE FUNCTION system.is_circuit_open(p_service TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_cb system.circuit_breakers;
BEGIN
  SELECT * INTO v_cb FROM system.circuit_breakers WHERE service_name = p_service;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Auto-transition open → half_open after timeout
  IF v_cb.status = 'open'
    AND v_cb.opened_at + (v_cb.reset_timeout_seconds || ' seconds')::INTERVAL < NOW()
  THEN
    UPDATE system.circuit_breakers SET status = 'half_open', half_open_at = NOW()
    WHERE id = v_cb.id;
    RETURN false;  -- allow a trial request
  END IF;

  RETURN v_cb.status = 'open';
END;
$$ LANGUAGE plpgsql;

-- Seed common services
INSERT INTO system.circuit_breakers (service_name, failure_threshold, reset_timeout_seconds) VALUES
  ('nats', 5, 30),
  ('smtp', 3, 120),
  ('s3_storage', 5, 60),
  ('meilisearch', 5, 60),
  ('payment_gateway', 3, 180)
ON CONFLICT (service_name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 3. JSONB SCHEMA VALIDATION
--    Enforce structure on JSONB columns
-- ════════════════════════════════════════════════════════

-- Validate required keys exist in a JSONB object
CREATE OR REPLACE FUNCTION system.validate_jsonb_keys(
  p_data JSONB,
  p_required_keys TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE k TEXT;
BEGIN
  FOREACH k IN ARRAY p_required_keys LOOP
    IF NOT (p_data ? k) THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enforce scoring event_data has required fields
DO $$ BEGIN
  ALTER TABLE tournament.match_scores
    ADD CONSTRAINT chk_round_scores_valid
    CHECK (
      jsonb_typeof(round_scores) = 'array'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Event store metadata validation
DO $$ BEGIN
  ALTER TABLE tournament.event_store
    ADD CONSTRAINT chk_event_data_object
    CHECK (jsonb_typeof(event_data) = 'object');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Webhook events must be an array
DO $$ BEGIN
  ALTER TABLE system.webhooks
    ADD CONSTRAINT chk_webhook_events_array
    CHECK (jsonb_typeof(events) = 'array');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. SYSTEM ANNOUNCEMENTS
--    Platform-wide announcements for maintenance, upgrades
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.announcements (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = all tenants
  title           VARCHAR(500) NOT NULL,
  content         TEXT NOT NULL,
  severity        VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical', 'maintenance')),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  is_dismissible  BOOLEAN DEFAULT true,
  target_roles    JSONB DEFAULT '[]',     -- empty = all roles
  is_active       BOOLEAN DEFAULT true,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON system.announcements(starts_at, ends_at)
  WHERE is_active = true;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.announcements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 5. AGGREGATE SCORING VIEWS (Final read models)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW api_v1.live_matches AS
SELECT
  m.id AS match_id,
  m.tournament_id,
  m.trang_thai AS match_status,
  ms.red_score,
  ms.blue_score,
  ms.current_round,
  ms.status AS scoring_status,
  ms.winner_id,
  ms.win_method,
  m.arena_id,
  m.thoi_gian_bat_dau AS match_date,
  m.tenant_id,
  m.updated_at
FROM combat_matches m
LEFT JOIN tournament.match_scores ms ON ms.match_id = m.id AND ms.tenant_id = m.tenant_id
WHERE m.is_deleted = false
  AND m.trang_thai IN ('dang_dau', 'tam_dung');

COMMIT;
