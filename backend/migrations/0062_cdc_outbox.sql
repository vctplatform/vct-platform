-- ===============================================================
-- VCT Platform — Migration 0062: CHANGE DATA CAPTURE (CDC)
-- P1 High: Logical decoding publications + CDC outbox
-- for streaming database changes to external systems
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. CDC OUTBOX TABLE
--    Captures changes for downstream consumers
--    (MeiliSearch, analytics, notification dispatch)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.cdc_outbox (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        UUID DEFAULT uuidv7() NOT NULL UNIQUE,
  aggregate_type  VARCHAR(100) NOT NULL,   -- 'athlete', 'tournament', 'match'
  aggregate_id    UUID NOT NULL,
  event_type      VARCHAR(50) NOT NULL,    -- 'created', 'updated', 'deleted'
  tenant_id       UUID,
  -- Payload
  payload         JSONB NOT NULL,          -- new state
  old_payload     JSONB,                   -- previous state (for updates)
  -- Processing
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts        INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message   TEXT,
  -- Routing
  target_systems  TEXT[] DEFAULT '{}',     -- ['meilisearch', 'analytics', 'webhook']
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cdc_outbox_pending
  ON system.cdc_outbox(status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cdc_outbox_aggregate
  ON system.cdc_outbox(aggregate_type, aggregate_id);

-- ════════════════════════════════════════════════════════
-- 2. CDC SUBSCRIPTIONS TABLE
--    Define which consumers listen to which events
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.cdc_subscriptions (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(200) NOT NULL UNIQUE,
  consumer_type   VARCHAR(50) NOT NULL,    -- 'meilisearch', 'analytics', 'webhook', 'notification'
  -- Filter
  aggregate_types TEXT[] NOT NULL,          -- ['athlete', 'tournament']
  event_types     TEXT[] DEFAULT ARRAY['created', 'updated', 'deleted'],
  -- Connection
  endpoint_url    TEXT,                     -- for webhook consumers
  config          JSONB DEFAULT '{}',      -- consumer-specific config
  -- Status
  is_active       BOOLEAN DEFAULT true,
  last_offset     BIGINT DEFAULT 0,        -- last processed outbox id
  last_sync_at    TIMESTAMPTZ,
  error_count     INT DEFAULT 0,
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.cdc_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 3. CDC TRIGGER FUNCTION
--    Automatically captures INSERT/UPDATE/DELETE into outbox
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_cdc_capture()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_payload JSONB;
  v_old_payload JSONB;
  v_aggregate_type TEXT;
  v_aggregate_id UUID;
  v_tenant_id UUID;
  v_target_systems TEXT[];
BEGIN
  -- Determine event type
  v_event_type := CASE TG_OP
    WHEN 'INSERT' THEN 'created'
    WHEN 'UPDATE' THEN 'updated'
    WHEN 'DELETE' THEN 'deleted'
  END;

  -- Map table to aggregate type
  v_aggregate_type := CASE TG_TABLE_NAME
    WHEN 'athletes' THEN 'athlete'
    WHEN 'tournaments' THEN 'tournament'
    WHEN 'combat_matches' THEN 'match'
    WHEN 'teams' THEN 'team'
    WHEN 'clubs' THEN 'club'
    ELSE TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME
  END;

  -- Get appropriate target systems from subscriptions
  SELECT ARRAY_AGG(DISTINCT s.consumer_type) INTO v_target_systems
  FROM system.cdc_subscriptions s
  WHERE s.is_active = true
    AND v_aggregate_type = ANY(s.aggregate_types)
    AND v_event_type = ANY(s.event_types);

  -- Skip if no subscribers
  IF v_target_systems IS NULL OR array_length(v_target_systems, 1) = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build payload
  IF TG_OP = 'DELETE' THEN
    v_payload := to_jsonb(OLD);
    v_aggregate_id := OLD.id;
    v_tenant_id := OLD.tenant_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_payload := to_jsonb(NEW);
    v_old_payload := to_jsonb(OLD);
    v_aggregate_id := NEW.id;
    v_tenant_id := NEW.tenant_id;
  ELSE
    v_payload := to_jsonb(NEW);
    v_aggregate_id := NEW.id;
    v_tenant_id := NEW.tenant_id;
  END IF;

  -- Insert into outbox
  INSERT INTO system.cdc_outbox
    (aggregate_type, aggregate_id, event_type, tenant_id,
     payload, old_payload, target_systems)
  VALUES
    (v_aggregate_type, v_aggregate_id, v_event_type, v_tenant_id,
     v_payload, v_old_payload, v_target_systems);

  -- Notify workers
  PERFORM pg_notify('cdc_events', json_build_object(
    'aggregate_type', v_aggregate_type,
    'aggregate_id', v_aggregate_id,
    'event_type', v_event_type,
    'tenant_id', v_tenant_id
  )::TEXT);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. ATTACH CDC TRIGGERS TO KEY TABLES
-- ════════════════════════════════════════════════════════

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'athletes', 'tournaments', 'combat_matches', 'teams', 'clubs'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER cdc_capture
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION trigger_cdc_capture()',
        tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. CDC OUTBOX PROCESSOR FUNCTION
--    Pull pending events + mark as processing
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.cdc_pull_events(
  p_consumer TEXT,
  p_batch_size INT DEFAULT 100
)
RETURNS TABLE (
  event_id UUID,
  aggregate_type TEXT,
  aggregate_id UUID,
  event_type TEXT,
  payload JSONB,
  old_payload JSONB,
  tenant_id UUID
) AS $$
BEGIN
  RETURN QUERY
  UPDATE system.cdc_outbox SET
    status = 'processing',
    last_attempt_at = NOW(),
    attempts = attempts + 1
  WHERE id IN (
    SELECT o.id FROM system.cdc_outbox o
    WHERE o.status = 'pending'
      AND p_consumer = ANY(o.target_systems)
    ORDER BY o.id
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    system.cdc_outbox.event_id,
    system.cdc_outbox.aggregate_type::TEXT,
    system.cdc_outbox.aggregate_id,
    system.cdc_outbox.event_type::TEXT,
    system.cdc_outbox.payload,
    system.cdc_outbox.old_payload,
    system.cdc_outbox.tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Acknowledge events as processed
CREATE OR REPLACE FUNCTION system.cdc_ack_events(p_event_ids UUID[])
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  UPDATE system.cdc_outbox SET
    status = 'sent',
    processed_at = NOW()
  WHERE event_id = ANY(p_event_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Fail events with error message
CREATE OR REPLACE FUNCTION system.cdc_fail_events(p_event_ids UUID[], p_error TEXT)
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  UPDATE system.cdc_outbox SET
    status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
    error_message = p_error
  WHERE event_id = ANY(p_event_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 6. SEED DEFAULT SUBSCRIBERS
-- ════════════════════════════════════════════════════════

INSERT INTO system.cdc_subscriptions (name, consumer_type, aggregate_types, event_types, config)
VALUES
  ('search_indexer', 'meilisearch',
   ARRAY['athlete', 'tournament', 'club', 'team'],
   ARRAY['created', 'updated', 'deleted'],
   '{"index_prefix": "vct_"}'::JSONB),
  ('analytics_pipeline', 'analytics',
   ARRAY['athlete', 'tournament', 'match'],
   ARRAY['created', 'updated'],
   '{"batch_size": 500}'::JSONB),
  ('notification_dispatcher', 'notification',
   ARRAY['tournament', 'match'],
   ARRAY['created', 'updated'],
   '{"channels": ["push", "email"]}'::JSONB)
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 7. CDC MONITORING VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_cdc_stats CASCADE;
CREATE VIEW system.v_cdc_stats AS
SELECT
  aggregate_type,
  status,
  count(*) AS event_count,
  min(created_at) AS oldest_event,
  max(created_at) AS newest_event,
  avg(attempts) AS avg_attempts
FROM system.cdc_outbox
GROUP BY aggregate_type, status
ORDER BY aggregate_type, status;

-- CDC lag view (events awaiting processing)
DROP VIEW IF EXISTS system.v_cdc_lag CASCADE;
CREATE VIEW system.v_cdc_lag AS
SELECT
  s.name AS subscription,
  s.consumer_type,
  s.last_offset,
  COALESCE(max(o.id), 0) AS current_offset,
  COALESCE(max(o.id), 0) - s.last_offset AS lag_events,
  s.last_sync_at,
  EXTRACT(EPOCH FROM NOW() - s.last_sync_at)::INT AS lag_seconds
FROM system.cdc_subscriptions s
LEFT JOIN system.cdc_outbox o ON TRUE
WHERE s.is_active = true
GROUP BY s.name, s.consumer_type, s.last_offset, s.last_sync_at;

-- Cleanup old processed events
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description, payload)
VALUES ('cdc_cleanup', '0 2 * * *', 'cdc_manager',
        'Remove processed CDC events older than 7 days',
        '{"retention_days": 7}'::JSONB)
ON CONFLICT (name) DO NOTHING;

COMMIT;
