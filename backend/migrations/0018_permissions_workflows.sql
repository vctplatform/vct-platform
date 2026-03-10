-- ===============================================================
-- VCT Platform — Migration 0018: PERMISSIONS + WORKFLOWS (Phase 4A)
-- Fine-grained RBAC, approval workflows, notification templates,
-- webhook management
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. FINE-GRAINED PERMISSION SYSTEM
--    Replaces coarse JSON permissions in core.roles
--    Resource + Action matrix with deny/allow
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.permissions (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  resource        VARCHAR(100) NOT NULL,     -- 'tournament', 'athlete', 'payment'
  action          VARCHAR(50) NOT NULL,      -- 'create', 'read', 'update', 'delete', 'approve', 'export'
  description     TEXT,
  is_system       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (resource, action)
);

-- Role ↔ Permission mapping
CREATE TABLE IF NOT EXISTS core.role_permissions (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  role_id         UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
  permission_id   UUID NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
  effect          VARCHAR(10) NOT NULL DEFAULT 'allow'
    CHECK (effect IN ('allow', 'deny')),
  conditions      JSONB DEFAULT '{}',   -- {"own_only": true, "max_amount": 1000000}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, role_id, permission_id)
);

-- Seed essential permissions
INSERT INTO core.permissions (resource, action, description, is_system) VALUES
  -- Tournament
  ('tournament', 'create', 'Tạo giải đấu', true),
  ('tournament', 'read', 'Xem giải đấu', true),
  ('tournament', 'update', 'Cập nhật giải đấu', true),
  ('tournament', 'delete', 'Xóa giải đấu', true),
  ('tournament', 'approve', 'Phê duyệt giải đấu', true),
  ('tournament', 'manage_brackets', 'Quản lý bảng đấu', true),
  -- Athlete
  ('athlete', 'create', 'Đăng ký VĐV', true),
  ('athlete', 'read', 'Xem VĐV', true),
  ('athlete', 'update', 'Cập nhật VĐV', true),
  ('athlete', 'approve_registration', 'Phê duyệt đăng ký', true),
  -- Scoring
  ('scoring', 'record', 'Ghi điểm trận đấu', true),
  ('scoring', 'override', 'Ghi đè điểm', true),
  ('scoring', 'read', 'Xem điểm', true),
  -- Payment
  ('payment', 'create', 'Tạo thanh toán', true),
  ('payment', 'confirm', 'Xác nhận thanh toán', true),
  ('payment', 'refund', 'Hoàn tiền', true),
  ('payment', 'read', 'Xem thanh toán', true),
  ('payment', 'export', 'Xuất báo cáo tài chính', true),
  -- Training
  ('training', 'create', 'Tạo buổi tập', true),
  ('training', 'read', 'Xem lịch tập', true),
  ('training', 'manage_attendance', 'Quản lý điểm danh', true),
  ('training', 'manage_exams', 'Quản lý thi đai', true),
  -- Heritage
  ('heritage', 'create', 'Tạo nội dung di sản', true),
  ('heritage', 'read', 'Xem di sản', true),
  ('heritage', 'approve', 'Phê duyệt nội dung di sản', true),
  -- Community
  ('community', 'create_post', 'Đăng bài', true),
  ('community', 'moderate', 'Kiểm duyệt nội dung', true),
  ('community', 'manage_groups', 'Quản lý nhóm', true),
  -- System
  ('system', 'manage_users', 'Quản lý người dùng', true),
  ('system', 'manage_tenants', 'Quản lý tenants', true),
  ('system', 'view_audit', 'Xem audit log', true),
  ('system', 'manage_config', 'Cấu hình hệ thống', true),
  ('system', 'manage_api_keys', 'Quản lý API keys', true)
ON CONFLICT (resource, action) DO NOTHING;

