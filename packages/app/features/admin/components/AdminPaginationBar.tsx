'use client'

import * as React from 'react'
import { useI18n } from '../../i18n'

interface PaginationBarProps {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    hasPrev: boolean
    hasNext: boolean
    prev: () => void
    next: () => void
}

export const AdminPaginationBar: React.FC<PaginationBarProps> = ({
    currentPage, totalPages, totalItems, pageSize,
    hasPrev, hasNext, prev, next,
}) => {
    const { t } = useI18n()
    if (totalPages <= 1) return null

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    return (
        <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 border-t border-(--vct-border-subtle)"
            role="navigation"
            aria-label={t('common.pagination') ?? 'Phân trang'}
        >
            <span className="text-xs text-(--vct-text-tertiary)">
                {t('common.showing') ?? 'Hiển thị'} {start}–{end} / {totalItems}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={prev}
                    disabled={!hasPrev}
                    aria-label={t('common.previous') ?? 'Trang trước'}
                    className="px-3 py-1 text-xs rounded-lg bg-(--vct-bg-elevated) text-(--vct-text-secondary) disabled:opacity-30 hover:bg-(--vct-bg-base) transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    ← {t('common.previous') ?? 'Trước'}
                </button>
                <span className="px-3 py-1 text-xs text-(--vct-text-tertiary)" aria-current="page">
                    {currentPage}/{totalPages}
                </span>
                <button
                    onClick={next}
                    disabled={!hasNext}
                    aria-label={t('common.next') ?? 'Trang sau'}
                    className="px-3 py-1 text-xs rounded-lg bg-(--vct-bg-elevated) text-(--vct-text-secondary) disabled:opacity-30 hover:bg-(--vct-bg-base) transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {t('common.next') ?? 'Sau'} →
                </button>
            </div>
        </div>
    )
}
