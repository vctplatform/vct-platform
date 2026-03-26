'use client'
import type { ReactNode, CSSProperties } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT SECTION CARD — V2 PREMIUM
// Standardized content card with accent, hover, glow effects
// ════════════════════════════════════════════════════════════════

interface SectionCardProps {
    children: ReactNode
    /** Card title */
    title?: string
    /** Icon element left of the title */
    icon?: ReactNode
    /** Right-side header action slot */
    headerAction?: ReactNode
    /** Alias for headerAction */
    action?: ReactNode
    /** Card footer slot */
    footer?: ReactNode
    /** Extra className */
    className?: string
    style?: CSSProperties
    /** Remove padding (useful for tables) */
    flush?: boolean
    /** Top accent stripe color */
    accentColor?: string
    /** Enable hover lift effect */
    hover?: boolean
    /** Enable glow shadow on hover */
    glow?: boolean
    /** onClick handler */
    onClick?: () => void
}

export const VCT_SectionCard = ({
    children,
    title,
    icon,
    headerAction,
    action,
    footer,
    className = '',
    style,
    flush = false,
    accentColor,
    hover = false,
    glow = false,
    onClick,
}: SectionCardProps) => {
    const resolvedAction = headerAction || action
    return (
        <div
            className={`rounded-2xl border border-vct-border bg-vct-elevated shadow-(--vct-shadow-sm) transition-all duration-200 ${hover ? 'vct-card-hover cursor-pointer' : ''} ${glow ? 'hover:shadow-(--vct-shadow-glow)' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
            style={{
                ...style,
                ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
            }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {(title || resolvedAction) && (
                <div className="flex items-center justify-between gap-4 border-b border-vct-border px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        {icon && (
                            <span className="shrink-0 text-lg text-vct-accent">{icon}</span>
                        )}
                        {title && (
                            <h3 className="m-0 text-base font-bold text-vct-text">{title}</h3>
                        )}
                    </div>
                    {resolvedAction && (
                        <div className="shrink-0">{resolvedAction}</div>
                    )}
                </div>
            )}
            <div className={flush ? '' : 'p-6'}>{children}</div>
            {footer && (
                <div className="border-t border-vct-border px-6 py-4">{footer}</div>
            )}
        </div>
    )
}
