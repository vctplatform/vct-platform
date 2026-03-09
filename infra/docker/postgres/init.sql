-- VCT Platform PostgreSQL initialization
-- Creates required schemas and extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create API view schema
CREATE SCHEMA IF NOT EXISTS api_v1;

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT USAGE ON SCHEMA api_v1 TO PUBLIC;
GRANT USAGE ON SCHEMA audit TO PUBLIC;
