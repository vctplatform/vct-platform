-- ===============================================================
-- VCT Platform — Migration 0083: SECURITY HARDENING + POLISH
-- P2 Medium: search_path pinning, view trigger fix,
-- table comments, uuid defaults, idempotent guards
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. FIX: View trigger RETURNING * INTO NEW bug (0074)
--    INSTEAD OF triggers cannot use RETURNING INTO NEW
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_users_view_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_new_id UUID;
BEGIN
  v_new_id := COALESCE(NEW.id, uuidv7());
  INSERT INTO core.users (
    id, tenant_id, username, email, phone, password_hash,
    full_name, avatar_url, is_active, created_at, updated_at
  ) VALUES (
    v_new_id,
    COALESCE(
      NEW.tenant_id,
      NULLIF(current_setting('app.current_tenant', true), '')::UUID,
      '00000000-0000-7000-8000-000000000001'::UUID
    ),
    NEW.username, NEW.email, NEW.phone, NEW.password_hash,
    NEW.full_name, NEW.avatar_url,
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  );
  -- Return NEW directly (no RETURNING INTO)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = core, public, pg_catalog;

-- ════════════════════════════════════════════════════════
-- 2. PIN search_path ON ALL SECURITY FUNCTIONS
-- ════════════════════════════════════════════════════════

-- raise_tenant_required
CREATE OR REPLACE FUNCTION system.raise_tenant_required()
RETURNS TEXT AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY: app.current_tenant must be set. '
    'Direct database access without tenant context is forbidden. '
    'Use SET app.current_tenant = ''<uuid>'' before queries.'
    USING ERRCODE = 'insufficient_privilege';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = system, pg_catalog;

