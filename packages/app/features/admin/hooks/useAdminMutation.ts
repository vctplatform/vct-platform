import { useState, useCallback, useRef } from 'react'
import { apiFetch } from './useAdminAPI'

interface MutationOptions<TData, TPayload = unknown> {
    /** Called on successful mutation */
    onSuccess?: (data: TData) => void
    /** Called on error */
    onError?: (error: Error) => void
    /** HTTP method override (default: POST) */
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    /**
     * Optimistic update: called BEFORE the API call.
     * Return a rollback function to undo the optimistic update on error.
     */
    onMutate?: (payload?: TPayload) => (() => void) | void
    /** Number of retries on failure (default: 0) */
    retryCount?: number
    /** Delay between retries in ms (default: 1000) */
    retryDelay?: number
}

interface MutationResult<TData, TPayload> {
    /** Trigger the mutation */
    mutate: (payload?: TPayload) => Promise<TData | null>
    /** Whether mutation is in progress */
    isSubmitting: boolean
    /** Last error from the mutation */
    error: Error | null
    /** Reset error state */
    reset: () => void
    /** Number of mutation calls made */
    mutationCount: number
}

/**
 * Admin CRUD mutation hook with optimistic updates and retry logic.
 * Uses centralized apiFetch for consistent auth headers and API_BASE.
 */
export function useAdminMutation<TData = unknown, TPayload = unknown>(
    endpoint: string,
    options: MutationOptions<TData, TPayload> = {}
): MutationResult<TData, TPayload> {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const mutationCountRef = useRef(0)
    const [mutationCount, setMutationCount] = useState(0)

    const { onSuccess, onError, method = 'POST', onMutate, retryCount = 0, retryDelay = 1000 } = options

    const mutate = useCallback(async (payload?: TPayload): Promise<TData | null> => {
        setIsSubmitting(true)
        setError(null)
        mutationCountRef.current++
        setMutationCount(mutationCountRef.current)

        // Optimistic update — call onMutate and get rollback function
        const rollback = onMutate?.(payload)

        let lastError: Error | null = null

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
                }

                const result = await apiFetch<TData>(endpoint, {
                    method,
                    ...(payload !== undefined && { body: JSON.stringify(payload) }),
                })
                onSuccess?.(result)
                return result
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err))
                if (attempt === retryCount) {
                    // All retries exhausted — rollback optimistic update
                    rollback?.()
                    setError(lastError)
                    onError?.(lastError)
                }
            }
        }

        setIsSubmitting(false)
        return null
    }, [endpoint, method, onSuccess, onError, onMutate, retryCount, retryDelay])

    const reset = useCallback(() => setError(null), [])

    return { mutate, isSubmitting, error, reset, mutationCount }
}

