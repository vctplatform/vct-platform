-- ===============================================================
-- VCT Platform — Migration 0004: ENTERPRISE FOUNDATION
-- Schemas, UUIDv7, base functions, core tenant/identity tables
-- Target: 1B users, 1000s concurrent events, multi-region
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SCHEMA NAMESPACES
-- ════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS core;        -- Tenant & Identity
CREATE SCHEMA IF NOT EXISTS tournament;  -- Giải đấu & Thi đấu
CREATE SCHEMA IF NOT EXISTS people;      -- Con người
CREATE SCHEMA IF NOT EXISTS training;    -- Đào tạo
CREATE SCHEMA IF NOT EXISTS platform;    -- Community, Finance, Heritage
CREATE SCHEMA IF NOT EXISTS system;      -- Infrastructure
CREATE SCHEMA IF NOT EXISTS api_v1;      -- Stable API views

-- ════════════════════════════════════════════════════════
-- 2. UUIDv7 FUNCTION (Time-ordered UUID)
--    40-60% better insert perf vs UUIDv4
--    Sequential → minimal B-tree fragmentation
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION uuidv7() RETURNS UUID AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  uuid_bytes = substring(int8send(unix_ts_ms) FROM 3);           -- 6 bytes timestamp
  uuid_bytes = uuid_bytes || gen_random_bytes(10);                -- 10 bytes random
  -- Set version 7
  uuid_bytes = set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & x'0F'::INT) | x'70'::INT);
  -- Set variant 2
  uuid_bytes = set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & x'3F'::INT) | x'80'::INT);
  RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ════════════════════════════════════════════════════════
-- 3. BASE TRIGGER FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Overwrite the one from 0002 to also bump version
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF TG_TABLE_NAME != 'schema_migrations' THEN
    BEGIN
      NEW.version = COALESCE(OLD.version, 0) + 1;
    EXCEPTION WHEN undefined_column THEN
      NULL; -- table may not have version column
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prevent hard deletes on protected tables
CREATE OR REPLACE FUNCTION trigger_prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard deletes are not allowed on %. Use soft-delete (SET is_deleted = true) instead.', TG_TABLE_NAME;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Auto-set tenant_id from session variable
CREATE OR REPLACE FUNCTION trigger_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    BEGIN
      NEW.tenant_id = current_setting('app.current_tenant', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'tenant_id is required. Set via SET app.current_tenant or provide explicitly.';
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. CORE TABLES: TENANTS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.tenants (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(50) UNIQUE NOT NULL,
  tenant_type   VARCHAR(30) NOT NULL DEFAULT 'federation',
  -- CHECK (tenant_type IN ('system', 'federation', 'club', 'school'))
  parent_id     UUID REFERENCES core.tenants(id),
  domain        VARCHAR(200),
  logo_url      TEXT,
  settings      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version       INT NOT NULL DEFAULT 1
);

-- System tenant (root)
INSERT INTO core.tenants (id, name, code, tenant_type)
VALUES ('00000000-0000-7000-8000-000000000001', 'VCT System', 'vct_system', 'system')
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 5. CORE TABLES: ENHANCED USERS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.users (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  username        VARCHAR(50) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  avatar_url      TEXT,
  locale          VARCHAR(10) DEFAULT 'vi',
  timezone        VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  is_active       BOOLEAN DEFAULT true,
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID,
  version         INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, username),
  UNIQUE (tenant_id, email)
);

-- RLS
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON core.users
  USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant', true)::UUID,
      '00000000-0000-7000-8000-000000000001'::UUID
    )
  );

-- System admin bypasses RLS
CREATE POLICY system_admin_users ON core.users
  FOR ALL
  USING (
    current_setting('app.is_system_admin', true) = 'true'
  );

-- ════════════════════════════════════════════════════════
-- 6. CORE TABLES: ROLES & PERMISSIONS
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.roles (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id     UUID NOT NULL REFERENCES core.tenants(id),
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  permissions   JSONB DEFAULT '[]',
  is_system     BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version       INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS core.user_roles (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id     UUID NOT NULL REFERENCES core.tenants(id),
  user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  role_id       UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
  scope_type    VARCHAR(30) NOT NULL DEFAULT 'TENANT',
  scope_id      UUID,
  granted_by    UUID REFERENCES core.users(id),
  granted_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  UNIQUE (tenant_id, user_id, role_id, scope_type, scope_id)
);

-- ════════════════════════════════════════════════════════
-- 7. CORE TABLES: SESSIONS & AUTH AUDIT
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.sessions (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id     UUID NOT NULL REFERENCES core.tenants(id),
  user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  device_info   JSONB DEFAULT '{}',
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.auth_audit_log (
  id            UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id     UUID NOT NULL REFERENCES core.tenants(id),
  user_id       UUID REFERENCES core.users(id),
  action        VARCHAR(50) NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  details       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- 8. INDEXES
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tenants_parent ON core.tenants(parent_id);
CREATE INDEX IF NOT EXISTS idx_tenants_type ON core.tenants(tenant_type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON core.users(tenant_id, is_active)
  WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_users_email ON core.users(tenant_id, email)
  WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON core.users(tenant_id, last_login_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON core.user_roles(tenant_id, user_id)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON core.user_roles(scope_type, scope_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sessions_user ON core.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON core.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON core.sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON core.auth_audit_log(tenant_id, user_id, created_at DESC);

-- ════════════════════════════════════════════════════════
-- 9. TRIGGERS
-- ════════════════════════════════════════════════════════

CREATE TRIGGER set_updated_at BEFORE UPDATE ON core.tenants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON core.roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Prevent hard deletes on users
CREATE TRIGGER prevent_hard_delete BEFORE DELETE ON core.users
  FOR EACH ROW EXECUTE FUNCTION trigger_prevent_hard_delete();

-- Seed default roles
INSERT INTO core.roles (tenant_id, name, description, is_system, permissions) VALUES
  ('00000000-0000-7000-8000-000000000001', 'SYSTEM_ADMIN', 'Quản trị viên hệ thống', true, '["*"]'),
  ('00000000-0000-7000-8000-000000000001', 'FEDERATION_ADMIN', 'Quản trị viên liên đoàn', true, '["federation.*"]'),
  ('00000000-0000-7000-8000-000000000001', 'CLUB_MANAGER', 'Quản lý CLB', true, '["club.*"]'),
  ('00000000-0000-7000-8000-000000000001', 'COACH', 'Huấn luyện viên', true, '["training.*","people.read"]'),
  ('00000000-0000-7000-8000-000000000001', 'REFEREE', 'Trọng tài', true, '["scoring.*","tournament.read"]'),
  ('00000000-0000-7000-8000-000000000001', 'ATHLETE', 'Vận động viên', true, '["profile.*","training.read"]'),
  ('00000000-0000-7000-8000-000000000001', 'DELEGATE', 'Trưởng đoàn', true, '["team.*","registration.*"]'),
  ('00000000-0000-7000-8000-000000000001', 'VIEWER', 'Người xem', true, '["*.read"]')
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;
