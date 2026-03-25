-- ===============================================================
-- VCT Platform — Migration 0065: BRIN INDEXES
-- P1 High: Block Range Indexes for large sequential tables
-- 100x smaller than B-tree for time-series columns
-- NOTE: CREATE INDEX cannot run inside a transaction
-- ===============================================================

-- ════════════════════════════════════════════════════════
-- 1. BRIN INDEXES ON created_at COLUMNS
--    Best for naturally ordered data (insert-only / append-like)
--    pages_per_range tuned per table size
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  v_indexes TEXT[] := ARRAY[
    'CREATE INDEX IF NOT EXISTS idx_users_created_brin ON core.users USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_created_brin ON core.sessions USING BRIN (created_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_athletes_created_brin ON athletes USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_combat_matches_created_brin ON combat_matches USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_registrations_created_brin ON registrations USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_payments_created_brin ON platform.payments USING BRIN (created_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_invoices_created_brin ON platform.invoices USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_posts_created_brin ON platform.posts USING BRIN (created_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_comments_created_brin ON platform.comments USING BRIN (created_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_reactions_created_brin ON platform.reactions USING BRIN (created_at) WITH (pages_per_range = 8)',
    'CREATE INDEX IF NOT EXISTS idx_training_sessions_created_brin ON training.training_sessions USING BRIN (session_date) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_enrollments_created_brin ON training.course_enrollments USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_notification_queue_brin ON system.notification_queue USING BRIN (created_at) WITH (pages_per_range = 8)',
    'CREATE INDEX IF NOT EXISTS idx_import_jobs_brin ON system.import_jobs USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_export_jobs_brin ON system.export_jobs USING BRIN (created_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_cdc_outbox_brin ON system.cdc_outbox USING BRIN (created_at) WITH (pages_per_range = 8)',
    'CREATE INDEX IF NOT EXISTS idx_query_cache_brin ON system.query_cache USING BRIN (created_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_techniques_created_brin ON platform.heritage_techniques USING BRIN (created_at) WITH (pages_per_range = 64)',
    'CREATE INDEX IF NOT EXISTS idx_rating_hist_brin ON tournament.rating_history USING BRIN (recorded_at) WITH (pages_per_range = 16)',
    'CREATE INDEX IF NOT EXISTS idx_athletes_updated_brin ON athletes USING BRIN (updated_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_tournaments_updated_brin ON tournaments USING BRIN (updated_at) WITH (pages_per_range = 32)',
    'CREATE INDEX IF NOT EXISTS idx_matches_updated_brin ON combat_matches USING BRIN (updated_at) WITH (pages_per_range = 32)'
  ];
  v_sql TEXT;
  v_ok INT := 0;
  v_skip INT := 0;
BEGIN
  FOREACH v_sql IN ARRAY v_indexes LOOP
    BEGIN
      EXECUTE v_sql;
      v_ok := v_ok + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped BRIN index: %', SQLERRM;
      v_skip := v_skip + 1;
    END;
  END LOOP;
  RAISE NOTICE 'BRIN indexes: % created, % skipped', v_ok, v_skip;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. MONITORING VIEWS (in separate transaction)
-- ════════════════════════════════════════════════════════

BEGIN;

DROP VIEW IF EXISTS system.v_brin_indexes CASCADE;
CREATE VIEW system.v_brin_indexes AS
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
  pg_size_pretty(pg_relation_size((schemaname || '.' || tablename)::regclass)) AS table_size,
  ROUND(
    pg_relation_size(indexname::regclass)::NUMERIC /
    NULLIF(pg_relation_size((schemaname || '.' || tablename)::regclass), 0) * 100, 2
  ) AS index_to_table_pct
FROM pg_indexes
WHERE indexdef LIKE '%USING brin%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

DROP VIEW IF EXISTS system.v_index_size_comparison CASCADE;
CREATE VIEW system.v_index_size_comparison AS
WITH idx AS (
  SELECT
    schemaname || '.' || tablename AS table_name,
    indexname,
    CASE
      WHEN indexdef LIKE '%USING brin%' THEN 'brin'
      WHEN indexdef LIKE '%USING btree%' THEN 'btree'
      WHEN indexdef LIKE '%USING gin%' THEN 'gin'
      WHEN indexdef LIKE '%USING gist%' THEN 'gist'
      WHEN indexdef LIKE '%USING hash%' THEN 'hash'
      ELSE 'unknown'
    END AS index_type,
    pg_relation_size(indexname::regclass) AS size_bytes
  FROM pg_indexes
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
)
SELECT
  table_name,
  index_type,
  count(*) AS index_count,
  pg_size_pretty(sum(size_bytes)) AS total_size,
  pg_size_pretty(avg(size_bytes)::BIGINT) AS avg_size
FROM idx
GROUP BY table_name, index_type
ORDER BY table_name, index_type;

DROP VIEW IF EXISTS system.v_brin_candidates CASCADE;
CREATE VIEW system.v_brin_candidates AS
SELECT
  c.relnamespace::regnamespace || '.' || c.relname AS table_name,
  c.reltuples::BIGINT AS est_rows,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  EXISTS (
    SELECT 1 FROM pg_index idx
    JOIN pg_class ic ON ic.oid = idx.indexrelid
    WHERE idx.indrelid = c.oid
      AND pg_get_indexdef(ic.oid) LIKE '%USING brin%'
  ) AS has_brin,
  EXISTS (
    SELECT 1 FROM pg_attribute att
    WHERE att.attrelid = c.oid AND att.attname = 'created_at'
  ) AS has_created_at
FROM pg_class c
WHERE c.relkind = 'r'
  AND c.relnamespace::regnamespace::TEXT NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND c.reltuples > 1000
ORDER BY c.reltuples DESC;

COMMIT;
