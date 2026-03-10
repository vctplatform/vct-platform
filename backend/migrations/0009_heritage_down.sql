-- Migration 0009 DOWN
BEGIN;
DROP TABLE IF EXISTS platform.heritage_events CASCADE;
DROP TABLE IF EXISTS platform.heritage_glossary CASCADE;
DROP TABLE IF EXISTS platform.heritage_media CASCADE;
DROP TABLE IF EXISTS platform.heritage_techniques CASCADE;
DROP TABLE IF EXISTS platform.lineage_nodes CASCADE;
DROP TABLE IF EXISTS platform.school_lineage CASCADE;
DROP TABLE IF EXISTS platform.martial_schools CASCADE;
COMMIT;
