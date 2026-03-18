import { useCallback, useMemo } from 'react'

// ════════════════════════════════════════
// useAdminPermission — Role-based UI visibility
// ════════════════════════════════════════

type AdminRole = 'SYSTEM_ADMIN' | 'FEDERATION_ADMIN' | 'CLUB_ADMIN' | 'JUDGE' | 'VIEWER'

/** Permission definitions mapping action to allowed roles */
const PERMISSION_MAP: Record<string, AdminRole[]> = {
    // System-level
    'system.config.edit': ['SYSTEM_ADMIN'],
    'system.backup': ['SYSTEM_ADMIN'],
    'system.cache.clear': ['SYSTEM_ADMIN'],
    // User management
    'users.create': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'users.edit': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'users.delete': ['SYSTEM_ADMIN'],
    'users.role.assign': ['SYSTEM_ADMIN'],
    // Feature flags
    'feature_flags.toggle': ['SYSTEM_ADMIN'],
    'feature_flags.rollout': ['SYSTEM_ADMIN'],
    // Support
    'support.assign': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'support.resolve': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'support.delete': ['SYSTEM_ADMIN'],
    'support.create': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN', 'CLUB_ADMIN'],
    // Reference data
    'reference_data.create': ['SYSTEM_ADMIN'],
    'reference_data.edit': ['SYSTEM_ADMIN'],
    'reference_data.delete': ['SYSTEM_ADMIN'],
    // Tournaments
    'tournaments.create': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'tournaments.edit': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'tournaments.approve': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'tournaments.delete': ['SYSTEM_ADMIN'],
    // Finance
    'finance.approve': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN'],
    'finance.export': ['SYSTEM_ADMIN', 'FEDERATION_ADMIN', 'CLUB_ADMIN'],
}

/**
 * Hook for checking admin permissions based on user role.
 * Simulates SYSTEM_ADMIN role by default.
 *
 * @example
 * ```tsx
 * const { can, canAny } = useAdminPermission()
 *
 * {can('users.delete') && <DeleteButton />}
 * {canAny(['support.assign', 'support.resolve']) && <ActionPanel />}
 * ```
 */
export function useAdminPermission() {
    // In production: get from auth context
    const currentRole: AdminRole = 'SYSTEM_ADMIN'

    const can = useCallback((permission: string): boolean => {
        const allowedRoles = PERMISSION_MAP[permission]
        if (!allowedRoles) return false
        return allowedRoles.includes(currentRole)
    }, [currentRole])

    const canAny = useCallback((permissions: string[]): boolean => {
        return permissions.some(p => {
            const allowedRoles = PERMISSION_MAP[p]
            return allowedRoles?.includes(currentRole) ?? false
        })
    }, [currentRole])

    const canAll = useCallback((permissions: string[]): boolean => {
        return permissions.every(p => {
            const allowedRoles = PERMISSION_MAP[p]
            return allowedRoles?.includes(currentRole) ?? false
        })
    }, [currentRole])

    const role = useMemo(() => currentRole, [currentRole])

    return { can, canAny, canAll, role }
}
