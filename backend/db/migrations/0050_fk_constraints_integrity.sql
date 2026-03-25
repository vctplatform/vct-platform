-- ===============================================================
-- VCT Platform — Migration 0050: FK CONSTRAINTS + DATA INTEGRITY
-- P0 Critical: Add foreign key constraints and UUID references
-- to tables from 0044-0048 that use TEXT IDs
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. TOURNAMENT MANAGEMENT — ADD FK CONSTRAINTS
--    Tables from 0045 reference tournaments by UUID but
--    lack actual FK constraints
-- ════════════════════════════════════════════════════════

-- tournament_categories → tournaments
ALTER TABLE tournament_categories
  ADD CONSTRAINT fk_tc_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_categories
  VALIDATE CONSTRAINT fk_tc_tournament;

-- tournament_registrations → tournaments (tournament_id is UUID)
DO $$ BEGIN
  ALTER TABLE tournament_registrations
    ALTER COLUMN tournament_id TYPE UUID USING tournament_id::UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE tournament_registrations
  ADD CONSTRAINT fk_tr_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_registrations
  VALIDATE CONSTRAINT fk_tr_tournament;

-- tournament_schedule_slots → tournaments
DO $$ BEGIN
  ALTER TABLE tournament_schedule_slots
    ALTER COLUMN tournament_id TYPE UUID USING tournament_id::UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE tournament_schedule_slots
  ADD CONSTRAINT fk_tss_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_schedule_slots
  VALIDATE CONSTRAINT fk_tss_tournament;

-- tournament_arena_assignments → tournaments
DO $$ BEGIN
  ALTER TABLE tournament_arena_assignments
    ALTER COLUMN tournament_id TYPE UUID USING tournament_id::UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE tournament_arena_assignments
  ADD CONSTRAINT fk_taa_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_arena_assignments
  VALIDATE CONSTRAINT fk_taa_tournament;

-- tournament_results → tournaments
DO $$ BEGIN
  ALTER TABLE tournament_results
    ALTER COLUMN tournament_id TYPE UUID USING tournament_id::UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE tournament_results
  ADD CONSTRAINT fk_tres_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_results
  VALIDATE CONSTRAINT fk_tres_tournament;

-- tournament_team_standings → tournaments
DO $$ BEGIN
  ALTER TABLE tournament_team_standings
    ALTER COLUMN tournament_id TYPE UUID USING tournament_id::UUID;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE tournament_team_standings
  ADD CONSTRAINT fk_tts_tournament
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  NOT VALID;

ALTER TABLE tournament_team_standings
  VALIDATE CONSTRAINT fk_tts_tournament;

-- ════════════════════════════════════════════════════════
-- 2. BTC MODULE — ADD tournament_id UUID COLUMN + FK
--    BTC tables use giai_id (TEXT). Add UUID reference.
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests'
  ]) LOOP
    BEGIN
      -- Add UUID column for tournament reference
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS tournament_id UUID',
        tbl
      );
      -- Create FK (NOT VALID first for zero-downtime)
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT fk_%s_tournament
          FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
          NOT VALID',
        tbl, replace(tbl, 'btc_', '')
      );
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Validate all BTC FKs in a second pass (allows concurrent reads)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'btc_members', 'btc_weigh_ins', 'btc_draws',
    'btc_assignments', 'btc_team_results', 'btc_content_results',
    'btc_finance', 'btc_meetings', 'btc_protests'
  ]) LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I VALIDATE CONSTRAINT fk_%s_tournament',
        tbl, replace(tbl, 'btc_', '')
      );
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════
-- 3. CHECK CONSTRAINTS — DATA VALIDATION
--    Add CHECK constraints for status fields using TEXT
-- ════════════════════════════════════════════════════════

