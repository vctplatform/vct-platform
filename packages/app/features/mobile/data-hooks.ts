// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Data Hooks (SWR/Query pattern)
// React hooks wrapping the apiClient to provide data fetching,
// caching, revalidation, and pagination functionalities.
// Incorporates the offline cache seamlessly.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { requestJson } from './api-client'
import { useNetworkStatus } from './offline/useNetworkStatus'
import { offlineManager } from './offline/offline-manager'
import * as authStorage from './auth-storage'

// ── Types ────────────────────────────────────────────────────

export interface UseDataOptions<T> {
  /** Provide initial data to bypass loading state */
  initialData?: T
  /** Time in ms to keep data fresh before refetching */
  staleTime?: number
  /** Skip fetching entirely if false */
  enabled?: boolean
  /** Provide a fallback cache key for offline querying */
  cacheKey?: string
  /** Retry count on failure */
  retries?: number
}

export interface UseDataResult<T> {
  data: T | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

// ── Generic Hook ─────────────────────────────────────────────

/**
 * Generic data fetching hook combining API client with React state,
 * similar to SWR or React Query but built specifically for VCT.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useQuery<Athlete[]>(
 *   '/api/v1/athletes',
 *   { cacheKey: 'athlete-list' }
 * )
 * ```
 */
export function useQuery<T>(
  endpoint: string,
  options: UseDataOptions<T> = {}
): UseDataResult<T> {
  const {
    initialData = null,
    staleTime = 0, // Always fetch by default
    enabled = true,
    cacheKey,
    retries = 1,
  } = options

  const [data, setData] = useState<T | null>(initialData)
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && enabled)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const { isOnline } = useNetworkStatus()
  const lastFetched = useRef<number>(0)
  const mounted = useRef(true)

  // Explicit cache key or fallback to endpoint string
  const resolvedCacheKey = cacheKey || `query:${endpoint}`

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    const now = Date.now()
    const isStale = now - lastFetched.current > staleTime

    // Return early if not stale and not forced
    if (!force && !isStale && data) return

    setIsFetching(true)
    setError(null)

    try {
      if (!isOnline) {
        // Fetch from offline cache if available
        const cachedObj = await offlineManager.get<T>(resolvedCacheKey)
        const cached = cachedObj?.data
        if (cached && mounted.current) {
          setData(cached)
          // Don't set lastFetched to now, because the cache might be old
        } else if (mounted.current && !data) {
          setError(new Error('Vui lòng kết nối mạng để tải dữ liệu.'))
        }
        return
      }

      // We are online, fetch from API
      let attempt = 0
      let response: T | undefined

      const token = await authStorage.getAccessToken()

      while (attempt <= retries) {
        try {
          response = await requestJson<T>(endpoint, token, { method: 'GET' })
          break
        } catch (err) {
          attempt++
          if (attempt > retries) throw err
          // Backoff before retry
          await new Promise(r => setTimeout(r, attempt * 1000))
        }
      }

      if (mounted.current && response !== undefined) {
        setData(response)
        lastFetched.current = Date.now()
        // Save to offline cache asynchronously
        offlineManager.set(resolvedCacheKey, response).catch(() => {})
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error('Lỗi truy xuất dữ liệu.'))
        
        // If fetch failed but we have no data, attempt cache as last resort
        if (!data) {
          const cachedObj = await offlineManager.get<T>(resolvedCacheKey)
          const cached = cachedObj?.data
          if (cached && mounted.current) setData(cached)
        }
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false)
        setIsFetching(false)
      }
    }
  }, [endpoint, enabled, isOnline, data, staleTime, resolvedCacheKey, retries])

  // Initial fetch effect
  useEffect(() => {
    if (enabled && (!data || staleTime === 0)) {
      fetchData()
    } else if (!enabled && isLoading) {
      setIsLoading(false)
    }
  }, [enabled, endpoint, isOnline]) // Refetch if reconnect

  /** Mutate local data without refetching */
  const mutate = useCallback((newData: T) => {
    if (mounted.current) {
      setData(newData)
      offlineManager.set(resolvedCacheKey, newData).catch(() => {})
    }
  }, [resolvedCacheKey])

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch: () => fetchData(true),
    mutate,
  }
}

// ── Mutation Hook ────────────────────────────────────────────

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  error: Error | null
}

/**
 * Generic POST/PUT/DELETE hook for sending changes.
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutation<User, { name: string }>(
 *   '/api/v1/users',
 *   'POST'
 * )
 * ```
 */
export function useMutation<TData = any, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
): UseMutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { isOnline } = useNetworkStatus()

  const mutate = async (variables: TVariables): Promise<TData> => {
    if (!isOnline) {
      throw new Error('Dịch vụ cần kết nối mạng để lưu thay đổi.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = await authStorage.getAccessToken()
      const result = await requestJson<TData>(endpoint, token, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      })
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Lưu thất bại.')
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading, error }
}
