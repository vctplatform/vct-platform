'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface VCTTextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    /** Controlled value */
    value?: string
    /** Change handler — receives string, not event */
    onChange?: (value: string) => void
    /** Label rendered above the textarea */
    label?: ReactNode
    /** Hint text below the textarea */
    tip?: string
    /** Error message (triggers danger styling) */
    error?: ReactNode
    /** Number of visible rows */
    rows?: number
    /** Maximum character count (shows counter) */
    maxLength?: number
    /** Auto-resize to content? */
    autoResize?: boolean
    /** Allow user to resize? */
    resize?: 'none' | 'vertical' | 'horizontal' | 'both'
    className?: string
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Textarea = ({
    value,
    onChange,
    label,
    tip,
    error,
    rows = 4,
    maxLength,
    autoResize = false,
    resize = 'vertical',
    className,
    style,
    placeholder,
    disabled,
    ...rest
}: VCTTextareaProps) => {
    const ref = React.useRef<HTMLTextAreaElement>(null)
    const charCount = value?.length ?? 0

    /* Auto-resize logic */
    React.useEffect(() => {
        if (!autoResize || !ref.current) return
        ref.current.style.height = 'auto'
        ref.current.style.height = `${ref.current.scrollHeight}px`
    }, [value, autoResize])

    const RESIZE_CLASS: Record<string, string> = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
    }

    return (
        <div className={cn('grid gap-1.5', className ?? '')}>
            {label ? (
                <label className="inline-flex items-center gap-1 text-xs font-bold text-vct-text-secondary">
                    <span>{label}</span>
                    {tip ? (
                        <span
                            title={tip}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-vct-border text-[10px] text-vct-text-muted"
                        >
                            i
                        </span>
                    ) : null}
                </label>
            ) : null}

            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    'w-full rounded-xl border bg-vct-input px-3 py-2.5 text-sm text-vct-text',
                    'outline-none transition focus:border-vct-accent',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    error
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-vct-border',
                    RESIZE_CLASS[autoResize ? 'none' : resize] ?? 'resize-y'
                )}
                style={style}
                aria-invalid={!!error}
                {...rest}
            />

            <div className="flex items-center justify-between gap-2">
                {error ? (
                    <div role="alert" className="text-xs font-semibold text-red-500">
                        {error}
                    </div>
                ) : (
                    <span />
                )}
                {maxLength ? (
                    <span
                        className={cn(
                            'text-[11px] font-semibold tabular-nums',
                            charCount >= maxLength
                                ? 'text-red-500'
                                : 'text-vct-text-muted'
                        )}
                    >
                        {charCount}/{maxLength}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

export const VCTTextarea = VCT_Textarea as FC<VCTTextareaProps>
