import * as React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Design System (v2)
// Dark-first theming, design tokens, shared styles
// ═══════════════════════════════════════════════════════════════

// ── Color Palette ────────────────────────────────────────────

interface ThemePalette {
  bgBase: string; bgDark: string; bgCard: string; bgInput: string
  accent: string; accentDark: string; gold: string; green: string; red: string; purple: string; cyan: string
  textPrimary: string; textSecondary: string; textWhite: string; textMuted: string
  border: string; borderLight: string; borderAccent: string
  statusOkBg: string; statusOkFg: string
  statusWarnBg: string; statusWarnFg: string
  statusErrorBg: string; statusErrorFg: string
  statusInfoBg: string; statusInfoFg: string
  skeleton: string; trackBg: string
}

const LIGHT: ThemePalette = {
  bgBase: '#f8fafc', bgDark: '#0f172a', bgCard: '#ffffff', bgInput: '#f1f5f9',
  accent: '#3b82f6', accentDark: '#2563eb', gold: '#f59e0b', green: '#22c55e', red: '#ef4444', purple: '#8b5cf6', cyan: '#06b6d4',
  textPrimary: '#0f172a', textSecondary: '#64748b', textWhite: '#ffffff', textMuted: '#94a3b8',
  border: '#e2e8f0', borderLight: 'rgba(255,255,255,0.06)', borderAccent: 'rgba(59,130,246,0.2)',
  statusOkBg: '#dcfce7', statusOkFg: '#166534',
  statusWarnBg: '#fef3c7', statusWarnFg: '#92400e',
  statusErrorBg: '#fee2e2', statusErrorFg: '#991b1b',
  statusInfoBg: '#dbeafe', statusInfoFg: '#1e40af',
  skeleton: '#e2e8f0', trackBg: '#f1f5f9',
}

const DARK: ThemePalette = {
  bgBase: '#0f172a', bgDark: '#020617', bgCard: '#1e293b', bgInput: '#334155',
  accent: '#60a5fa', accentDark: '#3b82f6', gold: '#fbbf24', green: '#4ade80', red: '#f87171', purple: '#a78bfa', cyan: '#22d3ee',
  textPrimary: '#f1f5f9', textSecondary: '#94a3b8', textWhite: '#ffffff', textMuted: '#64748b',
  border: '#334155', borderLight: 'rgba(255,255,255,0.08)', borderAccent: 'rgba(96,165,250,0.25)',
  statusOkBg: 'rgba(34,197,94,0.15)', statusOkFg: '#4ade80',
  statusWarnBg: 'rgba(245,158,11,0.15)', statusWarnFg: '#fbbf24',
  statusErrorBg: 'rgba(239,68,68,0.15)', statusErrorFg: '#f87171',
  statusInfoBg: 'rgba(59,130,246,0.15)', statusInfoFg: '#60a5fa',
  skeleton: '#334155', trackBg: '#1e293b',
}

/** Color overlay helper */
function overlay(color: string, opacity: number): string {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

// ── Theme Context ────────────────────────────────────────────

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  colors: ThemePalette & { overlay: typeof overlay }
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: { ...LIGHT, overlay },
  toggleTheme: () => {},
  isDark: false,
})

export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')

  const toggleTheme = useCallback(() => {
    setMode(m => (m === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    colors: { ...(mode === 'dark' ? DARK : LIGHT), overlay },
    toggleTheme,
    isDark: mode === 'dark',
  }), [mode, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeColors() {
  return useContext(ThemeContext)
}

// ── Static exports (backward compat) ─────────────────────────
// These remain for screens not yet migrated to dynamic theme

export const Colors = {
  ...LIGHT,
  overlay,
} as const

/** Spacing scale (4px base) */
export const Space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const

/** Border radius scale */
export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 999,
} as const

/** Font weights (as React Native expects) */
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
}

/** Touch target constants (WCAG 2.1 AA) */
export const Touch = {
  minSize: 44,
  minSizeSm: 36,
} as const

/** Shared styles — uses static Colors for backward compat */
export const SharedStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: LIGHT.bgBase },
  pageDark: { flex: 1, backgroundColor: LIGHT.bgDark },
  scrollContent: { padding: Space.lg, paddingBottom: 40 },

  card: {
    borderRadius: Radius.lg, padding: Space.lg, marginBottom: Space.md,
    backgroundColor: LIGHT.bgCard, borderWidth: 1, borderColor: LIGHT.border,
  },
  heroCard: {
    borderRadius: Radius.xl, padding: Space.xxl, marginBottom: Space.lg,
    backgroundColor: LIGHT.bgDark,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Space.lg },
  statBox: {
    flex: 1, borderRadius: Radius.lg, padding: 14, alignItems: 'center',
    backgroundColor: LIGHT.bgCard, borderWidth: 1, borderColor: LIGHT.border,
  },
  statValue: { fontSize: 22, fontWeight: FontWeight.black, color: LIGHT.textPrimary, marginBottom: 2 },
  statLabel: {
    fontSize: 10, fontWeight: FontWeight.bold, color: LIGHT.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: Space.lg },
  actionBtn: {
    flex: 1, borderRadius: Radius.md, padding: 14, alignItems: 'center',
    backgroundColor: LIGHT.bgCard, borderWidth: 1, borderColor: LIGHT.border,
    minHeight: Touch.minSize,
  },
  actionIcon: { fontSize: 22, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: FontWeight.bold, color: LIGHT.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: FontWeight.extrabold, color: LIGHT.textPrimary, marginBottom: 12, marginTop: 8 },
  sectionSub: { fontSize: 11, color: LIGHT.textSecondary, marginBottom: 10 },

  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  skillLabel: { width: 64, fontSize: 11, fontWeight: FontWeight.semibold, color: LIGHT.textSecondary, textAlign: 'right' },
  skillTrack: { flex: 1, height: 8, backgroundColor: LIGHT.trackBg, borderRadius: 4, overflow: 'hidden' },
  skillFill: { height: '100%', borderRadius: 4 },
  skillValue: { width: 28, fontSize: 11, fontWeight: FontWeight.extrabold, textAlign: 'right' },

  progressTrack: { height: 6, backgroundColor: LIGHT.trackBg, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 3 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: FontWeight.extrabold },

  emptyBox: {
    paddingVertical: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed',
    borderColor: LIGHT.border, backgroundColor: LIGHT.bgCard, marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: LIGHT.textSecondary, marginTop: 8, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
