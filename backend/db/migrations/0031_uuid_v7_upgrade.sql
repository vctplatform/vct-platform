-- ===============================================================
-- VCT Platform — Migration 0031: UUID v7 Upgrade
-- Replace gen_random_uuid() (v4) with time-ordered UUID v7
-- RFC 9562 compliant — sortable, better B-tree locality
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. CREATE uuidv7() FUNCTION
--    Pure PL/pgSQL — no extensions required
--    Layout: [48-bit timestamp_ms][4-bit version=7][12-bit rand_a][2-bit variant=10][62-bit rand_b]
-- ════════════════════════════════════════════════════════

-- Skip uuidv7() creation on Neon (built-in function)
DO $outer$
BEGIN
  CREATE OR REPLACE FUNCTION uuidv7() RETURNS UUID AS $$
  DECLARE
      v_time  BIGINT;
      v_bytes BYTEA;
      v_hex   TEXT;
  BEGIN
      v_time := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
      v_bytes := gen_random_bytes(16);
      v_bytes := set_byte(v_bytes, 0, ((v_time >> 40) & 255)::INT);
      v_bytes := set_byte(v_bytes, 1, ((v_time >> 32) & 255)::INT);
      v_bytes := set_byte(v_bytes, 2, ((v_time >> 24) & 255)::INT);
      v_bytes := set_byte(v_bytes, 3, ((v_time >> 16) & 255)::INT);
      v_bytes := set_byte(v_bytes, 4, ((v_time >>  8) & 255)::INT);
      v_bytes := set_byte(v_bytes, 5, ( v_time        & 255)::INT);
      v_bytes := set_byte(v_bytes, 6, (get_byte(v_bytes, 6) & 15) | 112);
      v_bytes := set_byte(v_bytes, 8, (get_byte(v_bytes, 8) & 63) | 128);
      v_hex := encode(v_bytes, 'hex');
      RETURN (
          substr(v_hex,  1, 8) || '-' ||
          substr(v_hex,  9, 4) || '-' ||
          substr(v_hex, 13, 4) || '-' ||
          substr(v_hex, 17, 4) || '-' ||
          substr(v_hex, 21, 12)
      )::UUID;
  END;
  $$ LANGUAGE plpgsql VOLATILE;
EXCEPTION WHEN insufficient_privilege THEN
  -- uuidv7() is a built-in function on Neon, skip
  RAISE NOTICE 'uuidv7() is a built-in function, skipping creation';
END $outer$;

-- ════════════════════════════════════════════════════════
-- 2. ALTER ALL EXISTING TABLE DEFAULTS
--    Change from gen_random_uuid() → uuidv7()
-- ════════════════════════════════════════════════════════

-- ── Core tables (from 0002 relational schema via postgres_store) ──
ALTER TABLE IF EXISTS users              ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournaments        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS age_groups         ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS content_categories ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS weight_classes     ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS teams              ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS athletes           ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS registrations      ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS referees           ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS arenas             ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS referee_assignments ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS combat_matches     ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS form_performances  ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS weigh_ins          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS schedule_entries   ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS appeals            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS notifications      ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS medical_records    ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS media_files        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS data_audit_log     ALTER COLUMN id SET DEFAULT uuidv7();

-- ── Scoring & Events (from 0003) ──
ALTER TABLE IF EXISTS tournament.scoring_criteria     ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.judge_scores         ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.match_events         ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.tournament_results   ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.tournament_entries   ALTER COLUMN id SET DEFAULT uuidv7();

-- ── Audit Logs (from 0025) ──
ALTER TABLE IF EXISTS system.audit_logs              ALTER COLUMN id SET DEFAULT uuidv7();

-- ── V7.0 Layer A (from 0027) ──
ALTER TABLE IF EXISTS core.athlete_data_keys           ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.erasure_tombstones          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.conflict_resolution_rules ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.sync_conflicts            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.view_contracts            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.config_changelog          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.cross_aggregate_references ALTER COLUMN id SET DEFAULT uuidv7();

-- ── V7.0 Layer B (from 0028) ──
ALTER TABLE IF EXISTS tournament.event_schemas           ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.authorization_tuples          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.authorization_rules           ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.signing_keys                  ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.digital_signatures            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS platform.translations              ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS platform.federation_locales        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.data_quality_rules          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.data_quality_results        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.data_quality_scores         ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.access_audit_log            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.notification_preferences    ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.notification_deliveries     ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.notification_templates      ALTER COLUMN id SET DEFAULT uuidv7();

-- ── V7.0 Layer C (from 0029) ──
ALTER TABLE IF EXISTS tournament.resource_availability   ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.scheduling_constraints  ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.generated_schedules     ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS platform.document_templates        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS platform.issued_documents          ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.integrity_alerts        ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.scoring_baselines       ALTER COLUMN id SET DEFAULT uuidv7();

-- ── V7.0 Layer D (from 0030) ──
ALTER TABLE IF EXISTS core.federation_merges             ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS platform.sport_profiles            ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.team_entries             ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.match_bouts              ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS tournament.athlete_daily_loads      ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS core.auth_provider_mappings         ALTER COLUMN id SET DEFAULT uuidv7();
ALTER TABLE IF EXISTS system.storage_provider_mappings    ALTER COLUMN id SET DEFAULT uuidv7();

COMMIT;
