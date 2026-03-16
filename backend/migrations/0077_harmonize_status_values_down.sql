-- Rollback 0077: Harmonize Status Values
BEGIN;
DROP VIEW IF EXISTS system.v_status_mapping CASCADE;
-- Restore original CHECK constraints
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS chk_tournaments_status;
ALTER TABLE tournaments ADD CONSTRAINT chk_tournaments_status
  CHECK (status IN ('nhap','dang_ky','khoa_dk','thi_dau','ket_thuc','huy'))
  NOT VALID;
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS chk_athletes_status;
ALTER TABLE athletes ADD CONSTRAINT chk_athletes_status
  CHECK (trang_thai IN ('nhap','cho_duyet','da_duyet','tu_choi','rut'))
  NOT VALID;
ALTER TABLE combat_matches DROP CONSTRAINT IF EXISTS chk_matches_status;
ALTER TABLE combat_matches ADD CONSTRAINT chk_matches_status
  CHECK (trang_thai IN ('chua_dau','dang_dau','tam_dung','ket_thuc','huy'))
  NOT VALID;
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS chk_registrations_status;
ALTER TABLE registrations ADD CONSTRAINT chk_registrations_status
  CHECK (trang_thai IN ('cho_duyet','da_duyet','tu_choi','rut'))
  NOT VALID;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS chk_teams_status;
ALTER TABLE teams ADD CONSTRAINT chk_teams_status
  CHECK (trang_thai IN ('nhap','cho_duyet','da_duyet','tu_choi','rut'))
  NOT VALID;
COMMIT;
