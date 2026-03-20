// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Feature Flags
// Client-side feature flag service with remote overrides.
// Enhanced with stats, staleness, user targeting, and auto-refresh.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export type FlagValue = boolean | string | number

export interface FeatureFlagDefinition {
  key: string
  defaultValue: FlagValue
  description?: string
}

export interface RemoteFlagConfig {
  flags: Record<string, FlagValue>
  fetchedAt: number
}

export interface FlagEvalStats {
  totalEvaluations: number
  remoteFetches: number
  fetchFailures: number
  staleCacheHits: number
  overrideCount: number
  lastFetchAt: number | null
  lastFetchDurationMs: number | null
}

export type FlagSource = 'default' | 'remote' | 'override'

export interface FlagDebugEntry {
  key: string
  value: FlagValue
  source: FlagSource
  defaultValue: FlagValue
}

export interface UserContext {
  userId: string
  attributes?: Record<string, string | number | boolean>
}

// ── Default Flags ────────────────────────────────────────────

const DEFAULT_FLAGS: Record<string, FlagValue> = {
  // ── Feature Gates ────────────────────
  'scoring.live_enabled': true,
  'scoring.offline_enabled': true,
  'tournament.bracket_auto_seed': false,
  'tournament.live_stream': false,

  // ── UI Experiments ───────────────────
  'ui.new_profile_layout': false,
  'ui.dark_mode_only': false,
  'ui.show_rankings_tab': true,
  'ui.animated_transitions': true,

  // ── Network ──────────────────────────
  'network.retry_count': 3,
  'network.circuit_breaker_threshold': 5,
  'network.request_timeout_ms': 15000,

  // ── Business Rules ───────────────────
  'registration.max_athletes_per_club': 50,
  'registration.require_medical_cert': true,
}

// ── Storage ──────────────────────────────────────────────────

const FLAGS_STORAGE_KEY = 'vct-feature-flags'
const FLAGS_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours cache

// ── Feature Flag Service ─────────────────────────────────────

class FeatureFlagService {
  private _flags: Record<string, FlagValue> = { ...DEFAULT_FLAGS }
  private _remoteFlags: Record<string, FlagValue> = {}
  private _overrides: Record<string, FlagValue> = {}
  private _remoteUrl: string | null = null
  private _listeners = new Map<number, () => void>()
  private _nextListenerId = 1
  private _autoRefreshTimer: ReturnType<typeof setInterval> | null = null
  private _userContext: UserContext | null = null
  private _onFetchError?: (error: Error) => void

  // Stats
  private _totalEvals = 0
  private _remoteFetches = 0
  private _fetchFailures = 0
  private _staleCacheHits = 0
  private _lastFetchAt: number | null = null
  private _lastFetchDurationMs: number | null = null

  /**
   * Initialize with remote config URL.
   * Loads cached flags immediately, then fetches fresh ones.
   */
  async init(remoteUrl?: string): Promise<void> {
    this._remoteUrl = remoteUrl ?? null

    // Load from cache first (instant)
    await this._loadCached()

    // Fetch remote in background
    if (this._remoteUrl) {
      this._fetchRemote().catch(() => {
        // Use cached/defaults on failure
      })
    }
  }

  /** Set user context for targeting. */
  setUserContext(ctx: UserContext): void {
    this._userContext = ctx
  }

  /** Clear user context (logout). */
  clearUserContext(): void {
    this._userContext = null
  }

  /** Set error callback for fetch failures. */
  setOnFetchError(handler: (error: Error) => void): void {
    this._onFetchError = handler
  }

  /** Get a flag value with type safety. */
  get<T extends FlagValue>(key: string, defaultValue?: T): T {
    this._totalEvals++

    // Override > remote > default
    if (key in this._overrides) {
      return this._overrides[key] as T
    }
    const value = this._flags[key]
    if (value === undefined) {
      return (defaultValue ?? DEFAULT_FLAGS[key] ?? false) as T
    }
    return value as T
  }

  /** Check if a boolean flag is enabled. */
  isEnabled(key: string): boolean {
    return this.get<boolean>(key, false)
  }

  /** Override a flag locally (for testing/debugging). */
  setOverride(key: string, value: FlagValue): void {
    this._overrides[key] = value
    this._flags[key] = value
    this._notifyListeners()
  }

  /** Clear a local override. */
  clearOverride(key: string): void {
    delete this._overrides[key]
    this._flags[key] = this._remoteFlags[key] ?? DEFAULT_FLAGS[key] ?? false
    this._notifyListeners()
  }

  /** Clear all overrides and reset to defaults. */
  resetAll(): void {
    this._flags = { ...DEFAULT_FLAGS }
    this._remoteFlags = {}
    this._overrides = {}
    this._notifyListeners()
    AsyncStorage.removeItem(FLAGS_STORAGE_KEY).catch(() => {})
  }

  /** Force refresh from remote. */
  async refresh(): Promise<void> {
    if (this._remoteUrl) {
      await this._fetchRemote()
    }
  }

  /** Check if cached flags are stale (past TTL). */
  isStale(): boolean {
    if (!this._lastFetchAt) return true
    return Date.now() - this._lastFetchAt > FLAGS_TTL_MS
  }

  /** Get all current flags (for debug UI). */
  getAll(): Record<string, FlagValue> {
    return { ...this._flags }
  }

  /** Get detailed debug info for all flags. */
  getDebugInfo(): FlagDebugEntry[] {
    const allKeys = new Set([
      ...Object.keys(DEFAULT_FLAGS),
      ...Object.keys(this._remoteFlags),
      ...Object.keys(this._overrides),
    ])

    return Array.from(allKeys).map((key) => {
      let source: FlagSource = 'default'
      if (key in this._overrides) source = 'override'
      else if (key in this._remoteFlags) source = 'remote'

      return {
        key,
        value: this._flags[key] ?? DEFAULT_FLAGS[key] ?? false,
        source,
        defaultValue: DEFAULT_FLAGS[key] ?? false,
      }
    })
  }

