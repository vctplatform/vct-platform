---
name: vct-mobile-offline
description: Offline-first architecture for VCT Platform mobile app. Activate when implementing offline data storage, sync queue with conflict resolution, network state handling, background sync, cache invalidation, or designing offline-capable tournament scoring.
---

# VCT Mobile Offline

> **When to activate**: Offline storage strategy, sync queue implementation, conflict resolution, network detection, background sync, cache management, offline scoring, or storage quota management.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Role Definition

You are the **Mobile Offline Architecture Engineer** for VCT Platform. You design and implement offline-first patterns ensuring the app remains functional during martial arts tournaments with poor connectivity.

### Core Principles
- **Offline by default** — app must work without internet
- **Sync transparently** — user shouldn't manage sync manually
- **Conflicts are normal** — design for conflict resolution from day 1
- **Cache is truth (offline)** — local data is the primary source when offline
- **Freshness indicators** — always show data age to users

---

## 2. Storage Strategy

> **CRITICAL RULE**: ALL offline implementation, conflict resolution, and sync mechanisms MUST strictly adhere to the authoritative rules defined in `docs/architecture/mobile-architecture.md` (e.g., Fail-Safe Mutation Sync, Offline-First Local Database).

### Storage Layer Stack
```
┌─────────────────────────────────────────────┐
│  Application Layer (React Native)            │
├─────────────────────────────────────────────┤
│  Cache Manager (TTL, LRU eviction)          │
├──────────────────┬──────────────────────────┤
│  AsyncStorage    │  expo-file-system        │
│  (key-value)     │  (binary files)          │
│  - User profile  │  - Cached images         │
│  - API responses │  - PDF documents         │
│  - App state     │  - Offline maps          │
│  - Sync queue    │  - Training videos       │
├──────────────────┴──────────────────────────┤
│  SQLite (expo-sqlite) — optional, for       │
│  complex queries (tournament brackets,       │
│  athlete search with filters)               │
└─────────────────────────────────────────────┘
```

### Storage Selection Matrix
| Data Type | Storage | Max Size | TTL |
|-----------|---------|----------|-----|
| User profile | AsyncStorage | 1KB | 24h |
| Auth tokens | SecureStore (expo-secure-store) | 4KB | Until logout |
| API response cache | AsyncStorage | 10KB/key | 5-30min |
| Tournament schedule | AsyncStorage | 50KB | 1h |
| Athlete photos | expo-file-system | 5MB total | 7 days |
| Sync queue | AsyncStorage | Unlimited | Until synced |
| App preferences | AsyncStorage | 1KB | Permanent |
| Scoring data | AsyncStorage/SQLite | 100KB | Until synced |

---

## 3. Core Offline Manager

### OfflineManager Implementation
```typescript
// packages/app/features/mobile/offline/offline-manager.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: number
}

interface SyncQueueItem {
  id: string
  method: 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  body: unknown
  createdAt: number
  retryCount: number
  maxRetries: number
}

class OfflineManager {
  private isOnline = true
  private syncQueue: SyncQueueItem[] = []

  constructor() {
    // Listen for network changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline
      this.isOnline = !!state.isConnected && !!state.isInternetReachable

      if (wasOffline && this.isOnline) {
        this.flushSyncQueue()
      }
    })
  }

  // --- Cache API ---

  async get<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
    const raw = await AsyncStorage.getItem(`cache:${key}`)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    const age = Date.now() - entry.timestamp
    const isStale = age > entry.ttl

    return { data: entry.data, isStale }
  }

  async set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      version: 1,
    }
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry))
  }

  async invalidate(pattern: string): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys()
    const matchingKeys = allKeys.filter(k => k.startsWith(`cache:${pattern}`))
    await AsyncStorage.multiRemove(matchingKeys)
  }

  // --- Sync Queue API ---

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      retryCount: 0,
    }
    this.syncQueue.push(queueItem)
    await this.persistQueue()
  }

  async flushSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return

    const queue = [...this.syncQueue]
    for (const item of queue) {
      try {
        await this.processQueueItem(item)
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id)
      } catch {
        item.retryCount++
        if (item.retryCount >= item.maxRetries) {
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id)
          // TODO: notify user of permanently failed sync
        }
      }
    }
    await this.persistQueue()
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:18080'
    const token = await AsyncStorage.getItem('vct-access-token')

    const response = await fetch(`${API_BASE}${item.endpoint}`, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: item.body ? JSON.stringify(item.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`)
    }
  }

  private async persistQueue(): Promise<void> {
    await AsyncStorage.setItem('sync:queue', JSON.stringify(this.syncQueue))
  }

  async restoreQueue(): Promise<void> {
    const raw = await AsyncStorage.getItem('sync:queue')
    if (raw) {
      this.syncQueue = JSON.parse(raw)
    }
  }

  getQueueLength(): number {
    return this.syncQueue.length
  }

  getNetworkStatus(): boolean {
    return this.isOnline
  }
}

