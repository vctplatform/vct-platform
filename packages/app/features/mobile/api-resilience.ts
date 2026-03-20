// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile API Resilience
// Client-side retry, circuit breaker, and timeout for API calls.
// Mirrors backend/internal/circuitbreaker/breaker.go patterns.
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  maxRetries: number
  /** Base delay in ms (default: 1000) */
  baseDelay: number
  /** Max delay cap in ms (default: 30000) */
  maxDelay: number
  /** Jitter factor 0–1 (default: 0.2) */
  jitter: number
  /** HTTP status codes that should trigger retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatuses: number[]
}

export interface CircuitBreakerConfig {
  /** Failures before opening (default: 5) */
  failureThreshold: number
  /** Successes in half-open before closing (default: 2) */
  successThreshold: number
  /** Time in open state before half-open (ms, default: 30000) */
  timeout: number
  /** Sliding window for failure counting (ms, default: 60000) */
  windowSize: number
}

export interface ResilientFetchConfig {
  /** Request timeout in ms (default: 15000) */
  requestTimeout: number
  /** Retry configuration */
  retry: RetryConfig
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig
  /** Called on state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void
  /** Called on each retry attempt */
  onRetry?: (attempt: number, delay: number, error: Error) => void
}

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  jitter: 0.2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30_000,
  windowSize: 60_000,
}

const DEFAULT_CONFIG: ResilientFetchConfig = {
  requestTimeout: 15_000,
  retry: DEFAULT_RETRY,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER,
}

// ── Circuit Breaker ──────────────────────────────────────────

interface WindowEntry {
  at: number
  failed: boolean
}

class ClientCircuitBreaker {
  private state: CircuitState = 'closed'
  private successes = 0
  private lastFailTime = 0
  private window: WindowEntry[] = []
  private config: CircuitBreakerConfig
  private onStateChange?: (from: CircuitState, to: CircuitState) => void

  constructor(
    config: CircuitBreakerConfig,
    onStateChange?: (from: CircuitState, to: CircuitState) => void,
  ) {
    this.config = config
    this.onStateChange = onStateChange
  }

  get currentState(): CircuitState {
    if (
      this.state === 'open' &&
      Date.now() - this.lastFailTime > this.config.timeout
    ) {
      return 'half-open'
    }
    return this.state
  }

  canExecute(): boolean {
    const state = this.currentState
    if (state === 'closed' || state === 'half-open') {
      if (state === 'half-open' && this.state === 'open') {
        this.setState('half-open')
      }
      return true
    }
    return false
  }

  recordSuccess(): void {
    const now = Date.now()
    this.window.push({ at: now, failed: false })
    this.pruneWindow(now)

    if (this.state === 'half-open') {
      this.successes++
      if (this.successes >= this.config.successThreshold) {
        this.setState('closed')
        this.successes = 0
        this.window = []
      }
    }
  }

  recordFailure(): void {
    const now = Date.now()
    this.successes = 0
    this.lastFailTime = now
    this.window.push({ at: now, failed: true })
    this.pruneWindow(now)

    if (
      this.state === 'half-open' ||
      this.countWindowFailures() >= this.config.failureThreshold
    ) {
      this.setState('open')
    }
  }

  reset(): void {
    this.setState('closed')
    this.successes = 0
    this.window = []
  }

  getStats() {
    return {
      state: this.currentState,
      windowFailures: this.countWindowFailures(),
      windowSize: this.window.length,
    }
  }

  private setState(to: CircuitState): void {
    const from = this.state
    if (from === to) return
    this.state = to
    this.onStateChange?.(from, to)
  }

  private countWindowFailures(): number {
    return this.window.filter((e) => e.failed).length
  }

  private pruneWindow(now: number): void {
    const cutoff = now - this.config.windowSize
    this.window = this.window.filter((e) => e.at >= cutoff)
  }
}

// ── Retry with Exponential Backoff ───────────────────────────

function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: base * 2^attempt
  const exponential = config.baseDelay * Math.pow(2, attempt)
  const capped = Math.min(exponential, config.maxDelay)

  // Add jitter to prevent thundering herd
  const jitterRange = capped * config.jitter
  const jitter = Math.random() * jitterRange * 2 - jitterRange

  return Math.max(0, capped + jitter)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Timeout Wrapper ──────────────────────────────────────────

