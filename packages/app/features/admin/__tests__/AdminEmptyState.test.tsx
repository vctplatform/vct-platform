import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { AdminEmptyState } from '../components/AdminEmptyState'

// Mock VCT_Icons
vi.mock('../../components/vct-icons', () => ({
    VCT_Icons: {
        Search: (props: any) => React.createElement('svg', { 'data-testid': 'icon-search', ...props }),
        Plus: (props: any) => React.createElement('svg', { 'data-testid': 'icon-plus', ...props }),
    },
}))

// Mock VCT_Button
vi.mock('../../components/vct-ui', () => ({
    VCT_Button: ({ children, onClick, ...props }: any) => React.createElement('button', { onClick, ...props }, children),
}))

describe('AdminEmptyState', () => {
    it('renders with default title and description', () => {
        render(React.createElement(AdminEmptyState))
        expect(screen.getByText('Không có dữ liệu')).toBeTruthy()
        expect(screen.getByText('Thử thay đổi bộ lọc hoặc thêm mới')).toBeTruthy()
    })

    it('renders custom title and description', () => {
        render(React.createElement(AdminEmptyState, {
            title: 'No tickets',
            description: 'Create one to get started',
        }))
        expect(screen.getByText('No tickets')).toBeTruthy()
        expect(screen.getByText('Create one to get started')).toBeTruthy()
    })

    it('renders action button when actionLabel and onAction provided', () => {
        const onClick = vi.fn()
        render(React.createElement(AdminEmptyState, {
            actionLabel: 'Thêm mới',
            onAction: onClick,
        }))
        const btn = screen.getByText('Thêm mới')
        expect(btn).toBeTruthy()
        fireEvent.click(btn)
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('does NOT render action button when only actionLabel is provided', () => {
        render(React.createElement(AdminEmptyState, { actionLabel: 'Add' }))
        expect(screen.queryByText('Add')).toBeNull()
    })

    it('renders custom icon', () => {
        const icon = React.createElement('span', { 'data-testid': 'custom-icon' }, '★')
        render(React.createElement(AdminEmptyState, { icon }))
        expect(screen.getByTestId('custom-icon')).toBeTruthy()
    })
})
