import { useState, useCallback, useRef, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — useApi Hook
// Generic data-fetching hook with loading, error, caching, retry.
// ═══════════════════════════════════════════════════════════════

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  /** Auto-fetch on mount (default: true) */
  immediate?: boolean
  /** Cache TTL in ms (default: 0 = no cache) */
  cacheTTL?: number
  /** Retry count on failure (default: 0) */
  retries?: number
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number
}

const apiCache = new Map<string, { data: unknown; expiry: number }>()

export function useApi<T>(
  fetcher: () => Promise<T>,
  cacheKey?: string,
  options: UseApiOptions = {}
) {
  const { immediate = true, cacheTTL = 0, retries = 0, retryDelay = 1000 } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })
  const mountedRef = useRef(true)
  const retriesRef = useRef(0)

  const execute = useCallback(async () => {
    // Check cache
    if (cacheKey && cacheTTL > 0) {
      const cached = apiCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        setState({ data: cached.data as T, loading: false, error: null })
        return cached.data as T
      }
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    retriesRef.current = 0

    const attemptFetch = async (): Promise<T> => {
      try {
        const result = await fetcher()
        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null })
          // Cache result
          if (cacheKey && cacheTTL > 0) {
            apiCache.set(cacheKey, { data: result, expiry: Date.now() + cacheTTL })
          }
        }
        return result
      } catch (err) {
        if (retriesRef.current < retries) {
          retriesRef.current++
          await new Promise((r) => setTimeout(r, retryDelay * retriesRef.current))
          return attemptFetch()
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (mountedRef.current) {
          setState({ data: null, loading: false, error: message })
        }
        throw err
      }
    }

    return attemptFetch()
  }, [fetcher, cacheKey, cacheTTL, retries, retryDelay])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
    if (cacheKey) apiCache.delete(cacheKey)
  }, [cacheKey])

  useEffect(() => {
    mountedRef.current = true
    if (immediate) {
      execute().catch(() => {})
    }
    return () => {
      mountedRef.current = false
    }
  }, [])  

  return { ...state, execute, reset, refetch: execute }
}

/** Invalidate a specific cache entry */
export function invalidateCache(key: string) {
  apiCache.delete(key)
}

/** Clear all cached API data */
export function clearApiCache() {
  apiCache.clear()
}
