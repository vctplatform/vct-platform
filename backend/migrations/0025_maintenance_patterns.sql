-- ===============================================================
-- VCT Platform — Migration 0025: QUERY PATTERNS + MAINTENANCE (6B)
-- Common query functions, partition maintenance, vacuum hints,
-- connection advisory, deadlock prevention
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. PAGINATION HELPERS
--    Cursor-based pagination for large tables
--    (Better than OFFSET which gets slower with depth)
-- ════════════════════════════════════════════════════════

-- Generic cursor pagination info type
DO $$ BEGIN
  CREATE TYPE api_v1.pagination_info AS (
    has_next_page BOOLEAN,
    has_prev_page BOOLEAN,
    total_count BIGINT,
    cursor_value TEXT
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. PARTITION MAINTENANCE
--    Auto-create future partitions, detach/archive old ones
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.maintain_partitions()
RETURNS TABLE (
  parent_table TEXT,
  action TEXT,
  partition_name TEXT,
  range_info TEXT
) AS $$
DECLARE
  v_next_quarter DATE;
  v_next_month DATE;
  v_start TEXT;
  v_end TEXT;
  v_name TEXT;
BEGIN
  -- ── Event Store: create next quarter ──
  v_next_quarter := date_trunc('quarter', NOW() + INTERVAL '3 months');
  v_start := v_next_quarter::TEXT;
  v_end := (v_next_quarter + INTERVAL '3 months')::TEXT;
  v_name := 'tournament.event_store_' ||
    to_char(v_next_quarter, 'YYYY') || '_q' ||
    EXTRACT(QUARTER FROM v_next_quarter)::TEXT;

  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF tournament.event_store FOR VALUES FROM (%L) TO (%L)',
      v_name, v_start, v_end
    );
    parent_table := 'tournament.event_store';
    action := 'created';
    partition_name := v_name;
    range_info := v_start || ' → ' || v_end;
    RETURN NEXT;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;

  -- ── Match Events: create next quarter ──
  v_name := 'tournament.match_events_' ||
    to_char(v_next_quarter, 'YYYY') || '_q' ||
    EXTRACT(QUARTER FROM v_next_quarter)::TEXT;

  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF tournament.match_events FOR VALUES FROM (%L) TO (%L)',
      v_name, v_start, v_end
    );
    parent_table := 'tournament.match_events';
    action := 'created';
    partition_name := v_name;
    range_info := v_start || ' → ' || v_end;
    RETURN NEXT;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;

  -- ── Analytics Daily: create next month ──
  v_next_month := date_trunc('month', NOW() + INTERVAL '1 month');
  v_start := v_next_month::TEXT;
  v_end := (v_next_month + INTERVAL '1 month')::TEXT;
  v_name := 'system.analytics_daily_' ||
    to_char(v_next_month, 'YYYY_MM');

  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.analytics_daily FOR VALUES FROM (%L) TO (%L)',
      v_name, v_start, v_end
    );
    parent_table := 'system.analytics_daily';
    action := 'created';
    partition_name := v_name;
    range_info := v_start || ' → ' || v_end;
    RETURN NEXT;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;

  -- ── Audit Log: create next month ──
  v_name := 'system.audit_log_' ||
    to_char(v_next_month, 'YYYY_MM');

  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF system.audit_log_partitioned FOR VALUES FROM (%L) TO (%L)',
      v_name, v_start, v_end
    );
    parent_table := 'system.audit_log_partitioned';
    action := 'created';
    partition_name := v_name;
    range_info := v_start || ' → ' || v_end;
    RETURN NEXT;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;

  -- ── User Activity: create next month ──
  v_name := 'core.user_activity_' ||
    to_char(v_next_month, 'YYYY_MM');

  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %s PARTITION OF core.user_activity_log FOR VALUES FROM (%L) TO (%L)',
      v_name, v_start, v_end
    );
    parent_table := 'core.user_activity_log';
    action := 'created';
    partition_name := v_name;
    range_info := v_start || ' → ' || v_end;
    RETURN NEXT;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. DATA CLEANUP / ARCHIVAL FUNCTION
