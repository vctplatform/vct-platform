// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Theme Provider (v3)
// VCT brand tokens, dark/light/system mode, and React context for
// consistent styling across all mobile screens.
// Supports system theme auto-tracking, shadows, and dynamic tokens.
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useColorScheme, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Token Types ──────────────────────────────────────────────

export interface ColorTokens {
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  accentLight: string

  background: string
  surface: string
  surfaceElevated: string
  card: string

  text: string
  textSecondary: string
  textMuted: string
  textInverse: string

  border: string
  borderLight: string
  divider: string

  success: string
  warning: string
  error: string
  info: string

  scorePositive: string
  scoreNegative: string
  scorePenalty: string
  timerActive: string
  timerWarning: string
}

export interface SpacingTokens {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export interface TypographyTokens {
  h1: { fontSize: number; fontWeight: string; lineHeight: number }
  h2: { fontSize: number; fontWeight: string; lineHeight: number }
  h3: { fontSize: number; fontWeight: string; lineHeight: number }
  body: { fontSize: number; fontWeight: string; lineHeight: number }
  bodySmall: { fontSize: number; fontWeight: string; lineHeight: number }
  caption: { fontSize: number; fontWeight: string; lineHeight: number }
  label: { fontSize: number; fontWeight: string; lineHeight: number }
  score: { fontSize: number; fontWeight: string; lineHeight: number }
}

export interface RadiusTokens {
  sm: number
  md: number
  lg: number
  xl: number
  full: number
}

export interface ShadowTokens {
  sm: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }
  md: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }
  lg: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }
}

export type ThemeMode = 'dark' | 'light' | 'system'

export interface VCTTheme {
  mode: 'dark' | 'light'
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  radius: RadiusTokens
  shadows: ShadowTokens
}

// ── Base Tokens ──────────────────────────────────────────────

const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

const typography: TypographyTokens = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  score: { fontSize: 48, fontWeight: '800', lineHeight: 56 },
}

const radius: RadiusTokens = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
}

// ── Shadows ──────────────────────────────────────────────────

function getShadows(isDark: boolean): ShadowTokens {
  const color = isDark ? '#000000' : '#0F172A'
  
  return {
    sm: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  }
}

// ── Colors ───────────────────────────────────────────────────

const defaultDarkColors: ColorTokens = {
  primary: '#00E5CC',
  primaryLight: '#33EBDA',
  primaryDark: '#00B3A0',
  accent: '#FF6B35',
  accentLight: '#FF8F66',

  background: '#0A0E14',
  surface: '#131922',
  surfaceElevated: '#1A2332',
  card: '#161E2C',

  text: '#F0F4F8',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0A0E14',

  border: '#1E293B',
  borderLight: '#2A3A4E',
  divider: '#1E293B',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Scoring
  scorePositive: '#22C55E',
  scoreNegative: '#EF4444',
  scorePenalty: '#F59E0B',
  timerActive: '#00E5CC',
  timerWarning: '#EF4444',
}

const defaultLightColors: ColorTokens = {
  primary: '#00B3A0',
  primaryLight: '#00E5CC',
  primaryDark: '#008577',
  accent: '#F05A28',
  accentLight: '#FF6B35',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Scoring
  scorePositive: '#16A34A',
  scoreNegative: '#DC2626',
  scorePenalty: '#D97706',
  timerActive: '#00B3A0',
  timerWarning: '#DC2626',
}

// ── Theme Builder ────────────────────────────────────────────

function buildTheme(
  userMode: ThemeMode,
  systemScheme: 'dark' | 'light' | null | undefined,
  dynamicTokens: Partial<ColorTokens>
): VCTTheme {
  const activeMode = userMode === 'system' ? (systemScheme || 'light') : userMode
  const isDark = activeMode === 'dark'
  const baseColors = isDark ? defaultDarkColors : defaultLightColors
  
  return {
    mode: activeMode, // Explicit 'dark' or 'light'
    colors: { ...baseColors, ...dynamicTokens },
    spacing,
    typography,
    radius,
    shadows: getShadows(isDark),
  }
}

// ── React Context ────────────────────────────────────────────

const THEME_PERSIST_KEY = 'vct-theme-mode'

export interface ThemeContextValue {
  theme: VCTTheme
  userMode: ThemeMode
  isDark: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  updateDynamicTokens: (tokens: Partial<ColorTokens>) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: buildTheme('system', null, {}),
  userMode: 'system',
  isDark: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
  updateDynamicTokens: () => {},
})

/**
 * VCT Theme Provider.
 * Supports dark/light/system modes and dynamic brand token injection.
 */
export function VCTThemeProvider({
  children,
  defaultMode = 'system',
}: {
  children: ReactNode
  defaultMode?: ThemeMode
}) {
  const systemScheme = useColorScheme()
  const [userMode, setUserMode] = useState<ThemeMode>(defaultMode)
  const [dynamicTokens, setDynamicTokens] = useState<Partial<ColorTokens>>({})
  const [isReady, setIsReady] = useState(false)

  // Load persisted theme
  useEffect(() => {
    AsyncStorage.getItem(THEME_PERSIST_KEY)
      .then((stored: string | null) => {
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          setUserMode(stored as ThemeMode)
        }
      })
      .finally(() => setIsReady(true))
  }, [])

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setUserMode(newMode)
    await AsyncStorage.setItem(THEME_PERSIST_KEY, newMode)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeMode(userMode === 'dark' ? 'light' : 'dark')
  }, [userMode, setThemeMode])

  const updateDynamicTokens = useCallback((tokens: Partial<ColorTokens>) => {
    setDynamicTokens(prev => ({ ...prev, ...tokens }))
  }, [])

  const theme = buildTheme(userMode, systemScheme, dynamicTokens)

  // Avoid flash of unstyled content
  if (!isReady) return null

  return (
    <ThemeContext.Provider value={{ theme, userMode, isDark: theme.mode === 'dark', setThemeMode, toggleTheme, updateDynamicTokens }}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access VCT theme and mode controls.
 */
export function useVCTTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
