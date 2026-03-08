'use client'
import * as React from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isRouteAccessible } from '../layout/route-registry'
import { type AuthUser, type UserRole, USER_ROLE_OPTIONS } from './types'

interface AuthContextValue {
  currentUser: AuthUser
  setRole: (role: UserRole) => void
  canAccessRoute: (path: string) => boolean
}

const STORAGE_KEY = 'vct:auth-role'

const DEFAULT_USER: AuthUser = {
  id: 'u-admin',
  name: 'Admin',
  role: 'admin',
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: DEFAULT_USER,
  setRole: () => undefined,
  canAccessRoute: () => true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(DEFAULT_USER)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedRole = window.localStorage.getItem(STORAGE_KEY) as UserRole | null
    if (!savedRole) return
    if (!USER_ROLE_OPTIONS.some((item) => item.value === savedRole)) return
    setCurrentUser((prev) => ({ ...prev, role: savedRole }))
  }, [])

  const setRole = useCallback((role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }))
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, role)
    }
  }, [])

  const canAccessRoute = useCallback(
    (path: string) => isRouteAccessible(path, currentUser.role),
    [currentUser.role]
  )

  const value = useMemo(
    () => ({
      currentUser,
      setRole,
      canAccessRoute,
    }),
    [currentUser, setRole, canAccessRoute]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

