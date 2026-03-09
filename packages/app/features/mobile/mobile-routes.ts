import type { UserRole } from '../auth/types'
import { ROUTE_GROUPS } from '../layout/routes'
import { ROUTE_REGISTRY, isRouteAccessible } from '../layout/route-registry'
import type { RouteGroupId, RouteId } from '../layout/route-types'

export type MobileRouteKey = string

export interface MobileRouteItem {
  key: MobileRouteKey
  routeId: RouteId
  groupId: RouteGroupId
  title: string
  subtitle: string
  webPath: string
  nativePath: string
}

const GROUP_LABEL_BY_ID = new Map(
  ROUTE_GROUPS.map((group) => [group.id, group.label] as const)
)

const toMobileKey = (path: string) => {
  const normalized = path
    .replace(/^\//, '')
    .replace(/\/+$/, '')
    .replace(/\//g, '-')
    .replace(/\[|\]/g, '')

  return normalized || 'home'
}

const toNativePath = (path: string) => path.replace(/^\//, '').replace(/\/+$/, '')

const isMobileRoute = (path: string, showInSidebar = false) =>
  showInSidebar && path !== '/' && !path.includes('[')

export const MOBILE_ROUTE_REGISTRY: MobileRouteItem[] = ROUTE_REGISTRY.filter(
  (route) => isMobileRoute(route.path, route.showInSidebar)
).map((route) => ({
  key: toMobileKey(route.path),
  routeId: route.id,
  groupId: route.group,
  title: route.label,
  subtitle: GROUP_LABEL_BY_ID.get(route.group) ?? 'Nghiệp vụ giải đấu',
  webPath: route.path,
  nativePath: toNativePath(route.path),
}))

const MOBILE_ROUTE_BY_KEY = new Map(
  MOBILE_ROUTE_REGISTRY.map((route) => [route.key, route] as const)
)

export const canAccessMobileRoute = (key: MobileRouteKey, role: UserRole) => {
  const route = MOBILE_ROUTE_BY_KEY.get(key)
  if (!route) return false
  return isRouteAccessible(route.webPath, role)
}

export const getAccessibleMobileRoutes = (role: UserRole) =>
  MOBILE_ROUTE_REGISTRY.filter((route) => isRouteAccessible(route.webPath, role))

export const getMobileRouteByKey = (key: MobileRouteKey) =>
  MOBILE_ROUTE_BY_KEY.get(key)
