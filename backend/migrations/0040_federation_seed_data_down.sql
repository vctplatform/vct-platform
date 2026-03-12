-- Rollback migration 0040: Federation Seed Data
DELETE FROM federation_provinces;
DELETE FROM federation_units WHERE id = 'f0000000-0000-0000-0000-000000000001';
