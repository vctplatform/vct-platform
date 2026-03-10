-- ===============================================================
-- VCT Platform — Migration 0033: V7.0 AGGREGATE ENFORCEMENT SCHEMAS
-- Additional schemas per V7.0 DDD aggregate boundaries
-- (Complement to 0004's core/tournament/people/training/platform/system/api_v1)
-- ===============================================================

BEGIN;

-- V7.0 specifies aggregate-level schema isolation:
-- "Mỗi aggregate = 1 schema"
-- 0004 created: core, tournament, people, training, platform, system, api_v1
-- V7.0 adds these additional bounded context schemas:

CREATE SCHEMA IF NOT EXISTS iam;             -- Identity & Access Management (ReBAC lives here)
CREATE SCHEMA IF NOT EXISTS athlete;         -- Athlete lifecycle aggregate
CREATE SCHEMA IF NOT EXISTS registration;    -- Registration workflow aggregate
CREATE SCHEMA IF NOT EXISTS competition;     -- Live competition aggregate
CREATE SCHEMA IF NOT EXISTS results;         -- Results certification aggregate
CREATE SCHEMA IF NOT EXISTS governance;      -- Disciplinary & compliance aggregate
CREATE SCHEMA IF NOT EXISTS heritage;        -- Cultural preservation aggregate
CREATE SCHEMA IF NOT EXISTS community;       -- News, forums, announcements
CREATE SCHEMA IF NOT EXISTS infrastructure;  -- Cross-aggregate references, vendor abstraction
CREATE SCHEMA IF NOT EXISTS api;             -- Cross-aggregate stable views (V7.0 addition)

-- Grant usage to application role (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vct_app') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA iam TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA athlete TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA registration TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA competition TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA results TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA governance TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA heritage TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA community TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA infrastructure TO vct_app';
        EXECUTE 'GRANT USAGE ON SCHEMA api TO vct_app';
    END IF;
END $$;

COMMENT ON SCHEMA iam IS 'V7.0: Identity & Access Management — ReBAC tuples, authorization rules';
COMMENT ON SCHEMA athlete IS 'V7.0: Athlete lifecycle — profiles, data keys, erasure';
COMMENT ON SCHEMA registration IS 'V7.0: Registration workflow — entries, team entries, weigh-ins';
COMMENT ON SCHEMA competition IS 'V7.0: Live competition — matches, bouts, scoring, events';
COMMENT ON SCHEMA results IS 'V7.0: Results certification — digital signatures, certificates';
COMMENT ON SCHEMA governance IS 'V7.0: Governance — integrity alerts, disciplinary actions';
COMMENT ON SCHEMA heritage IS 'V7.0: Cultural preservation — heritage artifacts, oral history';
COMMENT ON SCHEMA community IS 'V7.0: Community — news, announcements, forums';
COMMENT ON SCHEMA infrastructure IS 'V7.0: Infrastructure — cross-aggregate refs, vendor mappings, config';
COMMENT ON SCHEMA api IS 'V7.0: Cross-aggregate stable views for application layer';

COMMIT;
