// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Request Logger
// Structured logging for API requests with request ID correlation.
// Enhanced with performance metrics, export, and error aggregation.
// ═══════════════════════════════════════════════════════════════

import type { RequestContext, ResponseContext, RequestInterceptor, ResponseInterceptor } from './interceptor-chain'

// ── Types ────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface RequestLogEntry {
  timestamp: string
  level: LogLevel
  requestId: string
  method: string
  url: string
  status?: number
  durationMs?: number
  error?: string
  metadata?: Record<string, unknown>
}

export interface RequestLoggerConfig {
  /** Enable logging (default: __DEV__) */
  enabled: boolean
  /** Minimum log level (default: 'info') */
  minLevel: LogLevel
  /** Log slow requests above this threshold (ms) */
  slowThresholdMs: number
  /** Max log entries kept in memory (ring buffer) */
  maxEntries: number
  /** Custom log handler */
  onLog?: (entry: RequestLogEntry) => void
  /** Callback when error rate exceeds threshold */
  onHighErrorRate?: (rate: number, window: number) => void
  /** Error rate threshold (default: 0.5 = 50%) */
  errorRateThreshold: number
}

export interface RequestLogStats {
  totalRequests: number
  totalErrors: number
  errorRate: number
  avgLatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  slowRequests: number
  entriesInBuffer: number
}

// ── Logger ───────────────────────────────────────────────────

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const DEFAULT_CONFIG: RequestLoggerConfig = {
  enabled: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  minLevel: 'info',
  slowThresholdMs: 3000,
  maxEntries: 200,
  errorRateThreshold: 0.5,
}

class RequestLogger {
  private _config: RequestLoggerConfig
  private _entries: RequestLogEntry[] = []
  private _totalRequests = 0
  private _totalErrors = 0
  private _latencies: number[] = []

  constructor(config: Partial<RequestLoggerConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }
  }

  /** Update config at runtime. */
  configure(config: Partial<RequestLoggerConfig>): void {
    this._config = { ...this._config, ...config }
  }

  /** Log a request event. */
  log(entry: Omit<RequestLogEntry, 'timestamp'>): void {
    if (!this._config.enabled) return
    if (LOG_LEVELS[entry.level] < LOG_LEVELS[this._config.minLevel]) return

    const full: RequestLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    // Ring buffer — drop oldest when full
    if (this._entries.length >= this._config.maxEntries) {
      this._entries.splice(0, Math.floor(this._config.maxEntries * 0.1))
    }
    this._entries.push(full)

    // Track metrics
    this._totalRequests++
    if (entry.status && entry.status >= 400) {
      this._totalErrors++
    }
    if (entry.durationMs !== undefined) {
      this._latencies.push(entry.durationMs)
      // Keep latencies buffer bounded
      if (this._latencies.length > 1000) {
        this._latencies.splice(0, 500)
      }
    }

    // Check error rate
    if (this._totalRequests > 10) {
      const errorRate = this._totalErrors / this._totalRequests
      if (errorRate > this._config.errorRateThreshold) {
        this._config.onHighErrorRate?.(errorRate, this._totalRequests)
      }
    }

    // Custom handler
    this._config.onLog?.(full)

    // Console output
    const prefix = `[API ${entry.method} ${entry.status ?? '→'}]`
    const duration = entry.durationMs ? ` ${entry.durationMs}ms` : ''
    const msg = `${prefix} ${entry.url}${duration}`

    switch (entry.level) {
      case 'debug':
        if (__DEV__) console.warn(`🐛 ${msg}`)
        break
      case 'info':
        if (__DEV__) console.warn(`📡 ${msg}`)
        break
      case 'warn':
        console.warn(`⚠️ ${msg}`)
        break
      case 'error':
        console.error(`❌ ${msg} — ${entry.error}`)
        break
    }
  }

  /** Get all log entries (for debug UI). */
  getEntries(): ReadonlyArray<RequestLogEntry> {
    return this._entries
  }

  /** Get entries filtered by level. */
  getByLevel(level: LogLevel): RequestLogEntry[] {
    const minLevel = LOG_LEVELS[level]
    return this._entries.filter((e) => LOG_LEVELS[e.level] >= minLevel)
  }

  /** Get recent errors (for crash reports). */
  getErrors(limit = 20): RequestLogEntry[] {
    return this._entries.filter((e) => e.level === 'error').slice(-limit)
  }

  /** Get slow requests above threshold. */
  getSlowRequests(): RequestLogEntry[] {
    return this._entries.filter(
      (e) => e.durationMs !== undefined && e.durationMs > this._config.slowThresholdMs
    )
  }

  /** Get aggregate performance stats. */
  getStats(): RequestLogStats {
    const sorted = [...this._latencies].sort((a, b) => a - b)
    const len = sorted.length

    const avg = len > 0 ? sorted.reduce((sum, v) => sum + v, 0) / len : 0
    const p95 = len > 0 ? sorted[Math.floor(len * 0.95)] ?? 0 : 0
    const p99 = len > 0 ? sorted[Math.floor(len * 0.99)] ?? 0 : 0

    return {
      totalRequests: this._totalRequests,
      totalErrors: this._totalErrors,
      errorRate: this._totalRequests > 0 ? this._totalErrors / this._totalRequests : 0,
      avgLatencyMs: Math.round(avg),
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      slowRequests: this.getSlowRequests().length,
      entriesInBuffer: this._entries.length,
    }
  }

  /** Export entries as JSON string (for crash report attachment). */
  export(): string {
    return JSON.stringify({
      stats: this.getStats(),
      recentErrors: this.getErrors(10),
      entries: this._entries.slice(-50),
    })
  }

  /** Clear all entries and reset stats. */
  clear(): void {
    this._entries = []
    this._latencies = []
    this._totalRequests = 0
    this._totalErrors = 0
  }

  /** Create request interceptor for logging outgoing requests. */
  requestInterceptor(): RequestInterceptor {
    return (ctx: RequestContext) => {
      const requestId =
        (ctx.init.headers as Record<string, string>)?.['X-Request-ID'] ?? 'unknown'
      const method = ctx.init.method ?? 'GET'

      this.log({
        level: 'debug',
        requestId,
        method,
        url: ctx.url,
      })

      ctx.metadata._requestId = requestId
      ctx.metadata._method = method
      return ctx
    }
  }

  /** Create response interceptor for logging responses. */
  responseInterceptor(): ResponseInterceptor {
    return (ctx: ResponseContext) => {
      const requestId = (ctx.request.metadata._requestId as string) ?? 'unknown'
      const method = (ctx.request.metadata._method as string) ?? 'GET'
      const { durationMs } = ctx
      const { status } = ctx.response

      let level: LogLevel = 'info'
      if (status >= 500) level = 'error'
      else if (status >= 400) level = 'warn'
      else if (durationMs > this._config.slowThresholdMs) level = 'warn'

      this.log({
        level,
        requestId,
        method,
        url: ctx.request.url,
        status,
        durationMs,
        error: status >= 400 ? `HTTP ${status}` : undefined,
        metadata: durationMs > this._config.slowThresholdMs ? { slow: true } : undefined,
      })

      return ctx
    }
  }
}

// ── Singleton ────────────────────────────────────────────────

export const requestLogger = new RequestLogger()

