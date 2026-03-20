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
    SYSTEM_ADMIN: 'red',
    FEDERATION_ADMIN: 'violet',
    CLUB_MANAGER: 'sky',
    REFEREE: 'amber',
    COACH: 'emerald',
    ATHLETE: 'cyan',
    VIEWER: 'slate',
}

export const STATUS_MAP: Record<SystemUser['status'], { label: string; type: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    active: { label: 'Hoạt động', type: 'success' },
    inactive: { label: 'Vô hiệu', type: 'neutral' },
    locked: { label: 'Bị khóa', type: 'danger' },
}




const ROLE_LABEL_MAP = ROLE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {})

export const getRoleLabel = (role: string) => ROLE_LABEL_MAP[role] ?? role
