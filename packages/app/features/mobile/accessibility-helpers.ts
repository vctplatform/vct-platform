// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Accessibility Helpers
// Screen reader support, dynamic font scaling, WCAG compliant
// semantic props, focus management, and accessible components.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  AccessibilityInfo,
  PixelRatio,
  Platform,
  findNodeHandle,
  type AccessibilityRole,
  type ViewStyle,
} from 'react-native'

// ── Types ────────────────────────────────────────────────────

export interface A11yProps {
  accessible?: boolean
  accessibilityRole?: AccessibilityRole
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityState?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    busy?: boolean
    expanded?: boolean
  }
}

export interface DynamicFontConfig {
  /** Base font size (default: 16) */
  baseFontSize: number
  /** Minimum allowed size (default: 12) */
  minFontSize: number
  /** Maximum allowed size (default: 32) */
  maxFontSize: number
  /** Whether to respect system font scale (default: true) */
  respectSystemScale: boolean
}

// ── Screen Reader Detection ──────────────────────────────────

/**
 * Hook to detect if screen reader is active.
 *
 * @example
 * ```tsx
 * function ScoreDisplay() {
 *   const screenReaderActive = useScreenReader()
 *
 *   return screenReaderActive
 *     ? <Text accessibilityRole="text">Điểm: 8 trên 10</Text>
 *     : <AnimatedScoreRing score={8} />
 * }
 * ```
 */
export function useScreenReader(): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setActive)
    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setActive,
    )
    return () => sub.remove()
  }, [])

  return active
}

/**
 * Hook to detect if reduce motion is enabled.
 * Skip animations when true.
 */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    )
    return () => sub.remove()
  }, [])

  return reduced
}

// ── Dynamic Font Scaling ─────────────────────────────────────

const DEFAULT_FONT_CONFIG: DynamicFontConfig = {
  baseFontSize: 16,
  minFontSize: 12,
  maxFontSize: 32,
  respectSystemScale: true,
}

/**
 * Calculate accessible font size respecting system settings.
 *
 * @example
 * ```tsx
 * const fontSize = getAccessibleFontSize(16)
 * <Text style={{ fontSize }}>Readable text</Text>
 * ```
 */
export function getAccessibleFontSize(
  baseSize: number,
  config: Partial<DynamicFontConfig> = {},
): number {
  const cfg = { ...DEFAULT_FONT_CONFIG, ...config }

  if (!cfg.respectSystemScale) return baseSize

  const scale = PixelRatio.getFontScale()
  const scaled = baseSize * scale

  return Math.max(cfg.minFontSize, Math.min(cfg.maxFontSize, scaled))
}

/**
 * Hook for dynamic font sizes that respect system accessibility settings.
 *
 * @example
 * ```tsx
 * function Text({ children }) {
 *   const { fontSize, fontScale } = useDynamicFont(16)
 *   return <RNText style={{ fontSize }}>{children}</RNText>
 * }
 * ```
 */
export function useDynamicFont(baseSize: number) {
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale())

  useEffect(() => {
    // Listen for font scale changes (Dynamic Type on iOS)
    const interval = setInterval(() => {
      const current = PixelRatio.getFontScale()
      setFontScale((prev) => (prev !== current ? current : prev))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return {
    fontSize: getAccessibleFontSize(baseSize),
    fontScale,
    isScaledUp: fontScale > 1.0,
    isScaledDown: fontScale < 1.0,
  }
}

// ── Focus Management ─────────────────────────────────────────

/**
 * Hook to manage accessibility focus.
 * Announce and focus components for screen reader users.
 *
 * @example
 * ```tsx
 * function SuccessMessage() {
 *   const ref = useAccessibilityFocus(true and)
 *   return <View ref={ref}><Text>Đã lưu thành công!</Text></View>
 * }
 * ```
 */
export function useAccessibilityFocus(shouldFocus: boolean = false) {
  const ref = useRef<any>(null)

  useEffect(() => {
    if (shouldFocus && ref.current) {
      const node = findNodeHandle(ref.current)
      if (node) {
        setTimeout(() => {
          AccessibilityInfo.setAccessibilityFocus(node)
        }, 100)
      }
    }
  }, [shouldFocus])

  return ref
}

/**
 * Announce a message to screen reader users.
 *
 * @example
 * ```ts
 * announce('Đã thêm VĐV vào danh sách')
 * ```
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message)
}

// ── Semantic Helpers ─────────────────────────────────────────

/**
 * Build accessibility props for interactive elements.
 *
 * @example
 * ```tsx
 * <TouchableOpacity {...a11y.button('Đăng ký thi đấu', 'Nhấn để đăng ký giải đấu')}>
 *   <Text>Đăng ký</Text>
 * </TouchableOpacity>
 * ```
 */
export const a11y = {
  /** Button/pressable element. */
  button(label: string, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: label,
      accessibilityHint: hint,
    }
  },

  /** Header/title. */
  header(label: string): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'header',
      accessibilityLabel: label,
    }
  },

  /** Image with description. */
  image(description: string): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: description,
    }
  },

  /** Decorative image (hidden from screen readers). */
  decorative(): A11yProps {
    return {
      accessible: false,
      accessibilityRole: 'none' as AccessibilityRole,
    }
  },

  /** Link element. */
  link(label: string, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'link',
      accessibilityLabel: label,
      accessibilityHint: hint,
    }
  },

  /** Tab element. */
  tab(label: string, selected: boolean): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'tab',
      accessibilityLabel: label,
      accessibilityState: { selected },
    }
  },

  /** Toggle/switch element. */
  toggle(label: string, checked: boolean): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'switch',
      accessibilityLabel: label,
      accessibilityState: { checked },
    }
  },

  /** Loading indicator. */
  loading(label: string = 'Đang tải'): A11yProps {
    return {
      accessible: true,
      accessibilityRole: 'progressbar',
      accessibilityLabel: label,
      accessibilityState: { busy: true },
    }
  },

  /** Text input field. */
  input(label: string, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
    }
  },
}

// ── Touch Target ─────────────────────────────────────────────

/**
 * WCAG 2.1 minimum touch target: 44×44 dp.
 */
export const MIN_TOUCH_TARGET: ViewStyle = {
  minWidth: 44,
  minHeight: 44,
}

/**
 * Recommended touch target: 48×48 dp.
 */
export const RECOMMENDED_TOUCH_TARGET: ViewStyle = {
  minWidth: 48,
  minHeight: 48,
}
