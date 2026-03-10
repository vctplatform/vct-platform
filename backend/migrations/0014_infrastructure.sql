-- ===============================================================
-- VCT Platform — Migration 0014: INFRASTRUCTURE (Phase 2C)
-- Job Queue (SKIP LOCKED), Rate Limiting, Scheduled Tasks
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. JOB QUEUE
--    General-purpose background job processing
--    Workers use SELECT ... FOR UPDATE SKIP LOCKED
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.job_queue (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID,
  job_type        VARCHAR(100) NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  result          JSONB,
  priority        INT DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead', 'cancelled')),
  max_retries     INT DEFAULT 3,
  retry_count     INT DEFAULT 0,
  run_at          TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  locked_by       VARCHAR(100),       -- worker hostname/ID
  locked_at       TIMESTAMPTZ,
  timeout_seconds INT DEFAULT 300,     -- 5 min default
  last_error      TEXT,
  tags            JSONB DEFAULT '[]',  -- for filtering/routing
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hot index: pending jobs ready to run
CREATE INDEX IF NOT EXISTS idx_jobs_pending
  ON system.job_queue(priority DESC, run_at, created_at)
  WHERE status = 'pending';

-- For cleanup: completed/dead jobs
CREATE INDEX IF NOT EXISTS idx_jobs_completed
  ON system.job_queue(completed_at)
  WHERE status IN ('completed', 'dead');

-- For monitoring: stuck jobs
CREATE INDEX IF NOT EXISTS idx_jobs_processing
  ON system.job_queue(locked_at)
  WHERE status = 'processing';

-- Type-based routing
CREATE INDEX IF NOT EXISTS idx_jobs_type
  ON system.job_queue(job_type)
  WHERE status = 'pending';

-- BRIN for time-based archival
CREATE INDEX IF NOT EXISTS idx_jobs_created_brin
  ON system.job_queue USING BRIN (created_at);

-- ════════════════════════════════════════════════════════
-- 2. JOB HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Claim a job (called by Go worker)
CREATE OR REPLACE FUNCTION system.claim_job(
  p_job_types TEXT[] DEFAULT NULL,
  p_worker_id TEXT DEFAULT '',
  p_limit INT DEFAULT 1
)
RETURNS SETOF system.job_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE system.job_queue
  SET status = 'processing',
      started_at = NOW(),
      locked_by = p_worker_id,
      locked_at = NOW()
  WHERE id IN (
    SELECT id FROM system.job_queue
    WHERE status = 'pending'
      AND run_at <= NOW()
      AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
    ORDER BY priority DESC, created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Complete a job
CREATE OR REPLACE FUNCTION system.complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE system.job_queue
  SET status = 'completed',
      completed_at = NOW(),
      result = p_result,
      locked_by = NULL,
      locked_at = NULL
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Fail a job (with retry logic)
CREATE OR REPLACE FUNCTION system.fail_job(
  p_job_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE system.job_queue
  SET retry_count = retry_count + 1,
      last_error = p_error,
      locked_by = NULL,
      locked_at = NULL,
      status = CASE
        WHEN retry_count + 1 >= max_retries THEN 'dead'
        ELSE 'pending'
      END,
      -- Exponential backoff: 30s, 2min, 8min, 32min...
      run_at = CASE
        WHEN retry_count + 1 < max_retries
        THEN NOW() + (POWER(4, retry_count) * INTERVAL '30 seconds')
        ELSE run_at
      END
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Reap stuck jobs (timeout exceeded)
CREATE OR REPLACE FUNCTION system.reap_stuck_jobs(p_timeout_seconds INT DEFAULT 600)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE system.job_queue
  SET status = 'pending',
      locked_by = NULL,
      locked_at = NULL,
      last_error = 'Reaped: exceeded lock timeout'
  WHERE status = 'processing'
    AND locked_at < NOW() - (p_timeout_seconds || ' seconds')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. RATE LIMITING
--    Sliding window per (tenant, identifier, endpoint)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.rate_limits (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  identifier      VARCHAR(200) NOT NULL,     -- user_id, ip_address, api_key
  endpoint        VARCHAR(200) NOT NULL,     -- '/api/v1/scoring/*', '/api/v1/auth/login'
  window_start    TIMESTAMPTZ NOT NULL,
  request_count   INT NOT NULL DEFAULT 1,
  max_requests    INT NOT NULL DEFAULT 100,
  UNIQUE (tenant_id, identifier, endpoint, window_start)
);

-- BRIN: time-based cleanup is the hot path
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON system.rate_limits USING BRIN (window_start);

-- For checking current rate
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON system.rate_limits(tenant_id, identifier, endpoint, window_start DESC);

-- Rate check function (returns true if allowed)
CREATE OR REPLACE FUNCTION system.check_rate_limit(
  p_tenant_id UUID,
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 100,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INT;
BEGIN
  -- Current window (floored to p_window_seconds)
  v_window := date_trunc('minute', NOW());

  -- Upsert and return count
  INSERT INTO system.rate_limits (tenant_id, identifier, endpoint, window_start, request_count, max_requests)
  VALUES (p_tenant_id, p_identifier, p_endpoint, v_window, 1, p_max_requests)
  ON CONFLICT (tenant_id, identifier, endpoint, window_start)
  DO UPDATE SET request_count = system.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. SCHEDULED TASKS TABLE
--    Replaces pg_cron dependency with app-managed scheduling
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.scheduled_tasks (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  cron_expression VARCHAR(50) NOT NULL,     -- '*/5 * * * *' (every 5 min)
  job_type        VARCHAR(100) NOT NULL,    -- maps to Go handler
  payload         JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  last_duration_ms INT,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: scheduled tasks for matview refresh, cleanup, etc.
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description, payload) VALUES
  ('refresh_tournament_dashboard', '*/2 * * * *', 'matview_refresh',
   'Refresh tournament dashboard materialized view every 2 min',
   '{"view": "api_v1.tournament_dashboard", "concurrently": true}'),

  ('refresh_rankings_leaderboard', '*/5 * * * *', 'matview_refresh',
   'Refresh rankings leaderboard every 5 min',
   '{"view": "api_v1.rankings_leaderboard", "concurrently": true}'),

  ('cleanup_expired_sessions', '0 * * * *', 'cleanup',
   'Remove expired sessions every hour',
   '{"table": "core.sessions", "condition": "expires_at < NOW()"}'),

  ('cleanup_rate_limits', '*/15 * * * *', 'cleanup',
   'Cleanup old rate limit windows every 15 min',
   '{"table": "system.rate_limits", "condition": "window_start < NOW() - INTERVAL ''2 hours''"}'),

  ('reap_stuck_jobs', '*/5 * * * *', 'job_reaper',
   'Reap stuck jobs every 5 min',
   '{"timeout_seconds": 600}'),

  ('publish_outbox_events', '*/10 * * * *', 'outbox_publisher',
   'Publish pending outbox events to NATS every 10 sec (Go worker polls faster)',
   '{"batch_size": 100}'),

  ('archive_old_audit_logs', '0 3 * * *', 'archiver',
   'Archive audit logs older than 90 days at 3 AM',
   '{"retention_days": 90}'),

  ('cleanup_dead_jobs', '0 4 * * *', 'cleanup',
   'Remove dead jobs older than 30 days at 4 AM',
   '{"table": "system.job_queue", "condition": "status = ''dead'' AND completed_at < NOW() - INTERVAL ''30 days''"}')
ON CONFLICT (name) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 5. API KEY MANAGEMENT
--    For external integrations (scoring panels, mobile apps)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.api_keys (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  name            VARCHAR(100) NOT NULL,
  key_hash        VARCHAR(255) NOT NULL,     -- SHA-256 of the actual key
  key_prefix      VARCHAR(10) NOT NULL,      -- First 8 chars for identification
  permissions     JSONB DEFAULT '[]',
  rate_limit      INT DEFAULT 1000,          -- requests per minute
  expires_at      TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  created_by      UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON system.api_keys(key_hash)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant
  ON system.api_keys(tenant_id)
  WHERE is_active = true;

-- RLS
ALTER TABLE system.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.api_keys
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.api_keys
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;
