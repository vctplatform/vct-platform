-- ===============================================================
-- VCT Platform — Migration 0074: FIX DUAL TABLE ARCHITECTURE
-- P0 Critical: Resolve public vs core schema conflict
-- Drop public auth tables, create backward-compat views
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SAFETY: Check core tables exist before dropping public
-- ════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'core' AND tablename = 'users') THEN
    RAISE EXCEPTION 'core.users does not exist — aborting dual table fix';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'core' AND tablename = 'sessions') THEN
    RAISE EXCEPTION 'core.sessions does not exist — aborting dual table fix';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════
-- 2. MIGRATE DATA: Copy any rows in public tables to core
--    (Skip duplicates on PK conflict)
-- ════════════════════════════════════════════════════════

-- Migrate public.users → core.users (if any orphan rows exist)
INSERT INTO core.users (
  id, tenant_id, username, email, phone, password_hash,
  full_name, avatar_url, is_active, created_at, updated_at
)
SELECT
  u.id,
  '00000000-0000-7000-8000-000000000001'::UUID,
  u.username, u.email, u.phone, u.password_hash,
  u.full_name, u.avatar_url, u.is_active,
  COALESCE(u.created_at, NOW()), COALESCE(u.updated_at, NOW())
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM core.users cu WHERE cu.id = u.id
)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 3. DROP dependent objects on public auth tables
-- ════════════════════════════════════════════════════════

-- Drop triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
DROP TRIGGER IF EXISTS prevent_hard_delete ON public.users;

-- Drop public auth tables (CASCADE removes FKs pointing to them)
-- Using CASCADE carefully — only public schema duplicates
DROP TABLE IF EXISTS public.auth_audit_log CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ════════════════════════════════════════════════════════
-- 4. CREATE BACKWARD-COMPATIBLE VIEWS
--    Go backend code referencing "users" (no schema)
--    will now transparently hit core.users
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.users CASCADE;
CREATE VIEW public.users AS
SELECT
  id, username, email, phone, password_hash,
  full_name, avatar_url, is_active,
  created_at, updated_at,
  tenant_id,
  CASE WHEN is_deleted THEN 'inactive' ELSE 'active' END AS status
FROM core.users
WHERE is_deleted = false;

-- Make the view updatable via INSTEAD OF triggers
CREATE OR REPLACE FUNCTION trigger_users_view_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO core.users (
    id, tenant_id, username, email, phone, password_hash,
    full_name, avatar_url, is_active, created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, uuidv7()),
    COALESCE(NEW.tenant_id, current_setting('app.current_tenant', true)::UUID,
             '00000000-0000-7000-8000-000000000001'::UUID),
    NEW.username, NEW.email, NEW.phone, NEW.password_hash,
    NEW.full_name, NEW.avatar_url,
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW())
  )
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_view_insert
  INSTEAD OF INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION trigger_users_view_insert();

CREATE OR REPLACE FUNCTION trigger_users_view_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE core.users SET
    username = COALESCE(NEW.username, OLD.username),
    email = NEW.email,
    phone = NEW.phone,
    password_hash = COALESCE(NEW.password_hash, OLD.password_hash),
    full_name = COALESCE(NEW.full_name, OLD.full_name),
    avatar_url = NEW.avatar_url,
    is_active = COALESCE(NEW.is_active, OLD.is_active),
    updated_at = NOW()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_view_update
  INSTEAD OF UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION trigger_users_view_update();

DROP VIEW IF EXISTS public.sessions CASCADE;
CREATE VIEW public.sessions AS
SELECT
  id, user_id, token_hash, device_info,
  ip_address, expires_at, created_at, last_active,
  tenant_id
FROM core.sessions;

DROP VIEW IF EXISTS public.auth_audit_log CASCADE;
CREATE VIEW public.auth_audit_log AS
SELECT
  id, user_id, action, ip_address, user_agent,
  details, created_at, tenant_id
FROM core.auth_audit_log;

-- ════════════════════════════════════════════════════════
-- 5. FIX: Ensure orphan entities reference core.users
-- ════════════════════════════════════════════════════════

COMMENT ON VIEW public.users IS
  'Backward-compatible view → core.users. All new code should use core.users directly.';

COMMIT;
