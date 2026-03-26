'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RadioOption {
    value: string
    label: ReactNode
    disabled?: boolean
    description?: string
}

export interface VCTRadioGroupProps {
    /** Options to render */
    options: RadioOption[]
    /** Currently selected value */
    value?: string
    /** Change handler */
    onChange?: (value: string) => void
    /** Label above the group */
    label?: ReactNode
    /** Layout direction */
    direction?: 'row' | 'column'
    /** Error message */
    error?: ReactNode
    /** Unique name for the radio group */
    name?: string
    /** Disable entire group */
    disabled?: boolean
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_RadioGroup = ({
    options,
    value,
    onChange,
    label,
    direction = 'column',
    error,
    name,
    disabled = false,
    className,
}: VCTRadioGroupProps) => {
    const generatedName = React.useId()
    const groupName = name ?? generatedName

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
                role="radiogroup"
            >
                {options.map((option) => {
                    const isSelected = option.value === value
                    const isDisabled = disabled || option.disabled

                    return (
                        <label
                            key={option.value}
                            className={cn(
                                'group relative flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                                isSelected
                                    ? 'border-vct-accent bg-vct-accent/5'
                                    : 'border-vct-border bg-vct-elevated hover:border-vct-accent/40',
                                isDisabled && 'cursor-not-allowed opacity-50'
                            )}
                        >
                            {/* Custom radio circle */}
                            <span
                                className={cn(
                                    'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition',
                                    isSelected
                                        ? 'border-vct-accent'
                                        : 'border-vct-border group-hover:border-vct-accent/40'
                                )}
                            >
                                {isSelected ? (
                                    <span className="h-2.5 w-2.5 rounded-full bg-vct-accent" />
                                ) : null}
                            </span>

                            <input
                                type="radio"
                                name={groupName}
                                value={option.value}
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => onChange?.(option.value)}
                                className="sr-only"
                            />

                            <div className="grid gap-0.5">
                                <span className="font-semibold text-vct-text">
                                    {option.label}
                                </span>
                                {option.description ? (
                                    <span className="text-xs text-vct-text-muted">
                                        {option.description}
                                    </span>
                                ) : null}
                            </div>
                        </label>
                    )
                })}
            </div>

            {error ? (
                <div role="alert" className="text-xs font-semibold text-red-500">
                    {error}
                </div>
            ) : null}
        </fieldset>
    )
}

export const VCTRadioGroup = VCT_RadioGroup as FC<VCTRadioGroupProps>