  /** Get evaluation statistics. */
  getStats(): FlagEvalStats {
    return {
      totalEvaluations: this._totalEvals,
      remoteFetches: this._remoteFetches,
      fetchFailures: this._fetchFailures,
      staleCacheHits: this._staleCacheHits,
      overrideCount: Object.keys(this._overrides).length,
      lastFetchAt: this._lastFetchAt,
      lastFetchDurationMs: this._lastFetchDurationMs,
    }
  }

  /** Start auto-refreshing flags at interval. */
  startAutoRefresh(intervalMs: number = FLAGS_TTL_MS / 2): void {
    this.stopAutoRefresh()
    this._autoRefreshTimer = setInterval(() => {
      this.refresh().catch(() => {})
    }, intervalMs)
  }

  /** Stop auto-refresh. */
  stopAutoRefresh(): void {
    if (this._autoRefreshTimer) {
      clearInterval(this._autoRefreshTimer)
      this._autoRefreshTimer = null
    }
  }

  /** Subscribe to flag changes. Returns listener ID. */
  onChange(listener: () => void): number {
    const id = this._nextListenerId++
    this._listeners.set(id, listener)
    return id
  }

  /** Remove listener by ID. */
  removeListener(id: number): void {
    this._listeners.delete(id)
  }

  /** Cleanup — stop auto-refresh and clear listeners. */
  destroy(): void {
    this.stopAutoRefresh()
    this._listeners.clear()
  }

  // ── Private ──────────────────────────────────────────────

  private async _loadCached(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(FLAGS_STORAGE_KEY)
      if (!raw) return

      const cached: RemoteFlagConfig = JSON.parse(raw)
      const age = Date.now() - cached.fetchedAt

      if (age < FLAGS_TTL_MS) {
        this._remoteFlags = cached.flags
        this._flags = { ...DEFAULT_FLAGS, ...cached.flags, ...this._overrides }
        this._lastFetchAt = cached.fetchedAt
      } else {
        this._staleCacheHits++
        // Still use stale data as fallback, but mark as stale
        this._remoteFlags = cached.flags
        this._flags = { ...DEFAULT_FLAGS, ...cached.flags, ...this._overrides }
      }
    } catch {
      // Ignore cache errors
    }
  }

  private async _fetchRemote(): Promise<void> {
    if (!this._remoteUrl) return

    const start = Date.now()
    try {
      const headers: Record<string, string> = { Accept: 'application/json' }

      // Add user context if available
      if (this._userContext) {
        headers['X-User-Id'] = this._userContext.userId
        if (this._userContext.attributes) {
          headers['X-User-Attributes'] = JSON.stringify(this._userContext.attributes)
        }
      }

      const response = await fetch(this._remoteUrl, { headers })

      if (!response.ok) {
        this._fetchFailures++
        return
      }

      const data = await response.json()
      const flags: Record<string, FlagValue> = data.flags ?? data

      // Merge: defaults < remote < overrides
      this._remoteFlags = flags
      this._flags = { ...DEFAULT_FLAGS, ...flags, ...this._overrides }

      this._remoteFetches++
      this._lastFetchAt = Date.now()
      this._lastFetchDurationMs = Date.now() - start

      // Cache
      const config: RemoteFlagConfig = {
        flags,
        fetchedAt: Date.now(),
      }
      await AsyncStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(config))

      this._notifyListeners()
    } catch (err) {
      this._fetchFailures++
      this._lastFetchDurationMs = Date.now() - start
      if (this._onFetchError && err instanceof Error) {
        try { this._onFetchError(err) } catch { /* safe */ }
      }
    }
  }

  private _notifyListeners(): void {
    this._listeners.forEach((fn) => {
      try { fn() } catch { /* safe */ }
    })
  }
}

// ── Singleton ────────────────────────────────────────────────

export const featureFlags = new FeatureFlagService()

// ── React Hooks ──────────────────────────────────────────────

/**
 * React hook for a single feature flag. Re-renders on flag changes.
 */
export function useFeatureFlag<T extends FlagValue>(
  key: string,
  defaultValue?: T,
): T {
  const [value, setValue] = useState<T>(featureFlags.get<T>(key, defaultValue))

  useEffect(() => {
    const id = featureFlags.onChange(() => {
      setValue(featureFlags.get<T>(key, defaultValue))
    })
    return () => featureFlags.removeListener(id)
  }, [key, defaultValue])

  return value
}

/**
 * Hook that returns multiple flags at once.
 */
export function useFeatureFlags(keys: string[]): Record<string, FlagValue> {
  const getValues = useCallback(
    () =>
      keys.reduce<Record<string, FlagValue>>((acc, key) => {
        acc[key] = featureFlags.get(key)
        return acc
      }, {}),
    [keys],
  )

  const [values, setValues] = useState(getValues)

  useEffect(() => {
    const id = featureFlags.onChange(() => {
      setValues(getValues())
    })
    return () => featureFlags.removeListener(id)
  }, [getValues])

  return values
}

/**
 * Hook returning flag stats for debug/monitoring UI.
 */
export function useFlagStats(): FlagEvalStats {
  const [stats, setStats] = useState<FlagEvalStats>(featureFlags.getStats())

  useEffect(() => {
    const id = featureFlags.onChange(() => {
      setStats(featureFlags.getStats())
    })
    return () => featureFlags.removeListener(id)
  }, [])

  return stats
}

