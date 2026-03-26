'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'
import { cn, VCT_Button } from './vct-ui-layout'

export interface VCTFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: ReactNode
  error?: ReactNode
  children: ReactNode
  tip?: string
  hint?: string
  required?: boolean
}

export interface VCTInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  style?: CSSProperties
}

export interface VCTSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  loading?: boolean
  className?: string
  disabled?: boolean
  inputProps?: Omit<VCTInputProps, 'value' | 'onChange' | 'placeholder' | 'disabled'>
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface VCTSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string | number
  onChange?: (value: string) => void
  options?: SelectOption[]
  label?: ReactNode
  className?: string
}

export interface VCTSwitchProps {
  checked?: boolean
  isOn?: boolean
  onChange?: (value: boolean) => void
  onToggle?: (value: boolean) => void
  label?: ReactNode
  disabled?: boolean
  className?: string
}

export interface SegmentedOption {
  value: string
  label: string
}

export interface VCTSegmentedControlProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export interface VCTStepperProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  steps?: string[]
  currentStep?: number
  className?: string
}

export interface VCTScorePadProps {
  score?: number
  onScore?: (value: number) => void
  onAdd?: () => void
  onSub?: () => void
  min?: number
  max?: number
  step?: number
  label?: ReactNode
  color?: string
  className?: string
}

const Spinner = ({ size = 14 }: { size?: number }) => (
  <span
    className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent"
    style={{ width: `${size}px`, height: `${size}px` }}
    aria-hidden="true"
  />
)

export const VCT_Field = ({
  label,
  error,
  children,
  tip,
  hint,
  required,
  className,
  ...rest
}: VCTFieldProps) => (
  <div className={cn('grid gap-1.5', className ?? '')} {...rest}>
    {label ? (
      <label className="inline-flex items-center gap-1 text-xs font-bold text-vct-text-secondary">
        <span>{label}</span>
        {required ? (
          <span className="text-red-500">*</span>
        ) : null}
        {(tip || hint) ? (
          <span
            title={tip || hint}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-vct-border text-[10px] text-vct-text-muted"
          >
            i
          </span>
        ) : null}
      </label>
    ) : null}
    {children}
    {error ? (
      <div role="alert" className="text-xs font-semibold text-red-500">
        {error}
      </div>
    ) : null}
  </div>
)

export const VCT_Input = ({ className, style, ...props }: VCTInputProps) => (
  <input
    className={cn(
      'w-full rounded-xl border border-vct-border bg-vct-input px-3 py-2.5 text-sm text-vct-text',
      'outline-none transition focus:border-vct-accent disabled:cursor-not-allowed disabled:opacity-60',
      className ?? ''
    )}
    style={style}
    {...props}
  />
)

export const VCT_SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  loading = false,
  className,
  disabled = false,
  inputProps,
}: VCTSearchInputProps) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-xl border border-vct-border bg-vct-elevated px-3 py-2',
      disabled ? 'opacity-60' : '',
      className ?? ''
    )}
  >
    <span aria-hidden="true" className="text-vct-text-muted">
      {loading ? <Spinner size={14} /> : 'o'}
    </span>
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full border-none bg-transparent text-sm text-vct-text outline-none"
      {...inputProps}
    />
    {value ? (
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          onChange('')
          onClear?.()
        }}
        aria-label="Clear search"
        disabled={disabled}
        className="rounded-md px-2 py-1 text-xs font-bold text-vct-text-muted transition hover:bg-vct-input hover:text-vct-text"
      >
        x
      </button>
    ) : null}
  </div>
)

