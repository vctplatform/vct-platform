'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
interface CommunityEvent {
    id: string; title: string; type: 'giao_luu' | 'tap_huan' | 'hoi_thao' | 'thi_dau' | 'le_hoi'
    date: string; endDate?: string; location: string; organizer: string
    participants: number; maxParticipants: number; status: 'upcoming' | 'ongoing' | 'completed' | 'registration'
    image: string; description: string; fee?: number
}

const TYPE_CFG: Record<string, { label: string; color: string; icon: string }> = {
    giao_luu: { label: 'Giao lưu', color: '#3b82f6', icon: '🤝' },
    tap_huan: { label: 'Tập huấn', color: '#10b981', icon: '🥋' },
    hoi_thao: { label: 'Hội thảo', color: '#8b5cf6', icon: '🎤' },
    thi_dau: { label: 'Thi đấu', color: '#f59e0b', icon: '🏆' },
    le_hoi: { label: 'Lễ hội', color: '#ef4444', icon: '🎊' },
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'Sắp tới', color: '#3b82f6' },
    ongoing: { label: 'Đang diễn ra', color: '#10b981' },
    completed: { label: 'Đã kết thúc', color: '#94a3b8' },
    registration: { label: 'Đang mở ĐK', color: '#f59e0b' },
}

const EVENTS: CommunityEvent[] = [
    { id: 'ce1', title: 'Giao lưu Võ cổ truyền VN — Hàn Quốc 2026', type: 'giao_luu', date: '2026-05-10', endDate: '2026-05-12', location: 'Nhà thi đấu Phú Thọ, TP.HCM', organizer: 'Liên đoàn VCT VN', participants: 45, maxParticipants: 80, status: 'registration', image: '🌏', description: 'Chương trình giao lưu quốc tế giữa các võ sư VN và Hàn Quốc.', fee: 500000 },
    { id: 'ce2', title: 'Tập huấn HLV cấp Quốc gia Khóa 12', type: 'tap_huan', date: '2026-04-15', endDate: '2026-04-20', location: 'Trung tâm TDTT Hà Nội', organizer: 'Tổng cục TDTT', participants: 60, maxParticipants: 60, status: 'upcoming', image: '📚', description: 'Khóa cấp chứng nhận HLV quốc gia lần thứ 12.' },
    { id: 'ce3', title: 'Hội thảo Bảo tồn Bài Quyền Truyền Thống', type: 'hoi_thao', date: '2026-06-01', location: 'ĐH TDTT TP.HCM', organizer: 'Viện Nghiên cứu VCT', participants: 35, maxParticipants: 120, status: 'registration', image: '📖', description: 'Hội thảo quốc tế về bảo tồn và hệ thống hóa các bài quyền truyền thống.', fee: 200000 },
    { id: 'ce4', title: 'Giải Giao hữu Miền Trung mở rộng', type: 'thi_dau', date: '2026-03-20', endDate: '2026-03-22', location: 'Đà Nẵng', organizer: 'LĐ VCT Đà Nẵng', participants: 180, maxParticipants: 200, status: 'ongoing', image: '⚔️', description: 'Giải giao hữu mở rộng cho VĐV khu vực miền Trung và Tây Nguyên.' },
    { id: 'ce5', title: 'Lễ hội Võ thuật Cổ truyền Bình Định', type: 'le_hoi', date: '2026-07-15', endDate: '2026-07-20', location: 'Bình Định', organizer: 'UBND Bình Định', participants: 120, maxParticipants: 500, status: 'registration', image: '🎆', description: 'Lễ hội võ thuật truyền thống tại đất võ Bình Định.', fee: 0 },
    { id: 'ce6', title: 'Buổi gặp mặt Cựu VĐV Quốc gia', type: 'giao_luu', date: '2026-03-01', location: 'Hà Nội', organizer: 'Hội VĐV VN', participants: 85, maxParticipants: 100, status: 'completed', image: '🎉', description: 'Buổi gặp mặt thường niên các cựu VĐV từng tham gia ĐTQG.' },
]

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_community_events() {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let list = EVENTS
        if (filter === 'registered') list = list.filter(e => e.status === 'registration')
        else if (filter !== 'all') list = list.filter(e => e.type === filter)
        if (search) { const q = search.toLowerCase(); list = list.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)) }
        return list
    }, [filter, search])

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Sự Kiện Cộng Đồng</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Giao lưu, tập huấn, hội thảo và lễ hội võ thuật</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-vct-accent px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition">
                    <VCT_Icons.Plus size={16} /> Tạo sự kiện
                </button>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng sự kiện', v: EVENTS.length, i: '📅', c: '#0ea5e9' },
                { l: 'Đang mở ĐK', v: EVENTS.filter(e => e.status === 'registration').length, i: '📝', c: '#f59e0b' },
                { l: 'Đang diễn ra', v: EVENTS.filter(e => e.status === 'ongoing').length, i: '🔴', c: '#10b981' },
                { l: 'Tổng người tham gia', v: EVENTS.reduce((s, e) => s + e.participants, 0), i: '👥', c: '#8b5cf6' },
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-xl mb-1">{s.i}</div>
                        <div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* Filter + Search */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sự kiện..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                    {[{ v: 'all', l: 'Tất cả' }, { v: 'registered', l: '📝 Đang mở ĐK' }, ...Object.entries(TYPE_CFG).map(([k, v]) => ({ v: k, l: `${v.icon} ${v.label}` }))].map(f => (
                        <button key={f.v} onClick={() => setFilter(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                    ))}
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {filtered.map(ev => {
                    const cfg = TYPE_CFG[ev.type]!
                    const stCfg = STATUS_CFG[ev.status]!
                    const pct = Math.round((ev.participants / ev.maxParticipants) * 100)
                    return (
                        <motion.div key={ev.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer group">
                            <div className="h-2" style={{ background: cfg.color }} />
                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-12 w-12 rounded-xl bg-vct-input flex items-center justify-center text-2xl shrink-0">{ev.image}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm truncate group-hover:text-vct-accent transition">{ev.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.label}</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${stCfg.color}20`, color: stCfg.color }}>{stCfg.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-vct-text-muted leading-5 mb-3 line-clamp-2">{ev.description}</p>
                                <div className="grid gap-1.5 mb-3 text-xs text-vct-text-muted">
                                    <div className="flex items-center gap-1.5"><VCT_Icons.Calendar size={12} /> {ev.date.replace(/-/g, '/')}{ev.endDate ? ` — ${ev.endDate.replace(/-/g, '/')}` : ''}</div>
                                    <div className="flex items-center gap-1.5"><VCT_Icons.MapPin size={12} /> {ev.location}</div>
                                    <div className="flex items-center gap-1.5"><VCT_Icons.Users size={12} /> {ev.organizer}</div>
                                </div>
                                {/* Progress */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-[10px] text-vct-text-muted mb-1">
                                        <span>{ev.participants}/{ev.maxParticipants} người</span>
                                        <span className="font-bold" style={{ color: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981' }}>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-vct-input overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981' }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-vct-border">
                                    {ev.fee !== undefined && <span className="text-xs font-bold" style={{ color: ev.fee === 0 ? '#10b981' : '#f59e0b' }}>{ev.fee === 0 ? 'Miễn phí' : `${ev.fee.toLocaleString()}đ`}</span>}
                                    {ev.status === 'registration' ?
                                        <button className="rounded-lg bg-vct-accent px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 transition">Đăng ký</button>
                                        : <button className="rounded-lg border border-vct-border px-3 py-1.5 text-xs font-bold text-vct-text-muted hover:bg-vct-input transition">Chi tiết</button>}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
