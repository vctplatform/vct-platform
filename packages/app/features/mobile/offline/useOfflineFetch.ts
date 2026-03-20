// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — useOfflineFetch Hook
// Cache-first data fetching with stale indicators.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineManager } from './offline-manager'

export interface OfflineFetchResult<T> {
  /** Fetched/cached data */
  data: T | null
  /** True during initial load */
  loading: boolean
  /** Error message if fetch failed and no cache */
  error: string | null
  /** True if showing cached data past its TTL */
  isStale: boolean
  /** True when device is offline */
  isOffline: boolean
  /** Age of cached data in milliseconds */
  dataAge: number
  /** Manually refresh data */
  refetch: () => Promise<void>
}

/**
 * Cache-first fetch hook.
 *
 * Strategy:
 * 1. Return cached data instantly (if available)
 * 2. Fetch fresh data in background (if online)
 * 3. Update cache + UI when fresh data arrives
 * 4. If offline + no cache → show error
 *
 * @param cacheKey - Unique key for caching (e.g., 'athlete:123')
 * @param fetcher - Async function that fetches fresh data
 * @param ttlMs - Cache TTL in ms (default: 5 minutes)
 *
 * @example
 * ```tsx
 * function ProfileScreen({ athleteId }: { athleteId: string }) {
 *   const { data, loading, isStale, isOffline } = useOfflineFetch(
 *     `athlete:${athleteId}`,
 *     () => fetchMyProfile(token),
 *     10 * 60 * 1000, // 10 min TTL
 *   )
 *
 *   if (loading) return <ScreenSkeleton />
 *   if (!data) return <EmptyState />
 *
 *   return (
 *     <View>
 *       {isStale && <Text>Dữ liệu cũ</Text>}
 *       <Text>{data.fullName}</Text>
 *     </View>
 *   )
 * }
 * ```
 */
export function useOfflineFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000,
): OfflineFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [dataAge, setDataAge] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return

    // 1. Try cache first (instant response)
    const cached = await offlineManager.get<T>(cacheKey)
    if (cached && mountedRef.current) {
      setData(cached.data)
      setIsStale(cached.isStale)
      setDataAge(cached.age)
      setLoading(false)
    }

    // 2. If online, fetch fresh data
    if (offlineManager.isOnline) {
      try {
        const fresh = await fetcher()
        if (!mountedRef.current) return

        setData(fresh)
        setIsStale(false)
        setDataAge(0)
        setError(null)
        await offlineManager.set(cacheKey, fresh, ttlMs)
      } catch (err) {
        if (!mountedRef.current) return

        // If we have cached data, don't overwrite with error
        if (!cached) {
          setError(
            err instanceof Error ? err.message : 'Không thể tải dữ liệu',
          )
        }
      }
    } else if (!cached) {
      // Offline + no cache
      if (mountedRef.current) {
        setError('Không có kết nối mạng và không có dữ liệu cache')
      }
    }

    if (mountedRef.current) {
      setLoading(false)
    }
  }, [cacheKey, fetcher, ttlMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    isStale,
    isOffline: !offlineManager.isOnline,
    dataAge,
    refetch: fetchData,
  }
}
