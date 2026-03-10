-- ===============================================================
-- VCT Platform — Migration 0017 DOWN
-- ===============================================================
BEGIN;

-- Drop health check
DROP FUNCTION IF EXISTS system.health_check() CASCADE;

-- Drop monitoring views
DROP VIEW IF EXISTS system.v_unused_indexes CASCADE;
DROP VIEW IF EXISTS system.v_table_sizes CASCADE;
DROP VIEW IF EXISTS system.v_index_usage CASCADE;

-- Drop retention policies
DROP TABLE IF EXISTS system.data_retention_policies CASCADE;

-- Drop advisory lock helper
DROP FUNCTION IF EXISTS system.advisory_lock_key(TEXT, UUID) CASCADE;

-- Drop PII triggers
DROP TRIGGER IF EXISTS auto_hash_email ON core.users;
DROP FUNCTION IF EXISTS trigger_hash_user_email() CASCADE;
DROP FUNCTION IF EXISTS core.hash_pii(TEXT) CASCADE;

-- Drop PII columns
ALTER TABLE platform.sponsorships DROP COLUMN IF EXISTS contact_email_hash;
ALTER TABLE platform.invoices DROP COLUMN IF EXISTS customer_email_hash;
ALTER TABLE core.users DROP COLUMN IF EXISTS email_hash;
ALTER TABLE core.users DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE core.users DROP COLUMN IF EXISTS email_encrypted;

-- Keep pgcrypto (may be used elsewhere)

COMMIT;
