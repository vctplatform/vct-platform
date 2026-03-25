BEGIN;

DROP INDEX IF EXISTS idx_entity_records_entity_updated_at;
DROP TABLE IF EXISTS entity_records;

COMMIT;
