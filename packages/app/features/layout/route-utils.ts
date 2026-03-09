// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Route Utility Functions
// ════════════════════════════════════════════════════════════════

import type { UserRole } from '../auth/types'
import type { BreadcrumbItem, RouteAction, RouteCapability, RouteId, RouteItem, RoutePermissionMatrixEntry } from './route-types'
import { ENTITY_AUTHZ_ROLES } from '../auth/entity-authz.generated'
import { ROUTE_ROLE_CAPABILITIES } from './rbac-matrix'
import { ROUTE_GROUPS, ROUTES } from './routes'

// ── Internal Helpers ─────────────────────────────────────────

const USER_ROLES: UserRole[] = [...ENTITY_AUTHZ_ROLES]

const hasAction = (
    capabilityValue: RouteCapability | undefined,
    action: RouteAction
) => Boolean(capabilityValue?.actions.includes(action))

const normalizePath = (path: string) => {
    const trimmed = path.trim()
    if (trimmed.length > 1 && trimmed.endsWith('/')) {
        return trimmed.slice(0, -1)
    }
    return trimmed
}

const resolveRouteCapability = (routeId: RouteId, role: UserRole) =>
    ROUTE_ROLE_CAPABILITIES[role]?.[routeId]

const resolveRolesForRoute = (routeId: RouteId) =>
    USER_ROLES.filter((role) =>
        hasAction(resolveRouteCapability(routeId, role), 'view')
    )

// ── Computed Registry ────────────────────────────────────────

export const ROUTE_REGISTRY: RouteItem[] = ROUTES.map((route) => ({
    ...route,
    roles: resolveRolesForRoute(route.id),
}))

// ── Public API ───────────────────────────────────────────────

export const getRouteByPath = (path: string) => {
    if (!path) return undefined
    const normalizedPath = normalizePath(path)
    if (normalizedPath.startsWith('/users/')) {
        return ROUTE_REGISTRY.find((route) => route.id === 'user-detail')
    }
    return ROUTE_REGISTRY.find((route) => route.path === normalizedPath)
}

export const isRouteAccessible = (path: string, role: UserRole) => {
    const route = getRouteByPath(path)
    if (!route) return true
    return hasAction(resolveRouteCapability(route.id, role), 'view')
}

export const canPerformRouteAction = (
    routeOrPath: RouteId | string,
    role: UserRole,
    action: RouteAction
) => {
    const route =
        ROUTE_REGISTRY.find((item) => item.id === routeOrPath) ??
        getRouteByPath(routeOrPath)
    if (!route) return false
    return hasAction(resolveRouteCapability(route.id, role), action)
}

export const getDefaultRouteForRole = (role: UserRole) =>
    ROUTE_REGISTRY.find(
        (route) => route.showInSidebar && isRouteAccessible(route.path, role)
    )?.path ?? '/'

export const getPageTitle = (path: string) =>
    getRouteByPath(path)?.title ?? 'VCT PLATFORM'

export const getBreadcrumbs = (path: string) => {
    const root: BreadcrumbItem = { label: 'VCT PLATFORM', href: '/' }
    const route = getRouteByPath(path)
    if (!route) return [root]
    if (route.path === '/') return [{ label: 'VCT PLATFORM' }]
    const group = ROUTE_GROUPS.find((item) => item.id === route.group)
    if (!group || group.label === route.label) {
        return [root, { label: route.label }]
    }
    return [root, { label: group.label }, { label: route.label }]
}

export const getSidebarGroups = (role: UserRole = 'admin') =>
    ROUTE_GROUPS.map((group) => ({
        ...group,
        items: ROUTE_REGISTRY.filter(
            (route) =>
                route.group === group.id &&
                route.showInSidebar &&
                isRouteAccessible(route.path, role)
        ),
    })).filter((group) => group.items.length > 0)

export const getRolePermissionMatrix = (
    role: UserRole
): RoutePermissionMatrixEntry[] =>
    ROUTE_REGISTRY.flatMap((route) => {
        const capabilityValue = resolveRouteCapability(route.id, role)
        if (!capabilityValue) return []
        return [
            {
                routeId: route.id,
                path: route.path,
                label: route.label,
                group: route.group,
                actions: capabilityValue.actions,
                note: capabilityValue.note,
            },
        ]
    })

export const getAdminBtcPermissionMatrix = () => ({
    admin: getRolePermissionMatrix('admin'),
    btc: getRolePermissionMatrix('btc'),
})
