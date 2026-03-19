'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_SearchInput, VCT_Badge, VCT_Select,
    VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { VCT_Timeline } from '../components/VCT_Timeline'
import type { TimelineEvent } from '../components/VCT_Timeline'
import { usePagination } from '../hooks/usePagination'
import { AdminSkeletonRow } from './components/AdminSkeletonRow'
import { AdminPaginationBar } from './components/AdminPaginationBar'
import { useAdminFetch } from './hooks/useAdminAPI'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface IntegrityAlert {
    id: string
    type: string
    severity: string
    source: string
    tournament: string
    match: string
    status: string
    assigned_to: string
    reported_at: string
    detail: string
}

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
    const { data: alerts, isLoading } = useAdminFetch<IntegrityAlert[]>('/admin/integrity/alerts')
    const [search, setSearch] = useState('')
    const [severityFilter, setSeverityFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [drawerAlert, setDrawerAlert] = useState<IntegrityAlert | null>(null)

    const allAlerts = useMemo(() => alerts ?? [], [alerts])

    const filtered = useMemo(() => {
        let v = allAlerts
        if (severityFilter !== 'all') v = v.filter(a => a.severity === severityFilter)
        if (statusFilter !== 'all') v = v.filter(a => a.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(a => a.detail.toLowerCase().includes(q) || a.tournament.toLowerCase().includes(q) || TYPE_LABELS[a.type]?.toLowerCase().includes(q))
        }
        return v
    }, [allAlerts, search, severityFilter, statusFilter])

    const pagination = usePagination(filtered, { pageSize: 5 })

    const stats = useMemo(() => ({
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
        investigating: allAlerts.filter(a => a.status === 'INVESTIGATING').length,
        newAlerts: allAlerts.filter(a => a.status === 'NEW').length,
    }), [allAlerts])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Giám Sát Liêm Chính</h1>
                    <p className="text-sm text-(--vct-text-secondary) mt-1">Anti-match-fixing. Theo dõi cảnh báo bất thường trong thi đấu, chấm điểm, cân nặng.</p>
                </div>
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                    const header = 'Mức độ,Trạng thái,Loại,Giải đấu,Chi tiết,Phụ trách,Thời gian'
                    const csv = [header, ...filtered.map(a => `${a.severity},${a.status},${TYPE_LABELS[a.type] || a.type},${a.tournament},"${a.detail}",${a.assigned_to || '—'},${a.reported_at}`)].join('\n')
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a2 = document.createElement('a'); a2.href = url; a2.download = `vct_integrity_report_${new Date().toISOString().slice(0, 10)}.csv`; a2.click()
                    URL.revokeObjectURL(url)
                }}>Xuất báo cáo</VCT_Button>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng cảnh báo', value: stats.total, icon: <VCT_Icons.Shield size={18} />, color: '#0ea5e9' },
                { label: 'Critical', value: stats.critical, icon: <VCT_Icons.Alert size={18} />, color: '#ef4444' },
                { label: 'Đang điều tra', value: stats.investigating, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
                { label: 'Mới / Chưa xử lý', value: stats.newAlerts, icon: <VCT_Icons.Clock size={18} />, color: '#3b82f6' },
            ] as StatItem[]} className="mb-8" />

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
            <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 w-20">Mức độ</th>
                            <th className="p-4 w-20">T.Thái</th>
                            <th className="p-4 w-44">Loại</th>
                            <th className="p-4 w-44">Giải đấu</th>
                            <th className="p-4">Chi tiết</th>
                            <th className="p-4 w-36">Phụ trách</th>
                            <th className="p-4 w-36">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--vct-border-subtle)">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={7} />)
                        ) : pagination.paginatedItems.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-(--vct-text-tertiary)">Không tìm thấy cảnh báo nào</td></tr>
                        ) : (
                            pagination.paginatedItems.map(alert => (
                                <tr key={alert.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawerAlert(alert)}>
                                    <td className="p-4"><VCT_Badge type={SEVERITY_MAP[alert.severity]?.type || 'info'} text={alert.severity} /></td>
                                    <td className="p-4"><VCT_Badge type={STATUS_MAP[alert.status]?.type || 'neutral'} text={alert.status.replace(/_/g, ' ')} /></td>
                                    <td className="p-4 text-(--vct-text-primary) font-semibold">{TYPE_LABELS[alert.type] || alert.type}</td>
                                    <td className="p-4 text-(--vct-text-secondary)">{alert.tournament}</td>
                                    <td className="p-4 text-(--vct-text-secondary)">
                                        <div className="line-clamp-2 text-[12px]">{alert.detail}</div>
                                    </td>
                                    <td className="p-4 text-(--vct-accent-cyan)">{alert.assigned_to || '—'}</td>
                                    <td className="p-4 font-mono text-[11px] text-(--vct-text-tertiary)">{alert.reported_at}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && <AdminPaginationBar {...pagination} />}
            </div>

            {/* ── ALERT DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerAlert} onClose={() => setDrawerAlert(null)} title="Chi tiết cảnh báo" width={560}>
                {drawerAlert && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_Badge type={SEVERITY_MAP[drawerAlert.severity]?.type || 'info'} text={drawerAlert.severity} />
                            <VCT_Badge type={STATUS_MAP[drawerAlert.status]?.type || 'neutral'} text={drawerAlert.status.replace(/_/g, ' ')} />
                            <span className="font-mono text-xs text-(--vct-text-tertiary) ml-auto">{drawerAlert.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Loại</div><div className="font-semibold text-(--vct-text-primary)">{TYPE_LABELS[drawerAlert.type] || drawerAlert.type}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Nguồn</div><div className="text-(--vct-text-primary)">{drawerAlert.source.replace(/_/g, ' ')}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Giải đấu</div><div className="text-(--vct-accent-cyan)">{drawerAlert.tournament}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Trận</div><div className="text-(--vct-text-primary)">{drawerAlert.match || '—'}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Phụ trách</div><div className="font-semibold text-(--vct-accent-cyan)">{drawerAlert.assigned_to || 'Chưa giao'}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Thời gian</div><div className="font-mono text-(--vct-text-primary)">{drawerAlert.reported_at}</div></div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Chi tiết forensic</div>
                            <div className="text-sm text-(--vct-text-primary) p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) leading-relaxed">{drawerAlert.detail}</div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Lịch sử xử lý</div>
                            <VCT_Timeline events={[
                                { time: drawerAlert.reported_at, title: 'Cảnh báo được tạo', description: `Nguồn: ${drawerAlert.source.replace(/_/g, ' ')}`, icon: <VCT_Icons.Alert size={14} />, color: '#ef4444' },
                                ...(drawerAlert.assigned_to ? [{ time: drawerAlert.reported_at.replace(/\d{2}:\d{2}$/, '12:00'), title: `Giao cho ${drawerAlert.assigned_to}`, description: 'Bởi System Admin', icon: <VCT_Icons.Users size={14} />, color: '#0ea5e9' }] : []),
                                ...(drawerAlert.status !== 'NEW' ? [{ time: drawerAlert.reported_at.replace(/\d{2}:\d{2}$/, '14:30'), title: `Chuyển trạng thái: ${drawerAlert.status.replace(/_/g, ' ')}`, icon: <VCT_Icons.CheckCircle size={14} />, color: '#10b981' }] : []),
                            ] as TimelineEvent[]} maxHeight={200} />
                        </div>
                    </div>
                )}
            </VCT_Drawer>
        </div>
    )
}
