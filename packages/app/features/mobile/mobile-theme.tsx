import * as React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Design System (v3)
// Synced with web globals.css tokens. Dark-first by default.
// ═══════════════════════════════════════════════════════════════

// ── Color Palette (aligned with web --vct-* tokens) ──────────

interface ThemePalette {
  bgBase: string; bgDark: string; bgCard: string; bgInput: string; bgElevated: string
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
  bgBase: '#f0f4f8', bgDark: '#0b1120', bgCard: '#ffffff', bgInput: '#e8edf3', bgElevated: '#ffffff',
  accent: '#0ea5e9', accentDark: '#0284c7', gold: '#eab308', green: '#10b981', red: '#ef4444', purple: '#8b5cf6', cyan: '#0ea5e9',
  textPrimary: '#0f172a', textSecondary: '#334155', textWhite: '#ffffff', textMuted: '#64748b',
  border: '#dde3ec', borderLight: 'rgba(255,255,255,0.06)', borderAccent: 'rgba(14,165,233,0.2)',
  statusOkBg: 'rgba(16,185,129,0.12)', statusOkFg: '#10b981',
  statusWarnBg: 'rgba(245,158,11,0.12)', statusWarnFg: '#f59e0b',
  statusErrorBg: 'rgba(239,68,68,0.12)', statusErrorFg: '#ef4444',
  statusInfoBg: 'rgba(59,130,246,0.12)', statusInfoFg: '#3b82f6',
  skeleton: '#e8edf3', trackBg: '#f0f4f8',
}

const DARK: ThemePalette = {
  bgBase: '#0b1120', bgDark: '#060c1a', bgCard: '#162032', bgInput: '#1e293b', bgElevated: '#162032',
  accent: '#22d3ee', accentDark: '#0ea5e9', gold: '#facc15', green: '#34d399', red: '#f87171', purple: '#a78bfa', cyan: '#22d3ee',
  textPrimary: '#f1f5f9', textSecondary: '#cbd5e1', textWhite: '#ffffff', textMuted: '#94a3b8',
  border: '#1e293b', borderLight: 'rgba(255,255,255,0.08)', borderAccent: 'rgba(34,211,238,0.25)',
  statusOkBg: 'rgba(52,211,153,0.15)', statusOkFg: '#34d399',
  statusWarnBg: 'rgba(251,191,36,0.15)', statusWarnFg: '#fbbf24',
  statusErrorBg: 'rgba(248,113,113,0.15)', statusErrorFg: '#f87171',
  statusInfoBg: 'rgba(96,165,250,0.15)', statusInfoFg: '#60a5fa',
  skeleton: '#1e293b', trackBg: '#162032',
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
  mode: 'dark',
  colors: { ...DARK, overlay },
  toggleTheme: () => {},
  isDark: true,
})

export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark')

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

// ── Static exports (backward compat — now defaults DARK) ─────

export const Colors = {
  ...DARK,
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

/** Shared styles — dark by default */
export const SharedStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DARK.bgBase },
  pageDark: { flex: 1, backgroundColor: DARK.bgDark },
  scrollContent: { padding: Space.lg, paddingBottom: 40 },

  card: {
    borderRadius: Radius.lg, padding: Space.lg, marginBottom: Space.md,
    backgroundColor: DARK.bgCard, borderWidth: 1, borderColor: DARK.border,
  },
  heroCard: {
    borderRadius: Radius.xl, padding: Space.xxl, marginBottom: Space.lg,
    backgroundColor: DARK.bgDark,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Space.lg },
  statBox: {
    flex: 1, borderRadius: Radius.lg, padding: 14, alignItems: 'center',
    backgroundColor: DARK.bgCard, borderWidth: 1, borderColor: DARK.border,
  },
  statValue: { fontSize: 22, fontWeight: FontWeight.black, color: DARK.textPrimary, marginBottom: 2 },
  statLabel: {
    fontSize: 10, fontWeight: FontWeight.bold, color: DARK.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: Space.lg },
  actionBtn: {
    flex: 1, borderRadius: Radius.md, padding: 14, alignItems: 'center',
    backgroundColor: DARK.bgCard, borderWidth: 1, borderColor: DARK.border,
    minHeight: Touch.minSize,
  },
  actionIcon: { fontSize: 22, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: FontWeight.bold, color: DARK.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: FontWeight.extrabold, color: DARK.textPrimary, marginBottom: 12, marginTop: 8 },
  sectionSub: { fontSize: 11, color: DARK.textSecondary, marginBottom: 10 },

  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  skillLabel: { width: 64, fontSize: 11, fontWeight: FontWeight.semibold, color: DARK.textSecondary, textAlign: 'right' },
  skillTrack: { flex: 1, height: 8, backgroundColor: DARK.trackBg, borderRadius: 4, overflow: 'hidden' },
  skillFill: { height: '100%', borderRadius: 4 },
  skillValue: { width: 28, fontSize: 11, fontWeight: FontWeight.extrabold, textAlign: 'right' },

  progressTrack: { height: 6, backgroundColor: DARK.trackBg, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 3 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: FontWeight.extrabold },

  emptyBox: {
    paddingVertical: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg, borderWidth: 1, borderStyle: 'dashed',
    borderColor: DARK.border, backgroundColor: DARK.bgCard, marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: DARK.textSecondary, marginTop: 8, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
