'use client'
import * as React from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const ALERT_TONE_CLASS: Record<AlertTone, string> = {
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
}

export interface VCTAlertProps {
  title?: React.ReactNode
  description?: React.ReactNode
  tone?: AlertTone
  className?: string
}

export const VCT_Alert = ({
  title,
  description,
  tone = 'info',
  className = '',
}: VCTAlertProps) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    className={cn(
      'grid gap-1 rounded-xl border px-3 py-2 text-sm',
      ALERT_TONE_CLASS[tone],
      className
    )}
  >
    {title ? <div className="font-extrabold">{title}</div> : null}
    {description ? <div className="opacity-90">{description}</div> : null}
  </div>
)

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'default' | 'ghost' | 'primary'

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  default:
    'border border-vct-border bg-vct-elevated text-vct-text-muted hover:bg-vct-input hover:text-vct-text',
  ghost:
    'border border-transparent bg-transparent text-vct-text-muted hover:border-vct-border hover:bg-vct-input hover:text-vct-text',
  primary:
    'border border-transparent bg-vct-accent text-white hover:brightness-105',
}

export interface VCTIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: React.ReactNode
  ariaLabel: string
  size?: IconButtonSize
  variant?: IconButtonVariant
}

export const VCT_IconButton = ({
  icon,
  ariaLabel,
  size = 'md',
  variant = 'default',
  className,
  type = 'button',
  ...rest
}: VCTIconButtonProps) => (
  <button
    type={type}
    aria-label={ariaLabel}
    className={cn(
      'inline-flex items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50',
      SIZE_CLASS[size],
      VARIANT_CLASS[variant],
      className ?? ''
    )}
    {...rest}
  >
    {icon}
  </button>
)

export interface VCTSpinnerProps {
  size?: number
  className?: string
  label?: string
}

export const VCT_Spinner = ({
  size = 16,
  className = '',
  label = 'Đang tải',
}: VCTSpinnerProps) => (
  <span
    role="status"
    aria-label={label}
    className={cn('inline-flex items-center justify-center', className)}
  >
    <span
      className="animate-spin rounded-full border-2 border-current border-r-transparent"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  </span>
)
