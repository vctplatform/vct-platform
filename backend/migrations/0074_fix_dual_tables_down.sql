-- Rollback 0074: Fix Dual Tables
BEGIN;
DROP TRIGGER IF EXISTS users_view_insert ON public.users;
DROP TRIGGER IF EXISTS users_view_update ON public.users;
DROP FUNCTION IF EXISTS trigger_users_view_insert CASCADE;
DROP FUNCTION IF EXISTS trigger_users_view_update CASCADE;
DROP VIEW IF EXISTS public.auth_audit_log CASCADE;
DROP VIEW IF EXISTS public.sessions CASCADE;
DROP VIEW IF EXISTS public.users CASCADE;
-- NOTE: Cannot restore original public tables automatically.
-- Restore from backup if rollback is needed.
COMMIT;
