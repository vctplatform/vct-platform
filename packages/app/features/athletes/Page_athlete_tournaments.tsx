'use client'
import React, { useState, useMemo } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_PageContainer, VCT_EmptyState, VCT_Badge, VCT_StatRow, VCT_SearchInput } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile, TournamentEntry } from '@vct/shared-types'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE TOURNAMENTS (Enhanced)
// Stats header, search, sort, improved UX
// ═══════════════════════════════════════════════════════════════

type SortKey = 'date' | 'name' | 'status'

export function Page_athlete_tournaments() {
    const router = useRouter()
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<SortKey>('date')

    // Fetch profile
    const { data: profile } = useApiQuery<AthleteProfile>(
        '/api/v1/athlete-profiles/me'
    )

    // Fetch tournaments
    const { data: tournaments, isLoading } = useApiQuery<TournamentEntry[]>(
        profile ? `/api/v1/tournament-entries?athleteId=${profile.id}` : '',
        { enabled: !!profile }
    )

    // Stats
    const stats = useMemo(() => {
        if (!tournaments) return { total: 0, eligible: 0, missing: 0, rejected: 0 }
        return {
            total: tournaments.length,
            eligible: tournaments.filter(t => t.status === 'du_dieu_kien').length,
            missing: tournaments.filter(t => t.status === 'thieu_ho_so').length,
            rejected: tournaments.filter(t => t.status === 'bi_tu_choi').length,
        }
    }, [tournaments])

    // Filter + Search + Sort
    const filtered = useMemo(() => {
        let list = tournaments || []

        // Status filter
        const today: string = new Date().toISOString().split('T')[0]!
        if (filter === 'upcoming') list = list.filter(t => !t.start_date || t.start_date >= today)
        if (filter === 'past') list = list.filter(t => !!t.start_date && t.start_date < today)

        // Search
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(t =>
                t.tournament_name?.toLowerCase().includes(q) ||
                t.doan_name?.toLowerCase().includes(q) ||
                t.categories?.some(c => c.toLowerCase().includes(q))
            )
        }

        // Sort
        list = [...list].sort((a, b) => {
            if (sortBy === 'name') return (a.tournament_name || '').localeCompare(b.tournament_name || '')
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '')
            // default: date desc
            return (b.start_date || '').localeCompare(a.start_date || '')
        })

        return list
    }, [tournaments, filter, search, sortBy])

    if (isLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                    <div className="h-10 w-48 bg-vct-border rounded-xl"></div>
                    <div className="h-10 w-full md:w-64 bg-vct-border rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 gap-4 animate-pulse">
                    <div className="h-48 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    <div className="h-48 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                </div>
            </VCT_PageContainer>
        )
    }

    const filters = [
        { v: 'all', l: 'Tất cả giải đấu', icon: <VCT_Icons.Trophy size={16} /> },
        { v: 'upcoming', l: 'Sắp tham gia', icon: <VCT_Icons.Calendar size={16} /> },
        { v: 'past', l: 'Đã kết thúc', icon: <VCT_Icons.CheckCircle size={16} /> }
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="rounded-xl border border-vct-border p-2.5 text-vct-text-muted hover:bg-vct-input hover:text-vct-text hover:border-vct-border-strong transition-all bg-vct-bg">
                        <VCT_Icons.ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="m-0 text-3xl font-black text-vct-text">Giải đấu của bạn</h1>
                        <p className="text-sm text-vct-text-muted mt-1">Theo dõi quá trình thi đấu và trạng thái hồ sơ</p>
                    </div>
                </div>
            </div>

            {/* ── Stats Header ─────────────────────────── */}
            <VCT_StatRow items={[
                { label: 'Tổng giải', value: stats.total, icon: <VCT_Icons.Trophy size={18} />, color: 'var(--vct-info)' },
                { label: 'Hồ sơ hợp lệ', value: stats.eligible, icon: <VCT_Icons.CheckCircle size={18} />, color: 'var(--vct-success)' },
                { label: 'Thiếu hồ sơ', value: stats.missing, icon: <VCT_Icons.Info size={18} />, color: 'var(--vct-warning)' },
                { label: 'Bị từ chối', value: stats.rejected, icon: <VCT_Icons.X size={18} />, color: 'var(--vct-danger)' },
            ] as StatItem[]} className="mb-6" />

            {/* ── Toolbar: Tabs + Search + Sort ─────────── */}
            <div className="mb-6 flex flex-col lg:flex-row gap-4">
                {/* Filter tabs */}
                <div className="flex p-1.5 bg-vct-bg rounded-2xl border border-vct-border w-full lg:w-auto shadow-sm">
                    {filters.map(f => (
                        <button
                            key={f.v}
                            onClick={() => setFilter(f.v as 'all' | 'upcoming' | 'past')}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all ${filter === f.v
                                ? 'bg-vct-elevated text-vct-accent shadow border border-vct-border'
                                : 'text-vct-text-muted hover:text-vct-text hover:bg-vct-input/50 border border-transparent'
                                }`}
                        >
                            {f.icon}
                            {f.l}
                            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-vct-accent/10 text-[10px] leading-none">
                                {f.v === 'all' ? (tournaments?.length || 0)
                                    : f.v === 'upcoming' ? (tournaments?.filter(t => !t.start_date || t.start_date >= new Date().toISOString().split('T')[0]!).length || 0)
                                        : (tournaments?.filter(t => !!t.start_date && t.start_date < new Date().toISOString().split('T')[0]!).length || 0)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search + Sort */}
                <div className="flex gap-3 flex-1">
                    <div className="flex-1 max-w-sm">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm giải đấu..." />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                        className="px-3 py-2 rounded-xl bg-vct-bg border border-vct-border text-xs font-semibold text-vct-text-muted focus:border-vct-accent outline-none transition-all">
                        <option value="date">Sắp xếp: Ngày</option>
                        <option value="name">Sắp xếp: Tên</option>
                        <option value="status">Sắp xếp: Trạng thái</option>
                    </select>
                </div>
            </div>

            {/* ── Tournament Cards ──────────────────────── */}
            {!filtered || filtered.length === 0 ? (
                <div className="py-12">
                    <VCT_EmptyState
                        icon={<VCT_Icons.Trophy size={64} className="text-(--vct-info)/50" />}
                        title="Chưa có dữ liệu giải đấu"
                        description={search ? `Không tìm thấy giải đấu nào với từ khóa "${search}".` : filter === 'all' ? "Bạn chưa tham gia giải đấu nào trong hệ thống VCT." : "Không tìm thấy giải đấu nào phù hợp với bộ lọc."}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {filtered.map(t => {
                        const docs = [
                            { l: 'Khám sức khỏe', ok: t.ho_so.kham_sk },
                            { l: 'Bảo hiểm y tế', ok: t.ho_so.bao_hiem },
                            { l: 'CCCD/CMND', ok: t.ho_so.cmnd },
                            { l: 'Ảnh thẻ', ok: t.ho_so.anh },
                        ]
                        const okCount = docs.filter(d => d.ok).length
                        const progressPercent = (okCount / docs.length) * 100
                        const isComplete = okCount === docs.length

                        return (
                            <div key={t.id} className="rounded-3xl border border-vct-border bg-vct-elevated overflow-hidden group hover:border-(--vct-info)/30 hover:shadow-md transition-all duration-300">
                                <div className="p-6 md:flex md:items-start md:justify-between gap-8">
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                            <h3 className="text-xl font-black text-vct-text group-hover:text-(--vct-info) transition-colors">{t.tournament_name}</h3>
                                            <div className="self-start sm:self-center">
                                                <VCT_Badge variant={t.status === 'du_dieu_kien' ? 'success' : t.status === 'thieu_ho_so' ? 'warning' : 'neutral'}>
                                                    {t.status === 'du_dieu_kien' ? 'Hồ sơ Hợp lệ' : t.status === 'thieu_ho_so' ? 'Thiếu Hồ sơ' : t.status}
                                                </VCT_Badge>
                                            </div>
                                        </div>

                                        <div className="text-sm text-vct-text-muted flex flex-wrap gap-x-6 gap-y-3 mt-4">
                                            <span className="flex items-center gap-2 bg-vct-bg px-3 py-1.5 rounded-lg border border-vct-border">
                                                <VCT_Icons.Building size={16} className="text-vct-text-muted" />
                                                <span>Đại diện: <strong className="text-vct-text">{t.doan_name}</strong></span>
                                            </span>
                                            <span className="flex items-center gap-2 bg-vct-bg px-3 py-1.5 rounded-lg border border-vct-border">
                                                <VCT_Icons.Calendar size={16} className="text-vct-text-muted" />
                                                <span>Khởi tranh: <strong className="text-vct-text">{t.start_date || 'Chưa công bố'}</strong></span>
                                            </span>
                                        </div>

                                        <div className="mt-6">
                                            <div className="text-xs font-bold text-vct-text-muted uppercase tracking-wider mb-3">Nội dung đăng ký</div>
                                            <div className="flex flex-wrap gap-2">
                                                {t.categories?.map((c, i) => (
                                                    <div key={i} className="px-3 py-1.5 rounded-lg bg-(--vct-info)/10 border border-(--vct-info)/20 text-xs font-bold text-(--vct-info)">
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 md:mt-0 md:pl-8 md:border-l border-vct-border md:w-80 flex-shrink-0">
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="text-xs font-bold text-vct-text-muted uppercase tracking-wider">Tiến độ Hồ sơ</div>
                                            <div className={`text-sm font-black ${isComplete ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {okCount}/{docs.length}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-vct-bg rounded-full overflow-hidden border border-vct-border mb-4">
                                            <div
                                                className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>

                                        <div className="space-y-2.5 mb-6">
                                            {docs.map(h => (
                                                <div key={h.l} className="flex justify-between items-center text-sm p-2 rounded-lg bg-vct-bg border border-vct-border">
                                                    <span className="text-vct-text-muted">{h.l}</span>
                                                    {h.ok ? (
                                                        <span className="bg-emerald-500/10 text-emerald-500 p-1 rounded-md"><VCT_Icons.Check size={14} /></span>
                                                    ) : (
                                                        <span className="bg-red-500/10 text-red-500 p-1 rounded-md"><VCT_Icons.X size={14} /></span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {!isComplete && (
                                            <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-vct-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-vct-accent-hover transition-colors shadow-sm">
                                                <VCT_Icons.Upload size={16} /> Bổ sung hồ sơ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
