-- Rollback 0058: PG17 Testing + Docs
BEGIN;
DROP VIEW IF EXISTS system.v_pg17_features CASCADE;
DROP FUNCTION IF EXISTS system.verify_extensions CASCADE;
DROP TABLE IF EXISTS system.db_documentation CASCADE;
COMMIT;
