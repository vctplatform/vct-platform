-- ===============================================================
-- VCT Platform — Migration 0085: SUBSCRIPTION & BILLING
-- Schema: platform.* | Plans, subscriptions, billing cycles, renewal logs
-- ===============================================================

BEGIN;

-- ── Subscription Plans (Gói dịch vụ) ────────────────────────
CREATE TABLE IF NOT EXISTS platform.subscription_plans (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  code              VARCHAR(50) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  entity_type       VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('federation', 'organization', 'tournament')),
  features          JSONB DEFAULT '{}',
  price_monthly     DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  price_yearly      DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (price_yearly >= 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  max_members       INT DEFAULT 0,
  max_tournaments   INT DEFAULT 0,
  max_athletes      INT DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  sort_order        INT DEFAULT 0,
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, code, entity_type)
);

-- ── Subscriptions (Đăng ký gói) ─────────────────────────────
CREATE TABLE IF NOT EXISTS platform.subscriptions (
  id                    UUID DEFAULT uuidv7() NOT NULL,
  tenant_id             UUID NOT NULL REFERENCES core.tenants(id),
  plan_id               UUID NOT NULL,
  plan_code             VARCHAR(50),
  plan_name             VARCHAR(200),
  entity_type           VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('federation', 'organization', 'tournament')),
  entity_id             UUID NOT NULL,
  entity_name           VARCHAR(200),
  status                VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired')),
  billing_cycle_type    VARCHAR(20) NOT NULL DEFAULT 'yearly'
    CHECK (billing_cycle_type IN ('monthly', 'yearly')),
  current_period_start  DATE NOT NULL,
  current_period_end    DATE NOT NULL,
  trial_end_date        DATE,
  cancelled_at          TIMESTAMPTZ,
  cancel_reason         TEXT,
  auto_renew            BOOLEAN DEFAULT true,
  payment_method_id     UUID,
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by            UUID,
  version               INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ── Billing Cycles (Kỳ thanh toán) ──────────────────────────
CREATE TABLE IF NOT EXISTS platform.billing_cycles (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  subscription_id   UUID NOT NULL,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  amount            DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  invoice_id        UUID,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue', 'void')),
  due_date          DATE NOT NULL,
  paid_at           TIMESTAMPTZ,
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- ── Renewal Logs (Nhật ký gia hạn) ──────────────────────────
CREATE TABLE IF NOT EXISTS platform.renewal_logs (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  subscription_id   UUID NOT NULL,
  action            VARCHAR(30) NOT NULL
    CHECK (action IN ('auto_renew', 'manual_renew', 'upgrade', 'downgrade', 'cancel', 'suspend', 'reactivate')),
  old_plan_id       UUID,
  new_plan_id       UUID,
  old_status        VARCHAR(20),
  new_status        VARCHAR(20),
  amount            DECIMAL(15,2) DEFAULT 0,
  notes             TEXT,
  performed_by      UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

-- ── Row-Level Security ──────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.subscription_plans', 'platform.subscriptions',
    'platform.billing_cycles', 'platform.renewal_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %s
        USING (tenant_id = COALESCE(
          current_setting(''app.current_tenant'', true)::UUID,
          ''00000000-0000-7000-8000-000000000001''::UUID
        ))',
      tbl
    );
  END LOOP;
END $$;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sub_plans_tenant_type
  ON platform.subscription_plans(tenant_id, entity_type)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_entity
  ON platform.subscriptions(tenant_id, entity_type, entity_id)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status
  ON platform.subscriptions(tenant_id, status)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring
  ON platform.subscriptions(tenant_id, current_period_end)
  WHERE status = 'active' AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_billing_cycles_subscription
  ON platform.billing_cycles(tenant_id, subscription_id)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_billing_cycles_status
  ON platform.billing_cycles(tenant_id, status, due_date)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_renewal_logs_subscription
  ON platform.renewal_logs(tenant_id, subscription_id, created_at DESC);

-- ── Triggers ────────────────────────────────────────────────
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.subscription_plans', 'platform.subscriptions',
    'platform.billing_cycles'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
END $$;

COMMIT;
