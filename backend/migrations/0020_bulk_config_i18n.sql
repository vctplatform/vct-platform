-- ===============================================================
-- VCT Platform — Migration 0020: BULK IMPORT + CONFIG (Phase 4C)
-- CSV/Excel import staging, versioned config, i18n support,
-- data export tracking
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. BULK IMPORT STAGING
--    CSV/Excel imports land here first → validated → committed
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.import_jobs (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  name            VARCHAR(200) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,    -- 'athletes', 'clubs', 'payments'
  file_name       VARCHAR(500) NOT NULL,
  file_size       BIGINT,
  total_rows      INT DEFAULT 0,
  processed_rows  INT DEFAULT 0,
  success_rows    INT DEFAULT 0,
  error_rows      INT DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'validating', 'validated', 'importing',
                      'completed', 'failed', 'cancelled', 'partial')),
  error_summary   JSONB DEFAULT '[]',
  mapping_config  JSONB DEFAULT '{}',        -- column mapping
  options         JSONB DEFAULT '{}',        -- skip_duplicates, update_existing, etc
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  imported_by     UUID REFERENCES core.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS system.import_rows (
  id              UUID DEFAULT uuidv7() NOT NULL,
  tenant_id       UUID NOT NULL,
  job_id          UUID NOT NULL REFERENCES system.import_jobs(id) ON DELETE CASCADE,
  row_number      INT NOT NULL,
  raw_data        JSONB NOT NULL,            -- original CSV row as JSON
  validated_data  JSONB,                     -- after validation/transformation
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'valid', 'invalid', 'imported', 'skipped')),
  errors          JSONB DEFAULT '[]',        -- [{field: "email", error: "invalid format"}]
  entity_id       UUID,                      -- ID of created/updated entity
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_id, row_number)           -- natural partition key
);

-- RLS
ALTER TABLE system.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system.import_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.import_jobs
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));
CREATE POLICY tenant_isolation ON system.import_rows
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant ON system.import_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON system.import_rows(job_id, status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.import_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 2. VERSIONED CONFIGURATION
--    System-wide and tenant-specific config with history
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.configurations (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = system-wide
  category        VARCHAR(100) NOT NULL,     -- 'scoring', 'registration', 'notification'
  key             VARCHAR(200) NOT NULL,     -- 'scoring.max_points', 'reg.auto_approve'
  value           JSONB NOT NULL,
  value_type      VARCHAR(20) NOT NULL DEFAULT 'string'
    CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array')),
  description     TEXT,
  is_secure       BOOLEAN DEFAULT false,     -- encrypted values
  is_readonly     BOOLEAN DEFAULT false,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID,
  version         INT NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS system.configuration_history (
  id              UUID DEFAULT uuidv7() NOT NULL,
  config_id       UUID NOT NULL REFERENCES system.configurations(id) ON DELETE CASCADE,
  old_value       JSONB,
  new_value       JSONB NOT NULL,
  changed_by      UUID,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason   TEXT,
  PRIMARY KEY (changed_at, config_id, id)
) PARTITION BY RANGE (changed_at);

-- Default partition
CREATE TABLE IF NOT EXISTS system.config_history_default
  PARTITION OF system.configuration_history DEFAULT;

-- Auto-track config changes
CREATE OR REPLACE FUNCTION trigger_config_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO system.configuration_history
      (config_id, old_value, new_value, changed_by)
    VALUES (
      NEW.id, OLD.value, NEW.value,
      NULLIF(current_setting('app.current_user', true), '')::UUID
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER track_config_changes
    AFTER UPDATE ON system.configurations
    FOR EACH ROW EXECUTE FUNCTION trigger_config_history();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.configurations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Seed default configs
INSERT INTO system.configurations (category, key, value, value_type, description) VALUES
  ('scoring', '"scoring.points.thang"', '"3"', 'number', 'Điểm thắng trận'),
  ('scoring', '"scoring.points.hoa"', '"1"', 'number', 'Điểm hòa trận'),
  ('scoring', '"scoring.points.thua"', '"0"', 'number', 'Điểm thua trận'),
  ('scoring', '"scoring.round.duration_seconds"', '"120"', 'number', 'Thời gian 1 hiệp (giây)'),
  ('scoring', '"scoring.round.count"', '"3"', 'number', 'Số hiệp tối đa'),
  ('registration', '"reg.auto_approve"', 'false', 'boolean', 'Tự động duyệt đăng ký'),
  ('registration', '"reg.max_athletes_per_club"', '"50"', 'number', 'Số VĐV tối đa mỗi CLB'),
  ('notification', '"notif.email_enabled"', 'true', 'boolean', 'Gửi email thông báo'),
  ('notification', '"notif.push_enabled"', 'true', 'boolean', 'Push notification'),
  ('tournament', '"tournament.bracket.seeding"', '"ranking"', 'string', 'Phương pháp xếp hạt giống'),
  ('platform', '"platform.maintenance_mode"', 'false', 'boolean', 'Chế độ bảo trì')
ON CONFLICT DO NOTHING;

-- Config lookup function (tenant override → system fallback)
CREATE OR REPLACE FUNCTION system.get_config(
  p_key TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE v_val JSONB;
BEGIN
  -- Try tenant-specific first
  IF p_tenant_id IS NOT NULL THEN
    SELECT value INTO v_val FROM system.configurations
    WHERE key = p_key AND tenant_id = p_tenant_id;
    IF v_val IS NOT NULL THEN RETURN v_val; END IF;
  END IF;
  -- Fall back to system-wide
  SELECT value INTO v_val FROM system.configurations
  WHERE key = p_key AND tenant_id IS NULL;
  RETURN v_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- ════════════════════════════════════════════════════════
-- 3. I18N TRANSLATIONS
--    Multi-language support at DB level
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.translations (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID REFERENCES core.tenants(id),  -- NULL = system
  locale          VARCHAR(10) NOT NULL,       -- 'vi', 'en', 'zh'
  namespace       VARCHAR(100) NOT NULL,      -- 'tournament', 'scoring', 'ui'
  key             VARCHAR(500) NOT NULL,      -- 'tournament.status.nhap'
  value           TEXT NOT NULL,
  is_approved     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, locale, namespace, key)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup
  ON system.translations(locale, namespace);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON system.translations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ════════════════════════════════════════════════════════
-- 4. DATA EXPORT TRACKING
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.export_jobs (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES core.tenants(id),
  entity_type     VARCHAR(100) NOT NULL,
  format          VARCHAR(20) NOT NULL
    CHECK (format IN ('csv', 'xlsx', 'pdf', 'json')),
  filters         JSONB DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows      INT DEFAULT 0,
  file_path       TEXT,
  file_size       BIGINT,
  download_count  INT DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  exported_by     UUID REFERENCES core.users(id),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system.export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON system.export_jobs
  USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::UUID, '00000000-0000-7000-8000-000000000001'::UUID));

CREATE INDEX IF NOT EXISTS idx_export_jobs_tenant ON system.export_jobs(tenant_id, status);

COMMIT;
