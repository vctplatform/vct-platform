/**
 * VCT Chart Components
 * 
 * Lightweight SVG chart components with zero external dependencies.
 * Supports bar, horizontal bar, donut, and simple line charts.
 * Uses VCT design system CSS variables and Framer Motion for animations.
 */

'use client'

import { motion } from 'framer-motion'
import { VCT_Text } from '..'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface ChartDataItem {
    label: string
    value: number
    color?: string
}

export interface MultiSeriesItem {
    label: string
    values: number[]
}

/* ═══════════════════════════════════════════════════════════════
   COLOR PALETTE
   ═══════════════════════════════════════════════════════════════ */

const CHART_COLORS = [
    '#00bcd4', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444',
    '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
]

function getColor(index: number, custom?: string): string {
    return custom ?? CHART_COLORS[index % CHART_COLORS.length] ?? '#00bcd4'
}

/* ═══════════════════════════════════════════════════════════════
   BAR CHART (Vertical)
   ═══════════════════════════════════════════════════════════════ */

interface BarChartProps {
    data: ChartDataItem[]
    height?: number
    showValues?: boolean
    title?: string
}

export function VCT_BarChart({ data, height = 200, showValues = true, title }: BarChartProps) {
    const maxVal = Math.max(...data.map((d) => d.value), 1)
    const barWidth = Math.min(40, Math.floor(280 / data.length))
    const gap = 8
    const svgWidth = data.length * (barWidth + gap) + 40
    const chartH = height - 30

    return (
        <div>
            {title && <VCT_Text variant="h3" style={{ marginBottom: 8 }}>{title}</VCT_Text>}
            <div style={{ overflowX: 'auto' }}>
                <svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
                    {data.map((item, i) => {
                        const barH = (item.value / maxVal) * (chartH - 20)
                        const x = 30 + i * (barWidth + gap)
                        const y = chartH - barH
                        return (
                            <g key={i}>
                                <motion.rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barH}
                                    rx={4}
                                    fill={getColor(i, item.color)}
                                    initial={{ height: 0, y: chartH }}
                                    animate={{ height: barH, y }}
                                    transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                                />
                                {showValues && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight={700}
                                        fill="var(--vct-text-secondary)"
                                    >
                                        {item.value}
                                    </text>
                                )}
                                <text
                                    x={x + barWidth / 2}
                                    y={height - 4}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="var(--vct-text-tertiary)"
                                >
                                    {item.label.length > 6 ? item.label.slice(0, 6) + '…' : item.label}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   HORIZONTAL BAR CHART
   ═══════════════════════════════════════════════════════════════ */

interface HBarChartProps {
    data: ChartDataItem[]
    title?: string
}

export function VCT_HorizontalBarChart({ data, title }: HBarChartProps) {
    const maxVal = Math.max(...data.map((d) => d.value), 1)

    return (
        <div>
            {title && <VCT_Text variant="h3" style={{ marginBottom: 8 }}>{title}</VCT_Text>}
            <div className="grid gap-2">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
                            <VCT_Text variant="small" style={{ fontWeight: 600 }}>
                                {item.label}
                            </VCT_Text>
                        </div>
                        <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: 'var(--vct-bg-input)' }}>
                            <motion.div
                                className="h-full rounded-md flex items-center justify-end px-2"
                                style={{ background: getColor(i, item.color) }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / maxVal) * 100}%` }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                            >
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                    {item.value}
                                </span>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   DONUT CHART
   ═══════════════════════════════════════════════════════════════ */

interface DonutChartProps {
    data: ChartDataItem[]
    size?: number
    title?: string
    centerLabel?: string
}

export function VCT_DonutChart({ data, size = 180, title, centerLabel }: DonutChartProps) {
    const total = data.reduce((s, d) => s + d.value, 0)
    const radius = (size - 20) / 2
    const circumference = 2 * Math.PI * radius
    let cumulativeOffset = 0

    return (
        <div style={{ textAlign: 'center' }}>
            {title && <VCT_Text variant="h3" style={{ marginBottom: 8 }}>{title}</VCT_Text>}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ margin: '0 auto' }}>
                {data.map((item, i) => {
                    const pct = total > 0 ? item.value / total : 0
                    const dashLen = pct * circumference
                    const dashOffset = -cumulativeOffset
                    cumulativeOffset += dashLen

                    return (
                        <motion.circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={getColor(i, item.color)}
                            strokeWidth={24}
                            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                        />
                    )
                })}
                {centerLabel && (
                    <text
                        x={size / 2}
                        y={size / 2 + 5}
                        textAnchor="middle"
                        fontSize={18}
                        fontWeight={800}
                        fill="var(--vct-text-primary)"
                    >
                        {centerLabel}
                    </text>
                )}
            </svg>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-3">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: getColor(i, item.color) }} />
                        <VCT_Text variant="small">{item.label} ({item.value})</VCT_Text>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD (KPI)
   ═══════════════════════════════════════════════════════════════ */

interface StatCardProps {
    label: string
    value: string | number
    icon?: string
    color?: string
    trend?: { value: number; label: string }
}

export function VCT_StatCard({ label, value, icon, color = '#00bcd4', trend }: StatCardProps) {
    return (
        <motion.div
            className="rounded-xl p-4"
            style={{
                background: 'var(--vct-bg-elevated)',
                border: '1px solid var(--vct-border-subtle)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-1">
                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{label}</VCT_Text>
                {icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
            {trend && (
                <div className="flex items-center gap-1 mt-1">
                    <span style={{ color: trend.value >= 0 ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
                        {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{trend.label}</VCT_Text>
                </div>
            )}
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */

interface ProgressBarProps {
    value: number
    max: number
    label?: string
    color?: string
    showPct?: boolean
}

export function VCT_ChartProgressBar({ value, max, label, color = '#00bcd4', showPct = true }: ProgressBarProps) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
        <div>
            {(label || showPct) && (
                <div className="flex items-center justify-between mb-1">
                    {label && <VCT_Text variant="small" style={{ fontWeight: 600 }}>{label}</VCT_Text>}
                    {showPct && <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{pct}%</VCT_Text>}
                </div>
            )}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--vct-bg-input)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}
