-- ===============================================================
-- VCT Platform — Migration 0080: ENUM-CHECK HARMONIZATION V2
-- P0 Critical: Sync ENUM definitions ↔ CHECK constraints
-- Then migrate columns to use ENUM types directly
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SYNC ENUMS: Add missing values to match CHECK constraints
--    ALTER TYPE ADD VALUE cannot run inside a transaction,
--    so we DROP + RECREATE (safe: no columns use these types yet)
-- ════════════════════════════════════════════════════════

-- athlete_status — merge all known values
DROP TYPE IF EXISTS core.athlete_status CASCADE;
CREATE TYPE core.athlete_status AS ENUM (
  'nhap', 'cho_duyet', 'da_duyet', 'tu_choi',
  'dinh_chi', 'nghi_thi_dau', 'rut', 'rut_lui', 'giai_nghe', 'huy'
);

-- match_status — merge CHECK + ENUM values
DROP TYPE IF EXISTS core.match_status CASCADE;
CREATE TYPE core.match_status AS ENUM (
  'chua_dau', 'cho_dau', 'dang_dau', 'tam_dung',
  'ket_thuc', 'huy', 'khong_dau',
  'cho_ket_qua', 'bao_luu', 'bo_cuoc'
);

-- registration_status — merge
DROP TYPE IF EXISTS core.registration_status CASCADE;
CREATE TYPE core.registration_status AS ENUM (
  'cho_xu_ly', 'cho_duyet', 'da_duyet', 'tu_choi',
  'da_huy', 'rut', 'yeu_cau_bo_sung', 'het_han'
);

-- tournament_status — already comprehensive, add 'dang_ky' + 'khoa_dk' aliases
DROP TYPE IF EXISTS core.tournament_status CASCADE;
CREATE TYPE core.tournament_status AS ENUM (
  'nhap', 'cho_duyet', 'da_duyet',
  'dang_dang_ky', 'dang_ky',
  'dong_dang_ky', 'khoa_dk',
  'boc_tham', 'thi_dau', 'hoan', 'ket_thuc', 'huy'
);

-- match_result — keep as-is (no conflicts)
-- payment_status, invoice_status, gender_type — keep as-is

-- ════════════════════════════════════════════════════════
-- 2. UPDATE CHECK CONSTRAINTS TO MATCH NEW ENUMS
--    (Ensures CHECK ↔ ENUM are identical single source)
-- ════════════════════════════════════════════════════════

-- Athletes: update CHECK if exists
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS chk_athletes_status;
ALTER TABLE athletes ADD CONSTRAINT chk_athletes_status
  CHECK (trang_thai::TEXT = ANY(enum_range(NULL::core.athlete_status)::TEXT[]))
  NOT VALID;
ALTER TABLE athletes VALIDATE CONSTRAINT chk_athletes_status;

-- Matches
ALTER TABLE combat_matches DROP CONSTRAINT IF EXISTS chk_matches_status;
ALTER TABLE combat_matches ADD CONSTRAINT chk_matches_status
  CHECK (trang_thai::TEXT = ANY(enum_range(NULL::core.match_status)::TEXT[]))
  NOT VALID;
ALTER TABLE combat_matches VALIDATE CONSTRAINT chk_matches_status;

-- Registrations
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS chk_registrations_status;
ALTER TABLE registrations ADD CONSTRAINT chk_registrations_status
  CHECK (trang_thai::TEXT = ANY(enum_range(NULL::core.registration_status)::TEXT[]))
  NOT VALID;
ALTER TABLE registrations VALIDATE CONSTRAINT chk_registrations_status;

-- Tournaments
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS chk_tournaments_status;
ALTER TABLE tournaments ADD CONSTRAINT chk_tournaments_status
  CHECK (status::TEXT = ANY(enum_range(NULL::core.tournament_status)::TEXT[]))
  NOT VALID;
ALTER TABLE tournaments VALIDATE CONSTRAINT chk_tournaments_status;

-- Teams (keep simple CHECK — no ENUM needed)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS chk_teams_status;
ALTER TABLE teams ADD CONSTRAINT chk_teams_status
  CHECK (trang_thai IN (
    'nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'rut', 'dinh_chi'
  )) NOT VALID;
ALTER TABLE teams VALIDATE CONSTRAINT chk_teams_status;

-- ════════════════════════════════════════════════════════
-- 3. DOCUMENTATION: Enum ↔ CHECK mapping view
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_status_mapping CASCADE;
CREATE VIEW system.v_status_mapping AS
SELECT * FROM (VALUES
  ('tournaments',    'status',     array_to_string(enum_range(NULL::core.tournament_status)::TEXT[], ', ')),
  ('athletes',       'trang_thai', array_to_string(enum_range(NULL::core.athlete_status)::TEXT[], ', ')),
  ('combat_matches', 'trang_thai', array_to_string(enum_range(NULL::core.match_status)::TEXT[], ', ')),
  ('registrations',  'trang_thai', array_to_string(enum_range(NULL::core.registration_status)::TEXT[], ', ')),
  ('teams',          'trang_thai', 'nhap, cho_duyet, da_duyet, tu_choi, rut, dinh_chi')
) AS t (table_name, column_name, allowed_values);

COMMIT;
