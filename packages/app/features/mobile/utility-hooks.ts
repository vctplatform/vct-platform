// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Utility Hooks
// Common React hooks: debounce, throttle, keyboard, dimensions,
// previous value, interval, and safe async effects.
// ═══════════════════════════════════════════════════════════════

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { Keyboard, Dimensions, type ScaledSize } from 'react-native'

// ── useDebounce ──────────────────────────────────────────────

/**
 * Debounce a value. Useful for search inputs.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ── useDebouncedCallback ─────────────────────────────────────

/**
 * Debounce a callback function.
 *
 * @example
 * ```tsx
 * const saveSearch = useDebouncedCallback((query: string) => {
 *   analytics.trackSearch(query)
 * }, 500)
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay],
  ) as T

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return debounced
}

// ── useThrottle ──────────────────────────────────────────────

/**
 * Throttle a value. Useful for scroll-position updates.
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0)
 * const throttledY = useThrottle(scrollY, 100)
 * ```
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttled, setThrottled] = useState(value)
  const lastUpdated = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now
      setThrottled(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottled(value)
      }, interval - (now - lastUpdated.current))
      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttled
}

// ── useKeyboard ──────────────────────────────────────────────

export interface KeyboardState {
  visible: boolean
  height: number
}

/**
 * Track keyboard visibility and height.
 *
 * @example
 * ```tsx
 * const { visible, height } = useKeyboard()
 * <View style={{ paddingBottom: visible ? height : 0 }}>
 *   <TextInput ... />
 * </View>
 * ```
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    visible: false,
    height: 0,
  })

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setState({ visible: true, height: e.endCoordinates.height })
    })
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setState({ visible: false, height: 0 })
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return state
}

// ── useDimensions ────────────────────────────────────────────

/**
 * Track screen dimensions (responds to rotation/resize).
 *
 * @example
 * ```tsx
 * const { width, height, isLandscape } = useDimensions()
 * const columns = isLandscape ? 3 : 2
 * ```
 */
export function useDimensions() {
  const [dims, setDims] = useState(Dimensions.get('window'))

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window)
    })
    return () => sub.remove()
  }, [])

  return {
    width: dims.width,
    height: dims.height,
    isLandscape: dims.width > dims.height,
    isPortrait: dims.height > dims.width,
    isSmallScreen: dims.width < 375,
    isMediumScreen: dims.width >= 375 && dims.width < 768,
    isLargeScreen: dims.width >= 768,
  }
}

// ── usePrevious ──────────────────────────────────────────────

/**
 * Get the previous value of a state variable.
 *
 * @example
 * ```tsx
 * const prevScore = usePrevious(score)
 * const scoreChanged = score !== prevScore
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

// ── useInterval ──────────────────────────────────────────────

/**
 * Safe setInterval hook. Automatically cleans up.
 * Pass null as delay to pause.
 *
 * @example
 * ```tsx
 * // Update timer every second
 * useInterval(() => setTime(Date.now()), isActive ? 1000 : null)
 * ```
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => callbackRef.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ── useTimeout ───────────────────────────────────────────────

/**
 * Safe setTimeout hook with reset capability.
 *
 * @example
 * ```tsx
 * const { reset, clear } = useTimeout(() => setShowTip(false), 5000)
 * ```
 */
export function useTimeout(callback: () => void, delay: number) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const reset = useCallback(() => {
    clear()
    timerRef.current = setTimeout(() => callbackRef.current(), delay)
  }, [delay, clear])

  useEffect(() => {
    reset()
    return clear
  }, [delay, reset, clear])

  return { reset, clear }
}

// ── useSafeAsync ─────────────────────────────────────────────

/**
 * Safe async effect — prevents setState after unmount.
 *
 * @example
 * ```tsx
 * const run = useSafeAsync()
 *
 * useEffect(() => {
 *   run(async (isMounted) => {
 *     const data = await fetchData()
 *     if (isMounted()) setData(data)
 *   })
 * }, [])
 * ```
 */
export function useSafeAsync() {
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return useCallback(
    (fn: (isMounted: () => boolean) => Promise<void>) => {
      fn(() => mountedRef.current)
    },
    [],
  )
}
