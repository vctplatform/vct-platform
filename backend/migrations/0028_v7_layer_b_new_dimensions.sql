-- ===============================================================
-- VCT Platform — Migration 0028: V7.0 LAYER B
-- 7 new measurement dimensions (Dimensions 19-25)
-- Tables: event_schemas, authorization_tuples, authorization_rules,
--         digital_signatures, signing_keys, translations,
--         federation_locales, data_quality_rules, data_quality_results,
--         data_quality_scores, access_audit_log,
--         notification_preferences, notification_deliveries,
--         notification_templates
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- DIM 19: EVENT SCHEMA GOVERNANCE
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.event_schemas (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    event_type TEXT NOT NULL,                -- 'MATCH_STARTED', 'SCORE_AWARDED'
    schema_version INTEGER NOT NULL,

    -- Schema definition (JSON Schema format)
    schema_definition JSONB NOT NULL,

    -- Compatibility
    compatibility_mode TEXT NOT NULL DEFAULT 'BACKWARD'
        CHECK (compatibility_mode IN ('BACKWARD', 'FORWARD', 'FULL', 'NONE')),

    -- Lifecycle
    status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'DEPRECATED', 'RETIRED')),

    -- Ownership
    owner_service TEXT NOT NULL,              -- 'competition_service'
    consumers TEXT[],                         -- ['results_service', 'analytics']

    -- Validation stats
    total_events_validated BIGINT DEFAULT 0,
    validation_failure_count BIGINT DEFAULT 0,
    last_validation_failure JSONB,

    published_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    retired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_schemas_type_version
    ON tournament.event_schemas(event_type, schema_version);

COMMENT ON TABLE tournament.event_schemas IS
    'V7.0 Dim 19: Event schema registry for governance and validation';

