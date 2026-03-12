// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION SHARED TYPES
// TypeScript types matching Go structs in domain/federation/
// ════════════════════════════════════════════════════════════════

// ── Enums ─────────────────────────────────────────────────────

export const ORGANIZATION_TYPE_VALUES = ['NATIONAL', 'PROVINCIAL', 'SECTOR'] as const;
export type OrganizationType = typeof ORGANIZATION_TYPE_VALUES[number];

export const ORGANIZATION_STATUS_VALUES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export type OrganizationStatus = typeof ORGANIZATION_STATUS_VALUES[number];

export const UNIT_TYPE_VALUES = ['central', 'province', 'district', 'committee'] as const;
export type UnitType = typeof UNIT_TYPE_VALUES[number];

export const UNIT_STATUS_VALUES = ['active', 'inactive', 'suspended'] as const;
export type UnitStatus = typeof UNIT_STATUS_VALUES[number];

export const REGION_CODE_VALUES = ['north', 'central', 'south'] as const;
export type RegionCode = typeof REGION_CODE_VALUES[number];

export const BELT_SCOPE_VALUES = ['NATIONAL', 'PROVINCIAL', 'SCHOOL'] as const;
export type BeltSystemScope = typeof BELT_SCOPE_VALUES[number];

export const APPROVAL_STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'] as const;
export type ApprovalRequestStatus = typeof APPROVAL_STATUS_VALUES[number];

export const FEDERATION_ROLE_VALUES = [
    'system_admin', 'federation_president', 'federation_secretary',
    'national_referee', 'national_coach',
] as const;
export type FederationRole = typeof FEDERATION_ROLE_VALUES[number];

// ── Status Maps ──────────────────────────────────────────────

export const ORGANIZATION_STATUS_MAP: Record<OrganizationStatus, { label: string; color: string }> = {
    ACTIVE: { label: 'Hoạt động', color: '#10b981' },
    SUSPENDED: { label: 'Tạm ngừng', color: '#f59e0b' },
    INACTIVE: { label: 'Ngừng hoạt động', color: '#ef4444' },
};

export const UNIT_STATUS_MAP: Record<UnitStatus, { label: string; color: string }> = {
    active: { label: 'Hoạt động', color: '#10b981' },
    inactive: { label: 'Ngừng hoạt động', color: '#94a3b8' },
    suspended: { label: 'Tạm ngừng', color: '#f59e0b' },
};

export const APPROVAL_STATUS_MAP: Record<ApprovalRequestStatus, { label: string; color: string; type: string }> = {
    PENDING: { label: 'Chờ duyệt', color: '#f59e0b', type: 'warning' },
    APPROVED: { label: 'Đã duyệt', color: '#10b981', type: 'success' },
    REJECTED: { label: 'Từ chối', color: '#ef4444', type: 'danger' },
    DRAFT: { label: 'Nháp', color: '#94a3b8', type: 'info' },
};

export const REGION_MAP: Record<RegionCode, { label: string; labelEN: string }> = {
    north: { label: 'Miền Bắc', labelEN: 'Northern' },
    central: { label: 'Miền Trung', labelEN: 'Central' },
    south: { label: 'Miền Nam', labelEN: 'Southern' },
};

// ── Organization ─────────────────────────────────────────────

export interface Organization {
    id: string;
    type: OrganizationType;
    name: string;
    abbreviation: string;
    region: string;
    province_id?: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    address: string;
    status: OrganizationStatus;
    established_date: string;
    created_at: string;
    updated_at: string;
}

// ── Province ─────────────────────────────────────────────────

export interface Province {
    id: string;
    code: string;
    name: string;
    region: RegionCode;
    has_fed: boolean;
    fed_unit_id?: string;
    club_count: number;
    coach_count: number;
    vdv_count: number;
    created_at: string;
    updated_at: string;
}

// ── Federation Unit ──────────────────────────────────────────

