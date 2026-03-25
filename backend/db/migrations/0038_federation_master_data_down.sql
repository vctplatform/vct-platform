-- Rollback migration 0038: Federation Master Data Tables
DROP TABLE IF EXISTS master_competition_contents CASCADE;
DROP TABLE IF EXISTS master_age_groups CASCADE;
DROP TABLE IF EXISTS master_weight_classes CASCADE;
DROP TABLE IF EXISTS master_belts CASCADE;