-- create_strict_rls_policy
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
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', v_old_policy, v_full_table);
  EXECUTE format(
    'CREATE POLICY %I ON %s
      USING (
        tenant_id = (
          CASE
            WHEN current_setting(''app.current_tenant'', true) IS NULL
              OR current_setting(''app.current_tenant'', true) = ''''
            THEN (SELECT system.raise_tenant_required())::UUID
            ELSE current_setting(''app.current_tenant'', true)::UUID
          END
        )
      )',
    v_policy_name, v_full_table
  );
END;
$$ LANGUAGE plpgsql
SET search_path = system, pg_catalog;

-- ════════════════════════════════════════════════════════
-- 3. CHANGE gen_random_uuid() DEFAULTS → uuidv7()
--    Only changes DEFAULT, does NOT touch existing data
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      a.attname AS column_name
    FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pg_get_expr(d.adbin, d.adrelid) LIKE '%gen_random_uuid()%'
      AND c.relkind = 'r'
      AND n.nspname NOT IN ('pg_catalog','information_schema')
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT uuidv7()',
        r.schema_name, r.table_name, r.column_name
      );
      RAISE NOTICE 'Changed default: %.%.% → uuidv7()',
        r.schema_name, r.table_name, r.column_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to change default for %.%.%: %',
        r.schema_name, r.table_name, r.column_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 4. TABLE + COLUMN COMMENTS (Top 20 Tables)
-- ════════════════════════════════════════════════════════

-- Core auth
COMMENT ON TABLE core.users IS 'VCT Platform users — all roles (admin, referee, athlete, delegate, etc.). Primary auth table.';
COMMENT ON TABLE core.sessions IS 'Active user sessions with JWT tokens. Managed by auth middleware.';
COMMENT ON TABLE core.auth_audit_log IS 'Audit trail for auth events (login, logout, password change, etc.).';
COMMENT ON TABLE core.tenants IS 'Multi-tenant organizations (federations, clubs). All data is tenant-scoped.';
COMMENT ON TABLE core.roles IS 'RBAC roles with permission grants. Assigned to users via core.user_roles.';

-- Tournament
DO $$ BEGIN
  COMMENT ON TABLE tournaments IS 'Giải đấu Võ Cổ Truyền. Lifecycle: nhap → cho_duyet → da_duyet → dang_dang_ky → thi_dau → ket_thuc.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE athletes IS 'Vận động viên đăng ký thi đấu. Linked to clubs + tournaments.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE teams IS 'Đội thi đấu (đại diện tỉnh/thành, CLB). Contains multiple athletes.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE combat_matches IS 'Trận đối kháng. Scoring: diem_do (red) vs diem_xanh (blue).';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE registrations IS '[DEPRECATED] Legacy registration. Use tournament_registrations instead.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE referees IS 'Trọng tài giải đấu. Linked to user accounts via user_id.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE arenas IS 'Sàn đấu — physical arena for combat matches.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Reference tables
DO $$ BEGIN
  COMMENT ON TABLE ref_belt_ranks IS 'Hệ thống đai rank: trắng → vàng → xanh_la → xanh_duong → đỏ → đen.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE ref_age_categories IS 'Hạng tuổi thi đấu: thiếu nhi, thiếu niên, thanh niên, tuyển, cao tuổi.';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON TABLE ref_scoring_criteria IS 'Tiêu chí chấm điểm: kỹ thuật, lực, tốc độ, phong thái (quyền) + tấn công, phòng thủ (đối kháng).';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- System
COMMENT ON TABLE system.schema_migrations IS 'Migration version tracking. All applied migrations are recorded here.';
DO $$ BEGIN
  COMMENT ON TABLE system.notification_queue IS 'Async notification dispatch queue (email, push, SMS, webhook).';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Key columns
DO $$ BEGIN
  COMMENT ON COLUMN tournaments.status IS 'Trạng thái giải: nhap|cho_duyet|da_duyet|dang_dang_ky|dong_dang_ky|boc_tham|thi_dau|hoan|ket_thuc|huy';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON COLUMN athletes.trang_thai IS 'Trạng thái VĐV: nhap|cho_duyet|da_duyet|tu_choi|dinh_chi|nghi_thi_dau|rut|giai_nghe';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  COMMENT ON COLUMN combat_matches.trang_thai IS 'Trạng thái trận: chua_dau|dang_dau|tam_dung|ket_thuc|huy|cho_ket_qua|bao_luu|bo_cuoc';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ════════════════════════════════════════════════════════
-- 5. MONITORING: gen_random_uuid check (should be empty)
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_uuid_defaults CASCADE;
CREATE VIEW system.v_uuid_defaults AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  a.attname AS column_name,
  pg_get_expr(d.adbin, d.adrelid) AS default_expr,
  CASE
    WHEN pg_get_expr(d.adbin, d.adrelid) LIKE '%uuidv7%' THEN '✅ uuidv7'
    WHEN pg_get_expr(d.adbin, d.adrelid) LIKE '%gen_random_uuid%' THEN '⚠️ v4'
    ELSE '❓ other'
  END AS uuid_version
FROM pg_attrdef d
JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
JOIN pg_class c ON c.oid = d.adrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (pg_get_expr(d.adbin, d.adrelid) LIKE '%uuid%')
  AND c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY uuid_version DESC, schema_name, table_name;

-- ════════════════════════════════════════════════════════
-- 6. REGISTER THIS MIGRATION IN TRACKING TABLE
-- ════════════════════════════════════════════════════════

INSERT INTO system.schema_migrations (version, name, notes) VALUES
  ('0079', 'fix_temporal_trigger', 'Dynamic column mapping for temporal versioning'),
  ('0080', 'enum_check_sync', 'Unified ENUM ↔ CHECK single source of truth'),
  ('0081', 'fk_redirect_on_delete', 'Redirect FKs to core.users + ON DELETE policies'),
  ('0082', 'complete_rls_coverage', 'Strict RLS for all 25+ tenant tables'),
  ('0083', 'security_hardening', 'search_path pin, view trigger fix, comments, uuid defaults')
ON CONFLICT (version) DO NOTHING;

COMMIT;
