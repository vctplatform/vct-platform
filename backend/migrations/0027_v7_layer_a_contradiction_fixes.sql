-- ===============================================================
-- VCT Platform — Migration 0027: V7.0 LAYER A
-- Fix 5 internal contradictions from V6.0
-- Tables: athlete_data_keys, erasure_tombstones, sync_conflicts,
--         conflict_resolution_rules, view_contracts,
--         config_changelog, cross_aggregate_references
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- 1. CRYPTO-SHREDDING: athlete_data_keys
--    Per-athlete Data Encryption Key for right-to-erasure
--    GDPR Article 17 compliance via key destruction
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.athlete_data_keys (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    athlete_id UUID NOT NULL,
    key_purpose TEXT NOT NULL DEFAULT 'PII_ENCRYPTION',

    -- DEK encrypted by Key Encryption Key (KEK) from KMS
    encrypted_dek BYTEA NOT NULL,
    kek_reference TEXT NOT NULL,          -- 'vault:vct/kek/2026-q1'
    key_version INTEGER NOT NULL DEFAULT 1,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PENDING_DESTRUCTION', 'DESTROYED')),

    -- When DESTROYED: all data encrypted with this DEK
    -- becomes unreadable = effectively deleted
    -- but events remain intact (only PII fields unreadable)
    destruction_requested_at TIMESTAMPTZ,
    destruction_requested_by TEXT,        -- 'athlete_self' or 'legal_request'
    destruction_executed_at TIMESTAMPTZ,
    destruction_certificate TEXT,         -- Proof of destruction for audit

    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_athlete_data_keys_athlete
    ON core.athlete_data_keys(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_data_keys_status
    ON core.athlete_data_keys(status) WHERE status != 'DESTROYED';

COMMENT ON TABLE core.athlete_data_keys IS
    'V7.0 Layer A: Per-athlete DEK for crypto-shredding pattern (GDPR right-to-erasure)';

-- ════════════════════════════════════════════════════════
-- 2. ERASURE TOMBSTONES
--    Track who has been erased and why
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS core.erasure_tombstones (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    original_athlete_id UUID NOT NULL,
    erasure_type TEXT NOT NULL
        CHECK (erasure_type IN ('FULL', 'PARTIAL', 'PSEUDONYMIZED')),

    affected_tables TEXT[] NOT NULL,
    affected_event_count INTEGER,
    legal_basis TEXT NOT NULL,            -- 'GDPR_ART17', 'VN_CYBERSEC_2018', 'ATHLETE_REQUEST'
    legal_reference TEXT,                -- Document reference number

    -- Retention override: keep what for statistical purposes?
    retained_fields TEXT[],              -- ['birth_year', 'gender', 'weight_class'] (anonymized)
    retention_justification TEXT,        -- 'Legitimate interest: tournament statistics'

    requested_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    verified_by UUID,
    verification_at TIMESTAMPTZ,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_erasure_tombstones_athlete
    ON core.erasure_tombstones(original_athlete_id);

COMMENT ON TABLE core.erasure_tombstones IS
    'V7.0 Layer A: Tombstone records tracking data erasure compliance';

-- ════════════════════════════════════════════════════════
-- 3. SYNC CONFLICTS
--    Detect conflicts when 2 offline devices edit the same data
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.conflict_resolution_rules (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    table_name TEXT NOT NULL,
    field_name TEXT,                      -- NULL = whole record

    strategy TEXT NOT NULL
        CHECK (strategy IN (
            'LAST_WRITE_WINS', 'HIGHER_AUTHORITY', 'MANUAL', 'MERGE', 'DOMAIN_RULE'
        )),
    priority_field TEXT,                 -- For 'HIGHER_AUTHORITY': which field to compare rank
    merge_logic JSONB,                   -- For 'MERGE': {"keep_fields_from": "latest", "sum_fields": ["score"]}
    domain_logic TEXT,                   -- For 'DOMAIN_RULE': logic description

    -- Context
    applies_when JSONB,                  -- {"match_status": "IN_PROGRESS"} — only apply when

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE system.conflict_resolution_rules IS
    'V7.0 Layer A: Configurable merge strategy rules for offline sync conflicts';

-- Add columns that may be missing from earlier version of this table
ALTER TABLE system.conflict_resolution_rules
  ADD COLUMN IF NOT EXISTS strategy TEXT,
  ADD COLUMN IF NOT EXISTS priority_field TEXT,
  ADD COLUMN IF NOT EXISTS merge_logic JSONB,
  ADD COLUMN IF NOT EXISTS domain_logic TEXT,
  ADD COLUMN IF NOT EXISTS applies_when JSONB,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add columns that may be missing from earlier version of sync_conflicts
ALTER TABLE system.sync_conflicts
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DETECTED',
  ADD COLUMN IF NOT EXISTS version_a JSONB,
  ADD COLUMN IF NOT EXISTS version_a_device_id UUID,
  ADD COLUMN IF NOT EXISTS version_a_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version_a_user_id UUID,
  ADD COLUMN IF NOT EXISTS version_b JSONB,
  ADD COLUMN IF NOT EXISTS version_b_device_id UUID,
  ADD COLUMN IF NOT EXISTS version_b_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version_b_user_id UUID,
  ADD COLUMN IF NOT EXISTS resolution_strategy TEXT DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS domain_rule_id UUID,
  ADD COLUMN IF NOT EXISTS resolved_version JSONB,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS system.sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    -- Conflicting records
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,

    -- Two competing versions
    version_a JSONB NOT NULL,
    version_a_device_id UUID NOT NULL,
    version_a_timestamp TIMESTAMPTZ NOT NULL,
    version_a_user_id UUID NOT NULL,

    version_b JSONB NOT NULL,
    version_b_device_id UUID NOT NULL,
    version_b_timestamp TIMESTAMPTZ NOT NULL,
    version_b_user_id UUID NOT NULL,

    -- Resolution
    resolution_strategy TEXT NOT NULL DEFAULT 'MANUAL'
        CHECK (resolution_strategy IN (
            'LAST_WRITE_WINS', 'HIGHER_AUTHORITY', 'MANUAL', 'MERGE', 'DOMAIN_RULE'
        )),

    domain_rule_id UUID REFERENCES system.conflict_resolution_rules(id),

    status TEXT NOT NULL DEFAULT 'DETECTED'
        CHECK (status IN ('DETECTED', 'AUTO_RESOLVED', 'PENDING_MANUAL', 'RESOLVED', 'ESCALATED')),
    resolved_version JSONB,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    detected_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status
    ON system.sync_conflicts(status) WHERE status NOT IN ('RESOLVED');
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table_record
    ON system.sync_conflicts(table_name, record_id);

COMMENT ON TABLE system.sync_conflicts IS
    'V7.0 Layer A: Offline merge conflict detection and resolution';
-- Seed default resolution rules
INSERT INTO system.conflict_resolution_rules (table_name, field_name, strategy, domain_logic)
VALUES
    ('judge_scores', NULL, 'MANUAL', 'Judge scores must be decided by Jury President on conflict'),
    ('match_events', NULL, 'LAST_WRITE_WINS', 'Events are append-only, conflict = duplicate detection'),
    ('weigh_ins', 'weight_value', 'MANUAL', 'Weight has only one correct value, requires verification')
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- 4. VIEW CONTRACTS
--    Contract testing for API views post-migration
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.view_contracts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    view_name TEXT NOT NULL,               -- 'api_v1.athletes'
    version INTEGER NOT NULL,

    -- Contract definition
    expected_columns JSONB NOT NULL,
    -- [{"name": "id", "type": "uuid", "nullable": false}, ...]

    -- Backward compatibility
    breaking_changes TEXT[],
    additive_changes TEXT[],

    -- Consumers
    consumed_by TEXT[] NOT NULL,            -- ['mobile_app_v2.3', 'web_dashboard']
    min_consumer_version TEXT,

    -- Validation
    last_validated_at TIMESTAMPTZ,
    validation_status TEXT DEFAULT 'PENDING'
        CHECK (validation_status IN ('VALID', 'BROKEN', 'PENDING', 'DEPRECATED')),
    validation_errors JSONB,

    published_at TIMESTAMPTZ DEFAULT now(),
    deprecated_at TIMESTAMPTZ,
    sunset_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_view_contracts_unique
    ON system.view_contracts(view_name, version);

COMMENT ON TABLE system.view_contracts IS
    'V7.0 Layer A: API view contract testing metadata';

-- ════════════════════════════════════════════════════════
-- 5. CONFIG CHANGELOG
--    Configuration versioning + rollback support
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.config_changelog (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    config_table TEXT NOT NULL,
    config_id UUID NOT NULL,

    change_type TEXT NOT NULL
        CHECK (change_type IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'ROLLBACK')),

    previous_value JSONB,
    new_value JSONB NOT NULL,
    diff JSONB,

    -- Context
    reason TEXT NOT NULL,
    tournament_id UUID,

    -- Rollback support
    is_rollback_of UUID REFERENCES system.config_changelog(id),
    can_rollback BOOLEAN DEFAULT true,

    changed_by UUID NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now(),

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_config_changelog_table_id
    ON system.config_changelog(config_table, config_id);
CREATE INDEX IF NOT EXISTS idx_config_changelog_changed_at
    ON system.config_changelog(changed_at DESC);

COMMENT ON TABLE system.config_changelog IS
    'V7.0 Layer A: Configuration versioning with rollback support';

-- ════════════════════════════════════════════════════════
-- 6. CROSS-AGGREGATE REFERENCES
--    Document soft FK references between aggregates
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system.cross_aggregate_references (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    source_schema TEXT NOT NULL,
    source_table TEXT NOT NULL,
    source_column TEXT NOT NULL,
    target_schema TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_column TEXT NOT NULL,
    reference_type TEXT NOT NULL
        CHECK (reference_type IN ('SOFT_FK', 'EVENT_DRIVEN', 'CACHED_COPY')),
    sync_strategy TEXT,                  -- 'ON_DEMAND', 'EVENT_SUBSCRIPTION', 'PERIODIC'
    staleness_tolerance TEXT,            -- '5_MINUTES', '1_HOUR', 'EVENTUAL'
    metadata JSONB DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_agg_ref_unique
    ON system.cross_aggregate_references(
        source_schema, source_table, source_column,
        target_schema, target_table, target_column
    );

COMMENT ON TABLE system.cross_aggregate_references IS
    'V7.0 Layer A: Cross-aggregate soft FK reference documentation';

COMMIT;
