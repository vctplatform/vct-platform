'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'

export const cn = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export interface VCTProviderProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export interface VCTStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  direction?: 'row' | 'column'
  gap?: number
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  /** Enable flex-wrap */
  wrap?: boolean
}

export interface VCTDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  vertical?: boolean
}

export interface VCTTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'mono'
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
  weight?: CSSProperties['fontWeight']
}

export interface VCTButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | string
  size?: 'sm' | 'small' | 'md' | 'lg' | string
  loading?: boolean
  icon?: ReactNode
}

export interface VCTCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: ReactNode
  title?: ReactNode
  headerAction?: ReactNode
  footer?: ReactNode
  /** Make the card body collapsible */
  collapsible?: boolean
  /** Starting collapsed state (only when collapsible=true) */
  defaultCollapsed?: boolean
}

export interface VCTResponsiveGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  tabletColumns?: 1 | 2 | 3 | 4 | 5 | 6
  desktopColumns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: number | string
}

export interface VCTGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  span?: 1 | 2 | 3 | 4 | 5 | 6
  tabletSpan?: 1 | 2 | 3 | 4 | 5 | 6
  desktopSpan?: 1 | 2 | 3 | 4 | 5 | 6
}

const TEXT_VARIANT_CLASS: Record<NonNullable<VCTTextProps['variant']>, string> = {
  h1: 'text-[26px] font-black tracking-[-0.02em] leading-[1.08] text-vct-text',
  h2: 'text-lg font-extrabold tracking-[-0.01em] text-vct-text',
  h3: 'text-[15px] font-bold text-vct-text',
  body: 'text-sm leading-6 text-vct-text-secondary',
  small:
    'text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted',
  mono: 'font-mono text-[13px] tracking-[-0.02em] text-vct-text',
}

const BUTTON_VARIANT_CLASS: Record<string, string> = {
  primary:
    'border border-transparent bg-vct-accent text-white shadow-[0_8px_20px_-4px_rgba(14,165,233,0.45)] hover:brightness-105',
  secondary:
    'border border-vct-border-strong bg-vct-elevated text-vct-text hover:bg-vct-input',
  danger:
    'border border-red-500/30 bg-red-500 text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.6)] hover:brightness-105',
  ghost:
    'border border-transparent bg-transparent text-vct-text-secondary hover:border-vct-border hover:bg-vct-input',
}

const BUTTON_SIZE_CLASS: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  small: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
}

const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

const TABLET_COL_CLASS: Record<number, string> = {
  1: 'tablet:grid-cols-1',
  2: 'tablet:grid-cols-2',
  3: 'tablet:grid-cols-3',
  4: 'tablet:grid-cols-4',
  5: 'tablet:grid-cols-5',
  6: 'tablet:grid-cols-6',
}

const DESKTOP_COL_CLASS: Record<number, string> = {
  1: 'desktop:grid-cols-1',
  2: 'desktop:grid-cols-2',
  3: 'desktop:grid-cols-3',
  4: 'desktop:grid-cols-4',
  5: 'desktop:grid-cols-5',
  6: 'desktop:grid-cols-6',
}

const SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
}

const TABLET_SPAN_CLASS: Record<number, string> = {
  1: 'tablet:col-span-1',
  2: 'tablet:col-span-2',
  3: 'tablet:col-span-3',
  4: 'tablet:col-span-4',
  5: 'tablet:col-span-5',
  6: 'tablet:col-span-6',
}

const DESKTOP_SPAN_CLASS: Record<number, string> = {
  1: 'desktop:col-span-1',
  2: 'desktop:col-span-2',
  3: 'desktop:col-span-3',
  4: 'desktop:col-span-4',
  5: 'desktop:col-span-5',
  6: 'desktop:col-span-6',
}

const Spinner = ({ size = 14 }: { size?: number }) => (
  <span
    className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent"
    style={{ width: `${size}px`, height: `${size}px` }}
    aria-hidden="true"
  />
)

export const VCT_Provider = ({
  children,
  className,
  style,
}: VCTProviderProps) => (
  <div
    className={cn('vct-app-root min-h-dvh bg-vct-bg text-vct-text', className ?? '')}
    style={style}
  >
    {children}
  </div>
)

