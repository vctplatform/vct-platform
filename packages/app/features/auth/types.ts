import type { EntityAuthzRole } from './entity-authz.generated'

export type UserRole = EntityAuthzRole

export interface AuthUser {
  id: string
  name: string
  username?: string
  role: UserRole
}

export interface LoginInput {
  username: string
  password: string
  role: UserRole
  tournamentCode: string
  operationShift: 'sang' | 'chieu' | 'toi'
}

export interface AuthSession {
  token: string
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  user: AuthUser
  tournamentCode: string
  operationShift: 'sang' | 'chieu' | 'toi'
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

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Quản trị hệ thống' },
  { value: 'btc', label: 'Ban tổ chức' },
  { value: 'referee_manager', label: 'Điều phối trọng tài' },
  { value: 'referee', label: 'Trọng tài' },
  { value: 'delegate', label: 'Cán bộ đoàn' },
]
