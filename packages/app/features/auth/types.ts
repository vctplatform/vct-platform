export type UserRole =
  | 'admin'
  | 'btc'
  | 'referee_manager'
  | 'referee'
  | 'delegate'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Quản trị hệ thống' },
  { value: 'btc', label: 'Ban tổ chức' },
  { value: 'referee_manager', label: 'Điều phối trọng tài' },
  { value: 'referee', label: 'Trọng tài' },
  { value: 'delegate', label: 'Cán bộ đoàn' },
]

