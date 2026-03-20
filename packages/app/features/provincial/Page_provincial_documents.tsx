'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Doc { id: string; type: string; number: string; title: string; status: string; author: string; issued_date?: string }

const TYPE_MAP: Record<string, string> = { decision: 'Quyết định', dispatch: 'Công văn', notice: 'Thông báo', minutes: 'Biên bản' }
const STATUS_MAP: Record<string, { label: string; type: any }> = { draft: { label: 'Bản nháp', type: 'neutral' }, published: { label: 'Đã ban hành', type: 'success' }, archived: { label: 'Lưu trữ', type: 'info' } }

export const Page_provincial_documents = () => {
    const [docs, setDocs] = useState<Doc[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/documents?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setDocs((d.data?.documents || d.documents) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return docs
        const q = search.toLowerCase()
        return docs.filter(d => d.title.toLowerCase().includes(q) || d.number?.toLowerCase().includes(q) || d.author?.toLowerCase().includes(q))
    }, [docs, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">📄 Văn Bản & Công Văn</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý quyết định, công văn, thông báo liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng văn bản', value: docs.length, icon: <VCT_Icons.FileText size={18} />, color: '#0ea5e9' },
                { label: 'Đã ban hành', value: docs.filter(d => d.status === 'published').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Bản nháp', value: docs.filter(d => d.status === 'draft').length, icon: <VCT_Icons.Edit size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm văn bản, số hiệu..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Soạn Văn Bản</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Chưa có văn bản" description={loading ? 'Đang tải...' : 'Không tìm thấy dữ liệu.'} icon="📄" />
            ) : (
                <div className="space-y-3">
                    {filtered.map(d => {
                        const st = STATUS_MAP[d.status] || { label: d.status, type: 'neutral' }
                        return (
                            <div key={d.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 hover:border-(--vct-accent-cyan) transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <VCT_Badge text={TYPE_MAP[d.type] || d.type} type="info" />
                                            <span className="text-xs font-mono opacity-60">{d.number}</span>
                                        </div>
                                        <div className="font-semibold text-sm text-(--vct-text-primary)">{d.title}</div>
                                        <div className="text-xs text-(--vct-text-secondary) mt-1">
                                            ✍️ {d.author} {d.issued_date && `• 📅 ${d.issued_date}`}
                                        </div>
                                    </div>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
