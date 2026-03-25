-- ===============================================================
-- VCT Platform — Migration 0029: V7.0 LAYER C
-- Enterprise-grade patterns (SportRadar/SPORTDATA benchmark)
-- Tables: resource_availability, scheduling_constraints,
--         generated_schedules, document_templates,
--         issued_documents, integrity_alerts, scoring_baselines
-- ===============================================================

BEGIN;

-- ════════════════════════════════════════════════════════
-- ENTERPRISE 1: RESOURCE SCHEDULING OPTIMIZATION
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.resource_availability (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    resource_type TEXT NOT NULL,          -- 'TATAMI', 'REFEREE', 'MEDICAL_TEAM', 'JUDGE_PANEL'
    resource_id UUID NOT NULL,

    available_from TIMESTAMPTZ NOT NULL,
    available_until TIMESTAMPTZ NOT NULL,

    max_continuous_hours DECIMAL(4,2),
    break_minutes INTEGER,

    conflict_resource_ids UUID[],        -- Conflict of interest

    tournament_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_resource_avail_tournament
    ON tournament.resource_availability(tournament_id, resource_type);

COMMENT ON TABLE tournament.resource_availability IS
    'V7.0 Enterprise: Resource availability windows for scheduling optimization';

CREATE TABLE IF NOT EXISTS tournament.scheduling_constraints (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    tournament_id UUID NOT NULL,

    constraint_type TEXT NOT NULL
        CHECK (constraint_type IN (
            'SAME_ATHLETE_GAP', 'CATEGORY_ORDER', 'CATEGORY_NOT_PARALLEL',
            'MEDAL_CEREMONY_SLOT', 'VIP_TIMESLOT', 'BROADCAST_WINDOW', 'CUSTOM'
        )),

    parameters JSONB NOT NULL,

    priority INTEGER DEFAULT 5,
    is_hard_constraint BOOLEAN DEFAULT false,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_tournament
    ON tournament.scheduling_constraints(tournament_id);

COMMENT ON TABLE tournament.scheduling_constraints IS
    'V7.0 Enterprise: Constraint-based scheduling rules';

CREATE TABLE IF NOT EXISTS tournament.generated_schedules (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    tournament_id UUID NOT NULL,

    version INTEGER NOT NULL,
    status TEXT DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'OPTIMIZING', 'READY', 'PUBLISHED', 'SUPERSEDED')),

    total_duration_minutes INTEGER,
    utilization_rate DECIMAL(5,2),
    constraint_violations INTEGER,
    optimization_score DECIMAL(7,4),

    schedule_data JSONB NOT NULL,

    generated_by TEXT,
    generated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ,
    published_by UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_generated_schedules_tournament
    ON tournament.generated_schedules(tournament_id, version DESC);

COMMENT ON TABLE tournament.generated_schedules IS
    'V7.0 Enterprise: Optimized schedule output from constraint solver';

-- ════════════════════════════════════════════════════════
-- ENTERPRISE 2: CERTIFICATE & DOCUMENT GENERATION
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform.document_templates (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    template_type TEXT NOT NULL
        CHECK (template_type IN (
            'MEDAL_CERTIFICATE', 'PARTICIPATION_CERT', 'BELT_PROMOTION_CERT',
            'REFEREE_LICENSE', 'TOURNAMENT_SANCTION', 'CLUB_REGISTRATION',
            'ATHLETE_CARD', 'MEDICAL_CLEARANCE', 'CUSTOM'
        )),

    template_html TEXT NOT NULL,
    template_css TEXT,

    required_fields TEXT[] NOT NULL,

    federation_id UUID,                  -- NULL = platform default

    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE platform.document_templates IS
    'V7.0 Enterprise: Certificate/document HTML templates';

CREATE TABLE IF NOT EXISTS platform.issued_documents (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    template_id UUID NOT NULL REFERENCES platform.document_templates(id),

    recipient_type TEXT NOT NULL,         -- 'ATHLETE', 'REFEREE', 'CLUB'
    recipient_id UUID NOT NULL,

    document_data JSONB NOT NULL,
    document_number TEXT NOT NULL UNIQUE, -- 'VCT-2026-MC-001234'

    signature_id UUID,                   -- References core.digital_signatures if signed

    verification_code TEXT NOT NULL UNIQUE,
    verification_url TEXT,

    pdf_storage_path TEXT,

    issued_at TIMESTAMPTZ DEFAULT now(),
    issued_by UUID NOT NULL,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_issued_documents_recipient
    ON platform.issued_documents(recipient_type, recipient_id);

COMMENT ON TABLE platform.issued_documents IS
    'V7.0 Enterprise: Issued document tracking with QR verification';

-- ════════════════════════════════════════════════════════
-- ENTERPRISE 3: COMPETITION INTEGRITY — ANTI-MATCH-FIXING
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament.integrity_alerts (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    alert_type TEXT NOT NULL
        CHECK (alert_type IN (
            'UNUSUAL_SCORING_PATTERN', 'SUSPICIOUS_WITHDRAWAL',
            'REPEATED_PAIRING_ANOMALY', 'REFEREE_CONFLICT_OF_INTEREST',
            'BETTING_ANOMALY', 'IDENTITY_FRAUD', 'AGE_MANIPULATION',
            'WEIGHT_MANIPULATION', 'MANUAL_REPORT'
        )),

    severity TEXT NOT NULL DEFAULT 'MEDIUM'
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    trigger_source TEXT NOT NULL,         -- 'SYSTEM_AUTO', 'REFEREE_REPORT', 'AI_DETECTION'
    trigger_data JSONB NOT NULL,

    tournament_id UUID,
    match_id UUID,
    athlete_ids UUID[],
    referee_ids UUID[],

    status TEXT NOT NULL DEFAULT 'NEW'
        CHECK (status IN (
            'NEW', 'UNDER_REVIEW', 'INVESTIGATING',
            'SUBSTANTIATED', 'UNSUBSTANTIATED', 'CLOSED'
        )),
    assigned_to UUID,
    investigation_notes TEXT,

    outcome TEXT,
    disciplinary_action_ids UUID[],

    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_integrity_alerts_status
    ON tournament.integrity_alerts(status) WHERE status NOT IN ('CLOSED', 'UNSUBSTANTIATED');
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_tournament
    ON tournament.integrity_alerts(tournament_id);

COMMENT ON TABLE tournament.integrity_alerts IS
    'V7.0 Enterprise: Anti-match-fixing integrity alert system';

CREATE TABLE IF NOT EXISTS tournament.scoring_baselines (
    id UUID PRIMARY KEY DEFAULT uuidv7(),

    category_type TEXT NOT NULL,          -- 'DOI_KHANG_NAM_60KG'
    stat_type TEXT NOT NULL,              -- 'avg_score', 'score_stddev', 'ko_rate'

    baseline_value DECIMAL(10,4),
    sample_size INTEGER,
    confidence_interval DECIMAL(5,4),

    warning_deviation DECIMAL(5,2),
    critical_deviation DECIMAL(5,2),

    calculated_from TIMESTAMPTZ,
    calculated_to TIMESTAMPTZ,
    calculated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE tournament.scoring_baselines IS
    'V7.0 Enterprise: Statistical baselines for anomaly detection';

COMMIT;
