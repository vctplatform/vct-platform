'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTListItemProps {
    /** Leading element (avatar, icon, image) */
    leading?: ReactNode
    /** Primary text */
    title: ReactNode
    /** Secondary text */
    subtitle?: ReactNode
    /** Trailing content (badge, price, chevron, etc) */
    trailing?: ReactNode
    /** Click handler — makes the item interactive */
    onClick?: () => void
    /** Active/selected state */
    active?: boolean
    /** Disabled state */
    disabled?: boolean
    /** Visual variant */
    variant?: 'default' | 'bordered' | 'card'
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_ListItem = ({
    leading,
    title,
    subtitle,
    trailing,
    onClick,
    active = false,
    disabled = false,
    variant = 'default',
    className,
    style,
}: VCTListItemProps) => {
    const isClickable = !!onClick && !disabled
    const Tag = isClickable ? 'button' : 'div'

    const baseClass = cn(
        'flex w-full items-center gap-3 text-left transition',
        variant === 'card'
            ? 'rounded-xl border border-vct-border bg-vct-elevated p-4'
            : variant === 'bordered'
                ? 'rounded-xl border border-vct-border p-3'
                : 'px-3 py-2.5',
        isClickable && !active && 'cursor-pointer hover:bg-vct-input',
        isClickable && active && 'bg-vct-accent/5 border-vct-accent',
        active && variant !== 'default' && 'border-vct-accent',
        disabled && 'opacity-50 cursor-not-allowed',
        className ?? ''
    )

    return (
        <Tag
            className={baseClass}
            onClick={isClickable ? onClick : undefined}
            type={isClickable ? 'button' : undefined}
            disabled={disabled && isClickable}
            style={style}
        >
            {leading ? (
                <span className="shrink-0">{leading}</span>
            ) : null}

            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-vct-text truncate">
                    {title}
                </div>
                {subtitle ? (
                    <div className="text-[11px] text-vct-text-muted mt-0.5 truncate">
                        {subtitle}
                    </div>
                ) : null}
            </div>

            {trailing ? (
                <span className="shrink-0 text-right">{trailing}</span>
            ) : null}
        </Tag>
    )
}

export const VCTListItem = VCT_ListItem as FC<VCTListItemProps>
