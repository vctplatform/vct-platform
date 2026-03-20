// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Navigation Helpers (v2)
// Typed screen params, transition presets, screen tracking,
// state persistence, deep link parsing, protected routes,
// screen groups, and Android back handler.
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback, useEffect, useState } from 'react'
import { Platform, BackHandler } from 'react-native'
import { crashReporter } from './crash-reporter'
import { useAnalytics } from './useAnalytics'

// ── Screen Registry ──────────────────────────────────────────

/**
 * All app screens with their typed params.
 * Extend this as new screens are added.
 */
export type RootScreenParams = {
  // ── Auth ─────────────────────────────
  Login: undefined
  Register: undefined
  ForgotPassword: undefined

  // ── Main Tabs ────────────────────────
  Home: undefined
  Tournaments: undefined
  Rankings: undefined
  Notifications: undefined
  Profile: undefined

  // ── Tournament ───────────────────────
  TournamentDetail: { tournamentId: string }
  TournamentResults: { tournamentId: string }
  TournamentBracket: { tournamentId: string; categoryId?: string }
  TournamentRegister: { tournamentId: string }

  // ── Athlete ──────────────────────────
  AthleteProfile: { athleteId: string }
  EditProfile: undefined

  // ── Scoring ──────────────────────────
  LiveScoring: { matchId: string }
  ScoringPanel: { matchId: string; role: 'judge' | 'referee' }

  // ── Admin / Portal ───────────────────
  AdminPortal: undefined
  ClubPortal: undefined
  BTCPortal: undefined

  // ── Settings ─────────────────────────
  Settings: undefined
  LanguageSettings: undefined
  StorageSettings: undefined
  AboutApp: undefined
}

export type ScreenName = keyof RootScreenParams

// ── Screen Groups ────────────────────────────────────────────

/**
 * Logical groupings of screens for authorization checks,
 * navigation guards, and analytics segmentation.
 */
export const screenGroups = {
  auth: ['Login', 'Register', 'ForgotPassword'] as const,
  main: ['Home', 'Tournaments', 'Rankings', 'Notifications', 'Profile'] as const,
  tournament: ['TournamentDetail', 'TournamentResults', 'TournamentBracket', 'TournamentRegister'] as const,
  athlete: ['AthleteProfile', 'EditProfile'] as const,
  scoring: ['LiveScoring', 'ScoringPanel'] as const,
  portal: ['AdminPortal', 'ClubPortal', 'BTCPortal'] as const,
  settings: ['Settings', 'LanguageSettings', 'StorageSettings', 'AboutApp'] as const,
} as const

export type ScreenGroup = keyof typeof screenGroups

/** Get which group a screen belongs to, or null. */
export function getScreenGroup(screen: ScreenName): ScreenGroup | null {
  for (const [group, screens] of Object.entries(screenGroups)) {
    if ((screens as readonly string[]).includes(screen)) return group as ScreenGroup
  }
  return null
}

/** True if the screen is in the auth group (no auth required). */
export function isAuthScreen(screen: ScreenName): boolean {
  return (screenGroups.auth as readonly string[]).includes(screen)
}

/** True if the screen is a main tab screen. */
export function isMainScreen(screen: ScreenName): boolean {
  return (screenGroups.main as readonly string[]).includes(screen)
}

/** True if the screen is a portal/admin screen. */
export function isPortalScreen(screen: ScreenName): boolean {
  return (screenGroups.portal as readonly string[]).includes(screen)
}

// ── Transition Presets ───────────────────────────────────────

/**
 * Screen transition animation presets.
 * Use with React Navigation's `screenOptions`.
 */
export const transitions = {
  /** iOS-style slide from right (default). */
  slideFromRight: {
    animation: 'slide_from_right' as const,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
  },

  /** Slide from bottom (modals). */
  slideFromBottom: {
    animation: 'slide_from_bottom' as const,
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    presentation: 'modal' as const,
  },

  /** Fade transition (tab switches). */
  fade: {
    animation: 'fade' as const,
    gestureEnabled: false,
  },

  /** No animation (instant swap). */
  none: {
    animation: 'none' as const,
    gestureEnabled: false,
  },

  /** Platform-specific default. */
  platformDefault: Platform.select({
    ios: {
      animation: 'slide_from_right' as const,
      gestureEnabled: true,
    },
    android: {
      animation: 'fade_from_bottom' as const,
      gestureEnabled: false,
    },
    default: {
      animation: 'fade' as const,
      gestureEnabled: false,
    },
  }),
}

