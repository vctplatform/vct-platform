// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Base Screen Layout
// Standardized screen container with safe areas, keyboard avoiding,
// theme integration, offline state overlay, and integrated scrolling.
// ═══════════════════════════════════════════════════════════════

import React, { type ReactNode } from 'react'
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVCTTheme } from './theme-provider'
import { OfflineState } from './error-states'
import { useNetworkStatus } from './offline/useNetworkStatus'

// ── Types ────────────────────────────────────────────────────

export interface BaseScreenProps {
  /** Screen content */
  children: ReactNode
  /** Wrap content in a ScrollView? (default: true) */
  scrollable?: boolean
  /** Hide the offline overlay when disconnected? (default: false) */
  hideOfflineState?: boolean
  /** Root container style override */
  style?: ViewStyle
  /** Content container style override (applied to ScrollView contentContainer or View) */
  contentContainerStyle?: ViewStyle
  /** Disable standard screen padding (default: false) */
  noPadding?: boolean
  /** Background color override (defaults to theme.colors.background) */
  backgroundColor?: string
  /** Automatically pad the bottom for tab bar (default: false) */
  padBottomTab?: boolean
}

// ── Base Screen ──────────────────────────────────────────────

/**
 * Standard screen layout wrapper for VCT Platform mobile app.
 * Automatically handles:
 * - Safe areas (notches, home indicators)
 * - Keyboard avoidance (iOS)
 * - Theming (dark/light background)
 * - Global offline state banner/overlay
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   return (
 *     <BaseScreen>
 *       <ProfileHeader />
 *       <ProfileStats />
 *     </BaseScreen>
 *   )
 * }
 * ```
 */
export function BaseScreen({
  children,
  scrollable = true,
  hideOfflineState = false,
  style,
  contentContainerStyle,
  noPadding = false,
  backgroundColor,
  padBottomTab = false,
}: BaseScreenProps) {
  const { theme } = useVCTTheme()
  const insets = useSafeAreaInsets()
  const { isOnline } = useNetworkStatus()

  const bg = backgroundColor || theme.colors.background

  const dynamicStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    paddingBottom: padBottomTab ? insets.bottom + 60 : insets.bottom,
    backgroundColor: bg,
  }

  const paddingStyle: ViewStyle = noPadding
    ? {}
    : {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
      }

  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[paddingStyle, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, paddingStyle, contentContainerStyle]}>
      {children}
    </View>
  )

  return (
    <View style={[styles.container, dynamicStyle, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {!isOnline && !hideOfflineState && (
          <View style={[styles.offlineBanner, { backgroundColor: theme.colors.warning }]}>
            <OfflineState
              message="Đang mất mạng. Tính năng bị giới hạn."
              style={styles.offlineInner}
            />
          </View>
        )}
        
        {content}
      </KeyboardAvoidingView>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  offlineBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 4,
  },
  offlineInner: {
    padding: 0,
    flex: 0,
    flexDirection: 'row',
  },
})
