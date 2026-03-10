'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InfoGridItem {
    /** Leading icon */
    icon?: ReactNode
    /** Label text */
    label: ReactNode
    /** Value text */
    value: ReactNode
}

export interface VCTInfoGridProps {
    /** Items to display */
    items: InfoGridItem[]
    /** Number of columns (responsive) */
    columns?: 1 | 2 | 3 | 4
    /** Visual variant */
    variant?: 'default' | 'card' | 'inline'
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const COL_CLASS: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export const VCT_InfoGrid = ({
    items,
    columns = 2,
    variant = 'default',
    className,
}: VCTInfoGridProps) => {
    if (!items.length) return null

    return (
        <div className={cn('grid gap-4', COL_CLASS[columns] ?? 'grid-cols-2', className ?? '')}>
            {items.map((item, i) => {
                if (variant === 'inline') {
                    return (
                        <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-vct-border last:border-b-0">
                            <span className="text-xs font-semibold text-vct-text-muted">{item.label}</span>
                            <span className="text-sm font-bold text-vct-text text-right">{item.value}</span>
                        </div>
                    )
                }

                return (
                    <div
                        key={i}
                        className={cn(
                            'flex items-start gap-3',
                            variant === 'card' && 'rounded-xl border border-vct-border bg-vct-elevated p-3'
                        )}
                    >
                        {item.icon ? (
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vct-input text-vct-text-muted">
                                {item.icon}
                            </span>
                        ) : null}
                        <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-vct-text-muted leading-tight">
                                {item.label}
                            </div>
                            <div className="text-sm font-bold text-vct-text mt-0.5 break-words">
                                {item.value}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export const VCTInfoGrid = VCT_InfoGrid as FC<VCTInfoGridProps>
