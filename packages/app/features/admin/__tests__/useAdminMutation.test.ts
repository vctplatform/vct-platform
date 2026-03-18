import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdminMutation } from '../hooks/useAdminMutation'

describe('useAdminMutation', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('starts with isSubmitting=false and error=null', () => {
        const { result } = renderHook(() =>
            useAdminMutation('/admin/test')
        )
        expect(result.current.isSubmitting).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('sets isSubmitting during mutation', async () => {
        // Mock a slow fetch
        vi.spyOn(globalThis, 'fetch').mockImplementation(
            () => new Promise(resolve =>
                setTimeout(() => resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })), 50)
            )
        )

        const { result } = renderHook(() =>
            useAdminMutation('/admin/test')
        )

        let mutatePromise: Promise<unknown>
        act(() => {
            mutatePromise = result.current.mutate({ name: 'test' })
        })

        expect(result.current.isSubmitting).toBe(true)

        await act(async () => {
            await mutatePromise!
        })

        expect(result.current.isSubmitting).toBe(false)
    })

    it('calls onSuccess with response data on success', async () => {
        const responseData = { id: '123', name: 'Test' }
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify(responseData), { status: 200 })
        )

        const onSuccess = vi.fn()
        const { result } = renderHook(() =>
            useAdminMutation('/admin/test', { onSuccess })
        )

        await act(async () => {
            await result.current.mutate({ name: 'Test' })
        })

        expect(onSuccess).toHaveBeenCalledWith(responseData)
        expect(result.current.error).toBeNull()
    })

    it('calls onError and sets error on failure', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ message: 'Not found' }), { status: 404, statusText: 'Not Found' })
        )

        const onError = vi.fn()
        const { result } = renderHook(() =>
            useAdminMutation('/admin/test', { onError })
        )

        await act(async () => {
            await result.current.mutate({ id: '123' })
        })

        expect(onError).toHaveBeenCalled()
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Not found')
    })

    it('reset() clears the error state', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'fail' }), { status: 500 })
        )

        const { result } = renderHook(() =>
            useAdminMutation('/admin/test')
        )

        await act(async () => {
            await result.current.mutate()
        })

        expect(result.current.error).not.toBeNull()

        act(() => {
            result.current.reset()
        })

        expect(result.current.error).toBeNull()
    })

    it('sends correct method and body', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({}), { status: 200 })
        )

        const { result } = renderHook(() =>
            useAdminMutation('/admin/test', { method: 'PUT' })
        )

        await act(async () => {
            await result.current.mutate({ name: 'Updated' })
        })

        expect(fetchSpy).toHaveBeenCalledWith('/admin/test', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ name: 'Updated' }),
            credentials: 'include',
        }))
    })
})
