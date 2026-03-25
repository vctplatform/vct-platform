-- ════════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration #0035 DOWN: Drop Associations
-- ════════════════════════════════════════════════════════════════

ALTER TABLE provincial_clubs
    DROP COLUMN IF EXISTS sub_association_id,
    DROP COLUMN IF EXISTS association_id;

DROP TABLE IF EXISTS provincial_sub_associations;
DROP TABLE IF EXISTS provincial_associations;
DROP TYPE IF EXISTS association_status;
