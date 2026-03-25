-- ===============================================================
-- VCT Platform — Migration 0031 DOWN: UUID v7 ROLLBACK
-- Revert to gen_random_uuid() (v4)
-- ===============================================================

BEGIN;

-- Revert all tables back to gen_random_uuid()
-- (Only listing tables that exist — ALTER TABLE IF EXISTS is safe)

-- Core tables
ALTER TABLE IF EXISTS users              ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournaments        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS age_groups         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS content_categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS weight_classes     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS teams              ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS athletes           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS registrations      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS referees           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS arenas             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS referee_assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS combat_matches     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS form_performances  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS weigh_ins          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS schedule_entries   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS appeals            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS notifications      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS medical_records    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS media_files        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS data_audit_log     ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Scoring & Events
ALTER TABLE IF EXISTS tournament.scoring_criteria     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.judge_scores         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.match_events         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.tournament_results   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.tournament_entries   ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Audit
ALTER TABLE IF EXISTS system.audit_logs              ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- V7.0 Layer A–D (all 35 tables)
ALTER TABLE IF EXISTS core.athlete_data_keys           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.erasure_tombstones          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.conflict_resolution_rules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.sync_conflicts            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.view_contracts            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.config_changelog          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.cross_aggregate_references ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.event_schemas           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.authorization_tuples          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.authorization_rules           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.signing_keys                  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.digital_signatures            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS platform.translations              ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS platform.federation_locales        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.data_quality_rules          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.data_quality_results        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.data_quality_scores         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.access_audit_log            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.notification_preferences    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.notification_deliveries     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.notification_templates      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.resource_availability   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.scheduling_constraints  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.generated_schedules     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS platform.document_templates        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS platform.issued_documents          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.integrity_alerts        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.scoring_baselines       ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.federation_merges             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS platform.sport_profiles            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.team_entries             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.match_bouts              ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS tournament.athlete_daily_loads      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS core.auth_provider_mappings         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS system.storage_provider_mappings    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop the function
DROP FUNCTION IF EXISTS uuid_generate_v7();

COMMIT;
