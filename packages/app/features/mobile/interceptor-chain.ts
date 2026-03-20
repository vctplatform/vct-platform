// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Interceptor Chain
// Composable request/response middleware for fetch calls.
// Enhanced with stats, removal, conditional interceptors, and cloning.
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface RequestContext {
  /** Original URL */
  url: string
  /** Request options */
  init: RequestInit
  /** Metadata for downstream interceptors */
  metadata: Record<string, unknown>
  /** Start time for timing */
  startTime: number
}

export interface ResponseContext {
  /** Response object */
  response: Response
  /** Original request context */
  request: RequestContext
  /** Duration in ms */
  durationMs: number
}

/**
 * Request interceptor — modifies outgoing requests.
 * Return modified RequestContext or throw to abort.
 */
export type RequestInterceptor = (
  ctx: RequestContext,
) => RequestContext | Promise<RequestContext>

/**
 * Response interceptor — processes incoming responses.
 * Return modified ResponseContext or throw to abort.
 */
export type ResponseInterceptor = (
  ctx: ResponseContext,
) => ResponseContext | Promise<ResponseContext>

/**
 * Error interceptor — handles fetch errors.
 * Can recover by returning a ResponseContext, or re-throw.
 */
export type ErrorInterceptor = (
  error: Error,
  ctx: RequestContext,
) => ResponseContext | Promise<ResponseContext>

export interface InterceptorProfile {
  name: string
  request: RequestInterceptor[]
  response: ResponseInterceptor[]
  error: ErrorInterceptor[]
}

export interface ChainStats {
  totalRequests: number
  totalErrors: number
  avgLatencyMs: number
  maxLatencyMs: number
  requestInterceptors: number
  responseInterceptors: number
  errorInterceptors: number
}

// ── Interceptor Chain ────────────────────────────────────────

export class InterceptorChain {
  private _requestInterceptors: RequestInterceptor[] = []
  private _responseInterceptors: ResponseInterceptor[] = []
  private _errorInterceptors: ErrorInterceptor[] = []
  private _profiles = new Map<string, InterceptorProfile>()

  // Stats
  private _totalRequests = 0
  private _totalErrors = 0
  private _totalLatencyMs = 0
  private _maxLatencyMs = 0

  // ── Register Interceptors ────────────────────────────────

  /** Add a request interceptor (runs in order added). */
  useRequest(interceptor: RequestInterceptor): this {
    this._requestInterceptors.push(interceptor)
    return this
  }

  /** Add a response interceptor (runs in order added). */
  useResponse(interceptor: ResponseInterceptor): this {
    this._responseInterceptors.push(interceptor)
    return this
  }

  /** Add an error interceptor (first one to return wins). */
  useError(interceptor: ErrorInterceptor): this {
    this._errorInterceptors.push(interceptor)
    return this
  }

  /** Remove a request interceptor by reference. */
  removeRequest(interceptor: RequestInterceptor): this {
    this._requestInterceptors = this._requestInterceptors.filter((i) => i !== interceptor)
    return this
  }

  /** Remove a response interceptor by reference. */
  removeResponse(interceptor: ResponseInterceptor): this {
    this._responseInterceptors = this._responseInterceptors.filter((i) => i !== interceptor)
    return this
  }

  /** Remove an error interceptor by reference. */
  removeError(interceptor: ErrorInterceptor): this {
    this._errorInterceptors = this._errorInterceptors.filter((i) => i !== interceptor)
    return this
  }

  /** Clear all interceptors. */
  clear(): this {
    this._requestInterceptors = []
    this._responseInterceptors = []
    this._errorInterceptors = []
    return this
  }

  /** Clone this chain (for scoped modifications). */
  clone(): InterceptorChain {
    const copy = new InterceptorChain()
    copy._requestInterceptors = [...this._requestInterceptors]
    copy._responseInterceptors = [...this._responseInterceptors]
    copy._errorInterceptors = [...this._errorInterceptors]
    // Copy profiles
    this._profiles.forEach((profile, name) => {
      copy._profiles.set(name, { ...profile })
    })
    return copy
  }

  /** Get chain statistics. */
  get stats(): ChainStats {
    return {
      totalRequests: this._totalRequests,
      totalErrors: this._totalErrors,
      avgLatencyMs: this._totalRequests > 0
        ? Math.round(this._totalLatencyMs / this._totalRequests)
        : 0,
      maxLatencyMs: this._maxLatencyMs,
      requestInterceptors: this._requestInterceptors.length,
      responseInterceptors: this._responseInterceptors.length,
      errorInterceptors: this._errorInterceptors.length,
    }
  }

