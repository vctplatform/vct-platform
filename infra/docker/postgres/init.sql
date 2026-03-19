-- ═══════════════════════════════════════════════════════════════
-- VCT Platform — PostgreSQL Initialization
-- Runs once on first container startup (via /docker-entrypoint-initdb.d)
-- ═══════════════════════════════════════════════════════════════

-- Core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensions used by migrations
CREATE EXTENSION IF NOT EXISTS "ltree";       -- 0063: hierarchy trees
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- 0059: fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- exclusion constraints

-- Create API view schema
CREATE SCHEMA IF NOT EXISTS api_v1;

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT USAGE ON SCHEMA api_v1 TO PUBLIC;
GRANT USAGE ON SCHEMA audit TO PUBLIC;
