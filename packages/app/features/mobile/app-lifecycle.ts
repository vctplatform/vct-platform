// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — App Lifecycle Manager
// Tracks foreground/background state, session duration, auto-refresh
// stale data on resume, memory warnings, and graceful cleanup.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export type LifecycleState = 'active' | 'background' | 'inactive'

export type LifecycleListener = (
  state: LifecycleState,
  prevState: LifecycleState,
) => void

export interface SessionInfo {
  /** Session start timestamp */
  startedAt: number
  /** Duration in ms of current/last active session */
  durationMs: number
  /** Number of foreground transitions this session */
  resumeCount: number
  /** Time spent in background (ms) */
  backgroundTimeMs: number
}

export interface LifecycleHealth {
  /** Total active (foreground) time in ms */
  activeTimeMs: number
  /** Active/total ratio (0-1) — low ratio indicates frequent backgrounding */
  activeRatio: number
  /** Total state transitions */
  transitions: number
  /** Memory warnings received */
  memoryWarnings: number
  /** Last memory warning timestamp */
  lastMemoryWarning: number | null
}

// ── Manager ──────────────────────────────────────────────────

let _listenerIdCounter = 0

class AppLifecycleManager {
  private _state: LifecycleState = 'active'
  private _listeners = new Map<number, LifecycleListener>()
  private _sessionStart = Date.now()
  private _backgroundAt: number | null = null
  private _resumeCount = 0
  private _totalBackgroundMs = 0
  private _totalTransitions = 0
  private _memoryWarnings = 0
  private _lastMemoryWarning: number | null = null
  private _onResumeHandlers: Array<(backgroundDurationMs: number) => void> = []
  private _onBackgroundHandlers: Array<() => void> = []
  private _onMemoryWarningHandlers: Array<() => void> = []
  private _destroyed = false

  constructor() {
    AppState.addEventListener('change', this._handleChange)
    // Listen for memory warnings on supported platforms
    try {
      AppState.addEventListener('memoryWarning' as any, this._handleMemoryWarning)
    } catch {
      // Not supported on all platforms
    }
  }

  /** Current lifecycle state. */
  get state(): LifecycleState {
    return this._state
  }

  /** Whether app is in foreground. */
  get isActive(): boolean {
    return this._state === 'active'
  }

  /** Current session info. */
  get session(): SessionInfo {
    return {
      startedAt: this._sessionStart,
      durationMs: Date.now() - this._sessionStart,
      resumeCount: this._resumeCount,
      backgroundTimeMs: this._totalBackgroundMs,
    }
  }

  /** Get lifecycle health metrics. */
  get health(): LifecycleHealth {
    const totalMs = Date.now() - this._sessionStart
    const activeMs = totalMs - this._totalBackgroundMs
    return {
      activeTimeMs: Math.max(0, activeMs),
      activeRatio: totalMs > 0 ? Math.max(0, activeMs / totalMs) : 1,
      transitions: this._totalTransitions,
      memoryWarnings: this._memoryWarnings,
      lastMemoryWarning: this._lastMemoryWarning,
    }
  }

  /**
   * Register a handler to run when app returns to foreground.
   * Handler receives the background duration so you can decide
   * whether to refresh stale data.
   *
   * @returns Unsubscribe function
   */
  onResume(handler: (backgroundDurationMs: number) => void): () => void {
    this._onResumeHandlers.push(handler)
    return () => {
      this._onResumeHandlers = this._onResumeHandlers.filter((h) => h !== handler)
    }
  }

  /**
   * Register a handler to run when app goes to background.
   * Use for cleanup, saving drafts, pausing timers, etc.
   */
  onBackground(handler: () => void): () => void {
    this._onBackgroundHandlers.push(handler)
    return () => {
      this._onBackgroundHandlers = this._onBackgroundHandlers.filter((h) => h !== handler)
    }
  }

  /**
   * Register a handler for memory pressure warnings.
   * Use to release caches, heavy images, or optional data.
   */
  onMemoryWarning(handler: () => void): () => void {
    this._onMemoryWarningHandlers.push(handler)
    return () => {
      this._onMemoryWarningHandlers = this._onMemoryWarningHandlers.filter((h) => h !== handler)
    }
  }

