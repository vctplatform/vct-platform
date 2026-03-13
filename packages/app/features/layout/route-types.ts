// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Route Type Definitions
// ════════════════════════════════════════════════════════════════

import type { UserRole } from '../auth/types'

export type RouteGroupId =
    | 'trung_tam_dieu_hanh'
    | 'quan_tri_to_chuc'
    | 'quan_ly_huan_luyen'
    | 'bang_vi_di_san'
    | 'tai_chinh'
    | 'chuan_bi_giai'
    | 'dang_ky_kiem_tra'
    | 'dieu_hanh_thi_dau'
    | 'ket_qua_tong_hop'
    | 'cong_dong'
    | 'cap_quoc_gia'
    | 'cap_tinh'
    | 'cau_lac_bo'
    | 'he_thong'

export type RouteId =
    | 'command-center'
    | 'organizations'
    | 'clubs'
    | 'curriculum'
    | 'techniques'
    | 'training-plans'
    | 'attendance'
    | 'belt-exams'
    | 'elearning'
    | 'rankings'
    | 'heritage'
    | 'finance'
    | 'tournament-config'
    | 'tournament-wizard'
    | 'content-categories'
    | 'arenas'
    | 'referees'
    | 'teams'
    | 'athletes'
    | 'registration'
    | 'technical-meeting'
    | 'draw'
    | 'weigh-in'
    | 'schedule'
    | 'referee-assignments'
    | 'combat'
    | 'forms'
    | 'bracket'
    | 'results'
    | 'medals'
    | 'appeals'
    | 'pending-approvals'
    | 'reports'
    | 'community'
    | 'admin-dashboard'
    | 'admin-tenants'
    | 'audit-logs'
    | 'people'
    | 'user-detail'
    | 'provincial-dashboard'
    | 'provincial-associations'
    | 'provincial-sub-associations'
    | 'provincial-clubs'
    | 'provincial-athletes'
    | 'provincial-coaches'
    | 'provincial-referees'
    | 'provincial-personnel'
    | 'provincial-tournaments'
    | 'provincial-certifications'
    | 'provincial-discipline'
    | 'provincial-documents'
    | 'provincial-finance'
    | 'provincial-reports'
    | 'provincial-vo-sinh'
    | 'club-dashboard'
    | 'club-members'
    | 'club-classes'
    | 'club-training'
    | 'club-tournaments'
    | 'club-finance'
    | 'club-attendance'
    | 'club-equipment'
    | 'club-facilities'
    | 'club-certifications'
    | 'club-settings'
    | 'federation-dashboard'
    | 'federation-provinces'
    | 'federation-org-chart'
    | 'federation-regulations'
    | 'federation-master-data'
    | 'federation-organizations'
    | 'federation-approvals'
    | 'federation-certifications'
    | 'federation-discipline'
    | 'federation-documents'
    | 'federation-personnel'
    | 'federation-finance'
    | 'federation-pr'
    | 'federation-international'
    | 'federation-workflow-config'
    | 'parent-dashboard'
    | 'athlete-portal'
    | 'athlete-management'
    | 'athlete-tournaments'

export type RouteAction =
    | 'view'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'publish'
    | 'assign'
    | 'import'
    | 'export'
    | 'monitor'
    | 'manage'
    | 'lock'

export interface RouteItem {
    id: RouteId
    path: string
    title: string
    label: string
    icon: string
    group: RouteGroupId
    showInSidebar?: boolean
    roles?: UserRole[]
}

export interface RouteGroup {
    id: RouteGroupId
    label: string
}

export interface BreadcrumbItem {
    label: string
    href?: string
}

export interface RouteCapability {
    actions: RouteAction[]
    note: string
}

export type RoleRouteCapabilities = Partial<Record<RouteId, RouteCapability>>

export interface RoutePermissionMatrixEntry {
    routeId: RouteId
    path: string
    label: string
    group: RouteGroupId
    actions: RouteAction[]
    note: string
}