// ── Screen Tracking ──────────────────────────────────────────

/**
 * Hook for automatic screen tracking.
 * Logs navigation to analytics and crash reporter.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { trackScreen } = useScreenTracking()
 *   return (
 *     <NavigationContainer
 *       onStateChange={() => trackScreen(navRef.current?.getCurrentRoute()?.name)}
 *     />
 *   )
 * }
 * ```
 */
export function useScreenTracking() {
  const routeNameRef = useRef<string>('')
  const analytics = useAnalytics()

  const onStateChange = useCallback(() => {
    // Called by NavigationContainer's onStateChange
  }, [])

  const trackScreen = useCallback(
    (currentRouteName: string | undefined) => {
      if (!currentRouteName) return

      const previousRouteName = routeNameRef.current
      if (currentRouteName !== previousRouteName) {
        analytics.trackScreen(currentRouteName, {
          previousScreen: (previousRouteName || 'launch') as string,
        })

        crashReporter.trackNavigation(
          previousRouteName || 'launch',
          currentRouteName || '',
        )

        routeNameRef.current = currentRouteName
      }
    },
    [analytics],
  )

  return { trackScreen, onStateChange }
}

// ── Navigation Performance ───────────────────────────────────

/**
 * Track navigation transition timing for perf monitoring.
 *
 * @example
 * ```tsx
 * const { lastTransitionMs, avgTransitionMs } = useNavigationTiming()
 * ```
 */
export function useNavigationTiming() {
  const lastChangeRef = useRef<number>(Date.now())
  const durationsRef = useRef<number[]>([])
  const [lastTransitionMs, setLastTransitionMs] = useState<number | null>(null)
  const [avgTransitionMs, setAvgTransitionMs] = useState(0)

  const recordTransition = useCallback(() => {
    const now = Date.now()
    const duration = now - lastChangeRef.current
    lastChangeRef.current = now

    // Ignore sub-10ms (initial mount) and >5s (app resume)
    if (duration < 10 || duration > 5_000) return

    durationsRef.current.push(duration)
    if (durationsRef.current.length > 50) durationsRef.current.shift()

    setLastTransitionMs(duration)
    const avg = durationsRef.current.reduce((a, b) => a + b, 0) / durationsRef.current.length
    setAvgTransitionMs(Math.round(avg))
  }, [])

  return { lastTransitionMs, avgTransitionMs, recordTransition }
}

// ── Navigation State Persistence ─────────────────────────────

const NAV_STATE_KEY = '@vct/navigation/state'
let _AsyncStorage: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> } | null = null

async function getAsyncStorage() {
  if (_AsyncStorage) return _AsyncStorage
  try {
    const mod = await import('@react-native-async-storage/async-storage')
    _AsyncStorage = mod.default ?? mod
    return _AsyncStorage
  } catch {
    return null
  }
}

/**
 * Save navigation state for crash recovery.
 * Call from NavigationContainer's `onStateChange`.
 */
let _saveDebounce: ReturnType<typeof setTimeout> | null = null

