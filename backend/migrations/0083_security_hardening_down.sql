-- Rollback 0083: Security Hardening
BEGIN;
DROP VIEW IF EXISTS system.v_uuid_defaults CASCADE;
-- Remove comments (cannot truly undo, but clear them)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog','information_schema')
  LOOP
    BEGIN
      EXECUTE format('COMMENT ON TABLE %I.%I IS NULL', r.schemaname, r.tablename);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
-- Remove 0079-0083 from migration tracking
DELETE FROM system.schema_migrations WHERE version IN ('0079','0080','0081','0082','0083');
COMMIT;
