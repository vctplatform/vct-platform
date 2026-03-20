'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useWorkflowDefs, type WorkflowDefinition } from '../hooks/useFederationAPI'

// ════════════════════════════════════════
// FEDERATION — CẤU HÌNH QUY TRÌNH (WORKFLOW)
// (Wired to /api/v1/federation/workflows)
// ════════════════════════════════════════

const CATEGORY_COLORS: Record<string, string> = {
    'CLB': '#10b981', 'Đai': '#f59e0b', 'HLV': '#8b5cf6',
    'Trọng tài': '#0ea5e9', 'Giải đấu': '#ef4444', 'Kỷ luật': '#f97316', 'Văn bản': '#6366f1',
}

export function Page_federation_workflow_config() {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const { data: rawData, isLoading } = useWorkflowDefs()

    const workflows: WorkflowDefinition[] = useMemo(() => {
        if (rawData && Array.isArray(rawData)) return rawData
        if (rawData && typeof rawData === 'object' && 'items' in rawData) return (rawData as { items: WorkflowDefinition[] }).items
        return []
    }, [rawData])

    const selected = workflows.find(w => w.id === selectedId)
    const activeCount = workflows.filter(w => w.is_active).length
    const totalSteps = workflows.reduce((s, w) => s + (w.steps?.length || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    Cấu hình Quy trình
                    {isLoading && <span className="ml-2 text-sm font-normal text-(--vct-accent-cyan)">Đang tải...</span>}
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">
                    Thiết lập và quản lý quy trình phê duyệt — bước xét duyệt, vai trò, điều kiện.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng quy trình', value: workflows.length, icon: <VCT_Icons.Settings size={18} />, color: '#8b5cf6' },
                { label: 'Đang hoạt động', value: activeCount, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Tạm ngưng', value: workflows.length - activeCount, icon: <VCT_Icons.AlertTriangle size={18} />, color: '#ef4444' },
                { label: 'Tổng bước', value: totalSteps, icon: <VCT_Icons.List size={18} />, color: '#0ea5e9' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ── Workflow List ── */}
                <div className="lg:col-span-2 space-y-3">
                    {workflows.map(w => (
                        <div key={w.id}
                            onClick={() => setSelectedId(w.id === selectedId ? null : w.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${w.id === selectedId
                                ? 'border-(--vct-accent-cyan) bg-(--vct-bg-elevated) shadow-lg'
                                : 'border-(--vct-border-subtle) bg-(--vct-bg-glass) hover:border-(--vct-accent-cyan)'
                            }`}>
                            <VCT_Stack direction="row" justify="space-between" align="center">
                                <VCT_Stack direction="row" gap={12} align="center">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                        style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[w.category] || '#666'}, ${CATEGORY_COLORS[w.category] || '#666'}88)` }}>
                                        {w.steps?.length || 0}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-(--vct-text-primary)">{w.name}</div>
                                        <div className="text-xs text-(--vct-text-secondary)">{w.description}</div>
                                    </div>
                                </VCT_Stack>
                                <VCT_Stack direction="row" gap={8} align="center">
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ backgroundColor: (CATEGORY_COLORS[w.category] || '#666') + '20', color: CATEGORY_COLORS[w.category] }}>
                                        {w.category}
                                    </span>
                                    <VCT_Badge text={w.is_active ? 'Hoạt động' : 'Tạm ngưng'} type={w.is_active ? 'success' : 'neutral'} />
                                </VCT_Stack>
                            </VCT_Stack>
                        </div>
                    ))}
                    {workflows.length === 0 && !isLoading && (
                        <p className="text-sm text-(--vct-text-secondary) text-center py-8">Chưa có quy trình nào.</p>
                    )}
                </div>

                {/* ── Detail Panel ── */}
                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5">
                    <h2 className="text-sm font-bold text-(--vct-text-primary) mb-4 uppercase tracking-wide">📋 Chi tiết Quy trình</h2>
                    {selected ? (
                        <div>
                            <div className="text-lg font-bold text-(--vct-text-primary) mb-2">{selected.name}</div>
                            <div className="text-xs text-(--vct-text-secondary) mb-4">{selected.description}</div>
                            <div className="text-xs text-(--vct-text-secondary) mb-4">
                                Mã: <code className="px-1 py-0.5 rounded bg-(--vct-bg-elevated)">{selected.code}</code>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="text-xs font-bold text-(--vct-text-primary) uppercase">Các bước:</div>
                                {(selected.steps || []).map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-(--vct-bg-elevated)">
                                        <div className="w-6 h-6 rounded-full bg-(--vct-accent-cyan) text-white text-xs font-bold flex items-center justify-center">{step.order || i + 1}</div>
                                        <div className="flex-1">
                                            <span className="text-sm text-(--vct-text-primary)">{step.name}</span>
                                            {step.role_code && (
                                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-(--vct-bg-glass) text-(--vct-text-secondary)">{step.role_code}</span>
                                            )}
                                        </div>
                                        {step.auto_approve && <VCT_Badge text="Tự động" type="info" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-3xl mb-3">⚙️</div>
                            <div className="text-sm text-(--vct-text-secondary)">Chọn quy trình để xem chi tiết</div>
                        </div>
                    )}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
