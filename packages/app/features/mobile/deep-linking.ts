// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Deep Linking Configuration
// Universal links (iOS) + App Links (Android) + Expo deep links.
// Enhanced with analytics, query params, dynamic routes, and hooks.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { Linking } from 'react-native'
import * as ExpoLinking from 'expo-linking'

// ── Types ────────────────────────────────────────────────────

export interface DeepLinkRoute {
  /** URL pattern to match (e.g., 'tournaments/:id') */
  pattern: string
  /** Screen name to navigate to */
  screen: string
  /** Tab name if nested in tab navigator */
  tab?: string
  /** Parse URL params */
  paramExtractor?: (params: Record<string, string>) => Record<string, unknown>
}

export interface DeepLinkResult {
  screen: string
  params: Record<string, unknown>
  tab?: string
  originalUrl: string
  /** Query parameters from the URL */
  queryParams: Record<string, string>
  /** Timestamp when the link was processed */
  processedAt: number
}

export type DeepLinkAnalyticsCallback = (result: DeepLinkResult) => void

// ── Route Registry ───────────────────────────────────────────

const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
  // Tournaments
  {
    pattern: 'tournaments/:id',
    screen: 'TournamentDetail',
    tab: 'tournaments',
    paramExtractor: (p) => ({ tournamentId: p.id }),
  },
  {
    pattern: 'tournaments',
    screen: 'Tournaments',
    tab: 'tournaments',
  },

  // Athletes
  {
    pattern: 'athletes/:id',
    screen: 'AthleteProfile',
    paramExtractor: (p) => ({ athleteId: p.id }),
  },

  // Rankings
  {
    pattern: 'rankings',
    screen: 'Rankings',
    tab: 'rankings',
  },

  // Notifications
  {
    pattern: 'notifications',
    screen: 'Notifications',
    tab: 'notifications',
  },

  // Profile
  {
    pattern: 'profile',
    screen: 'Profile',
    tab: 'profile',
  },
  {
    pattern: 'profile/edit',
    screen: 'EditProfile',
  },

  // Scoring
  {
    pattern: 'scoring/:matchId',
    screen: 'LiveScoring',
    paramExtractor: (p) => ({ matchId: p.matchId }),
  },

  // Results
  {
    pattern: 'results/:tournamentId',
    screen: 'TournamentResults',
    paramExtractor: (p) => ({ tournamentId: p.tournamentId }),
  },

  // Clubs
  {
    pattern: 'clubs/:id',
    screen: 'ClubDetail',
    paramExtractor: (p) => ({ clubId: p.id }),
  },
]

// ── Analytics ────────────────────────────────────────────────

let _analyticsCallback: DeepLinkAnalyticsCallback | null = null

/** Register a callback for deep link analytics tracking. */
export function onDeepLinkOpen(callback: DeepLinkAnalyticsCallback): () => void {
  _analyticsCallback = callback
  return () => { _analyticsCallback = null }
}

// ── Dynamic Route Management ─────────────────────────────────

/** Register a new deep link route at runtime. */
export function registerRoute(route: DeepLinkRoute): void {
  // Avoid duplicates
  const existing = DEEP_LINK_ROUTES.findIndex((r) => r.pattern === route.pattern)
  if (existing >= 0) {
    DEEP_LINK_ROUTES[existing] = route
  } else {
    DEEP_LINK_ROUTES.push(route)
  }
}

/** Remove a deep link route by pattern. */
export function removeRoute(pattern: string): void {
  const idx = DEEP_LINK_ROUTES.findIndex((r) => r.pattern === pattern)
  if (idx >= 0) DEEP_LINK_ROUTES.splice(idx, 1)
}

/** List all registered routes (for debugging). */
export function listRoutes(): ReadonlyArray<DeepLinkRoute> {
  return DEEP_LINK_ROUTES
}

// ── Deep Link Config ─────────────────────────────────────────

/**
 * Full deep link configuration for React Navigation.
 *
 * Supports:
 * - Custom scheme: `vctplatform://tournaments/123`
 * - Universal links: `https://vct-platform.com/tournaments/123`
 * - Expo links: `exp://localhost:8081/--/tournaments/123`
 */
export const deepLinkConfig = {
  prefixes: [
    ExpoLinking.createURL('/'),
    'vctplatform://',
    'https://vct-platform.com',
    'https://www.vct-platform.com',
  ],

  config: {
    screens: buildScreenConfig(),
  },
}

