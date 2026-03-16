-- ===============================================================
-- VCT Platform — Migration 0057: DATA ARCHIVAL PIPELINE
-- P2 Medium: Execute retention policies, archive old data,
-- cleanup expired resources
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ARCHIVE TABLES
--    Cold storage for data past retention period
-- ════════════════════════════════════════════════════════

-- Archive schema
CREATE SCHEMA IF NOT EXISTS archive;

-- Generic archive table (stores any archived data as JSONB)
CREATE TABLE IF NOT EXISTS archive.archived_records (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  source_table    VARCHAR(200) NOT NULL,
  source_id       UUID NOT NULL,
  record_data     JSONB NOT NULL,
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by     VARCHAR(100) DEFAULT 'system',
  retention_policy_id UUID,
  original_created_at TIMESTAMPTZ,
  PRIMARY KEY (archived_at, tenant_id, id)
) PARTITION BY RANGE (archived_at);

-- Quarterly archive partitions
DO $$
DECLARE
  q INT; y INT;
  v_start DATE; v_end DATE;
BEGIN
  FOR y IN 2026..2027 LOOP
    FOR q IN 1..4 LOOP
      v_start := make_date(y, (q-1)*3 + 1, 1);
      v_end := CASE WHEN q = 4 THEN make_date(y+1, 1, 1)
               ELSE make_date(y, q*3 + 1, 1) END;
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS archive.archived_%s_q%s
         PARTITION OF archive.archived_records
         FOR VALUES FROM (%L) TO (%L)',
        y, q, v_start, v_end);
    END LOOP;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS archive.archived_default
  PARTITION OF archive.archived_records DEFAULT;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_archive_source
  ON archive.archived_records(source_table, source_id);

CREATE INDEX IF NOT EXISTS idx_archive_tenant
  ON archive.archived_records(tenant_id, archived_at DESC);

-- ════════════════════════════════════════════════════════
-- 2. RETENTION EXECUTION FUNCTION
--    Processes all active retention policies
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.execute_retention_policies(
  p_dry_run BOOLEAN DEFAULT true,
  p_batch_size INT DEFAULT 1000
)
RETURNS TABLE (
  policy_table TEXT,
  strategy TEXT,
  records_affected INT,
  action_taken TEXT
) AS $$
DECLARE
  policy RECORD;
  v_count INT;
  v_sql TEXT;
