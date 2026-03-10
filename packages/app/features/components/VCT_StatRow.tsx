'use client'
import type { ReactNode } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT STAT ROW
// Horizontal row of mini stat blocks — reusable KPI summary
// ════════════════════════════════════════════════════════════════

export interface StatItem {
    label: string
    value: string | number
    icon?: ReactNode
    color?: string
    sub?: string
}

interface StatRowProps {
    items: StatItem[]
    className?: string
    /** Number of columns at different breakpoints */
    cols?: 2 | 3 | 4 | 5
}

const COL_CLASS: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 tablet:grid-cols-3',
    4: 'grid-cols-2 tablet:grid-cols-4',
    5: 'grid-cols-2 tablet:grid-cols-5',
}

export const VCT_StatRow = ({
    items,
    className = '',
    cols = 4,
}: StatRowProps) => (
    <div className={`grid gap-3 ${COL_CLASS[cols]} ${className}`}>
        {items.map((stat) => (
            <div
                key={stat.label}
                className="group relative overflow-hidden rounded-xl border border-vct-border bg-vct-elevated p-4 transition-all duration-200 hover:border-vct-border-strong hover:shadow-[var(--vct-shadow-md)]"
            >
                {/* Accent dot */}
                {stat.color && (
                    <div
                        className="absolute right-3 top-3 h-2 w-2 rounded-full opacity-60"
                        style={{ backgroundColor: stat.color }}
                    />
                )}
                <div className="flex items-center gap-3">
                    {stat.icon && (
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                            style={{
                                backgroundColor: stat.color || 'var(--vct-accent-cyan)',
                                boxShadow: `0 4px 12px ${stat.color || 'var(--vct-accent-cyan)'}30`,
                            }}
                        >
                            {stat.icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div
                            className="text-xl font-black leading-none"
                            style={{ color: stat.color || 'var(--vct-text-primary)' }}
                        >
                            {stat.value}
                        </div>
                        <div className="mt-1 truncate text-[11px] font-bold text-vct-text-muted">
                            {stat.label}
                        </div>
                    </div>
                </div>
                {stat.sub && (
                    <div className="mt-2 truncate text-[10px] font-semibold text-vct-text-muted">
                        {stat.sub}
                    </div>
                )}
            </div>
        ))}
    </div>
)
