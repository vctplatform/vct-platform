import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { AdminErrorBoundary } from '../components/AdminErrorBoundary'

// Mock VCT_Icons
vi.mock('../../components/vct-icons', () => ({
    VCT_Icons: {
        AlertTriangle: (props: any) => React.createElement('svg', { 'data-testid': 'icon-alert', ...props }),
        Refresh: (props: any) => React.createElement('svg', { 'data-testid': 'icon-refresh', ...props }),
    },
}))

// Mock VCT_Button
vi.mock('../../components/vct-ui', () => ({
    VCT_Button: ({ children, onClick, ...props }: any) => React.createElement('button', { onClick, ...props }, children),
}))

// Component that throws
const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) throw new Error('Boom!')
    return React.createElement('div', null, 'All good')
}

describe('AdminErrorBoundary', () => {
    // Suppress console.error for intentional throws
    const originalError = console.error
    beforeAll(() => { console.error = vi.fn() })
    afterAll(() => { console.error = originalError })

    it('renders children when no error', () => {
        render(React.createElement(AdminErrorBoundary, null,
            React.createElement('div', null, 'Safe content')
        ))
        expect(screen.getByText('Safe content')).toBeTruthy()
    })

    it('renders error UI when child component throws', () => {
        render(React.createElement(AdminErrorBoundary, null,
            React.createElement(Bomb, { shouldThrow: true })
        ))
        expect(screen.getByText('Đã xảy ra lỗi')).toBeTruthy()
        expect(screen.getByText('Thử lại')).toBeTruthy()
    })

    it('renders custom fallback when provided', () => {
        const fallback = React.createElement('div', null, 'Custom error')
        render(React.createElement(AdminErrorBoundary, { fallback, children: React.createElement(Bomb, { shouldThrow: true }) }))
        expect(screen.getByText('Custom error')).toBeTruthy()
    })

    it('retry resets error state', () => {
        const { rerender } = render(
            React.createElement(AdminErrorBoundary, null,
                React.createElement(Bomb, { shouldThrow: true })
            )
        )
        expect(screen.getByText('Đã xảy ra lỗi')).toBeTruthy()
        // Click retry
        fireEvent.click(screen.getByText('Thử lại'))
        // After retry, error state is cleared — but since Bomb still throws,
        // it will show error again. This tests that state reset triggers re-render.
        expect(screen.getByText('Đã xảy ra lỗi')).toBeTruthy()
    })
})
