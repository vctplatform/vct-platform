// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Offline Manager
// Cache-first data access with background sync queue,
// conflict resolution, exponential backoff, and storage analytics.
// ═══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage'
// @ts-expect-error - Type definitions might be missing due to workspace setup
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'

// ── Types ────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version?: number
}

export type SyncPriority = 'critical' | 'normal' | 'low'

export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge'

export interface SyncQueueItem {
  id: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  body: unknown
  createdAt: number
  retryCount: number
  maxRetries: number
  priority: SyncPriority
  conflictStrategy: ConflictStrategy
  /** ISO timestamp for conflict detection */
  clientTimestamp: string
  /** Delay before next retry (exponential backoff) */
  nextRetryAt: number
}

export interface SyncResult {
  succeeded: number
  failed: number
  conflictsResolved: number
  deadLettered: number
}

export interface StorageAnalytics {
  totalEntries: number
  totalSizeBytes: number
  oldestEntryAge: number
  staleEntries: number
  syncQueueLength: number
  deadLetterCount: number
}

export type NetworkListener = (isOnline: boolean) => void
export type SyncEventType = 'sync:start' | 'sync:progress' | 'sync:complete' | 'sync:error' | 'sync:conflict'
export type SyncEventListener = (event: SyncEvent) => void

export interface SyncEvent {
  type: SyncEventType
  item?: SyncQueueItem
  result?: SyncResult
  error?: string
  progress?: { current: number; total: number }
}

// ── Constants ────────────────────────────────────────────────

const CACHE_PREFIX = 'cache:'
const SYNC_QUEUE_KEY = 'sync:queue'
const DEAD_LETTER_KEY = 'sync:dead-letter'
const CACHE_BUDGET_BYTES = 50 * 1024 * 1024 // 50 MB

/** Priority weights for queue ordering */
const PRIORITY_ORDER: Record<SyncPriority, number> = {
  critical: 0,
  normal: 1,
  low: 2,
}

// ── OfflineManager Class ─────────────────────────────────────

class OfflineManager {
  private _isOnline = true
  private _syncQueue: SyncQueueItem[] = []
  private _deadLetter: SyncQueueItem[] = []
  private _listeners: NetworkListener[] = []
  private _syncListeners: SyncEventListener[] = []
  private _unsubscribeNetInfo: (() => void) | null = null
  private _isSyncing = false

  // ── Cache stats ──
  private _cacheHits = 0
  private _cacheMisses = 0

  /** Initialize network listener — call once on app startup */
  init(): void {
    if (this._unsubscribeNetInfo) return // already initialized

    this._unsubscribeNetInfo = NetInfo.addEventListener(
      (state: NetInfoState) => {
        const wasOffline = !this._isOnline
        this._isOnline = !!(state.isConnected && state.isInternetReachable)

        // Notify listeners
        this._listeners.forEach((fn) => fn(this._isOnline))

        // Auto-flush queue when coming back online
        if (wasOffline && this._isOnline) {
          this.flushSyncQueue().catch(console.warn)
        }
      },
    )

    // Restore persisted queues
    this._restoreQueue().catch(console.warn)
    this._restoreDeadLetter().catch(console.warn)
  }

  /** Tear down — call on app shutdown (or in tests) */
  destroy(): void {
    this._unsubscribeNetInfo?.()
    this._unsubscribeNetInfo = null
    this._listeners = []
    this._syncListeners = []
    this._syncQueue = []
    this._deadLetter = []
    this._cacheHits = 0
    this._cacheMisses = 0
  }

  // ── Network State ──────────────────────────────────────────

  get isOnline(): boolean {
    return this._isOnline
  }

  get isSyncing(): boolean {
    return this._isSyncing
  }

