'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter } from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/provincial'

interface CommitteeMember { id: string; full_name: string; role: string; title: string; term: string; decision_no: string; start_date: string; is_active: boolean }

const ROLE_MAP: Record<string, string> = {
    president: 'Chủ tịch', vice_president: 'Phó Chủ tịch', secretary: 'Tổng Thư ký',
    technical_head: 'Trưởng ban CM', referee_head: 'Trưởng ban TT',
    committee_member: 'Ủy viên BCH', accountant: 'Kế toán',
}

export const Page_provincial_personnel = () => {
    const [members, setMembers] = useState<CommitteeMember[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/committee?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setMembers((d.data?.committee || d.committee) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return members
        const q = search.toLowerCase()
        return members.filter(m => m.full_name.toLowerCase().includes(q) || m.title?.toLowerCase().includes(q) || (ROLE_MAP[m.role] || m.role).toLowerCase().includes(q))
    }, [members, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">👥 Ban Chấp Hành</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Thành viên Ban Chấp hành Liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Thành viên BCH', value: members.length, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Đang hoạt động', value: members.filter(m => m.is_active).length, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-success)' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm thành viên BCH..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Thêm Thành Viên</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Chưa có dữ liệu BCH" description={loading ? 'Đang tải...' : 'Không tìm thấy dữ liệu.'} icon="👥" />
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(m => (
                        <div key={m.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5 hover:border-(--vct-accent-cyan) transition-colors">
                            <VCT_Stack direction="row" gap={12} align="center" className="mb-3">
                                <VCT_AvatarLetter name={m.full_name} size={48} />
                                <div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{m.full_name}</div>
                                    <VCT_Badge text={ROLE_MAP[m.role] || m.role} type="info" />
                                </div>
                            </VCT_Stack>
                            <div className="space-y-1.5 text-xs text-(--vct-text-secondary)">
                                <div><span className="font-semibold opacity-60">Chức danh:</span> {m.title}</div>
                                <div><span className="font-semibold opacity-60">Nhiệm kỳ:</span> {m.term}</div>
                                <div><span className="font-semibold opacity-60">QĐ bổ nhiệm:</span> {m.decision_no}</div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-(--vct-border-subtle)">
                                <VCT_Badge text={m.is_active ? 'Đang hoạt động' : 'Hết nhiệm kỳ'} type={m.is_active ? 'success' : 'neutral'} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </VCT_PageContainer>
    )
}
