-- ===============================================================
-- VCT Platform — Migration 0075: FIX RLS STRICT MODE
-- P1 High: Remove silent fallback to system tenant
-- Force explicit tenant context — no more silent bypass
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. DROP old lenient RLS policies and replace with strict
-- ════════════════════════════════════════════════════════

-- Helper: Create strict RLS policy for a table
-- Requires app.current_tenant to be set, no silent fallback
CREATE OR REPLACE FUNCTION system.create_strict_rls_policy(
  p_table_name TEXT,
  p_schema_name TEXT DEFAULT 'public'
)
RETURNS VOID AS $$
DECLARE
  v_full_table TEXT := p_schema_name || '.' || p_table_name;
  v_policy_name TEXT := 'strict_tenant_isolation_' || p_table_name;
  v_old_policy TEXT := 'tenant_isolation_' || p_table_name;
BEGIN
  -- Drop old lenient policy
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', v_old_policy, v_full_table);

  -- Create strict policy: FAIL if tenant not set
  EXECUTE format(
    'CREATE POLICY %I ON %s
      USING (
        tenant_id = (
          CASE
            WHEN current_setting(''app.current_tenant'', true) IS NULL
              OR current_setting(''app.current_tenant'', true) = ''''
            THEN
              (SELECT system.raise_tenant_required())::UUID  -- will raise exception
            ELSE
              current_setting(''app.current_tenant'', true)::UUID
          END
        )
      )',
    v_policy_name, v_full_table
  );
END;
$$ LANGUAGE plpgsql;

-- Exception helper function
CREATE OR REPLACE FUNCTION system.raise_tenant_required()
RETURNS TEXT AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY: app.current_tenant must be set. '
    'Direct database access without tenant context is forbidden. '
    'Use SET app.current_tenant = ''<uuid>'' before queries.'
    USING ERRCODE = 'insufficient_privilege';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 2. APPLY strict RLS to all tenant-scoped tables
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl RECORD;
BEGIN
  -- Tables in public schema
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'teams', 'athletes', 'registrations', 'referees',
    'arenas', 'combat_matches', 'form_performances', 'appeals',
    'match_events', 'rankings', 'clubs'
  ]) AS name LOOP
    BEGIN
      PERFORM system.create_strict_rls_policy(tbl.name, 'public');
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table public.% does not exist, skipping', tbl.name;
    END;
  END LOOP;
END $$;

-- core.users — special: keep system admin bypass, make tenant strict
DROP POLICY IF EXISTS tenant_isolation_users ON core.users;
CREATE POLICY strict_tenant_isolation_users ON core.users
  USING (
    current_setting('app.is_system_admin', true) = 'true'
    OR
    tenant_id = (
      CASE
        WHEN current_setting('app.current_tenant', true) IS NULL
          OR current_setting('app.current_tenant', true) = ''
        THEN (SELECT system.raise_tenant_required())::UUID
        ELSE current_setting('app.current_tenant', true)::UUID
      END
    )
  );

-- ════════════════════════════════════════════════════════
-- 3. SERVICE ACCOUNT BYPASS POLICY
--    Backend services that legitimately need cross-tenant access
-- ════════════════════════════════════════════════════════

-- System admin policy already exists on core.users.
-- Add similar for key tables:
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'tournaments', 'teams', 'athletes', 'combat_matches'
  ]) AS name LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY system_admin_%I ON %I
          FOR ALL
          USING (current_setting(''app.is_system_admin'', true) = ''true'')',
        tbl.name, tbl.name
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;

COMMIT;
