'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { usePagination } from '../hooks/usePagination'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const MOCK_LOGS = [
    { id: 'LOG-001', timestamp: '2024-03-09 00:32:15', user: 'admin@vct.vn', role: 'admin', action: 'UPDATE', resource: 'Tournament Config', detail: 'Cập nhật thông tin giải: Giải Vô địch QG 2024', ip: '192.168.1.100', severity: 'info' },
    { id: 'LOG-002', timestamp: '2024-03-09 00:28:40', user: 'btc@vct.vn', role: 'btc', action: 'APPROVE', resource: 'Athlete', detail: 'Phê duyệt hồ sơ VĐV #ATH-156 Nguyễn Văn A', ip: '10.0.0.55', severity: 'info' },
    { id: 'LOG-003', timestamp: '2024-03-09 00:25:12', user: 'system', role: 'system', action: 'BACKUP', resource: 'Database', detail: 'Backup tự động PostgreSQL - 2.3GB', ip: 'internal', severity: 'info' },
    { id: 'LOG-004', timestamp: '2024-03-09 00:20:05', user: 'referee@vct.vn', role: 'referee', action: 'LOGIN', resource: 'Auth', detail: 'Đăng nhập từ thiết bị mới', ip: '172.16.0.22', severity: 'warning' },
    { id: 'LOG-005', timestamp: '2024-03-09 00:15:30', user: 'admin@vct.vn', role: 'admin', action: 'CREATE', resource: 'Belt Exam', detail: 'Tạo kỳ thi thăng cấp đai Q2/2024', ip: '192.168.1.100', severity: 'info' },
    { id: 'LOG-006', timestamp: '2024-03-08 23:58:45', user: 'unknown', role: 'anonymous', action: 'LOGIN_FAILED', resource: 'Auth', detail: 'Đăng nhập thất bại 5 lần liên tiếp', ip: '45.67.89.12', severity: 'error' },
    { id: 'LOG-007', timestamp: '2024-03-08 23:45:10', user: 'admin@vct.vn', role: 'admin', action: 'DELETE', resource: 'User', detail: 'Xóa tài khoản test_user_01', ip: '192.168.1.100', severity: 'warning' },
]

const SEVERITY_MAP: Record<string, { badge: React.ReactNode }> = {
    info: { badge: <VCT_Badge type="info" text="INFO" /> },
    warning: { badge: <VCT_Badge type="warning" text="WARNING" /> },
    error: { badge: <VCT_Badge type="danger" text="ERROR" /> },
}

// ════════════════════════════════════════
// SKELETON LOADER
// ════════════════════════════════════════
const SkeletonRow = () => (
    <tr>
        {[...Array(6)].map((_, i) => (
            <td key={i} className="p-4">
                <div className="h-4 bg-[var(--vct-bg-elevated)] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
            </td>
        ))}
    </tr>
)

