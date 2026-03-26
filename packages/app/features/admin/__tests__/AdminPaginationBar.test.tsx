import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { AdminPaginationBar } from '@vct/ui'

// Mock useI18n
vi.mock('../../i18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'common.pagination': 'Phân trang',
                'common.showing': 'Hiển thị',
                'common.previous': 'Trước',
                'common.next': 'Sau',
            }
            return translations[key] ?? key
        },
        locale: 'vi',
        setLocale: vi.fn(),
    }),
}))

describe('AdminPaginationBar', () => {
    const defaultProps = {
        currentPage: 2,
        totalPages: 5,
        totalItems: 50,
        pageSize: 10,
        hasPrev: true,
        hasNext: true,
        prev: vi.fn(),
        next: vi.fn(),
    }

    it('renders pagination info (start-end / total)', () => {
        render(React.createElement(AdminPaginationBar, defaultProps))
        // Page 2, pageSize 10: showing 11-20 / 50
        expect(screen.getByText(/11–20/)).toBeTruthy()
        expect(screen.getByText(/50/)).toBeTruthy()
    })

    it('renders current page / total pages', () => {
        render(React.createElement(AdminPaginationBar, defaultProps))
        expect(screen.getByText('2/5')).toBeTruthy()
    })

    it('calls prev() when previous button is clicked', () => {
        const prev = vi.fn()
        render(React.createElement(AdminPaginationBar, { ...defaultProps, prev }))
        const prevBtn = screen.getByLabelText('Trước')
        fireEvent.click(prevBtn)
        expect(prev).toHaveBeenCalledOnce()
    })

    it('calls next() when next button is clicked', () => {
        const next = vi.fn()
        render(React.createElement(AdminPaginationBar, { ...defaultProps, next }))
        const nextBtn = screen.getByLabelText('Sau')
        fireEvent.click(nextBtn)
        expect(next).toHaveBeenCalledOnce()
    })

    it('disables prev button when hasPrev is false', () => {
        render(React.createElement(AdminPaginationBar, { ...defaultProps, hasPrev: false }))
        const prevBtn = screen.getByLabelText('Trước')
        expect(prevBtn).toHaveProperty('disabled', true)
    })

    it('disables next button when hasNext is false', () => {
        render(React.createElement(AdminPaginationBar, { ...defaultProps, hasNext: false }))
        const nextBtn = screen.getByLabelText('Sau')
        expect(nextBtn).toHaveProperty('disabled', true)
    })

    it('returns null when totalPages <= 1', () => {
        const { container } = render(
            React.createElement(AdminPaginationBar, { ...defaultProps, totalPages: 1 })
        )
        expect(container.innerHTML).toBe('')
    })

    it('shows correct range for last page', () => {
        render(React.createElement(AdminPaginationBar, {
            ...defaultProps,
            currentPage: 5,
            totalPages: 5,
            totalItems: 47,
            pageSize: 10,
            hasNext: false,
        }))
        // Last page: items 41-47
        expect(screen.getByText(/41–47/)).toBeTruthy()
    })

    it('has correct ARIA navigation role', () => {
        render(React.createElement(AdminPaginationBar, defaultProps))
        const nav = screen.getByRole('navigation')
        expect(nav).toBeTruthy()
        expect(nav.getAttribute('aria-label')).toBe('Phân trang')
    })
})
