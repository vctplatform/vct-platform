'use client'
import type { ReactNode, CSSProperties } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT PAGE CONTAINER — V2 PREMIUM
// Unified page wrapper with optional hero section
// ════════════════════════════════════════════════════════════════

type PageContainerSize = 'narrow' | 'default' | 'wide' | 'full'

interface PageContainerProps {
    children: ReactNode
    /** Controls max-width: narrow=1024px, default=1280px, wide=1400px, full=none */
    size?: PageContainerSize
    /** Extra CSS className */
    className?: string
    style?: CSSProperties
    /** Set to false to remove bottom padding */
    bottomPadding?: boolean
    /** Stagger-in animation for children */
    animated?: boolean
}

const SIZE_CLASS: Record<PageContainerSize, string> = {
    narrow: 'max-w-5xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1400px]',
    full: 'max-w-none',
}

export const VCT_PageContainer = ({
    children,
    size = 'default',
    className = '',
    style,
    bottomPadding = true,
    animated = false,
}: PageContainerProps) => (
    <div
        className={`mx-auto w-full px-4 tablet:px-6 ${SIZE_CLASS[size]} ${bottomPadding ? 'pb-28' : ''} ${animated ? 'vct-stagger' : ''} ${className}`}
        style={style}
    >
        {children}
    </div>
)

// ════════════════════════════════════════════════════════════════
// VCT PAGE HERO — Premium page header with gradient background
// ════════════════════════════════════════════════════════════════

interface PageHeroProps {
    /** Page title */
    title: string
    /** Subtitle/description */
    subtitle?: string
    /** Icon or emoji element */
    icon?: ReactNode
    /** Status badge text */
    badge?: string
    /** Badge type for color */
    badgeType?: 'info' | 'success' | 'warning' | 'danger'
    /** Right-side action slot */
    actions?: ReactNode
    /** Gradient from color (CSS color) */
    gradientFrom?: string
    /** Gradient to color (CSS color) */
    gradientTo?: string
    /** Extra className */
    className?: string
}

const BADGE_COLORS: Record<string, string> = {
    info: 'bg-blue-500/15 text-blue-500 border-blue-500/25',
    success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
    danger: 'bg-red-500/15 text-red-500 border-red-500/25',
}

export const VCT_PageHero = ({
    title,
    subtitle,
    icon,
    badge,
    badgeType = 'info',
    actions,
    gradientFrom = 'rgba(14, 165, 233, 0.08)',
    gradientTo = 'rgba(139, 92, 246, 0.06)',
    className = '',
}: PageHeroProps) => (
    <div
        className={`relative mb-8 overflow-hidden rounded-2xl border border-vct-border bg-vct-elevated p-6 tablet:p-8 ${className}`}
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
    >
        {/* Decorative blur circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-vct-accent opacity-[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-500 opacity-[0.05] blur-[60px]" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-3">
                    {icon && (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-vct-accent/10 text-2xl text-vct-accent shadow-[0_4px_12px_rgba(14,165,233,0.15)]">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="m-0 text-xl font-black tracking-tight text-vct-text tablet:text-2xl">
                                {title}
                            </h1>
                            {badge && (
                                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${BADGE_COLORS[badgeType]}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="m-0 mt-1 max-w-2xl text-sm leading-relaxed text-vct-text-secondary">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    </div>
)
