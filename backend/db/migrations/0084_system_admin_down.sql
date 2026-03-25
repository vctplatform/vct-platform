-- ===============================================================
-- VCT Platform — Migration 0084 DOWN: SYSTEM ADMINISTRATION MODULE
-- Drops all objects created in 0084_system_admin.sql
-- Order: views → functions → tables (respect FK dependencies)
-- ===============================================================

BEGIN;

-- ── 1. Drop Views ──────────────────────────────────────
DROP VIEW IF EXISTS system.v_system_health CASCADE;
DROP VIEW IF EXISTS system.v_admin_dashboard CASCADE;

-- ── 2. Drop Functions ──────────────────────────────────
DROP FUNCTION IF EXISTS system.log_admin_action(UUID, UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS system.expire_api_keys();
DROP FUNCTION IF EXISTS system.release_stale_locks();
DROP FUNCTION IF EXISTS system.claim_next_job(TEXT, TEXT, INT);

-- ── 3. Drop Tables (reverse order, partitions auto-drop) ──
DROP TABLE IF EXISTS system.admin_actions CASCADE;
DROP TABLE IF EXISTS system.system_metrics CASCADE;
DROP TABLE IF EXISTS system.notification_log CASCADE;
DROP TABLE IF EXISTS system.background_jobs CASCADE;
DROP TABLE IF EXISTS system.login_history CASCADE;
DROP TABLE IF EXISTS system.api_keys CASCADE;

-- ── 4. Remove seeded permissions ───────────────────────
DELETE FROM core.permissions
WHERE resource = 'system'
  AND action IN (
    'view_login_history', 'manage_jobs', 'view_notifications',
    'view_metrics', 'view_admin_actions', 'view_dashboard',
    'view_system_health', 'manage_announcements', 'manage_feature_flags'
  )
  AND is_system = true;

-- ── 5. Remove migration tracking entry ─────────────────
DELETE FROM system.schema_migrations WHERE version = '0084';

COMMIT;
