import type { EntityAuthzRole } from './entity-authz.generated'
import type { WorkspaceType } from '../layout/workspace-types'

export type UserRole = EntityAuthzRole

/** Scope type for contextual role assignments */
export type RoleScopeType = 'SYSTEM' | 'TENANT' | 'FEDERATION' | 'TOURNAMENT' | 'CLUB' | 'SELF'

/** A single role assignment with scope context */
export interface UserRoleAssignment {
  roleId: string
  roleName: string
  roleCode: string
  scopeType: RoleScopeType
  scopeId?: string
  scopeName?: string
  grantedAt: string
  expiresAt?: string
}

/** A workspace the user has access to */
export interface WorkspaceAccess {
  type: WorkspaceType
  scopeId: string
  scopeName: string
  role: string
}

/**
 * UUID-Centric auth user.
 * `role` is kept as backwards-compatible alias for primaryRole.
 * Use `roles[]` for multi-role and `permissions[]` for O(1) permission
 * checks via the usePermission hook.
 */
export interface AuthUser {
  id: string
  name: string
  username?: string
  email?: string
  avatarUrl?: string
  tenantId?: string
  locale?: string
  timezone?: string
  /** Backwards-compatible single role (= primaryRole). */
  role: UserRole
  /** All role assignments with scopes. */
  roles: UserRoleAssignment[]
  /** Flattened permission strings, e.g. ["tournament.create","athlete.read"]. */
  permissions: string[]
  /** Workspaces this UUID can access. */
  workspaces: WorkspaceAccess[]
  /** Arbitrary profile metadata from backend. */
  metadata?: Record<string, unknown>
}

/** Simplified login — server determines role from credentials */
export interface LoginInput {
  username: string
  password: string
  rememberMe?: boolean
  role?: UserRole
  tournamentCode?: string
  operationShift?: 'sang' | 'chieu' | 'toi'
}

/** Context selection after login — on Portal Hub / workspace entry */
export interface WorkspaceContextInput {
  tournamentCode?: string
  operationShift?: 'sang' | 'chieu' | 'toi'
}

export interface AuthSession {
  token: string
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  user: AuthUser
  tournamentCode?: string
  operationShift?: 'sang' | 'chieu' | 'toi'
  expiresAt: string
  refreshExpiresAt: string
}

export interface RevokeInput {
  refreshToken?: string
  accessToken?: string
  revokeAll?: boolean
  reason?: string
}

export interface AuthAuditEntry {
  id: string
  time: string
  userId: string
  username: string
  role: UserRole
  action: string
  success: boolean
  ip: string
  userAgent: string
  details?: Record<string, unknown>
}

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string; tier: 'federation' | 'tournament' | 'club' | 'individual' }> = [
  { value: 'admin', label: 'Quản trị hệ thống', tier: 'federation' },
  { value: 'federation_president', label: 'Chủ tịch Liên đoàn', tier: 'federation' },
  { value: 'vice_president', label: 'Phó chủ tịch', tier: 'federation' },
  { value: 'federation_secretary', label: 'Tổng thư ký', tier: 'federation' },
  { value: 'provincial_admin', label: 'Quản trị địa phương', tier: 'federation' },
  { value: 'technical_director', label: 'Giám đốc kỹ thuật', tier: 'federation' },
  { value: 'discipline_board', label: 'Hội đồng kỷ luật', tier: 'federation' },
  { value: 'inspector', label: 'Thanh tra', tier: 'federation' },
  { value: 'pr_manager', label: 'Truyền thông', tier: 'federation' },
  { value: 'international_liaison', label: 'Đối ngoại quốc tế', tier: 'federation' },
  { value: 'btc', label: 'Ban tổ chức', tier: 'tournament' },
  { value: 'referee_manager', label: 'Điều phối trọng tài', tier: 'tournament' },
  { value: 'referee', label: 'Trọng tài', tier: 'tournament' },
  { value: 'coach', label: 'Huấn luyện viên', tier: 'club' },
  { value: 'delegate', label: 'Cán bộ đoàn', tier: 'individual' },
  { value: 'athlete', label: 'Vận động viên', tier: 'individual' },
  { value: 'medical_staff', label: 'Nhân viên y tế', tier: 'tournament' },
]
