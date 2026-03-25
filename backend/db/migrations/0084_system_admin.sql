-- ===============================================================
-- VCT Platform — Migration 0084: SYSTEM ADMINISTRATION MODULE
-- API key management, login history, background jobs, notification
-- log, system metrics, admin actions + dashboard views
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. API KEY MANAGEMENT
--    External integration keys with scopes, rate limits,
--    expiry, and usage tracking
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.api_keys (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  key_hash        VARCHAR(128) NOT NULL,          -- SHA-256 of the full key
  key_prefix      VARCHAR(12) NOT NULL,           -- "vct_ak_xxxx" for display
  scopes          JSONB NOT NULL DEFAULT '["read"]',
  rate_limit      INT DEFAULT 100,                -- requests per minute
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  last_used_ip    INET,
  usage_count     BIGINT DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES core.users(id),
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID REFERENCES core.users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

-- RLS
ALTER TABLE system.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.api_keys
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash
  ON system.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix
  ON system.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active
  ON system.api_keys(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires
  ON system.api_keys(expires_at) WHERE is_active = true AND expires_at IS NOT NULL;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.api_keys
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. LOGIN HISTORY
--    Detailed per-login tracking (supplements auth_audit_log)
--    Includes device fingerprint, geo, method
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.login_history (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at       TIMESTAMPTZ,
  session_duration INTERVAL GENERATED ALWAYS AS (logout_at - login_at) STORED,
  ip_address      INET,
  user_agent      TEXT,
  device_type     VARCHAR(20) DEFAULT 'unknown'
    CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'api', 'unknown')),
  browser         VARCHAR(100),
  os              VARCHAR(100),
  geo_location    JSONB DEFAULT '{}',             -- {"country": "VN", "city": "HCM"}
  login_method    VARCHAR(30) NOT NULL DEFAULT 'password'
    CHECK (login_method IN ('password', 'otp', 'oauth', 'api_key', 'sso', 'refresh')),
  status          VARCHAR(20) NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'blocked', 'locked_out', 'expired_password')),
  failure_reason  TEXT,
  session_id      UUID,                           -- FK to core.sessions if active
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (login_at, id)                      -- partition-ready
) PARTITION BY RANGE (login_at);

-- Default partition
CREATE TABLE IF NOT EXISTS system.login_history_default
  PARTITION OF system.login_history DEFAULT;

