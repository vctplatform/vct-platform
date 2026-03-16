-- ===============================================================
-- VCT Platform — Migration 0073: DEV DATA ANONYMIZATION
-- Anonymize PII when cloning production DB to dev/staging
-- Preserves referential integrity while masking sensitive data
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. ANONYMIZATION RULES TABLE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.anonymization_rules (
  id              UUID DEFAULT uuidv7() PRIMARY KEY,
  table_name      VARCHAR(200) NOT NULL,
  column_name     VARCHAR(200) NOT NULL,
  strategy        VARCHAR(30) NOT NULL
    CHECK (strategy IN (
      'fake_name', 'fake_email', 'fake_phone', 'hash',
      'mask', 'null_out', 'randomize', 'preserve', 'fake_address'
    )),
  config          JSONB DEFAULT '{}',     -- strategy-specific config
  is_active       BOOLEAN DEFAULT true,
  priority        INT DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (table_name, column_name)
);

-- Seed rules for known PII columns
INSERT INTO system.anonymization_rules (table_name, column_name, strategy, priority) VALUES
  -- Users
  ('core.users', 'full_name', 'fake_name', 10),
  ('core.users', 'email', 'fake_email', 10),
  ('core.users', 'phone', 'fake_phone', 10),
  ('core.users', 'password_hash', 'hash', 10),
  ('core.users', 'avatar_url', 'null_out', 50),
  -- Athletes
  ('athletes', 'ho_ten', 'fake_name', 10),
  ('athletes', 'so_cccd', 'mask', 10),
  ('athletes', 'dia_chi', 'fake_address', 20),
  ('athletes', 'so_dien_thoai', 'fake_phone', 10),
  ('athletes', 'email', 'fake_email', 10),
  -- Coaches
  ('people.coaches', 'phone', 'fake_phone', 10),
  ('people.coaches', 'email', 'fake_email', 10),
  -- Parents
  ('people.parents', 'phone', 'fake_phone', 10),
  ('people.parents', 'email', 'fake_email', 10),
  ('people.parents', 'full_name', 'fake_name', 10),
  -- Payments
  ('platform.payments', 'payer_name', 'fake_name', 20),
  ('platform.payments', 'payer_email', 'fake_email', 20),
  ('platform.payments', 'gateway_response', 'null_out', 50),
  -- Sessions
  ('core.sessions', 'ip_address', 'mask', 30),
  ('core.sessions', 'user_agent', 'null_out', 30),
  -- Audit log
  ('system.audit_log', 'client_ip', 'mask', 40),
  ('system.audit_log', 'user_agent', 'null_out', 40)
ON CONFLICT (table_name, column_name) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 2. ANONYMIZATION HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════

-- Vietnamese fake name generator
CREATE OR REPLACE FUNCTION system.fake_vn_name(p_seed INT DEFAULT 0)
RETURNS TEXT AS $$
DECLARE
  v_ho TEXT[] := ARRAY['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng',
    'Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Đào','Đinh','Tạ','Lương'];
  v_dem TEXT[] := ARRAY['Văn','Thị','Đức','Minh','Thanh','Ngọc','Quốc','Hữu','Thúy','Xuân',
    'Anh','Hồng','Bảo','Quang','Phúc','Thành','Đình','Trọng','Kim','Tuấn'];
  v_ten TEXT[] := ARRAY['An','Bình','Cường','Dũng','Em','Phong','Giang','Hải','Khánh','Linh',
    'Mai','Nam','Oanh','Phú','Quyên','Sơn','Tâm','Uyên','Vinh','Yến'];
  v_idx INT;
