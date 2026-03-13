'use client'

import { useMemo, useState, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — REUSABLE PAGINATION HOOK
// Client-side pagination for any array of items.
// ═══════════════════════════════════════════════════════════════

interface UsePaginationOptions {
    /** Items per page (default: 10) */
    pageSize?: number
    /** Initial page (default: 1) */
    initialPage?: number
}

interface UsePaginationResult<T> {
    /** Sliced items for the current page */
    paginatedItems: T[]
    /** Current page number (1-indexed) */
    currentPage: number
    /** Total number of pages */
    totalPages: number
    /** Total number of items */
    totalItems: number
    /** Whether there is a next page */
    hasNext: boolean
    /** Whether there is a previous page */
    hasPrev: boolean
    /** Go to a specific page */
    goToPage: (page: number) => void
    /** Go to next page */
    next: () => void
    /** Go to previous page */
    prev: () => void
    /** Reset to first page */
    reset: () => void
    /** Page size */
    pageSize: number
}

export function usePagination<T>(
    items: T[],
    options: UsePaginationOptions = {}
): UsePaginationResult<T> {
    const { pageSize = 10, initialPage = 1 } = options
    const [currentPage, setCurrentPage] = useState(initialPage)

    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    // Clamp page if items shrink (e.g. after filtering)
    const safePage = Math.min(currentPage, totalPages)

    const paginatedItems = useMemo(() => {
        const start = (safePage - 1) * pageSize
        return items.slice(start, start + pageSize)
    }, [items, safePage, pageSize])

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }, [totalPages])

    const next = useCallback(() => {
        setCurrentPage(p => Math.min(p + 1, totalPages))
    }, [totalPages])

    const prev = useCallback(() => {
        setCurrentPage(p => Math.max(p - 1, 1))
    }, [])

    const reset = useCallback(() => {
        setCurrentPage(1)
    }, [])

    return {
        paginatedItems,
        currentPage: safePage,
        totalPages,
        totalItems,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
        goToPage,
        next,
        prev,
        reset,
        pageSize,
    }
}
