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
import { isRouteAccessible } from '../layout/route-registry'
import { authClient, isAuthClientError } from './auth-client'
import type { AuthSession, AuthUser, LoginInput, UserRole } from './types'

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
}

const STORAGE_KEY = 'vct:auth-session'
const GUEST_ROLE_KEY = 'vct:guest-role'
const ACCESS_TOKEN_REFRESH_SKEW_MS = 45 * 1000

const USER_ROLES: UserRole[] = [
  'admin',
  'btc',
  'referee_manager',
  'referee',
  'delegate',
]
const DEFAULT_USER: AuthUser = {
  id: 'guest',
  name: 'Khách vận hành',
  username: 'guest',
  role: 'delegate',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object')

const isRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.includes(value as UserRole)

const normalizeShift = (value: unknown): 'sang' | 'chieu' | 'toi' => {
  if (value === 'chieu' || value === 'toi') return value
  return 'sang'
}

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
    role: rawUser.role,
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    user,
    tournamentCode:
      typeof value.tournamentCode === 'string' && value.tournamentCode.trim()
        ? value.tournamentCode.trim()
        : 'VCT-2026',
    operationShift: normalizeShift(value.operationShift),
    expiresAt: normalizeTimestamp(value.expiresAt, 5 * 60 * 1000),
    refreshExpiresAt: normalizeTimestamp(
      value.refreshExpiresAt,
      24 * 60 * 60 * 1000
    ),
  }
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
})

const readStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return normalizeStoredSession(JSON.parse(raw))
  } catch {
    return null
  }
}

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [guestRole, setGuestRole] = useState<UserRole>('delegate')
  const [isHydrating, setIsHydrating] = useState(true)
  const refreshInFlightRef = useRef<Promise<AuthSession> | null>(null)

  const clearSession = useCallback(() => {
    setSession(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const refreshSession = useCallback(async (source: AuthSession) => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const request = authClient
      .refresh(source.refreshToken, {
        tournamentCode: source.tournamentCode,
        operationShift: source.operationShift,
      })
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

    const savedGuestRole = window.localStorage.getItem(GUEST_ROLE_KEY) as
      | UserRole
      | null
    if (savedGuestRole && isRole(savedGuestRole)) {
      setGuestRole(savedGuestRole)
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

        let me = await authClient.me(working.accessToken)
        const nextSession: AuthSession = {
          ...working,
          token: working.accessToken,
          user: me.user,
          tournamentCode: me.tournamentCode,
          operationShift: me.operationShift,
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
              tournamentCode: me.tournamentCode,
              operationShift: me.operationShift,
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

    const timer = window.setTimeout(() => {
      void refreshSession(session).catch(() => {
        clearSession()
      })
    }, msUntilRefresh)
    return () => window.clearTimeout(timer)
  }, [clearSession, refreshSession, session])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isHydrating) return
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [isHydrating, session])

  const login = useCallback(async (input: LoginInput) => {
    const nextSession = await authClient.login(input)
    setSession(nextSession)
    setGuestRole(nextSession.user.role)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
      window.localStorage.setItem(GUEST_ROLE_KEY, nextSession.user.role)
    }
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

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUEST_ROLE_KEY, role)
    }
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
    }),
    [
      canAccessRoute,
      currentUser,
      isHydrating,
      login,
      logout,
      setRole,
      session?.accessToken,
      session?.operationShift,
      session?.tournamentCode,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
