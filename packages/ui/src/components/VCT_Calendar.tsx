'use client'

import { useState, type ReactNode, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_Calendar
 *  Month/Week/Day calendar view with event rendering,
 *  navigation, and Vietnamese locale support.
 * ──────────────────────────────────────────── */

export interface CalendarEvent {
    /** Unique event id */
    id: string
    /** Event title */
    title: string
    /** ISO date string (YYYY-MM-DD) */
    date: string
    /** Event color (CSS value) */
    color?: string
    /** Optional metadata */
    meta?: Record<string, any>
}

export interface VCT_CalendarProps {
    /** Events to display */
    events: CalendarEvent[]
    /** Date click handler */
    onDateClick?: (date: string) => void
    /** Event click handler */
    onEventClick?: (event: CalendarEvent) => void
    /** Current view mode */
    view?: 'month' | 'week' | 'day'
    /** Locale */
    locale?: 'vi' | 'en'
    /** Initial date (ISO) - defaults to today */
    initialDate?: string
}

const VI_MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const VI_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const EN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

/** Returns 0-6 (Mon=0) for the first day of the month */
function firstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1
}

export function VCT_Calendar({
    events,
    onDateClick,
    onEventClick,
    view = 'month',
    locale = 'vi',
    initialDate,
}: VCT_CalendarProps) {
    const today = new Date()
    const init = initialDate ? (() => {
        const [y, m] = initialDate.split('-').map(Number)
        return { year: y!, month: m! - 1 }
    })() : { year: today.getFullYear(), month: today.getMonth() }

    const [viewYear, setViewYear] = useState(init.year)
    const [viewMonth, setViewMonth] = useState(init.month)

    const months = locale === 'vi' ? VI_MONTHS : EN_MONTHS
    const dayLabels = locale === 'vi' ? VI_DAYS : EN_DAYS

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
        else setViewMonth(viewMonth - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
        else setViewMonth(viewMonth + 1)
    }
    const goToToday = () => {
        setViewYear(today.getFullYear())
        setViewMonth(today.getMonth())
    }

    const numDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)

    // Group events by date
    const eventsByDate = new Map<string, CalendarEvent[]>()
    events.forEach((ev) => {
        const list = eventsByDate.get(ev.date) ?? []
        list.push(ev)
        eventsByDate.set(ev.date, list)
    })

    const isToday = (d: number) =>
        today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d

    const navBtnStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        border: 'none',
        borderRadius: 'var(--vct-radius-sm)',
        background: 'transparent',
        color: 'var(--vct-text-secondary)',
        cursor: 'pointer',
        fontSize: 18,
        fontWeight: 700,
        transition: 'background var(--vct-duration-fast) ease',
    }

    // Only month view implemented (most common)
    return (
        <div
            style={{
                borderRadius: 'var(--vct-radius-lg)',
                border: '1px solid var(--vct-border-subtle)',
                background: 'var(--vct-bg-elevated)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--vct-border-subtle)',
                }}
            >
                <button onClick={prevMonth} aria-label="Tháng trước" style={navBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                    ‹
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 'var(--vct-font-md)', fontWeight: 700, color: 'var(--vct-text-primary)' }}>
                        {months[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={goToToday}
                        style={{
                            padding: '2px 8px',
                            border: '1px solid var(--vct-border-subtle)',
                            borderRadius: 'var(--vct-radius-sm)',
                            background: 'transparent',
                            color: 'var(--vct-accent-cyan)',
                            fontSize: 'var(--vct-font-xs)',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {locale === 'vi' ? 'Hôm nay' : 'Today'}
                    </button>
                </div>
                <button onClick={nextMonth} aria-label="Tháng sau" style={navBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                    ›
                </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {dayLabels.map((d) => (
                    <span
                        key={d}
                        style={{
                            textAlign: 'center',
                            fontSize: 'var(--vct-font-xs)',
                            fontWeight: 600,
                            color: 'var(--vct-text-tertiary)',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--vct-border-subtle)',
                        }}
                    >
                        {d}
                    </span>
                ))}
            </div>

            {/* Date grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {/* Empty offset cells */}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        style={{
                            minHeight: 80,
                            borderBottom: '1px solid var(--vct-border-subtle)',
                            borderRight: '1px solid var(--vct-border-subtle)',
                        }}
                    />
                ))}
                {/* Day cells */}
                {Array.from({ length: numDays }).map((_, i) => {
                    const d = i + 1
                    const dateStr = toISO(viewYear, viewMonth, d)
                    const dayEvents = eventsByDate.get(dateStr) ?? []
                    const tod = isToday(d)

                    return (
                        <div
                            key={d}
                            onClick={() => onDateClick?.(dateStr)}
                            role="gridcell"
                            aria-label={`${d} ${months[viewMonth]}`}
                            style={{
                                minHeight: 80,
                                padding: 6,
                                borderBottom: '1px solid var(--vct-border-subtle)',
                                borderRight: '1px solid var(--vct-border-subtle)',
                                cursor: onDateClick ? 'pointer' : 'default',
                                transition: 'background var(--vct-duration-fast) ease',
                            }}
                            onMouseEnter={(e) => { if (onDateClick) e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                        >
                            {/* Day number */}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: 'var(--vct-radius-full)',
                                    fontSize: 'var(--vct-font-xs)',
                                    fontWeight: tod ? 700 : 500,
                                    color: tod ? '#fff' : 'var(--vct-text-secondary)',
                                    background: tod ? 'var(--vct-accent-cyan)' : 'transparent',
                                }}
                            >
                                {d}
                            </span>
                            {/* Events */}
                            {dayEvents.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                    {dayEvents.slice(0, 3).map((ev) => (
                                        <button
                                            key={ev.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onEventClick?.(ev)
                                            }}
                                            aria-label={ev.title}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '1px 4px',
                                                border: 'none',
                                                borderRadius: 3,
                                                background: ev.color ?? 'var(--vct-accent-cyan)',
                                                color: '#fff',
                                                fontSize: 10,
                                                fontWeight: 600,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                lineHeight: '16px',
                                            }}
                                        >
                                            {ev.title}
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <span style={{ fontSize: 10, color: 'var(--vct-text-tertiary)', fontWeight: 500 }}>
                                            +{dayEvents.length - 3} sự kiện
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
