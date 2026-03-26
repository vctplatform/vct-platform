'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState } from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/provincial'

interface DisciplineCase { id: string; subject_name: string; subject_type: string; violation: string; severity: string; status: string; penalty?: string; reported_at: string }

const SEVERITY_MAP: Record<string, { label: string; type: any }> = { minor: { label: 'Nhẹ', type: 'info' }, moderate: { label: 'Trung bình', type: 'warning' }, severe: { label: 'Nghiêm trọng', type: 'error' } }
const STATUS_MAP: Record<string, { label: string; type: any }> = { open: { label: 'Mở', type: 'warning' }, investigating: { label: 'Đang xử lý', type: 'info' }, resolved: { label: 'Đã xử lý', type: 'success' }, closed: { label: 'Đã đóng', type: 'neutral' } }

export const Page_provincial_discipline = () => {
    const [cases, setCases] = useState<DisciplineCase[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/discipline?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setCases((d.data?.cases || d.cases) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">⚠️ Kỷ Luật & Xử Phạt</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý các vụ vi phạm kỷ luật cấp tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng vụ việc', value: cases.length, icon: <VCT_Icons.Shield size={18} />, color: 'var(--vct-danger)' },
                { label: 'Đang mở', value: cases.filter(c => c.status === 'open').length, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-warning)' },
                { label: 'Đã xử lý', value: cases.filter(c => c.status === 'resolved').length, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)' },
            ] as StatItem[]} className="mb-6" />

            <div className="mb-5 flex justify-end">
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Tạo Vụ Việc</VCT_Button>
            </div>

            {cases.length === 0 ? (
                <VCT_EmptyState title="Chưa có vụ vi phạm nào" description={loading ? 'Đang tải...' : 'Không có vụ kỷ luật ghi nhận.'} icon="⚠️" />
            ) : (
                <div className="space-y-4">
                    {cases.map(c => {
                        const sev = SEVERITY_MAP[c.severity] || { label: c.severity, type: 'neutral' }
                        const st = STATUS_MAP[c.status] || { label: c.status, type: 'neutral' }
                        return (
                            <div key={c.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-bold text-sm">{c.subject_name} <span className="text-xs opacity-50">({c.subject_type === 'athlete' ? 'VĐV' : c.subject_type === 'coach' ? 'HLV' : c.subject_type})</span></div>
                                        <div className="text-xs text-(--vct-text-secondary) mt-1">{c.violation}</div>
                                    </div>
                                    <VCT_Stack direction="row" gap={6}>
                                        <VCT_Badge text={sev.label} type={sev.type} />
                                        <VCT_Badge text={st.label} type={st.type} />
                                    </VCT_Stack>
                                </div>
                                {c.penalty && <div className="mt-2 text-xs"><span className="font-semibold opacity-60">Hình phạt:</span> {c.penalty}</div>}
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
