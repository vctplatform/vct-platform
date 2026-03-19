import { useState, useCallback } from 'react'
import { apiFetch } from './useAdminAPI'

interface MutationOptions<TData> {
    /** Called on successful mutation */
    onSuccess?: (data: TData) => void
    /** Called on error */
    onError?: (error: Error) => void
    /** HTTP method override (default: POST) */
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
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
}

/**
 * Admin CRUD mutation hook.
 * Uses centralized apiFetch for consistent auth headers and API_BASE.
 */
export function useAdminMutation<TData = unknown, TPayload = unknown>(
    endpoint: string,
    options: MutationOptions<TData> = {}
): MutationResult<TData, TPayload> {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const { onSuccess, onError, method = 'POST' } = options

    const mutate = useCallback(async (payload?: TPayload): Promise<TData | null> => {
        setIsSubmitting(true)
        setError(null)

        try {
            const result = await apiFetch<TData>(endpoint, {
                method,
                ...(payload !== undefined && { body: JSON.stringify(payload) }),
            })
            onSuccess?.(result)
            return result
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err))
            setError(e)
            onError?.(e)
            return null
        } finally {
            setIsSubmitting(false)
        }
    }, [endpoint, method, onSuccess, onError])

    const reset = useCallback(() => setError(null), [])

    return { mutate, isSubmitting, error, reset }
}
