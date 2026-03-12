'use client'
import React, { useMemo, useState } from 'react'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_Badge } from '../components/vct-ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile, TournamentEntry } from '@vct/shared-types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE RESULTS (Personal Competition Results)
// Kết quả thi đấu riêng cho VĐV — medal stats, Elo, filters
// ═══════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    du_dieu_kien: { label: 'Hoàn thành', variant: 'success' },
    nhap: { label: 'Nháp', variant: 'neutral' },
    thieu_ho_so: { label: 'Thiếu hồ sơ', variant: 'warning' },
    cho_xac_nhan: { label: 'Chờ duyệt', variant: 'neutral' },
    bi_tu_choi: { label: 'Từ chối', variant: 'danger' },
}

export function Page_athlete_results() {
    const [filterYear, setFilterYear] = useState('all')

    const { data: profile, isLoading: isProfileLoading } = useApiQuery<AthleteProfile>('/api/v1/athlete-profiles/me')
    const { data: entries, isLoading: isEntriesLoading } = useApiQuery<TournamentEntry[]>(
        profile ? `/api/v1/tournament-entries?athleteId=${profile.id}` : ''
    )

    const isLoading = isProfileLoading || isEntriesLoading

    // Derive medal breakdown from profile (mock: split total_medals into gold/silver/bronze)
    const medals = useMemo(() => {
        if (!profile) return { gold: 0, silver: 0, bronze: 0, total: 0 }
        const total = profile.total_medals || 0
        const gold = Math.floor(total * 0.35)
        const silver = Math.floor(total * 0.35)
        const bronze = total - gold - silver
        return { gold, silver, bronze, total }
    }, [profile])

    // Filter entries by year
    const filteredEntries = useMemo(() => {
        if (!entries) return []
        if (filterYear === 'all') return entries
        return entries.filter(e => e.start_date?.startsWith(filterYear) || e.created_at?.startsWith(filterYear))
    }, [entries, filterYear])

    // Available years
    const years = useMemo(() => {
        if (!entries) return []
        const set = new Set<string>()
        entries.forEach(e => {
            const year = (e.start_date || e.created_at || '').substring(0, 4)
            if (year && year.length === 4) set.add(year)
        })
        return Array.from(set).sort().reverse()
    }, [entries])

    if (isLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="space-y-6 animate-pulse">
                    <div className="h-16 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    <div className="h-[300px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
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
                    description="Vui lòng liên kết hồ sơ VĐV trước khi xem kết quả thi đấu."
                />
            </VCT_PageContainer>
        )
    }

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ HEADER ══ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-vct-border">
                        <VCT_Icons.Award size={24} className="text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-vct-text m-0">Kết quả thi đấu</h1>
                        <p className="text-sm text-vct-text-muted mt-0.5">Lịch sử thành tích qua các giải đấu</p>
                    </div>
                </div>
            </div>

            {/* ══ MEDAL BREAKDOWN + ELO ══ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {/* Gold */}
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className="text-3xl font-black text-amber-500">{medals.gold}</div>
                    <div className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mt-0.5">Huy chương Vàng</div>
                </div>
                {/* Silver */}
                <div className="p-4 rounded-2xl border border-slate-400/20 bg-gradient-to-br from-slate-400/5 to-gray-300/5">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="text-3xl font-black text-slate-500">{medals.silver}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Huy chương Bạc</div>
                </div>
                {/* Bronze */}
                <div className="p-4 rounded-2xl border border-orange-700/20 bg-gradient-to-br from-orange-700/5 to-amber-700/5">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="text-3xl font-black text-orange-700">{medals.bronze}</div>
                    <div className="text-[10px] font-bold text-orange-600/70 uppercase tracking-wider mt-0.5">Huy chương Đồng</div>
                </div>
                {/* Total */}
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated">
                    <div className="flex items-center gap-1.5 mb-1">
                        <VCT_Icons.Award size={18} className="text-vct-text-muted" />
                    </div>
                    <div className="text-3xl font-black text-vct-text">{medals.total}</div>
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mt-0.5">Tổng HC</div>
                </div>
                {/* Elo */}
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <VCT_Icons.TrendingUp size={18} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-blue-500">{profile.elo_rating}</div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-0.5">Điểm Elo</div>
                </div>
            </div>

            {/* ══ YEAR FILTER ══ */}
            {years.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setFilterYear('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterYear === 'all' ? 'bg-vct-accent text-white shadow-sm' : 'bg-vct-elevated border border-vct-border text-vct-text-muted hover:text-vct-text'}`}>
                        Tất cả
                    </button>
                    {years.map(y => (
                        <button key={y} onClick={() => setFilterYear(y)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterYear === y ? 'bg-vct-accent text-white shadow-sm' : 'bg-vct-elevated border border-vct-border text-vct-text-muted hover:text-vct-text'}`}>
                            {y}
                        </button>
                    ))}
                </div>
            )}

            {/* ══ RESULTS LIST ══ */}
            <VCT_SectionCard
                title="Lịch sử thi đấu"
                icon={<VCT_Icons.Trophy size={20} />}
                accentColor="#f59e0b"
                className="border border-vct-border"
            >
                {filteredEntries.length === 0 ? (
                    <div className="py-8">
                        <VCT_EmptyState
                            icon={<VCT_Icons.Trophy size={48} />}
                            title="Không có kết quả"
                            description={filterYear !== 'all' ? `Không có giải đấu nào trong năm ${filterYear}.` : 'Bạn chưa có kết quả thi đấu nào.'}
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-vct-border/50">
                        {filteredEntries.map((entry, idx) => {
                            const st = STATUS_LABELS[entry.status] ?? { label: entry.status, variant: 'neutral' as const }
                            return (
                                <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 group px-2 hover:bg-vct-bg/50 rounded-xl transition-colors -mx-2">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-vct-text group-hover:text-amber-500 transition-colors m-0">{entry.tournament_name}</h4>
                                            <div className="text-xs text-vct-text-muted mt-1 flex items-center gap-2">
                                                {entry.start_date && (
                                                    <span className="flex items-center gap-1"><VCT_Icons.Calendar size={11} /> {entry.start_date}</span>
                                                )}
                                                {entry.doan_name && (
                                                    <span className="flex items-center gap-1"><VCT_Icons.Building size={11} /> {entry.doan_name}</span>
                                                )}
                                            </div>
                                            {entry.categories && entry.categories.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {entry.categories.map((c, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-vct-bg border border-vct-border text-[10px] font-medium text-vct-text-muted">{c}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sm:text-right self-start sm:self-center ml-14 sm:ml-0">
                                        <VCT_Badge variant={st.variant}>{st.label}</VCT_Badge>
                                        {entry.weigh_in_result && (
                                            <div className="text-[10px] text-vct-text-muted mt-1">Cân: {entry.weigh_in_result}</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </VCT_SectionCard>

            {/* ══ STATS SUMMARY ══ */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated text-center">
                    <div className="text-2xl font-black text-vct-text">{profile.total_tournaments}</div>
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mt-1">Tổng giải đấu</div>
                </div>
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated text-center">
                    <div className="text-2xl font-black text-emerald-500">{entries?.filter(e => e.status === 'du_dieu_kien').length || 0}</div>
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mt-1">Hoàn thành</div>
                </div>
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated text-center">
                    <div className="text-2xl font-black text-blue-500">{profile.total_clubs}</div>
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mt-1">CLB đại diện</div>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
