// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Types
// Defines the 6 workspace types and related interfaces.
// ════════════════════════════════════════════════════════════════

/** The workspace types in the VCT Ecosystem */
export type WorkspaceType =
    | 'federation_admin'
    | 'federation_provincial'
    | 'federation_discipline'
    | 'tournament_ops'
    | 'club_management'
    | 'referee_console'
    | 'athlete_portal'
    | 'public_spectator'
    | 'system_admin'

/** Scope that a workspace operates within */
export interface WorkspaceScope {
    type: 'system' | 'federation' | 'tournament' | 'club' | 'user' | 'public'
    id: string
    name: string
}

/** A workspace card shown on the Portal Hub */
export interface WorkspaceCard {
    id: string
    type: WorkspaceType
    scope: WorkspaceScope
    label: string
    description: string
    icon: string
    color: string
    gradient: string
    badge?: string
    stats?: { label: string; value: string | number }[]
    lastAccessed?: string
}

/** Active workspace context */
export interface ActiveWorkspace {
    type: WorkspaceType
    scope: WorkspaceScope
    label: string
    icon: string
    color: string
}

/** Sidebar item within a workspace */
export interface WorkspaceSidebarItem {
    id: string
    path: string
    label: string
    icon: string
    badge?: string | number
}

/** Sidebar group within a workspace */
export interface WorkspaceSidebarGroup {
    id: string
    label: string
    items: WorkspaceSidebarItem[]
}

/** Full sidebar config for a workspace type */
export interface WorkspaceSidebarConfig {
    type: WorkspaceType
    groups: WorkspaceSidebarGroup[]
}

// ── Workspace Metadata ──
export const WORKSPACE_META: Record<WorkspaceType, {
    label: string; icon: string; color: string; gradient: string; description: string
}> = {
    federation_admin: {
        label: 'Liên đoàn',
        icon: 'Building',
        color: '#8b5cf6',
        gradient: 'from-[#8b5cf6] to-[#6d28d9]',
        description: 'Quản trị tổ chức, CLB, BXH quốc gia, Di sản',
    },
    federation_provincial: {
        label: 'LĐ Tỉnh/TP',
        icon: 'MapPin',
        color: '#7c3aed',
        gradient: 'from-[#7c3aed] to-[#5b21b6]',
        description: 'Quản trị CLB, VĐV, giải đấu cấp tỉnh',
    },
    federation_discipline: {
        label: 'Kỷ luật & Thanh tra',
        icon: 'ShieldAlert',
        color: '#dc2626',
        gradient: 'from-[#dc2626] to-[#991b1b]',
        description: 'Kỷ luật, thanh tra, xử lý vi phạm',
    },
    tournament_ops: {
        label: 'Giải đấu',
        icon: 'Trophy',
        color: '#ef4444',
        gradient: 'from-[#ef4444] to-[#dc2626]',
        description: 'Điều hành giải từ chuẩn bị đến kết quả',
    },
    club_management: {
        label: 'CLB / Võ đường',
        icon: 'Home',
        color: '#f59e0b',
        gradient: 'from-[#f59e0b] to-[#d97706]',
        description: 'Võ sinh, đào tạo, điểm danh, tài chính',
    },
    referee_console: {
        label: 'Trọng tài',
        icon: 'Scale',
        color: '#0ea5e9',
        gradient: 'from-[#0ea5e9] to-[#0284c7]',
        description: 'Chấm điểm, VAR, lịch điều hành',
    },
    athlete_portal: {
        label: 'Vận động viên',
        icon: 'User',
        color: '#10b981',
        gradient: 'from-[#10b981] to-[#059669]',
        description: 'Hồ sơ, thành tích, đăng ký giải',
    },
    public_spectator: {
        label: 'Xem trực tiếp',
        icon: 'Monitor',
        color: '#ec4899',
        gradient: 'from-[#ec4899] to-[#db2777]',
        description: 'Live score, BXH, tin tức cộng đồng',
    },
    system_admin: {
        label: 'Quản trị hệ thống',
        icon: 'Settings',
        color: '#64748b',
        gradient: 'from-[#64748b] to-[#475569]',
        description: 'Users, Roles, Feature Flags, Audit',
    },
}
