-- ===============================================================
-- VCT Platform — Migration 0059: FUZZY SEARCH (pg_trgm)
-- P0 Critical: Trigram-based fuzzy matching for Vietnamese names
-- Finds "Ngyen" → "Nguyễn", "tran" → "Trần"
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ENABLE pg_trgm EXTENSION
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set default similarity threshold
SET pg_trgm.similarity_threshold = 0.3;

-- ════════════════════════════════════════════════════════
-- 2. TRIGRAM GIN INDEXES FOR NAME SEARCH
--    GIN + trgm = fast LIKE '%pattern%' + fuzzy matching
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  v_indexes TEXT[] := ARRAY[
    'CREATE INDEX IF NOT EXISTS idx_athletes_name_trgm ON athletes USING GIN (ho_ten gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_clubs_name_trgm ON clubs USING GIN (ten gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_schools_name_trgm ON platform.martial_schools USING GIN (name gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING GIN (name gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_heritage_tech_trgm ON platform.heritage_techniques USING GIN (name gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_glossary_term_trgm ON platform.heritage_glossary USING GIN (term_vi gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_teams_name_trgm ON teams USING GIN (ten gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON platform.posts USING GIN (title gin_trgm_ops)'
  ];
  v_sql TEXT;
BEGIN
  FOREACH v_sql IN ARRAY v_indexes LOOP
    BEGIN
      EXECUTE v_sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped: % — %', v_sql, SQLERRM;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. UNIFIED FUZZY SEARCH FUNCTION
--    Searches across multiple entity types with ranking
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.search_fuzzy(
  p_query TEXT,
  p_entity_types TEXT[] DEFAULT ARRAY['athlete', 'club', 'tournament', 'school'],
  p_limit INT DEFAULT 20,
  p_min_similarity REAL DEFAULT 0.3
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  similarity_score REAL,
  extra_info JSONB
) AS $$
DECLARE
  v_query TEXT;
  v_tenant UUID;
BEGIN
  v_query := lower(trim(p_query));
  v_tenant := COALESCE(
    NULLIF(current_setting('app.current_tenant', true), '')::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  );

  -- Athletes
  IF 'athlete' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT
      'athlete'::TEXT,
      a.id,
      a.ho_ten::TEXT,
      similarity(lower(a.ho_ten), v_query),
      jsonb_build_object(
        'tournament_id', a.tournament_id,
        'gioi_tinh', a.gioi_tinh,
        'can_nang', a.can_nang
      )
    FROM athletes a
    WHERE a.is_deleted = false
      AND a.tenant_id = v_tenant
      AND (
        a.ho_ten % v_query                    -- trigram similarity
        OR lower(a.ho_ten) LIKE '%' || v_query || '%'  -- substring
      )
      AND similarity(lower(a.ho_ten), v_query) >= p_min_similarity
    ORDER BY similarity(lower(a.ho_ten), v_query) DESC
    LIMIT p_limit;
  END IF;

  -- Clubs
  IF 'club' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT
      'club'::TEXT,
      c.id,
      c.ten::TEXT,
      similarity(lower(c.ten), v_query),
      jsonb_build_object(
        'tinh_thanh', c.tinh_thanh,
        'member_count', c.member_count
      )
    FROM clubs c
    WHERE c.is_deleted = false
      AND c.tenant_id = v_tenant
      AND (c.ten % v_query OR lower(c.ten) LIKE '%' || v_query || '%')
      AND similarity(lower(c.ten), v_query) >= p_min_similarity
    ORDER BY similarity(lower(c.ten), v_query) DESC
    LIMIT p_limit;
  END IF;

  -- Tournaments
  IF 'tournament' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT
      'tournament'::TEXT,
      t.id,
      t.name::TEXT,
      similarity(lower(t.name), v_query),
      jsonb_build_object(
        'status', t.status,
        'start_date', t.start_date,
        'location', t.location
      )
    FROM tournaments t
    WHERE t.is_deleted = false
      AND t.tenant_id = v_tenant
      AND (t.name % v_query OR lower(t.name) LIKE '%' || v_query || '%')
      AND similarity(lower(t.name), v_query) >= p_min_similarity
    ORDER BY similarity(lower(t.name), v_query) DESC
    LIMIT p_limit;
  END IF;

  -- Martial schools
  IF 'school' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT
      'school'::TEXT,
      s.id,
      s.name::TEXT,
      similarity(lower(s.name), v_query),
      jsonb_build_object(
        'founded_year', s.founded_year,
        'region', s.region
      )
    FROM platform.martial_schools s
    WHERE s.is_deleted = false
      AND s.tenant_id = v_tenant
      AND (s.name % v_query OR lower(s.name) LIKE '%' || v_query || '%')
      AND similarity(lower(s.name), v_query) >= p_min_similarity
    ORDER BY similarity(lower(s.name), v_query) DESC
    LIMIT p_limit;
  END IF;

  -- Teams
  IF 'team' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT
      'team'::TEXT,
      tm.id,
      tm.ten::TEXT,
      similarity(lower(tm.ten), v_query),
      jsonb_build_object(
        'tournament_id', tm.tournament_id,
        'tinh_thanh', tm.tinh_thanh
      )
    FROM teams tm
    WHERE tm.is_deleted = false
      AND tm.tenant_id = v_tenant
      AND (tm.ten % v_query OR lower(tm.ten) LIKE '%' || v_query || '%')
      AND similarity(lower(tm.ten), v_query) >= p_min_similarity
    ORDER BY similarity(lower(tm.ten), v_query) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 4. SEARCH SUGGESTIONS (Autocomplete)
