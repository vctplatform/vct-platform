-- ===============================================================
-- VCT Platform — Migration 0019 DOWN
-- ===============================================================
BEGIN;

DROP TABLE IF EXISTS system.media_files CASCADE;
DROP FUNCTION IF EXISTS platform.convert_currency(DECIMAL, VARCHAR, VARCHAR, DATE) CASCADE;
DROP TABLE IF EXISTS platform.exchange_rates CASCADE;
DROP MATERIALIZED VIEW IF EXISTS api_v1.tournament_monthly_stats CASCADE;
DROP TABLE IF EXISTS system.analytics_daily CASCADE;
DROP FUNCTION IF EXISTS core.find_nearby_clubs(DOUBLE PRECISION, DOUBLE PRECISION, INT, INT) CASCADE;
DROP TABLE IF EXISTS core.locations CASCADE;

-- Drop geo columns
ALTER TABLE platform.martial_schools DROP COLUMN IF EXISTS province;
ALTER TABLE platform.martial_schools DROP COLUMN IF EXISTS city;
ALTER TABLE platform.martial_schools DROP COLUMN IF EXISTS coordinates;
ALTER TABLE people.club_branches DROP COLUMN IF EXISTS coordinates;
ALTER TABLE clubs DROP COLUMN IF EXISTS province;
ALTER TABLE clubs DROP COLUMN IF EXISTS city;
ALTER TABLE clubs DROP COLUMN IF EXISTS address;
ALTER TABLE clubs DROP COLUMN IF EXISTS coordinates;
ALTER TABLE arenas DROP COLUMN IF EXISTS full_address;
ALTER TABLE arenas DROP COLUMN IF EXISTS coordinates;

DROP EXTENSION IF EXISTS postgis CASCADE;

COMMIT;
