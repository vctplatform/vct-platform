-- ===============================================================
-- VCT Platform — Migration 0052: AUTO-PARTITION + CONNECTION CONFIG
-- P1 High: Automated partition management + DB-level settings
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. AUTO-PARTITION MANAGEMENT FUNCTION
--    Creates future partitions automatically
--    Called by scheduled task monthly
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.ensure_future_partitions(
  p_months_ahead INT DEFAULT 3
)
RETURNS TABLE (
  partition_table TEXT,
  partition_name TEXT,
  date_range TEXT,
  action TEXT
) AS $$
DECLARE
  i INT;
  v_start DATE;
  v_end DATE;
  v_name TEXT;
  v_exists BOOLEAN;
BEGIN
  -- ── Match Events (quarterly partitions) ──
  FOR i IN 0..((p_months_ahead / 3) + 1) LOOP
    v_start := date_trunc('quarter', NOW() + ((i * 3) || ' months')::INTERVAL)::DATE;
    v_end := (v_start + INTERVAL '3 months')::DATE;
    v_name := format('tournament.match_events_%s_q%s',
      extract(YEAR FROM v_start)::INT,
      extract(QUARTER FROM v_start)::INT);

    SELECT EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname || '.' || c.relname = v_name
    ) INTO v_exists;

    IF NOT v_exists THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %s PARTITION OF tournament.match_events
           FOR VALUES FROM (%L) TO (%L)',
          v_name, v_start, v_end);
        partition_table := 'tournament.match_events';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'CREATED';
        RETURN NEXT;
      EXCEPTION WHEN others THEN
        partition_table := 'tournament.match_events';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;

  -- ── Audit Log (monthly partitions) ──
  FOR i IN 0..p_months_ahead LOOP
    v_start := date_trunc('month', NOW() + (i || ' months')::INTERVAL)::DATE;
    v_end := (v_start + INTERVAL '1 month')::DATE;
    v_name := format('system.audit_log_%s_%s',
      extract(YEAR FROM v_start)::INT,
      lpad(extract(MONTH FROM v_start)::INT::TEXT, 2, '0'));

    SELECT EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname || '.' || c.relname = v_name
    ) INTO v_exists;

    IF NOT v_exists THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.audit_log_partitioned
           FOR VALUES FROM (%L) TO (%L)',
          v_name, v_start, v_end);
        partition_table := 'system.audit_log_partitioned';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'CREATED';
        RETURN NEXT;
      EXCEPTION WHEN others THEN
        partition_table := 'system.audit_log_partitioned';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;

  -- ── Analytics Daily (monthly partitions) ──
  FOR i IN 0..p_months_ahead LOOP
    v_start := date_trunc('month', NOW() + (i || ' months')::INTERVAL)::DATE;
    v_end := (v_start + INTERVAL '1 month')::DATE;
    v_name := format('system.analytics_daily_%s_%s',
      extract(YEAR FROM v_start)::INT,
      lpad(extract(MONTH FROM v_start)::INT::TEXT, 2, '0'));

    SELECT EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname || '.' || c.relname = v_name
    ) INTO v_exists;

    IF NOT v_exists THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.analytics_daily
           FOR VALUES FROM (%L) TO (%L)',
          v_name, v_start, v_end);
        partition_table := 'system.analytics_daily';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'CREATED';
        RETURN NEXT;
      EXCEPTION WHEN others THEN
        partition_table := 'system.analytics_daily';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;

  -- ── User Activity Log (monthly partitions) ──
  FOR i IN 0..p_months_ahead LOOP
    v_start := date_trunc('month', NOW() + (i || ' months')::INTERVAL)::DATE;
    v_end := (v_start + INTERVAL '1 month')::DATE;
    v_name := format('core.user_activity_%s_%s',
      extract(YEAR FROM v_start)::INT,
      lpad(extract(MONTH FROM v_start)::INT::TEXT, 2, '0'));

    SELECT EXISTS(
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname || '.' || c.relname = v_name
    ) INTO v_exists;

    IF NOT v_exists THEN
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %s PARTITION OF core.user_activity_log
           FOR VALUES FROM (%L) TO (%L)',
          v_name, v_start, v_end);
        partition_table := 'core.user_activity_log';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'CREATED';
        RETURN NEXT;
      EXCEPTION WHEN others THEN
        partition_table := 'core.user_activity_log';
        partition_name := v_name;
        date_range := v_start || ' → ' || v_end;
        action := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 2. REGISTER PARTITION MAINTENANCE SCHEDULED TASK
-- ════════════════════════════════════════════════════════

INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description, payload)
VALUES (
  'create_future_partitions',
  '0 0 1 * *',          -- 1st of every month at midnight
  'partition_manager',
  'Auto-create partitions for next 3 months across all partitioned tables',
  '{"months_ahead": 3}'
)
ON CONFLICT (name) DO UPDATE SET
  cron_expression = EXCLUDED.cron_expression,
  description = EXCLUDED.description,
  payload = EXCLUDED.payload,
  updated_at = NOW();

-- Run immediately to ensure partitions exist
SELECT * FROM system.ensure_future_partitions(6);

-- ════════════════════════════════════════════════════════
-- 3. CONNECTION & QUERY SAFETY SETTINGS
--    Prevent long-running queries from blocking
-- ════════════════════════════════════════════════════════

-- Statement timeout: 30 seconds max per query
DO $$ BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET statement_timeout = ''30s''';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Idle transaction timeout: 60 seconds
DO $$ BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET idle_in_transaction_session_timeout = ''60s''';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Lock wait timeout: 10 seconds
DO $$ BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET lock_timeout = ''10s''';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. CONNECTION MONITORING VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_connection_stats CASCADE;
CREATE VIEW system.v_connection_stats AS
SELECT
  state,
  count(*) AS count,
  max(NOW() - state_change) AS max_duration,
  avg(NOW() - state_change) AS avg_duration,
  count(*) FILTER (WHERE wait_event_type = 'Lock') AS waiting_on_lock
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid()
GROUP BY state;

-- ════════════════════════════════════════════════════════
-- 5. PARTITION HEALTH CHECK VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_partition_health CASCADE;
CREATE VIEW system.v_partition_health AS
SELECT
  nmsp_parent.nspname  AS parent_schema,
  parent.relname       AS parent_table,
  nmsp_child.nspname   AS partition_schema,
  child.relname        AS partition_name,
  pg_size_pretty(pg_relation_size(child.oid)) AS partition_size,
  pg_stat_get_live_tuples(child.oid) AS live_rows,
  pg_stat_get_dead_tuples(child.oid) AS dead_rows
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
JOIN pg_namespace nmsp_parent ON parent.relnamespace = nmsp_parent.oid
JOIN pg_namespace nmsp_child ON child.relnamespace = nmsp_child.oid
WHERE parent.relkind = 'p'
ORDER BY parent.relname, child.relname;

COMMIT;
