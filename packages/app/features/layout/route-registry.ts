// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Route Registry Barrel
// Re-exports from split modules for backward compatibility.
// New code should import from the specific modules directly.
// ════════════════════════════════════════════════════════════════

// Types
export type {
  RouteGroupId,
  RouteId,
  RouteAction,
  RouteItem,
  RouteGroup,
  BreadcrumbItem,
  RouteCapability,
  RoleRouteCapabilities,
  RoutePermissionMatrixEntry,
} from './route-types'

// Data
export { ROUTE_GROUPS, ROUTES } from './routes'

// RBAC
export { ROUTE_ROLE_CAPABILITIES } from './rbac-matrix'

// Utilities
export {
  ROUTE_REGISTRY,
  getRouteByPath,
  isRouteAccessible,
  canPerformRouteAction,
  getDefaultRouteForRole,
  getPageTitle,
  getBreadcrumbs,
  getSidebarGroups,
  getRolePermissionMatrix,
  getAdminBtcPermissionMatrix,
} from './route-utils'
