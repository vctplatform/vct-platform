-- Down migration for 0032_v7_seeds_functions_indexes.sql
BEGIN;

DROP FUNCTION IF EXISTS validate_view_contract(TEXT, INTEGER);

-- Drop all V7.0 indexes (reverse order)

-- Layer D
DROP INDEX IF EXISTS system.idx_storage_provider_path;
DROP INDEX IF EXISTS core.idx_auth_provider_external;
DROP INDEX IF EXISTS core.idx_auth_provider_user;
DROP INDEX IF EXISTS tournament.idx_daily_loads_status;
DROP INDEX IF EXISTS tournament.idx_daily_loads_tournament;
DROP INDEX IF EXISTS tournament.idx_daily_loads_athlete;
DROP INDEX IF EXISTS tournament.idx_match_bouts_match;
DROP INDEX IF EXISTS tournament.idx_team_entries_athlete;
DROP INDEX IF EXISTS tournament.idx_team_entries_entry;
DROP INDEX IF EXISTS platform.idx_sport_profiles_code;
DROP INDEX IF EXISTS core.idx_federation_merges_status;

-- Layer C
DROP INDEX IF EXISTS tournament.idx_scoring_baselines_category;
DROP INDEX IF EXISTS tournament.idx_integrity_alerts_assigned;
DROP INDEX IF EXISTS tournament.idx_integrity_alerts_severity;
DROP INDEX IF EXISTS tournament.idx_integrity_alerts_tournament;
DROP INDEX IF EXISTS platform.idx_issued_docs_verification;
DROP INDEX IF EXISTS platform.idx_issued_docs_number;
DROP INDEX IF EXISTS platform.idx_issued_docs_recipient;
DROP INDEX IF EXISTS platform.idx_doc_templates_type;
DROP INDEX IF EXISTS tournament.idx_gen_schedules_published;
DROP INDEX IF EXISTS tournament.idx_gen_schedules_tournament;
DROP INDEX IF EXISTS tournament.idx_sched_constraints_tournament;
DROP INDEX IF EXISTS tournament.idx_resource_avail_type;
DROP INDEX IF EXISTS tournament.idx_resource_avail_tournament;

-- Layer B
DROP INDEX IF EXISTS system.idx_notif_templates_active;
DROP INDEX IF EXISTS system.idx_notif_delivery_pending;
DROP INDEX IF EXISTS system.idx_notif_delivery_user;
DROP INDEX IF EXISTS system.idx_notif_pref_user;
DROP INDEX IF EXISTS system.idx_access_audit_time;
DROP INDEX IF EXISTS system.idx_access_audit_resource;
DROP INDEX IF EXISTS system.idx_access_audit_user;
DROP INDEX IF EXISTS system.idx_dq_scores_table;
DROP INDEX IF EXISTS system.idx_dq_results_status;
DROP INDEX IF EXISTS system.idx_dq_results_rule;
DROP INDEX IF EXISTS system.idx_dq_rules_table;
DROP INDEX IF EXISTS platform.idx_translations_entity;
DROP INDEX IF EXISTS core.idx_signatures_chain;
DROP INDEX IF EXISTS core.idx_signatures_record;
DROP INDEX IF EXISTS core.idx_authz_active;
DROP INDEX IF EXISTS core.idx_authz_subject;
DROP INDEX IF EXISTS core.idx_authz_object;
DROP INDEX IF EXISTS tournament.idx_event_schemas_active;
DROP INDEX IF EXISTS tournament.idx_event_schemas_type;

-- Layer A
DROP INDEX IF EXISTS system.idx_view_contracts_status;
DROP INDEX IF EXISTS system.idx_view_contracts_name;
DROP INDEX IF EXISTS system.idx_config_changelog_time;
DROP INDEX IF EXISTS system.idx_config_changelog_tournament;
DROP INDEX IF EXISTS system.idx_config_changelog_table;
DROP INDEX IF EXISTS system.idx_sync_conflicts_record;
DROP INDEX IF EXISTS system.idx_sync_conflicts_status;
DROP INDEX IF EXISTS core.idx_tombstones_executed;
DROP INDEX IF EXISTS core.idx_tombstones_athlete;
DROP INDEX IF EXISTS core.idx_adk_status;
DROP INDEX IF EXISTS core.idx_adk_athlete;

-- Remove seed data
DELETE FROM system.conflict_resolution_rules
WHERE table_name IN ('judge_scores', 'match_events', 'weigh_ins', 'registrations', 'athletes');

COMMIT;
