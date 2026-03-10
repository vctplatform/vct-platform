/**
 * VCT Platform — V7.0 Infrastructure Types
 * Layer B (Data Quality, Notifications, i18n, Event Schemas)
 * Layer C (Scheduling, Documents, Integrity)
 * Layer D (Sport Profiles, Team Events, Vendor Abstraction)
 */

// ── Layer B: Event Schema Governance ─────────────────────────

export type SchemaCompatibility = 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
export type SchemaStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

export interface EventSchema {
    id: string;
    event_type: string;
    schema_version: number;
    schema_definition: Record<string, unknown>;
    compatibility_mode: SchemaCompatibility;
    status: SchemaStatus;
    owner_service: string;
    consumers?: string[];
    total_events_validated: number;
    validation_failure_count: number;
    last_validation_failure?: Record<string, unknown>;
    published_at?: string;
    deprecated_at?: string;
    retired_at?: string;
    created_at: string;
}

// ── Layer B: i18n ────────────────────────────────────────────

export type TranslationStatus = 'DRAFT' | 'MACHINE' | 'HUMAN_REVIEWED' | 'OFFICIAL';

export interface Translation {
    id: string;
    entity_type: string;
    entity_id: string;
    field_name: string;
    locale: string;
    translated_text: string;
    translation_status: TranslationStatus;
    translated_by?: string;
    reviewed_by?: string;
    created_at: string;
    updated_at: string;
}

export interface FederationLocale {
    id: string;
    federation_id: string;
    locale: string;
    is_default: boolean;
    is_active: boolean;
}

// ── Layer B: Data Quality ────────────────────────────────────

export type DQRuleType =
    | 'COMPLETENESS'
    | 'ACCURACY'
    | 'CONSISTENCY'
    | 'TIMELINESS'
    | 'UNIQUENESS'
    | 'REFERENTIAL'
    | 'CUSTOM';

export type DQSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type DQResultStatus = 'PASS' | 'WARNING' | 'CRITICAL';

export interface DataQualityRule {
    id: string;
    rule_name: string;
    table_name: string;
    rule_type: DQRuleType;
    check_sql: string;
    severity: DQSeverity;
    threshold_warning: number;
    threshold_critical: number;
    is_active: boolean;
    schedule: string;
}

export interface DataQualityResult {
    id: string;
    rule_id: string;
    total_records: number;
    violation_count: number;
    violation_rate: number;
    sample_violations?: Record<string, unknown>;
    status: DQResultStatus;
    previous_result_id?: string;
    rate_change: number;
    checked_at: string;
}

export interface DataQualityScore {
    id: string;
    table_name: string;
    overall_score: number;
    completeness_score: number;
    accuracy_score: number;
    consistency_score: number;
    timeliness_score: number;
    calculated_at: string;
}

// ── Layer B: Notifications ───────────────────────────────────

export interface NotificationChannelConfig {
    enabled: boolean;
    priority?: string;
    phone?: string;
    zalo_id?: string;
}

export interface NotificationPreference {
    id: string;
    user_id: string;
    category: string;
    channels: Record<string, NotificationChannelConfig>;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    quiet_hours_timezone: string;
    quiet_hours_override?: string[];
    preferred_locale: string;
    updated_at: string;
}

export type NotificationStatus =
    | 'PENDING'
    | 'SENT'
    | 'DELIVERED'
    | 'READ'
    | 'FAILED'
    | 'CANCELLED';

export interface NotificationDelivery {
    id: string;
    user_id: string;
    category: string;
    title: string;
    body: string;
    action_url?: string;
    source_event_id?: string;
    source_context?: Record<string, unknown>;
    channels_attempted: string[];
    channels_delivered?: string[];
    channels_failed?: string[];
    channel_details?: Record<string, unknown>;
    status: NotificationStatus;
    created_at: string;
    delivered_at?: string;
    read_at?: string;
}

