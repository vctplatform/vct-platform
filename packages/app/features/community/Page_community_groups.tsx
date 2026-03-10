'use client'
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

interface CommunityGroup {
    id: string; name: string; type: string; desc: string
    members: number; posts: number; avatar: string; joined: boolean; lastActive: string; tags: string[]
}

const GROUPS: CommunityGroup[] = [
    { id: 'g1', name: 'Sơn Long Quyền Việt Nam', type: 'school', desc: 'Cộng đồng môn sinh Sơn Long Quyền trên toàn quốc.', members: 1250, posts: 456, avatar: '🥋', joined: true, lastActive: '5 phút', tags: ['Quyền thuật', 'Đối kháng'] },
    { id: 'g2', name: 'VĐV Đối Kháng Pro', type: 'interest', desc: 'Nhóm dành cho VĐV chuyên nghiệp, chia sẻ chiến thuật.', members: 890, posts: 312, avatar: '⚔️', joined: true, lastActive: '12 phút', tags: ['Đối kháng', 'Chiến thuật'] },
    { id: 'g3', name: 'CLB Võ Cổ Truyền TP.HCM', type: 'region', desc: 'Kết nối CLB võ cổ truyền tại TP.HCM.', members: 2100, posts: 678, avatar: '🏙️', joined: false, lastActive: '1 giờ', tags: ['TP.HCM', 'Giao lưu'] },
    { id: 'g4', name: 'Trọng Tài & Giám Khảo', type: 'interest', desc: 'Diễn đàn trao đổi về luật thi đấu.', members: 340, posts: 89, avatar: '⚖️', joined: false, lastActive: '3 giờ', tags: ['Trọng tài', 'Luật'] },
    { id: 'g5', name: 'Phong Trào Phía Bắc', type: 'region', desc: 'Võ cổ truyền miền Bắc.', members: 780, posts: 234, avatar: '🏔️', joined: false, lastActive: '2 giờ', tags: ['Miền Bắc'] },
    { id: 'g6', name: 'Phụ Huynh VĐV Nhí', type: 'interest', desc: 'Hỗ trợ phụ huynh theo dõi con em tập luyện.', members: 560, posts: 145, avatar: '👨‍👩‍👧‍👦', joined: true, lastActive: '30 phút', tags: ['Phụ huynh', 'Thiếu nhi'] },
]

const COLORS: Record<string, string> = { club: '#f59e0b', school: '#8b5cf6', region: '#3b82f6', interest: '#10b981' }
const LABELS: Record<string, string> = { club: 'CLB', school: 'Dòng phái', region: 'Khu vực', interest: 'Chủ đề' }

export function Page_community_groups() {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let list = GROUPS
        if (filter === 'joined') list = list.filter(g => g.joined)
        else if (filter !== 'all') list = list.filter(g => g.type === filter)
        if (search) { const q = search.toLowerCase(); list = list.filter(g => g.name.toLowerCase().includes(q)) }
        return list
    }, [filter, search])

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Nhóm Cộng Đồng</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Kết nối, chia sẻ và học hỏi cùng cộng đồng võ thuật</p>
                </div>
            </div>

            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng nhóm', v: GROUPS.length, i: '👥' }, { l: 'Đã tham gia', v: GROUPS.filter(g => g.joined).length, i: '✅' },
                { l: 'Tổng thành viên', v: GROUPS.reduce((s, g) => s + g.members, 0).toLocaleString(), i: '🌏' }, { l: 'Bài viết tuần', v: 128, i: '📝' }]
                    .map(s => (
                        <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-3 text-center">
                            <div className="text-xl">{s.i}</div><div className="text-xl font-black mt-1">{s.v}</div><div className="text-xs text-vct-text-muted">{s.l}</div>
                        </div>
                    ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhóm..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                    {[{ v: 'all', l: 'Tất cả' }, { v: 'joined', l: '✅ Đã tham gia' }, { v: 'school', l: '🥋 Dòng phái' }, { v: 'region', l: '📍 Khu vực' }, { v: 'interest', l: '💡 Chủ đề' }].map(f => (
                        <button key={f.v} onClick={() => setFilter(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                    ))}
                </div>
            </div>

            <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {filtered.map(g => (
                    <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer">
                        <div className="h-1.5" style={{ background: COLORS[g.type] || '#64748b' }} />
                        <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="h-12 w-12 rounded-xl bg-vct-input flex items-center justify-center text-2xl shrink-0">{g.avatar}</div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{g.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${COLORS[g.type]}20`, color: COLORS[g.type] }}>{LABELS[g.type]}</span>
                                        {g.joined && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">Đã tham gia</span>}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-vct-text-muted leading-5 mb-3 line-clamp-2">{g.desc}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {g.tags.map(t => <span key={t} className="rounded-full bg-vct-input px-2 py-0.5 text-[10px] font-bold text-vct-text-muted">#{t}</span>)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-vct-text-muted border-t border-vct-border pt-3">
                                <div className="flex items-center gap-3"><span>👥 {g.members.toLocaleString()}</span><span>📝 {g.posts}</span></div>
                                <span>Hoạt động: {g.lastActive}</span>
                            </div>
                            <div className="mt-3">
                                {g.joined
                                    ? <button className="w-full rounded-lg border border-vct-border py-2 text-xs font-bold text-vct-text-muted hover:bg-vct-input transition">Mở nhóm</button>
                                    : <button className="w-full rounded-lg bg-vct-accent py-2 text-xs font-bold text-white hover:brightness-110 transition">+ Tham gia</button>}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
