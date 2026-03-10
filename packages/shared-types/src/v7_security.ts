/**
 * VCT Platform — V7.0 Security & Compliance Types
 * Layer A (Contradictions) + Layer B (ReBAC, Digital Signatures, Access Audit)
 */

// ── Layer A: Crypto-Shredding ────────────────────────────────

export type DataKeyStatus = 'ACTIVE' | 'PENDING_DESTRUCTION' | 'DESTROYED';

export interface AthleteDataKey {
    id: string;
    athlete_id: string;
    key_purpose: string;
    kek_reference: string;
    key_version: number;
    status: DataKeyStatus;
    destruction_requested_at?: string;
    destruction_requested_by?: string;
    destruction_executed_at?: string;
    destruction_certificate?: string;
    created_at: string;
}

export type ErasureType = 'FULL' | 'PARTIAL' | 'PSEUDONYMIZED';

export interface ErasureTombstone {
    id: string;
    original_athlete_id: string;
    erasure_type: ErasureType;
    affected_tables: string[];
    affected_event_count: number;
    legal_basis: string;
    legal_reference?: string;
    retained_fields?: string[];
    retention_justification?: string;
    requested_at: string;
    executed_at?: string;
    verified_by?: string;
    verification_at?: string;
}

// ── Layer A: Sync Conflicts ──────────────────────────────────

export type ResolutionStrategy =
    | 'LAST_WRITE_WINS'
    | 'HIGHER_AUTHORITY'
    | 'MANUAL'
    | 'MERGE'
    | 'DOMAIN_RULE';

export type ConflictStatus =
    | 'DETECTED'
    | 'AUTO_RESOLVED'
    | 'PENDING_MANUAL'
    | 'RESOLVED'
    | 'ESCALATED';

export interface SyncConflict {
    id: string;
    table_name: string;
    record_id: string;
    version_a: Record<string, unknown>;
    version_a_device_id: string;
    version_a_timestamp: string;
    version_a_user_id: string;
    version_b: Record<string, unknown>;
    version_b_device_id: string;
    version_b_timestamp: string;
    version_b_user_id: string;
    resolution_strategy: ResolutionStrategy;
    domain_rule_id?: string;
    status: ConflictStatus;
    resolved_version?: Record<string, unknown>;
    resolved_by?: string;
    resolved_at?: string;
    resolution_notes?: string;
    detected_at: string;
}

export interface ConflictResolutionRule {
    id: string;
    table_name: string;
    field_name?: string;
    strategy: ResolutionStrategy;
    priority_field?: string;
    merge_logic?: Record<string, unknown>;
    domain_logic?: string;
    applies_when?: Record<string, unknown>;
    is_active: boolean;
}

// ── Layer A: Config Changelog ────────────────────────────────

export type ConfigChangeType = 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ROLLBACK';

export interface ConfigChangelog {
    id: string;
    config_table: string;
    config_id: string;
    change_type: ConfigChangeType;
    previous_value?: Record<string, unknown>;
    new_value: Record<string, unknown>;
    diff?: Record<string, unknown>;
    reason: string;
    tournament_id?: string;
    is_rollback_of?: string;
    can_rollback: boolean;
    changed_by: string;
    changed_at: string;
    requires_approval: boolean;
    approved_by?: string;
    approved_at?: string;
}

// ── Layer B: ReBAC ───────────────────────────────────────────

export interface AuthorizationTuple {
    id: string;
    object_type: string;
    object_id: string;
    relation: string;
    subject_type: string;
    subject_id: string;
    condition?: Record<string, unknown>;
    granted_by?: string;
    granted_at: string;
    expires_at?: string;
    revoked_at?: string;
    revoked_by?: string;
}

export interface AuthorizationRule {
    id: string;
    rule_name: string;
    description?: string;
    source_relation: string;
    source_object_type: string;
    derived_permission: string;
    target_object_type: string;
    traversal_path: string;
    is_active: boolean;
}

// ── Layer B: Digital Signatures ──────────────────────────────

export type SignatureType =
    | 'RESULT_CERTIFICATION'
    | 'MEDAL_AWARD'
    | 'BELT_PROMOTION'
    | 'DOPING_CLEARANCE'
    | 'REFEREE_LICENSE'
    | 'TOURNAMENT_SANCTION';

export type KeyStatus = 'ACTIVE' | 'ROTATED' | 'REVOKED';

export interface SigningKey {
    id: string;
    key_owner_type: string;
    key_owner_id?: string;
    algorithm: string;
    fingerprint: string;
    status: KeyStatus;
    valid_from: string;
    valid_until?: string;
    revoked_at?: string;
    issuer_key_id?: string;
    created_at: string;
}

export interface DigitalSignature {
    id: string;
    signed_table: string;
    signed_record_id: string;
    signed_data_hash: string;
    signing_algorithm: string;
    signer_public_key_id: string;
    signature_type: SignatureType;
    is_valid: boolean;
    revoked_at?: string;
    revocation_reason?: string;
    previous_signature_id?: string;
    chain_hash?: string;
    signed_at: string;
    signed_by: string;
}

// ── Layer B: Access Audit ────────────────────────────────────

export type AccessType =
    | 'VIEW'
    | 'EXPORT'
    | 'API_READ'
    | 'REPORT_INCLUDE'
    | 'SEARCH_RESULT'
    | 'BULK_EXPORT';

export interface AccessAuditLog {
    id: string;
    user_id: string;
    user_role?: string;
    session_id?: string;
    ip_address?: string;
    device_id?: string;
    resource_type: string;
    resource_id: string;
    accessed_fields?: string[];
    access_type: AccessType;
    access_justification?: string;
    endpoint?: string;
    query_params?: Record<string, unknown>;
    accessed_at: string;
}

// ── Layer A: View Contracts ──────────────────────────────────

export type ValidationStatus = 'VALID' | 'BROKEN' | 'PENDING' | 'DEPRECATED';

export interface ViewContract {
    id: string;
    view_name: string;
    version: number;
    expected_columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
    }>;
    breaking_changes?: string[];
    additive_changes?: string[];
    consumed_by: string[];
    min_consumer_version?: string;
    last_validated_at?: string;
    validation_status: ValidationStatus;
    validation_errors?: Record<string, unknown>;
    published_at: string;
    deprecated_at?: string;
    sunset_at?: string;
}