export interface NotificationTemplate {
    id: string;
    category: string;
    channel: string;
    locale: string;
    title_template: string;
    body_template: string;
    required_variables: string[];
    is_active: boolean;
    version: number;
}

// ── Layer C: Resource Scheduling ─────────────────────────────

export type ScheduleStatus = 'DRAFT' | 'OPTIMIZING' | 'READY' | 'PUBLISHED' | 'SUPERSEDED';

export interface ResourceAvailability {
    id: string;
    resource_type: string;
    resource_id: string;
    available_from: string;
    available_until: string;
    max_continuous_hours: number;
    break_minutes: number;
    conflict_resource_ids?: string[];
    tournament_id: string;
}

export type SchedulingConstraintType =
    | 'SAME_ATHLETE_GAP'
    | 'CATEGORY_ORDER'
    | 'CATEGORY_NOT_PARALLEL'
    | 'MEDAL_CEREMONY_SLOT'
    | 'VIP_TIMESLOT'
    | 'BROADCAST_WINDOW'
    | 'CUSTOM';

export interface SchedulingConstraint {
    id: string;
    tournament_id: string;
    constraint_type: SchedulingConstraintType;
    parameters: Record<string, unknown>;
    priority: number;
    is_hard_constraint: boolean;
}

export interface GeneratedSchedule {
    id: string;
    tournament_id: string;
    version: number;
    status: ScheduleStatus;
    total_duration_minutes: number;
    utilization_rate: number;
    constraint_violations: number;
    optimization_score: number;
    schedule_data: Record<string, unknown>;
    generated_by: string;
    generated_at: string;
    published_at?: string;
    published_by?: string;
}

// ── Layer C: Document Templates ──────────────────────────────

export type DocumentTemplateType =
    | 'MEDAL_CERTIFICATE'
    | 'PARTICIPATION_CERT'
    | 'BELT_PROMOTION_CERT'
    | 'REFEREE_LICENSE'
    | 'TOURNAMENT_SANCTION'
    | 'CLUB_REGISTRATION'
    | 'ATHLETE_CARD'
    | 'MEDICAL_CLEARANCE'
    | 'CUSTOM';

export interface DocumentTemplate {
    id: string;
    template_type: DocumentTemplateType;
    template_html: string;
    template_css?: string;
    required_fields: string[];
    federation_id?: string;
    version: number;
    is_active: boolean;
}

export interface IssuedDocument {
    id: string;
    template_id: string;
    recipient_type: string;
    recipient_id: string;
    document_data: Record<string, unknown>;
    document_number: string;
    signature_id?: string;
    verification_code: string;
    verification_url?: string;
    pdf_storage_path?: string;
    issued_at: string;
    issued_by: string;
    expires_at?: string;
    revoked_at?: string;
    revocation_reason?: string;
}

// ── Layer C: Competition Integrity ───────────────────────────

export type IntegrityAlertType =
    | 'UNUSUAL_SCORING_PATTERN'
    | 'SUSPICIOUS_WITHDRAWAL'
    | 'REPEATED_PAIRING_ANOMALY'
    | 'REFEREE_CONFLICT_OF_INTEREST'
    | 'BETTING_ANOMALY'
    | 'IDENTITY_FRAUD'
    | 'AGE_MANIPULATION'
    | 'WEIGHT_MANIPULATION'
    | 'MANUAL_REPORT';

export type IntegrityAlertStatus =
    | 'NEW'
    | 'UNDER_REVIEW'
    | 'INVESTIGATING'
    | 'SUBSTANTIATED'
    | 'UNSUBSTANTIATED'
    | 'CLOSED';

export interface IntegrityAlert {
    id: string;
    alert_type: IntegrityAlertType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    trigger_source: string;
    trigger_data: Record<string, unknown>;
    tournament_id?: string;
    match_id?: string;
    athlete_ids?: string[];
    referee_ids?: string[];
    status: IntegrityAlertStatus;
    assigned_to?: string;
    investigation_notes?: string;
    outcome?: string;
    disciplinary_action_ids?: string[];
    reported_at: string;
    resolved_at?: string;
}

