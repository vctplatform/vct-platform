'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — DISCIPLINE CASES
// ════════════════════════════════════════

type CaseStatus = 'reported' | 'investigating' | 'hearing_scheduled' | 'decided' | 'appealed' | 'closed'

interface DisciplineCase {
    id: string; case_number: string; title: string; violation_type: string
    subject_name: string; subject_type: string
    status: CaseStatus; severity: 'low' | 'medium' | 'high' | 'critical'
    reported_date: string; investigator: string
}

const STATUS_MAP: Record<CaseStatus, { label: string; type: any; color: string }> = {
    reported: { label: 'Đã báo cáo', type: 'warning', color: '#f59e0b' },
    investigating: { label: 'Đang điều tra', type: 'info', color: '#0ea5e9' },
    hearing_scheduled: { label: 'Lịch xét xử', type: 'info', color: '#8b5cf6' },
    decided: { label: 'Đã quyết định', type: 'success', color: '#10b981' },
    appealed: { label: 'Kháng cáo', type: 'error', color: '#ef4444' },
    closed: { label: 'Đã đóng', type: 'neutral', color: '#64748b' },
}

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
    low: { label: 'Nhẹ', color: '#10b981' },
    medium: { label: 'Trung bình', color: '#f59e0b' },
    high: { label: 'Nghiêm trọng', color: '#ef4444' },
    critical: { label: 'Đặc biệt', color: '#dc2626' },
}

const MOCK_CASES: DisciplineCase[] = [
    { id: 'DC-001', case_number: 'KL-2026/001', title: 'Vi phạm quy chế thi đấu - Giải VĐQG', violation_type: 'competition', subject_name: 'CLB Tân Phong', subject_type: 'club', status: 'investigating', severity: 'high', reported_date: '2026-03-01', investigator: 'Ngô Văn F' },
    { id: 'DC-002', case_number: 'KL-2026/002', title: 'Sử dụng chất cấm', violation_type: 'doping', subject_name: 'VĐV Trần Minh K', subject_type: 'athlete', status: 'hearing_scheduled', severity: 'critical', reported_date: '2026-02-15', investigator: 'Lê Thị M' },
    { id: 'DC-003', case_number: 'KL-2026/003', title: 'Hành vi phi thể thao', violation_type: 'unsportsmanlike', subject_name: 'HLV Phạm Văn N', subject_type: 'coach', status: 'decided', severity: 'medium', reported_date: '2026-01-20', investigator: 'Hoàng Văn P' },
    { id: 'DC-004', case_number: 'KL-2025/045', title: 'Gian lận hồ sơ đăng ký', violation_type: 'fraud', subject_name: 'CLB Bách Võ', subject_type: 'club', status: 'closed', severity: 'high', reported_date: '2025-11-10', investigator: 'Nguyễn Thị Q' },
]

export const Page_federation_discipline = () => {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const filtered = useMemo(() => {
        let data = MOCK_CASES
        if (statusFilter) data = data.filter(c => c.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(c => c.title.toLowerCase().includes(q) || c.subject_name.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q))
        }
        return data
    }, [search, statusFilter])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Kỷ luật & Thanh tra</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý vụ việc vi phạm, xử lý kỷ luật và theo dõi kháng cáo.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng vụ việc', value: MOCK_CASES.length, icon: <VCT_Icons.AlertCircle size={18} />, color: '#ef4444' },
                { label: 'Đang điều tra', value: MOCK_CASES.filter(c => c.status === 'investigating').length, icon: <VCT_Icons.Search size={18} />, color: '#0ea5e9' },
                { label: 'Chờ xét xử', value: MOCK_CASES.filter(c => c.status === 'hearing_scheduled').length, icon: <VCT_Icons.Clock size={18} />, color: '#8b5cf6' },
                { label: 'Đã xử lý', value: MOCK_CASES.filter(c => ['decided', 'closed'].includes(c.status)).length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm vụ việc, đối tượng..." />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { }}>Tạo vụ việc</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có vụ việc nào" description="Hệ thống chưa ghi nhận vụ vi phạm nào." icon="⚖️" />
            ) : (
                <div className="space-y-3">
                    {filtered.map(c => {
                        const st = STATUS_MAP[c.status]
                        const sv = SEVERITY_MAP[c.severity]
                        return (
                            <div key={c.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer" style={{ borderLeft: `4px solid ${st.color}` }}>
                                <VCT_Stack direction="row" justify="space-between" align="flex-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono opacity-60">{c.case_number}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: (sv?.color || '#000') + '15', color: sv?.color }}>{sv?.label}</span>
                                        </div>
                                        <div className="font-bold text-sm text-(--vct-text-primary)">{c.title}</div>
                                        <div className="text-xs opacity-50 mt-1">
                                            Đối tượng: <strong>{c.subject_name}</strong> ({c.subject_type}) • Điều tra: {c.investigator} • {c.reported_date}
                                        </div>
                                    </div>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </VCT_Stack>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
