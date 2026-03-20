// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — API Version Interceptor
// Reads backend versioning headers (X-API-Version, X-API-Status,
// Deprecation, Sunset, X-API-Warn) and notifies the app.
// Mirrors backend/internal/apiversioning/versioning.go
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type ApiVersionStatus = 'active' | 'deprecated' | 'sunset' | 'unknown'

export interface ApiVersionInfo {
  version: string
  status: ApiVersionStatus
  deprecatedAt: string | null
  sunsetAt: string | null
  warning: string | null
  successorLink: string | null
}

export type VersionEventType =
  | 'version_deprecated'
  | 'version_sunset'
  | 'version_warning'

export type VersionListener = (
  event: VersionEventType,
  info: ApiVersionInfo,
) => void

// ── Interceptor ──────────────────────────────────────────────

class ApiVersionInterceptor {
  private _listeners: VersionListener[] = []
  private _lastWarning: string | null = null
  private _suppressUntil = 0

  /**
   * Process response headers from backend.
   * Call this after every API response.
   */
  intercept(response: Response): ApiVersionInfo {
    const info: ApiVersionInfo = {
      version: response.headers.get('X-API-Version') ?? 'unknown',
      status: (response.headers.get('X-API-Status') as ApiVersionStatus) ?? 'unknown',
      deprecatedAt: response.headers.get('Deprecation'),
      sunsetAt: response.headers.get('Sunset'),
      warning: response.headers.get('X-API-Warn'),
      successorLink: response.headers.get('Link'),
    }

    // Emit events based on status
    if (info.status === 'sunset') {
      this._emit('version_sunset', info)
    } else if (info.status === 'deprecated') {
      // Only emit once per warning message (avoid spam)
      if (info.warning && info.warning !== this._lastWarning) {
        this._lastWarning = info.warning
        this._emit('version_deprecated', info)
      }
    }

    if (info.warning && Date.now() > this._suppressUntil) {
      this._emit('version_warning', info)
    }

    return info
  }

  /**
   * Subscribe to version events.
   * Returns unsubscribe function.
   */
  onVersionEvent(listener: VersionListener): () => void {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((fn) => fn !== listener)
    }
  }

  /**
   * Suppress warnings for a duration (e.g., after user dismisses alert).
   */
  suppressWarnings(durationMs: number = 24 * 60 * 60 * 1000): void {
    this._suppressUntil = Date.now() + durationMs
  }

  /**
   * Get request headers to send API version info.
   * Add these to every outgoing request.
   */
  getRequestHeaders(appVersion: string): Record<string, string> {
    return {
      'X-API-Version': 'v1',
      'X-App-Version': appVersion,
      'X-App-Platform': 'mobile',
    }
  }

  private _emit(event: VersionEventType, info: ApiVersionInfo): void {
    this._listeners.forEach((fn) => fn(event, info))
  }
}

// Singleton
export const apiVersionInterceptor = new ApiVersionInterceptor()