-- RLS
ALTER TABLE core.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON core.role_permissions
  USING (tenant_id = COALESCE(
    current_setting('app.current_tenant', true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON core.role_permissions(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_perms_resource ON core.permissions(resource, action);

-- Permission check function (called from Go middleware)
CREATE OR REPLACE FUNCTION core.has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tenant UUID;
  v_result BOOLEAN := false;
BEGIN
  v_tenant := COALESCE(p_tenant_id,
    current_setting('app.current_tenant', true)::UUID);

  -- Check if any active role grants this permission (allow wins over deny)
  SELECT EXISTS(
    SELECT 1
    FROM core.user_roles ur
    JOIN core.role_permissions rp ON rp.role_id = ur.role_id AND rp.tenant_id = ur.tenant_id
    JOIN core.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND ur.tenant_id = v_tenant
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.resource = p_resource
      AND p.action = p_action
      AND rp.effect = 'allow'
      -- Check no explicit deny exists
      AND NOT EXISTS (
        SELECT 1
        FROM core.user_roles ur2
        JOIN core.role_permissions rp2 ON rp2.role_id = ur2.role_id AND rp2.tenant_id = ur2.tenant_id
        JOIN core.permissions p2 ON p2.id = rp2.permission_id
        WHERE ur2.user_id = p_user_id
          AND ur2.tenant_id = v_tenant
          AND p2.resource = p_resource
          AND p2.action = p_action
          AND rp2.effect = 'deny'
      )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 2. APPROVAL WORKFLOW ENGINE
--    Generic multi-step approval for tournaments, payments,
--    belt promotions, heritage content
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.approval_workflows (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  name            VARCHAR(200) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,     -- 'tournament', 'payment_refund', 'belt_promotion'
  steps           JSONB NOT NULL,            -- [{step: 1, role: 'FEDERATION_ADMIN', action: 'approve'}, ...]
  is_active       BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, entity_type)
);

CREATE TABLE IF NOT EXISTS core.approval_requests (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  workflow_id     UUID NOT NULL REFERENCES core.approval_workflows(id),
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID NOT NULL,
  current_step    INT NOT NULL DEFAULT 1,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'cancelled', 'expired')),
  requested_by    UUID NOT NULL REFERENCES core.users(id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS core.approval_actions (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  request_id      UUID NOT NULL REFERENCES core.approval_requests(id) ON DELETE CASCADE,
  step_number     INT NOT NULL,
  action          VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'comment', 'delegate')),
  actor_id        UUID NOT NULL REFERENCES core.users(id),
  comment         TEXT,
  delegated_to    UUID REFERENCES core.users(id),
  acted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE core.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.approval_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'core.approval_workflows', 'core.approval_requests', 'core.approval_actions'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s USING (tenant_id = COALESCE(current_setting(''app.current_tenant'', true)::UUID, ''00000000-0000-7000-8000-000000000001''::UUID))',
      tbl
    );
  END LOOP;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_req_entity ON core.approval_requests(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_req_status ON core.approval_requests(tenant_id, status) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_approval_actions_req ON core.approval_actions(request_id, step_number);

-- Triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON core.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON core.approval_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 3. NOTIFICATION TEMPLATES
--    Structured, multi-channel notification system
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.notification_templates (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = system-wide
  code            VARCHAR(100) NOT NULL,              -- 'tournament_approved', 'payment_confirmed'
  channel         VARCHAR(20) NOT NULL
    CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
  subject         TEXT,
  body_template   TEXT NOT NULL,           -- Go template: "Xin chào {{.UserName}}"
  variables       JSONB DEFAULT '[]',      -- ["UserName", "TournamentName", ...]
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code, channel)
);

-- Seed templates
INSERT INTO system.notification_templates (code, channel, subject, body_template, variables) VALUES
  ('tournament_created', 'in_app', 'Giải đấu mới', 'Giải đấu "{{.TournamentName}}" đã được tạo.', '["TournamentName"]'),
  ('tournament_approved', 'in_app', 'Giải đấu phê duyệt', 'Giải đấu "{{.TournamentName}}" đã được phê duyệt bởi {{.ApproverName}}.', '["TournamentName", "ApproverName"]'),
  ('registration_approved', 'in_app', 'Đăng ký được duyệt', 'Đăng ký của VĐV {{.AthleteName}} cho {{.TournamentName}} đã được duyệt.', '["AthleteName", "TournamentName"]'),
  ('payment_confirmed', 'in_app', 'Thanh toán xác nhận', 'Thanh toán {{.Amount}} {{.Currency}} đã được xác nhận.', '["Amount", "Currency"]'),
  ('match_starting', 'push', 'Trận đấu sắp bắt đầu', 'Trận {{.MatchName}} sẽ bắt đầu trong 5 phút tại {{.Arena}}.', '["MatchName", "Arena"]'),
  ('belt_promotion', 'in_app', 'Thăng đai', 'Chúc mừng {{.AthleteName}} đã đạt đai {{.BeltName}}!', '["AthleteName", "BeltName"]'),
  ('training_reminder', 'push', 'Nhắc nhở tập luyện', 'Buổi tập "{{.SessionTitle}}" bắt đầu lúc {{.StartTime}} hôm nay.', '["SessionTitle", "StartTime"]')
ON CONFLICT DO NOTHING;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.notification_templates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 4. WEBHOOK MANAGEMENT
--    Outgoing webhooks for external integrations
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.webhooks (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  name            VARCHAR(200) NOT NULL,
  url             TEXT NOT NULL,
  secret          VARCHAR(255) NOT NULL,    -- HMAC signing key
  events          JSONB NOT NULL DEFAULT '[]',  -- ["tournament.created", "payment.confirmed"]
  headers         JSONB DEFAULT '{}',        -- Custom headers
  is_active       BOOLEAN DEFAULT true,
  retry_count     INT DEFAULT 3,
  timeout_seconds INT DEFAULT 10,
  last_triggered_at TIMESTAMPTZ,
  last_status     INT,                       -- HTTP status code
  failure_count   INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS system.webhook_deliveries (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  webhook_id      UUID NOT NULL REFERENCES system.webhooks(id) ON DELETE CASCADE,
  event_type      VARCHAR(100) NOT NULL,
  payload         JSONB NOT NULL,
  response_status INT,
  response_body   TEXT,
  response_time_ms INT,
  attempt_number  INT DEFAULT 1,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE system.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.webhooks
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));
CREATE POLICY tenant_isolation ON system.webhook_deliveries
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_active ON system.webhooks(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON system.webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON system.webhook_deliveries(created_at)
  WHERE status IN ('pending', 'retrying');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.webhooks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;
