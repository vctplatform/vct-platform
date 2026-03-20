'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Coach { id: string; full_name: string; gender: string; club_name: string; belt_rank: string; cert_level: string; experience_years: number; specialties: string[]; status: string }

export const Page_provincial_coaches = () => {
    const [coaches, setCoaches] = useState<Coach[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/coaches?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setCoaches((d.data?.coaches || d.coaches) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return coaches
        const q = search.toLowerCase()
        return coaches.filter(c => c.full_name.toLowerCase().includes(q) || c.club_name?.toLowerCase().includes(q) || c.cert_level?.toLowerCase().includes(q))
    }, [coaches, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">👨‍🏫 Quản Lý Huấn Luyện Viên</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách HLV thuộc liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng HLV', value: coaches.length, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
                { label: 'Đang hoạt động', value: coaches.filter(c => c.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Kinh nghiệm TB', value: coaches.length > 0 ? `${Math.round(coaches.reduce((s, c) => s + (c.experience_years || 0), 0) / coaches.length)} năm` : '—', icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm HLV, CLB, cấp chứng chỉ..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Thêm HLV</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có HLV nào" description={loading ? 'Đang tải...' : 'Không tìm thấy dữ liệu.'} icon="👨‍🏫" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                            {['HLV', 'CLB', 'Đẳng cấp', 'Cấp HLV', 'Kinh nghiệm', 'Chuyên môn', 'Trạng thái'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                    <td className="px-4 py-3"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={c.full_name} size={36} /><div className="font-semibold text-sm">{c.full_name}</div></VCT_Stack></td>
                                    <td className="px-4 py-3 text-sm">{c.club_name}</td>
                                    <td className="px-4 py-3"><VCT_Badge text={c.belt_rank || '—'} type="info" /></td>
                                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#8b5cf6' }}>{c.cert_level}</td>
                                    <td className="px-4 py-3 text-sm text-center">{c.experience_years} năm</td>
                                    <td className="px-4 py-3 text-sm">{c.specialties?.join(', ') || '—'}</td>
                                    <td className="px-4 py-3 text-center"><VCT_Badge text={c.status === 'active' ? 'Đang HĐ' : c.status} type={c.status === 'active' ? 'success' : 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
