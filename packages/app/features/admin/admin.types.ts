// ════════════════════════════════════════════════════════════════
// VCT Admin Module — Centralized TypeScript Types
// All admin pages should import types from this file.
// ════════════════════════════════════════════════════════════════

// ── Users ──
export interface SystemUser {
    id: string
    name: string
    email: string
    phone: string
    role: string
    scope: string
    status: 'active' | 'inactive' | 'locked'
    last_login: string
    created_at: string
    avatar_letter: string
}

export interface UserFormData {
    name: string
    email: string
    phone: string
    role: string
    scope: string
    status: SystemUser['status']
}

// ── Roles & Permissions ──
export interface Role {
    id: string
    name: string
    code: string
    description: string
    user_count: number
    scope_type: string
    permissions: string[]
    is_system: boolean
}

export interface Permission {
    key: string
    label: string
    module: string
}

export interface RoleFormData {
    name: string
    code: string
    description: string
    scope_type: string
    permissions: string[]
}

// ── Feature Flags ──
export interface FeatureFlag {
    id: string
    key: string
    name: string
    description: string
    module: string
    status: 'enabled' | 'disabled' | 'partial'
    rollout_pct: number
    scope: 'global' | 'federation' | 'club' | 'user'
    updated_at: string
    updated_by: string
}

// ── Tenants ──
export interface Tenant {
    id: string
    name: string
    type: 'federation' | 'club' | 'association'
    plan: 'free' | 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'suspended' | 'trial' | 'pending'
    members: number
    admins: number
    created_at: string
    region: string
    contact_email: string
    last_active: string
}

// ── System Config ──
export interface ConfigParam {
    key: string
    value: string
    defaultValue: string
    unit: string
    description: string
    type: 'number' | 'boolean' | 'string'
    min?: number
    max?: number
    step?: number
}

export interface BackupEntry {
    id: string
    time: string
    size: string
    type: string
    status: string
}

export interface InfraMetric {
    label: string
    value: string
    status: 'ok' | 'warning' | 'error'
}

// ── Subscriptions & Billing ──
export interface SubPlan {
    id: string
    code: string
    name: string
    description: string
    entity_type: string
    price_monthly: number
    price_yearly: number
    max_members: number
    max_tournaments: number
    max_athletes: number
    is_active: boolean
    sort_order: number
}

export interface Subscription {
    id: string
    plan_code: string
    plan_name: string
    entity_type: string
    entity_id: string
    entity_name: string
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired'
    billing_cycle_type: string
    current_period_start: string
    current_period_end: string
    auto_renew: boolean
    created_at: string
}

export interface BillingEntry {
    id: string
    period: string
    amount: number
    status: string
    due_date: string
    paid_at?: string
}

export interface SubscribeFormData {
    entity_id: string
    entity_type: string
    entity_name: string
    plan_id: string
    billing_cycle_type: string
    trial_days: number
}

// ── Support ──
export interface SupportTicket {
    id: string
    maTicket: string
    tieuDe: string
    noiDung: string
    loai: 'account' | 'technical' | 'tournament' | 'payment' | 'general'
    mucUuTien: 'low' | 'medium' | 'high' | 'critical'
    trangThai: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
    danhMuc: string
    nguoiTaoTen: string
    nguoiTaoEmail: string
    nguoiXuLyTen?: string
    soTraLui: number
    createdAt: string
    updatedAt: string
    firstResponseAt?: string
    slaDeadline?: string
    satisfactionRating?: number
    satisfactionNote?: string
    resolvedAt?: string
}

export interface TicketReply {
    id: string
    ticketId: string
    sender: string
    senderRole: 'customer' | 'admin'
    content: string
    createdAt: string
    attachments?: string[]
}

export interface FAQ {
    id: string
    cauHoi: string
    traLoi: string
    danhMuc: string
    luotXem: number
    isActive: boolean
}

export interface InternalNote {
    id: string
    ticketId: string
    author: string
    content: string
    createdAt: string
}

export interface TicketActivity {
    id: string
    ticketId: string
    action: string
    actor: string
    detail?: string
    createdAt: string
}

export interface SupportCategory {
    id: string
    ten: string
    moTa: string
    icon: string
    mauSac: string
    soTicket: number
    isActive: boolean
}

export interface CannedResponse {
    id: string
    label: string
    content: string
}

// ── Dashboard ──
export interface ServiceStatus {
    name: string
    status: 'online' | 'degraded' | 'offline'
    uptime: string
    latency: string
}

export interface SystemAlert {
    id: string
    severity: 'info' | 'warning' | 'error'
    title: string
    detail: string
    time: string
    service: string
}

// ── Badge Maps — Shared lookup types ──
export interface BadgeConfig {
    label: string
    type: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
}
