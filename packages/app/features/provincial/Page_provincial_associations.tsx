'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_EmptyState, VCT_FilterChips,
    VCT_AvatarLetter,
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Association {
    id: string; name: string; short_name: string; code: string; district: string
    president_name: string; president_phone: string; status: string
    total_sub_associations: number; total_clubs: number; total_athletes: number
    total_coaches: number; term: string; founded_date: string; decision_no: string
}

const STATUS_MAP: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Đình chỉ', type: 'error' },
    inactive: { label: 'Ngưng HĐ', type: 'neutral' },
    rejected: { label: 'Từ chối', type: 'error' },
}

export const Page_provincial_associations = () => {
    const [associations, setAssociations] = useState<Association[]>([])
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
                const res = await fetch(`${API}/associations?province_id=PROV-HCM`, { headers })
                if (res.ok) {
                    const d = await res.json()
                    setAssociations((d.data?.associations || d.associations) || [])
                }
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchData()
    }, [])

    const filtered = useMemo(() => {
        let data = associations
        if (statusFilter) data = data.filter(a => a.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.district?.toLowerCase().includes(q) ||
                a.president_name?.toLowerCase().includes(q)
            )
        }
        return data
    }, [associations, search, statusFilter])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [statusFilter, search])

    const totalClubs = associations.reduce((s, a) => s + (a.total_clubs || 0), 0)
    const totalAthletes = associations.reduce((s, a) => s + (a.total_athletes || 0), 0)
    const totalSubAssoc = associations.reduce((s, a) => s + (a.total_sub_associations || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">📋 Quản Lý Hội Quận/Huyện</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Danh sách Hội Võ cổ truyền cấp quận/huyện trực thuộc liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng Hội', value: associations.length, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
                { label: 'Hội hoạt động', value: associations.filter(a => a.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Tổng Chi hội', value: totalSubAssoc, icon: <VCT_Icons.MapPin size={18} />, color: '#f59e0b' },
                { label: 'Tổng CLB', value: totalClubs, icon: <VCT_Icons.Users size={18} />, color: '#8b5cf6' },
                { label: 'Tổng VĐV', value: totalAthletes, icon: <VCT_Icons.Award size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            <VCT_FilterChips filters={activeFilters} onRemove={(k) => { if (k === 'status') setStatusFilter(null); if (k === 'search') setSearch('') }} onClearAll={() => { setStatusFilter(null); setSearch('') }} />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm Hội, quận/huyện, chủ tịch..." />
                    </div>
                    <select value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] text-[var(--vct-text-primary)] text-sm rounded-lg px-3 py-2 outline-none focus:border-[var(--vct-accent-cyan)] transition-colors">
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm Hội sẽ có ở phiên bản tiếp theo', 'info')}>Thêm Hội</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có Hội nào" description={loading ? 'Đang tải...' : 'Thử thay đổi bộ lọc.'} icon="📋" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                {['Hội', 'Quận/Huyện', 'Chủ tịch', 'Chi hội', 'CLB', 'VĐV', 'Trạng thái'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const st = STATUS_MAP[a.status] || { label: a.status, type: 'neutral' }
                                return (
                                    <tr key={a.id} className="border-b border-[var(--vct-border-subtle)] hover:bg-[var(--vct-bg-hover)] transition-colors">
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <VCT_AvatarLetter name={a.name} size={36} />
                                                <div>
                                                    <div className="font-semibold text-sm">{a.name}</div>
                                                    <div className="text-xs opacity-50 font-mono">{a.code}</div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{a.district}</td>
                                        <td className="px-4 py-3 text-sm">{a.president_name}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: '#f59e0b' }}>{a.total_sub_associations}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: '#22d3ee' }}>{a.total_clubs}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: '#8b5cf6' }}>{a.total_athletes}</td>
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