--    Executes retention policies defined in 0017
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.execute_retention_policies(
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  policy_table TEXT,
  strategy TEXT,
  rows_affected INT,
  was_dry_run BOOLEAN
) AS $$
DECLARE
  pol RECORD;
  v_count INT;
BEGIN
  FOR pol IN
    SELECT * FROM system.data_retention_policies
    WHERE is_active = true
    ORDER BY table_name
  LOOP
    policy_table := pol.table_name;
    strategy := pol.archive_strategy;
    was_dry_run := p_dry_run;

    IF p_dry_run THEN
      EXECUTE format(
        'SELECT count(*) FROM %s WHERE %s',
        pol.table_name, pol.condition
      ) INTO v_count;
    ELSE
      IF pol.archive_strategy = 'hard_delete_allowed' THEN
        EXECUTE format(
          'DELETE FROM %s WHERE %s',
          pol.table_name, pol.condition
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      ELSIF pol.archive_strategy = 'soft_delete' THEN
        EXECUTE format(
          'UPDATE %s SET is_deleted = true, deleted_at = NOW() WHERE %s AND is_deleted = false',
          pol.table_name, pol.condition
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      END IF;

      -- Update last run info
      UPDATE system.data_retention_policies
      SET last_run_at = NOW(), last_archived = v_count
      WHERE id = pol.id;
    END IF;

    rows_affected := v_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. MATERIALIZED VIEW REFRESH (Concurrent, Safe)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.refresh_all_matviews()
RETURNS TABLE (
  view_name TEXT,
  refresh_time_ms BIGINT,
  status TEXT
) AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_views TEXT[] := ARRAY[
    'api_v1.tournament_dashboard',
    'api_v1.rankings_leaderboard',
    'api_v1.tournament_monthly_stats'
  ];
  v TEXT;
BEGIN
  FOREACH v IN ARRAY v_views LOOP
    view_name := v;
    v_start := clock_timestamp();
    BEGIN
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %s', v);
      refresh_time_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::BIGINT;
      status := 'ok';
    EXCEPTION WHEN OTHERS THEN
      refresh_time_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::BIGINT;
      status := 'error: ' || SQLERRM;
    END;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 5. DEADLOCK PREVENTION ADVISORY
--    Consistent lock ordering function
-- ════════════════════════════════════════════════════════

-- When updating multiple rows, always sort by ID first
-- This prevents AB/BA deadlocks
CREATE OR REPLACE FUNCTION system.lock_rows_in_order(
  p_table TEXT,
  p_ids UUID[]
)
RETURNS VOID AS $$
DECLARE sorted_ids UUID[];
BEGIN
  -- Sort IDs to ensure consistent lock order
  SELECT ARRAY_AGG(id ORDER BY id) INTO sorted_ids
  FROM unnest(p_ids) AS id;

  -- Lock each row in order
  EXECUTE format(
    'SELECT 1 FROM %s WHERE id = ANY($1) ORDER BY id FOR UPDATE',
    p_table
  ) USING sorted_ids;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 6. SESSION CLEANUP FUNCTION
--    Remove expired sessions, consolidate device info
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION core.cleanup_expired_sessions()
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM core.sessions
  WHERE expires_at < NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Also clean legacy sessions
  BEGIN
    DELETE FROM sessions
    WHERE expires_at < NOW() - INTERVAL '1 day';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Add to scheduled tasks
DO $$
BEGIN
  INSERT INTO system.scheduled_tasks (name, description, cron_expression, job_type, is_active)
  VALUES
    ('maintain_partitions', 'Auto-create future partitions', '0 0 * * 0', 'system.maintain_partitions', true),
    ('execute_retention', 'Execute data retention policies', '0 3 * * *', 'system.execute_retention_policies', true),
    ('cleanup_sessions', 'Remove expired sessions', '0 4 * * *', 'core.cleanup_expired_sessions', true);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

COMMIT;
