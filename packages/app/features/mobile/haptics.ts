import { Platform } from 'react-native'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Haptic Feedback Utilities
// Wraps expo-haptics with graceful fallback
// ═══════════════════════════════════════════════════════════════

let Haptics: typeof import('expo-haptics') | null = null
try {
  Haptics = require('expo-haptics')
} catch {
  // expo-haptics not available (web/older device)
}

/** Light tap — button press, toggle, selection */
export function hapticLight() {
  if (Platform.OS === 'web') return
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

/** Medium impact — confirm action, FAB press */
export function hapticMedium() {
  if (Platform.OS === 'web') return
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

/** Success notification — form saved, action completed */
export function hapticSuccess() {
  if (Platform.OS === 'web') return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

/** Error notification — validation fail, API error */
export function hapticError() {
  if (Platform.OS === 'web') return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error).catch(() => {})
}

/** Warning notification — destructive action confirmation */
export function hapticWarning() {
  if (Platform.OS === 'web') return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning).catch(() => {})
}

/** Selection changed — picker, role switch */
export function hapticSelection() {
  if (Platform.OS === 'web') return
  Haptics?.selectionAsync?.().catch(() => {})
}
