// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Analytics Hook
// Client-side event tracking for screens, actions, and performance.
// Features: Session tracking, offline queueing, standard helpers.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ────────────────────────────────────────────────────

export interface AnalyticsEvent {
  name: string
  params?: Record<string, string | number | boolean>
  timestamp: number
  sessionId: string
}

export type AnalyticsProvider = {
  trackEvent: (event: AnalyticsEvent) => Promise<boolean | void> | boolean | void
  trackScreen: (screenName: string, params?: Record<string, string>) => Promise<boolean | void> | boolean | void
  setUser: (userId: string, traits?: Record<string, string>) => Promise<boolean | void> | boolean | void
}

// ── Session Generation ───────────────────────────────────────

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Global Session ID (persists in memory during app lifecycle)
const SESSION_ID = generateUUID()
const QUEUE_STORAGE_KEY = 'vct_analytics_offline_queue'

// ── Default Provider (Console Logger) ────────────────────────

const consoleProvider: AnalyticsProvider = {
  trackEvent: (event) => {
    if (__DEV__) {
      console.log('[Analytics]', event.name, event.params ?? '', `[Session: ${event.sessionId}]`)
    }
  },
  trackScreen: (name, params) => {
    if (__DEV__) {
      console.log('[Analytics] Screen:', name, params ?? '')
    }
  },
  setUser: (userId, traits) => {
    if (__DEV__) {
      console.log('[Analytics] User:', userId, traits ?? '')
    }
  },
}

// ── Global State ─────────────────────────────────────────────

let _provider: AnalyticsProvider = consoleProvider
let _isOnline = true

/**
 * Set the analytics provider for the entire app.
 */
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  _provider = provider
}

/**
 * Notify the analytics engine about network status changes to trigger flushing.
 */
export function setAnalyticsOnlineStatus(isOnline: boolean) {
  _isOnline = isOnline
  if (isOnline) {
    flushOfflineQueue()
  }
}

// ── Offline Queue Manager ────────────────────────────────────

async function pushToOfflineQueue(event: AnalyticsEvent) {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
    const queue: AnalyticsEvent[] = queueStr ? JSON.parse(queueStr) : []
    queue.push(event)
    
    // Keep max 500 events to prevent storage bloat
    if (queue.length > 500) {
      queue.shift()
    }
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('[Analytics] Failed to queue event offline:', error)
  }
}

export async function flushOfflineQueue() {
  if (!_isOnline) return

  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
    if (!queueStr) return

    const queue: AnalyticsEvent[] = JSON.parse(queueStr)
    if (queue.length === 0) return

    // Clear queue preemptively (optimistic)
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY)

    const failedEvents: AnalyticsEvent[] = []

    // Process batched events
    for (const event of queue) {
      try {
        const success = await _provider.trackEvent(event)
        if (success === false) failedEvents.push(event) // Provider explicitly rejected
      } catch {
        failedEvents.push(event) // Network failed during flush
      }
    }

    // Restore failed events
    if (failedEvents.length > 0) {
      const currentQueueStr = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
      const currentQueue = currentQueueStr ? JSON.parse(currentQueueStr) : []
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([...failedEvents, ...currentQueue]))
    }
  } catch (error) {
    console.error('[Analytics] Error flushing offline queue:', error)
  }
}

// ── Internal Helpers ─────────────────────────────────────────

async function dispatchEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  const event: AnalyticsEvent = {
    name: eventName,
    params,
    timestamp: Date.now(),
    sessionId: SESSION_ID,
  }

  if (!_isOnline) {
    await pushToOfflineQueue(event)
    return
  }

  try {
    const success = await _provider.trackEvent(event)
    if (success === false) {
      await pushToOfflineQueue(event)
    }
  } catch {
    await pushToOfflineQueue(event)
  }
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Analytics hook for mobile screens.
 */
export function useAnalytics(screenName?: string) {
  const screenStartRef = useRef(Date.now())

  // Track screen view on mount (only if screenName is provided)
  useEffect(() => {
    if (!screenName) return

    screenStartRef.current = Date.now()
    _provider.trackScreen(screenName)

    return () => {
      const dwellTime = Date.now() - screenStartRef.current
      dispatchEvent('screen_exit', {
        screen: screenName,
        dwell_time_ms: dwellTime,
      })
    }
  }, [screenName])

  /** Track a generic user action */
  const trackAction = useCallback((action: string, params?: Record<string, string | number | boolean>) => {
    dispatchEvent(action, { screen: screenName || 'unknown', ...params })
  }, [screenName])

  /** Track system errors properly */
  const trackError = useCallback((errorName: string, message: string, params?: Record<string, string>) => {
    dispatchEvent('error', { 
      screen: screenName || 'global', 
      error_name: errorName, 
      message, 
      ...params 
    })
  }, [screenName])

  /** Track business conversions (e.g. upgrades, completions) */
  const trackConversion = useCallback((conversionName: string, value?: number, params?: Record<string, string>) => {
    dispatchEvent('conversion', { 
      screen: screenName || 'unknown',
      name: conversionName,
      value: value || 0,
      ...params 
    })
  }, [screenName])

  /** Track a timing (API call, animation, computation) */
  const trackTiming = useCallback((label: string, durationMs: number) => {
    dispatchEvent('timing', { screen: screenName || 'unknown', label, duration_ms: durationMs })
  }, [screenName])

  /** Create a timer that records duration on stop() */
  const startTimer = useCallback((label: string) => {
    const start = Date.now()
    return {
      stop: () => {
        const duration = Date.now() - start
        trackTiming(label, duration)
        return duration
      },
    }
  }, [trackTiming])

  /** Set the current user for analytics attribution */
  const identify = useCallback((userId: string, traits?: Record<string, string>) => {
    try {
      _provider.setUser(userId, traits)
    } catch {
      // Providers handle user traits offline syncing usually, but could be extended
    }
  }, [])

  /** Track a screen view manually */
  const trackScreen = useCallback((name: string, params?: Record<string, string>) => {
    try {
      _provider.trackScreen(name, params)
    } catch {
      // Fallback
    }
  }, [])

  return {
    trackAction,
    trackError,
    trackConversion,
    trackTiming,
    startTimer,
    identify,
    trackScreen,
    sessionId: SESSION_ID
  }
}
