-- ===============================================================
-- VCT Platform — Migration 0077: HARMONIZE CHECK/ENUM STATUS
-- P2 Medium: Align CHECK constraint values with ENUM definitions
-- Ensure no data violation when ENUMs are applied to columns
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. FIX: Expand tournament CHECK to match ENUM values
--    ENUM (0071): nhap, cho_duyet, da_duyet, dang_dang_ky,
--                 dong_dang_ky, boc_tham, thi_dau, hoan, ket_thuc, huy
--    CHECK (0005): nhap, dang_ky, khoa_dk, thi_dau, ket_thuc, huy
-- ════════════════════════════════════════════════════════

-- Drop old CHECK
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS chk_tournaments_status;

-- Create unified CHECK matching ENUM
ALTER TABLE tournaments ADD CONSTRAINT chk_tournaments_status
  CHECK (status IN (
    'nhap', 'cho_duyet', 'da_duyet',
    'dang_dang_ky', 'dang_ky',           -- both old and new values
    'dong_dang_ky', 'khoa_dk',           -- aliases
    'boc_tham', 'thi_dau', 'hoan', 'ket_thuc', 'huy'
  )) NOT VALID;
ALTER TABLE tournaments VALIDATE CONSTRAINT chk_tournaments_status;

-- ════════════════════════════════════════════════════════
-- 2. FIX: Expand athlete CHECK to match ENUM
--    ENUM: nhap, cho_duyet, da_duyet, tu_choi, dinh_chi,
--          nghi_thi_dau, rut, giai_nghe
--    CHECK: nhap, cho_duyet, da_duyet, tu_choi, rut
-- ════════════════════════════════════════════════════════

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS chk_athletes_status;
ALTER TABLE athletes ADD CONSTRAINT chk_athletes_status
  CHECK (trang_thai IN (
    'nhap', 'cho_duyet', 'da_duyet', 'tu_choi',
    'dinh_chi', 'nghi_thi_dau', 'rut', 'giai_nghe'
  )) NOT VALID;
ALTER TABLE athletes VALIDATE CONSTRAINT chk_athletes_status;

-- ════════════════════════════════════════════════════════
-- 3. FIX: Expand match CHECK to match ENUM
--    ENUM: chua_dau, dang_dau, tam_dung, ket_thuc, huy,
--          cho_ket_qua, bao_luu, bo_cuoc
--    CHECK: chua_dau, dang_dau, tam_dung, ket_thuc, huy
-- ════════════════════════════════════════════════════════

ALTER TABLE combat_matches DROP CONSTRAINT IF EXISTS chk_matches_status;
ALTER TABLE combat_matches ADD CONSTRAINT chk_matches_status
  CHECK (trang_thai IN (
    'chua_dau', 'dang_dau', 'tam_dung', 'ket_thuc', 'huy',
    'cho_ket_qua', 'bao_luu', 'bo_cuoc'
  )) NOT VALID;
ALTER TABLE combat_matches VALIDATE CONSTRAINT chk_matches_status;

-- ════════════════════════════════════════════════════════
-- 4. FIX: Expand registration CHECK
-- ════════════════════════════════════════════════════════

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS chk_registrations_status;
ALTER TABLE registrations ADD CONSTRAINT chk_registrations_status
  CHECK (trang_thai IN (
    'cho_duyet', 'da_duyet', 'tu_choi', 'rut',
    'yeu_cau_bo_sung', 'het_han'
  )) NOT VALID;
ALTER TABLE registrations VALIDATE CONSTRAINT chk_registrations_status;

-- ════════════════════════════════════════════════════════
-- 5. FIX: Expand teams CHECK
-- ════════════════════════════════════════════════════════

ALTER TABLE teams DROP CONSTRAINT IF EXISTS chk_teams_status;
ALTER TABLE teams ADD CONSTRAINT chk_teams_status
  CHECK (trang_thai IN (
    'nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'rut',
    'dinh_chi'
  )) NOT VALID;
ALTER TABLE teams VALIDATE CONSTRAINT chk_teams_status;

-- ════════════════════════════════════════════════════════
-- 6. DOCUMENTATION: Status value mapping view
-- ════════════════════════════════════════════════════════

DROP VIEW IF EXISTS system.v_status_mapping CASCADE;
CREATE VIEW system.v_status_mapping AS
SELECT * FROM (VALUES
  ('tournaments', 'status',     'nhap → cho_duyet → da_duyet → dang_dang_ky → dong_dang_ky → boc_tham → thi_dau → ket_thuc | hoan | huy'),
  ('athletes',    'trang_thai', 'nhap → cho_duyet → da_duyet | tu_choi | dinh_chi | nghi_thi_dau | rut | giai_nghe'),
  ('matches',     'trang_thai', 'chua_dau → dang_dau → tam_dung | ket_thuc | huy | cho_ket_qua | bao_luu | bo_cuoc'),
  ('teams',       'trang_thai', 'nhap → cho_duyet → da_duyet | tu_choi | rut | dinh_chi'),
  ('registrations','trang_thai','cho_duyet → da_duyet | tu_choi | rut | yeu_cau_bo_sung | het_han')
) AS t (table_name, column_name, lifecycle);

COMMIT;
