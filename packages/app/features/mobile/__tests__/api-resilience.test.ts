/**
 * @jest-environment node
 */

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — API Resilience Tests
// Tests for circuit breaker, retry with backoff, and timeout.
// ═══════════════════════════════════════════════════════════════

import {
  createResilientFetch,
  ResilientFetchError,
  resilientFetch as _resilientFetch,
} from '../api-resilience'

// ── Mock fetch ───────────────────────────────────────────────

const originalFetch = globalThis.fetch

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true })
})

afterEach(() => {
  globalThis.fetch = originalFetch
  jest.useRealTimers()
})

// ── Circuit Breaker Tests ────────────────────────────────────

describe('createResilientFetch', () => {
  describe('circuit breaker', () => {
    it('opens after failure threshold', async () => {
      let callCount = 0
      globalThis.fetch = jest.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve(new Response('error', { status: 500 }))
      }) as jest.Mock

      const fetcher = createResilientFetch({
        retry: { maxRetries: 0, baseDelay: 10, maxDelay: 100, jitter: 0, retryableStatuses: [500] },
        circuitBreaker: { failureThreshold: 3, successThreshold: 1, timeout: 5000, windowSize: 60000 },
        requestTimeout: 5000,
      })

      // Trip the circuit with failures
      for (let i = 0; i < 3; i++) {
        await expect(fetcher('https://api.example.com/test')).rejects.toThrow()
      }

      // Next call should be rejected immediately (circuit open)
      await expect(fetcher('https://api.example.com/test')).rejects.toThrow(
        /circuit breaker is open/i,
      )

      expect(callCount).toBe(3) // The 4th call never reached fetch
    })

    it('recovers after timeout (half-open → closed)', async () => {
      let callCount = 0
      globalThis.fetch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 3) {
          return Promise.resolve(new Response('error', { status: 500 }))
        }
        return Promise.resolve(new Response('ok', { status: 200 }))
      }) as jest.Mock

      const fetcher = createResilientFetch({
        retry: { maxRetries: 0, baseDelay: 10, maxDelay: 100, jitter: 0, retryableStatuses: [500] },
        circuitBreaker: { failureThreshold: 3, successThreshold: 1, timeout: 100, windowSize: 60000 },
        requestTimeout: 5000,
      })

      // Trip
      for (let i = 0; i < 3; i++) {
        await expect(fetcher('https://api.example.com/test')).rejects.toThrow()
      }

      // Wait for timeout to expire
      await new Promise((r) => setTimeout(r, 150))
      jest.advanceTimersByTime(150)

      // Should succeed (half-open allows one try, which succeeds → closed)
      const response = await fetcher('https://api.example.com/test')
      expect(response.ok).toBe(true)
    })
  })

  describe('retry', () => {
    it('retries on 500 errors', async () => {
      let attempt = 0
      globalThis.fetch = jest.fn().mockImplementation(() => {
        attempt++
        if (attempt < 3) {
          return Promise.resolve(new Response('fail', { status: 500 }))
        }
        return Promise.resolve(new Response('ok', { status: 200 }))
      }) as jest.Mock

      const fetcher = createResilientFetch({
        retry: { maxRetries: 3, baseDelay: 10, maxDelay: 100, jitter: 0, retryableStatuses: [500] },
        circuitBreaker: { failureThreshold: 10, successThreshold: 1, timeout: 5000, windowSize: 60000 },
        requestTimeout: 5000,
      })

      const response = await fetcher('https://api.example.com/test')
      expect(response.ok).toBe(true)
      expect(attempt).toBe(3)
    })

    it('does not retry non-retryable status codes', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('not found', { status: 404 }),
      ) as jest.Mock

      const fetcher = createResilientFetch({
        retry: { maxRetries: 3, baseDelay: 10, maxDelay: 100, jitter: 0, retryableStatuses: [500] },
        circuitBreaker: { failureThreshold: 10, successThreshold: 1, timeout: 5000, windowSize: 60000 },
        requestTimeout: 5000,
      })

      await expect(fetcher('https://api.example.com/test')).rejects.toThrow(
        ResilientFetchError,
      )
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('success path', () => {
    it('returns response on success', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 }),
      ) as jest.Mock

      const fetcher = createResilientFetch({
        requestTimeout: 5000,
        retry: { maxRetries: 0, baseDelay: 10, maxDelay: 100, jitter: 0, retryableStatuses: [] },
        circuitBreaker: { failureThreshold: 5, successThreshold: 2, timeout: 30000, windowSize: 60000 },
      })

      const response = await fetcher('https://api.example.com/test')
      expect(response.ok).toBe(true)
      const json = await response.json()
      expect(json.data).toBe('test')
    })
  })
})
