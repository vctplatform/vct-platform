'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════════════════════════════
// PROVINCIAL — TOURNAMENT MANAGEMENT (Quản lý giải đấu cấp tỉnh)
// ════════════════════════════════════════════════════════════════

const MOCK_TOURNAMENTS = [
    { id: 't-001', name: 'Giải Vô địch Võ cổ truyền tỉnh Bình Dương 2026', type: 'Toàn tỉnh', date: '2026-06-15 → 2026-06-18', location: 'NTĐ Bình Dương', status: 'UPCOMING' as const, vdvCount: 120, clubCount: 8 },
    { id: 't-002', name: 'Giải Trẻ Võ cổ truyền tỉnh 2026', type: 'Trẻ (U15)', date: '2026-04-20 → 2026-04-22', location: 'NTĐ Thủ Dầu Một', status: 'UPCOMING' as const, vdvCount: 85, clubCount: 6 },
    { id: 't-003', name: 'Giao hữu liên tỉnh BD — HCM 2026', type: 'Giao hữu', date: '2026-03-10 → 2026-03-11', location: 'NTĐ Bình Dương', status: 'COMPLETED' as const, vdvCount: 45, clubCount: 4 },
    { id: 't-004', name: 'Giải phong trào Mùa Xuân 2026', type: 'Phong trào', date: '2026-02-15', location: 'SVĐ Dĩ An', status: 'COMPLETED' as const, vdvCount: 60, clubCount: 5 },
    { id: 't-005', name: 'Giải Vô địch Võ cổ truyền tỉnh Bình Dương 2025', type: 'Toàn tỉnh', date: '2025-07-10 → 2025-07-13', location: 'NTĐ Bình Dương', status: 'COMPLETED' as const, vdvCount: 110, clubCount: 7 },
]

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    UPCOMING: { label: 'Sắp diễn ra', color: '#0ea5e9', icon: '📅' },
    ONGOING: { label: 'Đang diễn ra', color: '#10b981', icon: '🔥' },
    COMPLETED: { label: 'Đã kết thúc', color: '#6b7280', icon: '✅' },
    CANCELLED: { label: 'Hủy', color: '#ef4444', icon: '❌' },
}

export const Page_province_tournaments = () => {
    const [statusFilter, setStatusFilter] = React.useState('ALL')

    const filtered = MOCK_TOURNAMENTS.filter(t => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
        return true
    })

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Giải đấu cấp tỉnh</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý và theo dõi các giải đấu Võ cổ truyền do tỉnh tổ chức.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng giải', value: MOCK_TOURNAMENTS.length, icon: <VCT_Icons.Trophy size={18} />, color: '#10b981' },
                { label: 'Sắp diễn ra', value: MOCK_TOURNAMENTS.filter(t => t.status === 'UPCOMING').length, icon: <VCT_Icons.Calendar size={18} />, color: '#0ea5e9' },
                { label: 'Đã kết thúc', value: MOCK_TOURNAMENTS.filter(t => t.status === 'COMPLETED').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#6b7280' },
                { label: 'Tổng VĐV tham gia', value: MOCK_TOURNAMENTS.reduce((s, t) => s + t.vdvCount, 0), icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="UPCOMING">Sắp diễn ra</option>
                    <option value="ONGOING">Đang diễn ra</option>
                    <option value="COMPLETED">Đã kết thúc</option>
                </select>
            </div>

            {/* Tournament List */}
            <div className="space-y-4">
                {filtered.map(t => {
                    const s = STATUS_MAP[t.status] ?? { label: t.status, color: '#888', icon: '❓' }
                    return (
                        <div key={t.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5 hover:border-(--vct-accent-cyan) transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-(--vct-text-primary) text-lg">{t.name}</h3>
                                    <span className="text-xs text-(--vct-text-secondary)">{t.type}</span>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: `${s.color}22`, color: s.color }}>
                                    {s.icon} {s.label}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-6 text-sm text-(--vct-text-secondary)">
                                <div className="flex items-center gap-1.5">
                                    <VCT_Icons.Calendar size={14} /> {t.date}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <VCT_Icons.MapPin size={14} /> {t.location}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <VCT_Icons.Users size={14} /> {t.vdvCount} VĐV
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <VCT_Icons.Home size={14} /> {t.clubCount} CLB
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </VCT_PageContainer>
    )
}
