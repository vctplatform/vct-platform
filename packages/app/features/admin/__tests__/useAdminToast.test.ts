/**
 * Tests for useAdminToast hook.
 * Uses low-level React test rendering to avoid @testing-library/react dependency issues.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { useAdminToast } from '../hooks/useAdminToast'

// Helper to test hook without @testing-library/react
function createHookTest<T>(hook: () => T) {
    let result: { current: T | null } = { current: null }
    function TestComponent() {
        result.current = hook()
        return null
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = ReactDOM.createRoot(container)
    
    return {
        render: () => {
            React.act(() => { root.render(React.createElement(TestComponent)) })
        },
        result,
        cleanup: () => {
            React.act(() => { root.unmount() })
            container.remove()
        },
    }
}

describe('useAdminToast', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('initializes with hidden toast', () => {
        const hook = createHookTest(() => useAdminToast())
        hook.render()
        expect(hook.result.current!.toast.show).toBe(false)
        expect(hook.result.current!.toast.msg).toBe('')
        expect(hook.result.current!.toast.type).toBe('success')
        hook.cleanup()
    })

    it('showToast sets message and shows toast', () => {
        const hook = createHookTest(() => useAdminToast())
        hook.render()
        React.act(() => { hook.result.current!.showToast('Đã lưu thành công') })
        expect(hook.result.current!.toast.show).toBe(true)
        expect(hook.result.current!.toast.msg).toBe('Đã lưu thành công')
        hook.cleanup()
    })

    it('showToast accepts custom type', () => {
        const hook = createHookTest(() => useAdminToast())
        hook.render()
        React.act(() => { hook.result.current!.showToast('Lỗi!', 'error') })
        expect(hook.result.current!.toast.type).toBe('error')
        hook.cleanup()
    })

    it('dismiss() hides the toast', () => {
        const hook = createHookTest(() => useAdminToast())
        hook.render()
        React.act(() => { hook.result.current!.showToast('test') })
        expect(hook.result.current!.toast.show).toBe(true)
        React.act(() => { hook.result.current!.dismiss() })
        expect(hook.result.current!.toast.show).toBe(false)
        hook.cleanup()
    })

    it('supports all 4 toast types', () => {
        const hook = createHookTest(() => useAdminToast())
        hook.render()
        for (const type of ['success', 'warning', 'error', 'info'] as const) {
            React.act(() => { hook.result.current!.showToast(`msg-${type}`, type) })
            expect(hook.result.current!.toast.type).toBe(type)
        }
        hook.cleanup()
    })
})