export const VCT_Select = ({
  value,
  onChange,
  options = [],
  label,
  className,
  disabled,
  ...rest
}: VCTSelectProps) => {
  const select = (
    <select
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-xl border border-vct-border bg-vct-input px-3 py-2.5 text-sm text-vct-text',
        'outline-none transition focus:border-vct-accent disabled:cursor-not-allowed disabled:opacity-60',
        className ?? ''
      )}
      {...rest}
    >
      {options.map((option) => (
        <option key={`${option.value}`} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )

  if (!label) {
    return select
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold text-vct-text-secondary">{label}</span>
      {select}
    </label>
  )
}

export const VCT_Switch = ({
  checked,
  isOn,
  onChange,
  onToggle,
  label,
  disabled = false,
  className,
}: VCTSwitchProps) => {
  const active = checked ?? isOn ?? false

  const handleToggle = () => {
    if (disabled) return
    const next = !active
    onChange?.(next)
    onToggle?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-vct-border px-2 py-1.5',
        'bg-vct-elevated text-sm font-semibold text-vct-text transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className ?? ''
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-10 items-center rounded-full transition',
          active ? 'bg-vct-accent' : 'bg-vct-border'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition',
            active ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  )
}

export const VCT_SegmentedControl = ({
  options,
  value,
  onChange,
  className,
}: VCTSegmentedControlProps) => (
  <div
    className={cn(
      'inline-flex flex-wrap gap-1 rounded-xl border border-vct-border bg-vct-input p-1',
      className ?? ''
    )}
  >
    {options.map((option) => {
      const isActive = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-bold transition',
            isActive
              ? 'bg-vct-accent text-white'
              : 'text-vct-text-secondary hover:bg-vct-elevated'
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

export const VCT_Stepper = ({
  value = 0,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  steps,
  currentStep = 0,
  className,
}: VCTStepperProps) => {
  if (steps?.length) {
    return (
      <div className={cn('grid gap-2', className ?? '')}>
        <div className="flex items-center gap-2">
          {steps.map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              <div
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black',
                  index <= currentStep
                    ? 'bg-vct-accent text-white'
                    : 'bg-vct-input text-vct-text-muted'
                )}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 ? (
                <div className="h-px flex-1 bg-vct-border" />
              ) : null}
            </React.Fragment>
          ))}
        </div>
        <div className="text-xs font-semibold text-vct-text-secondary">
          {steps[currentStep] ?? ''}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-vct-border bg-vct-elevated p-1',
        className ?? ''
      )}
    >
      <button
        type="button"
        onClick={() => onChange?.(Math.max(min, value - step))}
        className="rounded-lg px-2 py-1 text-sm font-black hover:bg-vct-input"
      >
        -
      </button>
      <span className="min-w-[44px] text-center text-sm font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange?.(Math.min(max, value + step))}
        className="rounded-lg px-2 py-1 text-sm font-black hover:bg-vct-input"
      >
        +
      </button>
    </div>
  )
}

export const VCT_ScorePad = ({
  score = 0,
  onScore,
  onAdd,
  onSub,
  min = 0,
  max = 999,
  step = 1,
  label = 'Score',
  color = 'var(--vct-accent-cyan)',
  className,
}: VCTScorePadProps) => {
  const handleSub = () => {
    if (onSub) {
      onSub()
      return
    }
    onScore?.(Math.max(min, score - step))
  }

  const handleAdd = () => {
    if (onAdd) {
      onAdd()
      return
    }
    onScore?.(Math.min(max, score + step))
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-vct-border bg-vct-elevated p-2',
        className ?? ''
      )}
    >
      <span className="text-xs font-bold text-vct-text-muted">{label}</span>
      <VCT_Button variant="secondary" size="small" onClick={handleSub}>
        -{step}
      </VCT_Button>
      <span
        className="min-w-[44px] rounded-lg px-2 py-1 text-center text-base font-black"
        style={{ color }}
      >
        {score}
      </span>
      <VCT_Button variant="secondary" size="small" onClick={handleAdd}>
        +{step}
      </VCT_Button>
    </div>
  )
}

export const VCTField = VCT_Field as FC<VCTFieldProps>
export const VCTInput = VCT_Input as FC<VCTInputProps>
export const VCTSearchInput = VCT_SearchInput as FC<VCTSearchInputProps>
export const VCTSelect = VCT_Select as FC<VCTSelectProps>
export const VCTSwitch = VCT_Switch as FC<VCTSwitchProps>
export const VCTSegmentedControl = VCT_SegmentedControl as FC<VCTSegmentedControlProps>
export const VCTStepper = VCT_Stepper as FC<VCTStepperProps>
export const VCTScorePad = VCT_ScorePad as FC<VCTScorePadProps>
