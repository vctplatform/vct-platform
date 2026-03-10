'use client'
import { useCallback, useMemo } from 'react'
import { useAuth } from './AuthProvider'

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — UUID-Centric Permission Hook
// O(1) permission checking using flattened permission Set.
// ════════════════════════════════════════════════════════════════

/**
 * Hook for O(1) permission checking against the current user's UUID permissions.
 *
 * @example
 * ```tsx
 * const { can, canAny, canAll } = usePermission()
 *
 * // Single check
 * if (can('tournament', 'create')) { ... }
 *
 * // Any of multiple
 * if (canAny([['athlete', 'read'], ['athlete', 'update']])) { ... }
 *
 * // All required
 * if (canAll([['tournament', 'create'], ['tournament', 'update']])) { ... }
 * ```
 */
export function usePermission() {
    const { currentUser } = useAuth()

    // Build O(1) Set once when permissions change
    const permissionSet = useMemo(() => {
        const set = new Set<string>()
        if (currentUser.permissions) {
            for (const p of currentUser.permissions) set.add(p)
        }
        return set
    }, [currentUser.permissions])

    const isAdmin = currentUser.role === 'admin'

    /** Check if user has a specific permission. O(1) lookup. */
    const can = useCallback(
        (resource: string, action: string): boolean => {
            if (isAdmin) return true
            return (
                permissionSet.has('*') ||
                permissionSet.has(`${resource}.*`) ||
                permissionSet.has(`${resource}.${action}`)
            )
        },
        [isAdmin, permissionSet]
    )

    /** Check if user has ANY of the given permissions. */
    const canAny = useCallback(
        (checks: Array<[resource: string, action: string]>): boolean =>
            checks.some(([r, a]) => can(r, a)),
        [can]
    )

    /** Check if user has ALL of the given permissions. */
    const canAll = useCallback(
        (checks: Array<[resource: string, action: string]>): boolean =>
            checks.every(([r, a]) => can(r, a)),
        [can]
    )

    /** Get all permissions as Set (for advanced checks). */
    const getPermissionSet = useCallback(() => permissionSet, [permissionSet])

    return {
        can,
        canAny,
        canAll,
        isAdmin,
        permissionSet,
        getPermissionSet,
        currentUser,
    }
}

export type PermissionCheck = ReturnType<typeof usePermission>
