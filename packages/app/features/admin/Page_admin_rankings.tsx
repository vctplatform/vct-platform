'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Select, VCT_Tabs,
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface RankedAthlete {
    id: string; rank: number; name: string; province: string; club: string
    elo: number; elo_change: number; wins: number; losses: number
    belt: string; weight_class: string; tournaments: number
}

interface BeltExam {
    id: string; name: string; date: string; location: string
    target_belt: string; candidates: number; passed: number
    status: 'upcoming' | 'in_progress' | 'completed'
}

const BELT_BADGE: Record<string, string> = {
    'Đen Tam Đẳng': 'neutral', 'Đen Nhị Đẳng': 'neutral', 'Đen Nhất Đẳng': 'neutral',
    'Nâu': 'warning', 'Xanh': 'info', 'Vàng': 'warning', 'Trắng': 'neutral',
}

const MOCK_RANKINGS: RankedAthlete[] = [
    { id: 'ATH-001', rank: 1, name: 'Nguyễn Văn An', province: 'Bình Định', club: 'CLB VCT Bình Định', elo: 2150, elo_change: 25, wins: 45, losses: 5, belt: 'Đen Nhất Đẳng', weight_class: '60kg', tournaments: 28 },
    { id: 'ATH-010', rank: 2, name: 'Trần Quốc Hùng', province: 'TP.HCM', club: 'CLB VCT Phú Thọ', elo: 2080, elo_change: -12, wins: 38, losses: 8, belt: 'Đen Nhất Đẳng', weight_class: '60kg', tournaments: 25 },
    { id: 'ATH-011', rank: 3, name: 'Lê Đức Phong', province: 'Hà Nội', club: 'CLB VCT Thanh Xuân', elo: 2020, elo_change: 18, wins: 35, losses: 10, belt: 'Nâu', weight_class: '60kg', tournaments: 22 },
    { id: 'ATH-012', rank: 4, name: 'Phạm Minh Tuấn', province: 'Đà Nẵng', club: 'CLB VCT Sơn Trà', elo: 1980, elo_change: 5, wins: 30, losses: 12, belt: 'Nâu', weight_class: '60kg', tournaments: 20 },
    { id: 'ATH-013', rank: 5, name: 'Võ Thanh Long', province: 'Bình Định', club: 'CLB VCT Quy Nhơn', elo: 1950, elo_change: -8, wins: 28, losses: 14, belt: 'Nâu', weight_class: '60kg', tournaments: 18 },
    { id: 'ATH-014', rank: 6, name: 'Hoàng Đình Khoa', province: 'Huế', club: 'CLB VCT Huế', elo: 1920, elo_change: 32, wins: 25, losses: 15, belt: 'Xanh', weight_class: '60kg', tournaments: 16 },
    { id: 'ATH-015', rank: 7, name: 'Ngô Minh Trí', province: 'Cần Thơ', club: 'CLB VCT Cần Thơ', elo: 1890, elo_change: -3, wins: 22, losses: 12, belt: 'Xanh', weight_class: '60kg', tournaments: 14 },
    { id: 'ATH-002', rank: 8, name: 'Trần Thị Bình', province: 'TP.HCM', club: 'CLB VCT TP.HCM', elo: 1850, elo_change: 15, wins: 20, losses: 8, belt: 'Nâu', weight_class: '48kg', tournaments: 12 },
]

const MOCK_EXAMS: BeltExam[] = [
    { id: 'EX-001', name: 'Kỳ thi Đai Đen Nhất Đẳng Q2/2024', date: '2024-07-15', location: 'Bình Định', target_belt: 'Đen Nhất Đẳng', candidates: 35, passed: 0, status: 'upcoming' },
    { id: 'EX-002', name: 'Kỳ thi Đai Nâu Q2/2024', date: '2024-06-20', location: 'TP.HCM', target_belt: 'Nâu', candidates: 50, passed: 38, status: 'completed' },
    { id: 'EX-003', name: 'Kỳ thi Đai Xanh Q2/2024', date: '2024-06-25', location: 'Hà Nội', target_belt: 'Xanh', candidates: 80, passed: 0, status: 'in_progress' },
    { id: 'EX-004', name: 'Kỳ thi Đai Đen Nhị Đẳng 2024', date: '2024-09-10', location: 'Đà Nẵng', target_belt: 'Đen Nhị Đẳng', candidates: 15, passed: 0, status: 'upcoming' },
]

