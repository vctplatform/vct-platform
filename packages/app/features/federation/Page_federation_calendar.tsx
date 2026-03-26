'use client'

import React, { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_PageContainer, VCT_StatRow
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// FEDERATION — LỊCH HOẠT ĐỘNG TỔNG HỢP
// ════════════════════════════════════════

type EventType = 'tournament' | 'belt_exam' | 'training' | 'meeting' | 'international' | 'ceremony'

interface CalendarEvent {
    id: string; title: string; type: EventType
    start_date: string; end_date: string; location: string
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
    organizer: string
}

const EVENT_TYPE_MAP: Record<EventType, { label: string; color: string; icon: string }> = {
    tournament: { label: 'Giải đấu', color: 'var(--vct-danger)', icon: '🏆' },
    belt_exam: { label: 'Thi thăng đai', color: 'var(--vct-warning)', icon: '🥋' },
    training: { label: 'Tập huấn', color: 'var(--vct-info)', icon: '📋' },
    meeting: { label: 'Họp BCH', color: 'var(--vct-accent-cyan)', icon: '🤝' },
    international: { label: 'Quốc tế', color: 'var(--vct-success)', icon: '🌍' },
    ceremony: { label: 'Lễ tân', color: 'var(--vct-accent-pink)', icon: '🎊' },
}

const STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'neutral' | 'error' }> = {
    upcoming: { label: 'Sắp tới', type: 'info' },
    ongoing: { label: 'Đang diễn ra', type: 'success' },
    completed: { label: 'Đã hoàn thành', type: 'neutral' },
    cancelled: { label: 'Đã hủy', type: 'error' },
}

const SEED_EVENTS: CalendarEvent[] = [
    { id: '1', title: 'Giải Vô địch Võ Cổ Truyền Toàn quốc 2026', type: 'tournament', start_date: '2026-04-15', end_date: '2026-04-20', location: 'Bình Định', status: 'upcoming', organizer: 'LĐ VCT Việt Nam' },
    { id: '2', title: 'Thi thăng đai Đợt 1/2026 — Khu vực phía Bắc', type: 'belt_exam', start_date: '2026-03-25', end_date: '2026-03-26', location: 'Hà Nội', status: 'upcoming', organizer: 'Ban Kỹ thuật' },
    { id: '3', title: 'Tập huấn Trọng tài Quốc gia', type: 'training', start_date: '2026-03-10', end_date: '2026-03-12', location: 'TP.HCM', status: 'ongoing', organizer: 'Ban Trọng tài' },
    { id: '4', title: 'Họp BCH thường kỳ Quý I/2026', type: 'meeting', start_date: '2026-03-30', end_date: '2026-03-30', location: 'Hà Nội', status: 'upcoming', organizer: 'Ban Thường vụ' },
    { id: '5', title: 'Giải Hữu nghị Việt Nam — Hàn Quốc', type: 'international', start_date: '2026-05-10', end_date: '2026-05-12', location: 'Seoul, Hàn Quốc', status: 'upcoming', organizer: 'Ban Đối ngoại' },
    { id: '6', title: 'Giải trẻ Đồng bằng sông Cửu Long', type: 'tournament', start_date: '2026-02-20', end_date: '2026-02-22', location: 'Cần Thơ', status: 'completed', organizer: 'LĐ VCT Cần Thơ' },
    { id: '7', title: 'Lễ tôn vinh VĐV xuất sắc 2025', type: 'ceremony', start_date: '2026-01-15', end_date: '2026-01-15', location: 'Hà Nội', status: 'completed', organizer: 'Văn phòng LĐ' },
    { id: '8', title: 'Tập huấn HLV nâng cao', type: 'training', start_date: '2026-04-01', end_date: '2026-04-03', location: 'Đà Nẵng', status: 'upcoming', organizer: 'Ban Đào tạo' },
]

const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

