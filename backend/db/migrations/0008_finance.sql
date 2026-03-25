-- ===============================================================
-- VCT Platform — Migration 0008: FINANCE MODULE (Enterprise)
-- Schema: platform.* | Fees, payments, invoices, sponsorships, budgets
-- ===============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS platform.fee_schedules (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  club_id           UUID,
  name              VARCHAR(200) NOT NULL,
  fee_type          VARCHAR(50) NOT NULL
    CHECK (fee_type IN ('hoc_phi', 'le_phi_giai', 'thi_dai', 'dang_ky', 'bao_hiem')),
  amount            DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  period            VARCHAR(20)
    CHECK (period IN ('thang', 'quy', 'nam', 'mot_lan')),
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.payments (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  fee_schedule_id   UUID,
  payer_user_id     UUID,
  payer_name        VARCHAR(200) NOT NULL,
  amount            DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  payment_method    VARCHAR(50)
    CHECK (payment_method IN ('tien_mat', 'chuyen_khoan', 'vietqr', 'momo', 'zalopay', 'vnpay')),
  transaction_ref   VARCHAR(200),
  payment_date      DATE NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded', 'cancelled')),
  confirmed_by      UUID,
  confirmed_at      TIMESTAMPTZ,
  notes             TEXT,
  receipt_url       TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.invoices (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  invoice_number    VARCHAR(50) NOT NULL,
  club_id           UUID,
  tournament_id     UUID,
  customer_name     VARCHAR(200) NOT NULL,
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20),
  customer_address  TEXT,
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount        DECIMAL(12,2) DEFAULT 0,
  discount_amount   DECIMAL(12,2) DEFAULT 0,
  total_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(10) DEFAULT 'VND',
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'voided')),
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  paid_date         DATE,
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS platform.invoice_items (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  invoice_id        UUID NOT NULL,
  description       VARCHAR(500) NOT NULL,
  quantity          INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price        DECIMAL(12,2) NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.sponsorships (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  sponsor_name      VARCHAR(200) NOT NULL,
  sponsor_type      VARCHAR(50)
    CHECK (sponsor_type IN ('doanh_nghiep', 'ca_nhan', 'to_chuc', 'truyen_thong')),
  contact_person    VARCHAR(200),
  contact_email     VARCHAR(255),
  contact_phone     VARCHAR(20),
  logo_url          TEXT,
  website           TEXT,
  package_name      VARCHAR(100),
  amount            DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency          VARCHAR(10) DEFAULT 'VND',
  tournament_id     UUID,
  benefits          TEXT,
  contract_start    DATE,
  contract_end      DATE,
  status            VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.tournament_budgets (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  tournament_id     UUID NOT NULL,
  name              VARCHAR(200) NOT NULL,
  total_budget      DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_spent       DECIMAL(15,2) DEFAULT 0,
  total_income      DECIMAL(15,2) DEFAULT 0,
  status            VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'active', 'closed')),
  approved_by       UUID,
  approved_at       TIMESTAMPTZ,
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS platform.budget_items (
  id                UUID DEFAULT uuidv7() NOT NULL,
  tenant_id         UUID NOT NULL REFERENCES core.tenants(id),
  budget_id         UUID NOT NULL,
  category          VARCHAR(100) NOT NULL,
  item_type         VARCHAR(10) NOT NULL CHECK (item_type IN ('income', 'expense')),
  description       VARCHAR(500) NOT NULL,
  planned_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_amount     DECIMAL(12,2) DEFAULT 0,
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version           INT NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id)
);

-- RLS
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.fee_schedules', 'platform.payments', 'platform.invoices',
    'platform.invoice_items', 'platform.sponsorships',
    'platform.tournament_budgets', 'platform.budget_items'
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_fees_tenant_type ON platform.fee_schedules(tenant_id, fee_type) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON platform.payments(tenant_id, status, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON platform.payments(tenant_id, payer_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON platform.invoices(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON platform.invoice_items(tenant_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_tournament ON platform.sponsorships(tenant_id, tournament_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_budgets_tournament ON platform.tournament_budgets(tenant_id, tournament_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON platform.budget_items(tenant_id, budget_id);

-- TRIGGERS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform.fee_schedules', 'platform.payments', 'platform.invoices',
    'platform.sponsorships', 'platform.tournament_budgets', 'platform.budget_items'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()', tbl);
  END LOOP;
END $$;

COMMIT;
