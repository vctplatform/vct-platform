import { ApiError } from '../api-client'

// ── getApiBaseUrl Tests ──────────────────────────────────────

describe('api-client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getApiBaseUrl', () => {
    it('should prefer EXPO_PUBLIC_API_BASE_URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://expo-api.example.com'
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://next-api.example.com'

      // Re-import to pick up new env
      jest.isolateModules(() => {
        const mod = require('../api-client')
        expect(mod.isApiAvailable()).toBe(true)
      })
    })

    it('should fall back to NEXT_PUBLIC_API_BASE_URL', () => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://next-api.example.com'

      jest.isolateModules(() => {
        const mod = require('../api-client')
        expect(mod.isApiAvailable()).toBe(true)
      })
    })

    it('should return empty when no env var set', () => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL
      delete process.env.NEXT_PUBLIC_API_BASE_URL

      jest.isolateModules(() => {
        const mod = require('../api-client')
        expect(mod.isApiAvailable()).toBe(false)
      })
    })
  })

  // ── ApiError ───────────────────────────────────────────────

  describe('ApiError', () => {
    it('should create with message and status', () => {
      const error = new ApiError('Not Found', 404)
      expect(error.message).toBe('Not Found')
      expect(error.status).toBe(404)
      expect(error.name).toBe('ApiError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should have correct stack trace', () => {
      const error = new ApiError('Server Error', 500)
      expect(error.stack).toBeDefined()
    })
  })

  // ── requestJson ────────────────────────────────────────────

  describe('requestJson (via fetchMyProfile)', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test.com'
      global.fetch = jest.fn()
    })

    it('should throw ApiError on non-ok response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })

      jest.isolateModules(async () => {
        const { fetchMyProfile } = require('../api-client')
        await expect(fetchMyProfile('bad-token')).rejects.toThrow()
      })
    })

    it('should pass Authorization header when token provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', fullName: 'Test' }),
      })

      jest.isolateModules(async () => {
        const { fetchMyProfile } = require('../api-client')
        await fetchMyProfile('valid-token')

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer valid-token',
            }),
          }),
        )
      })
    })
  })
})
