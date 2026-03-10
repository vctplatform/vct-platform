'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA — Integrity Monitoring
// ════════════════════════════════════════
const MOCK_ALERTS = [
    { id: 'IA-001', type: 'UNUSUAL_SCORING_PATTERN', severity: 'HIGH', source: 'SYSTEM_AUTO', tournament: 'Giải VĐQG 2024', match: 'QK-M012', status: 'INVESTIGATING', assigned_to: 'Nguyễn Minh Tuấn', reported_at: '2024-03-09 10:15', detail: '5 trọng tài cho 8.5-9.0, 1 trọng tài cho 5.0. Deviation = 3.2σ' },
    { id: 'IA-002', type: 'REFEREE_CONFLICT_OF_INTEREST', severity: 'MEDIUM', source: 'SYSTEM_AUTO', tournament: 'Giải VĐQG 2024', match: 'DK-M045', status: 'UNDER_REVIEW', assigned_to: 'Trần Văn Bình', reported_at: '2024-03-09 09:30', detail: 'Trọng tài Nguyễn A chấm VĐV từ CLB cũ (Bình Dương)' },
    { id: 'IA-003', type: 'SUSPICIOUS_WITHDRAWAL', severity: 'LOW', source: 'MANUAL_REPORT', tournament: 'Cúp CLB 2024', match: 'DK-M078', status: 'NEW', assigned_to: '', reported_at: '2024-03-08 16:45', detail: 'VĐV rút lui khi đối thủ là VĐV cùng CLB ở vòng bán kết' },
    { id: 'IA-004', type: 'WEIGHT_MANIPULATION', severity: 'CRITICAL', source: 'SYSTEM_AUTO', tournament: 'Giải VĐQG 2024', match: '', status: 'SUBSTANTIATED', assigned_to: 'Lê Thị Hương', reported_at: '2024-03-08 08:00', detail: 'VĐV cân 3 lần: 60.2kg → 59.8kg → 59.5kg trong 2 giờ. Pattern bất thường.' },
    { id: 'IA-005', type: 'REPEATED_PAIRING_ANOMALY', severity: 'MEDIUM', source: 'AI_DETECTION', tournament: 'Giải Trẻ QG 2024', match: '', status: 'UNSUBSTANTIATED', assigned_to: 'Phạm Đức Minh', reported_at: '2024-03-07 14:20', detail: '2 VĐV cùng CLB gặp nhau 4/5 giải gần nhất ở vòng tứ kết' },
    { id: 'IA-006', type: 'IDENTITY_FRAUD', severity: 'CRITICAL', source: 'REFEREE_REPORT', tournament: 'Giải Trẻ QG 2024', match: 'QK-M003', status: 'INVESTIGATING', assigned_to: 'Nguyễn Minh Tuấn', reported_at: '2024-03-07 11:00', detail: 'Nghi ngờ VĐV thi bằng CCCD của người khác. Ảnh không khớp.' },
]

const SEVERITY_MAP: Record<string, { type: 'info' | 'warning' | 'danger' | 'neutral' }> = {
    LOW: { type: 'info' },
    MEDIUM: { type: 'warning' },
    HIGH: { type: 'danger' },
    CRITICAL: { type: 'danger' },
}

const STATUS_MAP: Record<string, { type: 'info' | 'warning' | 'success' | 'danger' | 'neutral' }> = {
    NEW: { type: 'info' },
    UNDER_REVIEW: { type: 'warning' },
    INVESTIGATING: { type: 'warning' },
    SUBSTANTIATED: { type: 'danger' },
    UNSUBSTANTIATED: { type: 'neutral' },
    CLOSED: { type: 'success' },
}

