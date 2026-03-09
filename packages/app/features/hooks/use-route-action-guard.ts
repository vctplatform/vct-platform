'use client'
import { useCallback } from 'react'
import type { UserRole } from '../auth/types'
import { useAuth } from '../auth/AuthProvider'
import {
  isEntityAuthzAction,
} from '../auth/entity-authz.generated'
import { canPerformEntityRouteAction } from '../layout/entity-action-matrix'
import { canPerformRouteAction, type RouteAction } from '../layout/route-registry'

const ACTION_LABELS: Record<RouteAction, string> = {
  view: 'xem dữ liệu',
  create: 'tạo mới',
  update: 'cập nhật',
  delete: 'xóa',
  approve: 'duyệt',
  publish: 'công bố',
  assign: 'phân công',
  import: 'import dữ liệu',
  export: 'xuất dữ liệu',
  monitor: 'giám sát',
  manage: 'quản trị',
  lock: 'khóa thao tác',
}

interface RouteActionGuardOptions {
  roleOverride?: UserRole
  notifyDenied?: (message: string) => void
}

export const useRouteActionGuard = (
  routePath: string,
  options: RouteActionGuardOptions = {}
) => {
  const { currentUser } = useAuth()
  const role = options.roleOverride ?? currentUser.role
  const notifyDenied = options.notifyDenied

  const can = useCallback(
    (action: RouteAction) => {
      if (!canPerformRouteAction(routePath, role, action)) return false
      if (!isEntityAuthzAction(action)) return true
      return canPerformEntityRouteAction(routePath, role, action)
    },
    [routePath, role]
  )

  const requireAction = useCallback(
    (action: RouteAction, actionLabel?: string) => {
      if (can(action)) return true
      if (notifyDenied) {
        notifyDenied(
          `Vai trò hiện tại không có quyền ${
            actionLabel ?? ACTION_LABELS[action] ?? action
          }`
        )
      }
      return false
    },
    [can, notifyDenied]
  )

  return {
    role,
    can,
    requireAction,
  }
}
