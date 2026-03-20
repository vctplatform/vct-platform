'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient, ApiClientError } from '../data/api-client'
import { useAuth } from '../auth/AuthProvider'

interface UseApiQueryOptions<T = any> {
    /** Skip the query (useful for conditional fetching) */
    enabled?: boolean
    /** Refetch interval in milliseconds */
    refetchInterval?: number
    /** Initial fallback data */
    fallbackData?: T
}

interface UseApiQueryResult<T> {
    data: T | null
    error: ApiClientError | Error | null
    isLoading: boolean
    refetch: () => void
}

/**
 * React hook for data fetching with automatic auth token injection.
 * Provides loading/error/data states and supports conditional fetching.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery<Athlete[]>('/api/v1/athletes')
 * ```
 */
export function useApiQuery<T>(
    path: string,
    options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
    const { enabled = true, refetchInterval, fallbackData } = options
    const { token } = useAuth()

    const [data, setData] = useState<T | null>(fallbackData ?? null)
    const [error, setError] = useState<ApiClientError | Error | null>(null)
    const [isLoading, setIsLoading] = useState(enabled && data === null)
    const abortRef = useRef<AbortController | null>(null)

    const fetchData = useCallback(async () => {
        if (!enabled) return

        // Cancel previous request
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setIsLoading(true)
        setError(null)

        try {
            const result = await apiClient.get<T>(path, token ?? undefined)
            if (!controller.signal.aborted) {
                setData(result)
            }
        } catch (err) {
            if (!controller.signal.aborted) {
                setError(
                    err instanceof Error ? err : new Error(String(err))
                )
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false)
            }
        }
    }, [path, token, enabled])

    useEffect(() => {
        fetchData()
        return () => abortRef.current?.abort()
    }, [fetchData])

    // Polling support
    useEffect(() => {
        if (!refetchInterval || !enabled) return
        const interval = setInterval(fetchData, refetchInterval)
        return () => clearInterval(interval)
    }, [fetchData, refetchInterval, enabled])

    return { data, error, isLoading, refetch: fetchData }
}

interface UseApiMutationResult<TInput, TOutput> {
    mutate: (input: TInput) => Promise<TOutput>
    data: TOutput | null
    error: ApiClientError | Error | null
    isLoading: boolean
}

/**
 * React hook for data mutation (POST/PATCH/PUT/DELETE) with auth.
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useApiMutation<CreateAthleteInput, Athlete>(
 *   'POST', '/api/v1/athletes'
 * )
 * await mutate({ name: 'Nguyễn Văn A', ... })
 * ```
 */
export function useApiMutation<TInput, TOutput>(
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string
): UseApiMutationResult<TInput, TOutput> {
    const { token } = useAuth()
    const [data, setData] = useState<TOutput | null>(null)
    const [error, setError] = useState<ApiClientError | Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const mutate = useCallback(
        async (input: TInput): Promise<TOutput> => {
            setIsLoading(true)
            setError(null)

            try {
                let result: TOutput
                switch (method) {
                    case 'POST':
                        result = await apiClient.post<TOutput>(
                            path,
                            input,
                            token ?? undefined
                        )
                        break
                    case 'PATCH':
                        result = await apiClient.patch<TOutput>(
                            path,
                            input,
                            token ?? undefined
                        )
                        break
                    case 'PUT':
                        result = await apiClient.put<TOutput>(
                            path,
                            input,
                            token ?? undefined
                        )
                        break
                    case 'DELETE':
                        result = await apiClient.delete<TOutput>(
                            path,
                            token ?? undefined
                        )
                        break
                }
                setData(result)
                return result
            } catch (err) {
                const castError =
                    err instanceof Error ? err : new Error(String(err))
                setError(castError)
                throw castError
            } finally {
                setIsLoading(false)
            }
        },
        [method, path, token]
    )

    return { mutate, data, error, isLoading }
}
