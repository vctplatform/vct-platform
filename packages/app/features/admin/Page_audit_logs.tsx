'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_SearchInput, VCT_Select, VCT_Button
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useDebounce } from '../hooks/useDebounce'
import { AdminGuard } from './components/AdminGuard'
import { exportToCSV } from './utils/adminExport'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface AuditLog {
    id: string
    timestamp: string
    actor: { id: string; name: string; email: string }
    action: string
    resource: string
    resource_id?: string
    status: 'success' | 'failure' | 'warning'
    ip_address: string
    details: string
    user_agent?: string
    payload?: string
}

const STATUS_BADGE: Record<string, { label: string; type: string }> = {
    success: { label: 'Thành công', type: 'success' },
    failure: { label: 'Thất bại', type: 'danger' },
    warning: { label: 'Cảnh báo', type: 'warning' },
}

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'var(--vct-status-success)',
    UPDATE: 'var(--vct-accent-blue)',
    DELETE: 'var(--vct-status-danger)',
    LOGIN: 'var(--vct-text-secondary)',
    BACKUP: 'var(--vct-status-warning)'
}


// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_audit_logs = () => (
    <AdminGuard>
        <Page_audit_logs_Content />
    </AdminGuard>
)

const Page_audit_logs_Content = () => {
    const { data: fetchedLogs, isLoading } = useAdminFetch<AuditLog[]>('/admin/audit-logs')
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterAction, setFilterAction] = useState('all')
    const [drawerLog, setDrawerLog] = useState<AuditLog | null>(null)
    const { showToast } = useShellToast()
    
    // AdminDataTable properties
    const [sortCol, setSortCol] = useState('timestamp')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    React.useEffect(() => { if (fetchedLogs) setLogs(fetchedLogs) }, [fetchedLogs])

    const filtered = useMemo(() => {
        let v = logs.filter(log => {
            const matchSearch = log.actor.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                                log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                                log.details.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                log.id.toLowerCase().includes(debouncedSearch.toLowerCase())
            const matchStatus = filterStatus === 'all' || log.status === filterStatus
            const matchAction = filterAction === 'all' || log.action === filterAction
            return matchSearch && matchStatus && matchAction
        })
        
        v = [...v].sort((a, b) => {
            const valA = String((a as any)[sortCol] || '').toLowerCase()
            const valB = String((b as any)[sortCol] || '').toLowerCase()
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return v
    }, [logs, debouncedSearch, filterStatus, filterAction, sortCol, sortDir])

    const handleSort = (key: string) => {
        if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortCol(key); setSortDir(key === 'timestamp' ? 'desc' : 'asc') }
    }

    const handleExport = () => {
        exportToCSV({
            headers: ['ID', 'Thời gian', 'Tài khoản', 'Thao tác', 'Tài nguyên', 'Trạng thái', 'Chi tiết', 'IP'],
            rows: filtered.map(l => [l.id, l.timestamp, l.actor.name, l.action, l.resource, l.status, l.details, l.ip_address]),
            filename: `vct_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`,
        })
        showToast(`Đã xuất ${filtered.length} nhật ký!`)
    }

    // Extract unique actions for filter
    const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs])

    return (
        <AdminPageShell
            title="Nhật Ký Hệ Thống (Audit Logs)"
            subtitle="Theo dõi và giám sát mọi hoạt động trên hệ thống VCT PLATFORM."
            icon={<VCT_Icons.Shield size={28} className="text-(--vct-info)" />}
            actions={
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExport}>Xuất CSV</VCT_Button>
            }
        >
            {/* ── FILTERS ── */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[250px]">
                    <VCT_SearchInput 
                        value={search} 
                        onChange={setSearch} 
                        placeholder="Tìm theo mã log, tài khoản, thao tác, chi tiết..." 
                    />
                </div>
                <div className="w-[180px]">
                    <VCT_Select 
                        value={filterStatus} 
                        onChange={setFilterStatus} 
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'success', label: 'Thành công' },
                            { value: 'failure', label: 'Thất bại' },
                            { value: 'warning', label: 'Cảnh báo' }
                        ]} 
                    />
                </div>
                <div className="w-[180px]">
                    <VCT_Select 
                        value={filterAction} 
                        onChange={setFilterAction} 
                        options={[
                            { value: 'all', label: 'Tất cả thao tác' },
                            ...uniqueActions.map(a => ({ value: a, label: a }))
                        ]} 
                    />
                </div>
            </div>

            {/* ── DATA TABLE ── */}
            <AdminDataTable
                data={filtered}
                isLoading={isLoading}
                sortBy={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                rowKey={log => log.id}
                emptyTitle="Không tìm thấy nhật ký"
                emptyDescription="Thử thay đổi bộ lọc tìm kiếm"
                emptyIcon="📝"
                columns={[
                    {
                        key: 'timestamp',
                        label: 'Thời gian',
                        sortable: true,
                        render: (log) => {
                            const date = new Date(log.timestamp)
                            return (
                                <div>
                                    <div className="font-mono text-sm text-(--vct-text-primary)">{date.toLocaleDateString('vi-VN')}</div>
                                    <div className="font-mono text-xs text-(--vct-text-tertiary)">{date.toLocaleTimeString('vi-VN')}</div>
                                </div>
                            )
                        }
                    },
                    {
                        key: 'actor',
                        label: 'Tài khoản (Actor)',
                        sortable: false,
                        render: (log) => (
                            <div>
                                <div className="font-bold text-sm text-(--vct-text-primary)">{log.actor.name}</div>
                                <div className="text-xs text-(--vct-text-secondary)">{log.actor.email}</div>
                                <div className="font-mono text-[10px] text-(--vct-text-tertiary) mt-0.5">{log.ip_address}</div>
                            </div>
                        )
                    },
                    {
                        key: 'action',
                        label: 'Thao tác',
                        sortable: true,
                        render: (log) => (
                            <span 
                                className="font-mono font-bold text-xs uppercase"
                                style={{ color: ACTION_COLORS[log.action] || 'var(--vct-text-primary)' }}
                            >
                                {log.action}
                            </span>
                        )
                    },
                    {
                        key: 'resource',
                        label: 'Tài nguyên',
                        sortable: true,
                        render: (log) => (
                            <div>
                                <div className="text-sm font-medium text-(--vct-text-primary)">{log.resource}</div>
                                {log.resource_id && (
                                    <div className="font-mono text-xs text-(--vct-text-tertiary)">{log.resource_id}</div>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'Trạng thái',
                        sortable: true,
                        align: 'center',
                        render: (log) => <VCT_Badge type={STATUS_BADGE[log.status]?.type ?? 'neutral'} text={STATUS_BADGE[log.status]?.label ?? log.status} />
                    },
                    {
                        key: 'details',
                        label: 'Chi tiết',
                        sortable: false,
                        render: (log) => <div className="text-sm text-(--vct-text-secondary) max-w-[300px] truncate" title={log.details}>{log.details}</div>
                    }
                ]}
                onRowClick={(item) => setDrawerLog(item)}
            />

            {/* ── LOG DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerLog} onClose={() => setDrawerLog(null)} title="Chi tiết Nhật ký" width={520}>
                {drawerLog && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_Badge type={STATUS_BADGE[drawerLog.status]?.type ?? 'neutral'} text={STATUS_BADGE[drawerLog.status]?.label ?? drawerLog.status} />
                            <span className="font-bold text-lg text-(--vct-text-primary) uppercase" style={{ color: ACTION_COLORS[drawerLog.action] }}>{drawerLog.action}</span>
                            <span className="ml-auto font-mono text-xs text-(--vct-text-tertiary)">{drawerLog.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-5">
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Thời gian</div><div className="font-mono text-(--vct-text-primary)">{new Date(drawerLog.timestamp).toLocaleString('vi-VN')}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Người dùng</div><div className="font-semibold text-(--vct-accent-cyan)">{drawerLog.actor.name}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Tài nguyên</div><div className="text-(--vct-text-primary)">{drawerLog.resource}{drawerLog.resource_id ? ` (${drawerLog.resource_id})` : ''}</div></div>
                            <div className="col-span-2"><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Địa chỉ IP</div><div className="font-mono text-(--vct-text-primary)">{drawerLog.ip_address}</div></div>
                        </div>
                        <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Chi tiết</div><div className="text-sm text-(--vct-text-primary) p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">{drawerLog.details}</div></div>
                        {drawerLog.user_agent && (
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">User Agent</div><div className="text-xs font-mono text-(--vct-text-secondary) p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">{drawerLog.user_agent}</div></div>
                        )}
                        {drawerLog.payload && (
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Request Payload</div><pre className="text-xs font-mono text-(--vct-text-secondary) p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) overflow-x-auto">{drawerLog.payload}</pre></div>
                        )}
                    </div>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}

