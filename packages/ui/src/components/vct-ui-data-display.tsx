'use client'
import * as React from 'react'
import type { CSSProperties, FC, ReactNode } from 'react'
import { cn, VCT_Button, VCT_Text } from './vct-ui-layout'

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const BADGE_CLASS: Record<BadgeTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  danger: 'border-red-500/30 bg-red-500/10 text-red-600',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-600',
  neutral: 'border-gray-400/30 bg-gray-400/10 text-gray-500',
}

export interface VCTBadgeProps {
  text?: ReactNode
  children?: ReactNode
  type?: BadgeTone | string
  variant?: BadgeTone | string
  size?: 'sm' | 'md' | 'lg' | string
  pulse?: boolean
  style?: CSSProperties
  className?: string
}

export interface VCTKpiCardProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  color?: string
  sub?: ReactNode
  change?: ReactNode
  style?: CSSProperties
  className?: string
}

export interface VCTTableColumn<T extends Record<string, any>> {
  key: string
  label?: ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
  render?: (row: T, index: number) => ReactNode
}

export interface VCTTableProps<T extends Record<string, any> = Record<string, any>> {
  columns?: VCTTableColumn<T>[]
  data?: T[]
  rowKey?: string
  className?: string
  onRowClick?: (row: T, index: number) => void
}

export interface VCTAvatarGroupProps {
  names?: string[]
  users?: Array<{ name?: string } | string>
  max?: number
  size?: number
  className?: string
}

export interface VCTSkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  borderRadius?: string | number
  style?: CSSProperties
  className?: string
}

export interface FilterChip {
  key: string
  label: string
  value: string
}

export interface VCTFilterChipsProps {
  filters: FilterChip[]
  onRemove?: (key: string) => void
  onClearAll?: () => void
  className?: string
}

export interface StatusStage {
  key: string
  label: string
  color?: string
  count?: number
}

export interface VCTStatusPipelineProps {
  stages: StatusStage[]
  activeStage?: string | null
  onStageClick?: (key: string | null) => void
  className?: string
}

export interface BulkActionItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | string
}

export interface VCTBulkActionsBarProps {
  count: number
  actions?: BulkActionItem[]
  onClearSelection?: () => void
  className?: string
}

export interface VCTProgressBarProps {
  value: number
  max: number
  color?: string
  showLabel?: boolean
  height?: number
  className?: string
}

export interface TabItem {
  key?: string
  id?: string
  label: ReactNode
  icon?: ReactNode
  count?: number
}

export interface VCTTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tab: string) => void
  /** Visual variant — pill (default) or underline */
  variant?: 'pill' | 'underline'
  className?: string
}

export interface VCTAvatarLetterProps {
  name: string
  size?: number
  style?: CSSProperties
  color?: string
  className?: string
}

const hashName = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

const textAlignClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

export const VCT_Badge = ({
  text,
  children,
  type = 'success',
  variant,
  size = 'md',
  pulse = true,
  style,
  className,
}: VCTBadgeProps) => {
  const toneCandidate = variant ?? type
  const tone = (['success', 'warning', 'danger', 'info', 'neutral'].includes(toneCandidate)
    ? toneCandidate
    : 'success') as BadgeTone
  const content = text ?? children

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
        ? 'px-3 py-1.5 text-xs'
        : 'px-2.5 py-1 text-[11px]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-extrabold uppercase tracking-[0.06em]',
        sizeClass,
        BADGE_CLASS[tone],
        className ?? ''
      )}
      {...{ style }}
    >
      {pulse ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
      {content}
    </span>
  )
}

export const VCT_KpiCard = ({
  label,
  value,
  icon,
  color = 'var(--vct-accent-cyan)',
  sub,
  change,
  style,
  className,
}: VCTKpiCardProps) => (
  <article
    className={cn(
      'rounded-2xl border border-vct-border bg-vct-elevated p-4 shadow-(--vct-shadow-sm)',
      className ?? ''
    )}
    {...{ style }}
  >
    <div className="mb-2 flex items-center justify-between gap-2">
      <VCT_Text variant="small">{label}</VCT_Text>
      {icon ? (
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vct-border"
          {...{ style: { color } }}
        >
          {icon}
        </span>
      ) : null}
    </div>
    <div className="text-[26px] font-black leading-none" {...{ style: { color } }}>
      {value}
    </div>
    {sub ? <div className="mt-1 text-xs text-vct-text-muted">{sub}</div> : null}
    {change ? <div className="mt-1 text-xs font-bold text-vct-text-muted">{change}</div> : null}
  </article>
)

