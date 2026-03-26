'use client'
import type { ReactNode, CSSProperties } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT PAGE HEADER — V2 PREMIUM
// Standardized page header with icon, badge, gradient accent
// ════════════════════════════════════════════════════════════════

interface PageHeaderProps {
    /** Page title */
    title?: string
    /** Short subtitle/description text below the title */
    description?: string
    /** Icon element left of the title */
    icon?: ReactNode
    /** Status badge text */
    badge?: string
    /** Badge variant */
    badgeType?: 'info' | 'success' | 'warning' | 'danger'
    /** Right-side action slot — buttons, selects, etc. */
    actions?: ReactNode
    /** Additional className */
    className?: string
    style?: CSSProperties
    /** Show gradient accent underline */
    accent?: boolean
}

const BADGE_STYLES: Record<string, string> = {
    info: 'bg-blue-500/12 text-blue-500 border-blue-500/20',
    success: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/12 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/12 text-red-500 border-red-500/20',
}

export const VCT_PageHeader = ({
    title,
    description,
    icon,
    badge,
    badgeType = 'info',
    actions,
    className = '',
    style,
    accent = false,
}: PageHeaderProps) => (
    <div className={`mb-6 ${className}`} style={style}>
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
                {icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vct-accent/10 text-lg text-vct-accent">
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        {title && (
                            <h2 className="m-0 text-xl font-bold tracking-tight text-vct-text tablet:text-2xl">
                                {title}
                            </h2>
                        )}
                        {badge && (
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLES[badgeType]}`}>
                                {badge}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="m-0 mt-1 max-w-2xl text-sm leading-relaxed text-vct-text-secondary">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
        {accent && (
            <div className="mt-4 h-0.5 w-24 rounded-full" style={{ background: 'var(--vct-accent-gradient)' }} />
        )}
    </div>
)
