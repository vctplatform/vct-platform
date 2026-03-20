// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Crash Reporter
// Provider-agnostic crash reporting that integrates device info,
// request logger, auth state, and breadcrumbs.
// Ready to plug into Sentry, Crashlytics, or custom backend.
// ═══════════════════════════════════════════════════════════════

import { getDeviceContext, getDeviceSummary } from './device-info'
import { requestLogger } from './request-logger'
import { getAuthHealth, type AuthHealth } from './auth-storage'
import { appLifecycle } from './app-lifecycle'

// ── Types ────────────────────────────────────────────────────

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info'

export interface Breadcrumb {
  timestamp: number
  category: string
  message: string
  level: SeverityLevel
  data?: Record<string, unknown>
}

export interface CrashReport {
  /** Unique crash ID */
  id: string
  /** Timestamp */
  timestamp: string
  /** Severity */
  severity: SeverityLevel
  /** Error message */
  message: string
  /** Stack trace (if available) */
  stack: string | null
  /** Component/screen where crash occurred */
  componentName: string | null
  /** Device context */
  device: ReturnType<typeof getDeviceContext>
  /** Auth health at crash time */
  auth: AuthHealth | null
  /** Recent breadcrumbs */
  breadcrumbs: Breadcrumb[]
  /** Recent API request log (last 10) */
  recentRequests: string
  /** App session info */
  session: {
    durationMs: number
    resumeCount: number
    backgroundTimeMs: number
  }
  /** Custom tags */
  tags: Record<string, string>
}

export interface CrashReporterConfig {
  /** Enable reporting (default: !__DEV__) */
  enabled: boolean
  /** Max breadcrumbs to keep (default: 50) */
  maxBreadcrumbs: number
  /** Custom report handler — send to Sentry, Crashlytics, etc. */
  onReport?: (report: CrashReport) => Promise<void>
  /** Custom before-send hook — return false to skip */
  beforeSend?: (report: CrashReport) => boolean
}

// ── Reporter ─────────────────────────────────────────────────

const DEFAULT_CONFIG: CrashReporterConfig = {
  enabled: typeof __DEV__ !== 'undefined' ? !__DEV__ : true,
  maxBreadcrumbs: 50,
}

class CrashReporter {
  private _config: CrashReporterConfig
  private _breadcrumbs: Breadcrumb[] = []
  private _tags: Record<string, string> = {}

  constructor(config: Partial<CrashReporterConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }
  }

  /** Configure at app startup. */
  configure(config: Partial<CrashReporterConfig>): void {
    this._config = { ...this._config, ...config }
  }

  /** Set a persistent tag (e.g., user ID, role, screen). */
  setTag(key: string, value: string): void {
    this._tags[key] = value
  }

  /** Remove a tag. */
  removeTag(key: string): void {
    delete this._tags[key]
  }

  /** Add a breadcrumb (navigation, user action, API call). */
  addBreadcrumb(
    category: string,
    message: string,
    level: SeverityLevel = 'info',
    data?: Record<string, unknown>,
  ): void {
    this._breadcrumbs.push({
      timestamp: Date.now(),
      category,
      message,
      level,
      data,
    })

    // Ring buffer
    while (this._breadcrumbs.length > this._config.maxBreadcrumbs) {
      this._breadcrumbs.shift()
    }
  }

  /**
   * Report an error.
   *
   * @example
   * ```ts
   * try {
   *   await submitScore(data)
   * } catch (err) {
   *   crashReporter.captureError(err as Error, 'ScoringScreen')
   * }
   * ```
   */
  async captureError(
    error: Error,
    componentName?: string,
    severity: SeverityLevel = 'error',
  ): Promise<void> {
    if (!this._config.enabled) {
      console.error('[CrashReporter]', error.message, error.stack)
      return
    }

    const report = await this._buildReport(error, componentName, severity)

    // Before-send hook
    if (this._config.beforeSend && !this._config.beforeSend(report)) {
      return
    }

    // Send to provider
    if (this._config.onReport) {
      try {
        await this._config.onReport(report)
      } catch {
        console.error('[CrashReporter] Failed to send report')
      }
    } else {
      // Default: console output
      console.error(`[CRASH] ${report.severity.toUpperCase()}: ${report.message}`)
      console.error(`[CRASH] Device: ${getDeviceSummary()}`)
      console.error(`[CRASH] Breadcrumbs: ${report.breadcrumbs.length}`)
    }
  }

  /** Capture a non-error message (warning, info). */
  async captureMessage(
    message: string,
    severity: SeverityLevel = 'warning',
  ): Promise<void> {
    const error = new Error(message)
    error.stack = undefined
    await this.captureError(error, undefined, severity)
  }

  /** Navigation breadcrumb shorthand. */
  trackNavigation(from: string, to: string): void {
    this.addBreadcrumb('navigation', `${from} → ${to}`)
    this.setTag('screen', to)
  }

  /** User action breadcrumb shorthand. */
  trackAction(action: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb('user', action, 'info', data)
  }

  /** Get recent breadcrumbs (for debug UI). */
  getBreadcrumbs(): ReadonlyArray<Breadcrumb> {
    return this._breadcrumbs
  }

  /** Clear breadcrumbs. */
  clearBreadcrumbs(): void {
    this._breadcrumbs = []
  }

  // ── Private ──────────────────────────────────────────────

  private async _buildReport(
    error: Error,
    componentName: string | undefined,
    severity: SeverityLevel,
  ): Promise<CrashReport> {
    let auth: AuthHealth | null = null
    try {
      auth = await getAuthHealth()
    } catch { /* ignore */ }

    const session = appLifecycle.session

    return {
      id: `crash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      message: error.message,
      stack: error.stack ?? null,
      componentName: componentName ?? null,
      device: getDeviceContext(),
      auth,
      breadcrumbs: [...this._breadcrumbs],
      recentRequests: requestLogger.export(),
      session: {
        durationMs: session.durationMs,
        resumeCount: session.resumeCount,
        backgroundTimeMs: session.backgroundTimeMs,
      },
      tags: { ...this._tags },
    }
  }
}

// ── Singleton ────────────────────────────────────────────────

export const crashReporter = new CrashReporter()
