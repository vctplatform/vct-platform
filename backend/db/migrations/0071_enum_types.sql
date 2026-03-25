-- ===============================================================
-- VCT Platform — Migration 0071: DATABASE ENUM TYPES
-- Replace CHECK IN (...) constraints with native PostgreSQL ENUMs
-- Benefits: type safety, auto-validation, cleaner schema docs
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. CREATE ENUM TYPES
-- ════════════════════════════════════════════════════════

-- Tournament/Match status
DO $$ BEGIN CREATE TYPE core.tournament_status AS ENUM (
  'nhap', 'cho_duyet', 'da_duyet', 'dang_dang_ky', 'dong_dang_ky',
  'boc_tham', 'thi_dau', 'hoan', 'ket_thuc', 'huy'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE core.match_status AS ENUM (
  'cho_dau', 'dang_dau', 'tam_dung', 'ket_thuc', 'huy', 'khong_dau'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE core.match_result AS ENUM (
  'thang_do', 'thang_xanh', 'hoa', 'khong_xac_dinh', 'huy'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Athlete status
DO $$ BEGIN CREATE TYPE core.athlete_status AS ENUM (
  'cho_duyet', 'da_duyet', 'tu_choi', 'huy', 'rut_lui'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Registration status
DO $$ BEGIN CREATE TYPE core.registration_status AS ENUM (
  'cho_xu_ly', 'da_duyet', 'tu_choi', 'da_huy'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payment status
DO $$ BEGIN CREATE TYPE core.payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invoice status
DO $$ BEGIN CREATE TYPE core.invoice_status AS ENUM (
  'draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Gender
DO $$ BEGIN CREATE TYPE core.gender_type AS ENUM (
  'nam', 'nu', 'khac'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notification channel
DO $$ BEGIN CREATE TYPE core.notification_channel AS ENUM (
  'email', 'push', 'sms', 'in_app', 'webhook'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notification status
DO $$ BEGIN CREATE TYPE core.notification_status AS ENUM (
  'pending', 'sending', 'sent', 'delivered', 'failed', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Job status
DO $$ BEGIN CREATE TYPE core.job_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Import/Export status
DO $$ BEGIN CREATE TYPE core.import_status AS ENUM (
  'pending', 'validating', 'validated', 'importing',
  'completed', 'failed', 'cancelled', 'partial'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Circuit breaker status
DO $$ BEGIN CREATE TYPE core.circuit_status AS ENUM (
  'closed', 'open', 'half_open'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Experiment status
DO $$ BEGIN CREATE TYPE core.experiment_status AS ENUM (
  'draft', 'running', 'paused', 'completed', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Approval status
DO $$ BEGIN CREATE TYPE core.approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'cancelled', 'expired'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Severity levels
DO $$ BEGIN CREATE TYPE core.severity_level AS ENUM (
  'info', 'warning', 'critical', 'maintenance'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════
-- 2. ENUM DOCUMENTATION VIEW
--    Lists all custom enums with their values
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_enum_types CASCADE;
CREATE VIEW system.v_enum_types AS
SELECT
  n.nspname AS schema_name,
  t.typname AS enum_name,
  ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS enum_values,
  count(e.enumlabel) AS value_count
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'core'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- ════════════════════════════════════════════════════════
-- 3. SAFE ENUM ADD VALUE FUNCTION
--    Add values to existing enums without downtime
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION system.add_enum_value(
  p_enum_name TEXT,
  p_new_value TEXT,
  p_after_value TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  -- Check if value already exists
  SELECT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname || '.' || t.typname = p_enum_name
      AND e.enumlabel = p_new_value
  ) INTO v_exists;

  IF v_exists THEN RETURN false; END IF;

  IF p_after_value IS NOT NULL THEN
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L AFTER %L',
      p_enum_name, p_new_value, p_after_value);
  ELSE
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L',
      p_enum_name, p_new_value);
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════
-- 4. ENUM USAGE TRACKING VIEW
--    Shows which tables/columns reference each enum
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_enum_usage CASCADE;
CREATE VIEW system.v_enum_usage AS
SELECT
  n2.nspname || '.' || t.typname AS enum_type,
  n.nspname || '.' || c.relname AS table_name,
  a.attname AS column_name,
  ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS allowed_values
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_type t ON t.oid = a.atttypid
JOIN pg_namespace n2 ON n2.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
GROUP BY n2.nspname, t.typname, n.nspname, c.relname, a.attname
ORDER BY enum_type, table_name;

COMMIT;