export async function saveNavigationState(state: object): Promise<void> {
  // Debounce saves — only persist after 300ms of inactivity
  if (_saveDebounce) clearTimeout(_saveDebounce)
  _saveDebounce = setTimeout(async () => {
    const storage = await getAsyncStorage()
    if (!storage) return
    try {
      await storage.setItem(NAV_STATE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }, 300)
}

/**
 * Load previously saved navigation state.
 * Returns undefined if no state is persisted.
 */
export async function loadNavigationState(): Promise<object | undefined> {
  const storage = await getAsyncStorage()
  if (!storage) return undefined
  try {
    const raw = await storage.getItem(NAV_STATE_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

/** Clear persisted navigation state. */
export async function clearNavigationState(): Promise<void> {
  const storage = await getAsyncStorage()
  if (!storage) return
  try { await storage.removeItem(NAV_STATE_KEY) } catch { /* ignore */ }
}

// ── Deep Link Parsing ────────────────────────────────────────

interface DeepLinkResult {
  screen: ScreenName
  params: Record<string, string>
}

/**
 * URL pattern → screen mapping for deep links.
 * Patterns use `:paramName` syntax.
 */
const DEEP_LINK_PATTERNS: Array<{ pattern: RegExp; screen: ScreenName; paramNames: string[] }> = [
  { pattern: /^\/tournament\/([^/]+)\/bracket(?:\/([^/]+))?$/, screen: 'TournamentBracket', paramNames: ['tournamentId', 'categoryId'] },
  { pattern: /^\/tournament\/([^/]+)\/results$/, screen: 'TournamentResults', paramNames: ['tournamentId'] },
  { pattern: /^\/tournament\/([^/]+)\/register$/, screen: 'TournamentRegister', paramNames: ['tournamentId'] },
  { pattern: /^\/tournament\/([^/]+)$/, screen: 'TournamentDetail', paramNames: ['tournamentId'] },
  { pattern: /^\/athlete\/([^/]+)$/, screen: 'AthleteProfile', paramNames: ['athleteId'] },
  { pattern: /^\/scoring\/([^/]+)\/panel\/([^/]+)$/, screen: 'ScoringPanel', paramNames: ['matchId', 'role'] },
  { pattern: /^\/scoring\/([^/]+)$/, screen: 'LiveScoring', paramNames: ['matchId'] },
  { pattern: /^\/rankings$/, screen: 'Rankings', paramNames: [] },
  { pattern: /^\/profile$/, screen: 'Profile', paramNames: [] },
  { pattern: /^\/settings$/, screen: 'Settings', paramNames: [] },
  { pattern: /^\/admin$/, screen: 'AdminPortal', paramNames: [] },
  { pattern: /^\/club$/, screen: 'ClubPortal', paramNames: [] },
  { pattern: /^\/$/, screen: 'Home', paramNames: [] },
]

/**
 * Parse a deep link URL and return the target screen + params.
 * Returns null if no matching pattern is found.
 *
 * @example
 * ```ts
 * parseDeepLinkParams('vctplatform://tournament/abc123')
 * // => { screen: 'TournamentDetail', params: { tournamentId: 'abc123' } }
 * ```
 */
export function parseDeepLinkParams(url: string): DeepLinkResult | null {
  // Strip scheme + host: "vctplatform://host/path" → "/path"
  let path = url
  const schemeEnd = url.indexOf('://')
  if (schemeEnd !== -1) {
    const afterScheme = url.slice(schemeEnd + 3)
    const pathStart = afterScheme.indexOf('/')
    path = pathStart !== -1 ? afterScheme.slice(pathStart) : '/'
  }

  // Strip query string and hash
  path = path.split('?')[0]!.split('#')[0]!

  for (const { pattern, screen, paramNames } of DEEP_LINK_PATTERNS) {
    const match = path.match(pattern)
    if (match) {
      const params: Record<string, string> = {}
      paramNames.forEach((name, i) => {
        const value = match[i + 1]
        if (value) params[name] = decodeURIComponent(value)
      })
      return { screen, params }
    }
  }

  return null
}

// ── Protected Route Guard ────────────────────────────────────

/**
 * Hook that redirects to Login if user is not authenticated.
 * Use at the top of screens that require authentication.
 *
 * @example
 * ```tsx
 * function ProfileScreen({ navigation }) {
 *   useProtectedRoute({ navigation })
 *   // ... rest of screen
 * }
 * ```
 */
export function useProtectedRoute(options: {
  /** Navigation object from React Navigation */
  navigation?: { reset: (state: { routes: Array<{ name: string }> }) => void }
  /** Screen to redirect to (default: 'Login') */
  redirectTo?: ScreenName
  /** External auth check — return true if authenticated */
  isAuthenticated?: () => boolean | Promise<boolean>
} = {}): { isChecking: boolean } {
  const { navigation, redirectTo = 'Login', isAuthenticated } = options
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        let authed = false
        if (isAuthenticated) {
          authed = await isAuthenticated()
        } else {
          // Default: check auth-storage for token
          try {
            const authStorage = await import('./auth-storage')
            const token = await authStorage.getAccessToken()
            authed = !!token
          } catch {
            authed = false
          }
        }

        if (!cancelled && !authed && navigation) {
          navigation.reset({ routes: [{ name: redirectTo }] })
        }
      } finally {
        if (!cancelled) setIsChecking(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [navigation, redirectTo, isAuthenticated])

  return { isChecking }
}

// ── Android Back Handler ─────────────────────────────────────

/**
 * Hook for custom Android hardware back button behavior.
 *
 * @example
 * ```tsx
 * // Prevent default back:
 * useAndroidBackHandler({ onBack: () => { showExitDialog(); return true } })
 *
 * // Double-tap to exit:
 * useAndroidBackHandler({ exitOnDoubleBack: true })
 * ```
 */
export function useAndroidBackHandler(options: {
  /** Return true to prevent default back behavior */
  onBack?: () => boolean
  /** When true, requires double-tap to exit (with 2s window) */
  exitOnDoubleBack?: boolean
  /** Custom toast message for double-back exit (Vietnamese default) */
  exitMessage?: string
} = {}): void {
  const { onBack, exitOnDoubleBack = false, exitMessage = 'Nhấn thêm lần nữa để thoát' } = options
  const lastBackRef = useRef(0)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const handler = () => {
      // Custom handler takes priority
      if (onBack) return onBack()

      // Double-back-to-exit
      if (exitOnDoubleBack) {
        const now = Date.now()
        if (now - lastBackRef.current < 2_000) {
          // Actually exit
          return false
        }
        lastBackRef.current = now
        // Show toast — use import to avoid crash if ToastAndroid unavailable
        try {
          const { ToastAndroid } = require('react-native')
          ToastAndroid?.show?.(exitMessage, ToastAndroid.SHORT)
        } catch { /* ignore */ }
        return true // Prevent exit
      }

      return false // Default behavior
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', handler)
    return () => subscription.remove()
  }, [onBack, exitOnDoubleBack, exitMessage])
}

// ── Navigation Utilities ─────────────────────────────────────

/** All valid screen names, auto-derived from RootScreenParams. */
const ALL_SCREENS: readonly ScreenName[] = [
  'Login', 'Register', 'ForgotPassword',
  'Home', 'Tournaments', 'Rankings', 'Notifications', 'Profile',
  'TournamentDetail', 'TournamentResults', 'TournamentBracket', 'TournamentRegister',
  'AthleteProfile', 'EditProfile',
  'LiveScoring', 'ScoringPanel',
  'AdminPortal', 'ClubPortal', 'BTCPortal',
  'Settings', 'LanguageSettings', 'StorageSettings', 'AboutApp',
] as const

/**
 * Determine if a screen name is a valid known screen.
 */
export function isValidScreen(name: string): name is ScreenName {
  return (ALL_SCREENS as readonly string[]).includes(name)
}

/**
 * Get screen display name for headers (Vietnamese).
 */
export function getScreenTitle(screen: ScreenName): string {
  const titles: Record<ScreenName, string> = {
    Login: 'Đăng nhập',
    Register: 'Đăng ký',
    ForgotPassword: 'Quên mật khẩu',
    Home: 'Trang chủ',
    Tournaments: 'Giải đấu',
    Rankings: 'Bảng xếp hạng',
    Notifications: 'Thông báo',
    Profile: 'Hồ sơ',
    TournamentDetail: 'Chi tiết giải đấu',
    TournamentResults: 'Kết quả',
    TournamentBracket: 'Bảng đấu',
    TournamentRegister: 'Đăng ký thi đấu',
    AthleteProfile: 'Hồ sơ VĐV',
    EditProfile: 'Chỉnh sửa hồ sơ',
    LiveScoring: 'Chấm điểm trực tiếp',
    ScoringPanel: 'Bảng chấm điểm',
    AdminPortal: 'Quản trị viên',
    ClubPortal: 'Câu lạc bộ',
    BTCPortal: 'Ban Tổ Chức',
    Settings: 'Cài đặt',
    LanguageSettings: 'Ngôn ngữ',
    StorageSettings: 'Bộ nhớ',
    AboutApp: 'Về ứng dụng',
  }
  return titles[screen]
}

/**
 * Get screen display name for English headers.
 */
export function getScreenTitleEn(screen: ScreenName): string {
  const titles: Record<ScreenName, string> = {
    Login: 'Login',
    Register: 'Register',
    ForgotPassword: 'Forgot Password',
    Home: 'Home',
    Tournaments: 'Tournaments',
    Rankings: 'Rankings',
    Notifications: 'Notifications',
    Profile: 'Profile',
    TournamentDetail: 'Tournament Details',
    TournamentResults: 'Results',
    TournamentBracket: 'Bracket',
    TournamentRegister: 'Register for Tournament',
    AthleteProfile: 'Athlete Profile',
    EditProfile: 'Edit Profile',
    LiveScoring: 'Live Scoring',
    ScoringPanel: 'Scoring Panel',
    AdminPortal: 'Admin Portal',
    ClubPortal: 'Club Portal',
    BTCPortal: 'Organizing Committee',
    Settings: 'Settings',
    LanguageSettings: 'Language',
    StorageSettings: 'Storage',
    AboutApp: 'About',
  }
  return titles[screen]
}