BEGIN
  v_idx := abs(p_seed) % 20 + 1;
  RETURN v_ho[v_idx] || ' ' ||
    v_dem[(abs(p_seed * 7) % 20) + 1] || ' ' ||
    v_ten[(abs(p_seed * 13) % 20) + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fake email
CREATE OR REPLACE FUNCTION system.fake_email(p_seed INT DEFAULT 0)
RETURNS TEXT AS $$
BEGIN
  RETURN 'user' || abs(p_seed) || '@dev.vctplatform.test';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fake phone
CREATE OR REPLACE FUNCTION system.fake_phone(p_seed INT DEFAULT 0)
RETURNS TEXT AS $$
BEGIN
  RETURN '+84' || lpad((abs(p_seed) % 999999999)::TEXT, 9, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mask string (show first/last N chars)
CREATE OR REPLACE FUNCTION system.mask_string(
  p_value TEXT, p_show_first INT DEFAULT 2, p_show_last INT DEFAULT 2
)
RETURNS TEXT AS $$
BEGIN
  IF p_value IS NULL OR length(p_value) <= p_show_first + p_show_last THEN
    RETURN repeat('*', COALESCE(length(p_value), 4));
  END IF;
  RETURN left(p_value, p_show_first) ||
    repeat('*', length(p_value) - p_show_first - p_show_last) ||
    right(p_value, p_show_last);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fake address
CREATE OR REPLACE FUNCTION system.fake_address(p_seed INT DEFAULT 0)
RETURNS TEXT AS $$
DECLARE
  v_streets TEXT[] := ARRAY['Nguyễn Huệ','Lê Lợi','Trần Hưng Đạo','Hai Bà Trưng',
    'Lý Thường Kiệt','Điện Biên Phủ','Võ Văn Tần','Nam Kỳ Khởi Nghĩa'];
  v_cities TEXT[] := ARRAY['TP.HCM','Hà Nội','Đà Nẵng','Huế','Cần Thơ','Hải Phòng'];
BEGIN
  RETURN (abs(p_seed) % 200 + 1)::TEXT || ' ' ||
    v_streets[(abs(p_seed) % 8) + 1] || ', ' ||
    v_cities[(abs(p_seed * 3) % 6) + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ════════════════════════════════════════════════════════
-- 3. MAIN ANONYMIZATION FUNCTION
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.anonymize_database(
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  strategy TEXT,
  rows_affected INT,
  was_dry_run BOOLEAN
) AS $$
DECLARE
  r RECORD;
  v_count INT;
  v_sql TEXT;
  v_seed_expr TEXT;
BEGIN
  -- Safety check: never run on production
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'CANNOT anonymize production database! Set app.environment to dev/staging first.';
  END IF;

  FOR r IN
    SELECT * FROM system.anonymization_rules
    WHERE is_active = true
    ORDER BY priority, table_name
  LOOP
    table_name := r.table_name;
    column_name := r.column_name;
    strategy := r.strategy;
    was_dry_run := p_dry_run;

    -- Build seed expression (deterministic per row)
    v_seed_expr := format('abs(hashtext(id::TEXT || %L))', r.column_name);

    -- Build UPDATE SQL based on strategy
    v_sql := CASE r.strategy
      WHEN 'fake_name' THEN format(
        'UPDATE %s SET %I = system.fake_vn_name(%s) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, v_seed_expr, r.column_name)
      WHEN 'fake_email' THEN format(
        'UPDATE %s SET %I = system.fake_email(%s) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, v_seed_expr, r.column_name)
      WHEN 'fake_phone' THEN format(
        'UPDATE %s SET %I = system.fake_phone(%s) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, v_seed_expr, r.column_name)
      WHEN 'fake_address' THEN format(
        'UPDATE %s SET %I = system.fake_address(%s) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, v_seed_expr, r.column_name)
      WHEN 'hash' THEN format(
        'UPDATE %s SET %I = md5(%I || %L) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, r.column_name, 'anonymized', r.column_name)
      WHEN 'mask' THEN format(
        'UPDATE %s SET %I = system.mask_string(%I) WHERE %I IS NOT NULL',
        r.table_name, r.column_name, r.column_name, r.column_name)
      WHEN 'null_out' THEN format(
        'UPDATE %s SET %I = NULL WHERE %I IS NOT NULL',
        r.table_name, r.column_name, r.column_name)
      WHEN 'randomize' THEN format(
        'UPDATE %s SET %I = gen_random_uuid()::TEXT WHERE %I IS NOT NULL',
        r.table_name, r.column_name, r.column_name)
      ELSE NULL
    END;

    IF v_sql IS NULL THEN
      rows_affected := 0;
      RETURN NEXT;
      CONTINUE;
    END IF;

    IF p_dry_run THEN
      -- Count affected rows
      BEGIN
        EXECUTE format('SELECT count(*) FROM %s WHERE %I IS NOT NULL',
          r.table_name, r.column_name) INTO v_count;
      EXCEPTION WHEN undefined_table THEN v_count := 0;
                WHEN undefined_column THEN v_count := 0;
      END;
    ELSE
      BEGIN
        EXECUTE v_sql;
        GET DIAGNOSTICS v_count = ROW_COUNT;
      EXCEPTION WHEN undefined_table THEN v_count := 0;
                WHEN undefined_column THEN v_count := 0;
      END;
    END IF;

    rows_affected := v_count;
    RETURN NEXT;
  END LOOP;

  -- Log anonymization event
  IF NOT p_dry_run THEN
    INSERT INTO system.backup_checkpoints
      (checkpoint_name, checkpoint_type, description)
    VALUES ('post_anonymization_' || NOW()::DATE, 'manual',
            'Database anonymized at ' || NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. ANONYMIZATION COVERAGE VIEW
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_anonymization_coverage CASCADE;
CREATE VIEW system.v_anonymization_coverage AS
SELECT
  ar.table_name,
  ar.column_name,
  ar.strategy,
  ar.is_active,
  CASE WHEN ar.id IS NOT NULL THEN 'covered' ELSE 'NOT COVERED' END AS coverage
FROM system.anonymization_rules ar
UNION ALL
-- Show PII-likely columns that are NOT covered
SELECT
  n.nspname || '.' || c.relname AS table_name,
  a.attname AS column_name,
  'NEEDS REVIEW' AS strategy,
  false AS is_active,
  'NOT COVERED' AS coverage
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND a.attname IN ('email', 'phone', 'address', 'password', 'so_cccd',
    'dia_chi', 'so_dien_thoai', 'ip_address', 'full_name')
  AND NOT EXISTS (
    SELECT 1 FROM system.anonymization_rules r
    WHERE r.table_name = n.nspname || '.' || c.relname
      AND r.column_name = a.attname
  )
ORDER BY coverage DESC, table_name;

COMMIT;
