'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════════════════════════════
// PROVINCIAL — REPORTS (Báo cáo tổng hợp cấp tỉnh)
// ════════════════════════════════════════════════════════════════

const MOCK_REPORTS = [
    { id: 'rpt-001', title: 'Báo cáo quý 4/2025', type: 'QUARTERLY' as const, period: '2025-Q4', clubs: 8, vdv: 246, coaches: 20, events: 2, highlights: 'Tổ chức thành công giải trẻ toàn tỉnh', issues: 'Thiếu kinh phí tập huấn HLV', status: 'APPROVED' as string },
    { id: 'rpt-002', title: 'Báo cáo tháng 01/2026', type: 'MONTHLY' as const, period: '2026-01', clubs: 8, vdv: 250, coaches: 21, events: 0, highlights: 'Kế hoạch tuyển sinh đầu năm', issues: '', status: 'SUBMITTED' as string },
    { id: 'rpt-003', title: 'Báo cáo tổng kết năm 2025', type: 'ANNUAL' as const, period: '2025', clubs: 7, vdv: 235, coaches: 19, events: 5, highlights: '3 VĐV đạt HCV giải quốc gia. Thành lập thêm 1 CLB mới.', issues: 'Cần mở rộng cơ sở vật chất tập luyện', status: 'APPROVED' as string },
]

const TYPE_MAP: Record<string, string> = {
    MONTHLY: 'Hàng tháng',
    QUARTERLY: 'Hàng quý',
    ANNUAL: 'Hàng năm',
    EVENT: 'Sự kiện',
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Nháp', color: '#6b7280' },
    SUBMITTED: { label: 'Đã gửi', color: '#0ea5e9' },
    APPROVED: { label: 'Đã duyệt', color: '#10b981' },
}

export const Page_province_reports = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Báo cáo tổng hợp</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Báo cáo hoạt động và thống kê của Hội Võ thuật tỉnh.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng báo cáo', value: MOCK_REPORTS.length, icon: <VCT_Icons.FileText size={18} />, color: '#10b981' },
                { label: 'Đã duyệt', value: MOCK_REPORTS.filter(r => r.status === 'APPROVED').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Chờ duyệt', value: MOCK_REPORTS.filter(r => r.status === 'SUBMITTED').length, icon: <VCT_Icons.Clock size={18} />, color: '#0ea5e9' },
                { label: 'Nháp', value: MOCK_REPORTS.filter(r => r.status === 'DRAFT').length, icon: <VCT_Icons.Edit size={18} />, color: '#6b7280' },
            ] as StatItem[]} className="mb-6" />

            {/* Report List */}
            <div className="space-y-4">
                {MOCK_REPORTS.map(rpt => {
                    const s = STATUS_MAP[rpt.status] ?? { label: rpt.status, color: '#888' }
                    return (
                        <div key={rpt.id} className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-card)] p-6 hover:border-[var(--vct-accent-cyan)] transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--vct-text-primary)]">{rpt.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--vct-text-secondary)]">
                                        <span className="px-2 py-0.5 rounded bg-[var(--vct-bg-glass)]">{TYPE_MAP[rpt.type]}</span>
                                        <span>Kỳ: {rpt.period}</span>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: `${s.color}22`, color: s.color }}>
                                    {s.label}
                                </span>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-3 rounded-xl bg-[var(--vct-bg-glass)]">
                                    <div className="text-xl font-bold text-[var(--vct-text-primary)]">{rpt.clubs}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)]">CLB</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-[var(--vct-bg-glass)]">
                                    <div className="text-xl font-bold text-[var(--vct-text-primary)]">{rpt.vdv}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)]">VĐV</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-[var(--vct-bg-glass)]">
                                    <div className="text-xl font-bold text-[var(--vct-text-primary)]">{rpt.coaches}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)]">HLV</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-[var(--vct-bg-glass)]">
                                    <div className="text-xl font-bold text-[var(--vct-text-primary)]">{rpt.events}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)]">Sự kiện</div>
                                </div>
                            </div>

                            {/* Highlights & Issues */}
                            {rpt.highlights && (
                                <div className="text-sm mb-2">
                                    <span className="text-[var(--vct-text-secondary)]">Điểm nổi bật: </span>
                                    <span className="text-[var(--vct-text-primary)]">{rpt.highlights}</span>
                                </div>
                            )}
                            {rpt.issues && (
                                <div className="text-sm">
                                    <span className="text-[var(--vct-text-secondary)]">Vướng mắc: </span>
                                    <span className="text-[#f59e0b]">{rpt.issues}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </VCT_PageContainer>
    )
}
