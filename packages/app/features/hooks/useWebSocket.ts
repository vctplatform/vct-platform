'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

interface EntityChangeEvent {
    type: 'entity.changed'
    entity: string
    action: string
    itemId: string
    payload: Record<string, unknown>
    timestamp: string
}

interface UseWebSocketOptions {
    /** WebSocket server URL (defaults to ws://localhost:18080/api/v1/ws) */
    url?: string
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean
    /** Max reconnect attempts */
    maxReconnectAttempts?: number
    /** Channels to subscribe to (e.g., ['athletes', 'tournaments']) */
    channels?: string[]
    /** Callback for entity change events */
    onEntityChange?: (event: EntityChangeEvent) => void
    /** Only connect when true */
    enabled?: boolean
}

interface UseWebSocketResult {
    /** Current connection status */
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
    /** Send a message to the server */
    send: (message: Record<string, unknown>) => void
    /** Last received entity change event */
    lastEvent: EntityChangeEvent | null
}

/**
 * React hook for WebSocket connection to VCT backend realtime hub.
 * Features:
 * - Auto-authentication via JWT token
 * - Auto-reconnect with exponential backoff
 * - Channel subscription for entity change events
 *
 * @example
 * ```tsx
 * const { status, lastEvent } = useWebSocket({
 *   channels: ['athletes', 'tournaments'],
 *   onEntityChange: (event) => {
 *     console.log('Entity changed:', event)
 *     refetch() // trigger re-fetch of data
 *   },
 * })
 * ```
 */
export function useWebSocket(
    options: UseWebSocketOptions = {}
): UseWebSocketResult {
    const {
        url,
        autoReconnect = true,
        maxReconnectAttempts = 5,
        channels = [],
        onEntityChange,
        enabled = true,
    } = options

    const { token } = useAuth()
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectCountRef = useRef(0)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>()
    const onEntityChangeRef = useRef(onEntityChange)
    onEntityChangeRef.current = onEntityChange

    const [status, setStatus] = useState<UseWebSocketResult['status']>('disconnected')
    const [lastEvent, setLastEvent] = useState<EntityChangeEvent | null>(null)

    const wsUrl =
        url ??
        (typeof window !== 'undefined'
            ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:18080/api/v1/ws`
            : 'ws://localhost:18080/api/v1/ws')

    const connect = useCallback(() => {
        if (!enabled || !token) return

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws
            setStatus('connecting')

            ws.onopen = () => {
                setStatus('connected')
                reconnectCountRef.current = 0

                // Authenticate via first message
                ws.send(JSON.stringify({ action: 'auth', token }))

                // Subscribe to channels
                for (const channel of channels) {
                    ws.send(JSON.stringify({ action: 'subscribe', channel }))
                }
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data as string) as EntityChangeEvent
                    if (data.type === 'entity.changed') {
                        setLastEvent(data)
                        onEntityChangeRef.current?.(data)
                    }
                } catch {
                    // ignore non-JSON messages
                }
            }

            ws.onerror = () => {
                setStatus('error')
            }

            ws.onclose = () => {
                setStatus('disconnected')
                wsRef.current = null

                // Auto-reconnect with exponential backoff
                if (
                    autoReconnect &&
                    reconnectCountRef.current < maxReconnectAttempts
                ) {
                    const delay = Math.min(
                        1000 * Math.pow(2, reconnectCountRef.current),
                        30000
                    )
                    reconnectCountRef.current++
                    reconnectTimerRef.current = setTimeout(connect, delay)
                }
            }
        } catch {
            setStatus('error')
        }
    }, [enabled, token, wsUrl, autoReconnect, maxReconnectAttempts, channels])

    useEffect(() => {
        connect()
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = undefined
            }
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [connect])

    const send = useCallback((message: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        }
    }, [])

    return { status, send, lastEvent }
}
