// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — useNetworkStatus Hook
// Reactive hook for network state, sync queue, and sync progress.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { offlineManager, type SyncResult, type SyncEvent } from './offline-manager'

export interface NetworkStatus {
  /** True when device has internet connectivity */
  isOnline: boolean
  /** True when device is offline */
  isOffline: boolean
  /** Number of mutations waiting to sync */
  pendingSyncCount: number
  /** True when sync queue is being flushed */
  isSyncing: boolean
  /** Number of permanently failed items */
  deadLetterCount: number
  /** Result of last completed sync */
  lastSyncResult: SyncResult | null
  /** Manually trigger sync flush */
  triggerSync: () => Promise<SyncResult>
  /** Retry dead-lettered items */
  retryDeadLetter: () => Promise<number>
}

/**
 * Tracks real-time network connectivity, sync queue, and sync progress.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { isOffline, pendingSyncCount, isSyncing, triggerSync } = useNetworkStatus()
 *   return (
 *     <>
 *       <OfflineBanner isOffline={isOffline} />
 *       {pendingSyncCount > 0 && <SyncStatus count={pendingSyncCount} />}
 *       {isSyncing && <ActivityIndicator />}
 *       <Button onPress={triggerSync} title="Sync Now" />
 *     </>
 *   )
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(offlineManager.isOnline)
  const [pendingSyncCount, setPendingSyncCount] = useState(
    offlineManager.queueLength,
  )
  const [isSyncing, setIsSyncing] = useState(offlineManager.isSyncing)
  const [deadLetterCount, setDeadLetterCount] = useState(
    offlineManager.deadLetterCount,
  )
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    const unsubNetwork = offlineManager.onNetworkChange((online) => {
      setIsOnline(online)
      setPendingSyncCount(offlineManager.queueLength)
    })

    const unsubSync = offlineManager.onSyncEvent((event: SyncEvent) => {
      switch (event.type) {
        case 'sync:start':
          setIsSyncing(true)
          break
        case 'sync:progress':
          setPendingSyncCount(offlineManager.queueLength)
          break
        case 'sync:complete':
          setIsSyncing(false)
          if (event.result) setLastSyncResult(event.result)
          setPendingSyncCount(offlineManager.queueLength)
          setDeadLetterCount(offlineManager.deadLetterCount)
          break
        case 'sync:error':
          setDeadLetterCount(offlineManager.deadLetterCount)
          break
      }
    })

    // Sync initial state
    setIsOnline(offlineManager.isOnline)
    setPendingSyncCount(offlineManager.queueLength)
    setDeadLetterCount(offlineManager.deadLetterCount)

    // Poll queue length periodically (queue changes without network events)
    const interval = setInterval(() => {
      setPendingSyncCount(offlineManager.queueLength)
    }, 5000)

    return () => {
      unsubNetwork()
      unsubSync()
      clearInterval(interval)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    return offlineManager.flushSyncQueue()
  }, [])

  const retryDeadLetter = useCallback(async () => {
    return offlineManager.retryDeadLetter()
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    pendingSyncCount,
    isSyncing,
    deadLetterCount,
    lastSyncResult,
    triggerSync,
    retryDeadLetter,
  }
}

