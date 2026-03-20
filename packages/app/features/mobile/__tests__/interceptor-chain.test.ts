/**
 * @jest-environment node
 */

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Interceptor Chain Tests
// Tests for composable request/response middleware chain.
// ═══════════════════════════════════════════════════════════════

import { InterceptorChain, platformInterceptor } from '../interceptor-chain'

// ── Mock fetch ───────────────────────────────────────────────

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('InterceptorChain', () => {
  describe('basic fetch', () => {
    it('passes through fetch without interceptors', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      const chain = new InterceptorChain()
      const response = await chain.fetch('https://api.example.com/test')

      expect(response.status).toBe(200)
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('request interceptors', () => {
    it('modifies request headers', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      const chain = new InterceptorChain()
      chain.useRequest((ctx) => {
        const headers = new Headers(ctx.init.headers)
        headers.set('X-Custom', 'test-value')
        ctx.init.headers = Object.fromEntries(headers.entries())
        return ctx
      })

      await chain.fetch('https://api.example.com/test')

      const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].headers['x-custom']).toBe('test-value')
    })

    it('runs interceptors in order', async () => {
      const order: number[] = []
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      const chain = new InterceptorChain()
      chain.useRequest((ctx) => { order.push(1); return ctx })
      chain.useRequest((ctx) => { order.push(2); return ctx })
      chain.useRequest((ctx) => { order.push(3); return ctx })

      await chain.fetch('https://api.example.com/test')
      expect(order).toEqual([1, 2, 3])
    })
  })

  describe('response interceptors', () => {
    it('processes response', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      let capturedDuration = 0
      const chain = new InterceptorChain()
      chain.useResponse((ctx) => {
        capturedDuration = ctx.durationMs
        return ctx
      })

      await chain.fetch('https://api.example.com/test')
      expect(capturedDuration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('error interceptors', () => {
    it('catches and handles fetch errors', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(
        new Error('Network error'),
      ) as jest.Mock

      const chain = new InterceptorChain()
      chain.useError((_error, _ctx) => {
        return {
          response: new Response('recovered', { status: 200 }),
          request: _ctx,
          durationMs: 0,
        }
      })

      const response = await chain.fetch('https://api.example.com/test')
      expect(response.status).toBe(200)
      const text = await response.text()
      expect(text).toBe('recovered')
    })
  })

  describe('profiles', () => {
    it('creates scoped chain with profile interceptors', async () => {
      const order: string[] = []
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      const chain = new InterceptorChain()
      chain.useRequest((ctx) => { order.push('global'); return ctx })

      chain.registerProfile('auth', {
        request: [(ctx) => { order.push('profile'); return ctx }],
      })

      const scoped = chain.withProfile('auth')
      await scoped.fetch('https://api.example.com/test')

      // Profile interceptors run before global
      expect(order).toEqual(['profile', 'global'])
    })
  })

  describe('platformInterceptor', () => {
    it('adds version and platform headers', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        new Response('ok', { status: 200 }),
      ) as jest.Mock

      const chain = new InterceptorChain()
      chain.useRequest(platformInterceptor('2.0.0'))

      await chain.fetch('https://api.example.com/test')

      const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].headers['x-app-version']).toBe('2.0.0')
      expect(callArgs[1].headers['x-app-platform']).toBe('mobile')
    })
  })
})
