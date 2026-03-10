'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const PROFILE = {
    name: 'Admin Tùng', email: 'admin@vct-platform.vn', phone: '0912 345 678',
    role: 'Super Admin', club: 'Liên đoàn Võ thuật Cổ truyền VN', belt: 'Đai Đen — Nhất Đẳng',
    joinedDate: '15/01/2020', avatar: 'AT',
}

const STATS = [
    { label: 'Giải đấu quản lý', value: 24, icon: '🏆', color: '#f59e0b' },
    { label: 'Năm kinh nghiệm', value: 6, icon: '⭐', color: '#8b5cf6' },
    { label: 'VĐV giám sát', value: '1.2k', icon: '👥', color: '#0ea5e9' },
    { label: 'Chứng nhận', value: 8, icon: '📜', color: '#10b981' },
]

const ACHIEVEMENTS = [
    { title: 'Quản lý Giải VĐQG 2025', date: '06/2025', type: 'gold' },
    { title: 'Tổ chức Hội thảo Quốc tế VN-Hàn', date: '07/2025', type: 'silver' },
    { title: 'Triển khai VCT Platform v2.0', date: '01/2026', type: 'gold' },
    { title: 'Đào tạo 80 Trọng tài Quốc gia', date: '03/2025', type: 'bronze' },
]

const RECENT_ACTIVITY = [
    { icon: '🏆', text: 'Tạo giải Vô địch Quốc gia 2026', time: '2 giờ trước' },
    { icon: '✅', text: 'Duyệt 23 hồ sơ VĐV mới', time: '5 giờ trước' },
    { icon: '📋', text: 'Cập nhật luật thi đấu 2026', time: '1 ngày trước' },
    { icon: '💰', text: 'Phê duyệt ngân sách Q2/2026', time: '2 ngày trước' },
    { icon: '🎓', text: 'Mở khóa đào tạo TT cấp QG', time: '3 ngày trước' },
]

const CERTIFICATIONS = [
    { name: 'Chứng nhận Quản lý Giải đấu QG', org: 'Tổng cục TDTT', year: '2023', status: 'active' },
    { name: 'Trọng tài Quốc gia Hạng A', org: 'Liên đoàn VCT VN', year: '2021', status: 'active' },
    { name: 'Huấn luyện viên Cấp Cao', org: 'Liên đoàn VCT VN', year: '2020', status: 'active' },
    { name: 'Đai Đen Nhất Đẳng', org: 'Phong Trào VCT', year: '2018', status: 'active' },
]

type Tab = 'overview' | 'achievements' | 'certifications' | 'activity'

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_user_profile() {
    const [tab, setTab] = useState<Tab>('overview')

    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            {/* ── HERO HEADER ── */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-vct-accent/30 via-blue-600/20 to-purple-600/20 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
                </div>
                <div className="px-6 pb-6 -mt-12 relative">
                    <div className="flex flex-wrap items-end gap-5">
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-vct-accent to-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl border-4 border-vct-elevated shrink-0">
                            {PROFILE.avatar}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="text-2xl font-black truncate">{PROFILE.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-vct-accent/15 text-vct-accent">{PROFILE.role}</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">{PROFILE.belt}</span>
                            </div>
                            <div className="text-xs text-vct-text-muted mt-2">{PROFILE.club}</div>
                        </div>
                        <div className="flex gap-2 pb-1">
                            <a href="/settings" className="flex items-center gap-1.5 rounded-lg border border-vct-border px-3 py-2 text-xs font-bold text-vct-text-muted hover:border-vct-accent hover:text-vct-accent transition">
                                <VCT_Icons.Settings size={14} /> Cài đặt
                            </a>
                            <button className="flex items-center gap-1.5 rounded-lg bg-vct-accent px-3 py-2 text-xs font-bold text-white hover:brightness-110 transition">
                                <VCT_Icons.Edit size={14} /> Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {STATS.map(s => (
                    <div key={s.label} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                {([
                    { key: 'overview' as Tab, label: '📋 Tổng quan' },
                    { key: 'achievements' as Tab, label: '🏅 Thành tích' },
                    { key: 'certifications' as Tab, label: '📜 Chứng nhận' },
                    { key: 'activity' as Tab, label: '🕐 Hoạt động' },
                ]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${tab === t.key ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB CONTENT ── */}
            {tab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid tablet:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><VCT_Icons.User size={16} className="text-vct-accent" /> Thông tin liên hệ</h3>
                        <div className="grid gap-3">
                            {[{ l: 'Email', v: PROFILE.email, i: '📧' }, { l: 'Điện thoại', v: PROFILE.phone, i: '📱' }, { l: 'Ngày tham gia', v: PROFILE.joinedDate, i: '📅' }, { l: 'Tổ chức', v: PROFILE.club, i: '🏛️' }].map(item => (
                                <div key={item.l} className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                    <span className="text-lg">{item.i}</span>
                                    <div><div className="text-[10px] text-vct-text-muted font-bold">{item.l}</div><div className="text-sm font-bold">{item.v}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><VCT_Icons.Activity size={16} className="text-vct-accent" /> Hoạt động gần đây</h3>
                        <div className="grid gap-2">
                            {RECENT_ACTIVITY.slice(0, 4).map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-vct-input">
                                    <span className="text-lg shrink-0">{a.icon}</span>
                                    <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">{a.text}</div><div className="text-[10px] text-vct-text-muted">{a.time}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {tab === 'achievements' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
                    {ACHIEVEMENTS.map((a, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border border-vct-border bg-vct-elevated p-4 hover:border-vct-accent/50 transition">
                            <div className="text-3xl">{a.type === 'gold' ? '🥇' : a.type === 'silver' ? '🥈' : '🥉'}</div>
                            <div className="flex-1"><div className="font-bold text-sm">{a.title}</div><div className="text-xs text-vct-text-muted mt-0.5">{a.date}</div></div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">Đạt</span>
                        </div>
                    ))}
                </motion.div>
            )}

            {tab === 'certifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
                    {CERTIFICATIONS.map((c, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border border-vct-border bg-vct-elevated p-4 hover:border-vct-accent/50 transition">
                            <div className="h-12 w-12 rounded-xl bg-vct-accent/10 flex items-center justify-center text-xl shrink-0">📜</div>
                            <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{c.name}</div><div className="text-xs text-vct-text-muted mt-0.5">{c.org} · {c.year}</div></div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 shrink-0">Còn hiệu lực</span>
                        </div>
                    ))}
                </motion.div>
            )}

            {tab === 'activity' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2">
                    {RECENT_ACTIVITY.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-vct-border bg-vct-elevated p-4 hover:border-vct-accent/50 transition cursor-pointer">
                            <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
                            <div className="flex-1"><div className="font-bold text-sm">{a.text}</div><div className="text-xs text-vct-text-muted mt-0.5">{a.time}</div></div>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
