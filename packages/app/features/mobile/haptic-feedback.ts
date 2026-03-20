// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Haptic Feedback
// Tactile feedback for scoring actions, navigation, and UI events.
// Uses expo-haptics for cross-platform vibration patterns.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import { useCallback } from 'react'

// ── Lazy Import ──────────────────────────────────────────────
// expo-haptics is optional — gracefully degrade on unsupported platforms

let Haptics: typeof import('expo-haptics') | null = null

async function loadHaptics() {
  if (Haptics) return Haptics
  try {
    Haptics = await import('expo-haptics')
    return Haptics
  } catch {
    return null
  }
}

// Eagerly attempt to load
loadHaptics()

// ── Types ────────────────────────────────────────────────────

export type HapticStyle =
  | 'light'       // subtle tap
  | 'medium'      // standard tap
  | 'heavy'       // firm tap
  | 'success'     // positive action
  | 'warning'     // caution
  | 'error'       // failed action
  | 'selection'   // picker/selection change

// ── Haptic Functions ─────────────────────────────────────────

/**
 * Trigger haptic feedback.
 *
 * @example
 * ```ts
 * // Score button pressed
 * haptic('medium')
 *
 * // Penalty confirmed
 * haptic('warning')
 *
 * // Match won
 * haptic('success')
 * ```
 */
export async function haptic(style: HapticStyle = 'medium'): Promise<void> {
  if (Platform.OS === 'web') return

  const h = await loadHaptics()
  if (!h) return

  try {
    switch (style) {
      case 'light':
        await h.impactAsync(h.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        await h.impactAsync(h.ImpactFeedbackStyle.Medium)
        break
      case 'heavy':
        await h.impactAsync(h.ImpactFeedbackStyle.Heavy)
        break
      case 'success':
        await h.notificationAsync(h.NotificationFeedbackType.Success)
        break
      case 'warning':
        await h.notificationAsync(h.NotificationFeedbackType.Warning)
        break
      case 'error':
        await h.notificationAsync(h.NotificationFeedbackType.Error)
        break
      case 'selection':
        await h.selectionAsync()
        break
    }
  } catch {
    // Silently fail on unsupported devices
  }
}

// ── Scoring-Specific Patterns ────────────────────────────────

/**
 * Haptic patterns for VCT scoring interactions.
 */
export const scoringHaptics = {
  /** Đối kháng: điểm đánh trúng */
  scorePoint: () => haptic('medium'),

  /** Đối kháng: điểm thưởng (kỹ thuật đẹp) */
  bonusPoint: () => haptic('heavy'),

  /** Quyền thuật: chấm điểm nghệ thuật */
  artScore: () => haptic('light'),

  /** Phạt / cảnh cáo */
  penalty: () => haptic('warning'),

  /** Knock-out / hạ đài */
  knockout: () => haptic('heavy'),

  /** Kết thúc hiệp */
  roundEnd: () => haptic('success'),

  /** Kết thúc trận — người thắng */
  matchWin: async () => {
    await haptic('success')
    // Double pulse for celebration
    setTimeout(() => haptic('heavy'), 200)
  },

  /** Timer: 10 giây cuối */
  timerWarning: () => haptic('warning'),

  /** Chọn VĐV / đội */
  selectAthlete: () => haptic('selection'),
}

// ── Navigation Haptics ───────────────────────────────────────

export const navHaptics = {
  /** Tab switch */
  tabChange: () => haptic('selection'),

  /** Pull to refresh */
  pullRefresh: () => haptic('light'),

  /** Swipe action (delete, archive) */
  swipeAction: () => haptic('medium'),

  /** Long press menu */
  longPress: () => haptic('heavy'),

  /** Action completed (save, submit) */
  actionComplete: () => haptic('success'),

  /** Action failed (network error) */
  actionFailed: () => haptic('error'),
}

// ── React Hook ───────────────────────────────────────────────

/**
 * Hook for haptic feedback in components.
 *
 * @example
 * ```tsx
 * function ScoreButton() {
 *   const { trigger } = useHaptic()
 *   return (
 *     <Pressable onPress={() => {
 *       trigger('medium')
 *       addScore()
 *     }}>
 *       <Text>+1 Điểm</Text>
 *     </Pressable>
 *   )
 * }
 * ```
 */
export function useHaptic() {
  const trigger = useCallback((style: HapticStyle = 'medium') => {
    haptic(style)
  }, [])

  return {
    trigger,
    scoring: scoringHaptics,
    nav: navHaptics,
  }
}
