'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'
import { useCalendarEvents } from '../hooks/useCalendarAPI'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface CalendarEvent {
    id: string
    title: string
    type: 'tournament' | 'exam' | 'training' | 'meeting' | 'seminar'
    date: string
    endDate?: string
    location: string
    status: 'upcoming' | 'ongoing' | 'completed'
    participants?: number
    description?: string
}

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    tournament: { label: 'Giải đấu', color: '#f59e0b', icon: '🏆' },
    exam: { label: 'Thi thăng cấp', color: '#8b5cf6', icon: '🎓' },
    training: { label: 'Tập huấn', color: '#10b981', icon: '🥋' },
    meeting: { label: 'Họp chuyên môn', color: '#3b82f6', icon: '📋' },
    seminar: { label: 'Hội thảo', color: '#ef4444', icon: '🎤' },
}

const MOCK_EVENTS: CalendarEvent[] = [
    { id: 'ev1', title: 'Giải Vô Địch Quốc Gia 2026', type: 'tournament', date: '2026-06-15', endDate: '2026-06-20', location: 'Nhà thi đấu Bình Định', status: 'upcoming', participants: 486, description: 'Giải đấu lớn nhất năm, quy tụ 42 đoàn trên toàn quốc.' },
    { id: 'ev2', title: 'Kỳ thi Thăng cấp Đai Q2/2026', type: 'exam', date: '2026-04-28', location: 'CLB Sơn Long TP.HCM', status: 'upcoming', participants: 156, description: 'Thi thăng cấp đai từ Vàng lên Xanh cho VĐV khu vực phía Nam.' },
    { id: 'ev3', title: 'Tập huấn Trọng tài cấp Quốc gia', type: 'training', date: '2026-04-10', endDate: '2026-04-12', location: 'Trung tâm TDTT Hà Nội', status: 'upcoming', participants: 80, description: 'Khóa cấp chứng nhận trọng tài quốc gia cho giải VĐQG 2026.' },
    { id: 'ev4', title: 'Họp Ban chuyên môn Q1', type: 'meeting', date: '2026-03-25', location: 'Văn phòng Liên đoàn', status: 'upcoming', participants: 24 },
    { id: 'ev5', title: 'Hội thảo Kỹ thuật Võ Cổ Truyền', type: 'seminar', date: '2026-05-10', location: 'ĐH TDTT TP.HCM', status: 'upcoming', participants: 120, description: 'Hội thảo quốc tế về bảo tồn và phát triển kỹ thuật VCT.' },
    { id: 'ev6', title: 'Giải Trẻ Toàn Quốc 2026', type: 'tournament', date: '2026-03-15', endDate: '2026-03-18', location: 'Đà Nẵng', status: 'completed', participants: 320 },
    { id: 'ev7', title: 'Tập huấn HLV khu vực Miền Trung', type: 'training', date: '2026-03-20', endDate: '2026-03-22', location: 'Huế', status: 'ongoing', participants: 45 },
    { id: 'ev8', title: 'Giao lưu Quốc tế VN - Hàn Quốc', type: 'tournament', date: '2026-07-05', location: 'TP.HCM', status: 'upcoming', participants: 60 },
    { id: 'ev9', title: 'Kỳ thi Đai Đen đặc biệt', type: 'exam', date: '2026-08-15', location: 'Hà Nội', status: 'upcoming', participants: 35, description: 'Kỳ thi thăng cấp đai đen dành cho HLV và VĐV xuất sắc.' },
    { id: 'ev10', title: 'Khai giảng lớp Võ thuật mùa hè', type: 'training', date: '2026-06-01', location: 'Toàn quốc', status: 'upcoming', participants: 500 },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'Sắp tới', color: '#3b82f6' },
    ongoing: { label: 'Đang diễn ra', color: '#10b981' },
    completed: { label: 'Đã kết thúc', color: '#94a3b8' },
}

