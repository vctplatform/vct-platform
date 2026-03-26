'use client'

import type { ReactNode } from 'react'

/**
 * VCT_ResponsiveTable — Mobile-friendly table wrapper
 * Adds horizontal scroll + gradient fade indicators on mobile.
 */
interface ResponsiveTableProps {
    children: ReactNode
    className?: string
    /** Show column count in footer on mobile */
    colCount?: number
}

export function VCT_ResponsiveTable({ children, className, colCount }: ResponsiveTableProps) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) ${className ?? ''}`}>
            <div className="relative">
                {/* Scroll container */}
                <div className="overflow-x-auto vct-hide-scrollbar">
                    {children}
                </div>
                {/* Right fade indicator for scroll hint */}
                <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-8 bg-gradient-to-l from-(--vct-bg-glass) to-transparent sm:hidden max-sm:block" />
            </div>
            {colCount && (
                <div className="border-t border-(--vct-border-subtle) px-4 py-2 text-[10px] text-(--vct-text-tertiary) sm:hidden">
                    ← Vuốt ngang để xem thêm ({colCount} cột)
                </div>
            )}
        </div>
    )
}
