import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Centralized admin API hook with auth, error handling, retry, and mock fallback.
 *
 * Features:
 * - Auto-attaches auth token from cookie (NOT localStorage)
 * - Automatic retry with exponential backoff
 * - Falls back to mock data when USE_MOCK=true or backend unavailable
 * - Loading/error state management
 */

// ── Config ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// ── Types ──
interface FetchState<T> {
    data: T | null
    error: string | null
    isLoading: boolean
}

interface UseAdminFetchOptions<T> {
    /** Mock data to use when backend is unavailable */
    mockData?: T
    /** Whether to fetch on mount (default: true) */
    immediate?: boolean
    /** Dependencies that trigger a refetch */
    deps?: unknown[]
}

interface MutateOptions {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
}

// ── Auth helper — reads from cookie, NOT localStorage ──
function getAuthHeaders(): Record<string, string> {
    // Auth token should be set as httpOnly cookie by backend.
    // We only send Content-Type; the browser auto-includes cookies.
    return { 'Content-Type': 'application/json' }
}

// ── Core fetch with retry ──
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(fullUrl, {
                credentials: 'include', // Include httpOnly cookies
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options?.headers,
                },
            })

            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText)
                throw new Error(`${res.status}: ${text}`)
            }

            const json = await res.json()
            return json.data ?? json
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
            }
        }
    }

    throw lastError ?? new Error('Unknown fetch error')
}

// ── Main hook ──
export function useAdminFetch<T>(
    url: string,
    options: UseAdminFetchOptions<T> = {}
): FetchState<T> & { refetch: () => void; mutate: (opts: MutateOptions) => Promise<T | null> } {
    const { mockData, immediate = true, deps = [] } = options
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        error: null,
        isLoading: immediate,
    })
    const mountedRef = useRef(true)

    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Use mock data if configured
        if (USE_MOCK && mockData !== undefined) {
            // Simulate network delay for realistic UX
            await new Promise(r => setTimeout(r, 600))
            if (mountedRef.current) {
                setState({ data: mockData, error: null, isLoading: false })
            }
            return
        }

        try {
            const data = await apiFetch<T>(url)
            if (mountedRef.current) {
                setState({ data, error: null, isLoading: false })
            }
        } catch (err) {
            // Fallback to mock data on network error
            if (mockData !== undefined && mountedRef.current) {
                setState({ data: mockData, error: null, isLoading: false })
                return
            }
            if (mountedRef.current) {
                setState({
                    data: null,
                    error: err instanceof Error ? err.message : 'Unknown error',
                    isLoading: false,
                })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, USE_MOCK])

    useEffect(() => {
        mountedRef.current = true
        if (immediate) fetchData()
        return () => { mountedRef.current = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, ...deps])

    const mutate = useCallback(async (opts: MutateOptions): Promise<T | null> => {
        try {
            const result = await apiFetch<T>(url, {
                method: opts.method ?? 'POST',
                body: opts.body ? JSON.stringify(opts.body) : undefined,
            })
            // Refetch after mutation
            fetchData()
            return result
        } catch {
            return null
        }
    }, [url, fetchData])

    return { ...state, refetch: fetchData, mutate }
}

// ── Convenience typed hooks ──
export { apiFetch }
