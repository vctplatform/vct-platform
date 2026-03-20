// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Performance Monitor Hook
// Track mobile app startup, frame rate, and memory usage.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react'
import { InteractionManager, Platform } from 'react-native'

// ── Types ────────────────────────────────────────────────────

export interface PerformanceMetrics {
  /** App cold start → first render (ms) */
  startupTime: number | null
  /** Time to interactive after navigation (ms) */
  timeToInteractive: number | null
  /** Estimated JS thread frame rate */
  estimatedFPS: number | null
  /** JS heap memory usage (MB, Android only) */
  memoryUsageMB: number | null
  /** Whether performance sampling is active */
  isMonitoring: boolean
}

export interface PerformanceTimestamp {
  label: string
  time: number
  delta: number
}

// ── App Startup Timer ────────────────────────────────────────

/** Set this as early as possible (index.js or App.tsx) */
let _appStartTime = 0

/**
 * Mark the app start time. Call once in index.js or App.tsx.
 * @example `markAppStart()` — at the very top of your entry file
 */
export function markAppStart(): void {
  _appStartTime = Date.now()
}

/**
 * Get the time since markAppStart() was called.
 * Useful for measuring cold start performance.
 */
export function getTimeSinceStart(): number {
  return _appStartTime > 0 ? Date.now() - _appStartTime : 0
}

// ── Performance Monitor Hook ─────────────────────────────────

/**
 * Monitor screen-level performance metrics.
 *
 * @param screenName - Name for logging purposes
 *
 * @example
 * ```tsx
 * function TournamentListScreen() {
 *   const { metrics, markInteractive } = usePerformanceMonitor('TournamentList')
 *
 *   useEffect(() => {
 *     fetchTournaments().then(() => markInteractive())
 *   }, [])
 *
 *   if (__DEV__) {
 *     console.log(`[Perf] FPS: ${metrics.estimatedFPS}, TTI: ${metrics.timeToInteractive}ms`)
 *   }
 * }
 * ```
 */
export function usePerformanceMonitor(screenName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    startupTime: null,
    timeToInteractive: null,
    estimatedFPS: null,
    memoryUsageMB: null,
    isMonitoring: false,
  })

  const screenMountTime = useRef(Date.now())
  const frameCount = useRef(0)
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timestamps = useRef<PerformanceTimestamp[]>([])

  // Record startup time on first mount
  useEffect(() => {
    if (_appStartTime > 0) {
      setMetrics((m) => ({
        ...m,
        startupTime: Date.now() - _appStartTime,
      }))
    }
  }, [])

  // Measure TTI (Time to Interactive) via InteractionManager
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      const tti = Date.now() - screenMountTime.current
      setMetrics((m) => ({
        ...m,
        timeToInteractive: tti,
      }))

      if (__DEV__) {
        console.warn(`[Perf] ${screenName} TTI: ${tti}ms`)
      }
    })

    return () => handle.cancel()
  }, [screenName])

  // FPS estimation using requestAnimationFrame
  useEffect(() => {
    let isActive = true
    frameCount.current = 0

    const countFrame = () => {
      if (!isActive) return
      frameCount.current++
      requestAnimationFrame(countFrame)
    }

    requestAnimationFrame(countFrame)
    setMetrics((m) => ({ ...m, isMonitoring: true }))

    // Sample FPS every 2 seconds
    fpsIntervalRef.current = setInterval(() => {
      const fps = Math.round(frameCount.current / 2)
      frameCount.current = 0

      setMetrics((m) => ({
        ...m,
        estimatedFPS: fps,
      }))

      // Check memory (Android only via performance API)
      if (Platform.OS !== 'web') {
        try {
          // @ts-expect-error — React Native JSI exposes this on some engines
          const memInfo = global.performance?.memory
          if (memInfo) {
            setMetrics((m) => ({
              ...m,
              memoryUsageMB: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
            }))
          }
        } catch {
          // memory info not available
        }
      }
    }, 2000)

    return () => {
      isActive = false
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
      setMetrics((m) => ({ ...m, isMonitoring: false }))
    }
  }, [])

  /** Mark when the screen becomes fully interactive (data loaded) */
  const markInteractive = useCallback(() => {
    const tti = Date.now() - screenMountTime.current
    setMetrics((m) => ({ ...m, timeToInteractive: tti }))

    timestamps.current.push({
      label: 'interactive',
      time: Date.now(),
      delta: tti,
    })

    if (__DEV__) {
      console.warn(`[Perf] ${screenName} marked interactive: ${tti}ms`)
    }
  }, [screenName])

  /** Add a custom performance timestamp */
  const markTimestamp = useCallback(
    (label: string) => {
      const delta = Date.now() - screenMountTime.current
      timestamps.current.push({ label, time: Date.now(), delta })

      if (__DEV__) {
        console.warn(`[Perf] ${screenName}/${label}: ${delta}ms`)
      }
    },
    [screenName],
  )

  /** Get all recorded timestamps for this screen */
  const getTimestamps = useCallback(() => [...timestamps.current], [])

  return {
    metrics,
    markInteractive,
    markTimestamp,
    getTimestamps,
  }
}