export interface FederationUnit {
    id: string;
    name: string;
    short_name: string;
    type: UnitType;
    parent_id?: string;
    province_id?: string;
    status: UnitStatus;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    founded_date?: string;
    leader_name?: string;
    leader_title?: string;
    club_count: number;
    member_count: number;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ── Org Chart ────────────────────────────────────────────────

export interface OrgNodeStats {
    total_clubs: number;
    total_coaches: number;
    total_athletes: number;
    total_referees: number;
    active_events: number;
}

export interface OrgChartNode {
    id: string;
    unit_id: string;
    unit_name: string;
    unit_type: UnitType;
    level: number;
    parent_id?: string;
    children?: OrgChartNode[];
    status: UnitStatus;
    stats: OrgNodeStats;
}

// ── Personnel ────────────────────────────────────────────────

export interface PersonnelAssignment {
    id: string;
    user_id: string;
    user_name: string;
    unit_id: string;
    unit_name: string;
    position: string;
    role_code: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    decision_no?: string;
    created_at: string;
}

// ── Master Data ──────────────────────────────────────────────

export interface MasterBelt {
    level: number;
    name: string;
    color_hex: string;
    required_time_min: number;
    is_dan_level: boolean;
    description: string;
    scope: BeltSystemScope;
    scope_id?: string;
    inherits_from?: string;
    created_at: string;
    updated_at: string;
}

export interface MasterWeightClass {
    id: string;
    gender: string;
    category: string;
    min_weight: number;
    max_weight: number;
    is_heavy: boolean;
    scope: BeltSystemScope;
    scope_id?: string;
    inherits_from?: string;
    created_at: string;
    updated_at: string;
}

export interface MasterAgeGroup {
    id: string;
    name: string;
    min_age: number;
    max_age: number;
    scope: BeltSystemScope;
    scope_id?: string;
    inherits_from?: string;
    created_at: string;
    updated_at: string;
}

// ── Approval Workflows ──────────────────────────────────────

export interface ApprovalRequest {
    id: string;
    workflow_code: string;
    entity_type: string;
    entity_id: string;
    requester_id: string;
    requester_name: string;
    current_step: number;
    status: ApprovalRequestStatus;
    notes?: string;
    submitted_at: string;
    updated_at: string;
}

// ── National Statistics ──────────────────────────────────────

export interface NationalStatistics {
    total_provinces: number;
    active_provinces: number;
    total_clubs: number;
    total_athletes: number;
    total_coaches: number;
    total_referees: number;
    active_tournaments: number;
    total_tournaments_ytd: number;
    by_region: Record<string, number>;
    top_provinces_by_clubs: Province[];
}

// ═══════════════════════════════════════════════════════════════
// PROVINCIAL-LEVEL TYPES (Cấp tỉnh / thành phố)
// ═══════════════════════════════════════════════════════════════

export enum ClubStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
}

export enum AthleteStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    RETIRED = 'RETIRED',
}

export enum CoachLevel {
    PROVINCIAL = 'PROVINCIAL',
    NATIONAL = 'NATIONAL',
    MASTER = 'MASTER',
}

export enum ReportType {
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    ANNUAL = 'ANNUAL',
    EVENT = 'EVENT',
}

export enum ReportStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
}

export interface ProvincialClub {
    id: string;
    province_id: string;
    name: string;
    code: string;
    address: string;
    district: string;
    leader_name: string;
    leader_phone: string;
    member_count: number;
    athlete_count: number;
    coach_count: number;
    status: ClubStatus;
    founded_date: string;
    created_at: string;
    updated_at: string;
}

export interface ProvincialAthlete {
    id: string;
    province_id: string;
    club_id: string;
    club_name: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    belt_level: number;
    belt_name: string;
    weight_kg: number;
    height_cm: number;
    id_number: string;
    phone: string;
    status: AthleteStatus;
    join_date: string;
    achievements?: string;
    created_at: string;
    updated_at: string;
}

export interface ProvincialCoach {
    id: string;
    province_id: string;
    club_id: string;
    club_name: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    phone: string;
    email: string;
    level: CoachLevel;
    cert_number: string;
    cert_expiry: string;
    belt_level: number;
    belt_name: string;
    years_experience: number;
    specialization: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface ProvincialReport {
    id: string;
    province_id: string;
    title: string;
    type: ReportType;
    period: string;
    total_clubs: number;
    total_vdv: number;
    total_coaches: number;
    total_events: number;
    highlights: string;
    issues: string;
    status: ReportStatus;
    submitted_by: string;
    created_at: string;
    updated_at: string;
}

export interface ProvincialStatistics {
    province_id: string;
    province_name: string;
    total_clubs: number;
    active_clubs: number;
    total_athletes: number;
    total_coaches: number;
    total_events: number;
    pending_approvals: number;
}