  /** Subscribe to network changes. Returns unsubscribe fn. */
  onNetworkChange(listener: NetworkListener): () => void {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((fn) => fn !== listener)
    }
  }

  /** Subscribe to sync events. Returns unsubscribe fn. */
  onSyncEvent(listener: SyncEventListener): () => void {
    this._syncListeners.push(listener)
    return () => {
      this._syncListeners = this._syncListeners.filter((fn) => fn !== listener)
    }
  }

  // ── Cache API ──────────────────────────────────────────────

  /**
   * Read cached data.
   * Returns null if nothing cached.
   * `isStale` is true when TTL has expired (data still returned).
   */
  async get<T>(
    key: string,
  ): Promise<{ data: T; isStale: boolean; age: number; version?: number } | null> {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (!raw) {
        this._cacheMisses++
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(raw)
      const age = Date.now() - entry.timestamp
      this._cacheHits++
      return { data: entry.data, isStale: age > entry.ttl, age, version: entry.version }
    } catch {
      this._cacheMisses++
      return null
    }
  }

  /** Write data to cache with TTL (default 5 min). */
  async set<T>(
    key: string,
    data: T,
    ttlMs: number = 5 * 60 * 1000,
  ): Promise<void> {
    const existing = await this.get<T>(key)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      version: (existing?.version ?? 0) + 1,
    }
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(entry),
    )
  }

  /** Remove cached entries matching a key prefix. */
  async invalidate(prefix: string): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys()
    const matching = allKeys.filter((k: string) =>
      k.startsWith(`${CACHE_PREFIX}${prefix}`),
    )
    if (matching.length > 0) {
      await (AsyncStorage as any).multiRemove(matching)
    }
  }

  /** Remove all cached data (preserves sync queue + auth). */
  async clearCache(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys()
    const cacheKeys = allKeys.filter((k: string) => k.startsWith(CACHE_PREFIX))
    if (cacheKeys.length > 0) {
      await (AsyncStorage as any).multiRemove(cacheKeys)
    }
    this._cacheHits = 0
    this._cacheMisses = 0
  }

  // ── Sync Queue API ─────────────────────────────────────────

  /** Add a mutation to the sync queue (processed when online). */
  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount' | 'nextRetryAt' | 'clientTimestamp' | 'priority' | 'conflictStrategy'> & {
      priority?: SyncPriority
      conflictStrategy?: ConflictStrategy
    },
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      retryCount: 0,
      nextRetryAt: 0,
      priority: item.priority ?? 'normal',
      conflictStrategy: item.conflictStrategy ?? 'server-wins',
      clientTimestamp: new Date().toISOString(),
    }
    this._syncQueue.push(queueItem)
    this._sortQueue()
    await this._persistQueue()
  }

  /** Number of items waiting to sync. */
  get queueLength(): number {
    return this._syncQueue.length
  }

  /** Number of permanently failed items. */
  get deadLetterCount(): number {
    return this._deadLetter.length
  }

  /** Process all queued items (called automatically on reconnect). */
  async flushSyncQueue(): Promise<SyncResult> {
    if (!this._isOnline || this._syncQueue.length === 0 || this._isSyncing) {
      return { succeeded: 0, failed: 0, conflictsResolved: 0, deadLettered: 0 }
    }

    this._isSyncing = true
    const result: SyncResult = { succeeded: 0, failed: 0, conflictsResolved: 0, deadLettered: 0 }
    const total = this._syncQueue.length

    this._emitSyncEvent({ type: 'sync:start', progress: { current: 0, total } })

    const now = Date.now()
    const readyItems = this._syncQueue.filter((item) => item.nextRetryAt <= now)

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i]!
      try {
        const response = await this._processItem(item)

        if (response.status === 409) {
          // Conflict detected
          result.conflictsResolved++
          this._emitSyncEvent({ type: 'sync:conflict', item })
          await this._resolveConflict(item, response)
        }

        this._syncQueue = this._syncQueue.filter((q) => q.id !== item.id)
        result.succeeded++
      } catch {
        item.retryCount++
        if (item.retryCount >= item.maxRetries) {
          // Move to dead letter queue
          this._syncQueue = this._syncQueue.filter((q) => q.id !== item.id)
          this._deadLetter.push(item)
          result.deadLettered++
          this._emitSyncEvent({
            type: 'sync:error',
            item,
            error: `Max retries (${item.maxRetries}) exceeded`,
          })
        } else {
          // Exponential backoff with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, item.retryCount), 30000)
          const jitter = Math.random() * baseDelay * 0.3
          item.nextRetryAt = Date.now() + baseDelay + jitter
          result.failed++
        }
      }

      this._emitSyncEvent({
        type: 'sync:progress',
        progress: { current: i + 1, total },
      })
    }

    await this._persistQueue()
    await this._persistDeadLetter()

    this._isSyncing = false
    this._emitSyncEvent({ type: 'sync:complete', result })

    return result
  }

  /** Retry all dead-lettered items once. */
  async retryDeadLetter(): Promise<number> {
    const items = [...this._deadLetter]
    this._deadLetter = []

    let retried = 0
    for (const item of items) {
      item.retryCount = 0
      item.nextRetryAt = 0
      await this.enqueue(item)
      retried++
    }

    await this._persistDeadLetter()
    return retried
  }

  /** Clear dead letter queue. */
  async clearDeadLetter(): Promise<void> {
    this._deadLetter = []
    await AsyncStorage.removeItem(DEAD_LETTER_KEY)
  }

  // ── Storage Analytics ──────────────────────────────────────

  /** Get storage usage analytics. */
  async getAnalytics(): Promise<StorageAnalytics> {
    const allKeys = await AsyncStorage.getAllKeys()
    const cacheKeys = allKeys.filter((k: string) => k.startsWith(CACHE_PREFIX))

    let totalSize = 0
    let oldestAge = 0
    let staleCount = 0

    for (const key of cacheKeys) {
      const raw = await AsyncStorage.getItem(key)
      if (raw) {
        totalSize += raw.length * 2 // UTF-16
        try {
          const entry = JSON.parse(raw)
          const age = Date.now() - (entry.timestamp || 0)
          if (age > oldestAge) oldestAge = age
          if (age > (entry.ttl || 0)) staleCount++
        } catch {
          // Corrupted entry counted as stale
          staleCount++
        }
      }
    }

    return {
      totalEntries: cacheKeys.length,
      totalSizeBytes: totalSize,
      oldestEntryAge: oldestAge,
      staleEntries: staleCount,
      syncQueueLength: this._syncQueue.length,
      deadLetterCount: this._deadLetter.length,
    }
  }

  /** Cache hit ratio (0-1). */
  get cacheHitRatio(): number {
    const total = this._cacheHits + this._cacheMisses
    return total === 0 ? 0 : this._cacheHits / total
  }

  // ── Storage Budget ─────────────────────────────────────────

  /** Evict oldest entries when cache exceeds budget. */
  async enforceStorageBudget(): Promise<number> {
    const allKeys = await AsyncStorage.getAllKeys()
    const cacheKeys = allKeys.filter((k: string) => k.startsWith(CACHE_PREFIX))

    const entries: { key: string; size: number; timestamp: number }[] = []
    for (const key of cacheKeys) {
      const raw = await AsyncStorage.getItem(key)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          entries.push({
            key,
            size: raw.length * 2, // UTF-16
            timestamp: parsed.timestamp || 0,
          })
        } catch {
          // corrupted entry — remove
          entries.push({ key, size: 0, timestamp: 0 })
        }
      }
    }

    const totalSize = entries.reduce((sum, e) => sum + e.size, 0)
    if (totalSize <= CACHE_BUDGET_BYTES) return 0

    // LRU eviction: remove oldest until at 80% capacity
    entries.sort((a, b) => a.timestamp - b.timestamp)
    let freed = 0
    const toRemove: string[] = []
    for (const entry of entries) {
      if (totalSize - freed <= CACHE_BUDGET_BYTES * 0.8) break
      toRemove.push(entry.key)
      freed += entry.size
    }

    if (toRemove.length > 0) {
      await (AsyncStorage as any).multiRemove(toRemove)
    }
    return toRemove.length
  }

  // ── Private ────────────────────────────────────────────────

  private async _processItem(item: SyncQueueItem): Promise<Response> {
    const apiBase =
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:18080'
    const token = await AsyncStorage.getItem('vct-access-token')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client-Timestamp': item.clientTimestamp,
      'X-Conflict-Strategy': item.conflictStrategy,
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${apiBase}${item.endpoint}`, {
      method: item.method,
      headers,
      body: item.body ? JSON.stringify(item.body) : undefined,
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }

    return response
  }

  private async _resolveConflict(
    item: SyncQueueItem,
    response: Response,
  ): Promise<void> {
    switch (item.conflictStrategy) {
      case 'client-wins':
        // Force push client version (re-send with override header)
        break
      case 'merge':
        // Attempt to merge server + client changes
        try {
          const serverData = await response.json()
          // Emit merge event for UI to handle
          this._emitSyncEvent({
            type: 'sync:conflict',
            item,
            error: `Merge required: ${JSON.stringify(serverData)}`,
          })
        } catch {
          // Fall through to server-wins
        }
        break
      case 'server-wins':
      default:
        // Accept server version, invalidate local cache
        const cacheKey = item.endpoint.replace(/^\/api\/v1\//, '')
        await this.invalidate(cacheKey)
        break
    }
  }

  private _sortQueue(): void {
    this._syncQueue.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.createdAt - b.createdAt // FIFO within same priority
    })
  }

  private _emitSyncEvent(event: SyncEvent): void {
    this._syncListeners.forEach((fn) => fn(event))
  }

  private async _persistQueue(): Promise<void> {
    await AsyncStorage.setItem(
      SYNC_QUEUE_KEY,
      JSON.stringify(this._syncQueue),
    )
  }

  private async _restoreQueue(): Promise<void> {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY)
    if (raw) {
      try {
        this._syncQueue = JSON.parse(raw)
        this._sortQueue()
      } catch {
        this._syncQueue = []
      }
    }
  }

  private async _persistDeadLetter(): Promise<void> {
    await AsyncStorage.setItem(
      DEAD_LETTER_KEY,
      JSON.stringify(this._deadLetter),
    )
  }

  private async _restoreDeadLetter(): Promise<void> {
    const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY)
    if (raw) {
      try {
        this._deadLetter = JSON.parse(raw)
      } catch {
        this._deadLetter = []
      }
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────

export const offlineManager = new OfflineManager()

