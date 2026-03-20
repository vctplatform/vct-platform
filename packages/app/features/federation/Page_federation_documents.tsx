'use client'

import * as React from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useApiFetch } from './useApiFetch'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_EmptyState, VCT_FilterChips
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — OFFICIAL DOCUMENTS
// ════════════════════════════════════════

type DocType = 'decision' | 'circular' | 'regulation' | 'report' | 'certificate'
type DocStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'revoked'

interface OfficialDocument {
    id: string; number: string; title: string; type: DocType
    status: DocStatus; issued_by: string; issued_date: string; effective_date: string
}

const DOC_TYPE_MAP: Record<DocType, { label: string; color: string }> = {
    decision: { label: 'Quyết định', color: '#8b5cf6' },
    circular: { label: 'Thông báo', color: '#0ea5e9' },
    regulation: { label: 'Quy chế', color: '#ef4444' },
    report: { label: 'Báo cáo', color: '#f59e0b' },
    certificate: { label: 'Chứng nhận', color: '#10b981' },
}

const STATUS_MAP: Record<DocStatus, { label: string; type: any }> = {
    draft: { label: 'Bản nháp', type: 'neutral' },
    pending_approval: { label: 'Chờ duyệt', type: 'warning' },
    approved: { label: 'Đã duyệt', type: 'info' },
    published: { label: 'Đã ban hành', type: 'success' },
    revoked: { label: 'Đã thu hồi', type: 'error' },
}

const FALLBACK_DOCS: OfficialDocument[] = [
    { id: 'DOC-001', number: 'QĐ-2026/001', title: 'Quyết định ban hành Quy chế thi đấu Võ cổ truyền 2026', type: 'decision', status: 'published', issued_by: 'Chủ tịch LĐ', issued_date: '2026-01-15', effective_date: '2026-02-01' },
    { id: 'DOC-002', number: 'TB-2026/045', title: 'Thông báo tổ chức Giải vô địch Quốc gia 2026', type: 'circular', status: 'published', issued_by: 'Tổng thư ký', issued_date: '2026-02-20', effective_date: '2026-02-20' },
    { id: 'DOC-003', number: 'QC-2026/003', title: 'Quy chế xếp hạng VĐV Quốc gia (sửa đổi)', type: 'regulation', status: 'pending_approval', issued_by: 'Ban Kỹ thuật', issued_date: '2026-03-01', effective_date: '' },
    { id: 'DOC-004', number: 'BC-2026/012', title: 'Báo cáo tổng kết hoạt động Quý I/2026', type: 'report', status: 'draft', issued_by: 'Văn phòng LĐ', issued_date: '2026-03-10', effective_date: '' },
    { id: 'DOC-005', number: 'CN-2026/089', title: 'Chứng nhận thành lập CLB Võ Phong Vũ', type: 'certificate', status: 'approved', issued_by: 'Tổng thư ký', issued_date: '2026-03-05', effective_date: '2026-03-05' },
]

export const Page_federation_documents = () => {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // ── API Fetch ────────────────────────────────────────
    const docsApi = useApiFetch<OfficialDocument[]>()

    useEffect(() => {
        docsApi.execute('/documents')
    }, [])  

    const docs = docsApi.data?.length ? docsApi.data : FALLBACK_DOCS

    const filtered = useMemo(() => {
        let data = docs
        if (typeFilter) data = data.filter(d => d.type === typeFilter)
        if (statusFilter) data = data.filter(d => d.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(d => d.title.toLowerCase().includes(q) || d.number.toLowerCase().includes(q))
        }
        return data
    }, [search, typeFilter, statusFilter, docs])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (typeFilter) f.push({ key: 'type', label: 'Loại', value: DOC_TYPE_MAP[typeFilter as DocType]?.label || typeFilter })
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter as DocStatus]?.label || statusFilter })
        return f
    }, [typeFilter, statusFilter])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Văn bản Pháp quy</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý quyết định, thông báo, quy chế và công văn chính thức của Liên đoàn.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng văn bản', value: docs.length, icon: <VCT_Icons.FileText size={18} />, color: '#8b5cf6' },
                { label: 'Đã ban hành', value: docs.filter(d => d.status === 'published').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Chờ duyệt', value: docs.filter(d => d.status === 'pending_approval').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Bản nháp', value: docs.filter(d => d.status === 'draft').length, icon: <VCT_Icons.Edit size={18} />, color: '#64748b' },
            ] as StatItem[]} className="mb-6" />

            <VCT_FilterChips filters={activeFilters} onRemove={(k) => { if (k === 'type') setTypeFilter(''); if (k === 'status') setStatusFilter(''); }} onClearAll={() => { setTypeFilter(''); setStatusFilter(''); }} />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm văn bản, số văn bản..." />
                    </div>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả loại</option>
                        {Object.entries(DOC_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { }}>Soạn văn bản</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có văn bản nào" description="Thử thay đổi bộ lọc hoặc soạn văn bản mới." icon="📄" />
            ) : (
                <div className="space-y-3">
                    {filtered.map(doc => {
                        const dt = DOC_TYPE_MAP[doc.type]
                        const st = STATUS_MAP[doc.status]
                        return (
                            <div key={doc.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer" style={{ borderLeft: `4px solid ${dt.color}` }}>
                                <VCT_Stack direction="row" justify="space-between" align="flex-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: dt.color + '15', color: dt.color }}>{dt.label}</span>
                                            <span className="text-xs font-mono opacity-60">{doc.number}</span>
                                        </div>
                                        <div className="font-bold text-sm text-(--vct-text-primary) leading-relaxed">{doc.title}</div>
                                        <div className="text-xs opacity-50 mt-1">{doc.issued_by} • {doc.issued_date}{doc.effective_date && ` • Hiệu lực: ${doc.effective_date}`}</div>
                                    </div>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </VCT_Stack>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
