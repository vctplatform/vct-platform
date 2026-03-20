// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Offline Module Exports
// ═══════════════════════════════════════════════════════════════

export { offlineManager } from './offline-manager'
export type {
  CacheEntry,
  SyncQueueItem,
  SyncPriority,
  ConflictStrategy,
  SyncResult,
  SyncEvent,
  SyncEventType,
  StorageAnalytics,
  NetworkListener,
  SyncEventListener,
} from './offline-manager'

export { useNetworkStatus } from './useNetworkStatus'
export type { NetworkStatus } from './useNetworkStatus'

export { useOfflineFetch } from './useOfflineFetch'
export type { OfflineFetchResult } from './useOfflineFetch'

