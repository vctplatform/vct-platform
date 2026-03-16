-- Rollback 0065: BRIN Indexes
BEGIN;
DROP VIEW IF EXISTS system.v_brin_candidates CASCADE;
DROP VIEW IF EXISTS system.v_index_size_comparison CASCADE;
DROP VIEW IF EXISTS system.v_brin_indexes CASCADE;
-- Drop all BRIN indexes created in 0065
DROP INDEX CONCURRENTLY IF EXISTS idx_users_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_sessions_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_athletes_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_combat_matches_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_registrations_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_payments_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_invoices_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_posts_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_comments_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_reactions_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_training_sessions_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_enrollments_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_notification_queue_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_import_jobs_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_export_jobs_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_cdc_outbox_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_query_cache_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_techniques_created_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_rating_hist_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_athletes_updated_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_tournaments_updated_brin;
DROP INDEX CONCURRENTLY IF EXISTS idx_matches_updated_brin;
COMMIT;
