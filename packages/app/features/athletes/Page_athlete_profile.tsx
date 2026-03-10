'use client'
import React, { useState } from 'react'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'

const ATHLETE_DATA = {
    name: 'Nguyễn Hoàng Nam', dob: '15/03/2002', gender: 'Nam', club: 'CLB Sơn Long TP.HCM',
    belt: 'Huyền đai nhị đẳng', coach: 'Vs. Trần Minh Tuấn', phone: '0901-234-567',
    categories: ['Đối kháng Nam 60kg', 'Quyền thuật Nam'],
    stats: { matches: 45, wins: 38, losses: 7, draws: 0, medals: { gold: 12, silver: 8, bronze: 5 } },
    tournaments: [
        { name: 'VĐQG 2026', date: '15-20/06/2026', status: 'Đang thi đấu', result: '🥇 HCV ĐK 60kg' },
        { name: 'Giải Tp.HCM 2025', date: '01-05/12/2025', status: 'Đã kết thúc', result: '🥇 HCV ĐK + 🥈 HCB Quyền' },
        { name: 'SEA Games 32', date: '05-15/05/2025', status: 'Đã kết thúc', result: '🥉 HCĐ ĐK 60kg' },
    ],
    ranking: { national: 3, regional: 1 },
}

export function Page_athlete_profile() {
    const [tab, setTab] = useState<'overview' | 'tournaments' | 'training'>('overview')
    const d = ATHLETE_DATA

    const profileStats: StatItem[] = [
        { label: 'Tổng trận', value: d.stats.matches, color: '#3b82f6', icon: <VCT_Icons.Swords size={14} /> },
        { label: 'Thắng', value: d.stats.wins, color: '#10b981', icon: <VCT_Icons.TrendingUp size={14} /> },
        { label: 'Thua', value: d.stats.losses, color: '#ef4444', icon: <VCT_Icons.TrendingDown size={14} /> },
        { label: '🥇 HCV', value: d.stats.medals.gold, color: '#eab308' },
        { label: 'BXH QG', value: `#${d.ranking.national}`, color: '#8b5cf6', icon: <VCT_Icons.Award size={14} /> },
    ]

    return (
        <VCT_PageContainer size="narrow" animated>
            {/* HERO PROFILE */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-vct-border bg-vct-elevated">
                <div className="h-28 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-emerald-500/10" />
                <div className="px-6 pb-6">
                    <div className="mb-5 flex flex-wrap items-end gap-4 -mt-12">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-vct-bg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-5xl shadow-lg">
                            🥋
                        </div>
                        <div className="flex-1 pt-2">
                            <h1 className="m-0 text-2xl font-black tracking-tight text-vct-text">{d.name}</h1>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-vct-text-muted">
                                <span className="flex items-center gap-1"><VCT_Icons.Building size={11} /> {d.club}</span>
                                <span className="opacity-30">•</span>
                                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">{d.belt}</span>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-1 font-bold text-purple-500"><VCT_Icons.Award size={11} /> BXH QG: #{d.ranking.national}</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-1.5 rounded-xl border border-vct-border px-3.5 py-2 text-xs font-bold text-vct-text-muted transition hover:border-vct-accent hover:bg-vct-input hover:text-vct-text">
                            <VCT_Icons.Edit size={13} /> Chỉnh sửa
                        </button>
                    </div>

                    <VCT_StatRow items={profileStats} cols={5} />
                </div>
            </div>

            {/* TABS */}
            <div className="mb-6 flex gap-1 border-b border-vct-border">
                {[
                    { v: 'overview' as const, l: '📋 Tổng quan', icon: <VCT_Icons.FileText size={14} /> },
                    { v: 'tournaments' as const, l: '🏆 Giải đấu', icon: <VCT_Icons.Trophy size={14} /> },
                    { v: 'training' as const, l: '🥋 Luyện tập', icon: <VCT_Icons.Activity size={14} /> },
                ].map(t => (
                    <button key={t.v} onClick={() => setTab(t.v)}
                        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${tab === t.v ? 'border-vct-accent text-vct-accent' : 'border-transparent text-vct-text-muted hover:text-vct-text hover:border-vct-border-strong'}`}
                    >
                        {t.l}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW */}
            {tab === 'overview' && (
                <div className="grid gap-6 tablet:grid-cols-2">
                    <VCT_SectionCard title="Thông tin cá nhân" icon={<VCT_Icons.User size={16} />} accentColor="#3b82f6">
                        <div className="space-y-0">
                            {[
                                { l: 'Ngày sinh', v: d.dob },
                                { l: 'Giới tính', v: d.gender },
                                { l: 'SĐT', v: d.phone },
                                { l: 'CLB', v: d.club },
                                { l: 'HLV', v: d.coach },
                                { l: 'Đai', v: d.belt }
                            ].map(i => (
                                <div key={i.l} className="flex justify-between py-2.5 border-b border-vct-border last:border-0 text-xs">
                                    <span className="text-vct-text-muted">{i.l}</span>
                                    <span className="font-bold text-vct-text">{i.v}</span>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>

                    <div className="space-y-6">
                        <VCT_SectionCard title="Nội dung thi đấu" icon={<VCT_Icons.Eye size={16} />} accentColor="#10b981">
                            <div className="space-y-2">
                                {d.categories.map(c => (
                                    <div key={c} className="flex items-center gap-3 rounded-xl border border-vct-border bg-vct-bg px-4 py-3 text-sm transition hover:border-vct-accent/40">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">🎯</span>
                                        <span className="font-bold text-vct-text">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </VCT_SectionCard>

                        <VCT_SectionCard title="Thành tích huy chương" icon={<VCT_Icons.Award size={16} />} accentColor="#eab308">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { l: '🥇', v: d.stats.medals.gold, label: 'HCV', color: '#eab308' },
                                    { l: '🥈', v: d.stats.medals.silver, label: 'HCB', color: '#94a3b8' },
                                    { l: '🥉', v: d.stats.medals.bronze, label: 'HCĐ', color: '#b45309' },
                                ].map(m => (
                                    <div key={m.label} className="rounded-xl border border-vct-border bg-vct-bg p-4 text-center transition hover:shadow-[var(--vct-shadow-md)]">
                                        <div className="text-3xl mb-1">{m.l}</div>
                                        <div className="text-2xl font-black" style={{ color: m.color }}>{m.v}</div>
                                        <div className="text-[10px] font-bold text-vct-text-muted mt-0.5">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </VCT_SectionCard>
                    </div>
                </div>
            )}

            {/* TAB: TOURNAMENTS */}
            {tab === 'tournaments' && (
                <div className="space-y-3">
                    {d.tournaments.map((t, i) => (
                        <div key={i} className="group flex items-center gap-4 rounded-2xl border border-vct-border bg-vct-elevated p-5 transition-all hover:border-vct-accent/40 hover:shadow-[var(--vct-shadow-md)] cursor-pointer vct-card-press">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">🏆</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-vct-text">{t.name}</div>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-vct-text-muted">
                                    <VCT_Icons.Calendar size={10} /> {t.date}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs font-bold text-vct-text">{t.result}</div>
                                <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.status === 'Đang thi đấu' ? 'border-blue-500/25 bg-blue-500/10 text-blue-500' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'}`}>
                                    {t.status}
                                </span>
                            </div>
                            <VCT_Icons.ChevronRight size={16} className="shrink-0 text-vct-text-muted opacity-0 transition group-hover:opacity-60" />
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: TRAINING */}
            {tab === 'training' && (
                <VCT_SectionCard>
                    <VCT_EmptyState
                        icon="📊"
                        title="Lịch sử luyện tập"
                        description="Tính năng đang phát triển. Dữ liệu sẽ được cập nhật từ app điểm danh."
                    />
                </VCT_SectionCard>
            )}
        </VCT_PageContainer>
    )
}