export const VCT_Stack = ({
  children,
  direction = 'column',
  gap = 16,
  align = 'stretch',
  justify = 'flex-start',
  wrap,
  className,
  style,
  ...rest
}: VCTStackProps) => (
  <div
    className={cn('flex', className ?? '')}
    style={{
      flexDirection: direction,
      gap: `${gap}px`,
      alignItems: align,
      justifyContent: justify,
      ...(wrap ? { flexWrap: 'wrap' } : {}),
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

export const VCT_Divider = ({
  label,
  vertical = false,
  className,
  style,
  ...rest
}: VCTDividerProps) => {
  if (vertical) {
    return (
      <div
        className={cn('self-stretch border-l border-vct-border/60', className ?? '')}
        style={style}
        {...rest}
      />
    )
  }

  return (
    <div
      className={cn('my-4 flex items-center gap-3 text-vct-text-muted', className ?? '')}
      style={style}
      {...rest}
    >
      <div className="h-px flex-1 bg-vct-border" />
      {label ? (
        <span className="text-[10px] font-extrabold uppercase tracking-[0.08em]">
          {label}
        </span>
      ) : null}
      <div className="h-px flex-1 bg-vct-border" />
    </div>
  )
}

export const VCT_Text = ({
  children,
  variant = 'body',
  as = 'p',
  weight,
  className,
  style,
  ...rest
}: VCTTextProps) => {
  const Component = as
  return (
    <Component
      className={cn(TEXT_VARIANT_CLASS[variant], className ?? '')}
      style={{ ...(weight ? { fontWeight: weight } : null), ...style }}
      {...rest}
    >
      {children}
    </Component>
  )
}

export const VCT_Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className,
  type = 'button',
  ...rest
}: VCTButtonProps) => {
  const isDisabled = disabled || loading
  const variantClass = BUTTON_VARIANT_CLASS[variant] ?? BUTTON_VARIANT_CLASS.primary
  const sizeClass = BUTTON_SIZE_CLASS[size] ?? BUTTON_SIZE_CLASS.md
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-vct-accent',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClass,
        sizeClass,
        className ?? ''
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  )
}

export const VCT_Card = ({
  children,
  title,
  headerAction,
  footer,
  collapsible = false,
  defaultCollapsed = false,
  className,
  style,
  ...rest
}: VCTCardProps) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed && collapsible)

  return (
    <section
      className={cn(
        'rounded-2xl border border-vct-border bg-vct-elevated shadow-(--vct-shadow-sm)',
        className ?? ''
      )}
      style={style}
      {...rest}
    >
      {(title || headerAction) && (
        <header
          className={cn(
            'flex items-center justify-between gap-4 border-b border-vct-border px-5 py-4',
            collapsible && 'cursor-pointer select-none hover:bg-vct-input/40 transition'
          )}
          onClick={collapsible ? () => setCollapsed((p) => !p) : undefined}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? !collapsed : undefined}
        >
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.03em] text-vct-text">
            {collapsible ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={cn(
                  'shrink-0 transition-transform duration-200',
                  collapsed ? '-rotate-90' : 'rotate-0'
                )}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            {title}
          </div>
          {headerAction ? (
            <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
          ) : null}
        </header>
      )}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          collapsible && collapsed ? 'max-h-0' : 'max-h-[9999px]'
        )}
      >
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <footer className="border-t border-vct-border px-5 py-4">{footer}</footer>
        ) : null}
      </div>
    </section>
  )
}

export const VCT_ResponsiveGrid = ({
  children,
  columns = 1,
  tabletColumns = 2,
  desktopColumns = 4,
  gap = 'gap-4',
  className,
  style,
  ...rest
}: VCTResponsiveGridProps) => {
  const gapClass = typeof gap === 'string' ? gap : ''
  const styleWithGap = typeof gap === 'number' ? { ...style, gap: `${gap}px` } : style
  return (
    <div
      className={cn(
        'grid',
        COL_CLASS[columns],
        TABLET_COL_CLASS[tabletColumns],
        DESKTOP_COL_CLASS[desktopColumns],
        gapClass,
        className ?? ''
      )}
      style={styleWithGap}
      {...rest}
    >
      {children}
    </div>
  )
}

export const VCT_GridItem = ({
  children,
  span = 1,
  tabletSpan,
  desktopSpan,
  className,
  ...rest
}: VCTGridItemProps) => (
  <div
    className={cn(
      SPAN_CLASS[span],
      tabletSpan ? TABLET_SPAN_CLASS[tabletSpan] : '',
      desktopSpan ? DESKTOP_SPAN_CLASS[desktopSpan] : '',
      className ?? ''
    )}
    {...rest}
  >
    {children}
  </div>
)

export const VCTProvider = VCT_Provider as FC<VCTProviderProps>
export const VCTStack = VCT_Stack as FC<VCTStackProps>
export const VCTDivider = VCT_Divider as FC<VCTDividerProps>
export const VCTText = VCT_Text as FC<VCTTextProps>
export const VCTButton = VCT_Button as FC<VCTButtonProps>
export const VCTCard = VCT_Card as FC<VCTCardProps>
