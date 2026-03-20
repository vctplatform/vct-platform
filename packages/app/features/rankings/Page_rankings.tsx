'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_Select, VCT_EmptyState, VCT_Tabs,
    VCT_PageContainer, VCT_PageHeader
} from '../components/vct-ui'
import { VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useAthleteRankings } from '../hooks/useRankingsAPI'

// ════════════════════════════════════════
// FALLBACK DATA
// ════════════════════════════════════════
const FALLBACK_RANKINGS = [
    { id: 'ATH-001', rank: 1, name: 'Nguyễn Văn Tiến', club: 'Liên Hoa Đạo Quán', points: 2450, change: 0, category: 'nam_70kg', history: [2200, 2350, 2400, 2450] },
    { id: 'ATH-002', rank: 2, name: 'Trần Hữu Kiên', club: 'CLB Long An', points: 2320, change: 1, category: 'nam_70kg', history: [2100, 2250, 2300, 2320] },
    { id: 'ATH-003', rank: 3, name: 'Lê Minh Hùng', club: 'Võ Đường Thiếu Lâm', points: 2150, change: -1, category: 'nam_70kg', history: [2250, 2300, 2200, 2150] },
    { id: 'ATH-004', rank: 4, name: 'Phạm Đức Anh', club: 'CLB Q.12', points: 1980, change: 2, category: 'nam_70kg', history: [1500, 1600, 1800, 1980] },
    { id: 'ATH-005', rank: 5, name: 'Hoàng Thiệu', club: 'Sơn Long Quyền Thuật', points: 1850, change: 0, category: 'nam_70kg', history: [1800, 1820, 1850, 1850] },
]

