import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../hooks/useDebounce'

describe('useDebounce', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('returns initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300))
        expect(result.current).toBe('hello')
    })

    it('debounces value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        )
        expect(result.current).toBe('a')

        rerender({ value: 'ab' })
        expect(result.current).toBe('a') // Still old value

        act(() => { vi.advanceTimersByTime(300) })
        expect(result.current).toBe('ab') // Now updated
    })

    it('resets timer on rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'x' } }
        )

        rerender({ value: 'xy' })
        act(() => { vi.advanceTimersByTime(200) }) // 200ms < 300ms
        rerender({ value: 'xyz' }) // Resets timer
        act(() => { vi.advanceTimersByTime(200) }) // 200ms more
        expect(result.current).toBe('x') // Still original

        act(() => { vi.advanceTimersByTime(100) }) // Now 300ms since last change
        expect(result.current).toBe('xyz')
    })

    it('uses custom delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'start' } }
        )
        rerender({ value: 'changed' })
        act(() => { vi.advanceTimersByTime(300) })
        expect(result.current).toBe('start')
        act(() => { vi.advanceTimersByTime(200) })
        expect(result.current).toBe('changed')
    })
})
