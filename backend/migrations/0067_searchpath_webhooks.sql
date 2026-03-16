-- ===============================================================
-- VCT Platform — Migration 0067: SEARCH PATH + DB WEBHOOKS
-- P2 Medium: Dynamic search_path + event-driven webhooks from DB
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SCHEMA ACCESS MATRIX
--    Defines which roles can access which schemas
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.schema_access_matrix (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  role_name       VARCHAR(100) NOT NULL,
  schema_name     VARCHAR(100) NOT NULL,
  access_level    VARCHAR(20) NOT NULL DEFAULT 'read'
    CHECK (access_level IN ('none', 'read', 'write', 'admin')),
  search_priority INT DEFAULT 100,        -- lower = higher priority in search_path
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_name, schema_name)
);

-- Seed default access matrix
INSERT INTO system.schema_access_matrix (role_name, schema_name, access_level, search_priority) VALUES
  -- Admin sees everything
  ('admin', 'public', 'admin', 10),
  ('admin', 'core', 'admin', 20),
  ('admin', 'tournament', 'admin', 30),
  ('admin', 'platform', 'admin', 40),
  ('admin', 'people', 'admin', 50),
  ('admin', 'training', 'admin', 60),
  ('admin', 'system', 'admin', 70),
  ('admin', 'api_v1', 'admin', 5),
  ('admin', 'temporal', 'read', 80),
  ('admin', 'archive', 'read', 90),
  -- API role
  ('api', 'api_v1', 'read', 5),
  ('api', 'public', 'write', 10),
  ('api', 'core', 'write', 20),
  ('api', 'tournament', 'write', 30),
  ('api', 'platform', 'write', 40),
  ('api', 'people', 'write', 50),
  ('api', 'training', 'write', 60),
  -- Read-only
  ('readonly', 'api_v1', 'read', 5),
  ('readonly', 'public', 'read', 10),
  -- Scoring
  ('scoring', 'api_v1', 'read', 5),
  ('scoring', 'tournament', 'write', 10),
  ('scoring', 'public', 'read', 20)
ON CONFLICT (role_name, schema_name) DO NOTHING;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.schema_access_matrix
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. DYNAMIC SEARCH PATH FUNCTION
--    Set search_path based on current user's role
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.set_search_path_for_role(p_role TEXT)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT string_agg(schema_name, ', ' ORDER BY search_priority)
  INTO v_path
  FROM system.schema_access_matrix
  WHERE role_name = p_role
    AND is_active = true
    AND access_level != 'none';

  IF v_path IS NOT NULL THEN
    EXECUTE format('SET search_path TO %s', v_path);
  END IF;

  RETURN COALESCE(v_path, 'public');
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. TENANT-SPECIFIC SCHEMA CONFIG
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.tenant_schema_config (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  default_schema  VARCHAR(100) DEFAULT 'public',
  extra_schemas   TEXT[] DEFAULT '{}',     -- additional schemas for this tenant
  custom_search_path TEXT,                 -- override search_path
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id)
);

ALTER TABLE system.tenant_schema_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.tenant_schema_config
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.tenant_schema_config
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 4. DATABASE EVENT WEBHOOKS
--    Fire HTTP-like events from database changes
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.db_webhooks (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(200) NOT NULL UNIQUE,
  -- Trigger conditions
  source_table    VARCHAR(200) NOT NULL,   -- 'athletes', 'tournaments'
  event_types     TEXT[] NOT NULL DEFAULT ARRAY['INSERT', 'UPDATE', 'DELETE'],
  condition_sql   TEXT,                     -- optional WHERE clause
  -- Target
  endpoint_url    TEXT NOT NULL,
  http_method     VARCHAR(10) DEFAULT 'POST',
  headers         JSONB DEFAULT '{"Content-Type": "application/json"}',
  -- Config
  is_active       BOOLEAN DEFAULT true,
  retry_count     INT DEFAULT 3,
  retry_delay_seconds INT DEFAULT 30,
  timeout_seconds INT DEFAULT 10,
  tenant_id       UUID,                    -- NULL = all tenants
  -- Stats
  total_sent      BIGINT DEFAULT 0,
  total_failed    BIGINT DEFAULT 0,
  last_sent_at    TIMESTAMPTZ,
  last_error      TEXT,
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.db_webhooks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 5. WEBHOOK EVENT QUEUE
--    Outbox pattern for webhook delivery
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.webhook_events (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  webhook_id      UUID NOT NULL REFERENCES system.db_webhooks(id) ON DELETE CASCADE,
  event_type      VARCHAR(10) NOT NULL,
  payload         JSONB NOT NULL,
  -- Delivery status
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'delivered', 'failed', 'expired')),
  attempts        INT DEFAULT 0,
  next_retry_at   TIMESTAMPTZ,
  last_response   INT,                     -- HTTP status code
  last_error      TEXT,
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_pending
  ON system.webhook_events(status, next_retry_at)
  WHERE status IN ('pending', 'sending');

