-- Rollback: Drop BTC, Parent, Training tables
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS parent_results;
DROP TABLE IF EXISTS parent_attendance;
DROP TABLE IF EXISTS parent_consents;
DROP TABLE IF EXISTS parent_links;
DROP TABLE IF EXISTS btc_protests;
DROP TABLE IF EXISTS btc_meetings;
DROP TABLE IF EXISTS btc_finance;
DROP TABLE IF EXISTS btc_content_results;
DROP TABLE IF EXISTS btc_team_results;
DROP TABLE IF EXISTS btc_assignments;
DROP TABLE IF EXISTS btc_draws;
DROP TABLE IF EXISTS btc_weigh_ins;
DROP TABLE IF EXISTS btc_members;
