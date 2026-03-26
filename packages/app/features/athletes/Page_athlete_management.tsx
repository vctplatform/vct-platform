'use client'
import React, { useState, useMemo } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_Image } from '@vct/ui'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_Badge, VCT_SearchInput, VCT_Modal } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile, AthleteStats } from '@vct/shared-types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE MANAGEMENT (Admin / BTC)
// Full CRUD, stats dashboard, search, filter, export, detail modal
// ═══════════════════════════════════════════════════════════════

const BELT_LABELS: Record<string, string> = {
    none: 'Chưa có', yellow: 'Đai vàng', green: 'Đai xanh', blue: 'Đai lam',
    red: 'Đai đỏ', so_dang: 'Sơ đẳng', nhat_dang: 'Nhất đẳng', nhi_dang: 'Nhị đẳng',
    tam_dang: 'Tam đẳng', tu_dang: 'Tứ đẳng', ngu_dang: 'Ngũ đẳng',
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    active: { label: 'Hoạt động', variant: 'success' },
    draft: { label: 'Nháp', variant: 'warning' },
    inactive: { label: 'Ngừng', variant: 'danger' },
}

const BELT_COLORS: Record<string, string> = {
    none: 'var(--vct-text-tertiary)', yellow: 'var(--vct-gold)', green: 'var(--vct-success)', blue: 'var(--vct-info)',
    red: 'var(--vct-danger)', so_dang: 'var(--vct-bg-input)', nhat_dang: 'var(--vct-bg-input)', nhi_dang: 'var(--vct-bg-input)',
    tam_dang: 'var(--vct-bg-input)', tu_dang: 'var(--vct-bg-input)', ngu_dang: 'var(--vct-bg-input)',
}

type SortKey = 'full_name' | 'belt_rank' | 'elo_rating' | 'total_medals' | 'total_tournaments'
type SortDir = 'asc' | 'desc'
type FilterGender = 'all' | 'nam' | 'nu'
type FilterStatus = 'all' | 'active' | 'draft' | 'inactive'

const BELT_ORDER = ['none', 'yellow', 'green', 'blue', 'red', 'so_dang', 'nhat_dang', 'nhi_dang', 'tam_dang', 'tu_dang', 'ngu_dang']

function calcAge(dob: string) {
    if (!dob) return 0
    return new Date().getFullYear() - parseInt(dob.substring(0, 4))
}

/* ── Stats Dashboard Cards ─────────────────────────────────── */

function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) {
    return (
        <div className="p-5 rounded-2xl border border-vct-border bg-vct-elevated hover:border-opacity-50 transition-all group"
            style={{ borderColor: `${color}30` }}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, color }}>
                    {icon}
                </div>
                <span className="text-xs font-medium text-vct-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-3xl font-black text-vct-text group-hover:scale-105 transition-transform origin-left">{value}</div>
            {sub && <div className="text-xs text-vct-text-muted mt-1">{sub}</div>}
        </div>
    )
}

/* ── Sort Header ───────────────────────────────────────────── */

