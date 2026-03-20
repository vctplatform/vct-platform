// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Auth Guard
// High Order Component / Wrapper for protecting routes.
// Automatically checks for valid access tokens and redirects
// to the login flow gracefully if unauthorized.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, type ReactNode } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import * as authStorage from './auth-storage'
import { ErrorState } from './error-states'
import { useVCTTheme } from './theme-provider'
// TODO: navigateToLogin
// import { navigateToLogin } from './navigation-helpers'
// Instead, let's use router or a safe navigation placeholder
const navigateToLogin = () => {}

export interface AuthGuardProps {
  children: ReactNode
  /** Roles allowed to view this screen. Leave empty for any authenticated user. */
  allowedRoles?: string[]
  /** Override the fallback node while checking auth */
  fallback?: ReactNode
  /** Unanimous message if role is denied */
  unauthorizedMessage?: string
}

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'forbidden'

/**
 * Wraps screens or stacks that require authentication.
 *
 * @example
 * ```tsx
 * export default function ProtectedLayout() {
 *   return (
 *     <AuthGuard allowedRoles={['admin', 'coach']}>
 *       <Slot />
 *     </AuthGuard>
 *   )
 * }
 * ```
 */
export function AuthGuard({
  children,
  allowedRoles,
  fallback,
  unauthorizedMessage = 'Bạn không có quyền truy cập khu vực này.',
}: AuthGuardProps) {
  const { theme } = useVCTTheme()
  const [status, setStatus] = useState<AuthStatus>('checking')

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const token = await authStorage.getAccessToken()
        
        if (!token) {
          if (isMounted) setStatus('unauthenticated')
          // Auto-redirect to login
          navigateToLogin()
          return
        }

        // Token exists. Check expiration.
        // If expired, the API Interceptor will normally catch it and attempt refresh,
        // but we can preemptively check the expiry from storage if it exists.
        const isExpired = await authStorage.isTokenExpired()
        if (isExpired) {
          // Rely on the background refresh task or force logout
          // Simplified for now: treat as unauth if completely dead
          await authStorage.clearTokens()
          if (isMounted) setStatus('unauthenticated')
          navigateToLogin()
          return
        }

        // Check roles if specified
        if (allowedRoles && allowedRoles.length > 0) {
          const user = await authStorage.getStoredUser()
          const userRole = user?.role
          if (!userRole || !allowedRoles.includes(userRole)) {
            if (isMounted) setStatus('forbidden')
            return
          }
        }

        if (isMounted) setStatus('authenticated')
      } catch (err) {
        if (isMounted) setStatus('unauthenticated')
        navigateToLogin()
      }
    }

    checkAuth()

    // Listen to changes (e.g., token expired via api interceptor elsewhere)
    const listenerId = authStorage.onAuthChange((event) => {
      if (event === 'logout') {
        if (isMounted) setStatus('unauthenticated')
        navigateToLogin()
      } else if (event === 'login') {
        checkAuth() // Re-evaluate roles
      }
    })

    return () => {
      isMounted = false
      authStorage.removeAuthListener(listenerId)
    }
  }, [allowedRoles])

  if (status === 'checking') {
    return (
      fallback ?? (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )
    )
  }

  if (status === 'forbidden') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ErrorState
          icon="🚫"
          title="Truy cập bị từ chối"
          message={unauthorizedMessage}
          retryLabel="Quay lại"
          onRetry={() => {
            // Can add a goBack hook here
          }}
        />
      </View>
    )
  }

  // Fallback if unauthenticated but navigation hasn't kicked in yet
  if (status === 'unauthenticated') {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
