'use client'
import type { ReactNode } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT EMPTY STATE
// Premium empty/coming-soon/no-data state component
// ════════════════════════════════════════════════════════════════

export interface EmptyStateProps {
    /** Large icon or emoji */
    icon?: ReactNode
    /** Title text */
    title: string
    /** Description text */
    description?: string
    /** Optional call-to-action button (ReactNode) */
    action?: ReactNode
    /** Legacy: action button label text */
    actionLabel?: string
    /** Legacy: action button click handler */
    onAction?: () => void
    /** Extra className */
    className?: string
    /** Compact mode (less padding) */
    compact?: boolean
}

export const VCT_EmptyState = ({
    icon = '📋',
    title,
    description,
    action,
    actionLabel,
    onAction,
    className = '',
    compact = false,
}: EmptyStateProps) => {
    // Resolve the action element: prefer `action` ReactNode, fallback to actionLabel + onAction
    const actionEl = action ?? (actionLabel && onAction ? (
        <button onClick={onAction} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[var(--vct-accent-cyan)] px-5 py-2.5 text-sm font-bold text-[var(--vct-bg-base)] shadow-[0_0_16px_var(--vct-accent-cyan)/30] transition-all hover:brightness-110 active:scale-[.97]">
            {actionLabel}
        </button>
    ) : null)

    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'} ${className}`}>
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-vct-input text-4xl shadow-[var(--vct-shadow-sm)]">
                {icon}
            </div>
            <h3 className="m-0 mb-1 text-base font-bold text-vct-text">{title}</h3>
            {description && (
                <p className="m-0 max-w-sm text-sm leading-relaxed text-vct-text-muted">{description}</p>
            )}
            {actionEl && <div className="mt-5">{actionEl}</div>}
        </div>
    )
}