function SortHeader({ label, sortKey, currentSort, currentDir, onSort }: {
    label: string; sortKey: SortKey; currentSort: SortKey; currentDir: SortDir
    onSort: (key: SortKey) => void
}) {
    const active = currentSort === sortKey
    return (
        <button onClick={() => onSort(sortKey)}
            className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${active ? 'text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}>
            {label}
            {active && (currentDir === 'asc' ? <VCT_Icons.Chevron size={12} style={{ transform: 'rotate(-90deg)' }} /> : <VCT_Icons.ExpandMore size={12} />)}
        </button>
    )
}

/* ── Detail Modal Content ──────────────────────────────────── */

function AthleteDetailView({ athlete }: { athlete: AthleteProfile }) {
    const hoSoItems = [
        { key: 'kham_sk', label: 'Giấy khám SK', done: athlete.ho_so.kham_sk },
        { key: 'bao_hiem', label: 'Bảo hiểm y tế', done: athlete.ho_so.bao_hiem },
        { key: 'anh', label: 'Ảnh 3x4', done: athlete.ho_so.anh },
        { key: 'cmnd', label: 'CCCD/Định danh', done: athlete.ho_so.cmnd },
    ]
    const hoSoComplete = hoSoItems.filter(h => h.done).length
    const hoSoPct = Math.round((hoSoComplete / hoSoItems.length) * 100)

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-vct-border flex items-center justify-center text-4xl flex-shrink-0">
                    {athlete.photo_url ? <VCT_Image src={athlete.photo_url} className="w-full h-full rounded-2xl" fill objectFit="cover" alt="avatar" sizes="80px" /> : '🥋'}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-vct-text m-0">{athlete.full_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <VCT_Badge variant={STATUS_MAP[athlete.status]?.variant || 'neutral'}>
                            {STATUS_MAP[athlete.status]?.label || athlete.status}
                        </VCT_Badge>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                            style={{ background: `${BELT_COLORS[athlete.belt_rank]}15`, color: BELT_COLORS[athlete.belt_rank], borderColor: `${BELT_COLORS[athlete.belt_rank]}30` }}>
                            <VCT_Icons.Award size={12} /> {athlete.belt_label || BELT_LABELS[athlete.belt_rank]}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <VCT_Icons.TrendingUp size={12} /> Elo: {athlete.elo_rating}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { icon: <VCT_Icons.Calendar size={14} />, label: 'Ngày sinh', value: athlete.date_of_birth ? `${athlete.date_of_birth} (${calcAge(athlete.date_of_birth)} tuổi)` : '—' },
                    { icon: <VCT_Icons.User size={14} />, label: 'Giới tính', value: athlete.gender === 'nam' ? 'Nam' : 'Nữ' },
                    { icon: <VCT_Icons.Activity size={14} />, label: 'Cân nặng / Chiều cao', value: `${athlete.weight}kg / ${athlete.height}cm` },
                    { icon: <VCT_Icons.Phone size={14} />, label: 'SĐT', value: athlete.phone || '—' },
                    { icon: <VCT_Icons.Mail size={14} />, label: 'Email', value: athlete.email || '—' },
                    { icon: <VCT_Icons.MapPin size={14} />, label: 'Tỉnh/TP', value: athlete.province || '—' },
                    { icon: <VCT_Icons.Home size={14} />, label: 'Địa chỉ', value: athlete.address || '—' },
                    { icon: <VCT_Icons.FileText size={14} />, label: 'CMND/CCCD', value: athlete.id_number || '—' },
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-vct-bg border border-vct-border">
                        <div className="text-vct-text-muted mt-0.5 flex-shrink-0">{item.icon}</div>
                        <div>
                            <div className="text-[10px] text-vct-text-muted uppercase tracking-wider font-medium">{item.label}</div>
                            <div className="text-xs font-bold text-vct-text mt-0.5">{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: <VCT_Icons.Building size={16} />, value: athlete.total_clubs, label: 'CLB', color: 'var(--vct-info)' },
                    { icon: <VCT_Icons.Trophy size={16} />, value: athlete.total_tournaments, label: 'Giải đấu', color: 'var(--vct-info)' },
                    { icon: <VCT_Icons.Award size={16} />, value: athlete.total_medals, label: 'Huy chương', color: 'var(--vct-warning)' },
                ].map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-vct-border text-center bg-vct-bg">
                        <div className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        <div className="text-xl font-black text-vct-text">{s.value}</div>
                        <div className="text-[10px] text-vct-text-muted uppercase tracking-wider mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Hồ sơ Checklist */}
            <div className="p-4 rounded-xl border border-vct-border bg-vct-bg">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-vct-text uppercase tracking-wider">Hồ sơ</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hoSoPct === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {hoSoComplete}/{hoSoItems.length} ({hoSoPct}%)
                    </span>
                </div>
                <div className="h-1.5 bg-vct-border rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${hoSoPct}%`, background: hoSoPct === 100 ? 'var(--vct-success)' : 'var(--vct-warning)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {hoSoItems.map(h => (
                        <div key={h.key} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${h.done ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                            {h.done ? <VCT_Icons.CheckCircle size={14} /> : <VCT_Icons.MinusCircle size={14} />}
                            <span className="font-medium">{h.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Belt History */}
            {athlete.belt_history && athlete.belt_history.length > 0 && (
                <div className="p-4 rounded-xl border border-vct-border bg-vct-bg">
                    <div className="text-xs font-bold text-vct-text uppercase tracking-wider mb-3">Lịch sử thăng đai</div>
                    <div className="relative pl-6">
                        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-(--vct-gold) to-(--vct-bg-input) rounded-full" />
                        <div className="space-y-2.5">
                            {athlete.belt_history.map((b, i) => (
                                <div key={i} className="relative flex items-center gap-3">
                                    <div className="absolute -left-6 w-3 h-3 rounded-full border-2 border-vct-elevated z-10 bg-amber-500 flex-shrink-0" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-xs font-bold text-vct-text">{b.belt}</span>
                                        <span className="text-[10px] font-mono text-vct-text-muted">{b.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Main Component ────────────────────────────────────────── */

export function Page_athlete_management() {
    const [search, setSearch] = useState('')
    const [filterGender, setFilterGender] = useState<FilterGender>('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [filterBelt, setFilterBelt] = useState('all')
    const [sortKey, setSortKey] = useState<SortKey>('full_name')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    // Fetch
    const { data: athletes, isLoading: isLoadingAthletes } = useApiQuery<AthleteProfile[]>('/api/v1/athlete-profiles')
    const { data: stats } = useApiQuery<AthleteStats>('/api/v1/athlete-profiles/stats')

    // Filtering & sorting
    const filtered = useMemo(() => {
        if (!athletes) return []
        let list = [...athletes]

        // Search
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(a =>
                a.full_name.toLowerCase().includes(q) ||
                (a.email || '').toLowerCase().includes(q) ||
                (a.phone || '').toLowerCase().includes(q) ||
                (a.province || '').toLowerCase().includes(q)
            )
        }

        // Filters
        if (filterGender !== 'all') list = list.filter(a => a.gender === filterGender)
        if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
        if (filterBelt !== 'all') list = list.filter(a => a.belt_rank === filterBelt)

        // Sort
        list.sort((a, b) => {
            let cmp = 0
            switch (sortKey) {
                case 'full_name': cmp = a.full_name.localeCompare(b.full_name); break
                case 'belt_rank': cmp = BELT_ORDER.indexOf(a.belt_rank) - BELT_ORDER.indexOf(b.belt_rank); break
                case 'elo_rating': cmp = a.elo_rating - b.elo_rating; break
                case 'total_medals': cmp = a.total_medals - b.total_medals; break
                case 'total_tournaments': cmp = a.total_tournaments - b.total_tournaments; break
            }
            return sortDir === 'asc' ? cmp : -cmp
        })

        return list
    }, [athletes, search, filterGender, filterStatus, filterBelt, sortKey, sortDir])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const handleExportCSV = () => {
        if (!filtered.length) return
        const rows = filtered.map(a => ({
            'Họ tên': a.full_name,
            'Giới tính': a.gender === 'nam' ? 'Nam' : 'Nữ',
            'Ngày sinh': a.date_of_birth,
            'Cân nặng': a.weight,
            'Chiều cao': a.height,
            'Đẳng đai': a.belt_label || BELT_LABELS[a.belt_rank],
            'Elo': a.elo_rating,
            'Huy chương': a.total_medals,
            'Giải đấu': a.total_tournaments,
            'Tỉnh/TP': a.province || '',
            'SĐT': a.phone || '',
            'Email': a.email || '',
            'Trạng thái': STATUS_MAP[a.status]?.label || a.status,
        }))
        const header = Object.keys(rows[0]!).join(',')
        const body = rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
        const csv = header + '\n' + body
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `vdv_export_${new Date().toISOString().slice(0, 10)}.csv`
        a.click(); URL.revokeObjectURL(url)
    }

    const activeFilters = [filterGender !== 'all', filterStatus !== 'all', filterBelt !== 'all'].filter(Boolean).length

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ STATS DASHBOARD ══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<VCT_Icons.Users size={20} />} label="Tổng VĐV" value={stats?.total ?? '—'} color="var(--vct-info)"
                    sub={stats ? `${stats.by_gender?.['nam'] ?? 0} nam · ${stats.by_gender?.['nu'] ?? 0} nữ` : undefined} />
                <StatCard icon={<VCT_Icons.Award size={20} />} label="Huy chương" value={stats?.total_medals ?? '—'} color="var(--vct-warning)" />
                <StatCard icon={<VCT_Icons.TrendingUp size={20} />} label="Elo TB" value={stats?.avg_elo ?? '—'} color="var(--vct-info)" />
                <StatCard icon={<VCT_Icons.CheckCircle size={20} />} label="Hoạt động" value={stats?.by_status?.['active'] ?? '—'} color="var(--vct-success)"
                    sub={stats?.by_status?.['draft'] ? `${stats.by_status['draft']} nháp` : undefined} />
            </div>

            {/* ══ BELT DISTRIBUTION ══ */}
            {stats?.by_belt_rank && Object.keys(stats.by_belt_rank).length > 0 && (
                <VCT_SectionCard title="Phân bố Đẳng đai" icon={<VCT_Icons.BarChart2 size={18} />} accentColor="var(--vct-warning)" className="mb-6 border border-vct-border">
                    <div className="flex items-end gap-2 h-24">
                        {BELT_ORDER.filter(b => stats.by_belt_rank[b]).map(belt => {
                            const count = stats.by_belt_rank[belt] || 0
                            const maxCount = Math.max(...Object.values(stats.by_belt_rank))
                            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                            return (
                                <div key={belt} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-bold text-vct-text">{count}</span>
                                    <div className="w-full rounded-t-lg transition-all duration-500"
                                        style={{ height: `${Math.max(pct, 8)}%`, background: BELT_COLORS[belt] || 'var(--vct-text-tertiary)', minHeight: '6px' }} />
                                    <span className="text-[8px] text-vct-text-muted font-medium text-center leading-tight truncate w-full">
                                        {BELT_LABELS[belt]?.replace('Đai ', '') || belt}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </VCT_SectionCard>
            )}

            {/* ══ TOOLBAR ══ */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
                <div className="flex-1">
                    <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, email, SĐT, tỉnh…" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${showFilters ? 'bg-vct-accent/10 border-vct-accent/30 text-vct-accent' : 'bg-vct-elevated border-vct-border text-vct-text-muted hover:text-vct-text hover:border-vct-border-strong'}`}>
                        <VCT_Icons.Layers size={14} />
                        Bộ lọc
                        {activeFilters > 0 && (
                            <span className="ml-1 w-5 h-5 rounded-full bg-vct-accent text-white text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>
                        )}
                    </button>
                    <button onClick={handleExportCSV} disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-vct-border bg-vct-elevated text-xs font-bold text-vct-text-muted hover:text-vct-text hover:border-vct-border-strong transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <VCT_Icons.Download size={14} /> Xuất CSV
                    </button>
                </div>
            </div>

            {/* ══ FILTERS ══ */}
            {showFilters && (
                <div className="mb-4 p-4 rounded-2xl border border-vct-border bg-vct-elevated animate-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1.5 block">Giới tính</label>
                            <div className="flex gap-1.5">
                                {[{ v: 'all', l: 'Tất cả' }, { v: 'nam', l: 'Nam' }, { v: 'nu', l: 'Nữ' }].map(f => (
                                    <button key={f.v} onClick={() => setFilterGender(f.v as FilterGender)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterGender === f.v ? 'bg-vct-accent text-white shadow-sm' : 'bg-vct-bg border border-vct-border text-vct-text-muted hover:text-vct-text'}`}>
                                        {f.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1.5 block">Trạng thái</label>
                            <div className="flex gap-1.5">
                                {[{ v: 'all', l: 'Tất cả' }, { v: 'active', l: 'Hoạt động' }, { v: 'draft', l: 'Nháp' }, { v: 'inactive', l: 'Ngừng' }].map(f => (
                                    <button key={f.v} onClick={() => setFilterStatus(f.v as FilterStatus)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === f.v ? 'bg-vct-accent text-white shadow-sm' : 'bg-vct-bg border border-vct-border text-vct-text-muted hover:text-vct-text'}`}>
                                        {f.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1.5 block">Đẳng đai</label>
                            <select value={filterBelt} onChange={e => setFilterBelt(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-vct-bg border border-vct-border text-vct-text focus:border-vct-accent outline-none">
                                <option value="all">Tất cả</option>
                                {BELT_ORDER.map(b => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                            </select>
                        </div>
                    </div>
                    {activeFilters > 0 && (
                        <button onClick={() => { setFilterGender('all'); setFilterStatus('all'); setFilterBelt('all') }}
                            className="mt-3 text-xs text-vct-accent font-bold hover:underline">
                            ✕ Xóa tất cả bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* ══ RESULTS COUNT ══ */}
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs text-vct-text-muted">
                    {isLoadingAthletes ? 'Đang tải...' : `${filtered.length} vận động viên`}
                    {search && ` cho "${search}"`}
                </span>
            </div>

            {/* ══ DATA TABLE ══ */}
            <VCT_SectionCard className="border border-vct-border overflow-hidden !p-0">
                {isLoadingAthletes ? (
                    <div className="p-8 space-y-3 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-vct-bg rounded-xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16">
                        <VCT_EmptyState icon={<VCT_Icons.Users size={48} />} title="Không tìm thấy VĐV"
                            description={search ? `Không có kết quả cho "${search}". Thử từ khóa khác.` : 'Chưa có VĐV nào trong hệ thống.'} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-vct-border bg-vct-bg/50">
                                    <th className="text-left px-4 py-3"><SortHeader label="VĐV" sortKey="full_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell"><SortHeader label="Đẳng đai" sortKey="belt_rank" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                                    <th className="text-center px-4 py-3 hidden lg:table-cell"><SortHeader label="Elo" sortKey="elo_rating" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                                    <th className="text-center px-4 py-3 hidden lg:table-cell"><SortHeader label="HC" sortKey="total_medals" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                                    <th className="text-center px-4 py-3 hidden md:table-cell"><SortHeader label="Giải" sortKey="total_tournaments" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} /></th>
                                    <th className="text-center px-4 py-3 hidden sm:table-cell"><span className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider">Trạng thái</span></th>
                                    <th className="text-center px-4 py-3 hidden lg:table-cell"><span className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider">Hồ sơ</span></th>
                                    <th className="text-right px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vct-border/50">
                                {filtered.map(a => {
                                    const hoSoCount = [a.ho_so.kham_sk, a.ho_so.bao_hiem, a.ho_so.anh, a.ho_so.cmnd].filter(Boolean).length
                                    return (
                                        <tr key={a.id} className="hover:bg-vct-bg/50 transition-colors cursor-pointer group" onClick={() => setSelectedAthlete(a)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-vct-border flex items-center justify-center text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        {a.photo_url ? <VCT_Image src={a.photo_url} className="w-full h-full rounded-xl" fill objectFit="cover" alt="" sizes="36px" /> : '🥋'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-vct-text text-sm group-hover:text-vct-accent transition-colors">{a.full_name}</div>
                                                        <div className="text-[11px] text-vct-text-muted mt-0.5">
                                                            {a.gender === 'nam' ? '♂ Nam' : '♀ Nữ'} · {calcAge(a.date_of_birth)} tuổi
                                                            {a.province && <> · {a.province}</>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                                    style={{ background: `${BELT_COLORS[a.belt_rank]}10`, color: BELT_COLORS[a.belt_rank], borderColor: `${BELT_COLORS[a.belt_rank]}25` }}>
                                                    <div className="w-2 h-2 rounded-full" style={{ background: BELT_COLORS[a.belt_rank] }} />
                                                    {a.belt_label || BELT_LABELS[a.belt_rank]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                <span className="font-bold text-sm text-vct-text">{a.elo_rating}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                <span className={`font-bold text-sm ${a.total_medals > 0 ? 'text-amber-500' : 'text-vct-text-muted'}`}>
                                                    {a.total_medals > 0 && '🏅'} {a.total_medals}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden md:table-cell">
                                                <span className="text-sm text-vct-text">{a.total_tournaments}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <VCT_Badge variant={STATUS_MAP[a.status]?.variant || 'neutral'}>
                                                    {STATUS_MAP[a.status]?.label || a.status}
                                                </VCT_Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${hoSoCount === 4 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {hoSoCount}/4
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="p-2 rounded-lg hover:bg-vct-bg transition-colors text-vct-text-muted hover:text-vct-text"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedAthlete(a) }}>
                                                    <VCT_Icons.Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </VCT_SectionCard>

            {/* ══ DETAIL MODAL ══ */}
            {selectedAthlete && (
                <VCT_Modal isOpen={!!selectedAthlete} onClose={() => setSelectedAthlete(null)} title={`Hồ sơ VĐV — ${selectedAthlete.full_name}`} width="700px">
                    <AthleteDetailView athlete={selectedAthlete} />
                </VCT_Modal>
            )}
        </VCT_PageContainer>
    )
}
