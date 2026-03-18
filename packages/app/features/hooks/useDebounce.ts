import { useState, useEffect } from 'react'

/**
 * Debounce a value — returns the debounced value after the specified delay.
 * Useful for search inputs to avoid excessive filtering/API calls.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * // Use debouncedSearch in useMemo/useEffect for filtering
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}