const EXAM_STATUS_BADGE: Record<string, { label: string; type: string }> = {
    upcoming: { label: 'Sắp tới', type: 'neutral' },
    in_progress: { label: 'Đang diễn ra', type: 'warning' },
    completed: { label: 'Hoàn thành', type: 'success' },
}



// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_rankings = () => (
    <AdminGuard>
        <Page_admin_rankings_Content />
    </AdminGuard>
)

const Page_admin_rankings_Content = () => {
    const { t } = useI18n()
    const { data: fetchedRankings, isLoading } = useAdminFetch<RankedAthlete[]>('/admin/rankings', { mockData: MOCK_RANKINGS })
    const [tab, setTab] = useState<'rankings' | 'exams'>('rankings')
    const [search, setSearch] = useState('')
    const [filterWeight, setFilterWeight] = useState('all')
    const [selected, setSelected] = useState<RankedAthlete | null>(null)
    const { showToast } = useShellToast()

    const _rankings = fetchedRankings ?? MOCK_RANKINGS

    const [sortColRankings, setSortColRankings] = useState('rank')
    const [sortDirRankings, setSortDirRankings] = useState<'asc' | 'desc'>('asc')
    
    const [sortColExams, setSortColExams] = useState('date')
    const [sortDirExams, setSortDirExams] = useState<'asc' | 'desc'>('desc')

    const filteredRankings = useMemo(() => {
        let data = _rankings.filter(a => {
            const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.club.toLowerCase().includes(search.toLowerCase())
            const matchWeight = filterWeight === 'all' || a.weight_class === filterWeight
            return matchSearch && matchWeight
        })

        data = [...data].sort((a, b) => {
            const valA = String((a as any)[sortColRankings] || '').toLowerCase()
            const valB = String((b as any)[sortColRankings] || '').toLowerCase()
            if (['rank', 'elo', 'elo_change', 'wins', 'losses', 'tournaments'].includes(sortColRankings)) {
                return sortDirRankings === 'asc' ? Number(a[sortColRankings as keyof RankedAthlete]) - Number(b[sortColRankings as keyof RankedAthlete]) : Number(b[sortColRankings as keyof RankedAthlete]) - Number(a[sortColRankings as keyof RankedAthlete])
            }
            return sortDirRankings === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return data
    }, [_rankings, search, filterWeight, sortColRankings, sortDirRankings])

    const filteredExams = useMemo(() => {
        return [...MOCK_EXAMS].sort((a, b) => {
            const valA = String((a as any)[sortColExams] || '').toLowerCase()
            const valB = String((b as any)[sortColExams] || '').toLowerCase()
            if (['candidates', 'passed'].includes(sortColExams)) {
                return sortDirExams === 'asc' ? Number(a[sortColExams as keyof BeltExam]) - Number(b[sortColExams as keyof BeltExam]) : Number(b[sortColExams as keyof BeltExam]) - Number(a[sortColExams as keyof BeltExam])
            }
            return sortDirExams === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })
    }, [sortColExams, sortDirExams])

    const handleSortRankings = (key: string) => {
        if (sortColRankings === key) setSortDirRankings(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColRankings(key); setSortDirRankings('asc') }
    }

    const handleSortExams = (key: string) => {
        if (sortColExams === key) setSortDirExams(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColExams(key); setSortDirExams('asc') }
    }

    const weightClasses = Array.from(new Set(MOCK_RANKINGS.map(a => a.weight_class)))
    const topElo = MOCK_RANKINGS[0]?.elo ?? 0

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Trophy size={20} />, label: 'VĐV xếp hạng', value: MOCK_RANKINGS.length, color: 'var(--vct-warning)' },
        { icon: <VCT_Icons.Activity size={20} />, label: 'ELO cao nhất', value: topElo, color: 'var(--vct-danger)' },
        { icon: <VCT_Icons.Award size={20} />, label: 'Kỳ thi thăng cấp', value: MOCK_EXAMS.length, color: 'var(--vct-info)' },
        { icon: <VCT_Icons.Users size={20} />, label: 'Thí sinh kỳ thi', value: MOCK_EXAMS.reduce((a, e) => a + e.candidates, 0), color: 'var(--vct-accent-cyan)' },
    ]

    const tabItems = [
        { value: 'rankings', label: `Bảng xếp hạng (${MOCK_RANKINGS.length})` },
        { value: 'exams', label: `Kỳ thi thăng cấp (${MOCK_EXAMS.length})` },
    ]

    return (
        <AdminPageShell
            title={t('admin.rankings.title')}
            subtitle={t('admin.rankings.subtitle')}
            icon={<VCT_Icons.Trophy size={28} className="text-(--vct-warning)" />}
            stats={stats}
        >
            <VCT_Tabs tabs={tabItems} activeTab={tab} onChange={v => setTab(v as typeof tab)} className="mb-6" />

            {/* ── TAB: Rankings ── */}
            {tab === 'rankings' && (
                <>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm VĐV..." className="flex-1 min-w-[220px]" />
                        <VCT_Select value={filterWeight} onChange={setFilterWeight} options={[{ value: 'all', label: 'Tất cả hạng cân' }, ...weightClasses.map(w => ({ value: w, label: w }))]} />
                    </div>
                    <AdminDataTable
                        data={filteredRankings}
                        isLoading={isLoading}
                        sortBy={sortColRankings}
                        sortDir={sortDirRankings}
                        onSort={handleSortRankings}
                        rowKey={a => a.id}
                        emptyTitle="Không tìm thấy VĐV"
                        emptyDescription="Thử thay đổi bộ lọc tìm kiếm"
                        emptyIcon="🏆"
                        columns={[
                            {
                                key: 'rank',
                                label: '#',
                                sortable: true,
                                align: 'center',
                                render: (a) => (
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${a.rank === 1 ? 'admin-rank-bg-1 text-white' : a.rank === 2 ? 'admin-rank-bg-2 text-white' : a.rank === 3 ? 'admin-rank-bg-3 text-white' : 'text-(--vct-text-primary) bg-(--vct-bg-base)'}`}>
                                        {a.rank}
                                    </span>
                                )
                            },
                            {
                                key: 'name',
                                label: 'VĐV',
                                sortable: true,
                                render: (a) => (
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{a.name}</div>
                                        <div className="text-xs text-(--vct-text-tertiary)">{a.province} · {a.weight_class}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'club',
                                label: 'CLB',
                                sortable: true,
                                hideMobile: true,
                                render: (a) => <div className="text-(--vct-text-secondary) text-sm">{a.club}</div>
                            },
                            {
                                key: 'belt',
                                label: 'Đai',
                                sortable: true,
                                align: 'center',
                                render: (a) => <VCT_Badge type={BELT_BADGE[a.belt] ?? 'neutral'} text={a.belt} />
                            },
                            {
                                key: 'elo',
                                label: 'ELO',
                                sortable: true,
                                align: 'center',
                                render: (a) => <div className="font-black text-(--vct-text-primary)">{a.elo}</div>
                            },
                            {
                                key: 'elo_change',
                                label: '+/-',
                                sortable: true,
                                align: 'center',
                                render: (a) => (
                                    <span className={`font-bold ${a.elo_change > 0 ? 'text-(--vct-success)' : a.elo_change < 0 ? 'text-(--vct-danger)' : 'text-(--vct-text-tertiary)'}`}>
                                        {a.elo_change > 0 ? '▲' : a.elo_change < 0 ? '▼' : '—'} {Math.abs(a.elo_change)}
                                    </span>
                                )
                            },
                            {
                                key: 'wins',
                                label: 'W-L',
                                sortable: true,
                                align: 'center',
                                render: (a) => <div className="text-(--vct-text-secondary)">{a.wins}W - {a.losses}L</div>
                            },
                            {
                                key: 'tournaments',
                                label: 'Giải',
                                sortable: true,
                                align: 'center',
                                render: (a) => <div className="text-(--vct-text-tertiary)">{a.tournaments}</div>
                            }
                        ]}
                        onRowClick={(item) => setSelected(item)}
                    />
                </>
            )}

            {/* ── TAB: Belt Exams ── */}
            {tab === 'exams' && (
                <div className="space-y-4 mb-6">
                    <AdminDataTable
                        data={filteredExams}
                        isLoading={false}
                        sortBy={sortColExams}
                        sortDir={sortDirExams}
                        onSort={handleSortExams}
                        rowKey={e => e.id}
                        emptyTitle="Không có kỳ thi"
                        columns={[
                            {
                                key: 'name',
                                label: 'Kỳ thi',
                                sortable: true,
                                render: (ex) => (
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{ex.name}</div>
                                        <div className="text-xs text-(--vct-text-tertiary)">{ex.date} · {ex.location}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'target_belt',
                                label: 'Đai mục tiêu',
                                sortable: true,
                                render: (ex) => <VCT_Badge type={BELT_BADGE[ex.target_belt] ?? 'neutral'} text={ex.target_belt} />
                            },
                            {
                                key: 'candidates',
                                label: 'Thí sinh',
                                sortable: true,
                                render: (ex) => (
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-(--vct-text-secondary)">👥 {ex.candidates} thí sinh</span>
                                        {ex.status === 'completed' && <span className="text-(--vct-success) font-bold">✅ {ex.passed} đạt ({Math.round(ex.passed / ex.candidates * 100)}%)</span>}
                                    </div>
                                )
                            },
                            {
                                key: 'status',
                                label: 'Trạng thái',
                                sortable: true,
                                align: 'right',
                                render: (ex) => (
                                    <div className="flex items-center justify-end gap-3">
                                        <VCT_Badge type={EXAM_STATUS_BADGE[ex.status]?.type ?? 'neutral'} text={EXAM_STATUS_BADGE[ex.status]?.label ?? ex.status} />
                                        {ex.status === 'upcoming' && (
                                            <VCT_Button size="sm" variant="ghost" onClick={() => showToast('Đã mở kỳ thi')} icon={<VCT_Icons.Play size={14} />}>Bắt đầu</VCT_Button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            )}

            {/* ── Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width={480}>
                {selected && (
                    <VCT_Stack gap={20}>
                        <div className="flex items-center gap-3">
                            <span className="admin-rank-circle">#{selected.rank}</span>
                            <div>
                                <div className="font-bold text-lg text-(--vct-text-primary)">{selected.name}</div>
                                <div className="text-sm text-(--vct-text-tertiary)">{selected.club}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'ELO Rating', value: String(selected.elo) },
                                { label: 'Thay đổi ELO', value: `${selected.elo_change > 0 ? '+' : ''}${selected.elo_change}` },
                                { label: 'Đai', value: selected.belt },
                                { label: 'Hạng cân', value: selected.weight_class },
                                { label: 'Thắng/Thua', value: `${selected.wins}W - ${selected.losses}L` },
                                { label: 'Tỷ lệ thắng', value: `${Math.round(selected.wins / (selected.wins + selected.losses) * 100)}%` },
                                { label: 'Số giải tham gia', value: String(selected.tournaments) },
                                { label: 'Tỉnh/TP', value: selected.province },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                </div>
                            ))}
                        </div>
                        <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle)">
                            <VCT_Button variant="ghost" onClick={() => showToast('Đã điều chỉnh ELO', 'info')} icon={<VCT_Icons.Edit size={14} />}>Điều chỉnh ELO</VCT_Button>
                        </VCT_Stack>
                    </VCT_Stack>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
