-- Rollback 0070: AI/ML Pipeline
BEGIN;
DROP VIEW IF EXISTS ml.v_model_performance CASCADE;
DROP FUNCTION IF EXISTS ml.predict_match_outcome CASCADE;
DROP FUNCTION IF EXISTS ml.compute_athlete_features CASCADE;
DROP TABLE IF EXISTS ml.feature_store CASCADE;
DROP TABLE IF EXISTS ml.predictions_2026 CASCADE;
DROP TABLE IF EXISTS ml.predictions_default CASCADE;
DROP TABLE IF EXISTS ml.predictions CASCADE;
DROP TABLE IF EXISTS ml.training_datasets CASCADE;
DROP TABLE IF EXISTS ml.model_registry CASCADE;
DROP SCHEMA IF EXISTS ml CASCADE;
COMMIT;
