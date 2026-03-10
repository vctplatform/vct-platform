'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Club: Classes (Lịch lớp học)
// Class schedule management for clubs
// ════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { VCT_Text, VCT_Badge, VCT_Button, VCT_Card } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

interface ClassSession {
    id: string; name: string; instructor: string; day: string; time: string
    level: string; capacity: number; enrolled: number; room: string; status: 'active' | 'full' | 'paused'
}

const MOCK_CLASSES: ClassSession[] = [
    { id: 'c1', name: 'Lớp Cơ Bản A', instructor: 'HLV Trần Minh', day: 'Thứ 2, 4, 6', time: '17:00-18:30', level: 'Sơ cấp', capacity: 30, enrolled: 24, room: 'Phòng A1', status: 'active' },
    { id: 'c2', name: 'Lớp Nâng Cao', instructor: 'HLV Nguyễn Hùng', day: 'Thứ 3, 5, 7', time: '18:00-19:30', level: 'Cao cấp', capacity: 20, enrolled: 20, room: 'Phòng A2', status: 'full' },
    { id: 'c3', name: 'Lớp Thiếu Nhi', instructor: 'HLV Lê Thảo', day: 'Thứ 2, 4, 6', time: '16:00-17:00', level: 'Thiếu nhi', capacity: 25, enrolled: 18, room: 'Phòng B1', status: 'active' },
    { id: 'c4', name: 'Lớp Quyền Thuật', instructor: 'HLV Phạm Đức', day: 'Thứ 7, CN', time: '08:00-10:00', level: 'Trung cấp', capacity: 15, enrolled: 12, room: 'Sân ngoài', status: 'active' },
    { id: 'c5', name: 'Lớp Đối Kháng Pro', instructor: 'HLV Võ Quốc', day: 'Thứ 2-7', time: '19:30-21:00', level: 'Chuyên nghiệp', capacity: 12, enrolled: 10, room: 'Ring', status: 'active' },
    { id: 'c6', name: 'Lớp Cuối Tuần B', instructor: 'HLV Trần Minh', day: 'Thứ 7, CN', time: '09:00-10:30', level: 'Sơ cấp', capacity: 30, enrolled: 15, room: 'Phòng A1', status: 'paused' },
]

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    active: { label: 'Đang hoạt động', variant: 'success' },
    full: { label: 'Đã đầy', variant: 'danger' },
    paused: { label: 'Tạm dừng', variant: 'warning' },
}

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const HOURS = Array.from({ length: 8 }, (_, i) => i + 15) // 15:00 - 22:00

export function Page_club_classes() {
    const [view, setView] = useState<'list' | 'calendar'>('list')

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Lịch Lớp Học</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Quản lý lớp, lịch dạy, phòng học và sĩ số</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex rounded-lg border border-vct-border">
                        <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-bold rounded-l-lg transition ${view === 'list' ? 'bg-vct-accent text-white' : 'bg-vct-elevated text-vct-text-muted'}`}>📋 Danh sách</button>
                        <button onClick={() => setView('calendar')} className={`px-3 py-2 text-xs font-bold rounded-r-lg transition ${view === 'calendar' ? 'bg-vct-accent text-white' : 'bg-vct-elevated text-vct-text-muted'}`}>📅 Lịch</button>
                    </div>
                    <VCT_Button variant="primary" size="sm"><VCT_Icons.Plus size={14} /> Tạo lớp mới</VCT_Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng lớp', value: MOCK_CLASSES.length, icon: '📚', color: '#3b82f6' },
                    { label: 'HLV', value: new Set(MOCK_CLASSES.map(c => c.instructor)).size, icon: '👨‍🏫', color: '#8b5cf6' },
                    { label: 'Tổng sĩ số', value: MOCK_CLASSES.reduce((s, c) => s + c.enrolled, 0), icon: '👥', color: '#10b981' },
                    { label: 'Tỷ lệ lấp đầy', value: Math.round(MOCK_CLASSES.reduce((s, c) => s + c.enrolled, 0) / MOCK_CLASSES.reduce((s, c) => s + c.capacity, 0) * 100) + '%', icon: '📊', color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                        <div className="text-xl mb-1">{s.icon}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-vct-text-muted font-bold">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* List View */}
            {view === 'list' && (
                <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                    {MOCK_CLASSES.map(cls => {
                        const st = STATUS_MAP[cls.status]!
                        const fillPct = Math.round(cls.enrolled / cls.capacity * 100)
                        return (
                            <div key={cls.id} className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer">
                                <div className="h-1.5" style={{ background: st.variant === 'success' ? '#10b981' : st.variant === 'danger' ? '#ef4444' : '#f59e0b' }} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-bold text-sm">{cls.name}</div>
                                            <div className="text-xs text-vct-text-muted">{cls.instructor}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.variant === 'success' ? 'bg-emerald-500/15 text-emerald-600' : st.variant === 'danger' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                            {st.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-vct-text-muted mb-3">
                                        <div>📅 {cls.day}</div>
                                        <div>🕐 {cls.time}</div>
                                        <div>📍 {cls.room}</div>
                                        <div>🎯 {cls.level}</div>
                                    </div>

                                    {/* Capacity bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-vct-text-muted">Sĩ số</span>
                                            <span className="font-bold">{cls.enrolled}/{cls.capacity}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-vct-input overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{
                                                width: `${fillPct}%`,
                                                background: fillPct >= 100 ? '#ef4444' : fillPct >= 80 ? '#f59e0b' : '#10b981'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && (
                <div className="rounded-xl border border-vct-border overflow-hidden">
                    <div className="grid grid-cols-8 text-xs font-bold">
                        <div className="bg-vct-elevated p-3 border-b border-r border-vct-border text-vct-text-muted">Giờ</div>
                        {DAYS.map(d => (
                            <div key={d} className="bg-vct-elevated p-3 text-center border-b border-r border-vct-border">{d}</div>
                        ))}
                    </div>
                    {HOURS.map(h => (
                        <div key={h} className="grid grid-cols-8 text-xs min-h-[48px]">
                            <div className="p-2 border-b border-r border-vct-border text-vct-text-muted font-bold flex items-start">{h}:00</div>
                            {DAYS.map((d, di) => (
                                <div key={`${h}-${di}`} className="p-1 border-b border-r border-vct-border relative">
                                    {MOCK_CLASSES.filter(c => {
                                        const startHour = parseInt(c.time.split(':')[0] || '0')
                                        const dayMatch = di === 0 ? c.day.includes('CN') : c.day.includes(`${di + 1}`) || c.day.includes(`Thứ ${di + 1}`)
                                        return dayMatch && startHour === h
                                    }).map(c => (
                                        <div key={c.id} className="rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-1 text-[10px] font-bold text-blue-600 truncate cursor-pointer hover:bg-blue-500/25">
                                            {c.name.split(' ').slice(1).join(' ')}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