function buildScreenConfig(): Record<string, string | { path: string }> {
  const screens: Record<string, string | { path: string }> = {
    home: '',
  }

  for (const route of DEEP_LINK_ROUTES) {
    screens[route.screen] = route.pattern
  }

  return screens
}

// ── Deep Link Handler ────────────────────────────────────────

/**
 * Validate a deep link URL before processing.
 * Prevents malicious URLs from being handled.
 */
export function validateDeepLink(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedProtocols = ['https:', 'vctplatform:', 'exp:']
    if (!allowedProtocols.includes(parsed.protocol)) return false

    // Block suspicious patterns
    if (parsed.hostname.includes('..') || parsed.pathname.includes('..')) return false

    return true
  } catch {
    return false
  }
}

/**
 * Parse and handle a deep link URL.
 * Now includes query param extraction and analytics tracking.
 */
export function handleDeepLink(url: string): DeepLinkResult | null {
  // Validate first
  if (!validateDeepLink(url)) return null

  try {
    const parsed = ExpoLinking.parse(url)
    const path = parsed.path ?? ''

    // Extract query params
    const queryParams: Record<string, string> = {}
    if (parsed.queryParams) {
      for (const [key, value] of Object.entries(parsed.queryParams)) {
        if (typeof value === 'string') {
          queryParams[key] = value
        }
      }
    }

    for (const route of DEEP_LINK_ROUTES) {
      const match = matchPattern(route.pattern, path)
      if (match) {
        const params = route.paramExtractor
          ? route.paramExtractor(match)
          : match

        const result: DeepLinkResult = {
          screen: route.screen,
          params: { ...params, ...queryParams },
          tab: route.tab,
          originalUrl: url,
          queryParams,
          processedAt: Date.now(),
        }

        // Fire analytics
        if (_analyticsCallback) {
          try { _analyticsCallback(result) } catch { /* safe */ }
        }

        return result
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Match URL path against a route pattern.
 * Returns extracted params or null.
 */
function matchPattern(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = path.replace(/^\//, '').split('/')

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!
    const pathPart = pathParts[i]!

    if (pp.startsWith(':')) {
      // Dynamic param
      params[pp.slice(1)] = pathPart
    } else if (pp !== pathPart) {
      return null
    }
  }

  return params
}

// ── Build Deep Links ─────────────────────────────────────────

/**
 * Build a deep link URL for sharing or push notification targets.
 * Uses custom scheme (vctplatform://).
 */
export function buildDeepLink(
  screen: string,
  params: Record<string, string> = {},
): string {
  const route = DEEP_LINK_ROUTES.find((r) => r.screen === screen)
  if (!route) return `vctplatform://`

  let path = route.pattern
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value)
  }

  return `vctplatform://${path}`
}

/**
 * Build a universal link (HTTPS) for sharing via email, social, etc.
 * Universal links open in-app on iOS/Android when configured.
 */
export function buildUniversalLink(
  screen: string,
  params: Record<string, string> = {},
  queryParams: Record<string, string> = {},
): string {
  const route = DEEP_LINK_ROUTES.find((r) => r.screen === screen)
  if (!route) return 'https://vct-platform.com'

  let path = route.pattern
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, encodeURIComponent(value))
  }

  const url = new URL(`https://vct-platform.com/${path}`)
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}

/**
 * Get the initial deep link that opened the app (cold start).
 */
export async function getInitialDeepLink(): Promise<DeepLinkResult | null> {
  try {
    const url = await Linking.getInitialURL()
    if (!url) return null
    return handleDeepLink(url)
  } catch {
    return null
  }
}

// ── React Hook ───────────────────────────────────────────────

/**
 * Hook that listens for incoming deep links and calls handler.
 * Automatically handles both cold start and warm deep links.
 */
export function useDeepLinkHandler(
  handler: (result: DeepLinkResult) => void,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    // Handle cold start
    getInitialDeepLink().then((result) => {
      if (result) handlerRef.current(result)
    })

    // Handle warm links
    const sub = Linking.addEventListener('url', ({ url }) => {
      const result = handleDeepLink(url)
      if (result) handlerRef.current(result)
    })

    return () => sub.remove()
  }, [])
}