export interface ScoringBaseline {
    id: string;
    category_type: string;
    stat_type: string;
    baseline_value: number;
    sample_size: number;
    confidence_interval: number;
    warning_deviation: number;
    critical_deviation: number;
    calculated_from: string;
    calculated_to: string;
    calculated_at: string;
}

// ── Layer D: Multi-Sport ─────────────────────────────────────

export interface SportProfile {
    id: string;
    sport_code: string;
    sport_name: string;
    competition_types: string[];
    weight_class_config: Record<string, unknown>;
    default_match_config: Record<string, unknown>;
    ranking_config?: Record<string, unknown>;
    equipment_config?: Record<string, unknown>;
    international_federation?: string;
    national_federation?: string;
    is_active: boolean;
}

// ── Layer D: Team Events ─────────────────────────────────────

export type TeamRole = 'CAPTAIN' | 'MEMBER' | 'RESERVE';
export type TeamEntryStatus = 'ACTIVE' | 'SUBSTITUTED' | 'WITHDRAWN' | 'DISQUALIFIED';

export interface TeamEntry {
    id: string;
    entry_id: string;
    athlete_id: string;
    role_in_team: TeamRole;
    order_in_team: number;
    weight_class?: string;
    status: TeamEntryStatus;
    substituted_by?: string;
    substitution_reason?: string;
}

export type BoutStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MatchBout {
    id: string;
    match_id: string;
    bout_number: number;
    red_athlete_id: string;
    blue_athlete_id: string;
    winner_athlete_id?: string;
    result_type?: string;
    red_score?: Record<string, unknown>;
    blue_score?: Record<string, unknown>;
    status: BoutStatus;
    started_at?: string;
    ended_at?: string;
}

// ── Layer D: Athlete Daily Load ──────────────────────────────

export type LoadStatus = 'NORMAL' | 'HIGH' | 'EXCESSIVE' | 'BLOCKED';

export interface AthleteDailyLoad {
    id: string;
    athlete_id: string;
    tournament_id: string;
    competition_date: string;
    total_matches: number;
    total_rounds: number;
    total_competition_minutes: number;
    total_rest_minutes: number;
    max_matches_per_day: number;
    max_rounds_per_day: number;
    max_competition_minutes_per_day: number;
    min_rest_between_matches_minutes: number;
    load_status: LoadStatus;
    medical_clearance: boolean;
    medical_cleared_by?: string;
    last_updated: string;
}

// ── Layer D: Vendor Abstraction ──────────────────────────────

export interface AuthProviderMapping {
    id: string;
    internal_user_id: string;
    provider: string;
    provider_user_id: string;
    migrated_from_provider?: string;
    migrated_at?: string;
    is_active: boolean;
    created_at: string;
}

export interface StorageProviderMapping {
    id: string;
    logical_path: string;
    provider: string;
    provider_path: string;
    provider_bucket?: string;
    file_size: number;
    content_type?: string;
    checksum?: string;
    uploaded_at: string;
}

// ── Layer D: Federation Merges ───────────────────────────────

export type FederationMergeStatus =
    | 'PLANNED'
    | 'MAPPING'
    | 'EXECUTING'
    | 'VALIDATING'
    | 'COMPLETED'
    | 'ROLLED_BACK';

export interface FederationMerge {
    id: string;
    source_federation_id: string;
    target_federation_id: string;
    status: FederationMergeStatus;
    entity_mappings: Record<string, unknown>;
    duplicate_athletes?: Record<string, unknown>;
    duplicate_clubs?: Record<string, unknown>;
    rollback_snapshot_id?: string;
    planned_at: string;
    executed_at?: string;
    completed_at?: string;
    executed_by?: string;
}
