'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════════════════════════════
// PROVINCIAL — COACH MANAGEMENT (Quản lý HLV cấp tỉnh)
// ════════════════════════════════════════════════════════════════

const MOCK_COACHES = [
    { id: 'hlv-001', fullName: 'Nguyễn Văn Hùng', clubName: 'CLB Tấn Long', level: 'NATIONAL' as const, certNumber: 'HLV-QG-0125', beltName: 'Đai đen ngũ đẳng', yearsExp: 25, spec: 'Đối kháng', status: 'ACTIVE' },
    { id: 'hlv-002', fullName: 'Trần Minh Đức', clubName: 'CLB Tấn Long', level: 'PROVINCIAL' as const, certNumber: 'HLV-T-BD-042', beltName: 'Đai đen tam đẳng', yearsExp: 15, spec: 'Quyền thuật', status: 'ACTIVE' },
    { id: 'hlv-003', fullName: 'Lê Thị Hạnh', clubName: 'CLB Phong Vũ', level: 'PROVINCIAL' as const, certNumber: 'HLV-T-BD-056', beltName: 'Đai đen nhị đẳng', yearsExp: 12, spec: 'Quyền & Song luyện', status: 'ACTIVE' },
    { id: 'hlv-004', fullName: 'Võ Hoàng Sơn', clubName: 'CLB Rồng Vàng', level: 'MASTER' as const, certNumber: 'HLV-QG-0068', beltName: 'Đai đen thất đẳng', yearsExp: 35, spec: 'Binh khí & Quyền cổ truyền', status: 'ACTIVE' },
    { id: 'hlv-005', fullName: 'Đặng Thị Thanh', clubName: 'CLB Rồng Vàng', level: 'PROVINCIAL' as const, certNumber: 'HLV-T-BD-078', beltName: 'Đai đen nhất đẳng', yearsExp: 10, spec: 'Đối kháng nữ', status: 'ACTIVE' },
    { id: 'hlv-006', fullName: 'Bùi Quốc Trung', clubName: 'CLB Thanh Long', level: 'NATIONAL' as const, certNumber: 'HLV-QG-0156', beltName: 'Đai đen tứ đẳng', yearsExp: 20, spec: 'Đối kháng & Tự vệ', status: 'ACTIVE' },
    { id: 'hlv-007', fullName: 'Hoàng Minh Tâm', clubName: 'CLB Phượng Hoàng', level: 'PROVINCIAL' as const, certNumber: 'HLV-T-BD-090', beltName: 'Đai đen nhị đẳng', yearsExp: 14, spec: 'Quyền thuật', status: 'ACTIVE' },
]

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
    MASTER: { label: 'Bậc Cao', color: '#ef4444' },
    NATIONAL: { label: 'Quốc gia', color: '#f59e0b' },
    PROVINCIAL: { label: 'Cấp tỉnh', color: '#0ea5e9' },
}

export const Page_province_coaches = () => {
    const [search, setSearch] = React.useState('')
    const [levelFilter, setLevelFilter] = React.useState('ALL')

    const filtered = MOCK_COACHES.filter(c => {
        if (levelFilter !== 'ALL' && c.level !== levelFilter) return false
        if (search && !c.fullName.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản lý HLV</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Danh sách Huấn luyện viên thuộc Hội Võ thuật tỉnh.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng HLV', value: MOCK_COACHES.length, icon: <VCT_Icons.Award size={18} />, color: '#10b981' },
                { label: 'Bậc Cao', value: MOCK_COACHES.filter(c => c.level === 'MASTER').length, icon: <VCT_Icons.Star size={18} />, color: '#ef4444' },
                { label: 'Quốc gia', value: MOCK_COACHES.filter(c => c.level === 'NATIONAL').length, icon: <VCT_Icons.Shield size={18} />, color: '#f59e0b' },
                { label: 'Cấp tỉnh', value: MOCK_COACHES.filter(c => c.level === 'PROVINCIAL').length, icon: <VCT_Icons.User size={18} />, color: '#0ea5e9' },
            ] as StatItem[]} className="mb-6" />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Tìm HLV theo tên..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] text-sm text-[var(--vct-text-primary)] outline-none focus:border-[var(--vct-accent-cyan)]"
                />
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] text-sm text-[var(--vct-text-primary)] outline-none">
                    <option value="ALL">Tất cả cấp bậc</option>
                    <option value="MASTER">Bậc Cao</option>
                    <option value="NATIONAL">Quốc gia</option>
                    <option value="PROVINCIAL">Cấp tỉnh</option>
                </select>
            </div>

            {/* Coach Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {filtered.map(coach => (
                    <div key={coach.id} className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-card)] p-5 hover:border-[var(--vct-accent-cyan)] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-[var(--vct-text-primary)]">{coach.fullName}</h3>
                                <span className="text-xs text-[var(--vct-text-secondary)]">{coach.clubName}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${(LEVEL_MAP[coach.level]?.color ?? '#888')}22`, color: LEVEL_MAP[coach.level]?.color ?? '#888' }}>
                                {LEVEL_MAP[coach.level]?.label ?? coach.level}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-[var(--vct-text-secondary)]">Chứng chỉ <span className="text-[var(--vct-text-primary)] font-medium ml-1">{coach.certNumber}</span></div>
                            <div className="text-[var(--vct-text-secondary)]">Cấp đai <span className="text-[var(--vct-text-primary)] font-medium ml-1">{coach.beltName}</span></div>
                            <div className="text-[var(--vct-text-secondary)]">Kinh nghiệm <span className="text-[var(--vct-text-primary)] font-medium ml-1">{coach.yearsExp} năm</span></div>
                            <div className="text-[var(--vct-text-secondary)]">Chuyên ngành <span className="text-[var(--vct-text-primary)] font-medium ml-1">{coach.spec}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </VCT_PageContainer>
    )
}
