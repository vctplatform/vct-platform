'use client'
import React from 'react'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_StatRow } from '../components/vct-ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile } from '@vct/shared-types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE RANKINGS (Personal)
// BXH & Thành tích riêng cho VĐV
// ═══════════════════════════════════════════════════════════════

export function Page_athlete_rankings() {
    const { data: profile, isLoading } = useApiQuery<AthleteProfile>(
        '/api/v1/athlete-profiles/me'
    )

    if (isLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="space-y-6 animate-pulse">
                    <div className="h-[200px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-[120px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                        <div className="h-[120px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                        <div className="h-[120px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    </div>
                </div>
            </VCT_PageContainer>
        )
    }

    if (!profile) {
        return (
            <VCT_PageContainer>
                <VCT_EmptyState
                    icon={<VCT_Icons.User size={48} />}
                    title="Chưa có hồ sơ VĐV"
                    description="Vui lòng liên kết hồ sơ VĐV trước khi xem bảng xếp hạng."
                />
            </VCT_PageContainer>
        )
    }

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ HEADER ══ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-vct-border">
                        <VCT_Icons.BarChart2 size={24} className="text-[#3b82f6]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-vct-text m-0">BXH & Thành tích</h1>
                        <p className="text-sm text-vct-text-muted mt-0.5">Thứ hạng và thành tích cá nhân của bạn</p>
                    </div>
                </div>
            </div>

            {/* ══ QUICK STATS ══ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#3b82f6]/10 to-[#2563eb]/10 border border-[#3b82f6]/20 text-center group hover:scale-[1.02] transition-transform">
                    <VCT_Icons.TrendingUp size={28} className="text-[#3b82f6] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-vct-text">{profile.elo_rating || '—'}</div>
                    <div className="text-xs font-medium text-vct-text-muted mt-1 uppercase tracking-wider">Điểm ELO</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center group hover:scale-[1.02] transition-transform">
                    <VCT_Icons.Award size={28} className="text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-vct-text">{profile.total_medals || 0}</div>
                    <div className="text-xs font-medium text-vct-text-muted mt-1 uppercase tracking-wider">Huy chương</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-center group hover:scale-[1.02] transition-transform">
                    <VCT_Icons.Trophy size={28} className="text-emerald-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-vct-text">{profile.total_tournaments || 0}</div>
                    <div className="text-xs font-medium text-vct-text-muted mt-1 uppercase tracking-wider">Giải đấu</div>
                </div>
            </div>

            {/* ══ GOALS PROGRESS ══ */}
            {profile.goals && profile.goals.length > 0 && (
                <VCT_SectionCard
                    title="Mục tiêu cá nhân"
                    icon={<VCT_Icons.Target size={20} />}
                    accentColor="#8b5cf6"
                    className="border border-vct-border mb-8"
                >
                    <div className="space-y-4">
                        {profile.goals.map((g, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-vct-bg border border-vct-border group hover:border-vct-border-strong transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-vct-text group-hover:text-[#8b5cf6] transition-colors">{g.title}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.progress >= 100 ? 'bg-emerald-500/10 text-emerald-500' : g.progress >= 50 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {g.progress}%
                                    </span>
                                </div>
                                <div className="h-2 bg-vct-border rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(g.progress, 100)}%`, background: g.progress >= 100 ? '#22c55e' : g.progress >= 50 ? '#3b82f6' : '#f59e0b' }} />
                                </div>
                                {g.type && <div className="text-[10px] text-vct-text-muted mt-1.5 uppercase tracking-wider">{g.type}</div>}
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>
            )}

            {/* ══ SKILL STATS ══ */}
            {profile.skill_stats && profile.skill_stats.length > 0 && (
                <VCT_SectionCard
                    title="Chỉ số kỹ năng"
                    icon={<VCT_Icons.Activity size={20} />}
                    accentColor="#3b82f6"
                    className="border border-vct-border mb-8"
                >
                    <div className="space-y-3">
                        {profile.skill_stats.map(s => (
                            <div key={s.label} className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-vct-text-muted w-24 text-right">{s.label}</span>
                                <div className="flex-1 h-3 bg-vct-bg rounded-full border border-vct-border overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.value}%`, background: s.color }}></div>
                                </div>
                                <span className="text-sm font-black w-10 text-right" style={{ color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>
            )}

            {/* ══ RANKINGS TABLE (Placeholder) ══ */}
            <VCT_SectionCard
                title="Lịch sử xếp hạng"
                icon={<VCT_Icons.BarChart2 size={20} />}
                accentColor="#3b82f6"
                className="border border-vct-border"
            >
                <div className="py-8">
                    <VCT_EmptyState
                        icon={<VCT_Icons.BarChart2 size={48} />}
                        title="Biểu đồ xếp hạng"
                        description="Biểu đồ lịch sử xếp hạng ELO qua các mùa giải sẽ được hiển thị tại đây. Tính năng đang được phát triển."
                    />
                </div>
            </VCT_SectionCard>
        </VCT_PageContainer>
    )
}
