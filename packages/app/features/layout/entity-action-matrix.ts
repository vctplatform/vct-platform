'use client'

import type { UserRole } from '../auth/types'
import {
  ENTITY_AUTHZ_POLICY,
  type EntityAuthzAction,
} from '../auth/entity-authz.generated'

const ROUTE_ENTITY_MAP: Record<string, string> = {
  '/teams': 'teams',
  '/athletes': 'athletes',
  '/registration': 'registration',
  '/schedule': 'schedule',
  '/results': 'results',
  '/medals': 'medals',
  '/bracket': 'brackets',
  '/san-dau': 'arenas',
  '/referees': 'referees',
  '/appeals': 'appeals',
  '/weigh-in': 'weigh-ins',
  '/combat': 'combat-matches',
  '/forms': 'form-performances',
  '/noi-dung': 'content-categories',
  '/referee-assignments': 'referee-assignments',
  '/giai-dau': 'tournament-config',
}

const normalizePath = (path: string) => {
  const trimmed = path.trim()
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1)
  return trimmed
}

export const resolveEntityByRoutePath = (routePath: string) =>
  ROUTE_ENTITY_MAP[normalizePath(routePath)]

export const canPerformEntityRouteAction = (
  routePath: string,
  role: UserRole,
  action: EntityAuthzAction
) => {
  const entity = resolveEntityByRoutePath(routePath)
  if (!entity) return true

  const rolePolicy = ENTITY_AUTHZ_POLICY[
    role
  ] as Record<string, readonly EntityAuthzAction[]>
  if (!rolePolicy) return false

  if (rolePolicy['*']?.includes(action)) return true
  return Boolean(rolePolicy[entity]?.includes(action))
}