export const VCT_Table = <T extends Record<string, any>>({
  columns = [],
  data = [],
  rowKey = 'id',
  className,
  onRowClick,
}: VCTTableProps<T>) => (
  <div className={cn('w-full overflow-x-auto', className ?? '')}>
    <table className="min-w-full border-collapse">
      <thead>
        <tr className="border-b border-vct-border bg-vct-elevated">
          {columns.map((column) => (
            <th
              key={column.key}
              {...{ style: { width: column.width } }}
              className={cn(
                'px-3 py-2.5 text-xs font-black uppercase tracking-[0.06em] text-vct-text-muted',
                textAlignClass(column.align)
              )}
            >
              {column.label ?? column.key}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const keyCandidate = row[rowKey]
          const rowId =
            typeof keyCandidate === 'string' || typeof keyCandidate === 'number'
              ? `${keyCandidate}`
              : `${index}`
          return (
            <tr
              key={rowId}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={cn(
                'border-b border-vct-border/70 transition',
                onRowClick ? 'cursor-pointer hover:bg-vct-bg' : ''
              )}
            >
              {columns.map((column) => (
                <td
                  key={`${rowId}-${column.key}`}
                  className={cn('px-3 py-2.5 text-sm text-vct-text', textAlignClass(column.align))}
                >
                  {column.render
                    ? column.render(row, index)
                    : (row[column.key] as ReactNode) ?? null}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export const VCT_AvatarGroup = ({
  names,
  users,
  max = 3,
  size = 32,
  className,
}: VCTAvatarGroupProps) => {
  const source = names
    ? names
    : (users ?? []).map((item) => {
      if (typeof item === 'string') return item
      return item.name ?? 'U'
    })

  const visible = source.slice(0, max)
  const remain = Math.max(0, source.length - visible.length)

  return (
    <div className={cn('inline-flex items-center', className ?? '')}>
      {visible.map((name, index) => (
        <div
          key={`${name}-${index}`}
          title={name}
          className="inline-flex items-center justify-center rounded-full border border-vct-border bg-vct-elevated text-xs font-black text-vct-text"
          {...{
            style: {
              width: `${size}px`,
              height: `${size}px`,
              marginLeft: index === 0 ? 0 : `${Math.round(size * -0.25)}px`,
            }
          }}
        >
          {name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((token) => token[0]?.toUpperCase() ?? '')
            .join('') || 'U'}
        </div>
      ))}
      {remain > 0 ? (
        <div
          className="inline-flex items-center justify-center rounded-full border border-vct-border bg-vct-input text-xs font-black text-vct-text-muted"
          {...{
            style: {
              width: `${size}px`,
              height: `${size}px`,
              marginLeft: `${Math.round(size * -0.25)}px`,
            }
          }}
        >
          +{remain}
        </div>
      ) : null}
    </div>
  )
}


export const VCT_FilterChips = ({
  filters,
  onRemove,
  onClearAll,
  className,
}: VCTFilterChipsProps) => {
  if (!filters.length) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className ?? '')}>
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onRemove?.(filter.key)}
          className="inline-flex items-center gap-1 rounded-full border border-vct-border bg-vct-elevated px-2.5 py-1 text-xs font-semibold text-vct-text-secondary transition hover:bg-vct-input"
        >
          <span className="font-bold text-vct-text">{filter.label}:</span>
          <span>{filter.value}</span>
          <span aria-hidden="true" className="text-vct-text-muted">
            x
          </span>
        </button>
      ))}
      {onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full px-2 py-1 text-xs font-bold text-vct-text-muted transition hover:bg-vct-input hover:text-vct-text"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}

export const VCT_StatusPipeline = ({
  stages,
  activeStage = null,
  onStageClick,
  className,
}: VCTStatusPipelineProps) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-1 rounded-2xl border border-vct-border bg-vct-input p-1',
      className ?? ''
    )}
  >
    {stages.map((stage) => {
      const isActive = stage.key === activeStage
      return (
        <button
          key={stage.key}
          type="button"
          onClick={() => onStageClick?.(isActive ? null : stage.key)}
          className={cn(
            'inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition',
            isActive ? 'bg-vct-elevated text-vct-text shadow-sm' : 'text-vct-text-muted hover:bg-vct-elevated/70'
          )}
        >
          <span
            className="h-2 w-2 rounded-full"
            {...{ style: { backgroundColor: stage.color ?? 'var(--vct-accent-cyan)' } }}
          />
          <span>{stage.label}</span>
          {typeof stage.count === 'number' ? (
            <span className="rounded-md bg-vct-input px-1.5 py-0.5 text-[10px]">
              {stage.count}
            </span>
          ) : null}
        </button>
      )
    })}
  </div>
)

export const VCT_BulkActionsBar = ({
  count,
  actions = [],
  onClearSelection,
  className,
}: VCTBulkActionsBarProps) => {
  if (count <= 0) return null

  return (
    <div
      className={cn(
        'sticky bottom-4 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-vct-border bg-vct-elevated p-3 shadow-(--vct-shadow-lg)',
        className ?? ''
      )}
    >
      <span className="text-sm font-black text-vct-text">{count} selected</span>
      <div className="mx-1 h-5 w-px bg-vct-border" />
      {actions.map((action) => (
        <VCT_Button
          key={action.label}
          size="small"
          variant={action.variant === 'danger' ? 'danger' : action.variant === 'secondary' ? 'secondary' : 'primary'}
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </VCT_Button>
      ))}
      {onClearSelection ? (
        <VCT_Button size="small" variant="ghost" onClick={onClearSelection}>
          Clear
        </VCT_Button>
      ) : null}
    </div>
  )
}

export const VCT_ProgressBar = ({
  value,
  max,
  color = 'var(--vct-accent-cyan)',
  showLabel = false,
  height = 5,
  className,
}: VCTProgressBarProps) => {
  const safeMax = max <= 0 ? 1 : max
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100))

  return (
    <div className={cn('grid gap-1.5', className ?? '')}>
      {showLabel ? (
        <div className="text-xs font-semibold text-vct-text-secondary">
          {value}/{max}
        </div>
      ) : null}
      <div
        className="w-full overflow-hidden rounded-full bg-vct-input"
        {...{
          style: { height: `${height}px` },
          role: "progressbar",
          "aria-valuemin": 0,
          "aria-valuemax": max,
          "aria-valuenow": Math.round(value)
        }}
        title={showLabel ? `${value}/${max}` : "Progress"}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          {...{
            style: {
              width: `${percent}%`,
              background: color,
            }
          }}
        />
      </div>
    </div>
  )
}

