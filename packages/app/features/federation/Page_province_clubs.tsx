'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════════════════════════════
// PROVINCIAL — CLUB MANAGEMENT (Quản lý CLB cấp tỉnh)
// ════════════════════════════════════════════════════════════════

const MOCK_CLUBS = [
    { id: 'clb-001', name: 'CLB Tấn Long', code: 'BD-001', district: 'Thủ Dầu Một', leaderName: 'Nguyễn Văn Hùng', memberCount: 85, athleteCount: 45, coachCount: 5, status: 'ACTIVE' as const, foundedDate: '2018-03-15' },
    { id: 'clb-002', name: 'CLB Phong Vũ', code: 'BD-002', district: 'Dĩ An', leaderName: 'Trần Thị Mai', memberCount: 60, athleteCount: 30, coachCount: 3, status: 'ACTIVE' as const, foundedDate: '2019-06-20' },
    { id: 'clb-003', name: 'CLB Rồng Vàng', code: 'BD-003', district: 'Thuận An', leaderName: 'Lê Minh Tú', memberCount: 100, athleteCount: 55, coachCount: 6, status: 'ACTIVE' as const, foundedDate: '2015-09-01' },
    { id: 'clb-004', name: 'CLB Bạch Hổ', code: 'BD-004', district: 'Bến Cát', leaderName: 'Phạm Quốc Huy', memberCount: 40, athleteCount: 20, coachCount: 2, status: 'ACTIVE' as const, foundedDate: '2020-01-10' },
    { id: 'clb-005', name: 'CLB Thanh Long', code: 'BD-005', district: 'Tân Uyên', leaderName: 'Võ Thanh Bình', memberCount: 55, athleteCount: 28, coachCount: 3, status: 'ACTIVE' as const, foundedDate: '2017-11-25' },
    { id: 'clb-006', name: 'CLB Kim Quy', code: 'BD-006', district: 'Thủ Dầu Một', leaderName: 'Đặng Văn Lâm', memberCount: 35, athleteCount: 18, coachCount: 2, status: 'PENDING' as const, foundedDate: '2025-12-01' },
    { id: 'clb-007', name: 'CLB Phượng Hoàng', code: 'BD-007', district: 'Dĩ An', leaderName: 'Hoàng Thị Ngọc', memberCount: 70, athleteCount: 38, coachCount: 4, status: 'ACTIVE' as const, foundedDate: '2016-07-14' },
    { id: 'clb-008', name: 'CLB Lôi Phong', code: 'BD-008', district: 'Thuận An', leaderName: 'Ngô Đình Khoa', memberCount: 25, athleteCount: 12, coachCount: 1, status: 'INACTIVE' as const, foundedDate: '2022-04-10' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Hoạt động', color: 'var(--vct-success)' },
    PENDING: { label: 'Chờ duyệt', color: 'var(--vct-warning)' },
    INACTIVE: { label: 'Tạm ngưng', color: 'var(--vct-danger)' },
}

export const Page_province_clubs = () => {
    const [search, setSearch] = React.useState('')
    const [statusFilter, setStatusFilter] = React.useState('ALL')

    const filtered = MOCK_CLUBS.filter(c => {
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const totalMembers = MOCK_CLUBS.reduce((s, c) => s + c.memberCount, 0)
    const totalAthletes = MOCK_CLUBS.reduce((s, c) => s + c.athleteCount, 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Quản lý CLB</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách CLB Võ cổ truyền trực thuộc Hội Võ thuật tỉnh.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng CLB', value: MOCK_CLUBS.length, icon: <VCT_Icons.Home size={18} />, color: 'var(--vct-success)' },
                { label: 'Đang hoạt động', value: MOCK_CLUBS.filter(c => c.status === 'ACTIVE').length, icon: <VCT_Icons.CheckCircle size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Tổng thành viên', value: totalMembers, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-warning)' },
                { label: 'VĐV đăng ký', value: totalAthletes, icon: <VCT_Icons.Award size={18} />, color: 'var(--vct-info)' },
            ] as StatItem[]} className="mb-6" />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Tìm CLB theo tên hoặc mã..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none focus:border-(--vct-accent-cyan)"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                </select>
            </div>

            {/* Club Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(club => (
                    <div key={club.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5 hover:border-(--vct-accent-cyan) transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-(--vct-text-primary)">{club.name}</h3>
                                <span className="text-xs text-(--vct-text-secondary)">{club.code} — {club.district}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${(STATUS_MAP[club.status]?.color ?? '#888')}22`, color: STATUS_MAP[club.status]?.color ?? '#888' }}>
                                {STATUS_MAP[club.status]?.label ?? club.status}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-(--vct-text-secondary)">
                                <span>Chủ nhiệm</span>
                                <span className="text-(--vct-text-primary) font-medium">{club.leaderName}</span>
                            </div>
                            <div className="flex justify-between text-(--vct-text-secondary)">
                                <span>Thành viên</span>
                                <span className="text-(--vct-text-primary) font-medium">{club.memberCount}</span>
                            </div>
                            <div className="flex justify-between text-(--vct-text-secondary)">
                                <span>VĐV / HLV</span>
                                <span className="text-(--vct-text-primary) font-medium">{club.athleteCount} / {club.coachCount}</span>
                            </div>
                            <div className="flex justify-between text-(--vct-text-secondary)">
                                <span>Thành lập</span>
                                <span className="text-(--vct-text-primary) font-medium">{club.foundedDate}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </VCT_PageContainer>
    )
}