const MONTHS_VI = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export function Page_calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [selectedType, setSelectedType] = useState<string>('all')
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

    // ── Real API data ──
    const { data: apiEvents } = useCalendarEvents()

    const allEvents = useMemo(() => {
        if (apiEvents && apiEvents.length > 0) {
            return apiEvents.map(e => ({
                id: e.id, title: e.title, type: (e.type || 'tournament') as any,
                date: e.date || e.start_date || '', endDate: e.end_date || '',
                location: e.location || '', status: (e.status || 'upcoming') as any,
                participants: e.participants || 0, description: e.description,
            }))
        }
        return MOCK_EVENTS
    }, [apiEvents])

    const filteredEvents = useMemo(() => {
        let events = allEvents
        if (selectedType !== 'all') events = events.filter(e => e.type === selectedType)
        return events
    }, [selectedType, allEvents])

    const eventsForMonth = useMemo(() => {
        return filteredEvents.filter(e => {
            const d = new Date(e.date)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
    }, [filteredEvents, currentMonth, currentYear])

    const eventsOnDay = (day: number): CalendarEvent[] => {
        return filteredEvents.filter(e => {
            const d = new Date(e.date)
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
    }

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
        else setCurrentMonth(m => m - 1)
    }

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
        else setCurrentMonth(m => m + 1)
    }

    const today = new Date()
    const isToday = (day: number) =>
        day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

    const upcomingCount = allEvents.filter(e => e.status === 'upcoming').length
    const ongoingCount = allEvents.filter(e => e.status === 'ongoing').length
    const thisMonthCount = eventsForMonth.length

    return (
        <div className="grid gap-6">
            {/* ── HEADER ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Lịch Hoạt Động</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Tổng hợp lịch giải đấu, tập huấn, thi thăng cấp và sự kiện</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-vct-border p-0.5">
                        <button onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'calendar' ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                            <VCT_Icons.Columns size={14} />
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                            <VCT_Icons.List size={14} />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-vct-accent px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition">
                        <VCT_Icons.Plus size={16} /> Tạo sự kiện
                    </button>
                </div>
            </div>

            {/* ── KPI ── */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng sự kiện', value: allEvents.length, icon: '📅', color: '#0ea5e9' },
                    { label: 'Sắp diễn ra', value: upcomingCount, icon: '🔜', color: '#f59e0b' },
                    { label: 'Đang diễn ra', value: ongoingCount, icon: '🔴', color: '#10b981' },
                    { label: 'Tháng này', value: thisMonthCount, icon: '📊', color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── FILTER ── */}
            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                {[{ v: 'all', l: 'Tất cả' }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ v: k, l: `${v.icon} ${v.label}` }))].map(f => (
                    <button key={f.v} onClick={() => setSelectedType(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${selectedType === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                        {f.l}
                    </button>
                ))}
            </div>

            {viewMode === 'calendar' ? (
                <div className="grid desktop:grid-cols-3 gap-6">
                    {/* ── CALENDAR GRID ── */}
                    <div className="desktop:col-span-2 rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <div className="flex items-center justify-between mb-5">
                            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-vct-input transition text-vct-text-muted">
                                <VCT_Icons.ChevronLeft size={20} />
                            </button>
                            <h2 className="text-lg font-black">{MONTHS_VI[currentMonth]} {currentYear}</h2>
                            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-vct-input transition text-vct-text-muted">
                                <VCT_Icons.ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-px">
                            {WEEKDAYS_VI.map(d => (
                                <div key={d} className="text-center text-[11px] font-bold text-vct-text-muted pb-3">{d}</div>
                            ))}

                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const dayEvents = eventsOnDay(day)
                                const hasEvents = dayEvents.length > 0

                                return (
                                    <div key={day}
                                        onClick={() => { if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]!) }}
                                        className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start gap-0.5 text-sm transition cursor-pointer 
                                            ${isToday(day) ? 'bg-vct-accent/15 border border-vct-accent font-black' : 'hover:bg-vct-input border border-transparent'}
                                            ${hasEvents ? 'font-bold' : 'text-vct-text-muted'}`}>
                                        <span className={isToday(day) ? 'text-vct-accent' : ''}>{day}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="flex gap-0.5 flex-wrap justify-center">
                                                {dayEvents.slice(0, 3).map(ev => (
                                                    <span key={ev.id} className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: TYPE_CONFIG[ev.type]?.color }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-vct-border">
                            {Object.entries(TYPE_CONFIG).map(([, v]) => (
                                <div key={v.label} className="flex items-center gap-1.5 text-[10px] text-vct-text-muted">
                                    <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                                    {v.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── EVENTS SIDEBAR ── */}
                    <div className="grid gap-3 content-start">
                        <h3 className="text-sm font-bold text-vct-text-muted">Sự kiện {MONTHS_VI[currentMonth]}</h3>
                        {eventsForMonth.length === 0 && (
                            <div className="rounded-xl border border-vct-border bg-vct-elevated p-6 text-center text-sm text-vct-text-muted">
                                Không có sự kiện trong tháng này
                            </div>
                        )}
                        {eventsForMonth.map(ev => (
                            <motion.div key={ev.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedEvent(ev)}
                                className={`rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${selectedEvent?.id === ev.id ? 'border-vct-accent bg-vct-accent/5' : 'border-vct-border bg-vct-elevated hover:border-vct-accent/50'}`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">{TYPE_CONFIG[ev.type]?.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{ev.title}</div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-vct-text-muted">
                                            <span className="font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${TYPE_CONFIG[ev.type]?.color}20`, color: TYPE_CONFIG[ev.type]?.color }}>
                                                {TYPE_CONFIG[ev.type]?.label}
                                            </span>
                                            <span>{formatDate(ev.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-vct-text-muted">
                                            <VCT_Icons.MapPin size={10} /> {ev.location}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                        style={{ background: `${STATUS_LABELS[ev.status]?.color}20`, color: STATUS_LABELS[ev.status]?.color }}>
                                        {STATUS_LABELS[ev.status]?.label}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── LIST VIEW ── */
                <div className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-vct-input border-b border-vct-border text-[11px] uppercase tracking-wider text-vct-text-muted font-bold">
                                <th className="p-4">Sự kiện</th>
                                <th className="p-4 w-28">Loại</th>
                                <th className="p-4 w-32">Ngày</th>
                                <th className="p-4">Địa điểm</th>
                                <th className="p-4 w-24 text-center">Số người</th>
                                <th className="p-4 w-28">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vct-border">
                            {filteredEvents.map(ev => (
                                <tr key={ev.id} className="hover:bg-vct-input/50 transition cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{TYPE_CONFIG[ev.type]?.icon}</span>
                                            <span className="font-bold text-sm">{ev.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                            style={{ background: `${TYPE_CONFIG[ev.type]?.color}20`, color: TYPE_CONFIG[ev.type]?.color }}>
                                            {TYPE_CONFIG[ev.type]?.label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-vct-text-muted">{formatDate(ev.date)}</td>
                                    <td className="p-4 text-sm text-vct-text-muted">{ev.location}</td>
                                    <td className="p-4 text-sm text-center font-bold">{ev.participants || '—'}</td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                            style={{ background: `${STATUS_LABELS[ev.status]?.color}20`, color: STATUS_LABELS[ev.status]?.color }}>
                                            {STATUS_LABELS[ev.status]?.label}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── EVENT DETAIL MODAL ── */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedEvent(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg rounded-2xl border border-vct-border bg-vct-elevated p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{TYPE_CONFIG[selectedEvent.type]?.icon}</span>
                                    <div>
                                        <h2 className="font-black text-lg">{selectedEvent.title}</h2>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: `${TYPE_CONFIG[selectedEvent.type]?.color}20`, color: TYPE_CONFIG[selectedEvent.type]?.color }}>
                                            {TYPE_CONFIG[selectedEvent.type]?.label}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-vct-input transition">
                                    <VCT_Icons.X size={20} />
                                </button>
                            </div>

                            {selectedEvent.description && (
                                <p className="text-sm text-vct-text-muted leading-6 mb-4">{selectedEvent.description}</p>
                            )}

                            <div className="grid gap-3 text-sm">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                    <VCT_Icons.Calendar size={16} className="text-vct-accent shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-vct-text-muted font-bold">Thời gian</div>
                                        <div className="font-bold">{formatDate(selectedEvent.date)}{selectedEvent.endDate ? ` — ${formatDate(selectedEvent.endDate)}` : ''}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                    <VCT_Icons.MapPin size={16} className="text-vct-accent shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-vct-text-muted font-bold">Địa điểm</div>
                                        <div className="font-bold">{selectedEvent.location}</div>
                                    </div>
                                </div>
                                {selectedEvent.participants && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                        <VCT_Icons.Users size={16} className="text-vct-accent shrink-0" />
                                        <div>
                                            <div className="text-[10px] text-vct-text-muted font-bold">Số người tham gia</div>
                                            <div className="font-bold">{selectedEvent.participants}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                    <VCT_Icons.Activity size={16} className="text-vct-accent shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-vct-text-muted font-bold">Trạng thái</div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: `${STATUS_LABELS[selectedEvent.status]?.color}20`, color: STATUS_LABELS[selectedEvent.status]?.color }}>
                                            {STATUS_LABELS[selectedEvent.status]?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-5 pt-4 border-t border-vct-border">
                                <button className="flex-1 rounded-lg bg-vct-accent py-2.5 text-sm font-bold text-white hover:brightness-110 transition">
                                    Xem chi tiết
                                </button>
                                <button onClick={() => setSelectedEvent(null)} className="rounded-lg border border-vct-border px-4 py-2.5 text-sm font-bold text-vct-text-muted hover:bg-vct-input transition">
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
