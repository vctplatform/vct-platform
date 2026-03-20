'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { VCT_PageContainer, VCT_PageHero, VCT_SectionCard, VCT_StatRow } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { useI18n } from '../i18n'
import type { StatItem } from '../components/VCT_StatRow'

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_command_center = () => {
    const now = new Date()
    const router = useRouter()
    const { t, lang } = useI18n()

    const greeting =
        lang === 'vi'
            ? (now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối')
            : (now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening')

    const QUICK_STATS: StatItem[] = [
        { label: lang === 'vi' ? 'Tổng VĐV' : 'Total Athletes', value: '12,458', icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9', sub: lang === 'vi' ? '+128 tháng này' : '+128 this month' },
        { label: lang === 'vi' ? 'CLB đang hoạt động' : 'Active Clubs', value: '340', icon: <VCT_Icons.Building size={18} />, color: '#10b981', sub: lang === 'vi' ? '+12 CLB mới' : '+12 new clubs' },
        { label: lang === 'vi' ? 'Giải đấu sắp tới' : 'Upcoming Tournaments', value: '5', icon: <VCT_Icons.Trophy size={18} />, color: '#f59e0b', sub: lang === 'vi' ? '2 giải tuần này' : '2 this week' },
        { label: lang === 'vi' ? 'HLV & Trọng tài' : 'Coaches & Referees', value: '1,250', icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6', sub: lang === 'vi' ? '98% đã chứng nhận' : '98% certified' },
    ]

    const RECENT_ACTIONS = [
        { icon: '🏆', text: lang === 'vi' ? 'Giải Vô Địch QG 2026 đã mở đăng ký' : 'National Championship 2026 registration opened', time: lang === 'vi' ? '15 phút trước' : '15 min ago', color: '#f59e0b' },
        { icon: '✅', text: lang === 'vi' ? '23 VĐV mới được phê duyệt hồ sơ' : '23 new athletes approved', time: lang === 'vi' ? '1 giờ trước' : '1 hour ago', color: '#10b981' },
        { icon: '📋', text: lang === 'vi' ? 'Kỳ thi thăng cấp Q2/2026 đã tạo' : 'Q2/2026 Belt Exam created', time: lang === 'vi' ? '3 giờ trước' : '3 hours ago', color: '#3b82f6' },
        { icon: '💰', text: lang === 'vi' ? 'Hội phí tháng 3 đã thu: 85%' : 'March fees collected: 85%', time: lang === 'vi' ? '5 giờ trước' : '5 hours ago', color: '#8b5cf6' },
        { icon: '🎓', text: lang === 'vi' ? 'Khóa đào tạo Trọng tài cấp QG: 80% hoàn thành' : 'National Referee Training: 80% complete', time: lang === 'vi' ? '1 ngày trước' : '1 day ago', color: '#0ea5e9' },
    ]

    const UPCOMING = [
        { title: lang === 'vi' ? 'Giải Vô Địch Quốc Gia 2026' : 'National Championship 2026', date: '15/06/2026', location: lang === 'vi' ? 'Hà Nội' : 'Hanoi', participants: 450, status: 'registration' as const },
        { title: lang === 'vi' ? 'Hội thảo Kỹ thuật Võ Cổ Truyền' : 'Traditional Martial Arts Workshop', date: '20/04/2026', location: lang === 'vi' ? 'TP.HCM' : 'Ho Chi Minh City', participants: 120, status: 'upcoming' as const },
        { title: lang === 'vi' ? 'Kỳ thi Thăng cấp Đai Q2/2026' : 'Q2/2026 Belt Promotion Exam', date: '28/04/2026', location: lang === 'vi' ? 'Đà Nẵng' : 'Da Nang', participants: 156, status: 'upcoming' as const },
    ]

    const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
        registration: { label: lang === 'vi' ? 'Đăng ký' : 'Registration', cls: 'bg-amber-500/12 text-amber-500 border-amber-500/20' },
        upcoming: { label: lang === 'vi' ? 'Sắp tới' : 'Upcoming', cls: 'bg-blue-500/12 text-blue-500 border-blue-500/20' },
    }

    const QUICK_NAV = [
        { icon: <VCT_Icons.Users size={24} />, label: t('dashboard.quickNav.athletes'), color: '#0ea5e9', path: '/athletes' },
        { icon: <VCT_Icons.Building size={24} />, label: t('dashboard.quickNav.clubs'), color: '#10b981', path: '/clubs' },
        { icon: <VCT_Icons.Trophy size={24} />, label: t('dashboard.quickNav.tournaments'), color: '#f59e0b', path: '/giai-dau' },
        { icon: <VCT_Icons.Award size={24} />, label: t('dashboard.quickNav.rankings'), color: '#8b5cf6', path: '/rankings' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ── HERO GREETING ── */}
            <VCT_PageHero
                icon={<span className="text-2xl">🏛️</span>}
                title={`${greeting}, Admin 👋`}
                subtitle={lang === 'vi'
                    ? 'Trung tâm điều hành VCT Platform — Nền tảng quản lý, điều hành võ thuật cổ truyền Việt Nam.'
                    : 'VCT Platform Command Center — Vietnam Traditional Martial Arts Management Platform.'}
                badge={lang === 'vi' ? 'Hệ thống' : 'System'}
                badgeType="info"
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={
                    <>
                        <button
                            onClick={() => router.push('/giai-dau')}
                            className="flex items-center gap-2 rounded-xl bg-vct-accent px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(14,165,233,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(14,165,233,0.35)] hover:brightness-110 active:scale-[0.97]"
                        >
                            <VCT_Icons.Plus size={16} /> {lang === 'vi' ? 'Tạo giải đấu' : 'Create Tournament'}
                        </button>
                        <button
                            onClick={() => router.push('/reports')}
                            className="flex items-center gap-2 rounded-xl border border-vct-border-strong bg-vct-elevated px-4 py-2.5 text-sm font-bold text-vct-text transition-all hover:border-vct-accent hover:shadow-(--vct-shadow-md) active:scale-[0.97]"
                        >
                            <VCT_Icons.BarChart2 size={16} /> {lang === 'vi' ? 'Xem báo cáo' : 'View Reports'}
                        </button>
                    </>
                }
            />

            {/* ── KPI ROW ── */}
            <VCT_StatRow items={QUICK_STATS} className="mb-8" />

            {/* ── MAIN CONTENT ── */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ── RECENT ACTIVITY ── */}
                <VCT_SectionCard
                    title={t('dashboard.recentActivity')}
                    icon={<VCT_Icons.Activity size={18} />}
                    className="lg:col-span-2"
                    accentColor="#0ea5e9"
                >
                    <div className="space-y-2.5">
                        {RECENT_ACTIONS.map((act, i) => (
                            <div
                                key={i}
                                className="group flex items-start gap-3 rounded-xl border border-vct-border bg-vct-bg p-3.5 transition-all hover:border-vct-accent/40 hover:shadow-(--vct-shadow-sm) vct-card-press"
                            >
                                <div
                                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                                    style={{ backgroundColor: `${act.color}12` }}
                                >
                                    {act.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-vct-text leading-snug">{act.text}</div>
                                    <div className="mt-0.5 text-[10px] font-medium text-vct-text-muted">{act.time}</div>
                                </div>
                                <VCT_Icons.ChevronRight size={14} className="shrink-0 text-vct-text-muted opacity-0 transition group-hover:opacity-60" />
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>

                {/* ── UPCOMING EVENTS ── */}
                <VCT_SectionCard
                    title={t('dashboard.upcomingTournaments')}
                    icon={<VCT_Icons.Calendar size={18} />}
                    accentColor="#f59e0b"
                >
                    <div className="space-y-3">
                        {UPCOMING.map((ev, i) => (
                            <div
                                key={i}
                                className="group rounded-xl border border-vct-border bg-vct-bg p-4 transition-all hover:border-vct-accent/40 hover:shadow-(--vct-shadow-sm) vct-card-press cursor-pointer"
                            >
                                <div className="mb-2.5 flex items-start justify-between gap-2">
                                    <div className="text-sm font-bold text-vct-text leading-snug">{ev.title}</div>
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[ev.status]?.cls ?? ''}`}>
                                        {STATUS_BADGE[ev.status]?.label ?? ev.status}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-[11px] text-vct-text-muted">
                                    <span className="flex items-center gap-2">
                                        <VCT_Icons.Calendar size={11} className="shrink-0 opacity-60" /> {ev.date}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <VCT_Icons.MapPin size={11} className="shrink-0 opacity-60" /> {ev.location}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <VCT_Icons.Users size={11} className="shrink-0 opacity-60" /> {ev.participants} {lang === 'vi' ? 'người tham gia' : 'participants'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>
            </div>

            {/* ── QUICK NAV CARDS ── */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {QUICK_NAV.map((card) => (
                    <div
                        key={card.label}
                        onClick={() => router.push(card.path)}
                        className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-vct-border bg-vct-elevated p-5 text-center transition-all duration-200 hover:border-vct-accent hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] vct-card-press"
                    >
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: card.color, boxShadow: `0 8px 20px ${card.color}30` }}
                        >
                            {card.icon}
                        </div>
                        <span className="text-sm font-bold text-vct-text">{card.label}</span>
                    </div>
                ))}
            </div>
        </VCT_PageContainer>
    )
}
