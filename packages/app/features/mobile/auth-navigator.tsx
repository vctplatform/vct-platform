// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Auth Navigator
// Stack navigator for the authentication flow:
// Onboarding → Login → Register → ForgotPassword → ResetPassword
// ═══════════════════════════════════════════════════════════════

import React from 'react'
import { Platform } from 'react-native'
import { useVCTTheme } from './theme-provider'
import type { AuthStackParamList } from './route-types'

// ── Screen Options Factory ───────────────────────────────────

/**
 * Shared screen options for all auth-flow screens.
 * Apply as `screenOptions` on your Stack.Navigator.
 */
export function createAuthScreenOptions(theme: ReturnType<typeof useVCTTheme>['theme']) {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: theme.colors.background },
    animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
  }
}

// ── Auth Screen Registry ─────────────────────────────────────

export interface AuthScreenConfig {
  name: keyof AuthStackParamList
  /** Component imported lazily when building the navigator */
  component: React.ComponentType<any>
  options?: Record<string, any>
}

/**
 * Ordered list of auth screens.
 * The navigator should iterate this to register screens.
 */
export const AUTH_SCREENS: AuthScreenConfig[] = [
  {
    name: 'Onboarding',
    component: LazyPlaceholder,
    options: {
      gestureEnabled: false, // Can't swipe back from onboarding
    },
  },
  {
    name: 'Login',
    component: LazyPlaceholder,
    options: {
      animationTypeForReplace: 'pop', // When replacing Register → Login, use pop anim
    },
  },
  {
    name: 'Register',
    component: LazyPlaceholder,
  },
  {
    name: 'ForgotPassword',
    component: LazyPlaceholder,
    options: {
      presentation: 'modal',
      headerShown: true,
      headerTitle: 'Quên mật khẩu',
    },
  },
  {
    name: 'ResetPassword',
    component: LazyPlaceholder,
    options: {
      presentation: 'modal',
      headerShown: true,
      headerTitle: 'Đặt lại mật khẩu',
    },
  },
  {
    name: 'VerifyOTP',
    component: LazyPlaceholder,
    options: {
      presentation: 'modal',
      headerShown: true,
      headerTitle: 'Xác thực OTP',
    },
  },
]

// ── Initial Route Logic ──────────────────────────────────────

/**
 * Determines the initial auth route based on stored state.
 * Call this during app bootstrap to decide where to start.
 */
export async function getInitialAuthRoute(): Promise<keyof AuthStackParamList> {
  try {
    // Check if user has completed onboarding
    const { secureStorage } = await import('./secure-storage')
    const hasOnboarded = await secureStorage.getItem('has_onboarded')

    if (!hasOnboarded) {
      return 'Onboarding'
    }

    return 'Login'
  } catch {
    return 'Onboarding'
  }
}

// ── Placeholder ──────────────────────────────────────────────

function LazyPlaceholder() {
  const { theme } = useVCTTheme()
  const React = require('react')
  const { View, Text } = require('react-native')
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.textSecondary }}>Loading...</Text>
    </View>
  )
}
