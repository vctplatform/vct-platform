'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
interface MediaItem {
    id: string; type: 'photo' | 'video'; title: string; tournament: string
    date: string; category: string; url: string; views: number; likes: number
}

const CATEGORIES = ['Tất cả', 'Đối kháng', 'Quyền', 'Lễ khai mạc', 'Trao giải', 'Hậu trường']

const MEDIA: MediaItem[] = [
    { id: 'm1', type: 'photo', title: 'Trận chung kết 60kg nam', tournament: 'VĐQG 2025', date: '2025-06-18', category: 'Đối kháng', url: '🥊', views: 2450, likes: 189 },
    { id: 'm2', type: 'video', title: 'Biểu diễn Lão Mai Quyền', tournament: 'VĐQG 2025', date: '2025-06-17', category: 'Quyền', url: '🎭', views: 5230, likes: 423 },
    { id: 'm3', type: 'photo', title: 'Lễ khai mạc Giải Trẻ 2026', tournament: 'Giải Trẻ 2026', date: '2026-03-15', category: 'Lễ khai mạc', url: '🎪', views: 1890, likes: 156 },
    { id: 'm4', type: 'video', title: 'KO ấn tượng nhất giải', tournament: 'VĐQG 2025', date: '2025-06-19', category: 'Đối kháng', url: '💥', views: 12400, likes: 891 },
    { id: 'm5', type: 'photo', title: 'Trao HCV cho Nguyễn Văn A', tournament: 'VĐQG 2025', date: '2025-06-20', category: 'Trao giải', url: '🏅', views: 3450, likes: 267 },
    { id: 'm6', type: 'photo', title: 'HLV và VĐV đoàn Bình Định', tournament: 'VĐQG 2025', date: '2025-06-16', category: 'Hậu trường', url: '📸', views: 980, likes: 78 },
    { id: 'm7', type: 'video', title: 'Hạ đài biểu diễn võ cổ truyền', tournament: 'Giải Trẻ 2026', date: '2026-03-16', category: 'Quyền', url: '🎬', views: 4560, likes: 334 },
    { id: 'm8', type: 'photo', title: 'Toàn cảnh sân thi đấu', tournament: 'VĐQG 2025', date: '2025-06-15', category: 'Hậu trường', url: '🏟️', views: 890, likes: 56 },
    { id: 'm9', type: 'video', title: 'Phóng sự: Con đường đến HCV', tournament: 'VĐQG 2025', date: '2025-06-21', category: 'Hậu trường', url: '🎥', views: 8900, likes: 612 },
]

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_tournament_media_gallery() {
    const [cat, setCat] = useState('Tất cả')
    const [typeF, setTypeF] = useState<'all' | 'photo' | 'video'>('all')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let list = MEDIA
        if (cat !== 'Tất cả') list = list.filter(m => m.category === cat)
        if (typeF !== 'all') list = list.filter(m => m.type === typeF)
        if (search) { const q = search.toLowerCase(); list = list.filter(m => m.title.toLowerCase().includes(q) || m.tournament.toLowerCase().includes(q)) }
        return list
    }, [cat, typeF, search])

    const totalViews = MEDIA.reduce((s, m) => s + m.views, 0)
    const totalLikes = MEDIA.reduce((s, m) => s + m.likes, 0)

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Gallery Media Giải Đấu</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Ảnh và video từ các giải đấu và sự kiện</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-vct-accent px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition">
                    <VCT_Icons.Upload size={16} /> Upload media
                </button>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng media', v: MEDIA.length, i: '📸', c: '#0ea5e9' },
                { l: 'Ảnh', v: MEDIA.filter(m => m.type === 'photo').length, i: '🖼️', c: '#8b5cf6' },
                { l: 'Tổng lượt xem', v: totalViews.toLocaleString(), i: '👁️', c: '#f59e0b' },
                { l: 'Tổng lượt thích', v: totalLikes.toLocaleString(), i: '❤️', c: '#ef4444' },
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-xl mb-1">{s.i}</div><div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm media..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5">
                    {[{ v: 'all' as const, l: 'Tất cả' }, { v: 'photo' as const, l: '🖼️ Ảnh' }, { v: 'video' as const, l: '🎬 Video' }].map(f => (
                        <button key={f.v} onClick={() => setTypeF(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${typeF === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                    ))}
                </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCat(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${cat === c ? 'bg-vct-accent text-white' : 'bg-vct-input text-vct-text-muted hover:bg-vct-accent/20'}`}>{c}</button>
                ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-3">
                {filtered.map(m => (
                    <motion.div key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer group">
                        <div className="aspect-[4/3] bg-vct-input flex items-center justify-center text-5xl relative">
                            {m.url}
                            {m.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center"><VCT_Icons.Play size={20} className="text-vct-accent ml-0.5" /></div>
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.type === 'video' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                    {m.type === 'video' ? 'VIDEO' : 'PHOTO'}
                                </span>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="font-bold text-xs truncate group-hover:text-vct-accent transition">{m.title}</div>
                            <div className="text-[10px] text-vct-text-muted mt-0.5">{m.tournament} · {m.date}</div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-vct-text-muted">
                                <span className="flex items-center gap-1">👁️ {m.views.toLocaleString()}</span>
                                <span className="flex items-center gap-1">❤️ {m.likes}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
