'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTNumberInputProps {
    /** Current value */
    value?: number
    /** Change handler */
    onChange?: (value: number) => void
    /** Minimum value */
    min?: number
    /** Maximum value */
    max?: number
    /** Step increment */
    step?: number
    /** Prefix text (e.g. "$") */
    prefix?: ReactNode
    /** Suffix text (e.g. "kg") */
    suffix?: ReactNode
    /** Label above the input */
    label?: ReactNode
    /** Error message */
    error?: ReactNode
    /** Placeholder */
    placeholder?: string
    /** Disable the input */
    disabled?: boolean
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SIZE: Record<string, { input: string; btn: string }> = {
    sm: { input: 'h-8 text-xs px-2', btn: 'w-7 text-xs' },
    md: { input: 'h-10 text-sm px-3', btn: 'w-9 text-sm' },
    lg: { input: 'h-12 text-base px-4', btn: 'w-11 text-base' },
}

export const VCT_NumberInput = ({
    value = 0,
    onChange,
    min,
    max,
    step = 1,
    prefix,
    suffix,
    label,
    error,
    placeholder,
    disabled = false,
    size = 'md',
    className,
    style,
}: VCTNumberInputProps) => {
    const cfg = SIZE[size]!

    const clamp = (v: number) => {
        let n = v
        if (min !== undefined) n = Math.max(min, n)
        if (max !== undefined) n = Math.min(max, n)
        return n
    }

    const increment = () => {
        if (disabled) return
        onChange?.(clamp(value + step))
    }

    const decrement = () => {
        if (disabled) return
        onChange?.(clamp(value - step))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        if (raw === '' || raw === '-') return
        const parsed = parseFloat(raw)
        if (!isNaN(parsed)) {
            onChange?.(clamp(parsed))
        }
    }

    const atMin = min !== undefined && value <= min
    const atMax = max !== undefined && value >= max

    return (
        <div className={cn('grid gap-1.5', className ?? '')} style={style}>
            {label ? (
                <label className="text-xs font-bold text-vct-text-secondary">
                    {label}
                </label>
            ) : null}

            <div
                className={cn(
                    'inline-flex items-center rounded-xl border overflow-hidden transition',
                    error ? 'border-red-500' : 'border-vct-border focus-within:border-vct-accent',
                    'bg-vct-input',
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
            >
                {/* Decrement */}
                <button
                    type="button"
                    onClick={decrement}
                    disabled={disabled || atMin}
                    className={cn(
                        'shrink-0 inline-flex items-center justify-center border-r border-vct-border font-bold transition',
                        cfg.btn,
                        'text-vct-text-muted hover:bg-vct-elevated hover:text-vct-text',
                        'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    aria-label="Giảm"
                >
                    −
                </button>

                {/* Prefix */}
                {prefix ? (
                    <span className="pl-2 text-xs font-semibold text-vct-text-muted shrink-0">{prefix}</span>
                ) : null}

                {/* Input */}
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        'flex-1 min-w-0 border-none bg-transparent text-center font-bold text-vct-text outline-none tabular-nums',
                        cfg.input
                    )}
                />

                {/* Suffix */}
                {suffix ? (
                    <span className="pr-2 text-xs font-semibold text-vct-text-muted shrink-0">{suffix}</span>
                ) : null}

                {/* Increment */}
                <button
                    type="button"
                    onClick={increment}
                    disabled={disabled || atMax}
                    className={cn(
                        'shrink-0 inline-flex items-center justify-center border-l border-vct-border font-bold transition',
                        cfg.btn,
                        'text-vct-text-muted hover:bg-vct-elevated hover:text-vct-text',
                        'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    aria-label="Tăng"
                >
                    +
                </button>
            </div>

            {error ? (
                <div role="alert" className="text-xs font-semibold text-red-500">
                    {error}
                </div>
            ) : null}
        </div>
    )
}

export const VCTNumberInput = VCT_NumberInput as FC<VCTNumberInputProps>
