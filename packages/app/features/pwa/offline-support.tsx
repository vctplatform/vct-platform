'use client'

/**
 * VCT Offline & PWA Utilities
 * 
 * Service worker registration, offline status detection,
 * and offline data queue for background sync.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text } from 'app/features/components/vct-ui'

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
                            background: isOnline ? '#22c55e' : '#ef4444',
                            color: '#fff',
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
   OFFLINE DATA QUEUE (IndexedDB)
   ═══════════════════════════════════════════════════════════════ */

const DB_NAME = 'vct-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-actions'

interface PendingAction {
    id: string
    type: 'score' | 'attendance' | 'injury' | 'general'
    endpoint: string
    method: 'POST' | 'PUT' | 'DELETE'
    body: Record<string, unknown>
    timestamp: number
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function queueOfflineAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const entry: PendingAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
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

export async function removePendingAction(id: string): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
}

/* ═══════════════════════════════════════════════════════════════
   AUTO-SYNC HOOK (sync when back online)
   ═══════════════════════════════════════════════════════════════ */

export function useOfflineSync() {
    const isOnline = useOnlineStatus()

    const syncAll = useCallback(async () => {
        const pending = await getPendingActions()
        if (pending.length === 0) return

        devLog(`[Sync] Processing ${pending.length} pending actions...`)

        for (const action of pending) {
            try {
                const res = await fetch(action.endpoint, {
                    method: action.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(action.body),
                })
                if (res.ok) {
                    await removePendingAction(action.id)
                    devLog(`[Sync] ✓ ${action.type} synced`)
                }
            } catch {
                devLog(`[Sync] ✗ ${action.type} failed, will retry`)
            }
        }
    }, [])

    useEffect(() => {
        if (isOnline) {
            syncAll()
        }
    }, [isOnline, syncAll])
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
