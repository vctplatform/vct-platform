-- ===============================================================
-- VCT Platform — Migration 0019: GEO + ANALYTICS (Phase 4B)
-- PostGIS for location-based queries, analytics pre-aggregation,
-- multi-currency exchange rates
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. POSTGIS — LOCATION-BASED FEATURES
--    Find nearby clubs, tournament venues within radius
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1a. Add geospatial columns to venues/clubs/branches
ALTER TABLE arenas
  ADD COLUMN IF NOT EXISTS coordinates GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS full_address TEXT;

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS coordinates GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS province VARCHAR(100);

ALTER TABLE people.club_branches
  ADD COLUMN IF NOT EXISTS coordinates GEOGRAPHY(POINT, 4326);

ALTER TABLE platform.martial_schools
  ADD COLUMN IF NOT EXISTS coordinates GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- 1b. Spatial indexes (GIST for geography)
CREATE INDEX IF NOT EXISTS idx_arenas_geo ON arenas USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_clubs_geo ON clubs USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_branches_geo ON people.club_branches USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_schools_geo ON platform.martial_schools USING GIST (coordinates);

-- 1c. Province/City lookup table
CREATE TABLE IF NOT EXISTS core.locations (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  code            VARCHAR(10) NOT NULL UNIQUE,   -- '01' = Hà Nội
  name            VARCHAR(200) NOT NULL,
  name_en         VARCHAR(200),
  parent_code     VARCHAR(10),
  level           VARCHAR(20) NOT NULL
    CHECK (level IN ('country', 'province', 'district', 'ward')),
  coordinates     GEOGRAPHY(POINT, 4326),
  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON core.locations(parent_code);
CREATE INDEX IF NOT EXISTS idx_locations_level ON core.locations(level, code);

-- 1d. Nearby search function
CREATE OR REPLACE FUNCTION core.find_nearby_clubs(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km INT DEFAULT 10,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  club_id UUID, club_name VARCHAR, distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.ten,
    ROUND(ST_Distance(
      c.coordinates,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY
    )::NUMERIC / 1000, 2)::DOUBLE PRECISION AS dist_km
  FROM clubs c
  WHERE c.coordinates IS NOT NULL
    AND c.is_deleted = false
    AND ST_DWithin(
      c.coordinates,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
      p_radius_km * 1000   -- meters
    )
  ORDER BY dist_km
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 2. ANALYTICS PRE-AGGREGATION
--    Time-series rollup tables for dashboards
--    Updated by scheduled jobs (no real-time overhead)
-- ════════════════════════════════════════════════════════

-- 2a. Daily stats per tenant
CREATE TABLE IF NOT EXISTS system.analytics_daily (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  date            DATE NOT NULL,
  metric          VARCHAR(100) NOT NULL,    -- 'active_users', 'new_athletes', 'matches_played'
  dimension       VARCHAR(100),             -- 'province=HN', 'weight_class=60'
  value           BIGINT NOT NULL DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, tenant_id, metric, id)
) PARTITION BY RANGE (date);

-- Monthly partitions for analytics
DO $$
DECLARE m INT; start_d TEXT; end_d TEXT;
BEGIN
  FOR m IN 1..12 LOOP
    start_d := format('2026-%s-01', lpad(m::TEXT, 2, '0'));
    IF m = 12 THEN end_d := '2027-01-01';
    ELSE end_d := format('2026-%s-01', lpad((m+1)::TEXT, 2, '0'));
    END IF;
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS system.analytics_daily_2026_%s PARTITION OF system.analytics_daily FOR VALUES FROM (%L) TO (%L)',
      lpad(m::TEXT, 2, '0'), start_d, end_d
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS system.analytics_daily_default
  PARTITION OF system.analytics_daily DEFAULT;

CREATE INDEX IF NOT EXISTS idx_analytics_daily_metric
  ON system.analytics_daily(tenant_id, metric, date DESC);

-- 2b. Reporting materialized view: Tournament summary by month
CREATE MATERIALIZED VIEW IF NOT EXISTS api_v1.tournament_monthly_stats AS
SELECT
  date_trunc('month', t.start_date) AS month,
  t.tenant_id,
  COUNT(t.id) AS tournament_count,
  COUNT(t.id) FILTER (WHERE t.status = 'ket_thuc') AS completed,
  COUNT(t.id) FILTER (WHERE t.status = 'huy') AS cancelled,
  SUM(COALESCE(d.athlete_count, 0)) AS total_athletes,
  SUM(COALESCE(d.match_count, 0)) AS total_matches
FROM tournaments t
LEFT JOIN api_v1.tournament_dashboard d ON d.id = t.id
WHERE t.is_deleted = false AND t.start_date IS NOT NULL
GROUP BY date_trunc('month', t.start_date), t.tenant_id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_monthly_pk
  ON api_v1.tournament_monthly_stats(month, tenant_id);

-- ════════════════════════════════════════════════════════
-- 3. MULTI-CURRENCY EXCHANGE RATES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform.exchange_rates (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  from_currency   VARCHAR(10) NOT NULL,
  to_currency     VARCHAR(10) NOT NULL,
  rate            DECIMAL(20,10) NOT NULL CHECK (rate > 0),
  effective_date  DATE NOT NULL,
  source          VARCHAR(100) DEFAULT 'manual',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_currency, to_currency, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup
  ON platform.exchange_rates(from_currency, to_currency, effective_date DESC);

-- Currency conversion helper
CREATE OR REPLACE FUNCTION platform.convert_currency(
  p_amount DECIMAL,
  p_from VARCHAR,
  p_to VARCHAR,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE v_rate DECIMAL;
BEGIN
  IF p_from = p_to THEN RETURN p_amount; END IF;

  SELECT rate INTO v_rate
  FROM platform.exchange_rates
  WHERE from_currency = p_from AND to_currency = p_to
    AND effective_date <= p_date
  ORDER BY effective_date DESC
  LIMIT 1;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'No exchange rate found for % → % on %', p_from, p_to, p_date;
  END IF;

  RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 4. FILE/MEDIA TRACKING
--    Centralized file registry (S3-compatible)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.media_files (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  uploaded_by     UUID REFERENCES core.users(id),
  file_name       VARCHAR(500) NOT NULL,
  original_name   VARCHAR(500),
  mime_type       VARCHAR(100) NOT NULL,
  file_size       BIGINT NOT NULL CHECK (file_size > 0),
  storage_path    TEXT NOT NULL,             -- 's3://bucket/tenant/2026/03/file.jpg'
  storage_backend VARCHAR(20) DEFAULT 'local'
    CHECK (storage_backend IN ('local', 's3', 'gcs', 'azure')),
  checksum_sha256 VARCHAR(64),
  is_public       BOOLEAN DEFAULT false,
  usage_context   VARCHAR(50),              -- 'avatar', 'tournament_logo', 'heritage_media'
  entity_type     VARCHAR(100),             -- 'athlete', 'tournament', 'heritage_technique'
  entity_id       UUID,
  width           INT,
  height          INT,
  duration_seconds INT,                      -- for videos
  metadata        JSONB DEFAULT '{}',
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE system.media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.media_files
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

CREATE INDEX IF NOT EXISTS idx_media_tenant ON system.media_files(tenant_id, usage_context) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_media_entity ON system.media_files(entity_type, entity_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_media_checksum ON system.media_files(checksum_sha256);

COMMIT;
