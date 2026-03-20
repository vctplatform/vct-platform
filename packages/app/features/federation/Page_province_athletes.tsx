'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════════════════════════════
// PROVINCIAL — ATHLETE MANAGEMENT (Quản lý VĐV cấp tỉnh)
// ════════════════════════════════════════════════════════════════

const MOCK_ATHLETES = [
    { id: 'vdv-001', fullName: 'Nguyễn Minh Tuấn', clubName: 'CLB Tấn Long', gender: 'Nam', dob: '2005-03-12', beltName: 'Đai xanh đậm', beltLevel: 5, weightKg: 62, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-002', fullName: 'Trần Thị Hương', clubName: 'CLB Tấn Long', gender: 'Nữ', dob: '2006-07-25', beltName: 'Đai xanh lá', beltLevel: 4, weightKg: 50, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-003', fullName: 'Lê Quốc Anh', clubName: 'CLB Phong Vũ', gender: 'Nam', dob: '2004-11-30', beltName: 'Đai nâu', beltLevel: 7, weightKg: 70, status: 'ACTIVE' as const, achievements: 'HCV Giải tỉnh 2025' },
    { id: 'vdv-004', fullName: 'Phạm Thị Lan', clubName: 'CLB Phong Vũ', gender: 'Nữ', dob: '2007-01-14', beltName: 'Đai xanh lá', beltLevel: 3, weightKg: 45, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-005', fullName: 'Võ Đình Khôi', clubName: 'CLB Rồng Vàng', gender: 'Nam', dob: '2003-05-20', beltName: 'Đai đen nhất đẳng', beltLevel: 8, weightKg: 75, status: 'ACTIVE' as const, achievements: 'HCB Giải quốc gia 2025' },
    { id: 'vdv-006', fullName: 'Đặng Huyền Trang', clubName: 'CLB Rồng Vàng', gender: 'Nữ', dob: '2005-08-08', beltName: 'Đai nâu nhạt', beltLevel: 6, weightKg: 55, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-007', fullName: 'Hoàng Việt Anh', clubName: 'CLB Bạch Hổ', gender: 'Nam', dob: '2008-12-03', beltName: 'Đai vàng', beltLevel: 2, weightKg: 42, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-008', fullName: 'Bùi Thành Nam', clubName: 'CLB Thanh Long', gender: 'Nam', dob: '2002-04-18', beltName: 'Đai đen nhị đẳng', beltLevel: 9, weightKg: 80, status: 'ACTIVE' as const, achievements: 'HCV Giải quốc gia 2024' },
    { id: 'vdv-009', fullName: 'Lý Ngọc Diệp', clubName: 'CLB Thanh Long', gender: 'Nữ', dob: '2006-10-22', beltName: 'Đai xanh đậm', beltLevel: 5, weightKg: 48, status: 'ACTIVE' as const, achievements: '' },
    { id: 'vdv-010', fullName: 'Trịnh Văn Đạt', clubName: 'CLB Phượng Hoàng', gender: 'Nam', dob: '2001-06-15', beltName: 'Đai đen tam đẳng', beltLevel: 10, weightKg: 68, status: 'ACTIVE' as const, achievements: 'HCĐ SEA Games 2025' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Thi đấu', color: '#10b981' },
    SUSPENDED: { label: 'Tạm nghỉ', color: '#f59e0b' },
    RETIRED: { label: 'Nghỉ', color: '#ef4444' },
}

export const Page_province_athletes = () => {
    const [search, setSearch] = React.useState('')
    const [genderFilter, setGenderFilter] = React.useState('ALL')
    const [clubFilter, setClubFilter] = React.useState('ALL')

    const clubs = Array.from(new Set(MOCK_ATHLETES.map(a => a.clubName)))

    const filtered = MOCK_ATHLETES.filter(a => {
        if (genderFilter !== 'ALL' && a.gender !== genderFilter) return false
        if (clubFilter !== 'ALL' && a.clubName !== clubFilter) return false
        if (search && !a.fullName.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const maleCount = MOCK_ATHLETES.filter(a => a.gender === 'Nam').length
    const femaleCount = MOCK_ATHLETES.filter(a => a.gender === 'Nữ').length
    const achievementCount = MOCK_ATHLETES.filter(a => a.achievements).length

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Quản lý VĐV</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách Vận động viên đăng ký thi đấu thuộc tỉnh.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng VĐV', value: MOCK_ATHLETES.length, icon: <VCT_Icons.Users size={18} />, color: '#10b981' },
                { label: 'Nam', value: maleCount, icon: <VCT_Icons.User size={18} />, color: '#0ea5e9' },
                { label: 'Nữ', value: femaleCount, icon: <VCT_Icons.User size={18} />, color: '#f472b6' },
                { label: 'Có thành tích', value: achievementCount, icon: <VCT_Icons.Award size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Tìm VĐV theo tên..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none focus:border-(--vct-accent-cyan)"
                />
                <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none">
                    <option value="ALL">Tất cả giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                </select>
                <select value={clubFilter} onChange={e => setClubFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none">
                    <option value="ALL">Tất cả CLB</option>
                    {clubs.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-(--vct-border-subtle) overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-(--vct-bg-glass)">
                                <th className="text-left p-3 font-bold text-(--vct-text-secondary)">VĐV</th>
                                <th className="text-left p-3 font-bold text-(--vct-text-secondary)">CLB</th>
                                <th className="text-center p-3 font-bold text-(--vct-text-secondary)">Giới tính</th>
                                <th className="text-center p-3 font-bold text-(--vct-text-secondary)">Cấp đai</th>
                                <th className="text-center p-3 font-bold text-(--vct-text-secondary)">Cân nặng</th>
                                <th className="text-center p-3 font-bold text-(--vct-text-secondary)">Trạng thái</th>
                                <th className="text-left p-3 font-bold text-(--vct-text-secondary)">Thành tích</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id} className="border-t border-(--vct-border-subtle) hover:bg-(--vct-bg-glass) transition-colors">
                                    <td className="p-3">
                                        <div className="font-bold text-(--vct-text-primary)">{a.fullName}</div>
                                        <div className="text-xs text-(--vct-text-secondary)">{a.dob}</div>
                                    </td>
                                    <td className="p-3 text-(--vct-text-secondary)">{a.clubName}</td>
                                    <td className="p-3 text-center text-(--vct-text-secondary)">{a.gender}</td>
                                    <td className="p-3 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                                            {a.beltName}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-(--vct-text-secondary)">{a.weightKg} kg</td>
                                    <td className="p-3 text-center">
                                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${(STATUS_MAP[a.status]?.color ?? '#888')}22`, color: STATUS_MAP[a.status]?.color ?? '#888' }}>
                                            {STATUS_MAP[a.status]?.label ?? a.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-(--vct-text-secondary) max-w-[180px] truncate">{a.achievements || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
