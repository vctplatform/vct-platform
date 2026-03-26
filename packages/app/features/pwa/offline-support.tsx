'use client'

/**
 * VCT Offline & PWA Utilities
 *
 * Service worker registration, offline status detection,
 * offline data queue with retry + conflict detection,
 * and background sync support.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text } from '@vct/ui'

const __DEV__ = process.env.NODE_ENV !== 'production'
// eslint-disable-next-line no-console
const devLog = (...args: unknown[]) => { if (__DEV__) console.log(...args) }

/* ═══════════════════════════════════════════════════════════════
   SERVICE WORKER REGISTRATION
   ═══════════════════════════════════════════════════════════════ */

export function registerServiceWorker() {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
        devLog('[PWA] Service Worker not supported')
        return
    }

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
            devLog('[PWA] Service Worker registered:', registration.scope)

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                if (!newWorker) return
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        devLog('[PWA] New content available, please refresh')
                    }
                })
            })
        } catch (err) {
            console.error('[PWA] Service Worker registration failed:', err)
        }
    })
}

/* ═══════════════════════════════════════════════════════════════
   ONLINE/OFFLINE HOOK
   ═══════════════════════════════════════════════════════════════ */

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        if (typeof window === 'undefined') return

        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return isOnline
}

/* ═══════════════════════════════════════════════════════════════
   OFFLINE INDICATOR
   ═══════════════════════════════════════════════════════════════ */