  /** Generic state change listener with ID for explicit removal. */
  onChange(listener: LifecycleListener): number {
    const id = ++_listenerIdCounter
    this._listeners.set(id, listener)
    return id
  }

  /** Remove listener by ID. */
  removeListener(id: number): void {
    this._listeners.delete(id)
  }

  /** Reset session tracking. */
  resetSession(): void {
    this._sessionStart = Date.now()
    this._resumeCount = 0
    this._totalBackgroundMs = 0
    this._totalTransitions = 0
    this._memoryWarnings = 0
    this._lastMemoryWarning = null
  }

  /** Destroy the manager — remove all listeners. */
  destroy(): void {
    this._destroyed = true
    this._listeners.clear()
    this._onResumeHandlers = []
    this._onBackgroundHandlers = []
    this._onMemoryWarningHandlers = []
  }

  // ── Private ──────────────────────────────────────────────

  private _handleChange = (nextState: AppStateStatus): void => {
    if (this._destroyed) return

    const mapped: LifecycleState =
      nextState === 'active' ? 'active' :
      nextState === 'background' ? 'background' : 'inactive'

    if (mapped === this._state) return
    const prev = this._state
    this._state = mapped
    this._totalTransitions++

    // Background → Active: calculate background duration
    if (mapped === 'active' && prev !== 'active') {
      this._resumeCount++
      if (this._backgroundAt) {
        const bgDuration = Date.now() - this._backgroundAt
        this._totalBackgroundMs += bgDuration
        this._backgroundAt = null
        this._onResumeHandlers.forEach((h) => {
          try { h(bgDuration) } catch { /* protect main loop */ }
        })
      }
    }

    // Active → Background: record timestamp
    if (mapped === 'background' && prev === 'active') {
      this._backgroundAt = Date.now()
      this._onBackgroundHandlers.forEach((h) => {
        try { h() } catch { /* protect main loop */ }
      })
    }

    this._listeners.forEach((l) => {
      try { l(mapped, prev) } catch { /* protect main loop */ }
    })
  }

  private _handleMemoryWarning = (): void => {
    if (this._destroyed) return
    this._memoryWarnings++
    this._lastMemoryWarning = Date.now()

    this._onMemoryWarningHandlers.forEach((h) => {
      try { h() } catch { /* protect main loop */ }
    })
  }
}

// ── Singleton ────────────────────────────────────────────────

export const appLifecycle = new AppLifecycleManager()

// ── React Hooks ──────────────────────────────────────────────

/**
 * Hook that returns current app lifecycle state.
 */
export function useAppState(): LifecycleState {
  const [state, setState] = useState<LifecycleState>(appLifecycle.state)

  useEffect(() => {
    const id = appLifecycle.onChange((next) => setState(next))
    return () => appLifecycle.removeListener(id)
  }, [])

  return state
}

/**
 * Hook that returns reactive session info (updates on state changes).
 */
export function useAppSessionInfo(): SessionInfo {
  const [info, setInfo] = useState<SessionInfo>(appLifecycle.session)

  useEffect(() => {
    const id = appLifecycle.onChange(() => setInfo(appLifecycle.session))
    return () => appLifecycle.removeListener(id)
  }, [])

  return info
}

/**
 * Hook that runs a callback when app returns from background.
 * Auto-refreshes if background duration exceeds staleThreshold.
 */
export function useOnResume(
  callback: () => void,
  options: { staleThresholdMs?: number; immediate?: boolean } = {},
): void {
  const { staleThresholdMs = 0, immediate = false } = options
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  // Optionally fire immediately on mount
  const mountedRef = useRef(false)

  useEffect(() => {
    if (immediate && !mountedRef.current) {
      mountedRef.current = true
      callbackRef.current()
    }

    return appLifecycle.onResume((bgMs) => {
      if (bgMs >= staleThresholdMs) {
        callbackRef.current()
      }
    })
  }, [staleThresholdMs, immediate])
}

/**
 * Hook that runs a callback when app goes to background.
 */
export function useOnBackground(callback: () => void): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    return appLifecycle.onBackground(() => callbackRef.current())
  }, [])
}

/**
 * Hook that runs a callback on memory pressure warnings.
 * Use to release caches, optional data, heavy images.
 */
export function useOnMemoryWarning(callback: () => void): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    return appLifecycle.onMemoryWarning(() => callbackRef.current())
  }, [])
}