--    Returns top matches as user types
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.search_suggest(
  p_query TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  entity_type TEXT,
  entity_id UUID
) AS $$
BEGIN
  IF length(trim(p_query)) < 2 THEN
    RETURN;  -- Too short for meaningful results
  END IF;

  RETURN QUERY
  SELECT
    r.entity_name,
    r.entity_type,
    r.entity_id
  FROM system.search_fuzzy(
    p_query,
    ARRAY['athlete', 'club', 'tournament'],
    p_limit,
    0.2  -- Lower threshold for autocomplete
  ) r
  ORDER BY r.similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 5. SEARCH ANALYTICS TABLE
--    Track what users search for → improve search quality
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.search_log (
  id              UUID DEFAULT gen_random_uuid() NOT NULL,
  tenant_id       UUID,
  user_id         UUID,
  query           TEXT NOT NULL,
  entity_types    TEXT[],
  result_count    INT DEFAULT 0,
  top_result_id   UUID,
  top_score       REAL,
  searched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (searched_at, id)
) PARTITION BY RANGE (searched_at);

-- Monthly partitions
DO $$
DECLARE m INT; y INT; v_start DATE; v_end DATE;
BEGIN
  FOR y IN 2026..2027 LOOP
    FOR m IN 1..12 LOOP
      v_start := make_date(y, m, 1);
      v_end := CASE WHEN m = 12 THEN make_date(y+1, 1, 1)
               ELSE make_date(y, m+1, 1) END;
      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS system.search_log_%s_%s
           PARTITION OF system.search_log
           FOR VALUES FROM (%L) TO (%L)',
          y, lpad(m::TEXT, 2, '0'), v_start, v_end);
      EXCEPTION WHEN duplicate_table THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS system.search_log_default
  PARTITION OF system.search_log DEFAULT;

-- Popular searches view
DROP VIEW IF EXISTS system.v_popular_searches CASCADE;
CREATE VIEW system.v_popular_searches AS
SELECT
  query,
  count(*) AS search_count,
  avg(result_count) AS avg_results,
  count(*) FILTER (WHERE result_count = 0) AS zero_result_count,
  max(searched_at) AS last_searched
FROM system.search_log
WHERE searched_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 100;

COMMIT;
