// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Config Manager (v2)
// Environment-based configuration with remote override support
// and event emitter for real-time config updates.
// ═══════════════════════════════════════════════════════════════

import Constants from 'expo-constants'

// ── Types ────────────────────────────────────────────────────

export type Environment = 'development' | 'staging' | 'production'

export interface AppConfig {
  // ── API ──────────────────────────────
  apiBaseUrl: string
  wsBaseUrl: string
  apiTimeout: number

  // ── Auth ─────────────────────────────
  tokenRefreshEndpoint: string
  tokenRefreshThresholdMs: number

  // ── Features ─────────────────────────
  enableCrashReporting: boolean
  enableAnalytics: boolean
  enablePerformanceMonitoring: boolean
  enableSSLPinning: boolean
  enableBiometric: boolean

  // ── Cache ────────────────────────────
  imageCacheTtlMs: number
  featureFlagRefreshMs: number

  // ── Logging ──────────────────────────
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  requestLogMaxEntries: number

  // ── Scoring ──────────────────────────
  scoringHeartbeatMs: number
  scoringReconnectAttempts: number
}

// ── Environment Configs ──────────────────────────────────────

const configs: Record<Environment, AppConfig> = {
  development: {
    apiBaseUrl: 'http://localhost:8080',
    wsBaseUrl: 'ws://localhost:8080/ws',
    apiTimeout: 30000,
    tokenRefreshEndpoint: '/api/v1/auth/refresh',
    tokenRefreshThresholdMs: 5 * 60 * 1000,
    enableCrashReporting: false,
    enableAnalytics: false,
    enablePerformanceMonitoring: true,
    enableSSLPinning: false,
    enableBiometric: false,
    imageCacheTtlMs: 1 * 60 * 60 * 1000,
    featureFlagRefreshMs: 1 * 60 * 1000,
    logLevel: 'debug',
    requestLogMaxEntries: 500,
    scoringHeartbeatMs: 5000,
    scoringReconnectAttempts: 20,
  },

  staging: {
    apiBaseUrl: 'https://staging-api.vct-platform.com',
    wsBaseUrl: 'wss://staging-api.vct-platform.com/ws',
    apiTimeout: 20000,
    tokenRefreshEndpoint: '/api/v1/auth/refresh',
    tokenRefreshThresholdMs: 10 * 60 * 1000,
    enableCrashReporting: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableSSLPinning: true,
    enableBiometric: true,
    imageCacheTtlMs: 12 * 60 * 60 * 1000,
    featureFlagRefreshMs: 15 * 60 * 1000,
    logLevel: 'info',
    requestLogMaxEntries: 200,
    scoringHeartbeatMs: 15000,
    scoringReconnectAttempts: 10,
  },

  production: {
    apiBaseUrl: 'https://api.vct-platform.com',
    wsBaseUrl: 'wss://api.vct-platform.com/ws',
    apiTimeout: 15000,
    tokenRefreshEndpoint: '/api/v1/auth/refresh',
    tokenRefreshThresholdMs: 10 * 60 * 1000,
    enableCrashReporting: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableSSLPinning: true,
    enableBiometric: true,
    imageCacheTtlMs: 24 * 60 * 60 * 1000,
    featureFlagRefreshMs: 4 * 60 * 60 * 1000,
    logLevel: 'warn',
    requestLogMaxEntries: 200,
    scoringHeartbeatMs: 30000,
    scoringReconnectAttempts: 10,
  },
}

// ── Config Manager ───────────────────────────────────────────

export type ConfigChangeListener = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void

class ConfigManager {
  private _env: Environment
  private _overrides: Partial<AppConfig> = {}
  private _listeners: Set<ConfigChangeListener> = new Set()

  constructor() {
    this._env = this._detectEnvironment()
  }

  /** Current environment. */
  get environment(): Environment {
    return this._env
  }

  /** Whether in development mode. */
  get isDev(): boolean {
    return this._env === 'development'
  }

  /** Whether in production mode. */
  get isProd(): boolean {
    return this._env === 'production'
  }

  /** Get a config value. Overrides take precedence. */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (key in this._overrides) return this._overrides[key] as AppConfig[K]
    return configs[this._env][key]
  }

  /** Get the full current config. */
  getAll(): AppConfig {
    return { ...configs[this._env], ...this._overrides }
  }

  /** Override a config value at runtime (e.g., from feature flags). */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    if (this._overrides[key] !== value) {
      this._overrides[key] = value
      this._notifyListeners(key, value)
    }
  }

  /** Set environment explicitly. */
  setEnvironment(env: Environment): void {
    if (this._env !== env) {
      this._env = env
      // Notify all keys changed if moving envs
      const allKeys = Object.keys(configs[env]) as Array<keyof AppConfig>
      allKeys.forEach((key) => {
        this._notifyListeners(key, this.get(key))
      })
    }
  }

  /** Reset all runtime overrides. */
  resetOverrides(): void {
    const keys = Object.keys(this._overrides) as Array<keyof AppConfig>
    this._overrides = {}
    keys.forEach((key) => {
      this._notifyListeners(key, this.get(key))
    })
  }

  /** Get config summary for diagnostics. */
  getSummary(): string {
    const c = this.getAll()
    return [
      `env=${this._env}`,
      `api=${c.apiBaseUrl}`,
      `timeout=${c.apiTimeout}ms`,
      `log=${c.logLevel}`,
      `crash=${c.enableCrashReporting}`,
      `ssl=${c.enableSSLPinning}`,
    ].join(' | ')
  }

  // ── Remote Config ──────────────────────────────────────────

  /** Fetch configuration overrides from the remote server. */
  async fetchRemoteConfig(): Promise<void> {
    try {
      // Lazy load to avoid circular dependencies
      await import('./api-client')
      // NOTE: Using a hypothetical endpoint for remote config mapping logic.
      // E.g., /api/v1/config/mobile
      const response = await fetch(`${this.get('apiBaseUrl')}/api/v1/config/mobile`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) return
      
      const remoteOverrides = await response.json() as Partial<AppConfig>
      
      // Apply new remote overrides
      Object.entries(remoteOverrides).forEach(([key, value]) => {
        this.set(key as keyof AppConfig, value as any)
      })
    } catch {
      // Best effort remote config — silently ignore failure (e.g. offline)
    }
  }

  // ── Listeners ──────────────────────────────────────────────

  /** Subscribe to config changes. Returns unsubscribe function. */
  onChange(listener: ConfigChangeListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  private _notifyListeners<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this._listeners.forEach((listener) => {
      try { listener(key, value) } catch { /* ignore listener errors */ }
    })
  }

  // ── Private ──────────────────────────────────────────────

  private _detectEnvironment(): Environment {
    const channel = (Constants.expoConfig?.extra as any)?.releaseChannel ?? ''
    if (channel.includes('prod')) return 'production'
    if (channel.includes('stag')) return 'staging'

    if (typeof __DEV__ !== 'undefined' && __DEV__) return 'development'

    const profile = (Constants.expoConfig?.extra as any)?.eas?.buildProfile ?? ''
    if (profile === 'production') return 'production'
    if (profile === 'preview') return 'staging'

    return 'development'
  }
}

// ── Singleton ────────────────────────────────────────────────

export const configManager = new ConfigManager()