export const offlineManager = new OfflineManager()
```

---

## 4. Offline-First Fetch Pattern

### useCachedFetch Hook
```tsx
// packages/app/features/mobile/offline/useCachedFetch.ts
import { useState, useEffect, useCallback } from 'react'
import { offlineManager } from './offline-manager'

interface UseCachedFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  isStale: boolean
  isOffline: boolean
  refetch: () => Promise<void>
}

export function useCachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000,
): UseCachedFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const fetchData = useCallback(async () => {
    // 1. Try cache first (instant response)
    const cached = await offlineManager.get<T>(cacheKey)
    if (cached) {
      setData(cached.data)
      setIsStale(cached.isStale)
      setLoading(false)
    }

    // 2. If online, fetch fresh data
    if (offlineManager.getNetworkStatus()) {
      try {
        const fresh = await fetcher()
        setData(fresh)
        setIsStale(false)
        setError(null)
        await offlineManager.set(cacheKey, fresh, ttlMs)
      } catch (err) {
        // If we have cached data, don't show error
        if (!cached) {
          setError(err instanceof Error ? err.message : 'Fetch failed')
        }
      }
    } else if (!cached) {
      setError('Không có kết nối mạng và không có dữ liệu cache')
    }

    setLoading(false)
  }, [cacheKey, fetcher, ttlMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    isStale,
    isOffline: !offlineManager.getNetworkStatus(),
    refetch: fetchData,
  }
}
```

---

## 5. Offline Capabilities Matrix

### What Works Offline
```
✅ FULL OFFLINE:
  - View athlete profile (cached)
  - View tournament schedule (cached)
  - View belt progression (cached)
  - Browse training history (cached)
  - View club information (cached)
  - Read notifications (cached)
  - View rankings (cached, stale)

⚠️ QUEUED (sync when online):
  - Submit scores (queued)
  - Update profile (queued)
  - Register for tournament (queued)
  - Check-in at venue (queued)
  - Submit training log (queued)

❌ REQUIRES ONLINE:
  - Live scoring (WebSocket)
  - Real-time chat
  - Live streaming
  - OTP verification
  - Payment processing
  - Push notification registration
```

---

## 6. Conflict Resolution

### Strategy Priority
```
1. Server wins (default for most entities)
   - Server data is authoritative
   - Client changes are discarded if conflicted

2. Client wins (for user drafts)
   - Local edits preserved
   - User explicitly chooses to overwrite

3. Merge (for scoring data)
   - Both changes applied if compatible
   - Manual review if incompatible

4. Last-write-wins (for simple updates)
   - Timestamp comparison
   - Most recent change preserved
```

### Conflict Detection
```typescript
interface SyncConflict {
  entity: string
  entityId: string
  localVersion: number
  serverVersion: number
  localData: unknown
  serverData: unknown
  resolvedBy?: 'server' | 'client' | 'merge'
}

async function resolveConflict(conflict: SyncConflict): Promise<unknown> {
  switch (conflict.entity) {
    case 'athlete_profile':
      // Server wins for profile data
      return conflict.serverData

    case 'score_submission':
      // Merge: combine scores from both
      return mergeScores(conflict.localData, conflict.serverData)

    case 'training_log':
      // Last-write-wins
      return conflict.localVersion > conflict.serverVersion
        ? conflict.localData
        : conflict.serverData

    default:
      return conflict.serverData
  }
}
```

---

## 7. Network State UI

### OfflineBanner (Already Implemented)
```tsx
// From mobile-ui.tsx — already available
import { OfflineBanner } from '../mobile-ui'

