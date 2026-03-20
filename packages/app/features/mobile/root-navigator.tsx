// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Root Navigator
// Top-level navigator that switches between Auth flow and Main
// app flow based on authentication state.
// Integrates deep linking configuration for both flows.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native'
import { useVCTTheme } from './theme-provider'
import { authStorage } from './auth-storage'
import { DEEP_LINK_CONFIG } from './route-types'
import { getInitialAuthRoute } from './auth-navigator'
import type { AuthStackParamList } from './route-types'

// ── Types ────────────────────────────────────────────────────

type RootState = 'loading' | 'authenticated' | 'unauthenticated'

export interface RootNavigatorConfig {
  /** The auth flow navigator component */
  AuthNavigator: React.ComponentType<{ initialRouteName?: keyof AuthStackParamList }>
  /** The main app navigator (tab-based) */
  MainNavigator: React.ComponentType<any>
  /** Optional splash/loading component */
  SplashComponent?: React.ComponentType<any>
}

// ── Root Navigator Controller ────────────────────────────────

/**
 * Controls the root navigation state.
 * Use this hook in your root layout to decide which navigator to render.
 *
 * @example
 * ```tsx
 * function RootLayout() {
 *   const { state, initialAuthRoute } = useRootNavigator()
 *   if (state === 'loading') return <SplashScreen />
 *   if (state === 'authenticated') return <MainNavigator />
 *   return <AuthNavigator initialRouteName={initialAuthRoute} />
 * }
 * ```
 */
export function useRootNavigator() {
  const { theme, isDark } = useVCTTheme()
  const [state, setState] = useState<RootState>('loading')
  const [initialAuthRoute, setInitialAuthRoute] = useState<keyof AuthStackParamList>('Login')

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const token = await authStorage.getAccessToken()
        const isExpired = token ? await authStorage.isTokenExpired() : true

        if (token && !isExpired) {
          if (isMounted) setState('authenticated')
        } else {
          // Determine where in the auth flow to start
          const route = await getInitialAuthRoute()
          if (isMounted) {
            setInitialAuthRoute(route)
            setState('unauthenticated')
          }
        }
      } catch {
        if (isMounted) setState('unauthenticated')
      }
    }

    checkAuth()

    // Listen for auth state changes (login/logout from anywhere)
    const unsubscribe = authStorage.onChange((event) => {
      if (!isMounted) return
      if (event === 'login') setState('authenticated')
      else if (event === 'logout') setState('unauthenticated')
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return {
    state,
    initialAuthRoute,
    theme,
    isDark,
    deepLinkConfig: DEEP_LINK_CONFIG,
  }
}

// ── Status Bar Manager ───────────────────────────────────────

/**
 * Manages the status bar appearance based on current theme.
 */
export function RootStatusBar() {
  const { isDark } = useVCTTheme()

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor="transparent"
      translucent={Platform.OS === 'android'}
    />
  )
}

// ── Loading Screen ───────────────────────────────────────────

/**
 * Default loading screen shown while checking auth state.
 */
export function RootLoadingScreen() {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  )
}

// ── Navigation Theme ─────────────────────────────────────────

/**
 * Creates a navigation theme object compatible with @react-navigation/native.
 */
export function createNavigationTheme(theme: ReturnType<typeof useVCTTheme>['theme'], isDark: boolean) {
  return {
    dark: isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  }
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
