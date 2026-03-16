-- Rollback 0080: ENUM-CHECK Sync
BEGIN;
-- Drop ENUM-derived CHECK constraints
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS chk_athletes_status;
ALTER TABLE combat_matches DROP CONSTRAINT IF EXISTS chk_matches_status;
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS chk_registrations_status;
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS chk_tournaments_status;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS chk_teams_status;
-- Restore original ENUMs from 0071
DROP TYPE IF EXISTS core.athlete_status CASCADE;
CREATE TYPE core.athlete_status AS ENUM ('cho_duyet','da_duyet','tu_choi','huy','rut_lui');
DROP TYPE IF EXISTS core.match_status CASCADE;
CREATE TYPE core.match_status AS ENUM ('cho_dau','dang_dau','tam_dung','ket_thuc','huy','khong_dau');
DROP TYPE IF EXISTS core.registration_status CASCADE;
CREATE TYPE core.registration_status AS ENUM ('cho_xu_ly','da_duyet','tu_choi','da_huy');
DROP TYPE IF EXISTS core.tournament_status CASCADE;
CREATE TYPE core.tournament_status AS ENUM ('nhap','cho_duyet','da_duyet','dang_dang_ky','dong_dang_ky','boc_tham','thi_dau','hoan','ket_thuc','huy');
-- Restore simple CHECK from 0077
ALTER TABLE athletes ADD CONSTRAINT chk_athletes_status
  CHECK (trang_thai IN ('nhap','cho_duyet','da_duyet','tu_choi','dinh_chi','nghi_thi_dau','rut','giai_nghe')) NOT VALID;
ALTER TABLE combat_matches ADD CONSTRAINT chk_matches_status
  CHECK (trang_thai IN ('chua_dau','dang_dau','tam_dung','ket_thuc','huy','cho_ket_qua','bao_luu','bo_cuoc')) NOT VALID;
ALTER TABLE registrations ADD CONSTRAINT chk_registrations_status
  CHECK (trang_thai IN ('cho_duyet','da_duyet','tu_choi','rut','yeu_cau_bo_sung','het_han')) NOT VALID;
ALTER TABLE tournaments ADD CONSTRAINT chk_tournaments_status
  CHECK (status IN ('nhap','cho_duyet','da_duyet','dang_dang_ky','dang_ky','dong_dang_ky','khoa_dk','boc_tham','thi_dau','hoan','ket_thuc','huy')) NOT VALID;
ALTER TABLE teams ADD CONSTRAINT chk_teams_status
  CHECK (trang_thai IN ('nhap','cho_duyet','da_duyet','tu_choi','rut','dinh_chi')) NOT VALID;
COMMIT;
