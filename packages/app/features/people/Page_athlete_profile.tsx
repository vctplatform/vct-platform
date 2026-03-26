'use client'

import React, { useState } from 'react'
import {
    VCT_PageContainer, VCT_PageHero, VCT_SectionCard,
    VCT_EmptyState, VCT_StatRow, VCT_Badge,
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ── Types ────────────────────────────────────────────────────

interface AthleteProfile {
    id: string
    ho_ten: string
    gioi_tinh: 'nam' | 'nu'
    ngay_sinh: string
    can_nang: number
    chieu_cao: number
    doan_ten: string
    tinh: string
    dai: string
    dai_color: string
    so_nam_tap: number
    trang_thai: string
    avatar_url?: string
    total_matches: number
    wins: number
    losses: number
    medals: { gold: number; silver: number; bronze: number }
    elo_rating: number
    achievements: { year: number; event: string; result: string }[]
    belt_history: { date: string; belt: string; color: string }[]
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_ATHLETE: AthleteProfile = {
    id: 'vdv-001',
    ho_ten: 'Nguyễn Thành Long',
    gioi_tinh: 'nam',
    ngay_sinh: '2000-05-15',
    can_nang: 68.5,
    chieu_cao: 175,
    doan_ten: 'Bình Định',
    tinh: 'Bình Định',
    dai: 'Đai đen',
    dai_color: 'var(--vct-text-primary)',
    so_nam_tap: 12,
    trang_thai: 'du_dieu_kien',
    total_matches: 45,
    wins: 32,
    losses: 13,
    medals: { gold: 8, silver: 5, bronze: 3 },
    elo_rating: 1823,
    achievements: [
        { year: 2025, event: 'Giải Vô địch Quốc gia', result: 'HCV Đối kháng 68kg' },
        { year: 2024, event: 'Giải Các CLB Mạnh', result: 'HCB Quyền thuật' },
        { year: 2024, event: 'Đại hội TDTT Quốc gia', result: 'HCV Đối kháng 65kg' },
        { year: 2023, event: 'Giải Vô địch Quốc gia', result: 'HCĐ Đối kháng 65kg' },
        { year: 2022, event: 'Giải Trẻ Quốc gia', result: 'HCV Đối kháng 60kg' },
    ],
    belt_history: [
        { date: '2025-01', belt: 'Đai đen', color: 'var(--vct-text-primary)' },
        { date: '2023-06', belt: 'Đai đỏ', color: 'var(--vct-danger)' },
        { date: '2021-03', belt: 'Đai xanh dương', color: 'var(--vct-info)' },
        { date: '2019-09', belt: 'Đai xanh lá', color: 'var(--vct-success)' },
        { date: '2017-01', belt: 'Đai vàng', color: 'var(--vct-gold)' },
        { date: '2014-06', belt: 'Đai trắng', color: '#d1d5db' },
    ]
}

// ── Tab Component ────────────────────────────────────────────

const TABS = [
    { id: 'info', label: 'Thông tin', icon: 'User' },
    { id: 'stats', label: 'Thành tích', icon: 'TrendingUp' },
    { id: 'timeline', label: 'Lịch sử', icon: 'Clock' },
    { id: 'medical', label: 'Y tế', icon: 'Heart' },
    { id: 'belt', label: 'Đai', icon: 'Award' },
] as const

type TabId = typeof TABS[number]['id']

// ── Main Component ───────────────────────────────────────────

export default function Page_athlete_profile() {
    const [activeTab, setActiveTab] = useState<TabId>('info')
    const athlete = MOCK_ATHLETE
    const winRate = athlete.total_matches > 0 ? Math.round((athlete.wins / athlete.total_matches) * 100) : 0

    const heroStats: StatItem[] = [
        { label: 'ELO', value: athlete.elo_rating, color: 'var(--vct-danger)' },
        { label: 'Tỉ lệ thắng', value: `${winRate}%`, color: 'var(--vct-success)' },
        { label: 'Huy chương', value: `🥇${athlete.medals.gold} 🥈${athlete.medals.silver} 🥉${athlete.medals.bronze}`, color: 'var(--vct-warning)' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ── Profile Header ──────────────────────────── */}
            <VCT_PageHero
                icon={
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold text-white">
                        {athlete.ho_ten.split(' ').pop()?.[0]}
                    </div>
                }
                title={athlete.ho_ten}
                subtitle={`🥋 ${athlete.dai} · 📍 ${athlete.doan_ten} · ${athlete.gioi_tinh === 'nam' ? '♂' : '♀'} ${new Date().getFullYear() - new Date(athlete.ngay_sinh).getFullYear()} tuổi`}
                gradientFrom="rgba(153, 27, 27, 0.9)"
                gradientTo="rgba(220, 38, 38, 0.9)"
            />

            {/* ── Quick Stats ─────────────────────────────── */}
            <VCT_StatRow items={heroStats} cols={3} className="-mt-2 mb-6" />

            {/* ── Tabs ────────────────────────────────────── */}
            <div className="mb-6 flex gap-1 border-b-2 border-vct-border">
                {TABS.map(tab => {
                    const IconComp = VCT_Icons[tab.icon as keyof typeof VCT_Icons]
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`-mb-[2px] flex items-center gap-1.5 border-b-2 px-5 py-3 text-sm transition-all ${activeTab === tab.id
                                    ? 'border-red-500 font-semibold text-red-500'
                                    : 'border-transparent text-vct-text-muted hover:text-vct-text'
                                }`}
                        >
                            {IconComp && <IconComp size={16} />} {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ── Tab Content ─────────────────────────────── */}
            {activeTab === 'info' && (
                <div className="grid gap-5 md:grid-cols-2">
                    <VCT_SectionCard title="Thông tin cá nhân" icon={<VCT_Icons.User size={18} />}>
                        <div className="space-y-4">
                            {[
                                { icon: <VCT_Icons.Calendar size={16} />, label: 'Ngày sinh', value: new Date(athlete.ngay_sinh).toLocaleDateString('vi-VN') },
                                { icon: <VCT_Icons.User size={16} />, label: 'Giới tính', value: athlete.gioi_tinh === 'nam' ? 'Nam' : 'Nữ' },
                                { icon: <VCT_Icons.Scale size={16} />, label: 'Cân nặng', value: `${athlete.can_nang} kg` },
                                { icon: <VCT_Icons.Activity size={16} />, label: 'Chiều cao', value: `${athlete.chieu_cao} cm` },
                                { icon: <VCT_Icons.Clock size={16} />, label: 'Số năm tập', value: `${athlete.so_nam_tap} năm` },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vct-bg text-vct-text-muted">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs text-vct-text-muted">{item.label}</div>
                                        <div className="text-sm font-medium text-vct-text">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>

                    <VCT_SectionCard title="Thống kê thi đấu" icon={<VCT_Icons.BarChart2 size={18} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-vct-bg p-4 text-center">
                                <div className="text-3xl font-bold text-vct-text">{athlete.total_matches}</div>
                                <div className="text-[13px] text-vct-text-muted">Tổng trận</div>
                            </div>
                            <div className="rounded-xl bg-green-500/5 p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">{athlete.wins}</div>
                                <div className="text-[13px] text-vct-text-muted">Thắng</div>
                            </div>
                            <div className="rounded-xl bg-red-500/5 p-4 text-center">
                                <div className="text-3xl font-bold text-red-600">{athlete.losses}</div>
                                <div className="text-[13px] text-vct-text-muted">Thua</div>
                            </div>
                            <div className="rounded-xl bg-amber-500/5 p-4 text-center">
                                <div className="text-3xl font-bold text-amber-500">{winRate}%</div>
                                <div className="text-[13px] text-vct-text-muted">Tỉ lệ thắng</div>
                            </div>
                        </div>
                    </VCT_SectionCard>
                </div>
            )}

            {activeTab === 'stats' && (
                <VCT_SectionCard title="Thành tích thi đấu" icon={<VCT_Icons.Trophy size={18} />}>
                    <div className="space-y-2">
                        {athlete.achievements.map((a, i) => (
                            <div key={i} className="flex items-center gap-4 rounded-xl border border-vct-border bg-vct-bg p-3.5 transition-all hover:border-vct-accent/30">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${a.result.includes('HCV') ? 'bg-amber-50 dark:bg-amber-500/10' : a.result.includes('HCB') ? 'bg-slate-100 dark:bg-slate-500/10' : 'bg-orange-50 dark:bg-orange-500/10'
                                    }`}>
                                    {a.result.includes('HCV') ? '🥇' : a.result.includes('HCB') ? '🥈' : '🥉'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-vct-text">{a.event}</div>
                                    <div className="text-[13px] text-vct-text-muted">{a.result}</div>
                                </div>
                                <span className="text-sm font-medium text-vct-text-muted">{a.year}</span>
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>
            )}

            {activeTab === 'belt' && (
                <VCT_SectionCard title="Lịch sử Đai" icon={<VCT_Icons.Award size={18} />}>
                    <div className="relative pl-8">
                        <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-vct-border" />
                        {athlete.belt_history.map((b, i) => (
                            <div key={i} className="relative mb-5 flex items-center gap-4 last:mb-0">
                                <div
                                    className="absolute -left-5 z-10 h-6 w-6 rounded-full border-[3px] border-white shadow-sm dark:border-slate-800"
                                    style={{ backgroundColor: b.color, boxShadow: `0 0 0 2px ${b.color}40` }}
                                />
                                <div className="flex-1 rounded-xl border border-vct-border bg-vct-bg p-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-semibold text-vct-text">{b.belt}</span>
                                        <span className="text-[13px] text-vct-text-muted">{b.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>
            )}

            {activeTab === 'medical' && (
                <VCT_EmptyState
                    icon={<VCT_Icons.Heart size={48} />}
                    title="Hồ sơ Y tế"
                    description="Chưa có hồ sơ y tế nào được ghi nhận"
                />
            )}

            {activeTab === 'timeline' && (
                <VCT_SectionCard title="Dòng thời gian" icon={<VCT_Icons.Clock size={18} />}>
                    <div className="relative pl-8">
                        <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-vct-border" />
                        {[...athlete.achievements, ...athlete.belt_history.map(b => ({ year: parseInt(b.date.split('-')[0] || ''), event: 'Thăng đai', result: b.belt }))]
                            .sort((a, b) => b.year - a.year)
                            .map((item, i) => (
                                <div key={i} className="relative mb-4 flex items-center gap-4 last:mb-0">
                                    <div className={`absolute -left-5 z-10 h-5 w-5 rounded-full border-[3px] border-white dark:border-slate-800 ${item.event === 'Thăng đai' ? 'bg-amber-500' : 'bg-red-600'
                                        }`} />
                                    <div className="flex-1 rounded-xl border border-vct-border bg-vct-bg p-3">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-vct-text">{item.event}</div>
                                                <div className="text-[13px] text-vct-text-muted">{item.result}</div>
                                            </div>
                                            <span className="text-[13px] text-vct-text-muted">{item.year}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </VCT_SectionCard>
            )}
        </VCT_PageContainer>
    )
}
