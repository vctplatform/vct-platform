'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Cert { id: string; type: string; holder_name: string; cert_number: string; level: string; issue_date: string; expiry_date?: string; status: string; issued_by: string }

const TYPE_MAP: Record<string, string> = { belt: 'Đẳng cấp', coach: 'HLV', referee: 'Trọng tài' }
const STATUS_MAP: Record<string, { label: string; type: any }> = { valid: { label: 'Hiệu lực', type: 'success' }, expired: { label: 'Hết hạn', type: 'warning' }, revoked: { label: 'Thu hồi', type: 'error' } }

export const Page_provincial_certifications = () => {
    const [certs, setCerts] = useState<Cert[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/certifications?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setCerts((d.data?.certifications || d.certifications) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return certs
        const q = search.toLowerCase()
        return certs.filter(c => c.holder_name.toLowerCase().includes(q) || c.cert_number?.toLowerCase().includes(q) || c.level?.toLowerCase().includes(q))
    }, [certs, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">📜 Chứng Nhận & Đẳng Cấp</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý chứng nhận đẳng cấp, HLV, trọng tài</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng chứng nhận', value: certs.length, icon: <VCT_Icons.Award size={18} />, color: '#f59e0b' },
                { label: 'Còn hiệu lực', value: certs.filter(c => c.status === 'valid').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Đẳng cấp', value: certs.filter(c => c.type === 'belt').length, icon: <VCT_Icons.Star size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm chứng nhận, người sở hữu..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Cấp Chứng Nhận</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Chưa có chứng nhận" description={loading ? 'Đang tải...' : 'Không tìm thấy dữ liệu.'} icon="📜" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                            {['Người sở hữu', 'Loại', 'Cấp bậc', 'Số CN', 'Ngày cấp', 'Hạn', 'Trạng thái'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.map(c => {
                                const st = STATUS_MAP[c.status] || { label: c.status, type: 'neutral' }
                                return (
                                    <tr key={c.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                        <td className="px-4 py-3"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={c.holder_name} size={36} /><div className="font-semibold text-sm">{c.holder_name}</div></VCT_Stack></td>
                                        <td className="px-4 py-3"><VCT_Badge text={TYPE_MAP[c.type] || c.type} type="info" /></td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#8b5cf6' }}>{c.level}</td>
                                        <td className="px-4 py-3 text-xs font-mono opacity-70">{c.cert_number}</td>
                                        <td className="px-4 py-3 text-sm">{c.issue_date}</td>
                                        <td className="px-4 py-3 text-sm">{c.expiry_date || '—'}</td>
                                        <td className="px-4 py-3 text-center"><VCT_Badge text={st.label} type={st.type} /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