BEGIN
  FOR policy IN
    SELECT * FROM system.data_retention_policies
    WHERE is_active = true
    ORDER BY retention_days ASC  -- process shortest retention first
  LOOP
    v_count := 0;
    policy_table := policy.table_name;
    strategy := policy.archive_strategy;

    IF p_dry_run THEN
      -- DRY RUN: just count affected rows
      BEGIN
        v_sql := format('SELECT count(*) FROM %s WHERE %s',
          policy.table_name, policy.condition);
        EXECUTE v_sql INTO v_count;

        records_affected := v_count;
        action_taken := 'DRY_RUN: would process ' || v_count || ' rows';
        RETURN NEXT;
      EXCEPTION WHEN others THEN
        records_affected := 0;
        action_taken := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    ELSE
      -- EXECUTE: perform actual archival/deletion
      BEGIN
        CASE policy.archive_strategy
          WHEN 'hard_delete_allowed' THEN
            v_sql := format(
              'DELETE FROM %s WHERE %s LIMIT %s',
              policy.table_name, policy.condition, p_batch_size);
            -- PostgreSQL doesn't support DELETE...LIMIT, use CTE
            v_sql := format(
              'WITH to_delete AS (
                SELECT ctid FROM %s WHERE %s LIMIT %s
              )
              DELETE FROM %s WHERE ctid IN (SELECT ctid FROM to_delete)',
              policy.table_name, policy.condition, p_batch_size,
              policy.table_name);
            EXECUTE v_sql;
            GET DIAGNOSTICS v_count = ROW_COUNT;
            action_taken := 'hard_deleted';

          WHEN 'soft_delete' THEN
            v_sql := format(
              'WITH to_soft AS (
                SELECT ctid FROM %s WHERE %s AND is_deleted = false LIMIT %s
              )
              UPDATE %s SET is_deleted = true, deleted_at = NOW()
              WHERE ctid IN (SELECT ctid FROM to_soft)',
              policy.table_name, policy.condition, p_batch_size,
              policy.table_name);
            EXECUTE v_sql;
            GET DIAGNOSTICS v_count = ROW_COUNT;
            action_taken := 'soft_deleted';

          WHEN 'move_to_archive' THEN
            -- Step 1: Copy to archive
            v_sql := format(
              'WITH to_archive AS (
                SELECT ctid, * FROM %s WHERE %s LIMIT %s
              )
              INSERT INTO archive.archived_records
                (tenant_id, source_table, source_id, record_data,
                 original_created_at, retention_policy_id)
              SELECT
                tenant_id, %L, id, to_jsonb(ta.*) - ''ctid'',
                created_at, %L
              FROM to_archive ta',
              policy.table_name, policy.condition, p_batch_size,
              policy.table_name, policy.id);
            EXECUTE v_sql;
            GET DIAGNOSTICS v_count = ROW_COUNT;

            -- Step 2: Delete originals
            IF v_count > 0 THEN
              v_sql := format(
                'WITH to_remove AS (
                  SELECT ctid FROM %s WHERE %s LIMIT %s
                )
                DELETE FROM %s WHERE ctid IN (SELECT ctid FROM to_remove)',
                policy.table_name, policy.condition, p_batch_size,
                policy.table_name);
              EXECUTE v_sql;
            END IF;
            action_taken := 'archived_and_deleted';

          ELSE
            v_count := 0;
            action_taken := 'unknown_strategy';
        END CASE;

        -- Update policy metadata
        UPDATE system.data_retention_policies
        SET last_run_at = NOW(),
            last_archived = v_count,
            updated_at = NOW()
        WHERE id = policy.id;

      EXCEPTION WHEN others THEN
        v_count := 0;
        action_taken := 'ERROR: ' || SQLERRM;
      END;

      records_affected := v_count;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 3. REGISTER ARCHIVAL SCHEDULED TASK
-- ════════════════════════════════════════════════════════

INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description, payload)
VALUES (
  'execute_retention_policies',
  '0 2 * * *',           -- 2 AM daily
  'retention_executor',
  'Execute data retention policies (archive/delete old data)',
  '{"dry_run": false, "batch_size": 5000}'
)
ON CONFLICT (name) DO UPDATE SET
  cron_expression = EXCLUDED.cron_expression,
  description = EXCLUDED.description,
  payload = EXCLUDED.payload,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════
-- 4. ARCHIVE STATS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_archive_stats CASCADE;
CREATE VIEW system.v_archive_stats AS
SELECT
  source_table,
  count(*) AS archived_count,
  min(archived_at) AS earliest_archived,
  max(archived_at) AS latest_archived,
  pg_size_pretty(
    sum(pg_column_size(record_data))
  ) AS data_size
FROM archive.archived_records
GROUP BY source_table
ORDER BY count(*) DESC;

-- ════════════════════════════════════════════════════════
-- 5. RETENTION POLICY STATUS VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_retention_status CASCADE;
CREATE VIEW system.v_retention_status AS
SELECT
  rp.table_name,
  rp.retention_days,
  rp.archive_strategy,
  rp.is_active,
  rp.last_run_at,
  rp.last_archived,
  CASE
    WHEN rp.last_run_at IS NULL THEN 'NEVER_RUN'
    WHEN rp.last_run_at < NOW() - INTERVAL '2 days' THEN 'OVERDUE'
    ELSE 'OK'
  END AS run_status,
  NOW() - rp.last_run_at AS time_since_last_run
FROM system.data_retention_policies rp
ORDER BY rp.last_run_at ASC NULLS FIRST;

COMMIT;