export const VCT_Tabs = ({
  tabs,
  activeTab,
  onChange,
  variant: tabVariant = 'pill',
  className,
}: VCTTabsProps) => {
  const isUnderline = tabVariant === 'underline'

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center',
        isUnderline
          ? 'gap-0 border-b-2 border-vct-border'
          : 'gap-1 rounded-2xl border border-vct-border bg-vct-input p-1',
        className ?? ''
      )}
    >
      {tabs.map((tab, index) => {
        const tabValue = tab.key ?? tab.id ?? `${index}`
        const active = tabValue === activeTab
        return (
          <button
            key={tabValue}
            type="button"
            role="tab"
            {...{ "aria-selected": active ? 'true' : 'false' }}
            onClick={() => onChange(tabValue)}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-bold transition',
              isUnderline
                ? cn(
                  'px-4 py-3 -mb-[2px] border-b-2',
                  active
                    ? 'border-vct-accent text-vct-accent'
                    : 'border-transparent text-vct-text-muted hover:text-vct-text hover:border-vct-border'
                )
                : cn(
                  'rounded-xl px-3 py-2',
                  active
                    ? 'bg-vct-elevated text-vct-text shadow-sm'
                    : 'text-vct-text-muted hover:bg-vct-elevated/70'
                )
            )}
          >
            {tab.icon ? <span aria-hidden="true">{tab.icon}</span> : null}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span className="rounded-md bg-vct-input px-1.5 py-0.5 text-[10px]">
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export const VCT_AvatarLetter = ({
  name,
  size = 36,
  style,
  color,
  className,
}: VCTAvatarLetterProps) => {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase() ?? '')
      .join('') || 'U'

  const hue = hashName(name) % 360
  const background = color ?? `hsl(${hue} 75% 45%)`

  return (
    <span
      aria-label={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-black text-white shadow-sm',
        className ?? ''
      )}
      {...{
        style: {
          width: `${size}px`,
          height: `${size}px`,
          background,
          ...style,
        }
      }}
    >
      {initials}
    </span>
  )
}

export const VCTBadge = VCT_Badge as FC<VCTBadgeProps>
export const VCTKpiCard = VCT_KpiCard as FC<VCTKpiCardProps>
export const VCTTable = VCT_Table as FC<VCTTableProps>
export const VCTAvatarGroup = VCT_AvatarGroup as FC<VCTAvatarGroupProps>
export const VCTFilterChips = VCT_FilterChips as FC<VCTFilterChipsProps>
export const VCTStatusPipeline = VCT_StatusPipeline as FC<VCTStatusPipelineProps>
export const VCTBulkActionsBar = VCT_BulkActionsBar as FC<VCTBulkActionsBarProps>
export const VCTProgressBar = VCT_ProgressBar as FC<VCTProgressBarProps>
export const VCTTabs = VCT_Tabs as FC<VCTTabsProps>
export const VCTAvatarLetter = VCT_AvatarLetter as FC<VCTAvatarLetterProps>