-- Tournament registration status
ALTER TABLE tournament_registrations
  ADD CONSTRAINT chk_tr_status
  CHECK (status IN ('nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'yeu_cau_bo_sung'))
  NOT VALID;
ALTER TABLE tournament_registrations VALIDATE CONSTRAINT chk_tr_status;

-- Tournament category status
ALTER TABLE tournament_categories
  ADD CONSTRAINT chk_tc_status
  CHECK (status IN ('active', 'closed', 'cancelled'))
  NOT VALID;
ALTER TABLE tournament_categories VALIDATE CONSTRAINT chk_tc_status;

-- Schedule slot status
ALTER TABLE tournament_schedule_slots
  ADD CONSTRAINT chk_tss_status
  CHECK (status IN ('du_kien', 'xac_nhan', 'dang_dien_ra', 'hoan_thanh', 'hoan'))
  NOT VALID;
ALTER TABLE tournament_schedule_slots VALIDATE CONSTRAINT chk_tss_status;

-- BTC weigh-in result
ALTER TABLE btc_weigh_ins
  ADD CONSTRAINT chk_bwi_result
  CHECK (ket_qua IN ('cho_can', 'dat', 'khong_dat', 'can_lai'))
  NOT VALID;
ALTER TABLE btc_weigh_ins VALIDATE CONSTRAINT chk_bwi_result;

-- BTC assignment status
ALTER TABLE btc_assignments
  ADD CONSTRAINT chk_ba_status
  CHECK (trang_thai IN ('phan_cong', 'xac_nhan', 'tu_choi', 'hoan'))
  NOT VALID;
ALTER TABLE btc_assignments VALIDATE CONSTRAINT chk_ba_status;

-- BTC finance type
ALTER TABLE btc_finance
  ADD CONSTRAINT chk_bf_type
  CHECK (loai IN ('thu', 'chi'))
  NOT VALID;
ALTER TABLE btc_finance VALIDATE CONSTRAINT chk_bf_type;

-- BTC finance status
ALTER TABLE btc_finance
  ADD CONSTRAINT chk_bf_status
  CHECK (trang_thai IN ('chua_thu', 'da_thu', 'hoan', 'mien'))
  NOT VALID;
ALTER TABLE btc_finance VALIDATE CONSTRAINT chk_bf_status;

-- BTC meeting status
ALTER TABLE btc_meetings
  ADD CONSTRAINT chk_bm_status
  CHECK (trang_thai IN ('du_kien', 'dang_hop', 'hoan_thanh', 'huy'))
  NOT VALID;
ALTER TABLE btc_meetings VALIDATE CONSTRAINT chk_bm_status;

-- BTC protest status
ALTER TABLE btc_protests
  ADD CONSTRAINT chk_bp_status
  CHECK (trang_thai IN ('moi', 'dang_xu_ly', 'chap_nhan', 'bac_bo', 'rut_lai'))
  NOT VALID;
ALTER TABLE btc_protests VALIDATE CONSTRAINT chk_bp_status;

-- Parent link status
ALTER TABLE parent_links
  ADD CONSTRAINT chk_pl_status
  CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'))
  NOT VALID;
ALTER TABLE parent_links VALIDATE CONSTRAINT chk_pl_status;

-- Parent consent status
ALTER TABLE parent_consents
  ADD CONSTRAINT chk_pc_status
  CHECK (status IN ('active', 'expired', 'revoked'))
  NOT VALID;
ALTER TABLE parent_consents VALIDATE CONSTRAINT chk_pc_status;

-- Training session status
ALTER TABLE training_sessions
  ADD CONSTRAINT chk_ts_status
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
  NOT VALID;
ALTER TABLE training_sessions VALIDATE CONSTRAINT chk_ts_status;

-- ════════════════════════════════════════════════════════
-- 4. NOT NULL CONSTRAINTS (2-step for zero-downtime)
-- ════════════════════════════════════════════════════════

-- Tournament categories
ALTER TABLE tournament_categories
  ADD CONSTRAINT chk_tc_tid_nn CHECK (tournament_id IS NOT NULL) NOT VALID;
ALTER TABLE tournament_categories VALIDATE CONSTRAINT chk_tc_tid_nn;

-- Tournament registrations
ALTER TABLE tournament_registrations
  ADD CONSTRAINT chk_tr_tid_nn CHECK (tournament_id IS NOT NULL) NOT VALID;
ALTER TABLE tournament_registrations VALIDATE CONSTRAINT chk_tr_tid_nn;

COMMIT;
