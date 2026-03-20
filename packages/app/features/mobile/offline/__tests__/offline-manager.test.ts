// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage'
import { offlineManager } from '../offline-manager'

// Access the mock store for assertions
const mockStore = (AsyncStorage as unknown as { _store: Map<string, string> })._store

describe('OfflineManager', () => {
  beforeEach(async () => {
    mockStore.clear()
    jest.clearAllMocks()
    // Re-create a clean manager for each test
    offlineManager.destroy()
  })

  // ── Cache API ──────────────────────────────────────────────

  describe('Cache', () => {
    it('should return null for uncached key', async () => {
      const result = await offlineManager.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should cache and retrieve data', async () => {
      const data = { name: 'Trần Văn A', belt: 'Nhất Đẳng' }
      await offlineManager.set('athlete:123', data, 60_000)

      const result = await offlineManager.get<typeof data>('athlete:123')
      expect(result).not.toBeNull()
      expect(result!.data).toEqual(data)
      expect(result!.isStale).toBe(false)
      expect(result!.age).toBeLessThan(1000)
    })

    it('should mark data as stale after TTL expires', async () => {
      const data = { id: 1 }
      await offlineManager.set('item:1', data, 1) // 1ms TTL

      // Wait for TTL to expire
      await new Promise((r) => setTimeout(r, 10))

      const result = await offlineManager.get<typeof data>('item:1')
      expect(result).not.toBeNull()
      expect(result!.data).toEqual(data) // Data still returned
      expect(result!.isStale).toBe(true) // But marked as stale
    })

    it('should invalidate by key prefix', async () => {
      await offlineManager.set('athlete:1', { a: 1 })
      await offlineManager.set('athlete:2', { a: 2 })
      await offlineManager.set('tournament:1', { b: 1 })

      await offlineManager.invalidate('athlete:')

      expect(await offlineManager.get('athlete:1')).toBeNull()
      expect(await offlineManager.get('athlete:2')).toBeNull()
      expect(await offlineManager.get('tournament:1')).not.toBeNull()
    })

    it('should clear all cache', async () => {
      await offlineManager.set('a', 1)
      await offlineManager.set('b', 2)

      await offlineManager.clearCache()

      expect(await offlineManager.get('a')).toBeNull()
      expect(await offlineManager.get('b')).toBeNull()
    })
  })

  // ── Sync Queue ─────────────────────────────────────────────

  describe('Sync Queue', () => {
    it('should start with empty queue', () => {
      expect(offlineManager.queueLength).toBe(0)
    })

    it('should enqueue items', async () => {
      await offlineManager.enqueue({
        method: 'POST',
        endpoint: '/api/v1/scoring/submit',
        body: { matchId: '1', score: 5 },
        maxRetries: 3,
      })

      expect(offlineManager.queueLength).toBe(1)

      // Should persist to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sync:queue',
        expect.any(String),
      )
    })

    it('should enqueue multiple items', async () => {
      await offlineManager.enqueue({
        method: 'POST',
        endpoint: '/api/v1/scoring/submit',
        body: { matchId: '1' },
        maxRetries: 3,
      })
      await offlineManager.enqueue({
        method: 'PUT',
        endpoint: '/api/v1/athlete-profiles/123',
        body: { name: 'Updated' },
        maxRetries: 3,
      })

      expect(offlineManager.queueLength).toBe(2)
    })

    it('should return 0 results when flushing empty queue', async () => {
      const result = await offlineManager.flushSyncQueue()
      expect(result).toEqual({ succeeded: 0, failed: 0 })
    })
  })

  // ── Network State ──────────────────────────────────────────

  describe('Network', () => {
    it('should default to online', () => {
      expect(offlineManager.isOnline).toBe(true)
    })

    it('should allow subscribing to network changes', () => {
      const listener = jest.fn()
      const unsubscribe = offlineManager.onNetworkChange(listener)

      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })
})
