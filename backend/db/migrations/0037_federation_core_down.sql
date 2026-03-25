-- Rollback migration 0037: Federation Core Tables
DROP TABLE IF EXISTS federation_personnel CASCADE;
DROP TABLE IF EXISTS federation_organizations CASCADE;
DROP TABLE IF EXISTS federation_units CASCADE;
DROP TABLE IF EXISTS federation_provinces CASCADE;
