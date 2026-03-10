'use client'

import * as React from 'react'
import { VCT_Badge, VCT_Stack } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// DISCIPLINE BOARD — DASHBOARD
// ════════════════════════════════════════

const CASE_SUMMARY = [
    { status: 'Đang điều tra', count: 3, color: '#0ea5e9' },
    { status: 'Chờ xét xử', count: 2, color: '#8b5cf6' },
    { status: 'Kháng cáo', count: 1, color: '#ef4444' },
    { status: 'Đã kết thúc (tháng này)', count: 5, color: '#10b981' },
]

const UPCOMING_HEARINGS = [
    { id: 'H-001', case: 'KL-2026/002', subject: 'VĐV Trần Minh K', violation: 'Sử dụng chất cấm', date: '2026-03-15', time: '09:00', venue: 'Phòng họp A — Trụ sở LĐ' },
    { id: 'H-002', case: 'KL-2026/001', subject: 'CLB Tân Phong', violation: 'Vi phạm quy chế thi đấu', date: '2026-03-18', time: '14:00', venue: 'Phòng họp B — Trụ sở LĐ' },
]

const RECENT_SANCTIONS = [
    { id: 'S-001', subject: 'HLV Phạm Văn N', type: 'Cảnh cáo', duration: '3 tháng', date: '2026-02-28' },
    { id: 'S-002', subject: 'CLB Bách Võ', type: 'Cấm thi đấu', duration: '1 năm', date: '2026-01-15' },
]

export const Page_discipline_dashboard = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Kỷ luật — Bảng điều khiển</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Tổng quan vụ việc kỷ luật, lịch xét xử và chế tài đã áp dụng.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Đang xử lý', value: 6, icon: <VCT_Icons.AlertCircle size={18} />, color: '#ef4444' },
                { label: 'Xét xử tuần này', value: 2, icon: <VCT_Icons.Calendar size={18} />, color: '#8b5cf6' },
                { label: 'Chế tài hiệu lực', value: 8, icon: <VCT_Icons.Shield size={18} />, color: '#f59e0b' },
                { label: 'KL tháng này', value: 5, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Case Pipeline */}
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-card)] p-5">
                    <h2 className="font-bold text-sm text-[var(--vct-text-primary)] mb-4">Phân bổ vụ việc</h2>
                    <div className="space-y-3">
                        {CASE_SUMMARY.map(cs => (
                            <div key={cs.status} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ background: cs.color }} />
                                    <span className="text-sm">{cs.status}</span>
                                </div>
                                <span className="text-lg font-bold" style={{ color: cs.color }}>{cs.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Hearings */}
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-card)] p-5 lg:col-span-2">
                    <h2 className="font-bold text-sm text-[var(--vct-text-primary)] mb-4">Lịch xét xử sắp tới</h2>
                    <div className="space-y-3">
                        {UPCOMING_HEARINGS.map(h => (
                            <div key={h.id} className="rounded-xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-4" style={{ borderLeft: '4px solid #8b5cf6' }}>
                                <VCT_Stack direction="row" justify="space-between" align="flex-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono opacity-60">{h.case}</span>
                                            <VCT_Badge text={h.violation} type="error" />
                                        </div>
                                        <div className="font-bold text-sm text-[var(--vct-text-primary)]">{h.subject}</div>
                                        <div className="text-xs opacity-50 mt-1">{h.venue}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-[#8b5cf6]">{h.date}</div>
                                        <div className="text-xs opacity-60">{h.time}</div>
                                    </div>
                                </VCT_Stack>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Sanctions */}
            <div className="mt-6 rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-card)] p-5">
                <h2 className="font-bold text-sm text-[var(--vct-text-primary)] mb-4">Chế tài gần đây</h2>
                <div className="overflow-hidden rounded-xl border border-[var(--vct-border-subtle)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-elevated)]">
                                <th className="p-3 text-left text-xs font-bold uppercase opacity-50">Đối tượng</th>
                                <th className="p-3 text-left text-xs font-bold uppercase opacity-50">Hình thức</th>
                                <th className="p-3 text-left text-xs font-bold uppercase opacity-50">Thời hạn</th>
                                <th className="p-3 text-left text-xs font-bold uppercase opacity-50">Ngày QĐ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_SANCTIONS.map(s => (
                                <tr key={s.id} className="border-t border-[var(--vct-border-subtle)]">
                                    <td className="p-3 text-sm font-bold">{s.subject}</td>
                                    <td className="p-3"><VCT_Badge text={s.type} type="error" /></td>
                                    <td className="p-3 text-sm">{s.duration}</td>
                                    <td className="p-3 text-sm opacity-60">{s.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
