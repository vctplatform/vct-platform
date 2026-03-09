/**
 * VCT Service Worker
 * 
 * Handles offline caching and background sync for the PWA.
 * 
 * Cache strategy:
 * - App Shell (HTML/JS/CSS):  Cache-first, fallback to network
 * - API calls:                Network-first, fallback to cache
 * - Static assets:            Cache-first (images, fonts)
 * - WebSocket:                Not cached (real-time only)
 */

const CACHE_NAME = 'vct-platform-v1'
const OFFLINE_URL = '/offline'

// App shell files to pre-cache
const APP_SHELL = [
    '/',
    '/offline',
    '/manifest.json',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching app shell')
            return cache.addAll(APP_SHELL)
        })
    )
    self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW] Removing old cache:', key)
                        return caches.delete(key)
                    })
            )
        )
    )
    self.clients.claim()
})

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip WebSocket, Chrome extension, etc.
    if (
        request.url.startsWith('ws://') ||
        request.url.startsWith('wss://') ||
        request.url.startsWith('chrome-extension://') ||
        request.url.includes('_next/webpack-hmr')
    ) {
        return
    }

    // API calls: Network-first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request))
        return
    }

    // Static assets: Cache-first
    if (
        request.destination === 'image' ||
        request.destination === 'font' ||
        url.pathname.startsWith('/icons/')
    ) {
        event.respondWith(cacheFirst(request))
        return
    }

    // Navigation & other: Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful navigations
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
                    return response
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || caches.match(OFFLINE_URL)
                    })
                })
        )
        return
    }

    // Default: Network-first
    event.respondWith(networkFirst(request))
})

// ── Strategies ──────────────────────────────────────────────

async function cacheFirst(request) {
    const cached = await caches.match(request)
    if (cached) return cached

    try {
        const response = await fetch(request)
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, response.clone())
        return response
    } catch {
        return new Response('Offline', { status: 503 })
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request)
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        const cached = await caches.match(request)
        return cached || new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// ── Background Sync ─────────────────────────────────────────

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scores') {
        event.waitUntil(syncPendingScores())
    }
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncPendingAttendance())
    }
})

async function syncPendingScores() {
    // Retrieve pending scores from IndexedDB and POST to server
    console.log('[SW] Syncing pending scores...')
}

async function syncPendingAttendance() {
    console.log('[SW] Syncing pending attendance...')
}

// ── Push Notifications ──────────────────────────────────────

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'VCT Platform', body: 'Cập nhật mới' }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: data.actions || [],
        tag: data.tag || 'vct-notification',
        renotify: true,
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const url = event.notification.data?.url || '/'

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window if open
            for (const client of clients) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus()
                }
            }
            // Open new window
            return self.clients.openWindow(url)
        })
    )
})
