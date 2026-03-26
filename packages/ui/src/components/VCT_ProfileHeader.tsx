'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProfileHeaderMeta {
    icon?: ReactNode
    text: ReactNode
}

export interface ProfileHeaderStat {
    value: ReactNode
    label: ReactNode
    color?: string
}

export interface VCTProfileHeaderProps {
    /** Primary name / title */
    name: ReactNode
    /** Avatar element (emoji, image, or VCT_Avatar) */
    avatar?: ReactNode
    /** Sub-line below name (role, team, etc) */
    subtitle?: ReactNode
    /** Badge elements rendered next to subtitle */
    badges?: ReactNode[]
    /** Icon + text meta pairs (location, phone, email...) */
    meta?: ProfileHeaderMeta[]
    /** Stat blocks in the corner */
    stats?: ProfileHeaderStat[]
    /** Action buttons (top-right) */
    actions?: ReactNode
    /** Gradient or solid color for banner */
    gradient?: string
    /** Use dark text (for light gradients) */
    darkText?: boolean
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_ProfileHeader = ({
    name,
    avatar,
    subtitle,
    badges,
    meta,
    stats,
    actions,
    gradient = 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
    darkText = false,
    className,
    style,
}: VCTProfileHeaderProps) => {
    const textClass = darkText ? 'text-gray-900' : 'text-white'
    const mutedClass = darkText ? 'text-gray-600' : 'text-white/80'

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl p-6 md:p-8',
                className ?? ''
            )}
            style={{ background: gradient, ...style }}
        >
            <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Avatar */}
                {avatar ? (
                    <div className="shrink-0">{avatar}</div>
                ) : null}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h1 className={cn('text-2xl font-black tracking-tight leading-tight', textClass)}>
                        {name}
                    </h1>

                    {/* Badges + subtitle */}
                    {(subtitle || badges?.length) ? (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {subtitle ? (
                                <span className={cn('text-sm font-semibold', mutedClass)}>
                                    {subtitle}
                                </span>
                            ) : null}
                            {badges?.map((badge, i) => (
                                <React.Fragment key={i}>{badge}</React.Fragment>
                            ))}
                        </div>
                    ) : null}

                    {/* Meta line */}
                    {meta?.length ? (
                        <div className={cn('flex flex-wrap items-center gap-4 mt-3 text-xs font-medium', mutedClass)}>
                            {meta.map((m, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5">
                                    {m.icon ? <span className="shrink-0">{m.icon}</span> : null}
                                    {m.text}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Actions */}
                {actions ? (
                    <div className="shrink-0 flex items-center gap-2">
                        {actions}
                    </div>
                ) : null}
            </div>

            {/* Stats row */}
            {stats?.length ? (
                <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-white/15">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className={cn(
                                'text-center px-4 py-2.5 rounded-xl min-w-[80px]',
                                darkText ? 'bg-black/5' : 'bg-white/15'
                            )}
                        >
                            <div
                                className={cn('text-xl font-black leading-none', textClass)}
                                style={stat.color ? { color: stat.color } : undefined}
                            >
                                {stat.value}
                            </div>
                            <div className={cn('text-[10px] font-semibold mt-1', mutedClass)}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export const VCTProfileHeader = VCT_ProfileHeader as FC<VCTProfileHeaderProps>
