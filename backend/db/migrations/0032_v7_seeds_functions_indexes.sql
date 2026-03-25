-- ===============================================================
-- VCT Platform — Migration 0032: V7.0 SEEDS, FUNCTIONS & INDEXES
-- Seed data, validate_view_contract() function, comprehensive indexes
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. SEED DATA — Conflict Resolution Rules
--    (Referenced in prompt lines 172-175)
-- ════════════════════════════════════════════════════════

INSERT INTO system.conflict_resolution_rules (table_name, field_name, strategy, domain_logic, is_active)
VALUES
    ('judge_scores', NULL, 'MANUAL',
     'Điểm trọng tài phải do Jury President quyết định khi conflict', true),
    ('match_events', NULL, 'LAST_WRITE_WINS',
     'Events append-only, conflict = duplicate detection', true),
    ('weigh_ins', 'weight_value', 'MANUAL',
     'Cân nặng chỉ có 1 giá trị đúng, cần xác minh thực tế', true),
    ('registrations', NULL, 'LAST_WRITE_WINS',
     'Hồ sơ đăng ký — version mới nhất thắng', true),
    ('athletes', 'status', 'HIGHER_AUTHORITY',
     'Trạng thái VĐV — role cao hơn quyết định', true)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 2. FUNCTION: validate_view_contract()
--    Checks actual view columns vs expected_columns
--    Updates validation_status in view_contracts
--    (Referenced in prompt lines 222-224)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validate_view_contract(
    p_view_name TEXT,
    p_version INTEGER
) RETURNS TABLE (
    contract_id UUID,
    validation_status TEXT,
    errors JSONB
) AS $$
DECLARE
    v_contract_id UUID;
    v_expected JSONB;
    v_actual JSONB;
    v_errors JSONB := '[]'::JSONB;
    v_schema TEXT;
    v_view TEXT;
    v_parts TEXT[];
    rec RECORD;
BEGIN
    -- 1) Find the contract
    SELECT vc.id, vc.expected_columns INTO v_contract_id, v_expected
    FROM system.view_contracts vc
    WHERE vc.view_name = p_view_name AND vc.version = p_version;

    IF v_contract_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, 'NOT_FOUND'::TEXT, '["Contract not found"]'::JSONB;
        RETURN;
    END IF;

    -- 2) Parse schema.view_name
    v_parts := string_to_array(p_view_name, '.');
    IF array_length(v_parts, 1) = 2 THEN
        v_schema := v_parts[1];
        v_view := v_parts[2];
    ELSE
        v_schema := 'public';
        v_view := p_view_name;
    END IF;

    -- 3) Get actual columns from information_schema
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END
        ) ORDER BY c.ordinal_position
    ) INTO v_actual
    FROM information_schema.columns c
    WHERE c.table_schema = v_schema AND c.table_name = v_view;

    IF v_actual IS NULL THEN
        UPDATE system.view_contracts
        SET validation_status = 'BROKEN',
            validation_errors = '["View does not exist"]'::JSONB,
            last_validated_at = now()
        WHERE id = v_contract_id;

        RETURN QUERY SELECT v_contract_id, 'BROKEN'::TEXT, '["View does not exist"]'::JSONB;
        RETURN;
    END IF;

    -- 4) Compare expected vs actual
    FOR rec IN SELECT * FROM jsonb_array_elements(v_expected) AS e(col)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_actual) AS a(col)
            WHERE a.col->>'name' = rec.col->>'name'
        ) THEN
            v_errors := v_errors || jsonb_build_array(
                format('Missing column: %s', rec.col->>'name')
            );
        END IF;
    END LOOP;

    -- 5) Update contract
    IF jsonb_array_length(v_errors) = 0 THEN
        UPDATE system.view_contracts
        SET validation_status = 'VALID',
            validation_errors = NULL,
            last_validated_at = now()
        WHERE id = v_contract_id;

        RETURN QUERY SELECT v_contract_id, 'VALID'::TEXT, NULL::JSONB;
    ELSE
        UPDATE system.view_contracts
        SET validation_status = 'BROKEN',
            validation_errors = v_errors,
            last_validated_at = now()
        WHERE id = v_contract_id;

        RETURN QUERY SELECT v_contract_id, 'BROKEN'::TEXT, v_errors;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_view_contract(TEXT, INTEGER) IS
    'V7.0 Contract Testing: validates view columns against view_contracts.expected_columns';