// ════════════════════════════════════════
// PAGINATION BAR
// ════════════════════════════════════════
const PaginationBar = ({ currentPage, totalPages, totalItems, pageSize, hasPrev, hasNext, prev, next }: {
    currentPage: number; totalPages: number; totalItems: number; pageSize: number
    hasPrev: boolean; hasNext: boolean; prev: () => void; next: () => void
}) => totalPages <= 1 ? null : (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--vct-border-subtle)]">
        <span className="text-xs text-[var(--vct-text-tertiary)]">
            Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} / {totalItems}
        </span>
        <div className="flex gap-2">
            <button onClick={prev} disabled={!hasPrev} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">← Trước</button>
            <span className="px-3 py-1 text-xs text-[var(--vct-text-tertiary)]">{currentPage}/{totalPages}</span>
            <button onClick={next} disabled={!hasNext} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">Sau →</button>
        </div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_audit_logs = () => {
    const [search, setSearch] = useState('')
    const [severityFilter, setSeverityFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [drawerLog, setDrawerLog] = useState<typeof MOCK_LOGS[0] | null>(null)

    // Simulate initial loading
    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const filtered = useMemo(() => {
        let v = MOCK_LOGS
        if (severityFilter !== 'all') v = v.filter(l => l.severity === severityFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(l => l.user.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q))
        }
        return v
    }, [search, severityFilter])

    const pagination = usePagination(filtered, { pageSize: 5 })

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Nhật Ký Hệ Thống</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Theo dõi mọi hành động và thay đổi trong hệ thống.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Select
                        value={severityFilter}
                        onChange={setSeverityFilter}
                        options={[
                            { value: 'all', label: 'Tất cả mức độ' },
                            { value: 'info', label: 'Info' },
                            { value: 'warning', label: 'Warning' },
                            { value: 'error', label: 'Error' },
                        ]}
                    />
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        const header = 'Mức độ,Thời gian,Người dùng,Role,Hành động,Tài nguyên,Chi tiết,IP'
                        const csv = [header, ...filtered.map(l => `${l.severity},${l.timestamp},${l.user},${l.role},${l.action},${l.resource},"${l.detail}",${l.ip}`)].join('\n')
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `vct_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
                        URL.revokeObjectURL(url)
                    }}>Xuất CSV</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── SEARCH ── */}
            <div className="mb-6">
                <VCT_SearchInput placeholder="Tìm theo user, hành động, tài nguyên..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
            </div>

            {/* ── TABLE ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4 w-20">Mức độ</th>
                            <th className="p-4 w-44">Thời gian</th>
                            <th className="p-4 w-36">Người dùng</th>
                            <th className="p-4 w-28">Hành động</th>
                            <th className="p-4">Chi tiết</th>
                            <th className="p-4 w-32">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : pagination.paginatedItems.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-[var(--vct-text-tertiary)]">Không tìm thấy nhật ký nào</td></tr>
                        ) : (
                            pagination.paginatedItems.map(log => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawerLog(log)}>
                                    <td className="p-4">{SEVERITY_MAP[log.severity]?.badge}</td>
                                    <td className="p-4 font-mono text-[12px] text-[var(--vct-text-secondary)]">{log.timestamp}</td>
                                    <td className="p-4">
                                        <span className="font-semibold text-[var(--vct-accent-cyan)]">{log.user}</span>
                                        <div className="text-[10px] text-[var(--vct-text-tertiary)]">{log.role}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] px-2 py-0.5 rounded text-[10px] font-bold text-[var(--vct-text-primary)] uppercase">{log.action}</span>
                                    </td>
                                    <td className="p-4 text-[var(--vct-text-secondary)]">
                                        <div className="line-clamp-1">{log.detail}</div>
                                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-0.5">Resource: {log.resource}</div>
                                    </td>
                                    <td className="p-4 font-mono text-[11px] text-[var(--vct-text-tertiary)]">{log.ip}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && <PaginationBar {...pagination} />}
            </div>

            {/* ── LOG DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerLog} onClose={() => setDrawerLog(null)} title="Chi tiết Nhật ký" width={520}>
                {drawerLog && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-[var(--vct-border-subtle)]">
                            {SEVERITY_MAP[drawerLog.severity]?.badge}
                            <span className="font-bold text-lg text-[var(--vct-text-primary)] uppercase">{drawerLog.action}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">ID</div><div className="font-mono text-[var(--vct-accent-cyan)]">{drawerLog.id}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Thời gian</div><div className="font-mono text-[var(--vct-text-primary)]">{drawerLog.timestamp}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Người dùng</div><div className="font-semibold text-[var(--vct-accent-cyan)]">{drawerLog.user}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Role</div><div className="text-[var(--vct-text-primary)]">{drawerLog.role}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Tài nguyên</div><div className="text-[var(--vct-text-primary)]">{drawerLog.resource}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Địa chỉ IP</div><div className="font-mono text-[var(--vct-text-primary)]">{drawerLog.ip}</div></div>
                        </div>
                        <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Chi tiết</div><div className="text-sm text-[var(--vct-text-primary)] p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">{drawerLog.detail}</div></div>
                        <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-2">User Agent</div><div className="text-xs font-mono text-[var(--vct-text-secondary)] p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0</div></div>
                        <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-2">Request Payload</div><pre className="text-xs font-mono text-[var(--vct-text-secondary)] p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)] overflow-x-auto">{JSON.stringify({ action: drawerLog.action, resource: drawerLog.resource, timestamp: drawerLog.timestamp }, null, 2)}</pre></div>
                    </div>
                )}
            </VCT_Drawer>
        </div>
    )
}
