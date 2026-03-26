'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTStatBlockProps {
    /** Large numeric/text value */
    value: ReactNode
    /** Description label */
    label: ReactNode
    /** Icon element */
    icon?: ReactNode
    /** Accent color for the value */
    color?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
    /** Visual variant */
    variant?: 'default' | 'outlined' | 'filled'
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SIZE_CONFIG: Record<string, { value: string; label: string; padding: string; iconSize: string }> = {
    sm: { value: 'text-lg', label: 'text-[10px]', padding: 'p-2.5', iconSize: 'h-6 w-6' },
    md: { value: 'text-xl', label: 'text-[11px]', padding: 'p-3.5', iconSize: 'h-8 w-8' },
    lg: { value: 'text-[28px]', label: 'text-xs', padding: 'p-4', iconSize: 'h-10 w-10' },
}

export const VCT_StatBlock = ({
    value,
    label,
    icon,
    color,
    size = 'md',
    variant = 'default',
    className,
    style,
}: VCTStatBlockProps) => {
    const cfg = SIZE_CONFIG[size]!

    const containerClass = cn(
        'rounded-xl text-center transition',
        cfg.padding,
        variant === 'outlined'
            ? 'border border-vct-border bg-transparent'
            : variant === 'filled'
                ? 'bg-vct-input'
                : 'bg-vct-elevated',
        className ?? ''
    )

    return (
        <div className={containerClass} style={style}>
            {icon ? (
                <div className="flex justify-center mb-1.5">
                    <span
                        className={cn(
                            'inline-flex items-center justify-center rounded-lg',
                            cfg.iconSize
                        )}
                        style={color ? { color } : undefined}
                    >
                        {icon}
                    </span>
                </div>
            ) : null}

            <div
                className={cn('font-black leading-none', cfg.value)}
                style={color ? { color } : undefined}
            >
                {value}
            </div>

            <div className={cn('font-semibold text-vct-text-muted mt-1', cfg.label)}>
                {label}
            </div>
        </div>
    )
}

export const VCTStatBlock = VCT_StatBlock as FC<VCTStatBlockProps>
