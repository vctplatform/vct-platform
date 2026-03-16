-- Rollback 0050: FK Constraints + Data Integrity
BEGIN;
-- Drop FK constraints added in 0050
ALTER TABLE tournament_categories DROP CONSTRAINT IF EXISTS fk_tc_tournament;
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS fk_tr_tournament;
ALTER TABLE tournament_schedule_slots DROP CONSTRAINT IF EXISTS fk_tss_tournament;
ALTER TABLE tournament_arena_assignments DROP CONSTRAINT IF EXISTS fk_taa_tournament;
ALTER TABLE tournament_results DROP CONSTRAINT IF EXISTS fk_tres_tournament;
ALTER TABLE tournament_team_standings DROP CONSTRAINT IF EXISTS fk_tts_tournament;
-- Drop BTC FKs
DO $$ DECLARE tbl TEXT;
BEGIN FOR tbl IN SELECT unnest(ARRAY[
  'btc_members','btc_weigh_ins','btc_draws','btc_assignments',
  'btc_team_results','btc_content_results','btc_finance',
  'btc_meetings','btc_protests'
]) LOOP
  BEGIN EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS fk_%s_tournament',
    tbl, replace(tbl,'btc_',''));
  EXCEPTION WHEN undefined_table THEN NULL; END;
END LOOP; END $$;
-- Drop CHECK constraints
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS chk_tr_status;
ALTER TABLE tournament_categories DROP CONSTRAINT IF EXISTS chk_tc_status;
ALTER TABLE tournament_schedule_slots DROP CONSTRAINT IF EXISTS chk_tss_status;
ALTER TABLE btc_weigh_ins DROP CONSTRAINT IF EXISTS chk_bwi_result;
ALTER TABLE btc_assignments DROP CONSTRAINT IF EXISTS chk_ba_status;
ALTER TABLE btc_finance DROP CONSTRAINT IF EXISTS chk_bf_type;
ALTER TABLE btc_finance DROP CONSTRAINT IF EXISTS chk_bf_status;
ALTER TABLE btc_meetings DROP CONSTRAINT IF EXISTS chk_bm_status;
ALTER TABLE btc_protests DROP CONSTRAINT IF EXISTS chk_bp_status;
ALTER TABLE parent_links DROP CONSTRAINT IF EXISTS chk_pl_status;
ALTER TABLE parent_consents DROP CONSTRAINT IF EXISTS chk_pc_status;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS chk_ts_status;
ALTER TABLE tournament_categories DROP CONSTRAINT IF EXISTS chk_tc_tid_nn;
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS chk_tr_tid_nn;
COMMIT;