-- ════════════════════════════════════════════════════════
-- DIM 20: ReBAC — RELATIONSHIP-BASED ACCESS CONTROL
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.authorization_tuples (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    -- Object (resource being accessed)
    object_type TEXT NOT NULL,             -- 'tournament', 'club', 'athlete', 'match'
    object_id UUID NOT NULL,

    -- Relation
    relation TEXT NOT NULL,                -- 'owner', 'member', 'coach', 'guardian'

    -- Subject (who has the relationship)
    subject_type TEXT NOT NULL,            -- 'user', 'role', 'group'
    subject_id UUID NOT NULL,

    -- Conditional
    condition JSONB,                       -- {"time_bound": "2026-03-15/2026-03-17"}

    -- Lifecycle
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,

    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_authz_tuple_unique
    ON core.authorization_tuples(object_type, object_id, relation, subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_authz_object
    ON core.authorization_tuples(object_type, object_id, relation);
CREATE INDEX IF NOT EXISTS idx_authz_subject
    ON core.authorization_tuples(subject_type, subject_id);

COMMENT ON TABLE core.authorization_tuples IS
    'V7.0 Dim 20: Zanzibar-style ReBAC relationship tuples';

CREATE TABLE IF NOT EXISTS core.authorization_rules (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    rule_name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Rule definition
    source_relation TEXT NOT NULL,        -- 'coach'
    source_object_type TEXT NOT NULL,     -- 'club'
    derived_permission TEXT NOT NULL,     -- 'view'
    target_object_type TEXT NOT NULL,     -- 'athlete'
    traversal_path TEXT NOT NULL,         -- 'club.members'

    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE core.authorization_rules IS
    'V7.0 Dim 20: Permission derivation rules for ReBAC';

-- ════════════════════════════════════════════════════════
-- DIM 21: CRYPTOGRAPHIC INTEGRITY — DIGITAL SIGNATURES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.signing_keys (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    key_owner_type TEXT NOT NULL,         -- 'FEDERATION', 'TOURNAMENT', 'PLATFORM'
    key_owner_id UUID,

    public_key BYTEA NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'Ed25519',
    fingerprint TEXT NOT NULL UNIQUE,     -- SHA256 of public key

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ROTATED', 'REVOKED')),

    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    -- Certificate chain (PKI structure)
    issuer_key_id UUID REFERENCES core.signing_keys(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE core.signing_keys IS
    'V7.0 Dim 21: PKI public key management for verification';

CREATE TABLE IF NOT EXISTS core.digital_signatures (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    -- What was signed
    signed_table TEXT NOT NULL,
    signed_record_id UUID NOT NULL,
    signed_data_hash TEXT NOT NULL,       -- SHA256 of data at signing time

    -- Signature
    signature BYTEA NOT NULL,
    signing_algorithm TEXT NOT NULL DEFAULT 'Ed25519',
    signer_public_key_id UUID NOT NULL REFERENCES core.signing_keys(id),

    -- Context
    signature_type TEXT NOT NULL
        CHECK (signature_type IN (
            'RESULT_CERTIFICATION', 'MEDAL_AWARD', 'BELT_PROMOTION',
            'DOPING_CLEARANCE', 'REFEREE_LICENSE', 'TOURNAMENT_SANCTION'
        )),

    -- Verification
    is_valid BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,

    -- Chain: link signatures for audit chain
    previous_signature_id UUID REFERENCES core.digital_signatures(id),
    chain_hash TEXT,

    signed_at TIMESTAMPTZ DEFAULT now(),
    signed_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_record
    ON core.digital_signatures(signed_table, signed_record_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_type
    ON core.digital_signatures(signature_type);

COMMENT ON TABLE core.digital_signatures IS
    'V7.0 Dim 21: Tamper-proof digital signatures for legal documents';

-- ════════════════════════════════════════════════════════
-- DIM 22: INTERNATIONALIZATION (i18n)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform.translations (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    entity_type TEXT NOT NULL,            -- 'tournament_category', 'scoring_criteria'
    entity_id UUID NOT NULL,
    field_name TEXT NOT NULL,             -- 'name', 'description', 'rules_text'

    -- Translation
    locale TEXT NOT NULL,                 -- BCP-47: 'vi-VN', 'en-US', 'th-TH'
    translated_text TEXT NOT NULL,

    -- Quality
    translation_status TEXT DEFAULT 'DRAFT'
        CHECK (translation_status IN ('DRAFT', 'MACHINE', 'HUMAN_REVIEWED', 'OFFICIAL')),
    translated_by UUID,
    reviewed_by UUID,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_unique
    ON platform.translations(entity_type, entity_id, field_name, locale);

COMMENT ON TABLE platform.translations IS
    'V7.0 Dim 22: Centralized i18n translation store';

CREATE TABLE IF NOT EXISTS platform.federation_locales (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    federation_id UUID NOT NULL,
    locale TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_federation_locales_unique
    ON platform.federation_locales(federation_id, locale);

COMMENT ON TABLE platform.federation_locales IS
    'V7.0 Dim 22: Supported locales per federation';

-- ════════════════════════════════════════════════════════
-- DIM 23: DATA QUALITY FRAMEWORK
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.data_quality_rules (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    rule_name TEXT NOT NULL UNIQUE,

    table_name TEXT NOT NULL,

    rule_type TEXT NOT NULL
        CHECK (rule_type IN (
            'COMPLETENESS', 'ACCURACY', 'CONSISTENCY',
            'TIMELINESS', 'UNIQUENESS', 'REFERENTIAL', 'CUSTOM'
        )),

    check_sql TEXT NOT NULL,             -- SQL returning violation count
    severity TEXT NOT NULL DEFAULT 'WARNING'
        CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),

    threshold_warning DECIMAL(5,2),
    threshold_critical DECIMAL(5,2),

    is_active BOOLEAN DEFAULT true,
    schedule TEXT DEFAULT 'DAILY',       -- 'HOURLY', 'DAILY', 'WEEKLY', 'ON_DEMAND'
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE system.data_quality_rules IS
    'V7.0 Dim 23: Data quality monitoring rules';

CREATE TABLE IF NOT EXISTS system.data_quality_results (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    rule_id UUID NOT NULL REFERENCES system.data_quality_rules(id),

    total_records BIGINT NOT NULL,
    violation_count BIGINT NOT NULL,
    violation_rate DECIMAL(7,4),

    sample_violations JSONB,

    status TEXT NOT NULL
        CHECK (status IN ('PASS', 'WARNING', 'CRITICAL')),

    previous_result_id UUID REFERENCES system.data_quality_results(id),
    rate_change DECIMAL(7,4),

    checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dq_results_rule
    ON system.data_quality_results(rule_id, checked_at DESC);

COMMENT ON TABLE system.data_quality_results IS
    'V7.0 Dim 23: Data quality check results';

CREATE TABLE IF NOT EXISTS system.data_quality_scores (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    table_name TEXT NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,

    completeness_score DECIMAL(5,2),
    accuracy_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    timeliness_score DECIMAL(5,2),

    calculated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE system.data_quality_scores IS
    'V7.0 Dim 23: Aggregate quality scores per table';

-- ════════════════════════════════════════════════════════
-- DIM 24: READ ACCESS AUDIT
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.access_audit_log (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    user_id UUID NOT NULL,
    user_role TEXT,
    session_id UUID,
    ip_address INET,
    device_id UUID,

    resource_type TEXT NOT NULL,          -- 'athlete_medical_record', 'doping_test'
    resource_id UUID NOT NULL,
    accessed_fields TEXT[],

    access_type TEXT NOT NULL
        CHECK (access_type IN (
            'VIEW', 'EXPORT', 'API_READ',
            'REPORT_INCLUDE', 'SEARCH_RESULT', 'BULK_EXPORT'
        )),

    access_justification TEXT,

    endpoint TEXT,
    query_params JSONB,

    accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_audit_user
    ON system.access_audit_log(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_audit_resource
    ON system.access_audit_log(resource_type, resource_id);

COMMENT ON TABLE system.access_audit_log IS
    'V7.0 Dim 24: Read access audit log for confidential data';

-- ════════════════════════════════════════════════════════
-- DIM 25: NOTIFICATION ORCHESTRATION
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL,

    category TEXT NOT NULL,                -- 'MATCH_CALL', 'RESULT_ANNOUNCEMENT', etc.

    channels JSONB NOT NULL DEFAULT '{}',

    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
    quiet_hours_override TEXT[],           -- ['MATCH_CALL'] — bypass quiet hours

    preferred_locale TEXT DEFAULT 'vi-VN',

    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_prefs_unique
    ON system.notification_preferences(user_id, category);

COMMENT ON TABLE system.notification_preferences IS
    'V7.0 Dim 25: Multi-channel notification preferences per user';

CREATE TABLE IF NOT EXISTS system.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    user_id UUID NOT NULL,

    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,

    source_event_id UUID,
    source_context JSONB,

    channels_attempted TEXT[] NOT NULL,
    channels_delivered TEXT[],
    channels_failed TEXT[],
    channel_details JSONB,

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')),

    created_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user
    ON system.notification_deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status
    ON system.notification_deliveries(status) WHERE status IN ('PENDING', 'SENT');

COMMENT ON TABLE system.notification_deliveries IS
    'V7.0 Dim 25: Notification delivery tracking';

-- Add columns that may be missing from earlier version of notification_templates
ALTER TABLE system.notification_templates
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'vi-VN',
  ADD COLUMN IF NOT EXISTS title_template TEXT,
  ADD COLUMN IF NOT EXISTS required_variables TEXT[],
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS system.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    category TEXT NOT NULL,
    channel TEXT NOT NULL,                  -- 'push', 'sms', 'email', 'zalo'
    locale TEXT NOT NULL DEFAULT 'vi-VN',

    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,

    required_variables TEXT[] NOT NULL,

    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_unique
    ON system.notification_templates(category, channel, locale, version);

COMMENT ON TABLE system.notification_templates IS
    'V7.0 Dim 25: Localized notification templates';

COMMIT;
