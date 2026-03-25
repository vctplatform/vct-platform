-- ===============================================================
-- VCT Platform — Migration 0006 DOWN: Training Module
-- ===============================================================
BEGIN;
DROP TABLE IF EXISTS training.course_enrollments CASCADE;
DROP TABLE IF EXISTS training.courses CASCADE;
DROP TABLE IF EXISTS training.belt_exam_results CASCADE;
DROP TABLE IF EXISTS training.belt_examinations CASCADE;
DROP TABLE IF EXISTS training.attendance_records CASCADE;
DROP TABLE IF EXISTS training.training_sessions CASCADE;
DROP TABLE IF EXISTS training.training_plans CASCADE;
DROP TABLE IF EXISTS training.curriculum_techniques CASCADE;
DROP TABLE IF EXISTS training.technique_media CASCADE;
DROP TABLE IF EXISTS training.techniques CASCADE;
DROP TABLE IF EXISTS training.curriculum_levels CASCADE;
DROP TABLE IF EXISTS training.curricula CASCADE;
COMMIT;