export function VCT_OfflineIndicator() {
    const isOnline = useOnlineStatus()
    const [wasOffline, setWasOffline] = useState(false)

    useEffect(() => {
        if (!isOnline) setWasOffline(true)
        if (isOnline && wasOffline) {
            const timer = setTimeout(() => setWasOffline(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isOnline, wasOffline])

    return (
        <AnimatePresence>
            {(!isOnline || (isOnline && wasOffline)) && (
                <motion.div
                    className="fixed bottom-4 left-1/2 z-50"
                    style={{ transform: 'translateX(-50%)' }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                >
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{
                            background: isOnline ? 'var(--vct-success)' : 'var(--vct-danger)',
                            color: 'var(--vct-bg-elevated)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        <span>{isOnline ? '🟢' : '🔴'}</span>
                        <span>{isOnline ? 'Đã kết nối lại' : 'Mất kết nối — chế độ offline'}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/* ═══════════════════════════════════════════════════════════════
   OFFLINE DATA QUEUE (IndexedDB) — with Retry & Conflict Detection
   ═══════════════════════════════════════════════════════════════ */

const DB_NAME = 'vct-offline'
const DB_VERSION = 2 // bumped for schema migration
const STORE_NAME = 'pending-actions'
const MAX_RETRY_ATTEMPTS = 5
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface PendingAction {
    id: string
    type: 'score' | 'attendance' | 'injury' | 'general'
    endpoint: string
    method: 'POST' | 'PUT' | 'DELETE'
    body: Record<string, unknown>
    timestamp: number
    retryCount: number
    lastAttempt: number | null
    lastModified: string | null  // For conflict detection
    status: 'pending' | 'syncing' | 'conflict' | 'failed'
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = (event) => {
            const db = request.result
            const oldVersion = event.oldVersion

            if (oldVersion < 1) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
            // v2: Add index on status for efficient querying
            if (oldVersion < 2) {
                const tx = (event.target as IDBOpenDBRequest).transaction
                if (tx) {
                    const store = tx.objectStore(STORE_NAME)
                    if (!store.indexNames.contains('by_status')) {
                        store.createIndex('by_status', 'status', { unique: false })
                    }
                    if (!store.indexNames.contains('by_timestamp')) {
                        store.createIndex('by_timestamp', 'timestamp', { unique: false })
                    }
                }
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function queueOfflineAction(
    action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount' | 'lastAttempt' | 'lastModified' | 'status'>
): Promise<string> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const entry: PendingAction = {
        ...action,
        id,
        timestamp: Date.now(),
        retryCount: 0,
        lastAttempt: null,
        lastModified: null,
        status: 'pending',
    }

    store.put(entry)

    // Register background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready
        try {
            await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(`sync-${action.type}`)
        } catch {
            devLog('[Offline] Background sync not available')
        }
    }

    return id
}

export async function getPendingActions(): Promise<PendingAction[]> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function updatePendingAction(action: PendingAction): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(action)
}

export async function removePendingAction(id: string): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
}

/**
 * Remove actions older than STALE_THRESHOLD_MS (default: 7 days).
 * Call periodically to prevent IndexedDB from growing unbounded.
 */
export async function cleanStaleActions(): Promise<number> {
    const db = await openDB()
    const all = await getPendingActions()
    const now = Date.now()
    let cleaned = 0

    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const action of all) {
        if (now - action.timestamp > STALE_THRESHOLD_MS) {
            store.delete(action.id)
            cleaned++
        }
    }

    if (cleaned > 0) devLog(`[Offline] Cleaned ${cleaned} stale actions`)
    return cleaned
}

/* ═══════════════════════════════════════════════════════════════
   PENDING COUNT HOOK — for badge display
   ═══════════════════════════════════════════════════════════════ */

export function usePendingCount() {
    const [count, setCount] = useState(0)

    const refresh = useCallback(async () => {
        try {
            const actions = await getPendingActions()
            setCount(actions.filter(a => a.status === 'pending' || a.status === 'syncing').length)
        } catch {
            setCount(0)
        }
    }, [])

    useEffect(() => {
        refresh()
        // Poll every 5 seconds for changes
        const interval = setInterval(refresh, 5000)
        return () => clearInterval(interval)
    }, [refresh])

    return { count, refresh }
}

/* ═══════════════════════════════════════════════════════════════
   AUTO-SYNC HOOK — with retry backoff & conflict detection
   ═══════════════════════════════════════════════════════════════ */

export interface SyncProgress {
    total: number
    synced: number
    failed: number
    conflicts: number
}

interface UseOfflineSyncOptions {
    /** Called on each sync step */
    onProgress?: (progress: SyncProgress) => void
    /** Called when a conflict is detected */
    onConflict?: (action: PendingAction) => void
    /** Authorization token for API calls */
    authToken?: string
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
    const isOnline = useOnlineStatus()
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSync, setLastSync] = useState<SyncProgress | null>(null)
    const syncingRef = useRef(false)

    const syncAll = useCallback(async () => {
        if (syncingRef.current) return // prevent concurrent syncs
        syncingRef.current = true
        setIsSyncing(true)

        try {
            // Clean stale actions first
            await cleanStaleActions()

            const pending = await getPendingActions()
            const actionable = pending.filter(a => a.status === 'pending' || a.status === 'failed')
            if (actionable.length === 0) {
                setIsSyncing(false)
                syncingRef.current = false
                return
            }

            devLog(`[Sync] Processing ${actionable.length} pending actions...`)

            const progress: SyncProgress = { total: actionable.length, synced: 0, failed: 0, conflicts: 0 }

            for (const action of actionable) {
                // Skip if retried too many times
                if (action.retryCount >= MAX_RETRY_ATTEMPTS) {
                    action.status = 'failed'
                    await updatePendingAction(action)
                    progress.failed++
                    options.onProgress?.(progress)
                    continue
                }

                // Exponential backoff with jitter
                if (action.lastAttempt) {
                    const backoffMs = Math.min(
                        1000 * Math.pow(2, action.retryCount) + Math.random() * 500,
                        30_000
                    )
                    const elapsed = Date.now() - action.lastAttempt
                    if (elapsed < backoffMs) {
                        continue // Not yet time to retry
                    }
                }

                try {
                    // Mark as syncing
                    action.status = 'syncing'
                    action.lastAttempt = Date.now()
                    action.retryCount++
                    await updatePendingAction(action)

                    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

                    // Conflict detection via If-Unmodified-Since
                    if (action.lastModified) {
                        headers['If-Unmodified-Since'] = action.lastModified
                    }
                    if (options.authToken) {
                        headers['Authorization'] = `Bearer ${options.authToken}`
                    }

                    const res = await fetch(action.endpoint, {
                        method: action.method,
                        headers,
                        body: JSON.stringify(action.body),
                    })

                    if (res.ok) {
                        await removePendingAction(action.id)
                        progress.synced++
                        devLog(`[Sync] ✓ ${action.type} synced`)
                    } else if (res.status === 409 || res.status === 412) {
                        // 409 Conflict or 412 Precondition Failed
                        action.status = 'conflict'
                        await updatePendingAction(action)
                        progress.conflicts++
                        options.onConflict?.(action)
                        devLog(`[Sync] ⚠ ${action.type} conflict detected`)
                    } else {
                        // Server error → will retry
                        action.status = 'pending'
                        await updatePendingAction(action)
                        progress.failed++
                        devLog(`[Sync] ✗ ${action.type} server error ${res.status}, will retry`)
                    }
                } catch {
                    // Network error → will retry
                    action.status = 'pending'
                    await updatePendingAction(action)
                    progress.failed++
                    devLog(`[Sync] ✗ ${action.type} network error, will retry`)
                }

                options.onProgress?.(progress)
            }

            setLastSync(progress)
        } finally {
            setIsSyncing(false)
            syncingRef.current = false
        }
    }, [options])

    useEffect(() => {
        if (isOnline) {
            syncAll()
        }
    }, [isOnline, syncAll])

    return { isSyncing, lastSync, syncAll }
}

/* ═══════════════════════════════════════════════════════════════
   PUSH NOTIFICATION HELPER
   ═══════════════════════════════════════════════════════════════ */

export async function requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        devLog('[Push] Notifications not supported')
        return 'denied'
    }

    const permission = await Notification.requestPermission()
    devLog('[Push] Permission:', permission)
    return permission
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) return null

    const reg = await navigator.serviceWorker.ready
    try {
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        })
        devLog('[Push] Subscribed:', subscription.endpoint)
        return subscription
    } catch (err) {
        console.error('[Push] Subscription failed:', err)
        return null
    }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
