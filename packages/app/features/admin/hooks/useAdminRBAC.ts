'use client'

import { useMemo, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'

// ════════════════════════════════════════
// Permission definitions
// ════════════════════════════════════════
export const ADMIN_PERMISSIONS = {
    // System
    'system.config.read': 'Xem cấu hình hệ thống',
    'system.config.write': 'Sửa cấu hình hệ thống',
    'system.backup.create': 'Tạo backup',
    'system.cache.clear': 'Xóa cache',
    // Users
    'users.read': 'Xem danh sách người dùng',
    'users.write': 'Tạo/sửa người dùng',
    'users.delete': 'Xóa người dùng',
    'users.role.assign': 'Phân quyền người dùng',
    // Tenants
    'tenants.read': 'Xem tổ chức',
    'tenants.write': 'Tạo/sửa tổ chức',
    'tenants.approve': 'Phê duyệt tổ chức',
    'tenants.suspend': 'Tạm ngưng tổ chức',
    // Subscriptions
    'subscriptions.read': 'Xem đăng ký',
    'subscriptions.write': 'Quản lý đăng ký',
    'subscriptions.billing': 'Quản lý thanh toán',
    // Content
    'cms.read': 'Xem nội dung CMS',
    'cms.write': 'Tạo/sửa nội dung',
    'cms.publish': 'Xuất bản nội dung',
    // Feature Flags
    'flags.read': 'Xem feature flags',
    'flags.write': 'Bật/tắt feature flags',
    // Roles
    'roles.read': 'Xem vai trò',
    'roles.write': 'Tạo/sửa vai trò',
    'roles.permissions': 'Quản lý quyền hạn',
    // Finance
    'finance.read': 'Xem tài chính',
    'finance.write': 'Quản lý tài chính',
    // Tournaments
    'tournaments.read': 'Xem giải đấu',
    'tournaments.write': 'Quản lý giải đấu',
    // Audit
    'audit.read': 'Xem audit log',
    'audit.export': 'Xuất audit log',
} as const

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS

// Role → permissions mapping (keys are real auth UserRole values)
const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
    admin: Object.keys(ADMIN_PERMISSIONS) as AdminPermission[],
    system_admin: Object.keys(ADMIN_PERMISSIONS) as AdminPermission[],
    federation_president: [
        'users.read', 'users.write', 'users.role.assign',
        'tenants.read', 'tenants.write', 'tenants.approve',
        'subscriptions.read', 'subscriptions.write',
        'cms.read', 'cms.write', 'cms.publish',
        'flags.read', 'flags.write',
        'roles.read',
        'finance.read',
        'tournaments.read', 'tournaments.write',
        'audit.read',
    ],
    federation_secretary: [
        'users.read', 'users.write',
        'tenants.read', 'tenants.write',
        'cms.read', 'cms.write',
        'tournaments.read', 'tournaments.write',
        'audit.read',
    ],
    provincial_admin: [
        'users.read', 'tenants.read',
        'cms.read', 'cms.write',
        'flags.read',
        'tournaments.read', 'tournaments.write',
        'audit.read',
    ],
    viewer: [
        'users.read', 'tenants.read',
        'cms.read', 'flags.read',
        'finance.read', 'tournaments.read',
    ],
}

// ════════════════════════════════════════
// Hook
// ════════════════════════════════════════
export function useAdminRBAC() {
    const { currentUser, isAuthenticated } = useAuth()

    const userPermissions = useMemo<AdminPermission[]>(() => {
        if (!currentUser?.role) return []
        // Merge role-based + explicit permissions
        const rolePerms = ROLE_PERMISSIONS[currentUser.role] ?? []
        const explicitPerms = (currentUser.permissions ?? []) as AdminPermission[]
        return Array.from(new Set([...rolePerms, ...explicitPerms]))
    }, [currentUser?.role, currentUser?.permissions])

    /** Check if the user has a specific permission */
    const can = useCallback(
        (permission: AdminPermission): boolean => userPermissions.includes(permission),
        [userPermissions]
    )

    /** Check if the user has ALL of the given permissions */
    const canAll = useCallback(
        (...permissions: AdminPermission[]): boolean => permissions.every(p => userPermissions.includes(p)),
        [userPermissions]
    )

    /** Check if the user has ANY of the given permissions */
    const canAny = useCallback(
        (...permissions: AdminPermission[]): boolean => permissions.some(p => userPermissions.includes(p)),
        [userPermissions]
    )

    /** Check if user is admin or system_admin */
    /** Check if user is admin or system_admin */
    const isSuperAdmin = String(currentUser?.role) === 'admin' || String(currentUser?.role) === 'system_admin'

    return {
        can,
        canAll,
        canAny,
        isSuperAdmin,
        isAuthenticated,
        userPermissions,
        role: currentUser?.role ?? null,
    }
}
