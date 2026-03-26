'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_EmptyState, VCT_FilterChips,
    VCT_AvatarLetter, VCT_BulkActionsBar,
} from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/provincial'

interface Club {
    id: string; name: string; short_name: string; code: string; district: string
    leader_name: string; leader_phone: string; status: string
    athlete_count: number; coach_count: number; founded_date: string
}

const STATUS_MAP: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Đình chỉ', type: 'error' },
    inactive: { label: 'Ngưng HĐ', type: 'neutral' },
}

export const Page_provincial_clubs = () => {
    const [clubs, setClubs] = useState<Club[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/clubs?province_id=PROV-HCM`, { headers })
                if (res.ok) {
                    const d = await res.json()
                    setClubs((d.data?.clubs || d.clubs) || [])
                }
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchData()
    }, [])

    const filtered = useMemo(() => {
        let data = clubs
        if (statusFilter) data = data.filter(c => c.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(c => c.name.toLowerCase().includes(q) || c.district?.toLowerCase().includes(q) || c.leader_name?.toLowerCase().includes(q))
        }
        return data
    }, [clubs, search, statusFilter])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [statusFilter, search])

    const totalAthletes = clubs.reduce((s, c) => s + (c.athlete_count || 0), 0)
    const totalCoaches = clubs.reduce((s, c) => s + (c.coach_count || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">🏠 Quản Lý Câu Lạc Bộ</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách CLB trực thuộc liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng CLB', value: clubs.length, icon: <VCT_Icons.Building2 size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'CLB hoạt động', value: clubs.filter(c => c.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-success)' },
                { label: 'Tổng VĐV', value: totalAthletes, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-warning)' },
                { label: 'Tổng HLV', value: totalCoaches, icon: <VCT_Icons.Award size={18} />, color: 'var(--vct-info)' },
            ] as StatItem[]} className="mb-6" />

            <VCT_FilterChips filters={activeFilters} onRemove={(k) => { if (k === 'status') setStatusFilter(null); if (k === 'search') setSearch('') }} onClearAll={() => { setStatusFilter(null); setSearch('') }} />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm CLB, quận/huyện, trưởng CLB..." />
                    </div>
                    <select value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent-cyan) transition-colors">
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm CLB sẽ có ở phiên bản tiếp theo', 'info')}>Thêm CLB</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có CLB nào" description={loading ? 'Đang tải...' : 'Thử thay đổi bộ lọc.'} icon="🏠" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {['CLB', 'Quận/Huyện', 'Trưởng CLB', 'VĐV', 'HLV', 'Trạng thái'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => {
                                const st = STATUS_MAP[c.status] || { label: c.status, type: 'neutral' }
                                return (
                                    <tr key={c.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <VCT_AvatarLetter name={c.name} size={36} />
                                                <div>
                                                    <div className="font-semibold text-sm">{c.name}</div>
                                                    <div className="text-xs opacity-50 font-mono">{c.code}</div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{c.district}</td>
                                        <td className="px-4 py-3 text-sm">{c.leader_name}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: 'var(--vct-accent-cyan)' }}>{c.athlete_count}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: 'var(--vct-info)' }}>{c.coach_count}</td>
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