function Screen() {
  const isOffline = !offlineManager.getNetworkStatus()

  return (
    <View>
      <OfflineBanner isOffline={isOffline} onRetry={() => refetch()} />
      {/* Screen content */}
    </View>
  )
}
```

### Data Freshness Indicator
```tsx
function StaleDataIndicator({ timestamp }: { timestamp: number }) {
  const age = Date.now() - timestamp
  const minutes = Math.floor(age / 60000)

  if (minutes < 1) return null

  return (
    <View style={styles.staleIndicator}>
      <Icon name={VCTIcons.clock} size={10} color={Colors.textMuted} />
      <Text style={styles.staleText}>
        Cập nhật {minutes < 60
          ? `${minutes} phút trước`
          : `${Math.floor(minutes / 60)} giờ trước`
        }
      </Text>
    </View>
  )
}
```

### Sync Queue Status
```tsx
function SyncStatus() {
  const queueLength = offlineManager.getQueueLength()
  if (queueLength === 0) return null

  return (
    <View style={styles.syncBadge}>
      <Icon name={VCTIcons.sync} size={12} color={Colors.gold} />
      <Text style={styles.syncText}>
        {queueLength} thay đổi đang chờ đồng bộ
      </Text>
    </View>
  )
}
```

---

## 8. Background Sync

### expo-background-fetch
```typescript
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

const BACKGROUND_SYNC_TASK = 'VCT_BACKGROUND_SYNC'

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await offlineManager.flushSyncQueue()
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// Register on app startup
async function registerBackgroundSync() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60,  // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  })
}
```

---

## 9. Storage Quota Management

### Cache Eviction Policy
```typescript
const CACHE_BUDGET = 50 * 1024 * 1024  // 50MB total cache budget

async function enforceStorageBudget(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys()
  const cacheKeys = allKeys.filter(k => k.startsWith('cache:'))

  // Calculate total size
  const entries: Array<{ key: string; size: number; timestamp: number }> = []
  for (const key of cacheKeys) {
    const raw = await AsyncStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      entries.push({
        key,
        size: raw.length * 2,  // UTF-16
        timestamp: parsed.timestamp || 0,
      })
    }
  }

  const totalSize = entries.reduce((sum, e) => sum + e.size, 0)
  if (totalSize <= CACHE_BUDGET) return

  // LRU eviction: remove oldest first
  entries.sort((a, b) => a.timestamp - b.timestamp)
  let freed = 0
  const toRemove: string[] = []
  for (const entry of entries) {
    if (totalSize - freed <= CACHE_BUDGET * 0.8) break  // Free until 80%
    toRemove.push(entry.key)
    freed += entry.size
  }
  await AsyncStorage.multiRemove(toRemove)
}
```

---

## 10. Offline Tournament Scoring

### Score Submission Queue
```typescript
interface PendingScore {
  matchId: string
  athleteId: string
  score: number
  category: 'doi_khang' | 'quyen_thuat'
  timestamp: number
  judgeId: string
}

async function submitScoreOffline(score: PendingScore): Promise<void> {
  // Save locally immediately
  await offlineManager.set(
    `score:${score.matchId}:${score.judgeId}`,
    score,
    24 * 60 * 60 * 1000  // 24h TTL
  )

  // Enqueue for sync
  await offlineManager.enqueue({
    method: 'POST',
    endpoint: `/api/v1/scoring/matches/${score.matchId}/scores`,
    body: score,
    maxRetries: 10,
  })
}
```

---

## 11. Output Format

Every Offline output must include:

1. **💾 Storage Strategy** — What's cached, where, and for how long
2. **🔄 Sync Design** — Queue mechanism, conflict resolution
3. **📶 Network UI** — How offline state is communicated to user
4. **⚡ Performance Impact** — Cache read/write latency
5. **📊 Storage Budget** — Estimated size and eviction plan

---

## 12. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| API design for offline-friendly responses | → **vct-sa** |
| Storage performance profiling | → **vct-mobile-performance** |
| Testing offline scenarios | → **vct-mobile-testing** |
| Background sync scheduling | → **vct-mobile-build** (expo-background-fetch config) |
| Scoring rules for offline scoring | → **vct-realtime-scoring** |
| Cache security (sensitive data) | → **vct-security** |
