'use client'
import * as React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ENTITY_AUTHZ_ROLES } from './entity-authz.generated'
import { isRouteAccessible } from '../layout/route-registry'
import { authClient, isAuthClientError } from './auth-client'
import type { AuthSession, AuthUser, LoginInput, UserRole, WorkspaceAccess } from './types'

interface AuthContextValue {
  currentUser: AuthUser
  isAuthenticated: boolean
  isHydrating: boolean
  token: string | null
  tournamentCode: string
  operationShift: 'sang' | 'chieu' | 'toi'
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  setRole: (role: UserRole) => void
  canAccessRoute: (path: string) => boolean
  /** O(1) permission check using flattened permission Set */
  hasPermission: (resource: string, action: string) => boolean
  /** Currently active workspace context */
  activeWorkspace: WorkspaceAccess | null
  /** Switch active workspace */
  setActiveWorkspace: (workspace: WorkspaceAccess | null) => void
}

const STORAGE_KEY = 'vct:auth-session'
const GUEST_ROLE_KEY = 'vct:guest-role'
const WORKSPACE_STORAGE_KEY = 'vct:active-workspace'
const LEGACY_WORKSPACE_STORAGE_KEY = 'vct-workspace'
const ACCESS_TOKEN_REFRESH_SKEW_MS = 45 * 1000
const memoryStorage = new Map<string, string>()

const USER_ROLES: UserRole[] = [...ENTITY_AUTHZ_ROLES]
const WORKSPACE_TYPES = new Set([
  'federation_admin',
  'tournament_ops',
  'club_management',
  'referee_console',
  'athlete_portal',
  'public_spectator',
  'system_admin',
])

const DEFAULT_USER: AuthUser = {
  id: 'guest',
  name: 'Khách vận hành',
  username: 'guest',
  role: 'delegate',
  roles: [],
  permissions: [],
  workspaces: [],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object')

const isRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.includes(value as UserRole)

const isWorkspaceAccessShape = (value: unknown): value is WorkspaceAccess =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  WORKSPACE_TYPES.has(value.type) &&
  typeof value.scopeId === 'string' &&
  typeof value.scopeName === 'string' &&
  typeof value.role === 'string'

const normalizeTimestamp = (value: unknown, fallbackMs: number): string => {
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed) && parsed > 0) return new Date(parsed).toISOString()
  }
  return new Date(Date.now() + fallbackMs).toISOString()
}

const isExpired = (iso: string, skewMs = 0): boolean => {
  const timestamp = Date.parse(iso)
  if (!Number.isFinite(timestamp)) return true
  return timestamp <= Date.now() + skewMs
}

const normalizeStoredSession = (value: unknown): AuthSession | null => {
  if (!isRecord(value)) return null

  const rawUser = value.user
  if (!isRecord(rawUser)) return null

  const accessToken =
    (typeof value.accessToken === 'string' && value.accessToken.trim()) ||
    (typeof value.token === 'string' && value.token.trim()) ||
    ''
  const refreshToken =
    typeof value.refreshToken === 'string' ? value.refreshToken.trim() : ''

  if (!accessToken || !refreshToken) return null
  if (typeof rawUser.id !== 'string' || !isRole(rawUser.role)) return null

  const user: AuthUser = {
    id: rawUser.id,
    name: typeof rawUser.name === 'string' ? rawUser.name : 'Người dùng',
    username: typeof rawUser.username === 'string' ? rawUser.username : undefined,
    email: typeof rawUser.email === 'string' ? rawUser.email : undefined,
    avatarUrl: typeof rawUser.avatarUrl === 'string' ? rawUser.avatarUrl : undefined,
    tenantId: typeof rawUser.tenantId === 'string' ? rawUser.tenantId : undefined,
    locale: typeof rawUser.locale === 'string' ? rawUser.locale : undefined,
    timezone: typeof rawUser.timezone === 'string' ? rawUser.timezone : undefined,
    role: rawUser.role,
    roles: Array.isArray(rawUser.roles) ? (rawUser.roles as AuthUser['roles']) : [],
    permissions: Array.isArray(rawUser.permissions) ? (rawUser.permissions as string[]) : [],
    workspaces: Array.isArray(rawUser.workspaces) ? (rawUser.workspaces as AuthUser['workspaces']) : [],
    metadata: isRecord(rawUser.metadata) ? rawUser.metadata : undefined,
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    user,
    expiresAt: normalizeTimestamp(value.expiresAt, 5 * 60 * 1000),
    refreshExpiresAt: normalizeTimestamp(
      value.refreshExpiresAt,
      24 * 60 * 60 * 1000
    ),
  }
}

