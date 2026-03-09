'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────

export interface RealtimeEvent {
  type: string
  entity: string
  action: string
  itemId?: string
  channel?: string
  payload?: Record<string, unknown>
  timestamp: string
}

type EventHandler = (event: RealtimeEvent) => void

interface ChannelOptions {
  /** Auto-subscribe on mount, unsubscribe on unmount */
  autoSubscribe?: boolean
}

// ── WebSocket singleton ───────────────────────────────────────

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let manualClose = false
const channelHandlers = new Map<string, Set<EventHandler>>()
const globalHandlers = new Set<EventHandler>()

const getStoredAuthToken = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('vct:auth-session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: string; token?: string }
    return parsed.accessToken ?? parsed.token ?? null
  } catch {
    return null
  }
}

const resolveWebSocketUrl = () => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  const fallbackBase =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:18080'
  const normalizedBase = (envBase && envBase.length ? envBase : fallbackBase).replace(/\/$/, '')

  let wsBase = normalizedBase
  if (wsBase.startsWith('https://')) wsBase = `wss://${wsBase.slice(8)}`
  if (wsBase.startsWith('http://')) wsBase = `ws://${wsBase.slice(7)}`
  if (!wsBase.startsWith('ws://') && !wsBase.startsWith('wss://')) {
    wsBase = `ws://${wsBase}`
  }

  const wsUrl = wsBase.includes('/api/v1') ? `${wsBase}/ws` : `${wsBase}/api/v1/ws`
  const token = getStoredAuthToken()
  if (!token) return wsUrl
  const separator = wsUrl.includes('?') ? '&' : '?'
  return `${wsUrl}${separator}token=${encodeURIComponent(token)}`
}

const hasAnyListeners = () => channelHandlers.size > 0 || globalHandlers.size > 0

const dispatch = (event: RealtimeEvent) => {
  // Dispatch to global handlers
  globalHandlers.forEach((handler) => handler(event))

  // Dispatch to entity handlers (backward compat)
  const entityHandlers = channelHandlers.get(event.entity)
  entityHandlers?.forEach((handler) => handler(event))

  // Dispatch to channel handlers
  if (event.channel) {
    const chHandlers = channelHandlers.get(event.channel)
    chHandlers?.forEach((handler) => handler(event))
  }
}

const cleanupSocket = () => {
  if (!socket) return
  socket.onopen = null
  socket.onmessage = null
  socket.onerror = null
  socket.onclose = null
  socket.close()
  socket = null
}

const scheduleReconnect = () => {
  if (manualClose || !hasAnyListeners()) return
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 1500)
}

const sendCommand = (action: string, channel: string) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({ action, channel }))
}

const connect = () => {
  if (typeof window === 'undefined') return
  if (socket || !hasAnyListeners()) return

  manualClose = false
  const url = resolveWebSocketUrl()
  socket = new WebSocket(url)

  socket.onopen = () => {
    // Re-subscribe to all active channels
    channelHandlers.forEach((_, channel) => {
      sendCommand('subscribe', channel)
    })
  }

  socket.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data as string) as RealtimeEvent
      if (!event?.type) return
      dispatch(event)
    } catch {
      // ignore invalid payload
    }
  }

  socket.onerror = () => {
    scheduleReconnect()
  }

  socket.onclose = () => {
    socket = null
    scheduleReconnect()
  }
}

const disconnectIfIdle = () => {
  if (hasAnyListeners()) return
  manualClose = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  cleanupSocket()
}

// ── Public subscribe API ──────────────────────────────────────

export const subscribeToChannel = (channel: string, handler: EventHandler) => {
  if (!channel.trim()) return () => undefined

  const key = channel.trim()
  if (!channelHandlers.has(key)) {
    channelHandlers.set(key, new Set())
  }
  channelHandlers.get(key)?.add(handler)

  sendCommand('subscribe', key)
  connect()

  return () => {
    const bucket = channelHandlers.get(key)
    if (!bucket) return
    bucket.delete(handler)
    if (bucket.size === 0) {
      channelHandlers.delete(key)
      sendCommand('unsubscribe', key)
    }
    disconnectIfIdle()
  }
}

// Backward compatible: subscribe by entity name
export const subscribeToEntityRealtime = subscribeToChannel

// ── React Hooks ───────────────────────────────────────────────

/**
 * Subscribe to a realtime channel.
 * Channel examples: "scoring:match-123", "bracket:cat-456", "teams"
 */
export function useChannel(
  channel: string | null | undefined,
  onEvent: EventHandler,
  options: ChannelOptions = {}
) {
  const { autoSubscribe = true } = options
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!autoSubscribe || !channel) return
    const unsub = subscribeToChannel(channel, (evt) => handlerRef.current(evt))
    return unsub
  }, [channel, autoSubscribe])
}

/**
 * Subscribe to a channel and accumulate events in state.
 * Useful for live feeds, event logs, chat.
 */
export function useChannelEvents(channel: string | null | undefined, maxEvents = 50) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])

  useChannel(channel, (event) => {
    setEvents((prev) => {
      const next = [event, ...prev]
      return next.length > maxEvents ? next.slice(0, maxEvents) : next
    })
  })

  const clear = useCallback(() => setEvents([]), [])
  return { events, clear }
}

/**
 * Get the latest value from a channel with a specific entity/action filter.
 */
export function useChannelLatest(
  channel: string | null | undefined,
  filter?: { entity?: string; action?: string }
) {
  const [latest, setLatest] = useState<RealtimeEvent | null>(null)

  useChannel(channel, (event) => {
    if (filter?.entity && event.entity !== filter.entity) return
    if (filter?.action && event.action !== filter.action) return
    setLatest(event)
  })

  return latest
}

/**
 * Connection status hook.
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')

  useEffect(() => {
    const check = () => {
      if (!socket) setStatus('disconnected')
      else if (socket.readyState === WebSocket.OPEN) setStatus('connected')
      else if (socket.readyState === WebSocket.CONNECTING) setStatus('connecting')
      else setStatus('disconnected')
    }

    check()
    const interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [])

  return status
}