-- Current quarter partition (auto-create more via cron or app code)
DO $$
DECLARE
  q_start DATE := date_trunc('quarter', NOW())::DATE;
  q_end   DATE := (date_trunc('quarter', NOW()) + INTERVAL '3 months')::DATE;
  part_name TEXT := 'system.login_history_' || to_char(q_start, 'YYYY') || '_q' ||
                    EXTRACT(QUARTER FROM q_start)::TEXT;
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.login_history
       FOR VALUES FROM (%L) TO (%L)',
    part_name, q_start, q_end
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- RLS
ALTER TABLE system.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.login_history
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user
  ON system.login_history(tenant_id, user_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_status
  ON system.login_history(tenant_id, status, login_at DESC)
  WHERE status != 'success';
CREATE INDEX IF NOT EXISTS idx_login_history_ip
  ON system.login_history(ip_address, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_method
  ON system.login_history(login_method, login_at DESC);

-- ════════════════════════════════════════════════════════
-- 3. BACKGROUND JOBS
--    Track async work: email, reports, imports, matview
--    refresh, data cleanup, etc.
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.background_jobs (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = system-wide job
  job_type        VARCHAR(100) NOT NULL,           -- 'email', 'report', 'import', 'matview_refresh', 'cleanup'
  job_name        VARCHAR(300) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'retrying', 'timeout')),
  priority        INT NOT NULL DEFAULT 5           -- 1=highest, 10=lowest
    CHECK (priority BETWEEN 1 AND 10),
  payload         JSONB DEFAULT '{}',
  result          JSONB,
  error           TEXT,
  progress        INT DEFAULT 0                    -- 0-100 percentage
    CHECK (progress BETWEEN 0 AND 100),
  max_retries     INT DEFAULT 3,
  attempt_count   INT DEFAULT 0,
  scheduled_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  timeout_seconds INT DEFAULT 300,                 -- 5 min default
  locked_by       VARCHAR(200),                    -- worker ID
  locked_until    TIMESTAMPTZ,
  created_by      UUID REFERENCES core.users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

-- RLS — allow system jobs (tenant_id IS NULL) for system admins
ALTER TABLE system.background_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_or_system ON system.background_jobs
  USING (
    tenant_id IS NULL AND current_setting('app.is_system_admin', true) = 'true'
    OR tenant_id = COALESCE(
      current_setting('app.current_tenant', true)::UUID,
      '00000000-0000-7000-8000-000000000001'::UUID
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bg_jobs_status
  ON system.background_jobs(status, priority, scheduled_at)
  WHERE status IN ('queued', 'retrying');
CREATE INDEX IF NOT EXISTS idx_bg_jobs_tenant_type
  ON system.background_jobs(tenant_id, job_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_jobs_locked
  ON system.background_jobs(locked_until)
  WHERE status = 'running' AND locked_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bg_jobs_scheduled
  ON system.background_jobs(scheduled_at)
  WHERE status = 'queued';

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.background_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Job acquisition function (atomic claim by worker)
CREATE OR REPLACE FUNCTION system.claim_next_job(
  p_worker_id TEXT,
  p_job_type TEXT DEFAULT NULL,
  p_lock_seconds INT DEFAULT 300
)
RETURNS system.background_jobs AS $$
DECLARE
  v_job system.background_jobs;
BEGIN
  SELECT * INTO v_job
  FROM system.background_jobs
  WHERE status IN ('queued', 'retrying')
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    AND (p_job_type IS NULL OR job_type = p_job_type)
  ORDER BY priority ASC, scheduled_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job.id IS NULL THEN RETURN NULL; END IF;

  UPDATE system.background_jobs SET
    status = 'running',
    started_at = COALESCE(started_at, NOW()),
    locked_by = p_worker_id,
    locked_until = NOW() + (p_lock_seconds || ' seconds')::INTERVAL,
    attempt_count = attempt_count + 1,
    updated_at = NOW()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. NOTIFICATION LOG
--    Tracks every notification sent across all channels
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.notification_log (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  template_id     UUID REFERENCES system.notification_templates(id),
  channel         VARCHAR(20) NOT NULL
    CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
  recipient_id    UUID REFERENCES core.users(id),
  recipient_addr  VARCHAR(500),                    -- email/phone/device token
  subject         VARCHAR(500),
  body_preview    VARCHAR(1000),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'unsubscribed')),
  external_id     VARCHAR(200),                    -- provider message ID
  provider        VARCHAR(50),                     -- 'resend', 'firebase_fcm', 'twilio'
  error           TEXT,
  retry_count     INT DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

-- Default partition
CREATE TABLE IF NOT EXISTS system.notification_log_default
  PARTITION OF system.notification_log DEFAULT;

-- Current quarter
DO $$
DECLARE
  q_start DATE := date_trunc('quarter', NOW())::DATE;
  q_end   DATE := (date_trunc('quarter', NOW()) + INTERVAL '3 months')::DATE;
  part_name TEXT := 'system.notification_log_' || to_char(q_start, 'YYYY') || '_q' ||
                    EXTRACT(QUARTER FROM q_start)::TEXT;
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.notification_log
       FOR VALUES FROM (%L) TO (%L)',
    part_name, q_start, q_end
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- RLS
ALTER TABLE system.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.notification_log
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notif_log_recipient
  ON system.notification_log(tenant_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_status
  ON system.notification_log(status, created_at)
  WHERE status IN ('pending', 'sending', 'failed');
CREATE INDEX IF NOT EXISTS idx_notif_log_channel
  ON system.notification_log(tenant_id, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_template
  ON system.notification_log(template_id, created_at DESC);

-- ════════════════════════════════════════════════════════
-- 5. SYSTEM METRICS (KPI Snapshots)
--    Periodic snapshots for admin dashboard charts
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.system_metrics (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = platform-wide
  metric_name     VARCHAR(200) NOT NULL,           -- 'active_users', 'new_registrations', 'matches_played'
  metric_value    NUMERIC NOT NULL,
  unit            VARCHAR(30) DEFAULT 'count',     -- 'count', 'percent', 'ms', 'bytes'
  dimensions      JSONB DEFAULT '{}',              -- {"role": "athlete", "province": "HCM"}
  period_type     VARCHAR(20) NOT NULL DEFAULT 'daily'
    CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS system.system_metrics_default
  PARTITION OF system.system_metrics DEFAULT;

-- Prevent duplicate snapshots
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_unique_snapshot
  ON system.system_metrics(tenant_id, metric_name, period_type, period_start, recorded_at)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_lookup
  ON system.system_metrics(metric_name, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant
  ON system.system_metrics(tenant_id, metric_name, recorded_at DESC)
  WHERE tenant_id IS NOT NULL;

-- ════════════════════════════════════════════════════════
-- 6. ADMIN ACTIONS LOG
--    Dedicated admin operation log, easy to query
--    (vs generic audit_log which tracks ALL changes)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.admin_actions (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  admin_id        UUID NOT NULL REFERENCES core.users(id),
  action_type     VARCHAR(100) NOT NULL,           -- 'user.create', 'user.deactivate', 'role.assign', 'config.update'
  target_type     VARCHAR(100),                    -- 'user', 'role', 'tenant', 'config', 'feature_flag'
  target_id       UUID,
  target_name     VARCHAR(300),                    -- human-readable for quick display
  description     TEXT,
  severity        VARCHAR(20) DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  changes         JSONB DEFAULT '{}',              -- {"before": {...}, "after": {...}}
  ip_address      INET,
  user_agent      TEXT,
  request_id      VARCHAR(64),                     -- correlate with HTTP request
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS system.admin_actions_default
  PARTITION OF system.admin_actions DEFAULT;

-- RLS
ALTER TABLE system.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.admin_actions
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin
  ON system.admin_actions(tenant_id, admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target
  ON system.admin_actions(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type
  ON system.admin_actions(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_severity
  ON system.admin_actions(severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');

-- ════════════════════════════════════════════════════════
-- 7. ADMIN DASHBOARD VIEWS
-- ════════════════════════════════════════════════════════

-- 7a. KPI Overview — counts, trends, active state
DROP VIEW IF EXISTS system.v_admin_dashboard CASCADE;
CREATE VIEW system.v_admin_dashboard AS
SELECT
  t.id AS tenant_id,
  t.name AS tenant_name,
  -- User stats
  (SELECT count(*) FROM core.users u
     WHERE u.tenant_id = t.id AND u.is_active = true AND u.is_deleted = false
  ) AS active_users,
  (SELECT count(*) FROM core.users u
     WHERE u.tenant_id = t.id AND u.is_deleted = false
       AND u.created_at > NOW() - INTERVAL '7 days'
  ) AS new_users_7d,
  -- Session stats
  (SELECT count(*) FROM core.sessions s
     WHERE s.tenant_id = t.id AND s.expires_at > NOW()
  ) AS active_sessions,
  -- Pending approvals
  (SELECT count(*) FROM core.approval_requests ar
     WHERE ar.tenant_id = t.id AND ar.status IN ('pending', 'in_review')
  ) AS pending_approvals,
  -- Recent admin actions
  (SELECT count(*) FROM system.admin_actions aa
     WHERE aa.tenant_id = t.id AND aa.created_at > NOW() - INTERVAL '24 hours'
  ) AS admin_actions_24h,
  -- Failed logins
  (SELECT count(*) FROM system.login_history lh
     WHERE lh.tenant_id = t.id AND lh.status != 'success'
       AND lh.login_at > NOW() - INTERVAL '24 hours'
  ) AS failed_logins_24h,
  -- Background jobs
  (SELECT count(*) FROM system.background_jobs bj
     WHERE (bj.tenant_id = t.id OR bj.tenant_id IS NULL)
       AND bj.status IN ('queued', 'running')
  ) AS active_jobs,
  -- Notification stats
  (SELECT count(*) FROM system.notification_log nl
     WHERE nl.tenant_id = t.id AND nl.status = 'failed'
       AND nl.created_at > NOW() - INTERVAL '24 hours'
  ) AS failed_notifications_24h,
  NOW() AS snapshot_at
FROM core.tenants t
WHERE t.is_active = true;

-- 7b. System Health — circuit breakers, stale jobs, login anomalies
DROP VIEW IF EXISTS system.v_system_health CASCADE;
CREATE VIEW system.v_system_health AS
SELECT
  -- Circuit breaker status
  (SELECT jsonb_agg(jsonb_build_object(
      'service', service_name,
      'status', status,
      'failures', failure_count,
      'last_failure', last_failure_at
    ))
    FROM system.circuit_breakers
    WHERE status != 'closed'
  ) AS open_circuit_breakers,
  -- Stuck jobs (running > 2x timeout)
  (SELECT count(*)
    FROM system.background_jobs
    WHERE status = 'running'
      AND started_at < NOW() - (timeout_seconds * 2 || ' seconds')::INTERVAL
  ) AS stuck_jobs,
  -- Job queue depth
  (SELECT count(*)
    FROM system.background_jobs
    WHERE status IN ('queued', 'retrying')
  ) AS queued_jobs,
  -- Failed jobs last 24h
  (SELECT count(*)
    FROM system.background_jobs
    WHERE status = 'failed'
      AND completed_at > NOW() - INTERVAL '24 hours'
  ) AS failed_jobs_24h,
  -- Expired API keys still active
  (SELECT count(*)
    FROM system.api_keys
    WHERE is_active = true
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
  ) AS expired_api_keys,
  -- Login failure spike (>10 from same IP in 1 hour)
  (SELECT jsonb_agg(jsonb_build_object(
      'ip', ip_address::TEXT,
      'attempts', cnt
    ))
    FROM (
      SELECT ip_address, count(*) AS cnt
      FROM system.login_history
      WHERE status != 'success'
        AND login_at > NOW() - INTERVAL '1 hour'
      GROUP BY ip_address
      HAVING count(*) > 10
    ) suspicious
  ) AS suspicious_ips,
  -- Feature flags count
  (SELECT count(*) FROM system.feature_flags WHERE is_active = true) AS active_feature_flags,
  -- DB migration version
  (SELECT version FROM system.schema_migrations
     WHERE status = 'applied' ORDER BY version DESC LIMIT 1
  ) AS current_db_version,
  NOW() AS checked_at;

-- ════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Record an admin action (called from Go handlers)
CREATE OR REPLACE FUNCTION system.log_admin_action(
  p_tenant_id UUID,
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_changes JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO system.admin_actions
    (tenant_id, admin_id, action_type, target_type, target_id,
     target_name, description, severity, changes,
     ip_address, request_id)
  VALUES (
    p_tenant_id, p_admin_id, p_action_type, p_target_type, p_target_id,
    p_target_name, p_description, p_severity, p_changes,
    NULLIF(current_setting('app.client_ip', true), '')::INET,
    NULLIF(current_setting('app.request_id', true), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql
SET search_path = system, core, pg_catalog;

-- Expire stale API keys (called by cron/worker)
CREATE OR REPLACE FUNCTION system.expire_api_keys()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE system.api_keys SET
    is_active = false,
    revoked_at = NOW(),
    updated_at = NOW()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql
SET search_path = system, pg_catalog;

-- Release stale job locks (called by cron/worker)
CREATE OR REPLACE FUNCTION system.release_stale_locks()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE system.background_jobs SET
    status = CASE
      WHEN attempt_count >= max_retries THEN 'failed'
      ELSE 'retrying'
    END,
    locked_by = NULL,
    locked_until = NULL,
    error = COALESCE(error, '') || ' [auto-released: lock expired]',
    updated_at = NOW()
  WHERE status = 'running'
    AND locked_until IS NOT NULL
    AND locked_until < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql
SET search_path = system, pg_catalog;

-- ════════════════════════════════════════════════════════
-- 9. SEED DEFAULT SYSTEM PERMISSIONS FOR ADMIN MODULE
-- ════════════════════════════════════════════════════════

INSERT INTO core.permissions (resource, action, description, is_system) VALUES
  ('system', 'manage_api_keys', 'Quản lý API keys', true),
  ('system', 'view_login_history', 'Xem lịch sử đăng nhập', true),
  ('system', 'manage_jobs', 'Quản lý background jobs', true),
  ('system', 'view_notifications', 'Xem log thông báo', true),
  ('system', 'view_metrics', 'Xem metrics hệ thống', true),
  ('system', 'view_admin_actions', 'Xem log thao tác admin', true),
  ('system', 'view_dashboard', 'Xem admin dashboard', true),
  ('system', 'view_system_health', 'Xem system health', true),
  ('system', 'manage_announcements', 'Quản lý thông báo hệ thống', true),
  ('system', 'manage_feature_flags', 'Quản lý feature flags', true)
ON CONFLICT (resource, action) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 10. TABLE COMMENTS
-- ════════════════════════════════════════════════════════

COMMENT ON TABLE system.api_keys IS 'API keys for external integrations. Admin-managed with scopes, rate limits, and usage tracking.';
COMMENT ON TABLE system.login_history IS 'Detailed login/logout history. Partitioned by login_at for efficient retention.';
COMMENT ON TABLE system.background_jobs IS 'Async job queue: emails, reports, imports, matview refresh. Workers claim via system.claim_next_job().';
COMMENT ON TABLE system.notification_log IS 'Log of all notifications sent (email, push, SMS, in-app). Partitioned by created_at.';
COMMENT ON TABLE system.system_metrics IS 'Periodic KPI snapshots for admin dashboard charts. Partitioned by recorded_at.';
COMMENT ON TABLE system.admin_actions IS 'Dedicated log for admin operations. Easier to query than generic audit_log.';

COMMENT ON VIEW system.v_admin_dashboard IS 'Admin dashboard KPIs per tenant: users, sessions, approvals, jobs, notifications.';
COMMENT ON VIEW system.v_system_health IS 'System health overview: circuit breakers, stuck jobs, suspicious IPs, expired keys.';

COMMENT ON FUNCTION system.claim_next_job IS 'Atomically claims the next available background job for a worker. Uses SKIP LOCKED for concurrency.';
COMMENT ON FUNCTION system.log_admin_action IS 'Helper to record admin actions from Go handlers. Auto-captures IP and request ID.';
COMMENT ON FUNCTION system.expire_api_keys IS 'Deactivates API keys past their expiry date. Call from cron/worker.';
COMMENT ON FUNCTION system.release_stale_locks IS 'Releases stale job locks and retries or fails jobs. Call from cron/worker.';

-- ════════════════════════════════════════════════════════
-- 11. REGISTER MIGRATION
-- ════════════════════════════════════════════════════════

INSERT INTO system.schema_migrations (version, name, notes) VALUES
  ('0084', 'system_admin', 'System admin module: API keys, login history, background jobs, notification log, metrics, admin actions, dashboard views')
ON CONFLICT (version) DO NOTHING;

COMMIT;