const normalizeStoredWorkspace = (value: unknown): WorkspaceAccess | null => {
  if (isWorkspaceAccessShape(value)) {
    return value
  }

  if (!isRecord(value)) return null

  const activeWorkspace = isRecord(value.activeWorkspace)
    ? value.activeWorkspace
    : isRecord(value.state) && isRecord(value.state.activeWorkspace)
      ? value.state.activeWorkspace
      : null

  if (!activeWorkspace) return null
  if (
    typeof activeWorkspace.type !== 'string' ||
    !WORKSPACE_TYPES.has(activeWorkspace.type)
  ) {
    return null
  }

  const scope = isRecord(activeWorkspace.scope) ? activeWorkspace.scope : null
  const scopeId =
    typeof activeWorkspace.scopeId === 'string'
      ? activeWorkspace.scopeId
      : typeof scope?.id === 'string'
        ? scope.id
        : null
  const scopeName =
    typeof activeWorkspace.scopeName === 'string'
      ? activeWorkspace.scopeName
      : typeof scope?.name === 'string'
        ? scope.name
        : typeof activeWorkspace.label === 'string'
          ? activeWorkspace.label
          : null

  if (!scopeId || !scopeName) return null

  return {
    type: activeWorkspace.type as WorkspaceAccess['type'],
    scopeId,
    scopeName,
    role:
      typeof activeWorkspace.role === 'string'
        ? activeWorkspace.role
        : 'viewer',
  }
}

const getWebStorage = () => {
  if (typeof window === 'undefined') return null
  if (typeof window.localStorage === 'undefined') return null
  return window.localStorage
}

const readPersisted = (key: string) => {
  const storage = getWebStorage()
  if (storage) {
    try {
      return storage.getItem(key)
    } catch {
      return memoryStorage.get(key) ?? null
    }
  }
  return memoryStorage.get(key) ?? null
}

const writePersisted = (key: string, value: string) => {
  const storage = getWebStorage()
  if (storage) {
    try {
      storage.setItem(key, value)
      return
    } catch {
      // fallback below
    }
  }
  memoryStorage.set(key, value)
}

const removePersisted = (key: string) => {
  const storage = getWebStorage()
  if (storage) {
    try {
      storage.removeItem(key)
      return
    } catch {
      // fallback below
    }
  }
  memoryStorage.delete(key)
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: DEFAULT_USER,
  isAuthenticated: false,
  isHydrating: true,
  token: null,
  tournamentCode: 'VCT-2026',
  operationShift: 'sang',
  login: async () => undefined,
  logout: async () => undefined,
  setRole: () => undefined,
  canAccessRoute: () => true,
  hasPermission: () => false,
  activeWorkspace: null,
  setActiveWorkspace: () => undefined,
})

const readStoredSession = (): AuthSession | null => {
  const raw = readPersisted(STORAGE_KEY)
  if (!raw) return null

  try {
    return normalizeStoredSession(JSON.parse(raw))
  } catch {
    return null
  }
}

