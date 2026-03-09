'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

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
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_audit_logs = () => {
    const [search, setSearch] = useState('')
    const [severityFilter, setSeverityFilter] = useState('all')

    const filtered = useMemo(() => {
        let v = MOCK_LOGS
        if (severityFilter !== 'all') v = v.filter(l => l.severity === severityFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(l => l.user.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q))
        }
        return v
    }, [search, severityFilter])

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
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất CSV</VCT_Button>
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
                        {filtered.map(log => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors text-sm">
                                <td className="p-4">{(SEVERITY_MAP as any)[log.severity]?.badge}</td>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
