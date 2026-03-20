import { Platform } from 'react-native'
import { useMemo } from 'react'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Haptic Feedback Utilities
// Wraps expo-haptics with graceful fallback.
// Enhanced with patterns, global toggle, and React hook.
// ═══════════════════════════════════════════════════════════════

let Haptics: typeof import('expo-haptics') | null = null
try {
  Haptics = require('expo-haptics')
} catch {
  // expo-haptics not available (web/older device)
}

// ── Global Toggle ────────────────────────────────────────────

let _hapticsEnabled = true

/** Enable or disable all haptic feedback (user preference). */
export function setHapticsEnabled(enabled: boolean): void {
  _hapticsEnabled = enabled
}

/** Check if haptics are currently enabled. */
export function isHapticsEnabled(): boolean {
  return _hapticsEnabled
}

function shouldFire(): boolean {
  return _hapticsEnabled && Platform.OS !== 'web'
}

// ── Core Haptics ─────────────────────────────────────────────

/** Light tap — button press, toggle, selection */
export function hapticLight() {
  if (!shouldFire()) return
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

/** Medium impact — confirm action, FAB press */
export function hapticMedium() {
  if (!shouldFire()) return
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

/** Heavy impact — destructive action, force press */
export function hapticHeavy() {
  if (!shouldFire()) return
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
}

/** Success notification — form saved, action completed */
export function hapticSuccess() {
  if (!shouldFire()) return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

/** Error notification — validation fail, API error */
export function hapticError() {
  if (!shouldFire()) return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error).catch(() => {})
}

/** Warning notification — destructive action confirmation */
export function hapticWarning() {
  if (!shouldFire()) return
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning).catch(() => {})
}

/** Selection changed — picker, role switch */
export function hapticSelection() {
  if (!shouldFire()) return
  Haptics?.selectionAsync?.().catch(() => {})
}

// ── Haptic Patterns ──────────────────────────────────────────

type HapticStep = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection'

const HAPTIC_FN: Record<HapticStep, () => void> = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  error: hapticError,
  warning: hapticWarning,
  selection: hapticSelection,
}

/**
 * Play a custom haptic pattern — sequence of haptic types with delays.
 *
 * @example
 * ```ts
 * // Score celebration: light → 100ms → success
 * hapticPattern([
 *   { type: 'light' },
 *   { type: 'success', delayMs: 100 },
 * ])
 * ```
 */
export async function hapticPattern(
  steps: Array<{ type: HapticStep; delayMs?: number }>,
): Promise<void> {
  if (!shouldFire()) return

  for (const step of steps) {
    if (step.delayMs) {
      await new Promise((r) => setTimeout(r, step.delayMs))
    }
    HAPTIC_FN[step.type]()
  }
}

// ── Presets ──────────────────────────────────────────────────

/** Score awarded — celebratory double-tap */
export function hapticScore() {
  hapticPattern([
    { type: 'medium' },
    { type: 'success', delayMs: 80 },
  ])
}

/** Delete confirmation — warning then heavy */
export function hapticDelete() {
  hapticPattern([
    { type: 'warning' },
    { type: 'heavy', delayMs: 150 },
  ])
}

/** Form submitted — light then success */
export function hapticSubmit() {
  hapticPattern([
    { type: 'light' },
    { type: 'success', delayMs: 100 },
  ])
}

// ── React Hook ───────────────────────────────────────────────

/**
 * Hook returning all haptic functions for easy component usage.
 *
 * @example
 * ```tsx
 * function ScoreButton() {
 *   const haptics = useHaptics()
 *   return <Button onPress={() => { haptics.score(); addPoint() }} />
 * }
 * ```
 */
export function useHaptics() {
  return useMemo(() => ({
    light: hapticLight,
    medium: hapticMedium,
    heavy: hapticHeavy,
    success: hapticSuccess,
    error: hapticError,
    warning: hapticWarning,
    selection: hapticSelection,
    score: hapticScore,
    delete: hapticDelete,
    submit: hapticSubmit,
    pattern: hapticPattern,
    setEnabled: setHapticsEnabled,
    isEnabled: isHapticsEnabled,
  }), [])
}

