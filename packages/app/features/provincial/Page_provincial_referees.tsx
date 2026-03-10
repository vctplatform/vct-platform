'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Referee { id: string; full_name: string; gender: string; referee_rank: string; expertise: string; status: string }

export const Page_provincial_referees = () => {
    const [referees, setReferees] = useState<Referee[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/referees?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setReferees((d.data?.referees || d.referees) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return referees
        const q = search.toLowerCase()
        return referees.filter(r => r.full_name.toLowerCase().includes(q) || r.referee_rank?.toLowerCase().includes(q) || r.expertise?.toLowerCase().includes(q))
    }, [referees, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">⚖️ Quản Lý Trọng Tài</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Danh sách trọng tài thuộc liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng trọng tài', value: referees.length, icon: <VCT_Icons.Shield size={18} />, color: '#ef4444' },
                { label: 'Đang hoạt động', value: referees.filter(r => r.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm trọng tài, cấp bậc..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Thêm Trọng Tài</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có trọng tài nào" description={loading ? 'Đang tải...' : 'Không tìm thấy dữ liệu.'} icon="⚖️" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                            {['Trọng tài', 'Giới tính', 'Cấp bậc', 'Chuyên môn', 'Trạng thái'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} className="border-b border-[var(--vct-border-subtle)] hover:bg-[var(--vct-bg-hover)] transition-colors">
                                    <td className="px-4 py-3"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={r.full_name} size={36} /><div className="font-semibold text-sm">{r.full_name}</div></VCT_Stack></td>
                                    <td className="px-4 py-3 text-sm">{r.gender === 'nam' ? 'Nam' : 'Nữ'}</td>
                                    <td className="px-4 py-3"><VCT_Badge text={r.referee_rank || '—'} type="info" /></td>
                                    <td className="px-4 py-3 text-sm">{r.expertise || '—'}</td>
                                    <td className="px-4 py-3 text-center"><VCT_Badge text={r.status === 'active' ? 'Đang HĐ' : r.status} type={r.status === 'active' ? 'success' : 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