const readStoredWorkspace = (): WorkspaceAccess | null => {
  for (const key of [WORKSPACE_STORAGE_KEY, LEGACY_WORKSPACE_STORAGE_KEY]) {
    const raw = readPersisted(key)
    if (!raw) continue

    try {
      const workspace = normalizeStoredWorkspace(JSON.parse(raw))
      if (workspace) return workspace
    } catch {
      // ignore malformed persisted workspace
    }
  }

  return null
}

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [guestRole, setGuestRole] = useState<UserRole>('delegate')
  const [isHydrating, setIsHydrating] = useState(true)
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceAccess | null>(null)
  const refreshInFlightRef = useRef<Promise<AuthSession> | null>(null)

  const clearSession = useCallback(() => {
    setSession(null)
    setActiveWorkspaceState(null)
    removePersisted(STORAGE_KEY)
    removePersisted(WORKSPACE_STORAGE_KEY)
    removePersisted(LEGACY_WORKSPACE_STORAGE_KEY)
  }, [])

  const refreshSession = useCallback(async (source: AuthSession) => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const request = authClient
      .refresh(source.refreshToken)
      .then((next) => {
        setSession(next)
        return next
      })
      .finally(() => {
        refreshInFlightRef.current = null
      })

    refreshInFlightRef.current = request
    return request
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsHydrating(false)
      return
    }

    const savedGuestRole = readPersisted(GUEST_ROLE_KEY) as UserRole | null
    if (savedGuestRole && isRole(savedGuestRole)) {
      setGuestRole(savedGuestRole)
    }

    const storedWorkspace = readStoredWorkspace()
    if (storedWorkspace) {
      setActiveWorkspaceState(storedWorkspace)
    }

    const stored = readStoredSession()
    if (!stored?.accessToken || !stored?.refreshToken) {
      setIsHydrating(false)
      return
    }

    setSession(stored)

    let cancelled = false
    const safeSetSession = (next: AuthSession | null) => {
      if (!cancelled) {
        setSession(next)
      }
    }

    const verify = async () => {
      try {
        let working = stored
        if (isExpired(working.expiresAt, ACCESS_TOKEN_REFRESH_SKEW_MS)) {
          working = await refreshSession(working)
        }

        const me = await authClient.me(working.accessToken)
        const nextSession: AuthSession = {
          ...working,
          token: working.accessToken,
          user: me.user,
          expiresAt: me.expiresAt,
          refreshExpiresAt: me.refreshExpiresAt || working.refreshExpiresAt,
        }
        safeSetSession(nextSession)
      } catch (error) {
        const shouldRetryWithRefresh =
          isAuthClientError(error) &&
          error.status === 401 &&
          !isExpired(stored.refreshExpiresAt)

        if (shouldRetryWithRefresh) {
          try {
            const refreshed = await refreshSession(stored)
            const me = await authClient.me(refreshed.accessToken)
            safeSetSession({
              ...refreshed,
              token: refreshed.accessToken,
              user: me.user,
              expiresAt: me.expiresAt,
              refreshExpiresAt: me.refreshExpiresAt || refreshed.refreshExpiresAt,
            })
            return
          } catch {
            // fallback to clear session below
          }
        }

        if (!cancelled) {
          clearSession()
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false)
        }
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [clearSession, refreshSession])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!session?.accessToken || !session.refreshToken) return

    const msUntilRefresh =
      Date.parse(session.expiresAt) - Date.now() - ACCESS_TOKEN_REFRESH_SKEW_MS
    if (!Number.isFinite(msUntilRefresh)) return

    if (msUntilRefresh <= 0) {
      void refreshSession(session).catch(() => {
        clearSession()
      })
      return
    }

    const timer = setTimeout(() => {
      void refreshSession(session).catch(() => {
        clearSession()
      })
    }, msUntilRefresh)
    return () => clearTimeout(timer)
  }, [clearSession, refreshSession, session])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isHydrating) return
    if (!session) {
      removePersisted(STORAGE_KEY)
      return
    }
    writePersisted(STORAGE_KEY, JSON.stringify(session))
  }, [isHydrating, session])

  const login = useCallback(async (input: LoginInput) => {
    const nextSession = await authClient.login(input)
    setSession(nextSession)
    setGuestRole(nextSession.user.role)
    writePersisted(STORAGE_KEY, JSON.stringify(nextSession))
    writePersisted(GUEST_ROLE_KEY, nextSession.user.role)
  }, [])

  const logout = useCallback(async () => {
    const token = session?.accessToken
    if (token) {
      try {
        await authClient.logout(token)
      } catch {
        // ignore network logout failure
      }
    }
    clearSession()
  }, [clearSession, session?.accessToken])

  const setRole = useCallback((role: UserRole) => {
    if (session) {
      setSession((prev) =>
        prev
          ? {
            ...prev,
            user: {
              ...prev.user,
              role,
            },
          }
          : prev
      )
    } else {
      setGuestRole(role)
    }

    writePersisted(GUEST_ROLE_KEY, role)
  }, [session])

  const currentUser: AuthUser = useMemo(() => {
    if (session?.user) return session.user
    return {
      ...DEFAULT_USER,
      role: guestRole,
    }
  }, [guestRole, session?.user])

  const canAccessRoute = useCallback(
    (path: string) => isRouteAccessible(path, currentUser.role),
    [currentUser.role]
  )

  // O(1) permission Set built once per user change
  const permissionSet = useMemo(() => {
    const set = new Set<string>()
    if (currentUser.permissions) {
      for (const p of currentUser.permissions) set.add(p)
    }
    return set
  }, [currentUser.permissions])

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (currentUser.role === 'admin') return true
      return (
        permissionSet.has('*') ||
        permissionSet.has(`${resource}.*`) ||
        permissionSet.has(`${resource}.${action}`)
      )
    },
    [currentUser.role, permissionSet]
  )

  const setActiveWorkspace = useCallback(
    (workspace: WorkspaceAccess | null) => {
      setActiveWorkspaceState(workspace)
      if (workspace) {
        writePersisted(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace))
        removePersisted(LEGACY_WORKSPACE_STORAGE_KEY)
      } else {
        removePersisted(WORKSPACE_STORAGE_KEY)
        removePersisted(LEGACY_WORKSPACE_STORAGE_KEY)
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(session?.accessToken),
      isHydrating,
      token: session?.accessToken ?? null,
      tournamentCode: session?.tournamentCode ?? 'VCT-2026',
      operationShift: session?.operationShift ?? 'sang',
      login,
      logout,
      setRole,
      canAccessRoute,
      hasPermission,
      activeWorkspace,
      setActiveWorkspace,
    }),
    [
      canAccessRoute,
      currentUser,
      hasPermission,
      activeWorkspace,
      setActiveWorkspace,
      isHydrating,
      login,
      logout,
      session?.operationShift,
      session?.tournamentCode,
      setRole,
      session?.accessToken,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
