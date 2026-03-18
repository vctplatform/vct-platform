import { useState, useCallback } from 'react'

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
 * Provides a simple wrapper around fetch for create/update/delete operations
 * with automatic loading, error handling, and success/error callbacks.
 *
 * @example
 * ```tsx
 * const { mutate, isSubmitting } = useAdminMutation<User, CreateUserPayload>(
 *     '/admin/users',
 *     {
 *         onSuccess: (user) => showToast({ type: 'success', message: `Tạo ${user.name} thành công` }),
 *         onError: (err) => showToast({ type: 'error', message: err.message }),
 *     }
 * )
 *
 * // In handler:
 * await mutate({ name: 'John', email: 'john@example.com' })
 * ```
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
            const res = await fetch(endpoint, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                ...(payload !== undefined && { body: JSON.stringify(payload) }),
            })

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}))
                const message = errorBody?.message || errorBody?.error || `Request failed (${res.status})`
                throw new Error(message)
            }

            const data = await res.json() as TData
            onSuccess?.(data)
            return data
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
