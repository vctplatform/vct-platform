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

export const ROLE_OPTIONS = [
    { value: 'SYSTEM_ADMIN', label: 'Quản trị viên' },
    { value: 'FEDERATION_ADMIN', label: 'Quản lý Liên đoàn' },
    { value: 'CLUB_MANAGER', label: 'Chủ nhiệm CLB' },
    { value: 'REFEREE', label: 'Trọng tài' },
    { value: 'COACH', label: 'Huấn luyện viên' },
    { value: 'ATHLETE', label: 'Vận động viên' },
    { value: 'VIEWER', label: 'Người xem' },
]

export const ROLE_COLORS: Record<string, string> = {
    SYSTEM_ADMIN: '#ef4444',
    FEDERATION_ADMIN: '#8b5cf6',
    CLUB_MANAGER: '#0ea5e9',
    REFEREE: '#f59e0b',
    COACH: '#10b981',
    ATHLETE: '#06b6d4',
    VIEWER: '#94a3b8',
}

export const STATUS_MAP: Record<SystemUser['status'], { label: string; type: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    active: { label: 'Hoạt động', type: 'success' },
    inactive: { label: 'Vô hiệu', type: 'neutral' },
    locked: { label: 'Bị khóa', type: 'danger' },
}

export const MOCK_USERS: SystemUser[] = [
    { id: 'USR-001', name: 'Nguyễn Văn Admin', email: 'admin@vct.vn', phone: '0901234567', role: 'SYSTEM_ADMIN', scope: 'Toàn hệ thống', status: 'active', last_login: '10/03/2024 08:30', created_at: '01/01/2024', avatar_letter: 'A' },
    { id: 'USR-002', name: 'Trần Thị Liên', email: 'lien@ldvt-hcm.vn', phone: '0912345678', role: 'FEDERATION_ADMIN', scope: 'LĐ Võ thuật TP.HCM', status: 'active', last_login: '09/03/2024 14:25', created_at: '15/01/2024', avatar_letter: 'L' },
    { id: 'USR-003', name: 'Lê Minh Đức', email: 'duc@clb-sonlong.vn', phone: '0923456789', role: 'CLUB_MANAGER', scope: 'CLB Sơn Long Quyền', status: 'active', last_login: '09/03/2024 20:10', created_at: '20/02/2024', avatar_letter: 'Đ' },
    { id: 'USR-004', name: 'Phạm Hồng Hà', email: 'ha@vct.vn', phone: '0934567890', role: 'REFEREE', scope: 'Giải QG 2024', status: 'active', last_login: '08/03/2024 09:00', created_at: '01/03/2024', avatar_letter: 'H' },
    { id: 'USR-005', name: 'Võ Thanh Tùng', email: 'tung@vct.vn', phone: '0945678901', role: 'COACH', scope: 'CLB Long An', status: 'inactive', last_login: '01/02/2024 11:45', created_at: '10/01/2024', avatar_letter: 'T' },
    { id: 'USR-006', name: 'Đặng Mai Phương', email: 'phuong@vct.vn', phone: '0956789012', role: 'ATHLETE', scope: 'CLB Q.12', status: 'locked', last_login: '—', created_at: '05/03/2024', avatar_letter: 'P' },
    { id: 'USR-007', name: 'Bùi Ngọc Sơn', email: 'son@vct.vn', phone: '0967890123', role: 'VIEWER', scope: '—', status: 'active', last_login: '10/03/2024 00:12', created_at: '08/03/2024', avatar_letter: 'S' },
]

const ROLE_LABEL_MAP = ROLE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {})

export const getRoleLabel = (role: string) => ROLE_LABEL_MAP[role] ?? role