-- ════════════════════════════════════════════════════════
-- 6. WEBHOOK TRIGGER FUNCTION
--    Captures table changes and queues webhook events
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_queue_webhook()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook RECORD;
  v_payload JSONB;
  v_tenant_id UUID;
BEGIN
  -- Build payload
  v_payload := jsonb_build_object(
    'event', TG_OP,
    'table', TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    'timestamp', NOW()
  );

  IF TG_OP = 'DELETE' THEN
    v_payload := v_payload || jsonb_build_object('data', to_jsonb(OLD));
    v_tenant_id := OLD.tenant_id;
  ELSE
    v_payload := v_payload || jsonb_build_object('data', to_jsonb(NEW));
    v_tenant_id := NEW.tenant_id;
    IF TG_OP = 'UPDATE' THEN
      v_payload := v_payload || jsonb_build_object('old_data', to_jsonb(OLD));
    END IF;
  END IF;

  -- Find matching webhooks
  FOR v_webhook IN
    SELECT id FROM system.db_webhooks
    WHERE source_table = TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME
      AND TG_OP = ANY(event_types)
      AND is_active = true
      AND (tenant_id IS NULL OR tenant_id = v_tenant_id)
  LOOP
    INSERT INTO system.webhook_events (webhook_id, event_type, payload)
    VALUES (v_webhook.id, TG_OP, v_payload);
  END LOOP;

  -- Notify webhook processor
  IF FOUND THEN
    PERFORM pg_notify('webhook_events', json_build_object(
      'table', TG_TABLE_NAME, 'event', TG_OP
    )::TEXT);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 7. WEBHOOK PROCESSING FUNCTION (pull + deliver)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.process_webhook_queue(
  p_batch_size INT DEFAULT 50
)
RETURNS TABLE (
  event_id BIGINT,
  webhook_name TEXT,
  status TEXT
) AS $$
DECLARE
  v_event RECORD;
BEGIN
  FOR v_event IN
    SELECT we.id, we.webhook_id, we.payload, we.attempts,
           dw.name, dw.endpoint_url, dw.retry_count
    FROM system.webhook_events we
    JOIN system.db_webhooks dw ON dw.id = we.webhook_id
    WHERE we.status = 'pending'
      AND (we.next_retry_at IS NULL OR we.next_retry_at <= NOW())
    ORDER BY we.id
    LIMIT p_batch_size
    FOR UPDATE OF we SKIP LOCKED
  LOOP
    -- Mark as sending
    UPDATE system.webhook_events SET
      status = 'sending', attempts = attempts + 1
    WHERE id = v_event.id;

    -- Actual HTTP call must be done by Go backend
    -- Here we just prepare the event for pickup
    event_id := v_event.id;
    webhook_name := v_event.name;
    status := 'ready_for_delivery';
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 8. WEBHOOK STATS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_webhook_stats CASCADE;
CREATE VIEW system.v_webhook_stats AS
SELECT
  dw.name AS webhook_name,
  dw.source_table,
  dw.endpoint_url,
  dw.is_active,
  dw.total_sent,
  dw.total_failed,
  dw.last_sent_at,
  count(we.id) FILTER (WHERE we.status = 'pending') AS pending_events,
  count(we.id) FILTER (WHERE we.status = 'failed') AS failed_events,
  count(we.id) FILTER (WHERE we.status = 'delivered') AS delivered_events
FROM system.db_webhooks dw
LEFT JOIN system.webhook_events we ON we.webhook_id = dw.id
GROUP BY dw.id;

COMMIT;