class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

// ── Resilient Fetch ──────────────────────────────────────────

export class ResilientFetchError extends Error {
  readonly status?: number
  readonly attempts: number

  constructor(message: string, status: number | undefined, attempts: number) {
    super(message)
    this.name = 'ResilientFetchError'
    this.status = status
    this.attempts = attempts
  }
}

/**
 * Creates a resilient fetch function with retry + circuit breaker + timeout.
 *
 * Mirrors the backend Go circuit breaker but for mobile API calls.
 *
 * @example
 * ```ts
 * const apiFetch = createResilientFetch({
 *   requestTimeout: 10_000,
 *   retry: { maxRetries: 3, baseDelay: 500 },
 *   onStateChange: (from, to) => console.warn(`Circuit: ${from} → ${to}`),
 *   onRetry: (attempt, delay) => console.warn(`Retry ${attempt} in ${delay}ms`),
 * })
 *
 * const response = await apiFetch('https://api.vct-platform.com/v1/tournaments')
 * const data = await response.json()
 * ```
 */
export function createResilientFetch(
  config: Partial<ResilientFetchConfig> = {},
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const cfg: ResilientFetchConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    retry: { ...DEFAULT_RETRY, ...config.retry },
    circuitBreaker: {
      ...DEFAULT_CIRCUIT_BREAKER,
      ...config.circuitBreaker,
    },
  }

  const breaker = new ClientCircuitBreaker(
    cfg.circuitBreaker,
    cfg.onStateChange,
  )

  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    // Circuit breaker check
    if (!breaker.canExecute()) {
      throw new ResilientFetchError(
        'Circuit breaker is open — service temporarily unavailable',
        503,
        0,
      )
    }

    let lastError: Error | undefined
    let lastStatus: number | undefined

    for (let attempt = 0; attempt <= cfg.retry.maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(input, init, cfg.requestTimeout)

        if (response.ok) {
          breaker.recordSuccess()
          return response
        }

        lastStatus = response.status

        // Check if retryable
        if (
          !cfg.retry.retryableStatuses.includes(response.status) ||
          attempt === cfg.retry.maxRetries
        ) {
          breaker.recordFailure()
          throw new ResilientFetchError(
            `API request failed: ${response.status} ${response.statusText}`,
            response.status,
            attempt + 1,
          )
        }

        // Retryable error — apply backoff
        lastError = new Error(`HTTP ${response.status}`)
      } catch (error) {
        if (error instanceof ResilientFetchError) throw error

        lastError =
          error instanceof Error ? error : new Error(String(error))

        // Abort errors (timeout) are retryable
        if (
          lastError.name === 'AbortError' ||
          lastError instanceof TimeoutError
        ) {
          lastStatus = 408
        }

        if (attempt === cfg.retry.maxRetries) {
          breaker.recordFailure()
          throw new ResilientFetchError(
            lastError.message,
            lastStatus,
            attempt + 1,
          )
        }
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, cfg.retry)
      cfg.onRetry?.(attempt + 1, delay, lastError!)
      await sleep(delay)
    }

    // Should never reach here, but safety net
    breaker.recordFailure()
    throw new ResilientFetchError(
      lastError?.message ?? 'Unknown error',
      lastStatus,
      cfg.retry.maxRetries + 1,
    )
  }
}

// ── Singleton for App-Wide Usage ─────────────────────────────

/**
 * Pre-configured resilient fetch for VCT Platform mobile API calls.
 *
 * Features:
 * - 15s timeout per request
 * - 3 retries with exponential backoff (1s, 2s, 4s)
 * - Circuit breaker: opens after 5 failures in 60s window
 * - Auto-recovers after 30s cooldown
 */
export const resilientFetch = createResilientFetch({
  requestTimeout: 15_000,
  retry: {
    maxRetries: 3,
    baseDelay: 1_000,
    maxDelay: 30_000,
    jitter: 0.2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30_000,
    windowSize: 60_000,
  },
  onStateChange: (from, to) => {
    console.warn(`[CircuitBreaker] ${from} → ${to}`)
  },
  onRetry: (attempt, delay, error) => {
    console.warn(
      `[Retry] Attempt ${attempt}, waiting ${delay}ms: ${error.message}`,
    )
  },
})
