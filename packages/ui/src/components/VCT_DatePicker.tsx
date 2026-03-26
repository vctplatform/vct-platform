'use client'

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_DatePicker
 *  Calendar-based date picker with Vietnamese
 *  locale, min/max constraints, keyboard nav.
 * ──────────────────────────────────────────── */

export interface VCT_DatePickerProps {
    /** ISO date string (YYYY-MM-DD) */
    value?: string
    /** Change handler returning ISO date */
    onChange: (date: string) => void
    /** Minimum selectable date (ISO) */
    min?: string
    /** Maximum selectable date (ISO) */
    max?: string
    /** Locale */
    locale?: 'vi' | 'en'
    /** Placeholder text */
    placeholder?: string
    /** Disabled state */
    disabled?: boolean
}

const VI_MONTHS = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const VI_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const EN_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseISO(iso?: string) {
    if (!iso) return null
    const [y, m, d] = iso.split('-').map(Number)
    return { year: y!, month: m! - 1, day: d! }
}

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1 // Monday = 0
}

export function VCT_DatePicker({
    value,
    onChange,
    min,
    max,
    locale = 'vi',
    placeholder,
    disabled = false,
}: VCT_DatePickerProps) {
    const parsed = parseISO(value)
    const today = new Date()
    const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear())
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth())
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const months = locale === 'vi' ? VI_MONTHS : EN_MONTHS
    const days = locale === 'vi' ? VI_DAYS : EN_DAYS

    // Click outside
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
        else setViewMonth(viewMonth - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
        else setViewMonth(viewMonth + 1)
    }

    const isDisabled = (d: number) => {
        const iso = toISO(viewYear, viewMonth, d)
        if (min && iso < min) return true
        if (max && iso > max) return true
        return false
    }

    const isSelected = (d: number) => {
        if (!parsed) return false
        return parsed.year === viewYear && parsed.month === viewMonth && parsed.day === d
    }

    const isToday = (d: number) => {
        return (
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === d
        )
    }

    const selectDate = (d: number) => {
        if (isDisabled(d)) return
        onChange(toISO(viewYear, viewMonth, d))
        setOpen(false)
    }

    const numDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); return }
            if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
                e.preventDefault()
                setOpen(true)
            }
        },
        [open],
    )

    const displayValue = value
        ? (() => {
            const p = parseISO(value)
            if (!p) return ''
            return `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`
        })()
        : ''

    const navBtnStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        border: 'none',
        borderRadius: 'var(--vct-radius-sm)',
        background: 'transparent',
        color: 'var(--vct-text-secondary)',
        cursor: 'pointer',
        fontSize: 16,
        transition: 'background var(--vct-duration-fast) ease',
    }

    return (
        <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
            {/* Input trigger */}
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={placeholder ?? 'Chọn ngày'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    minWidth: 160,
                    border: '1px solid var(--vct-border-subtle)',
                    borderRadius: 'var(--vct-radius-md)',
                    background: 'var(--vct-bg-input)',
                    color: displayValue ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                    fontSize: 'var(--vct-font-sm)',
                    fontWeight: 500,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'border-color var(--vct-duration-fast) ease',
                }}
            >
                {/* Calendar icon */}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {displayValue || placeholder || 'Chọn ngày'}
            </button>

            {/* Dropdown calendar */}
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Lịch chọn ngày"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 6,
                        zIndex: 100,
                        padding: 12,
                        minWidth: 280,
                        borderRadius: 'var(--vct-radius-md)',
                        background: 'var(--vct-bg-elevated)',
                        border: '1px solid var(--vct-border-subtle)',
                        boxShadow: 'var(--vct-shadow-xl)',
                        animation: 'vct-scale-in 0.15s var(--vct-ease-out) both',
                    }}
                >
                    {/* Nav header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <button onClick={prevMonth} aria-label="Tháng trước" style={navBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                            ‹
                        </button>
                        <span style={{ fontSize: 'var(--vct-font-sm)', fontWeight: 700, color: 'var(--vct-text-primary)' }}>
                            {months[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} aria-label="Tháng sau" style={navBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                            ›
                        </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                        {days.map((d) => (
                            <span
                                key={d}
                                style={{
                                    textAlign: 'center',
                                    fontSize: 'var(--vct-font-xs)',
                                    fontWeight: 600,
                                    color: 'var(--vct-text-tertiary)',
                                    padding: '4px 0',
                                }}
                            >
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {/* Empty cells for offset */}
                        {Array.from({ length: startDay }).map((_, i) => (
                            <span key={`e-${i}`} />
                        ))}
                        {/* Day cells */}
                        {Array.from({ length: numDays }).map((_, i) => {
                            const d = i + 1
                            const sel = isSelected(d)
                            const tod = isToday(d)
                            const dis = isDisabled(d)
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => selectDate(d)}
                                    disabled={dis}
                                    aria-label={`${d} ${months[viewMonth]} ${viewYear}`}
                                    aria-pressed={sel}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 34,
                                        height: 34,
                                        border: tod && !sel ? '1px solid var(--vct-accent-cyan)' : 'none',
                                        borderRadius: 'var(--vct-radius-sm)',
                                        background: sel
                                            ? 'var(--vct-accent-cyan)'
                                            : 'transparent',
                                        color: sel
                                            ? '#fff'
                                            : dis
                                                ? 'var(--vct-text-tertiary)'
                                                : 'var(--vct-text-primary)',
                                        fontSize: 'var(--vct-font-sm)',
                                        fontWeight: sel || tod ? 700 : 400,
                                        cursor: dis ? 'not-allowed' : 'pointer',
                                        opacity: dis ? 0.4 : 1,
                                        transition: 'background var(--vct-duration-fast) ease',
                                    }}
                                    onMouseEnter={(e) => { if (!sel && !dis) e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                                    onMouseLeave={(e) => { if (!sel && !dis) e.currentTarget.style.background = 'transparent' }}
                                >
                                    {d}
                                </button>
                            )
                        })}
                    </div>

                    {/* Today link */}
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setViewYear(today.getFullYear())
                                setViewMonth(today.getMonth())
                                selectDate(today.getDate())
                            }}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--vct-accent-cyan)',
                                fontSize: 'var(--vct-font-xs)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px',
                            }}
                        >
                            {locale === 'vi' ? 'Hôm nay' : 'Today'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
