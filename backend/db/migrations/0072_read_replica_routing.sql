-- ===============================================================
-- VCT Platform — Migration 0072: READ REPLICA ROUTING
-- Automatic query routing: SELECT → replica, writes → primary
-- Connection health monitoring and failover support
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. REPLICA REGISTRY
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.replica_registry (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  host            TEXT NOT NULL,
  port            INT DEFAULT 5432,
  role            VARCHAR(20) NOT NULL DEFAULT 'replica'
    CHECK (role IN ('primary', 'replica', 'analytics')),
  region          VARCHAR(50),
  -- Health
  status          VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'degraded', 'offline', 'maintenance')),
  max_lag_seconds INT DEFAULT 30,
  current_lag_ms  INT DEFAULT 0,
  last_health_check TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  -- Config
  max_connections INT DEFAULT 50,
  weight          INT DEFAULT 100,         -- for weighted routing
  accepts_reads   BOOLEAN DEFAULT true,
  accepts_writes  BOOLEAN DEFAULT false,
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.replica_registry
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Seed primary
INSERT INTO system.replica_registry (name, host, port, role, accepts_writes, accepts_reads)
VALUES ('primary', 'localhost', 5432, 'primary', true, true)
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 2. QUERY ROUTING FUNCTION
--    Returns best connection for query type
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.route_query(
  p_query_type TEXT DEFAULT 'read',  -- 'read', 'write', 'analytics'
  p_max_lag_ms INT DEFAULT 5000
)
RETURNS TABLE (
  replica_name TEXT,
  host TEXT,
  port INT,
  lag_ms INT
) AS $$
BEGIN
  IF p_query_type = 'write' THEN
    -- Writes always go to primary
    RETURN QUERY
    SELECT r.name::TEXT, r.host::TEXT, r.port, r.current_lag_ms
    FROM system.replica_registry r
    WHERE r.role = 'primary' AND r.status = 'active'
    LIMIT 1;

  ELSIF p_query_type = 'analytics' THEN
    -- Analytics prefer dedicated analytics replicas
    RETURN QUERY
    SELECT r.name::TEXT, r.host::TEXT, r.port, r.current_lag_ms
    FROM system.replica_registry r
    WHERE r.role IN ('analytics', 'replica')
      AND r.status = 'active'
      AND r.accepts_reads = true
      AND r.current_lag_ms <= p_max_lag_ms
    ORDER BY
      CASE r.role WHEN 'analytics' THEN 0 ELSE 1 END,
      r.current_lag_ms
    LIMIT 1;

  ELSE
    -- Reads: pick best replica by lag + weight
    RETURN QUERY
    SELECT r.name::TEXT, r.host::TEXT, r.port, r.current_lag_ms
    FROM system.replica_registry r
    WHERE r.status = 'active'
      AND r.accepts_reads = true
      AND r.current_lag_ms <= p_max_lag_ms
    ORDER BY
      CASE r.role WHEN 'replica' THEN 0 ELSE 1 END,
      r.current_lag_ms,
      r.weight DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 3. HEALTH CHECK FUNCTION
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.check_replica_health()
RETURNS TABLE (
  replica_name TEXT,
  status TEXT,
  lag_ms INT,
  action_taken TEXT
) AS $$
DECLARE r RECORD; v_lag INT;
BEGIN
  FOR r IN SELECT * FROM system.replica_registry WHERE status != 'maintenance' LOOP
    replica_name := r.name;

    -- For primary, lag is always 0
    IF r.role = 'primary' THEN
      lag_ms := 0;
      status := 'active';
      action_taken := 'none';
    ELSE
      -- Check replication lag from pg_stat_replication (if on primary)
      BEGIN
        SELECT EXTRACT(MILLISECONDS FROM replay_lag)::INT INTO v_lag
        FROM pg_stat_replication
        WHERE client_addr = r.host::INET
        LIMIT 1;
        lag_ms := COALESCE(v_lag, r.current_lag_ms);
      EXCEPTION WHEN OTHERS THEN
        lag_ms := r.current_lag_ms;
      END;

      -- Determine status based on lag
      IF lag_ms > r.max_lag_seconds * 1000 THEN
        status := 'degraded';
        action_taken := 'marked_degraded';
        UPDATE system.replica_registry SET
          status = 'degraded', current_lag_ms = lag_ms,
          consecutive_failures = consecutive_failures + 1,
          last_health_check = NOW()
        WHERE id = r.id;
      ELSE
        status := 'active';
        action_taken := 'healthy';
        UPDATE system.replica_registry SET
          status = 'active', current_lag_ms = lag_ms,
          consecutive_failures = 0,
          last_health_check = NOW()
        WHERE id = r.id;
      END IF;
    END IF;

    -- Auto-offline if too many failures
    IF r.consecutive_failures >= 5 THEN
      UPDATE system.replica_registry SET status = 'offline' WHERE id = r.id;
      status := 'offline';
      action_taken := 'auto_offline_after_5_failures';

      PERFORM pg_notify('replica_health', json_build_object(
        'replica', r.name, 'status', 'offline',
        'failures', r.consecutive_failures
      )::TEXT);
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule health check every minute
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description)
VALUES ('check_replica_health', '* * * * *', 'replica_monitor',
        'Check replica lag and update status every minute')
ON CONFLICT (name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 4. CONNECTION POOL STATS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_replica_dashboard CASCADE;
CREATE VIEW system.v_replica_dashboard AS
SELECT
  r.name,
  r.role,
  r.status,
  r.host || ':' || r.port AS endpoint,
  r.region,
  r.current_lag_ms,
  r.max_lag_seconds * 1000 AS max_lag_ms,
  CASE WHEN r.max_lag_seconds * 1000 > 0
    THEN round(r.current_lag_ms::NUMERIC / (r.max_lag_seconds * 1000) * 100, 1)
    ELSE 0
  END AS lag_pct,
  r.weight,
  r.max_connections,
  r.consecutive_failures,
  r.last_health_check,
  r.accepts_reads,
  r.accepts_writes
FROM system.replica_registry r
ORDER BY
  CASE r.role WHEN 'primary' THEN 0 WHEN 'replica' THEN 1 ELSE 2 END,
  r.name;

-- ════════════════════════════════════════════════════════
-- 5. READ-WRITE SPLITTING ADVISORY VIEW
--    Helps Go backend decide connection routing
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_routing_advice CASCADE;
CREATE VIEW system.v_routing_advice AS
SELECT
  'read' AS query_type,
  (SELECT name FROM system.replica_registry
   WHERE status = 'active' AND accepts_reads = true
   ORDER BY CASE role WHEN 'replica' THEN 0 ELSE 1 END, current_lag_ms
   LIMIT 1) AS recommended_replica,
  (SELECT count(*) FROM system.replica_registry
   WHERE status = 'active' AND accepts_reads = true) AS available_replicas
UNION ALL
SELECT
  'write' AS query_type,
  (SELECT name FROM system.replica_registry
   WHERE role = 'primary' AND status = 'active') AS recommended_replica,
  (SELECT count(*) FROM system.replica_registry
   WHERE role = 'primary' AND status = 'active') AS available_replicas
UNION ALL
SELECT
  'analytics' AS query_type,
  (SELECT name FROM system.replica_registry
   WHERE role IN ('analytics', 'replica') AND status = 'active'
   ORDER BY CASE role WHEN 'analytics' THEN 0 ELSE 1 END
   LIMIT 1) AS recommended_replica,
  (SELECT count(*) FROM system.replica_registry
   WHERE role IN ('analytics', 'replica') AND status = 'active') AS available_replicas;

COMMIT;