  // ── Profiles (named presets) ─────────────────────────────

  /** Register a named interceptor profile. */
  registerProfile(
    name: string,
    config: {
      request?: RequestInterceptor[]
      response?: ResponseInterceptor[]
      error?: ErrorInterceptor[]
    },
  ): void {
    this._profiles.set(name, {
      name,
      request: config.request ?? [],
      response: config.response ?? [],
      error: config.error ?? [],
    })
  }

  /** Create a scoped chain with profile interceptors + global interceptors. */
  withProfile(name: string): InterceptorChain {
    const profile = this._profiles.get(name)
    if (!profile) return this

    const scoped = new InterceptorChain()
    // Profile interceptors first, then global
    scoped._requestInterceptors = [
      ...profile.request,
      ...this._requestInterceptors,
    ]
    scoped._responseInterceptors = [
      ...profile.response,
      ...this._responseInterceptors,
    ]
    scoped._errorInterceptors = [
      ...profile.error,
      ...this._errorInterceptors,
    ]
    return scoped
  }

  // ── Execute ──────────────────────────────────────────────

  /**
   * Execute a fetch request through the interceptor chain.
   */
  async fetch(
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    this._totalRequests++

    // Build request context
    let ctx: RequestContext = {
      url,
      init,
      metadata: {},
      startTime: Date.now(),
    }

    // Run request interceptors
    for (const interceptor of this._requestInterceptors) {
      try {
        ctx = await interceptor(ctx)
      } catch (err) {
        this._totalErrors++
        throw err
      }
    }

    try {
      // Execute fetch
      const response = await fetch(ctx.url, ctx.init)
      const durationMs = Date.now() - ctx.startTime

      // Track latency
      this._totalLatencyMs += durationMs
      if (durationMs > this._maxLatencyMs) this._maxLatencyMs = durationMs

      // Build response context
      let resCtx: ResponseContext = {
        response,
        request: ctx,
        durationMs,
      }

      // Run response interceptors
      for (const interceptor of this._responseInterceptors) {
        try {
          resCtx = await interceptor(resCtx)
        } catch (err) {
          this._totalErrors++
          throw err
        }
      }

      return resCtx.response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this._totalErrors++

      // Try error interceptors
      for (const interceptor of this._errorInterceptors) {
        try {
          const recovered = await interceptor(err, ctx)
          return recovered.response
        } catch {
          // This interceptor couldn't handle it, try next
        }
      }

      // No interceptor handled the error
      throw err
    }
  }
}

// ── Pre-built Interceptors ───────────────────────────────────

/** Adds auth token to requests. */
export function authInterceptor(
  getToken: () => Promise<string | null>,
): RequestInterceptor {
  return async (ctx) => {
    const token = await getToken()
    if (token) {
      const headers = new Headers(ctx.init.headers)
      headers.set('Authorization', `Bearer ${token}`)
      ctx.init.headers = Object.fromEntries(headers.entries())
    }
    return ctx
  }
}

/** Adds platform and version headers. */
export function platformInterceptor(appVersion: string): RequestInterceptor {
  return (ctx) => {
    const headers = new Headers(ctx.init.headers)
    headers.set('X-App-Version', appVersion)
    headers.set('X-App-Platform', 'mobile')
    headers.set('Accept', 'application/json')
    ctx.init.headers = Object.fromEntries(headers.entries())
    return ctx
  }
}

/** Logs slow requests (> threshold). */
export function slowRequestInterceptor(
  thresholdMs: number = 3000,
): ResponseInterceptor {
  return (ctx) => {
    if (ctx.durationMs > thresholdMs) {
      console.warn(
        `[Slow Request] ${ctx.request.url} took ${ctx.durationMs}ms (threshold: ${thresholdMs}ms)`,
      )
    }
    return ctx
  }
}

/**
 * Conditional interceptor — only runs if predicate returns true.
 * Useful for feature-flagged or environment-specific interceptors.
 */
export function whenRequest(
  predicate: (ctx: RequestContext) => boolean,
  interceptor: RequestInterceptor,
): RequestInterceptor {
  return (ctx) => {
    if (predicate(ctx)) return interceptor(ctx)
    return ctx
  }
}

export function whenResponse(
  predicate: (ctx: ResponseContext) => boolean,
  interceptor: ResponseInterceptor,
): ResponseInterceptor {
  return (ctx) => {
    if (predicate(ctx)) return interceptor(ctx)
    return ctx
  }
}

// ── Singleton ────────────────────────────────────────────────

export const interceptorChain = new InterceptorChain()

