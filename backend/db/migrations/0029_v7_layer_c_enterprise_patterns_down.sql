-- ===============================================================
-- VCT Platform — Migration 0029 DOWN: V7.0 LAYER C ROLLBACK
-- ===============================================================

BEGIN;

DROP TABLE IF EXISTS tournament.scoring_baselines CASCADE;
DROP TABLE IF EXISTS tournament.integrity_alerts CASCADE;
DROP TABLE IF EXISTS platform.issued_documents CASCADE;
DROP TABLE IF EXISTS platform.document_templates CASCADE;
DROP TABLE IF EXISTS tournament.generated_schedules CASCADE;
DROP TABLE IF EXISTS tournament.scheduling_constraints CASCADE;
DROP TABLE IF EXISTS tournament.resource_availability CASCADE;

COMMIT;
