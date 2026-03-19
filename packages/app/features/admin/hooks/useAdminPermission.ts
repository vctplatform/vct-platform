import { useCallback, useMemo } from 'react'
import { useAuth } from '../../auth/AuthProvider'

// ════════════════════════════════════════
// useAdminPermission — Role-based UI visibility
// ════════════════════════════════════════

type AdminRole = 'admin' | 'federation_president' | 'federation_secretary' | 'provincial_admin' | 'technical_director' | 'btc' | 'referee_manager'

/** Permission definitions mapping action to allowed roles */
const PERMISSION_MAP: Record<string, AdminRole[]> = {
    // System-level
    'system.config.edit': ['admin'],
    'system.backup': ['admin'],
    'system.cache.clear': ['admin'],
    // User management
    'users.create': ['admin', 'federation_president'],
    'users.edit': ['admin', 'federation_president'],
    'users.delete': ['admin'],
    'users.role.assign': ['admin'],
    // Feature flags
    'feature_flags.toggle': ['admin'],
    'feature_flags.rollout': ['admin'],
    // Support
    'support.assign': ['admin', 'federation_president'],
    'support.resolve': ['admin', 'federation_president'],
    'support.delete': ['admin'],
    'support.create': ['admin', 'federation_president', 'btc'],
    // Reference data
    'reference_data.create': ['admin'],
    'reference_data.edit': ['admin'],
    'reference_data.delete': ['admin'],
    // Tournaments
    'tournaments.create': ['admin', 'federation_president'],
    'tournaments.edit': ['admin', 'federation_president'],
    'tournaments.approve': ['admin', 'federation_president'],
    'tournaments.delete': ['admin'],
    // Finance
    'finance.approve': ['admin', 'federation_president'],
    'finance.export': ['admin', 'federation_president', 'btc'],
}

/**
 * Hook for checking admin permissions based on user role.
 * Reads role from real AuthContext.
 */
export function useAdminPermission() {
    const { currentUser } = useAuth()
    const currentRole = (currentUser?.role ?? 'athlete') as AdminRole

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