-- ════════════════════════════════════════════════════════
-- 3. COMPREHENSIVE INDEXES FOR V7.0 TABLES
-- ════════════════════════════════════════════════════════

-- ── Layer A ──

-- athlete_data_keys
DO $$
DECLARE
  v_indexes TEXT[] := ARRAY[
    'CREATE INDEX IF NOT EXISTS idx_adk_athlete ON core.athlete_data_keys(athlete_id)',
    'CREATE INDEX IF NOT EXISTS idx_adk_status ON core.athlete_data_keys(status) WHERE status = ''ACTIVE''',
    'CREATE INDEX IF NOT EXISTS idx_tombstones_athlete ON core.erasure_tombstones(original_athlete_id)',
    'CREATE INDEX IF NOT EXISTS idx_tombstones_executed ON core.erasure_tombstones(executed_at) WHERE executed_at IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON system.sync_conflicts(status) WHERE status != ''RESOLVED''',
    'CREATE INDEX IF NOT EXISTS idx_sync_conflicts_record ON system.sync_conflicts(table_name, record_id)',
    'CREATE INDEX IF NOT EXISTS idx_config_changelog_table ON system.config_changelog(config_table, config_id)',
    'CREATE INDEX IF NOT EXISTS idx_config_changelog_tournament ON system.config_changelog(tournament_id) WHERE tournament_id IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_config_changelog_time ON system.config_changelog(changed_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_view_contracts_name ON system.view_contracts(view_name, version)',
    'CREATE INDEX IF NOT EXISTS idx_view_contracts_status ON system.view_contracts(validation_status) WHERE validation_status = ''BROKEN''',
    'CREATE INDEX IF NOT EXISTS idx_event_schemas_type ON tournament.event_schemas(event_type, schema_version)',
    'CREATE INDEX IF NOT EXISTS idx_event_schemas_active ON tournament.event_schemas(status) WHERE status = ''ACTIVE''',
    'CREATE INDEX IF NOT EXISTS idx_authz_object ON core.authorization_tuples(object_type, object_id, relation)',
    'CREATE INDEX IF NOT EXISTS idx_authz_subject ON core.authorization_tuples(subject_type, subject_id)',
    'CREATE INDEX IF NOT EXISTS idx_authz_active ON core.authorization_tuples(object_type, object_id, relation, subject_type, subject_id) WHERE revoked_at IS NULL',
    'CREATE INDEX IF NOT EXISTS idx_signatures_record ON core.digital_signatures(signed_table, signed_record_id)',
    'CREATE INDEX IF NOT EXISTS idx_signatures_chain ON core.digital_signatures(previous_signature_id) WHERE previous_signature_id IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_translations_entity ON platform.translations(entity_type, entity_id, field_name, locale)',
    'CREATE INDEX IF NOT EXISTS idx_dq_rules_table ON system.data_quality_rules(table_name) WHERE is_active = true',
    'CREATE INDEX IF NOT EXISTS idx_dq_results_rule ON system.data_quality_results(rule_id, checked_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_dq_results_status ON system.data_quality_results(status) WHERE status IN (''WARNING'', ''CRITICAL'')',
    'CREATE INDEX IF NOT EXISTS idx_dq_scores_table ON system.data_quality_scores(table_name, calculated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_access_audit_user ON system.access_audit_log(user_id, accessed_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_access_audit_resource ON system.access_audit_log(resource_type, resource_id)',
    'CREATE INDEX IF NOT EXISTS idx_access_audit_time ON system.access_audit_log(accessed_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON system.notification_preferences(user_id, category)',
    'CREATE INDEX IF NOT EXISTS idx_notif_delivery_user ON system.notification_deliveries(user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_notif_delivery_pending ON system.notification_deliveries(status, created_at) WHERE status IN (''PENDING'', ''SENT'')',
    'CREATE INDEX IF NOT EXISTS idx_notif_templates_active ON system.notification_templates(category, channel, locale) WHERE is_active = true',
    'CREATE INDEX IF NOT EXISTS idx_resource_avail_tournament ON tournament.resource_availability(tournament_id)',
    'CREATE INDEX IF NOT EXISTS idx_resource_avail_type ON tournament.resource_availability(resource_type, resource_id)',
    'CREATE INDEX IF NOT EXISTS idx_sched_constraints_tournament ON tournament.scheduling_constraints(tournament_id)',
    'CREATE INDEX IF NOT EXISTS idx_gen_schedules_tournament ON tournament.generated_schedules(tournament_id, version DESC)',
    'CREATE INDEX IF NOT EXISTS idx_gen_schedules_published ON tournament.generated_schedules(status) WHERE status = ''PUBLISHED''',
    'CREATE INDEX IF NOT EXISTS idx_doc_templates_type ON platform.document_templates(template_type) WHERE is_active = true',
    'CREATE INDEX IF NOT EXISTS idx_issued_docs_recipient ON platform.issued_documents(recipient_type, recipient_id)',
    'CREATE INDEX IF NOT EXISTS idx_issued_docs_number ON platform.issued_documents(document_number)',
    'CREATE INDEX IF NOT EXISTS idx_issued_docs_verification ON platform.issued_documents(verification_code)',
    'CREATE INDEX IF NOT EXISTS idx_integrity_alerts_tournament ON tournament.integrity_alerts(tournament_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_integrity_alerts_severity ON tournament.integrity_alerts(severity) WHERE status NOT IN (''CLOSED'', ''UNSUBSTANTIATED'')',
    'CREATE INDEX IF NOT EXISTS idx_integrity_alerts_assigned ON tournament.integrity_alerts(assigned_to) WHERE assigned_to IS NOT NULL AND status IN (''UNDER_REVIEW'', ''INVESTIGATING'')',
    'CREATE INDEX IF NOT EXISTS idx_scoring_baselines_category ON tournament.scoring_baselines(category_type, stat_type)',
    'CREATE INDEX IF NOT EXISTS idx_federation_merges_status ON core.federation_merges(status) WHERE status NOT IN (''COMPLETED'', ''ROLLED_BACK'')',
    'CREATE INDEX IF NOT EXISTS idx_sport_profiles_code ON platform.sport_profiles(sport_code) WHERE is_active = true',
    'CREATE INDEX IF NOT EXISTS idx_team_entries_entry ON tournament.team_entries(entry_id)',
    'CREATE INDEX IF NOT EXISTS idx_team_entries_athlete ON tournament.team_entries(athlete_id)',
    'CREATE INDEX IF NOT EXISTS idx_match_bouts_match ON tournament.match_bouts(match_id, bout_number)',
    'CREATE INDEX IF NOT EXISTS idx_daily_loads_athlete ON tournament.athlete_daily_loads(athlete_id, competition_date)',
    'CREATE INDEX IF NOT EXISTS idx_daily_loads_tournament ON tournament.athlete_daily_loads(tournament_id, competition_date)',
    'CREATE INDEX IF NOT EXISTS idx_daily_loads_status ON tournament.athlete_daily_loads(load_status) WHERE load_status IN (''HIGH'', ''EXCESSIVE'', ''BLOCKED'')',
    'CREATE INDEX IF NOT EXISTS idx_auth_provider_user ON core.auth_provider_mappings(internal_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_provider_external ON core.auth_provider_mappings(provider, provider_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_storage_provider_path ON system.storage_provider_mappings(logical_path)'
  ];
  v_sql TEXT;
  v_ok INT := 0;
  v_skip INT := 0;
BEGIN
  FOREACH v_sql IN ARRAY v_indexes LOOP
    BEGIN
      EXECUTE v_sql;
      v_ok := v_ok + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped index: %', SQLERRM;
      v_skip := v_skip + 1;
    END;
  END LOOP;
  RAISE NOTICE 'V7 indexes: % created, % skipped', v_ok, v_skip;
END $$;

COMMIT;
