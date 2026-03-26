'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  VCT_Checkbox                                                       */
/* ------------------------------------------------------------------ */

export interface VCTCheckboxProps {
    /** Is checked? */
    checked?: boolean
    /** Change handler */
    onChange?: (checked: boolean) => void
    /** Label next to the checkbox */
    label?: ReactNode
    /** Description below the label */
    description?: string
    /** Indeterminate state (partial selection) */
    indeterminate?: boolean
    /** Disables the checkbox */
    disabled?: boolean
    className?: string
}

export const VCT_Checkbox = ({
    checked = false,
    onChange,
    label,
    description,
    indeterminate = false,
    disabled = false,
    className,
}: VCTCheckboxProps) => {
    const ref = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate
        }
    }, [indeterminate])

    return (
        <label
            className={cn(
                'group inline-flex cursor-pointer items-start gap-2.5 text-sm',
                disabled && 'cursor-not-allowed opacity-50',
                className ?? ''
            )}
        >
            <span
                className={cn(
                    'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition',
                    checked || indeterminate
                        ? 'border-vct-accent bg-vct-accent'
                        : 'border-vct-border bg-vct-input group-hover:border-vct-accent/40'
                )}
            >
                {checked ? (
                    /* Checkmark SVG */
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="text-white"
                    >
                        <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : indeterminate ? (
                    /* Minus SVG */
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="text-white"
                    >
                        <path
                            d="M3 6H9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                ) : null}
            </span>

            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.checked)}
                className="sr-only"
            />

            {(label || description) ? (
                <div className="grid gap-0.5">
                    {label ? (
                        <span className="font-semibold text-vct-text">{label}</span>
                    ) : null}
                    {description ? (
                        <span className="text-xs text-vct-text-muted">{description}</span>
                    ) : null}
                </div>
            ) : null}
        </label>
    )
}

/* ------------------------------------------------------------------ */
/*  VCT_CheckboxGroup                                                  */
/* ------------------------------------------------------------------ */

export interface CheckboxOption {
    value: string
    label: ReactNode
    disabled?: boolean
    description?: string
}

export interface VCTCheckboxGroupProps {
    /** Options to render */
    options: CheckboxOption[]
    /** Currently selected values */
    value?: string[]
    /** Change handler */
    onChange?: (values: string[]) => void
    /** Label above the group */
    label?: ReactNode
    /** Layout direction */
    direction?: 'row' | 'column'
    /** Error message */
    error?: ReactNode
    /** Disable entire group */
    disabled?: boolean
    className?: string
}

export const VCT_CheckboxGroup = ({
    options,
    value = [],
    onChange,
    label,
    direction = 'column',
    error,
    disabled = false,
    className,
}: VCTCheckboxGroupProps) => {
    const handleToggle = (optionValue: string, checked: boolean) => {
        const next = checked
            ? [...value, optionValue]
            : value.filter((v) => v !== optionValue)
        onChange?.(next)
    }

    return (
        <fieldset
            className={cn('grid gap-2', className ?? '')}
            disabled={disabled}
        >
            {label ? (
                <legend className="text-xs font-bold text-vct-text-secondary mb-1">
                    {label}
                </legend>
            ) : null}

            <div
                className={cn(
                    'flex gap-3',
                    direction === 'column' ? 'flex-col' : 'flex-row flex-wrap'
                )}
                role="group"
            >
                {options.map((option) => (
                    <VCT_Checkbox
                        key={option.value}
                        checked={value.includes(option.value)}
                        onChange={(c) => handleToggle(option.value, c)}
                        label={option.label}
                        description={option.description}
                        disabled={disabled || option.disabled}
                    />
                ))}
            </div>

            {error ? (
                <div role="alert" className="text-xs font-semibold text-red-500">
                    {error}
                </div>
            ) : null}
        </fieldset>
    )
}

export const VCTCheckbox = VCT_Checkbox as FC<VCTCheckboxProps>
export const VCTCheckboxGroup = VCT_CheckboxGroup as FC<VCTCheckboxGroupProps>