const CATEGORIES = [
    { id: 'all', label: 'Tất cả hạng cân' },
    { id: 'nam_70kg', label: 'Đối kháng Nam - 70kg' },
    { id: 'nam_65kg', label: 'Đối kháng Nam - 65kg' },
    { id: 'nu_55kg', label: 'Đối kháng Nữ - 55kg' },
    { id: 'quyen_don_nam', label: 'Quyền Đơn Nam' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_rankings = () => {
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('nam_70kg')
    const [yearFilter, setYearFilter] = useState('2024')

    // ── Real API data ──
    const { data: apiRankings, isLoading } = useAthleteRankings(
        categoryFilter !== 'all' ? categoryFilter : undefined
    )

    const rankings = useMemo(() => {
        if (apiRankings && apiRankings.length > 0) {
            return apiRankings.map((r, idx) => ({
                id: r.id,
                rank: r.rank || idx + 1,
                name: r.name || '',
                club: r.club || '',
                points: r.points || 0,
                change: r.change || 0,
                category: r.category || categoryFilter,
                history: r.history || [r.points * 0.85, r.points * 0.9, r.points * 0.95, r.points],
            }))
        }
        return FALLBACK_RANKINGS
    }, [apiRankings, categoryFilter])

    const filtered = useMemo(() => {
        let v = rankings
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(a => a.name.toLowerCase().includes(q) || a.club.toLowerCase().includes(q))
        }
        return v
    }, [search, rankings])

    return (
        <VCT_PageContainer size="wide">
            <VCT_PageHeader
                title="Bảng Xếp Hạng Quốc Gia"
                description="Hệ thống tính điểm xếp hạng Vận động viên theo từng năm thi đấu."
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Select
                            value={yearFilter}
                            onChange={setYearFilter}
                            options={[{ value: '2024', label: 'Mùa giải 2024' }, { value: '2023', label: 'Mùa giải 2023' }]}
                        />
                        <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary">Xuất BXH</VCT_Button>
                    </VCT_Stack>
                }
            />

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Hạng mục', value: CATEGORIES.length - 1, icon: <VCT_Icons.Layers size={18} />, color: '#0ea5e9' },
                { label: 'VĐV có Rank', value: rankings.length, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
                { label: 'Giải đã tính', value: 12, icon: <VCT_Icons.Trophy size={18} />, color: '#10b981' },
                { label: 'Tổng trận', value: 8500, icon: <VCT_Icons.Swords size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            {isLoading && (
                <div className="text-center py-6 text-(--vct-text-tertiary) text-sm animate-pulse">
                    Đang tải bảng xếp hạng...
                </div>
            )}

            {/* ── PODIUM ── */}
            {filtered.length >= 3 && (
                <div className="mb-8 flex flex-col md:flex-row items-end justify-center gap-4 mt-12">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center flex-1 max-w-[200px] order-2 md:order-1">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_20px_rgba(156,163,175,0.4)] mb-3 border-2 border-gray-400">
                            {filtered[1]?.name[0]}
                        </div>
                        <div className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) w-full text-center p-4 rounded-t-xl shrink-0 h-[100px] flex flex-col items-center justify-start relative">
                            <div className="absolute -top-3 bg-gray-400 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">#2</div>
                            <div className="font-bold text-(--vct-text-primary) text-sm line-clamp-1">{filtered[1]?.name}</div>
                            <div className="text-[11px] text-(--vct-text-secondary) mt-1">{filtered[1]?.club}</div>
                            <div className="text-[#22d3ee] font-black mt-1 text-lg">{filtered[1]?.points.toLocaleString()} PTS</div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center flex-1 max-w-[220px] order-1 md:order-2 z-10 -mb-4">
                        <VCT_Icons.Award size={32} className="text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center font-black text-white text-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] mb-3 border-2 border-yellow-400">
                            {filtered[0]?.name[0]}
                        </div>
                        <div className="bg-gradient-to-t from-(--vct-bg-card) to-(--vct-bg-elevated) border border-yellow-500/30 w-full text-center p-4 rounded-t-xl shrink-0 h-[140px] flex flex-col items-center justify-start relative shadow-[0_-5px_30px_rgba(250,204,21,0.1)]">
                            <div className="absolute -top-3 bg-yellow-500 text-white text-xs font-black px-2.5 py-0.5 rounded shadow-lg">#1</div>
                            <div className="font-bold text-(--vct-text-primary) text-base line-clamp-1">{filtered[0]?.name}</div>
                            <div className="text-[12px] text-(--vct-text-secondary) mt-1">{filtered[0]?.club}</div>
                            <div className="text-yellow-400 font-black mt-2 text-2xl drop-shadow-md">{filtered[0]?.points.toLocaleString()} PTS</div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center flex-1 max-w-[200px] order-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] mb-3 border-2 border-orange-500">
                            {filtered[2]?.name[0]}
                        </div>
                        <div className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) w-full text-center p-4 rounded-t-xl shrink-0 h-[80px] flex flex-col items-center justify-start relative">
                            <div className="absolute -top-3 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg">#3</div>
                            <div className="font-bold text-(--vct-text-primary) text-sm line-clamp-1">{filtered[2]?.name}</div>
                            <div className="text-[11px] text-(--vct-text-secondary) mt-1">{filtered[2]?.club}</div>
                            <div className="text-[#22d3ee] font-black mt-1 text-base">{filtered[2]?.points.toLocaleString()} PTS</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOOLBAR ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-(--vct-bg-elevated) p-2 rounded-xl border border-(--vct-border-subtle)">
                <div className="flex-1 overflow-x-auto">
                    <VCT_Tabs
                        tabs={CATEGORIES.map(c => ({ key: c.id, label: c.label }))}
                        activeTab={categoryFilter}
                        onChange={setCategoryFilter}
                    />
                </div>
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm kiếm VĐV, Đơn vị..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── LIST ── */}
            <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 w-16 text-center">Hạng</th>
                            <th className="p-4 w-20 text-center">#</th>
                            <th className="p-4">Vận động viên</th>
                            <th className="p-4">Đơn vị</th>
                            <th className="p-4 text-right">Tổng điểm</th>
                            <th className="p-4 w-48 text-center pt-2">Phong độ (Biểu đồ)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--vct-border-subtle)">
                        {filtered.map(athlete => (
                            <tr key={athlete.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-center">
                                    <div className="font-black text-xl text-(--vct-text-secondary)">{athlete.rank}</div>
                                </td>
                                <td className="p-4 text-center">
                                    {athlete.change > 0 ? (
                                        <div className="flex items-center justify-center gap-1 text-[#10b981] font-bold text-xs bg-[#10b98120] px-2 py-1 rounded">
                                            <VCT_Icons.TrendingUp size={12} /> {athlete.change}
                                        </div>
                                    ) : athlete.change < 0 ? (
                                        <div className="flex items-center justify-center gap-1 text-[#ef4444] font-bold text-xs bg-[#ef444420] px-2 py-1 rounded">
                                            <VCT_Icons.TrendingDown size={12} /> {Math.abs(athlete.change)}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-(--vct-text-tertiary) font-bold text-xl">-</div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-(--vct-border-strong) flex items-center justify-center font-bold text-white text-xs shrink-0">
                                            {athlete.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{athlete.name}</div>
                                            <div className="text-[10px] text-(--vct-text-tertiary) font-mono">{athlete.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-(--vct-text-secondary)">
                                    {athlete.club}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-black text-base text-(--vct-accent-cyan)">{athlete.points.toLocaleString()} <span className="text-[10px] text-(--vct-text-tertiary) font-normal uppercase">pts</span></div>
                                </td>
                                <td className="p-4 px-6 flex items-center justify-center">
                                    <div className="flex items-end gap-1 h-8">
                                        {(athlete.history || []).map((val: number, i: number) => {
                                            const maxVal = Math.max(...(athlete.history || [1]))
                                            const height = (val / maxVal) * 100;
                                            return (
                                                <div key={i} className="w-4 bg-(--vct-border-strong) rounded-sm relative group overflow-hidden">
                                                    <div className="absolute bottom-0 w-full bg-(--vct-accent-cyan) transition-all duration-500" style={{ height: `${height}%` }}></div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && (
                <div className="mt-8">
                    <VCT_EmptyState title="Không tìm thấy VĐV" description="Thử thay đổi hạng cân hoặc từ khóa tìm kiếm." icon="🔍" />
                </div>
            )}
        </VCT_PageContainer>
    )
}
