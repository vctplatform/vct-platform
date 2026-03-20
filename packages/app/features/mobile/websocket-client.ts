// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — WebSocket Client
// Managed WebSocket for live scoring, notifications, and
// real-time tournament updates. Auto-reconnect + heartbeat.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react'
import { AppState } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface WSMessage<T = unknown> {
  type: string
  payload: T
  timestamp: number
}

export interface WSConfig {
  /** WebSocket server URL */
  url: string
  /** Auth token to send on connect */
  token?: string
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect: boolean
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts: number
  /** Base reconnect delay in ms (default: 1000) */
  reconnectDelay: number
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval: number
  /** Heartbeat timeout — disconnect if no pong (default: 10000) */
  heartbeatTimeout: number
  /** Pause when app goes to background (default: true) */
  pauseInBackground: boolean
}

export type WSListener<T = unknown> = (message: WSMessage<T>) => void

// ── WebSocket Manager ────────────────────────────────────────

const DEFAULT_CONFIG: Partial<WSConfig> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000,
  pauseInBackground: true,
}

export class WebSocketClient {
  private _ws: WebSocket | null = null
  private _config: WSConfig
  private _status: WSStatus = 'disconnected'
  private _listeners = new Map<string, Set<WSListener>>()
  private _statusListeners = new Set<(status: WSStatus) => void>()
  private _reconnectAttempt = 0
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private _heartbeatPendingTimer: ReturnType<typeof setTimeout> | null = null
  private _appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null

  constructor(config: WSConfig) {
    this._config = { ...DEFAULT_CONFIG, ...config } as WSConfig
  }

  /** Current connection status. */
  get status(): WSStatus {
    return this._status
  }

  /** Whether actively connected. */
  get isConnected(): boolean {
    return this._status === 'connected'
  }

  // ── Connect / Disconnect ─────────────────────────────────

  connect(): void {
    if (this._ws?.readyState === WebSocket.OPEN) return

    this._setStatus('connecting')

    const url = this._config.token
      ? `${this._config.url}?token=${this._config.token}`
      : this._config.url

    try {
      this._ws = new WebSocket(url)
    } catch {
      this._setStatus('disconnected')
      this._scheduleReconnect()
      return
    }

    this._ws.onopen = () => {
      this._setStatus('connected')
      this._reconnectAttempt = 0
      this._startHeartbeat()

      if (this._config.pauseInBackground) {
        this._appStateSubscription = AppState.addEventListener('change', (state) => {
          if (state === 'background') this._pauseConnection()
          if (state === 'active') this._resumeConnection()
        })
      }
    }

    this._ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)

        // Heartbeat pong
        if (message.type === 'pong') {
          this._clearHeartbeatPending()
          return
        }

        // Dispatch to type-specific listeners
        const listeners = this._listeners.get(message.type)
        listeners?.forEach((fn) => fn(message))