export function Page_federation_calendar() {
    const [typeFilter, setTypeFilter] = useState<string>('')
    const [viewMode, setViewMode] = useState<'list' | 'month'>('list')

    const filtered = useMemo(() => {
        let data = SEED_EVENTS
        if (typeFilter) data = data.filter(e => e.type === typeFilter)
        return data.sort((a, b) => a.start_date.localeCompare(b.start_date))
    }, [typeFilter])

    const upcoming = SEED_EVENTS.filter(e => e.status === 'upcoming').length
    const ongoing = SEED_EVENTS.filter(e => e.status === 'ongoing').length

    // Group events by month for month view
    const byMonth = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        filtered.forEach(e => {
            const month = e.start_date.substring(0, 7) // YYYY-MM
            if (!map.has(month)) map.set(month, [])
            map.get(month)!.push(e)
        })
        return map
    }, [filtered])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    📅 Lịch hoạt động Tổng hợp
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">
                    Tất cả sự kiện giải đấu, thi thăng đai, tập huấn, họp BCH, đối ngoại của Liên đoàn.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng sự kiện', value: SEED_EVENTS.length, icon: <VCT_Icons.Calendar size={18} />, color: 'var(--vct-info)' },
                { label: 'Sắp tới', value: upcoming, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Đang diễn ra', value: ongoing, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)' },
                { label: 'Loại sự kiện', value: Object.keys(EVENT_TYPE_MAP).length, icon: <VCT_Icons.List size={18} />, color: 'var(--vct-warning)' },
            ] as StatItem[]} className="mb-6" />

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <div className="flex gap-1 bg-(--vct-bg-elevated) p-1 rounded-2xl border border-(--vct-border-subtle)">
                    {[{ key: '', label: 'Tất cả' }, ...Object.entries(EVENT_TYPE_MAP).map(([k, v]) => ({ key: k, label: `${v.icon} ${v.label}` }))].map(t => (
                        <button key={t.key} onClick={() => setTypeFilter(t.key)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${typeFilter === t.key ? 'bg-purple-500/15 text-purple-400 shadow-sm' : 'text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex gap-2">
                    <VCT_Button variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>
                        <VCT_Icons.List size={16} />
                    </VCT_Button>
                    <VCT_Button variant={viewMode === 'month' ? 'primary' : 'secondary'} onClick={() => setViewMode('month')}>
                        <VCT_Icons.Calendar size={16} />
                    </VCT_Button>
                </div>
            </div>

            {/* Event List View */}
            {viewMode === 'list' && (
                <div className="space-y-3">
                    {filtered.map(event => {
                        const tp = EVENT_TYPE_MAP[event.type]
                        const st = STATUS_MAP[event.status] || { label: event.status, type: 'neutral' as const }
                        return (
                            <div key={event.id}
                                className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer"
                                style={{ borderLeft: `4px solid ${tp.color}` }}>
                                <VCT_Stack direction="row" justify="space-between" align="flex-start">
                                    <VCT_Stack direction="row" gap={12} align="flex-start" className="flex-1 min-w-0">
                                        <span className="text-2xl">{tp.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: tp.color + '15', color: tp.color }}>{tp.label}</span>
                                            </div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{event.title}</div>
                                            <div className="text-xs opacity-50 mt-1">
                                                📍 {event.location} • 📅 {event.start_date}{event.end_date !== event.start_date ? ` → ${event.end_date}` : ''} • {event.organizer}
                                            </div>
                                        </div>
                                    </VCT_Stack>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </VCT_Stack>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Month View */}
            {viewMode === 'month' && (
                <div className="space-y-6">
                    {Array.from(byMonth.entries()).map(([month, events]) => {
                        const [y, m] = month.split('-')
                        const monthLabel = `${MONTHS[parseInt(m || '1', 10) - 1]} ${y}`
                        return (
                            <div key={month}>
                                <h3 className="text-sm font-bold text-(--vct-text-primary) mb-3 uppercase tracking-wide">
                                    {monthLabel} ({events.length} sự kiện)
                                </h3>
                                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                                    {events.map(event => {
                                        const tp = EVENT_TYPE_MAP[event.type]
                                        const st = STATUS_MAP[event.status] || { label: event.status, type: 'neutral' as const }
                                        return (
                                            <div key={event.id}
                                                className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer"
                                                style={{ borderTop: `3px solid ${tp.color}` }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">{tp.icon}</span>
                                                    <span className="text-xs font-bold" style={{ color: tp.color }}>{tp.label}</span>
                                                    <div className="flex-1" />
                                                    <VCT_Badge text={st.label} type={st.type} />
                                                </div>
                                                <div className="font-bold text-sm text-(--vct-text-primary) mb-1">{event.title}</div>
                                                <div className="text-xs opacity-50">📍 {event.location} • 📅 {event.start_date}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
