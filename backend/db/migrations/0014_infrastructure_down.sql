-- ===============================================================
-- VCT Platform — Migration 0014 DOWN
-- ===============================================================
BEGIN;

-- Drop API keys
DROP TABLE IF EXISTS system.api_keys CASCADE;

-- Drop scheduled tasks
DROP TABLE IF EXISTS system.scheduled_tasks CASCADE;

-- Drop rate limiting
DROP FUNCTION IF EXISTS system.check_rate_limit(UUID, TEXT, TEXT, INT, INT) CASCADE;
DROP TABLE IF EXISTS system.rate_limits CASCADE;

-- Drop job queue functions
DROP FUNCTION IF EXISTS system.reap_stuck_jobs(INT) CASCADE;
DROP FUNCTION IF EXISTS system.fail_job(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS system.complete_job(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS system.claim_job(TEXT[], TEXT, INT) CASCADE;
DROP TABLE IF EXISTS system.job_queue CASCADE;

COMMIT;
