-- Rollback 0053: Composite + Covering Indexes
BEGIN;
-- Drop composite/covering indexes created in 0053
-- Use pg_indexes to find and drop them dynamically
DO $$
DECLARE idx RECORD;
BEGIN
  FOR idx IN
    SELECT indexname FROM pg_indexes
    WHERE indexname LIKE 'idx_%_covering' OR indexname LIKE 'idx_%_composite'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
  END LOOP;
END $$;
COMMIT;
