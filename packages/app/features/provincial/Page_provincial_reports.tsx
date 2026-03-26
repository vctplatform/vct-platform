'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_EmptyState } from '@vct/ui'

export const Page_provincial_reports = () => {
    const reports = [
        { id: '1', title: 'Báo cáo hoạt động Q1/2026', icon: '📊', desc: 'Tổng hợp hoạt động liên đoàn tỉnh quý 1 năm 2026', status: 'Đã gửi' },
        { id: '2', title: 'Báo cáo tài chính năm 2025', icon: '💰', desc: 'Tổng kết thu chi, quyết toán ngân sách năm 2025', status: 'Đã duyệt' },
        { id: '3', title: 'Báo cáo giải đấu TP.HCM 2025', icon: '🏆', desc: 'Kết quả thi đấu, thành tích VĐV giải 2025', status: 'Đã gửi' },
        { id: '4', title: 'Báo cáo phát triển phong trào Q2/2026', icon: '📈', desc: 'Tình hình phát triển CLB, VĐV, HLV quý 2', status: 'Đang soạn' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">📊 Báo Cáo & Thống Kê</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Báo cáo hoạt động, tài chính, thống kê tổng hợp liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Báo cáo', value: reports.length, icon: <VCT_Icons.FileText size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Đã gửi', value: reports.filter(r => r.status === 'Đã gửi').length, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)' },
                { label: 'Đang soạn', value: reports.filter(r => r.status === 'Đang soạn').length, icon: <VCT_Icons.Edit size={18} />, color: 'var(--vct-warning)' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {reports.map(r => (
                    <div key={r.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">{r.icon}</div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-(--vct-text-primary)">{r.title}</div>
                                <div className="text-xs text-(--vct-text-secondary) mt-1">{r.desc}</div>
                                <div className="mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'Đang soạn' ? 'bg-amber-500/10 text-amber-500' : r.status === 'Đã duyệt' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'}`}>
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </VCT_PageContainer>
    )
}
