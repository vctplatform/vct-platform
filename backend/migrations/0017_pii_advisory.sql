-- ===============================================================
-- VCT Platform — Migration 0017: PII + ADVISORY LOCKS (Phase 3C)
-- PII encryption layer, advisory locks, connection security
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. PII ENCRYPTION LAYER
--    pgcrypto for hashing; app-level AES for encrypt/decrypt
--    DB stores: encrypted bytes + deterministic hash for lookup
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1a. Add encrypted PII columns to core.users
ALTER TABLE core.users
  ADD COLUMN IF NOT EXISTS email_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64);  -- SHA-256 for lookups

-- Unique lookup by email hash (faster than decrypting every row)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_hash
  ON core.users(tenant_id, email_hash)
  WHERE email_hash IS NOT NULL AND is_deleted = false;

-- 1b. PII columns in invoices (customer data)
ALTER TABLE platform.invoices
  ADD COLUMN IF NOT EXISTS customer_email_hash VARCHAR(64);

-- 1c. Sponsorships contact PII
ALTER TABLE platform.sponsorships
  ADD COLUMN IF NOT EXISTS contact_email_hash VARCHAR(64);

-- 1d. Helper: hash function for deterministic lookups
CREATE OR REPLACE FUNCTION core.hash_pii(val TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(digest(lower(trim(val)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1e. Auto-hash email on INSERT/UPDATE
CREATE OR REPLACE FUNCTION trigger_hash_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email_hash := core.hash_pii(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER auto_hash_email
    BEFORE INSERT OR UPDATE OF email ON core.users
    FOR EACH ROW EXECUTE FUNCTION trigger_hash_user_email();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. ADVISORY LOCKS — DISTRIBUTED COORDINATION
--    Lightweight locks for bracket generation, scoring,
--    payment processing. No table-level locks needed.
-- ════════════════════════════════════════════════════════

-- Hash-based lock key generator
CREATE OR REPLACE FUNCTION system.advisory_lock_key(
  p_category TEXT,  -- 'bracket', 'scoring', 'payment'
  p_entity_id UUID
)
RETURNS BIGINT AS $$
BEGIN
  -- Combine category + entity UUID into unique int8 lock key
  RETURN ('x' || left(md5(p_category || '::' || p_entity_id::TEXT), 15))::BIT(60)::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Convenience wrappers (called from Go)
-- pg_try_advisory_lock returns true if lock acquired
-- pg_advisory_unlock releases the lock

-- Example usage from Go:
-- SELECT pg_try_advisory_lock(system.advisory_lock_key('bracket', $1))
-- ... do bracket generation ...
-- SELECT pg_advisory_unlock(system.advisory_lock_key('bracket', $1))

-- ════════════════════════════════════════════════════════
-- 3. DATA RETENTION POLICIES
--    Metadata table defining auto-archival rules
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.data_retention_policies (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  table_name      VARCHAR(100) NOT NULL UNIQUE,
  retention_days  INT NOT NULL CHECK (retention_days > 0),
  archive_strategy VARCHAR(20) NOT NULL DEFAULT 'soft_delete'
    CHECK (archive_strategy IN ('soft_delete', 'move_to_archive', 'hard_delete_allowed')),
  archive_table   VARCHAR(100),     -- target for move_to_archive
  condition       TEXT,             -- WHERE clause for archival
  is_active       BOOLEAN DEFAULT true,
  last_run_at     TIMESTAMPTZ,
  last_archived   INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed retention policies
INSERT INTO system.data_retention_policies
  (table_name, retention_days, archive_strategy, condition) VALUES
  ('system.rate_limits', 1, 'hard_delete_allowed',
   'window_start < NOW() - INTERVAL ''1 day'''),
  ('core.sessions', 30, 'hard_delete_allowed',
   'expires_at < NOW() - INTERVAL ''30 days'''),
  ('system.job_queue', 90, 'soft_delete',
   'status IN (''completed'', ''dead'') AND completed_at < NOW() - INTERVAL ''90 days'''),
  ('system.event_outbox', 30, 'hard_delete_allowed',
   'published_at IS NOT NULL AND published_at < NOW() - INTERVAL ''30 days'''),
  ('system.notification_queue', 60, 'soft_delete',
   'is_read = true AND created_at < NOW() - INTERVAL ''60 days'''),
  ('system.audit_log_partitioned', 365, 'move_to_archive',
   'created_at < NOW() - INTERVAL ''365 days'''),
  ('core.auth_audit_log', 180, 'hard_delete_allowed',
   'created_at < NOW() - INTERVAL ''180 days''')
ON CONFLICT (table_name) DO NOTHING;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON system.data_retention_policies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 4. QUERY PERFORMANCE VIEWS
--    Monitor slow queries, index usage, table bloat
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW system.v_index_usage AS
SELECT
  schemaname, relname AS tablename, indexrelname AS indexname,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

CREATE OR REPLACE VIEW system.v_table_sizes AS
SELECT
  s.schemaname, s.relname AS tablename,
  pg_size_pretty(pg_total_relation_size(s.relid)) AS total_size,
  pg_size_pretty(pg_relation_size(s.relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(s.relid)) AS indexes_size,
  s.n_live_tup AS live_rows,
  s.n_dead_tup AS dead_rows,
  CASE WHEN s.n_live_tup > 0
    THEN round(s.n_dead_tup::NUMERIC / s.n_live_tup * 100, 2)
    ELSE 0
  END AS dead_row_pct,
  s.last_autovacuum, s.last_autoanalyze
FROM pg_stat_user_tables s
ORDER BY pg_total_relation_size(s.relid) DESC;

CREATE OR REPLACE VIEW system.v_unused_indexes AS
SELECT
  schemaname, relname AS tablename, indexrelname AS indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
  AND indexrelname NOT LIKE '%unique%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ════════════════════════════════════════════════════════
-- 5. HEALTH CHECK FUNCTION
--    Single call returns system health metrics
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.health_check()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  status TEXT
) AS $$
BEGIN
  -- Database size
  RETURN QUERY SELECT 'db_size'::TEXT,
    pg_size_pretty(pg_database_size(current_database())),
    'info'::TEXT;

  -- Active connections
  RETURN QUERY SELECT 'active_connections'::TEXT,
    (SELECT count(*)::TEXT FROM pg_stat_activity WHERE state = 'active'),
    CASE WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') > 50
      THEN 'warning' ELSE 'ok' END;

  -- Pending jobs
  RETURN QUERY SELECT 'pending_jobs'::TEXT,
    (SELECT count(*)::TEXT FROM system.job_queue WHERE status = 'pending'),
    CASE WHEN (SELECT count(*) FROM system.job_queue WHERE status = 'pending') > 1000
      THEN 'warning' ELSE 'ok' END;

  -- Dead jobs
  RETURN QUERY SELECT 'dead_jobs'::TEXT,
    (SELECT count(*)::TEXT FROM system.job_queue WHERE status = 'dead'),
    CASE WHEN (SELECT count(*) FROM system.job_queue WHERE status = 'dead') > 10
      THEN 'warning' ELSE 'ok' END;

  -- Unpublished outbox events
  RETURN QUERY SELECT 'outbox_pending'::TEXT,
    (SELECT count(*)::TEXT FROM system.event_outbox WHERE published_at IS NULL),
    CASE WHEN (SELECT count(*) FROM system.event_outbox WHERE published_at IS NULL) > 100
      THEN 'warning' ELSE 'ok' END;

  -- Unread notifications
  RETURN QUERY SELECT 'unread_notifications'::TEXT,
    (SELECT count(*)::TEXT FROM system.notification_queue WHERE is_read = false),
    'info'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMIT;
