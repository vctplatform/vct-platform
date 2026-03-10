'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useApiFetch } from './useApiFetch'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — APPROVAL CENTER
// ════════════════════════════════════════

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated'
type ApprovalType = 'club_registration' | 'tournament_hosting' | 'document_publish' | 'personnel_change' | 'budget_approval'

interface ApprovalRequest {
    id: string; type: ApprovalType; title: string; requester: string
    status: ApprovalStatus; submitted_at: string; priority: 'normal' | 'urgent'
    current_step: string; total_steps: number; current_step_num: number
}

const TYPE_MAP: Record<ApprovalType, { label: string; color: string; icon: string }> = {
    club_registration: { label: 'Đăng ký CLB', color: '#10b981', icon: '🏢' },
    tournament_hosting: { label: 'Tổ chức giải', color: '#0ea5e9', icon: '🏆' },
    document_publish: { label: 'Văn bản', color: '#8b5cf6', icon: '📄' },
    personnel_change: { label: 'Nhân sự', color: '#f59e0b', icon: '👥' },
    budget_approval: { label: 'Ngân sách', color: '#ec4899', icon: '💰' },
}

const STATUS_MAP: Record<ApprovalStatus, { label: string; type: any }> = {
    pending: { label: 'Chờ duyệt', type: 'warning' },
    approved: { label: 'Đã duyệt', type: 'success' },
    rejected: { label: 'Từ chối', type: 'error' },
    escalated: { label: 'Chuyển cấp', type: 'info' },
}

const FALLBACK_APPROVALS: ApprovalRequest[] = [
    { id: 'APR-001', type: 'club_registration', title: 'Đăng ký thành lập CLB Thiên Phong Võ Đường', requester: 'Nguyễn Văn A', status: 'pending', submitted_at: '2026-03-08', priority: 'normal', current_step: 'Thư ký xem xét', total_steps: 3, current_step_num: 1 },
    { id: 'APR-002', type: 'tournament_hosting', title: 'Giải vô địch tỉnh Bình Định 2026', requester: 'LĐ Bình Định', status: 'pending', submitted_at: '2026-03-05', priority: 'urgent', current_step: 'Ban kỹ thuật thẩm định', total_steps: 4, current_step_num: 2 },
    { id: 'APR-003', type: 'document_publish', title: 'QĐ ban hành quy chế xếp hạng VĐV 2026', requester: 'Ban Kỹ thuật', status: 'escalated', submitted_at: '2026-03-01', priority: 'normal', current_step: 'Chủ tịch phê duyệt', total_steps: 3, current_step_num: 3 },
    { id: 'APR-004', type: 'personnel_change', title: 'Bổ nhiệm Phó ban Trọng tài', requester: 'Ban BCH', status: 'approved', submitted_at: '2026-02-20', priority: 'normal', current_step: 'Hoàn tất', total_steps: 2, current_step_num: 2 },
    { id: 'APR-005', type: 'budget_approval', title: 'Ngân sách tập huấn trọng tài khu vực phía Nam', requester: 'Ban Trọng tài', status: 'pending', submitted_at: '2026-03-07', priority: 'urgent', current_step: 'Tài chính xem xét', total_steps: 3, current_step_num: 1 },
]

export const Page_federation_approvals = () => {
    const [tab, setTab] = useState<'pending' | 'all'>('pending')
    const [search, setSearch] = useState('')

    // ── API Fetch ────────────────────────────────────────
    const approvalsApi = useApiFetch<{ requests: ApprovalRequest[] }>()

    useEffect(() => {
        approvalsApi.execute('/approvals/my-pending')
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const approvals = approvalsApi.data?.requests?.length ? approvalsApi.data.requests : FALLBACK_APPROVALS

    const data = useMemo(() => {
        let list = approvals
        if (tab === 'pending') list = list.filter(a => ['pending', 'escalated'].includes(a.status))
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(a => a.title.toLowerCase().includes(q) || a.requester.toLowerCase().includes(q))
        }
        return list
    }, [tab, search, approvals])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Trung tâm Phê duyệt</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Xử lý yêu cầu đăng ký, phê duyệt văn bản, nhân sự và ngân sách.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Chờ xử lý', value: approvals.filter(a => a.status === 'pending').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Chuyển cấp', value: approvals.filter(a => a.status === 'escalated').length, icon: <VCT_Icons.Chevron size={18} />, color: '#8b5cf6' },
                { label: 'Đã duyệt', value: approvals.filter(a => a.status === 'approved').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Khẩn cấp', value: approvals.filter(a => a.priority === 'urgent').length, icon: <VCT_Icons.AlertCircle size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={8} className="mb-5">
                {(['pending', 'all'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm font-bold transition-colors" style={{ background: tab === t ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-elevated)', color: tab === t ? '#000' : 'var(--vct-text-secondary)' }}>
                        {t === 'pending' ? 'Chờ xử lý' : 'Tất cả'}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="w-[280px]">
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm yêu cầu..." />
                </div>
            </VCT_Stack>

            {data.length === 0 ? (
                <VCT_EmptyState title="Không có yêu cầu nào" description="Tất cả đã được xử lý!" icon="✅" />
            ) : (
                <div className="space-y-3">
                    {data.map(a => {
                        const tp = TYPE_MAP[a.type]
                        const st = STATUS_MAP[a.status]
                        const progress = (a.current_step_num / a.total_steps) * 100
                        return (
                            <div key={a.id} className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-4 hover:border-[var(--vct-accent-cyan)] transition-colors cursor-pointer">
                                <VCT_Stack direction="row" justify="space-between" align="flex-start">
                                    <VCT_Stack direction="row" gap={12} align="flex-start" className="flex-1 min-w-0">
                                        <span className="text-2xl">{tp.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: tp.color + '15', color: tp.color }}>{tp.label}</span>
                                                {a.priority === 'urgent' && <span className="text-xs px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] font-bold">🔥 Khẩn</span>}
                                            </div>
                                            <div className="font-bold text-sm text-[var(--vct-text-primary)]">{a.title}</div>
                                            <div className="text-xs opacity-50 mt-1">Người gửi: {a.requester} • {a.submitted_at}</div>
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                    <span className="opacity-60">{a.current_step}</span>
                                                    <span className="font-bold">{a.current_step_num}/{a.total_steps}</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-[var(--vct-bg-elevated)] overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: tp.color }} />
                                                </div>
                                            </div>
                                        </div>
                                    </VCT_Stack>
                                    <VCT_Stack gap={8} align="flex-end">
                                        <VCT_Badge text={st.label} type={st.type} />
                                        {a.status === 'pending' && (
                                            <VCT_Stack direction="row" gap={4}>
                                                <VCT_Button variant="secondary" onClick={() => { }} style={{ fontSize: 11, padding: '4px 10px' }}>Từ chối</VCT_Button>
                                                <VCT_Button onClick={() => { }} style={{ fontSize: 11, padding: '4px 10px' }}>Duyệt</VCT_Button>
                                            </VCT_Stack>
                                        )}
                                    </VCT_Stack>
                                </VCT_Stack>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