        // Wildcard listeners
        const wildcardListeners = this._listeners.get('*')
        wildcardListeners?.forEach((fn) => fn(message))
      } catch {
        // Invalid message format
      }
    }

    this._ws.onclose = () => {
      this._cleanup()
      this._setStatus('disconnected')
      this._scheduleReconnect()
    }

    this._ws.onerror = () => {
      // onclose will follow
    }
  }

  disconnect(): void {
    this._config.autoReconnect = false
    this._cleanup()
    this._ws?.close()
    this._ws = null
    this._setStatus('disconnected')
  }

  // ── Send ─────────────────────────────────────────────────

  /**
   * Send a typed message.
   *
   * @example
   * ```ts
   * ws.send('score.update', { matchId: '123', points: 2 })
   * ```
   */
  send<T>(type: string, payload: T): boolean {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return false

    const message: WSMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    }

    try {
      this._ws.send(JSON.stringify(message))
      return true
    } catch {
      return false
    }
  }

  // ── Subscribe ────────────────────────────────────────────

  /**
   * Listen for a specific message type.
   * Use '*' to listen for all messages.
   *
   * @returns Unsubscribe function
   *
   * @example
   * ```ts
   * const unsub = ws.on('score.updated', (msg) => {
   *   updateScore(msg.payload)
   * })
   * ```
   */
  on<T = unknown>(type: string, listener: WSListener<T>): () => void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set())
    }
    this._listeners.get(type)!.add(listener as WSListener)

    return () => {
      this._listeners.get(type)?.delete(listener as WSListener)
    }
  }

  /** Subscribe to status changes. */
  onStatusChange(listener: (status: WSStatus) => void): () => void {
    this._statusListeners.add(listener)
    return () => this._statusListeners.delete(listener)
  }

  // ── Private ──────────────────────────────────────────────

  private _setStatus(status: WSStatus): void {
    this._status = status
    this._statusListeners.forEach((fn) => fn(status))
  }

  private _startHeartbeat(): void {
    this._heartbeatTimer = setInterval(() => {
      this.send('ping', {})
      this._heartbeatPendingTimer = setTimeout(() => {
        // No pong received — connection is dead
        this._ws?.close()
      }, this._config.heartbeatTimeout)
    }, this._config.heartbeatInterval)
  }

  private _clearHeartbeatPending(): void {
    if (this._heartbeatPendingTimer) {
      clearTimeout(this._heartbeatPendingTimer)
      this._heartbeatPendingTimer = null
    }
  }

  private _scheduleReconnect(): void {
    if (!this._config.autoReconnect) return
    if (this._reconnectAttempt >= this._config.maxReconnectAttempts) return

    this._setStatus('reconnecting')
    const delay = this._config.reconnectDelay * Math.pow(2, this._reconnectAttempt)
    const jitter = delay * 0.1 * Math.random()

    this._reconnectTimer = setTimeout(() => {
      this._reconnectAttempt++
      this.connect()
    }, Math.min(delay + jitter, 30000))
  }

  private _pauseConnection(): void {
    this._cleanup()
    this._ws?.close()
    this._ws = null
  }

  private _resumeConnection(): void {
    this._reconnectAttempt = 0
    this.connect()
  }

  private _cleanup(): void {
    if (this._heartbeatTimer) clearInterval(this._heartbeatTimer)
    if (this._heartbeatPendingTimer) clearTimeout(this._heartbeatPendingTimer)
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer)
    this._appStateSubscription?.remove()
    this._heartbeatTimer = null
    this._heartbeatPendingTimer = null
    this._reconnectTimer = null
    this._appStateSubscription = null
  }
}

// ── React Hook ───────────────────────────────────────────────

/**
 * Hook for WebSocket connection in components.
 *
 * @example
 * ```tsx
 * function LiveScore({ matchId }: { matchId: string }) {
 *   const { status, send, lastMessage } = useWebSocket({
 *     url: 'wss://api.vct-platform.com/ws',
 *     token: authToken,
 *   })
 *
 *   useEffect(() => {
 *     send('match.subscribe', { matchId })
 *   }, [matchId])
 *
 *   return <Text>Status: {status}</Text>
 * }
 * ```
 */
export function useWebSocket<T = unknown>(
  config: WSConfig,
  messageType?: string,
) {
  const clientRef = useRef<WebSocketClient | null>(null)
  const [status, setStatus] = useState<WSStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WSMessage<T> | null>(null)

  useEffect(() => {
    const client = new WebSocketClient(config)
    clientRef.current = client

    client.onStatusChange(setStatus)

    if (messageType) {
      client.on<T>(messageType, (msg) => setLastMessage(msg))
    }

    client.connect()

    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [config.url, config.token])

  const send = useCallback(<P>(type: string, payload: P) => {
    return clientRef.current?.send(type, payload) ?? false
  }, [])

  return { status, lastMessage, send, client: clientRef.current }
}
