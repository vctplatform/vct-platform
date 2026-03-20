'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_SearchInput, VCT_Select } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { AdminPageShell } from './components/AdminPageShell'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminGuard } from './components/AdminGuard'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useI18n } from '../i18n'
import { useDebounce } from '../hooks/useDebounce'
import { exportToCSV } from './utils/adminExport'

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════
interface AuditEntry {
    id: string
    timestamp: string
    user_id: string
    user_name: string
    user_role: string
    action: string
    entity_type: string
    entity_id: string
    entity_name: string
    changes: Record<string, { old: unknown; new: unknown }>
    ip_address: string
    user_agent: string
}

const ACTION_BADGE: Record<string, { label: string; type: 'success' | 'info' | 'warning' | 'danger' | 'neutral' }> = {
    CREATE: { label: 'Tạo mới', type: 'success' },
    UPDATE: { label: 'Cập nhật', type: 'info' },
    DELETE: { label: 'Xóa', type: 'danger' },
    APPROVE: { label: 'Phê duyệt', type: 'success' },
    REJECT: { label: 'Từ chối', type: 'warning' },
    SUSPEND: { label: 'Tạm ngưng', type: 'warning' },
    LOGIN: { label: 'Đăng nhập', type: 'neutral' },
    EXPORT: { label: 'Xuất dữ liệu', type: 'info' },
    CONFIG: { label: 'Cấu hình', type: 'info' },
}

const ENTITY_OPTIONS = [
    { value: 'all', label: 'Tất cả đối tượng' },
    { value: 'user', label: 'Người dùng' },
    { value: 'tenant', label: 'Tổ chức' },
    { value: 'role', label: 'Vai trò' },
    { value: 'flag', label: 'Feature Flag' },
    { value: 'config', label: 'Cấu hình' },
    { value: 'subscription', label: 'Đăng ký' },
    { value: 'tournament', label: 'Giải đấu' },
]

const ACTION_OPTIONS = [
    { value: 'all', label: 'Tất cả hành động' },
    { value: 'CREATE', label: 'Tạo mới' },
    { value: 'UPDATE', label: 'Cập nhật' },
    { value: 'DELETE', label: 'Xóa' },
    { value: 'APPROVE', label: 'Phê duyệt' },
    { value: 'SUSPEND', label: 'Tạm ngưng' },
    { value: 'LOGIN', label: 'Đăng nhập' },
]

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════
export const Page_admin_audit_log = () => (
    <AdminGuard>
        <Page_admin_audit_log_Content />
    </AdminGuard>
)

