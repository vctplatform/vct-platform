// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Secure Auth Token Storage
// Uses expo-secure-store for sensitive tokens on mobile,
// with AsyncStorage fallback for web/non-sensitive data.
// Enhanced with auth listeners, session metadata, and health checks.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Keys ─────────────────────────────────────────────────────

const KEYS = {
  accessToken: 'vct-access-token',
  refreshToken: 'vct-refresh-token',
  userId: 'vct-user-id',
  userRole: 'vct-user-role',
  tokenExpiry: 'vct-token-expiry',
  loginAt: 'vct-login-at',
  sessionMeta: 'vct-session-meta',
} as const

// ── Storage Abstraction ──────────────────────────────────────

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value)
  } else {
    await SecureStore.setItemAsync(key, value)
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key)
  } else {
    await SecureStore.deleteItemAsync(key)
  }
}

// ── Types ────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export interface StoredUser {
  userId: string
  role: string
}

export interface SessionMetadata {
  loginAt: number
  deviceId?: string
  platform: string
  appVersion?: string
}

export interface AuthHealth {
  hasAccessToken: boolean
  hasRefreshToken: boolean
  isExpired: boolean
  expiresInMs: number | null
  sessionAgeMs: number | null
  tokenAgeMs: number | null
}

export type AuthChangeEvent = 'login' | 'logout' | 'token_refresh'
export type AuthChangeListener = (event: AuthChangeEvent) => void

// ── Auth Change Listeners ────────────────────────────────────

const _authListeners = new Map<number, AuthChangeListener>()
let _nextListenerId = 1

/**
 * Subscribe to auth state changes.
 * Returns an ID for explicit removal.
 */
export function onAuthChange(listener: AuthChangeListener): number {
  const id = _nextListenerId++
  _authListeners.set(id, listener)
  return id
}

/** Remove an auth change listener. */
export function removeAuthListener(id: number): void {
  _authListeners.delete(id)
}

function _notifyAuthChange(event: AuthChangeEvent): void {
  _authListeners.forEach((fn) => {
    try { fn(event) } catch { /* safe */ }
  })
}

// ── Token Operations ─────────────────────────────────────────

/**
 * Save authentication tokens securely.
 * Fires 'login' auth change event.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await secureSet(KEYS.accessToken, tokens.accessToken)

  if (tokens.refreshToken) {
    await secureSet(KEYS.refreshToken, tokens.refreshToken)
  }

  if (tokens.expiresIn) {
    const expiry = Date.now() + tokens.expiresIn * 1000
    await secureSet(KEYS.tokenExpiry, expiry.toString())
  }

  await secureSet(KEYS.loginAt, Date.now().toString())

  _notifyAuthChange('login')
}

/** Retrieve the current access token. */
export async function getAccessToken(): Promise<string | null> {
  return secureGet(KEYS.accessToken)
}

/** Retrieve the refresh token. */
export async function getRefreshToken(): Promise<string | null> {
  return secureGet(KEYS.refreshToken)
}

/** Check if the access token has expired. */
export async function isTokenExpired(): Promise<boolean> {
  const expiry = await secureGet(KEYS.tokenExpiry)
  if (!expiry) return true
  return Date.now() > parseInt(expiry, 10)
}

/** Get time until token expiry in ms (null if no expiry set). */
export async function getTokenExpiresIn(): Promise<number | null> {
  const expiry = await secureGet(KEYS.tokenExpiry)
  if (!expiry) return null
  const remaining = parseInt(expiry, 10) - Date.now()
  return remaining > 0 ? remaining : 0
}

/** Get token age in ms since login. */
export async function getTokenAge(): Promise<number | null> {
  const loginAt = await secureGet(KEYS.loginAt)
  if (!loginAt) return null
  return Date.now() - parseInt(loginAt, 10)
}

// ── User Operations ──────────────────────────────────────────

/** Save user identity info. */
export async function saveUser(user: StoredUser): Promise<void> {
  await secureSet(KEYS.userId, user.userId)
  await secureSet(KEYS.userRole, user.role)
}

/** Retrieve stored user info. */
export async function getStoredUser(): Promise<StoredUser | null> {
  const userId = await secureGet(KEYS.userId)
  const role = await secureGet(KEYS.userRole)
  if (!userId || !role) return null
  return { userId, role }
}

// ── Session Metadata ─────────────────────────────────────────

/** Save session metadata. */
export async function saveSessionMeta(meta: SessionMetadata): Promise<void> {
  await secureSet(KEYS.sessionMeta, JSON.stringify(meta))
}

/** Get session metadata. */
export async function getSessionMeta(): Promise<SessionMetadata | null> {
  try {
    const raw = await secureGet(KEYS.sessionMeta)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ── Token Refresh ────────────────────────────────────────────

/**
 * Refresh the access token using the stored refresh token.
 * Calls the provided endpoint and atomically saves the new tokens.
 * Fires 'token_refresh' auth change event on success.
 */
export async function refreshAccessToken(
  refreshEndpoint: string,
): Promise<boolean> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(refreshEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return false

    const data = await response.json()
    if (!data.access_token) return false

    // Save atomically
    await secureSet(KEYS.accessToken, data.access_token)
    if (data.refresh_token) {
      await secureSet(KEYS.refreshToken, data.refresh_token)
    }
    if (data.expires_in) {
      const expiry = Date.now() + data.expires_in * 1000
      await secureSet(KEYS.tokenExpiry, expiry.toString())
    }

    _notifyAuthChange('token_refresh')
    return true
  } catch {
    return false
  }
}

// ── Logout ───────────────────────────────────────────────────

/** Clear all auth tokens and user data (logout). Fires 'logout' event. */
export async function clearTokens(): Promise<void> {
  const allKeys = Object.values(KEYS)
  await Promise.all(allKeys.map((key) => secureDelete(key)))
  _notifyAuthChange('logout')
}

// ── Health Checks ────────────────────────────────────────────

/** Check if user is authenticated (has a non-expired token). */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken()
  if (!token) return false
  const expired = await isTokenExpired()
  return !expired
}

/** Get comprehensive auth health status. */
export async function getAuthHealth(): Promise<AuthHealth> {
  const [accessToken, refreshToken, expired, expiresIn, tokenAge] =
    await Promise.all([
      getAccessToken(),
      getRefreshToken(),
      isTokenExpired(),
      getTokenExpiresIn(),
      getTokenAge(),
    ])

  const loginAt = await secureGet(KEYS.loginAt)
  const sessionAge = loginAt ? Date.now() - parseInt(loginAt, 10) : null

  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    isExpired: expired,
    expiresInMs: expiresIn,
    sessionAgeMs: sessionAge,
    tokenAgeMs: tokenAge,
  }
}

