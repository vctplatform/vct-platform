-- ===============================================================
-- VCT Platform — Migration 0056: OBSERVABILITY VIEWS
-- P2 Medium: Slow queries, table bloat, lock monitoring,
-- index health, overall system dashboard
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SLOW QUERIES VIEW (requires pg_stat_statements)
-- ════════════════════════════════════════════════════════

-- Ensure extension is available
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

DROP VIEW IF EXISTS system.v_slow_queries CASCADE;
CREATE VIEW system.v_slow_queries AS
SELECT
  queryid,
  left(query, 200) AS query_preview,
  calls,
  ROUND(mean_exec_time::NUMERIC, 2) AS avg_ms,
  ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
  rows,
  ROUND(shared_blks_hit::NUMERIC /
    NULLIF(shared_blks_hit + shared_blks_read, 0) * 100, 2
  ) AS cache_hit_pct,
  shared_blks_read AS disk_reads,
  shared_blks_written AS disk_writes
FROM pg_stat_statements
WHERE mean_exec_time > 50   -- > 50ms average
  AND calls > 5              -- at least 5 executions
  AND query NOT LIKE '%pg_stat%'
  AND query NOT LIKE '%system.%'
ORDER BY mean_exec_time DESC
LIMIT 50;

-- ════════════════════════════════════════════════════════
-- 2. TABLE BLOAT DETECTION
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_table_bloat CASCADE;
CREATE VIEW system.v_table_bloat AS
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE WHEN n_live_tup > 0
    THEN ROUND(n_dead_tup::NUMERIC / n_live_tup * 100, 2)
    ELSE 0
  END AS bloat_pct,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size,
  last_autovacuum,
  last_autoanalyze,
  CASE
    WHEN n_dead_tup > n_live_tup * 0.2 THEN 'CRITICAL'
    WHEN n_dead_tup > n_live_tup * 0.1 THEN 'WARNING'
    ELSE 'OK'
  END AS health
FROM pg_stat_user_tables
WHERE n_live_tup > 100  -- skip tiny tables
ORDER BY n_dead_tup DESC;

-- ════════════════════════════════════════════════════════
-- 3. LOCK CONFLICT MONITORING
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_lock_conflicts CASCADE;
CREATE VIEW system.v_lock_conflicts AS
SELECT
  blocked.pid AS blocked_pid,
  blocked.usename AS blocked_user,
  blocking.pid AS blocking_pid,
  blocking.usename AS blocking_user,
  left(blocked.query, 150) AS blocked_query,
  left(blocking.query, 150) AS blocking_query,
  NOW() - blocked.query_start AS blocked_duration,
  blocked.wait_event_type,
  blocked.wait_event,
  blocked.state AS blocked_state
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks bk ON bk.locktype = bl.locktype
  AND bk.database IS NOT DISTINCT FROM bl.database
  AND bk.relation IS NOT DISTINCT FROM bl.relation
  AND bk.page IS NOT DISTINCT FROM bl.page
  AND bk.tuple IS NOT DISTINCT FROM bl.tuple
  AND bk.virtualxid IS NOT DISTINCT FROM bl.virtualxid
  AND bk.transactionid IS NOT DISTINCT FROM bl.transactionid
  AND bk.classid IS NOT DISTINCT FROM bl.classid
  AND bk.objid IS NOT DISTINCT FROM bl.objid
  AND bk.objsubid IS NOT DISTINCT FROM bl.objsubid
  AND bk.pid != bl.pid
  AND bk.granted
JOIN pg_stat_activity blocking ON bk.pid = blocking.pid
ORDER BY blocked_duration DESC;

-- ════════════════════════════════════════════════════════
-- 4. INDEX HEALTH & USAGE
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_index_health CASCADE;
CREATE VIEW system.v_index_health AS
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  pg_relation_size(indexrelid) AS index_size_bytes,
  CASE
    WHEN idx_scan = 0 AND indexrelname NOT LIKE '%_pkey'
      AND indexrelname NOT LIKE '%unique%' THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'RARELY_USED'
    ELSE 'ACTIVE'
  END AS usage_status
FROM pg_stat_user_indexes
ORDER BY
  CASE WHEN idx_scan = 0 THEN 0 ELSE 1 END,
  pg_relation_size(indexrelid) DESC;

-- Specifically highlight unused indexes (wasting space)
DROP VIEW IF EXISTS system.v_unused_indexes CASCADE;
CREATE VIEW system.v_unused_indexes AS
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  pg_relation_size(indexrelid) AS size_bytes
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
  AND indexrelname NOT LIKE '%unique%'
  AND indexrelname NOT LIKE 'uq_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ════════════════════════════════════════════════════════
-- 5. SYSTEM DASHBOARD VIEW
--    Single query for overall system health
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_dashboard CASCADE;
CREATE VIEW system.v_dashboard AS
SELECT
  -- Database
  pg_size_pretty(pg_database_size(current_database())) AS db_size,
  
  -- Connections
  (SELECT count(*) FROM pg_stat_activity
   WHERE datname = current_database()) AS total_connections,
  (SELECT count(*) FROM pg_stat_activity
   WHERE datname = current_database() AND state = 'active') AS active_queries,
  (SELECT count(*) FROM pg_stat_activity
   WHERE datname = current_database() AND state = 'idle in transaction') AS idle_in_txn,
  
  -- Performance
  (SELECT ROUND(
    sum(blks_hit)::NUMERIC /
    NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100, 2
  ) FROM pg_stat_database
  WHERE datname = current_database()) AS cache_hit_ratio,
  
  -- Jobs
  (SELECT count(*) FROM system.job_queue
   WHERE status = 'pending') AS pending_jobs,
  (SELECT count(*) FROM system.job_queue
   WHERE status = 'dead') AS dead_jobs,
  (SELECT count(*) FROM system.job_queue
   WHERE status = 'processing'
   AND locked_at < NOW() - INTERVAL '10 minutes') AS stuck_jobs,
  
  -- Outbox
  (SELECT count(*) FROM system.event_outbox
   WHERE published_at IS NULL) AS outbox_pending,
  
  -- Notifications
  (SELECT count(*) FROM system.notification_queue
   WHERE status = 'pending') AS notifications_pending,
  
  -- Tables
  (SELECT count(*) FROM pg_stat_user_tables) AS total_tables,
  (SELECT count(*) FROM pg_stat_user_tables
   WHERE n_dead_tup > n_live_tup * 0.2
   AND n_live_tup > 100) AS tables_need_vacuum,
  
  -- Indexes
  (SELECT count(*) FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   AND indexrelname NOT LIKE '%_pkey') AS unused_indexes,
  
  -- Timestamp
  NOW() AS checked_at;

-- ════════════════════════════════════════════════════════
-- 6. REPLICATION LAG VIEW (for Neon read replicas)
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_replication_status CASCADE;
CREATE VIEW system.v_replication_status AS
SELECT
  pid,
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
  pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag_pretty
FROM pg_stat_replication;

COMMIT;