const Page_admin_audit_log_Content = () => {
    const { t } = useI18n()
    const { data: entries, isLoading } = useAdminFetch<AuditEntry[]>('/admin/audit-log')
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [entityFilter, setEntityFilter] = useState('all')
    const [actionFilter, setActionFilter] = useState('all')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const logs = useMemo(() => entries ?? [], [entries])

    const filtered = useMemo(() => {
        return logs.filter(log => {
            const matchSearch = !debouncedSearch ||
                log.user_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                log.entity_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                log.entity_id.toLowerCase().includes(debouncedSearch.toLowerCase())
            const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter
            const matchAction = actionFilter === 'all' || log.action === actionFilter
            return matchSearch && matchEntity && matchAction
        })
    }, [logs, debouncedSearch, entityFilter, actionFilter])

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Activity size={20} />, label: 'Tổng sự kiện', value: logs.length, color: '#8b5cf6' },
        { icon: <VCT_Icons.AlertTriangle size={20} />, label: 'Thay đổi hôm nay', value: logs.filter(l => isToday(l.timestamp)).length, color: '#0ea5e9' },
        { icon: <VCT_Icons.Users size={20} />, label: 'Người dùng tham gia', value: new Set(logs.map(l => l.user_id)).size, color: '#10b981' },
        { icon: <VCT_Icons.Shield size={20} />, label: 'Hành động nguy hiểm', value: logs.filter(l => l.action === 'DELETE' || l.action === 'SUSPEND').length, color: '#ef4444' },
    ]

    const handleExport = useCallback(() => {
        exportToCSV({
            headers: ['Thời gian', 'Người dùng', 'Vai trò', 'Hành động', 'Đối tượng', 'Tên', 'IP'],
            rows: filtered.map(l => [
                l.timestamp, l.user_name, l.user_role,
                ACTION_BADGE[l.action]?.label ?? l.action,
                l.entity_type, l.entity_name, l.ip_address,
            ]),
            filename: `vct_audit_log_${new Date().toISOString().slice(0, 10)}.csv`,
        })
    }, [filtered])

    return (
        <AdminPageShell
            title={t('admin.audit.title')}
            subtitle={t('admin.audit.subtitle')}
            icon={<VCT_Icons.FileText size={28} className="text-[#8b5cf6]" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'Audit Log' },
            ]}
            stats={stats}
            actions={
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExport} aria-label="Xuất audit log">
                    Xuất CSV
                </VCT_Button>
            }
        >
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 min-w-[220px]">
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm theo tên, ID..." />
                </div>
                <VCT_Select value={entityFilter} onChange={setEntityFilter} options={ENTITY_OPTIONS} />
                <VCT_Select value={actionFilter} onChange={setActionFilter} options={ACTION_OPTIONS} />
            </div>

            {/* Table */}
            <AdminDataTable
                data={filtered}
                isLoading={isLoading}
                rowKey={l => l.id}
                emptyTitle="Chưa có log nào"
                emptyDescription="Audit log sẽ hiển thị khi có hoạt động"
                emptyIcon="📋"
                columns={[
                    {
                        key: 'timestamp',
                        label: 'Thời gian',
                        sortable: true,
                        render: (log) => (
                            <div className="text-xs">
                                <div className="font-bold text-(--vct-text-primary)">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</div>
                                <div className="text-(--vct-text-tertiary)">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</div>
                            </div>
                        ),
                    },
                    {
                        key: 'user_name',
                        label: 'Người thực hiện',
                        sortable: true,
                        render: (log) => (
                            <div>
                                <div className="font-bold text-(--vct-text-primary) text-sm">{log.user_name}</div>
                                <div className="text-[10px] text-(--vct-text-tertiary)">{log.user_role}</div>
                            </div>
                        ),
                    },
                    {
                        key: 'action',
                        label: 'Hành động',
                        sortable: true,
                        render: (log) => <VCT_Badge type={ACTION_BADGE[log.action]?.type ?? 'neutral'} text={ACTION_BADGE[log.action]?.label ?? log.action} />,
                    },
                    {
                        key: 'entity_type',
                        label: 'Đối tượng',
                        sortable: true,
                        render: (log) => (
                            <div>
                                <div className="font-bold text-(--vct-text-primary) text-sm">{log.entity_name}</div>
                                <div className="text-[10px] text-(--vct-text-tertiary) font-mono">{log.entity_type} · {log.entity_id.slice(0, 8)}</div>
                            </div>
                        ),
                    },
                    {
                        key: 'details',
                        label: 'Chi tiết',
                        sortable: false,
                        align: 'center',
                        render: (log) => {
                            const changeCount = Object.keys(log.changes ?? {}).length
                            return changeCount > 0 ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === log.id ? null : log.id) }}
                                    className="text-[10px] text-[#8b5cf6] font-bold hover:underline admin-focus-ring"
                                    aria-label={`Xem ${changeCount} thay đổi`}
                                >
                                    {changeCount} thay đổi
                                </button>
                            ) : <span className="text-(--vct-text-tertiary) text-[10px]">—</span>
                        },
                    },
                ]}
                onRowClick={(log) => setExpandedId(expandedId === log.id ? null : log.id)}
            />

            {/* Expanded change details */}
            {expandedId && (() => {
                const log = filtered.find(l => l.id === expandedId)
                if (!log || !log.changes || Object.keys(log.changes).length === 0) return null
                return (
                    <div className="mt-4 p-4 bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl" role="region" aria-label="Chi tiết thay đổi">
                        <h4 className="text-sm font-bold text-(--vct-text-primary) mb-3 flex items-center gap-2">
                            <VCT_Icons.FileText size={14} className="text-[#8b5cf6]" />
                            Chi tiết thay đổi — {log.entity_name}
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(log.changes).map(([field, { old: oldVal, new: newVal }]) => (
                                <div key={field} className="flex items-center gap-3 text-xs p-2 bg-(--vct-bg-base) rounded-lg border border-(--vct-border-subtle)">
                                    <span className="font-bold text-(--vct-text-secondary) min-w-[100px]">{field}</span>
                                    <span className="text-[#ef4444] line-through">{String(oldVal)}</span>
                                    <VCT_Icons.ArrowRight size={12} className="text-(--vct-text-tertiary)" />
                                    <span className="text-[#10b981] font-bold">{String(newVal)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-[10px] text-(--vct-text-tertiary) flex items-center gap-4">
                            <span>IP: {log.ip_address}</span>
                            <span>UA: {log.user_agent?.slice(0, 40)}...</span>
                        </div>
                    </div>
                )
            })()}
        </AdminPageShell>
    )
}

function isToday(dateStr: string): boolean {
    const d = new Date(dateStr)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}
