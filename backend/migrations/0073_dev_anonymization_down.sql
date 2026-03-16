-- Rollback 0073: Dev Anonymization
BEGIN;
DROP VIEW IF EXISTS system.v_anonymization_coverage CASCADE;
DROP FUNCTION IF EXISTS system.anonymize_database CASCADE;
DROP FUNCTION IF EXISTS system.fake_address CASCADE;
DROP FUNCTION IF EXISTS system.mask_string CASCADE;
DROP FUNCTION IF EXISTS system.fake_phone CASCADE;
DROP FUNCTION IF EXISTS system.fake_email CASCADE;
DROP FUNCTION IF EXISTS system.fake_vn_name CASCADE;
DROP TABLE IF EXISTS system.anonymization_rules CASCADE;
COMMIT;
