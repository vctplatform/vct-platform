'use client'

import * as React from 'react'
import { useState } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — CẤU HÌNH QUY TRÌNH (WORKFLOW)
// ════════════════════════════════════════

interface WorkflowDef {
    id: string; code: string; name: string; description: string
    steps: number; isActive: boolean; category: string
    lastUpdated: string
}

const WORKFLOWS: WorkflowDef[] = [
    { id: '1', code: 'club_registration', name: 'Đăng ký CLB mới', description: 'Quy trình phê duyệt thành lập CLB Võ Cổ Truyền', steps: 3, isActive: true, category: 'CLB', lastUpdated: '2024-01-15' },
    { id: '2', code: 'belt_promotion', name: 'Thi thăng đai', description: 'Quy trình xét duyệt kết quả thi đai từ CLB → Tỉnh → LĐ', steps: 4, isActive: true, category: 'Đai', lastUpdated: '2024-02-01' },
    { id: '3', code: 'coach_certification', name: 'Cấp chứng chỉ HLV', description: 'Quy trình xét duyệt và cấp chứng chỉ huấn luyện viên', steps: 3, isActive: true, category: 'HLV', lastUpdated: '2024-01-20' },
    { id: '4', code: 'referee_certification', name: 'Cấp thẻ Trọng tài', description: 'Quy trình đào tạo và cấp thẻ trọng tài quốc gia', steps: 5, isActive: true, category: 'Trọng tài', lastUpdated: '2024-03-01' },
    { id: '5', code: 'tournament_approval', name: 'Phê duyệt Giải đấu', description: 'Quy trình phê duyệt tổ chức giải đấu cấp tỉnh/quốc gia', steps: 4, isActive: true, category: 'Giải đấu', lastUpdated: '2024-02-15' },
    { id: '6', code: 'discipline_case', name: 'Xử lý Kỷ luật', description: 'Quy trình điều tra, xét xử và ra quyết định kỷ luật', steps: 6, isActive: false, category: 'Kỷ luật', lastUpdated: '2023-12-01' },
    { id: '7', code: 'document_publish', name: 'Ban hành Văn bản', description: 'Quy trình soạn thảo, duyệt và ban hành công văn', steps: 3, isActive: true, category: 'Văn bản', lastUpdated: '2024-01-10' },
]

const CATEGORY_COLORS: Record<string, string> = {
    'CLB': '#10b981', 'Đai': '#f59e0b', 'HLV': '#8b5cf6',
    'Trọng tài': '#0ea5e9', 'Giải đấu': '#ef4444', 'Kỷ luật': '#f97316', 'Văn bản': '#6366f1',
}

const STEP_NAMES = ['Nộp hồ sơ', 'Xét duyệt cấp 1', 'Xét duyệt cấp 2', 'Phê duyệt cuối', 'Chứng nhận', 'Lưu trữ']

export function Page_federation_workflow_config() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const selected = WORKFLOWS.find(w => w.id === selectedId)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Cấu hình Quy trình</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">
                    Thiết lập và quản lý quy trình phê duyệt — bước xét duyệt, vai trò, điều kiện.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng quy trình', value: WORKFLOWS.length, icon: <VCT_Icons.Settings size={18} />, color: '#8b5cf6' },
                { label: 'Đang hoạt động', value: WORKFLOWS.filter(w => w.isActive).length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Tạm ngưng', value: WORKFLOWS.filter(w => !w.isActive).length, icon: <VCT_Icons.AlertTriangle size={18} />, color: '#ef4444' },
                { label: 'Tổng bước', value: WORKFLOWS.reduce((s, w) => s + w.steps, 0), icon: <VCT_Icons.List size={18} />, color: '#0ea5e9' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Workflow List ── */}
                <div className="lg:col-span-2 space-y-3">
                    {WORKFLOWS.map(w => (
                        <div key={w.id}
                            onClick={() => setSelectedId(w.id === selectedId ? null : w.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${w.id === selectedId
                                ? 'border-[var(--vct-accent-cyan)] bg-[var(--vct-bg-elevated)] shadow-lg'
                                : 'border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] hover:border-[var(--vct-accent-cyan)]'
                            }`}>
                            <VCT_Stack direction="row" justify="space-between" align="center">
                                <VCT_Stack direction="row" gap={12} align="center">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                        style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[w.category] || '#666'}, ${CATEGORY_COLORS[w.category] || '#666'}88)` }}>
                                        {w.steps}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-[var(--vct-text-primary)]">{w.name}</div>
                                        <div className="text-xs text-[var(--vct-text-secondary)]">{w.description}</div>
                                    </div>
                                </VCT_Stack>
                                <VCT_Stack direction="row" gap={8} align="center">
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ backgroundColor: (CATEGORY_COLORS[w.category] || '#666') + '20', color: CATEGORY_COLORS[w.category] }}>
                                        {w.category}
                                    </span>
                                    <VCT_Badge text={w.isActive ? 'Hoạt động' : 'Tạm ngưng'} type={w.isActive ? 'success' : 'neutral'} />
                                </VCT_Stack>
                            </VCT_Stack>
                        </div>
                    ))}
                </div>

                {/* ── Detail Panel ── */}
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">📋 Chi tiết Quy trình</h2>
                    {selected ? (
                        <div>
                            <div className="text-lg font-bold text-[var(--vct-text-primary)] mb-2">{selected.name}</div>
                            <div className="text-xs text-[var(--vct-text-secondary)] mb-4">{selected.description}</div>
                            <div className="text-xs text-[var(--vct-text-secondary)] mb-4">
                                Mã: <code className="px-1 py-0.5 rounded bg-[var(--vct-bg-elevated)]">{selected.code}</code>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="text-xs font-bold text-[var(--vct-text-primary)] uppercase">Các bước:</div>
                                {Array.from({ length: selected.steps }, (_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--vct-bg-elevated)]">
                                        <div className="w-6 h-6 rounded-full bg-[var(--vct-accent-cyan)] text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                                        <span className="text-sm text-[var(--vct-text-primary)]">{STEP_NAMES[i] || `Bước ${i + 1}`}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-[var(--vct-text-secondary)]">
                                Cập nhật: {selected.lastUpdated}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-3xl mb-3">⚙️</div>
                            <div className="text-sm text-[var(--vct-text-secondary)]">Chọn quy trình để xem chi tiết</div>
                        </div>
                    )}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