const TYPE_LABELS: Record<string, string> = {
    UNUSUAL_SCORING_PATTERN: 'Điểm bất thường',
    SUSPICIOUS_WITHDRAWAL: 'Bỏ cuộc đáng ngờ',
    REPEATED_PAIRING_ANOMALY: 'Bốc thăm bất thường',
    REFEREE_CONFLICT_OF_INTEREST: 'Xung đột lợi ích TT',
    BETTING_ANOMALY: 'Cá cược bất thường',
    IDENTITY_FRAUD: 'Gian lận danh tính',
    AGE_MANIPULATION: 'Gian lận tuổi',
    WEIGHT_MANIPULATION: 'Gian lận cân nặng',
    MANUAL_REPORT: 'Báo cáo thủ công',
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_integrity = () => {
    const [search, setSearch] = useState('')
    const [severityFilter, setSeverityFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        let v = MOCK_ALERTS
        if (severityFilter !== 'all') v = v.filter(a => a.severity === severityFilter)
        if (statusFilter !== 'all') v = v.filter(a => a.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(a => a.detail.toLowerCase().includes(q) || a.tournament.toLowerCase().includes(q) || TYPE_LABELS[a.type]?.toLowerCase().includes(q))
        }
        return v
    }, [search, severityFilter, statusFilter])

    const stats = useMemo(() => ({
        total: MOCK_ALERTS.length,
        critical: MOCK_ALERTS.filter(a => a.severity === 'CRITICAL').length,
        investigating: MOCK_ALERTS.filter(a => a.status === 'INVESTIGATING').length,
        newAlerts: MOCK_ALERTS.filter(a => a.status === 'NEW').length,
    }), [])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Giám Sát Liêm Chính</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Anti-match-fixing. Theo dõi cảnh báo bất thường trong thi đấu, chấm điểm, cân nặng.</p>
                </div>
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất báo cáo</VCT_Button>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Tổng cảnh báo</div>
                    <div className="text-3xl font-bold text-[var(--vct-text-primary)]">{stats.total}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Critical</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-red,#ef4444)' }}>{stats.critical}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Đang điều tra</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-yellow,#eab308)' }}>{stats.investigating}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Mới / Chưa xử lý</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-blue,#3b82f6)' }}>{stats.newAlerts}</div>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <VCT_SearchInput placeholder="Tìm theo chi tiết, giải đấu..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
                <VCT_Select value={severityFilter} onChange={setSeverityFilter} options={[
                    { value: 'all', label: 'Mọi mức độ' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'CRITICAL', label: 'Critical' },
                ]} />
                <VCT_Select value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'all', label: 'Mọi trạng thái' },
                    { value: 'NEW', label: 'Mới' },
                    { value: 'UNDER_REVIEW', label: 'Đang xem xét' },
                    { value: 'INVESTIGATING', label: 'Đang điều tra' },
                    { value: 'SUBSTANTIATED', label: 'Có căn cứ' },
                    { value: 'UNSUBSTANTIATED', label: 'Không có căn cứ' },
                    { value: 'CLOSED', label: 'Đã đóng' },
                ]} />
            </div>

            {/* ── ALERTS TABLE ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4 w-20">Mức độ</th>
                            <th className="p-4 w-20">T.Thái</th>
                            <th className="p-4 w-44">Loại</th>
                            <th className="p-4 w-44">Giải đấu</th>
                            <th className="p-4">Chi tiết</th>
                            <th className="p-4 w-36">Phụ trách</th>
                            <th className="p-4 w-36">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {filtered.map(alert => (
                            <tr key={alert.id} className="hover:bg-white/5 transition-colors text-sm">
                                <td className="p-4"><VCT_Badge type={SEVERITY_MAP[alert.severity]?.type || 'info'} text={alert.severity} /></td>
                                <td className="p-4"><VCT_Badge type={STATUS_MAP[alert.status]?.type || 'neutral'} text={alert.status.replace(/_/g, ' ')} /></td>
                                <td className="p-4 text-[var(--vct-text-primary)] font-semibold">{TYPE_LABELS[alert.type] || alert.type}</td>
                                <td className="p-4 text-[var(--vct-text-secondary)]">{alert.tournament}</td>
                                <td className="p-4 text-[var(--vct-text-secondary)]">
                                    <div className="line-clamp-2 text-[12px]">{alert.detail}</div>
                                </td>
                                <td className="p-4 text-[var(--vct-accent-cyan)]">{alert.assigned_to || '—'}</td>
                                <td className="p-4 font-mono text-[11px] text-[var(--vct-text-tertiary)]">{alert.reported_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
