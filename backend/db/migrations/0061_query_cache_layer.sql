-- ===============================================================
-- VCT Platform — Migration 0061: QUERY CACHE LAYER
-- P0 Critical: Database-level query result caching
-- with automatic invalidation and TTL management
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. QUERY CACHE TABLE
--    Stores pre-computed query results as JSONB
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.query_cache (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  cache_key       VARCHAR(500) NOT NULL UNIQUE,   -- normalized query hash
  cache_group     VARCHAR(100) NOT NULL,           -- 'ref_data', 'tournament_list', etc.
  result_data     JSONB NOT NULL,
  result_count    INT DEFAULT 0,
  -- TTL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  last_accessed   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count    INT DEFAULT 1,
  -- Source tracking
  source_tables   TEXT[] DEFAULT '{}',             -- tables this cache depends on
  tenant_id       UUID
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON system.query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_group ON system.query_cache(cache_group);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON system.query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_source ON system.query_cache USING GIN (source_tables);

-- ════════════════════════════════════════════════════════
-- 2. CACHE TTL CONFIGURATION
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.cache_config (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  cache_group     VARCHAR(100) NOT NULL UNIQUE,
  ttl_seconds     INT NOT NULL DEFAULT 300,       -- 5 minutes default
  max_entries     INT DEFAULT 1000,
  is_active       BOOLEAN DEFAULT true,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default cache configs
INSERT INTO system.cache_config (cache_group, ttl_seconds, max_entries, description) VALUES
  ('ref_belt_ranks',     86400,  100,  'Danh sách đai — ít thay đổi'),
  ('ref_weight_classes', 86400,  100,  'Hạng cân — ít thay đổi'),
  ('ref_sport_types',    86400,  50,   'Loại hình thi đấu'),
  ('ref_comp_formats',   86400,  50,   'Thể thức thi đấu'),
  ('tournament_list',    300,    50,   'Danh sách giải — 5 phút'),
  ('tournament_detail',  120,    200,  'Chi tiết giải — 2 phút'),
  ('athlete_profile',    120,    500,  'Hồ sơ VĐV — 2 phút'),
  ('leaderboard',        900,    20,   'Bảng xếp hạng — 15 phút'),
  ('club_list',          600,    100,  'Danh sách CLB — 10 phút'),
  ('feature_flags',      60,     10,   'Feature flags — 1 phút'),
  ('search_results',     30,     200,  'Kết quả tìm kiếm — 30 giây'),
  ('live_scoring',       0,      0,    'Chấm điểm trực tiếp — KHÔNG CACHE')
ON CONFLICT (cache_group) DO NOTHING;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.cache_config
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 3. CACHE GET/SET FUNCTIONS
-- ════════════════════════════════════════════════════════

-- GET: Returns cached data if fresh, NULL if expired/missing
CREATE OR REPLACE FUNCTION system.cache_get(
  p_cache_key TEXT
)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  UPDATE system.query_cache SET
    last_accessed = NOW(),
    access_count = access_count + 1
  WHERE cache_key = p_cache_key
    AND expires_at > NOW()
  RETURNING result_data INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- SET: Store result with TTL from cache_config
CREATE OR REPLACE FUNCTION system.cache_set(
  p_cache_key TEXT,
  p_cache_group TEXT,
  p_data JSONB,
  p_source_tables TEXT[] DEFAULT '{}',
  p_tenant_id UUID DEFAULT NULL,
  p_count INT DEFAULT 0
)
RETURNS VOID AS $$
DECLARE v_ttl INT;
BEGIN
  -- Get TTL from config
  SELECT ttl_seconds INTO v_ttl
  FROM system.cache_config
  WHERE cache_group = p_cache_group AND is_active = true;

  IF v_ttl IS NULL OR v_ttl = 0 THEN
    RETURN;  -- Cache disabled for this group
  END IF;

  INSERT INTO system.query_cache
    (cache_key, cache_group, result_data, result_count,
     expires_at, source_tables, tenant_id)
  VALUES (
    p_cache_key, p_cache_group, p_data, p_count,
    NOW() + (v_ttl || ' seconds')::INTERVAL,
    p_source_tables, p_tenant_id)
  ON CONFLICT (cache_key) DO UPDATE SET
    result_data = EXCLUDED.result_data,
    result_count = EXCLUDED.result_count,
    expires_at = NOW() + (v_ttl || ' seconds')::INTERVAL,
    last_accessed = NOW(),
    access_count = system.query_cache.access_count + 1;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. CACHE INVALIDATION
-- ════════════════════════════════════════════════════════

-- Invalidate by key
CREATE OR REPLACE FUNCTION system.cache_invalidate_key(p_key TEXT)
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM system.query_cache WHERE cache_key = p_key;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Invalidate by group
CREATE OR REPLACE FUNCTION system.cache_invalidate_group(p_group TEXT)
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM system.query_cache WHERE cache_group = p_group;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Invalidate by source table (when data changes)
CREATE OR REPLACE FUNCTION system.cache_invalidate_table(p_table TEXT)
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM system.query_cache WHERE p_table = ANY(source_tables);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-invalidation trigger (attach to tables)
CREATE OR REPLACE FUNCTION trigger_cache_invalidate()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM system.cache_invalidate_table(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME);
  RETURN NULL;  -- AFTER trigger, return value ignored
END;
$$ LANGUAGE plpgsql;

-- Attach to reference data tables (changes are rare)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'ref_belt_ranks', 'ref_weight_classes', 'ref_sport_types',
    'content_categories', 'ref_competition_formats'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER cache_invalidate AFTER INSERT OR UPDATE OR DELETE
         ON %I FOR EACH STATEMENT EXECUTE FUNCTION trigger_cache_invalidate()',
        tbl);
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 5. CACHE CLEANUP + STATS
-- ════════════════════════════════════════════════════════

-- Clean expired entries
CREATE OR REPLACE FUNCTION system.cache_cleanup()
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM system.query_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Register cleanup scheduled task
INSERT INTO system.scheduled_tasks (name, cron_expression, job_type, description)
VALUES ('cache_cleanup', '*/10 * * * *', 'cache_manager',
        'Clean expired cache entries every 10 minutes')
ON CONFLICT (name) DO NOTHING;

-- Cache stats view
DROP VIEW IF EXISTS system.v_cache_stats CASCADE;
CREATE VIEW system.v_cache_stats AS
SELECT
  qc.cache_group,
  count(*) AS entries,
  sum(access_count) AS total_hits,
  avg(access_count) AS avg_hits_per_entry,
  min(qc.created_at) AS oldest_entry,
  max(last_accessed) AS last_access,
  count(*) FILTER (WHERE expires_at < NOW()) AS expired_entries,
  pg_size_pretty(sum(pg_column_size(result_data))) AS data_size,
  cc.ttl_seconds,
  cc.max_entries
FROM system.query_cache qc
LEFT JOIN system.cache_config cc ON cc.cache_group = qc.cache_group
GROUP BY qc.cache_group, cc.ttl_seconds, cc.max_entries
ORDER BY total_hits DESC;

COMMIT;
