'use client'

import * as React from 'react'
import { VCT_KpiCard } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const QUICK_STATS = [
    { label: 'Tổng VĐV', value: '12,458', icon: <VCT_Icons.Users size={24} />, color: '#0ea5e9', change: '+128 tháng này' },
    { label: 'CLB đang hoạt động', value: 340, icon: <VCT_Icons.Building size={24} />, color: '#10b981', change: '+12 CLB mới' },
    { label: 'Giải đấu sắp tới', value: 5, icon: <VCT_Icons.Trophy size={24} />, color: '#f59e0b', change: '2 giải tuần này' },
    { label: 'HLV & Trọng tài', value: 1250, icon: <VCT_Icons.Award size={24} />, color: '#8b5cf6', change: '98% đã chứng nhận' },
]

const RECENT_ACTIONS = [
    { icon: '🏆', text: 'Giải Vô Địch QG 2024 đã mở đăng ký', time: '15 phút trước', type: 'tournament' },
    { icon: '✅', text: '23 VĐV mới được phê duyệt hồ sơ', time: '1 giờ trước', type: 'athlete' },
    { icon: '📋', text: 'Kỳ thi thăng cấp Q2/2024 đã tạo', time: '3 giờ trước', type: 'exam' },
    { icon: '💰', text: 'Hội phí tháng 3 đã thu: 85%', time: '5 giờ trước', type: 'finance' },
    { icon: '🎓', text: 'Khóa đào tạo Trọng tài cấp QG: 80% hoàn thành', time: '1 ngày trước', type: 'training' },
]

const UPCOMING = [
    { title: 'Giải Vô Địch Quốc Gia 2024', date: '15/06/2024', location: 'Hà Nội', participants: 450, status: 'registration' },
    { title: 'Hội thảo Kỹ thuật Võ Cổ Truyền', date: '20/04/2024', location: 'TP.HCM', participants: 120, status: 'upcoming' },
    { title: 'Kỳ thi Thăng cấp Đai Q2/2024', date: '28/04/2024', location: 'Đà Nẵng', participants: 156, status: 'upcoming' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_command_center = () => {
    const now = new Date()
    const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            {/* ── HERO GREETING ── */}
            <div className="mb-8 bg-gradient-to-r from-[#0ea5e920] via-transparent to-[#8b5cf620] border border-[var(--vct-border-strong)] rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--vct-accent-cyan)] rounded-full blur-[120px] opacity-10"></div>
                <h1 className="text-3xl font-black tracking-tight text-[var(--vct-text-primary)] mb-2">
                    {greeting}, <span className="text-[var(--vct-accent-cyan)]">Admin</span> 👋
                </h1>
                <p className="text-sm text-[var(--vct-text-secondary)] max-w-xl">
                    Trung tâm điều hành VCT Platform — Nền tảng quản lý, điều hành võ thuật cổ truyền Việt Nam.
                </p>
                <div className="flex gap-3 mt-5">
                    <button className="px-4 py-2 bg-[var(--vct-accent-cyan)] text-white text-sm font-bold rounded-xl hover:shadow-[0_6px_20px_rgba(14,165,233,0.3)] transition-all">
                        <span className="flex items-center gap-2"><VCT_Icons.Plus size={16} /> Tạo giải đấu mới</span>
                    </button>
                    <button className="px-4 py-2 bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] text-[var(--vct-text-primary)] text-sm font-bold rounded-xl hover:border-[var(--vct-accent-cyan)] transition-all">
                        <span className="flex items-center gap-2"><VCT_Icons.BarChart2 size={16} /> Xem báo cáo</span>
                    </button>
                </div>
            </div>

            {/* ── KPI ROW ── */}
            <div className="vct-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {QUICK_STATS.map((stat) => (
                    <VCT_KpiCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} sub={stat.change} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── RECENT ACTIVITY ── */}
                <div className="lg:col-span-2 bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={20} className="text-[var(--vct-accent-cyan)]" /> Hoạt động gần đây
                    </h2>
                    <div className="space-y-3">
                        {RECENT_ACTIONS.map((act, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-colors cursor-pointer">
                                <span className="text-xl shrink-0 mt-0.5">{act.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-[var(--vct-text-primary)]">{act.text}</div>
                                    <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-0.5">{act.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── UPCOMING EVENTS ── */}
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                        <VCT_Icons.Calendar size={20} className="text-[#f59e0b]" /> Sắp diễn ra
                    </h2>
                    <div className="space-y-3">
                        {UPCOMING.map((ev, i) => (
                            <div key={i} className="p-4 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-colors cursor-pointer">
                                <div className="font-bold text-sm text-[var(--vct-text-primary)] mb-2">{ev.title}</div>
                                <div className="flex flex-col gap-1 text-[11px] text-[var(--vct-text-tertiary)]">
                                    <span className="flex items-center gap-1.5"><VCT_Icons.Calendar size={10} /> {ev.date}</span>
                                    <span className="flex items-center gap-1.5"><VCT_Icons.MapPin size={10} /> {ev.location}</span>
                                    <span className="flex items-center gap-1.5"><VCT_Icons.Users size={10} /> {ev.participants} người tham gia</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── QUICK NAV CARDS ── */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: <VCT_Icons.Users size={28} />, label: 'Quản lý VĐV', color: '#0ea5e9', path: '/athletes' },
                    { icon: <VCT_Icons.Building size={28} />, label: 'CLB & Võ đường', color: '#10b981', path: '/clubs' },
                    { icon: <VCT_Icons.Trophy size={28} />, label: 'Giải đấu', color: '#f59e0b', path: '/giai-dau' },
                    { icon: <VCT_Icons.Award size={28} />, label: 'Bảng xếp hạng', color: '#8b5cf6', path: '/rankings' },
                ].map((card) => (
                    <div key={card.label} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-[var(--vct-accent-cyan)] hover:shadow-[0_4px_24px_-8px_var(--vct-accent-cyan)] transition-all group text-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg transition-transform group-hover:scale-110" style={{ background: card.color, boxShadow: `0 8px 24px ${card.color}40` }}>
                            {card.icon}
                        </div>
                        <span className="text-sm font-bold text-[var(--vct-text-primary)]">{card.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
