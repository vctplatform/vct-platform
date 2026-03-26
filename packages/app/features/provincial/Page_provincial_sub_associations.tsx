'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_EmptyState, VCT_FilterChips,
    VCT_AvatarLetter,
} from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/provincial'

interface SubAssociation {
    id: string; name: string; short_name: string; code: string; ward: string
    association_id: string; association_name: string
    leader_name: string; leader_phone: string; status: string
    total_clubs: number; total_athletes: number; founded_date: string
}

interface Association {
    id: string; name: string; district: string
}

const STATUS_MAP: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Đình chỉ', type: 'error' },
    inactive: { label: 'Ngưng HĐ', type: 'neutral' },
    rejected: { label: 'Từ chối', type: 'error' },
}

export const Page_provincial_sub_associations = () => {
    const [subAssociations, setSubAssociations] = useState<SubAssociation[]>([])
    const [associations, setAssociations] = useState<Association[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [assocFilter, setAssocFilter] = useState<string | null>(null)
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

                const [subRes, assocRes] = await Promise.all([
                    fetch(`${API}/sub-associations?province_id=PROV-HCM`, { headers }),
                    fetch(`${API}/associations?province_id=PROV-HCM`, { headers }),
                ])

                if (subRes.ok) {
                    const d = await subRes.json()
                    setSubAssociations((d.data?.sub_associations || d.sub_associations) || [])
                }
                if (assocRes.ok) {
                    const d = await assocRes.json()
                    setAssociations((d.data?.associations || d.associations) || [])
                }
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchData()
    }, [])

    const filtered = useMemo(() => {
        let data = subAssociations
        if (statusFilter) data = data.filter(s => s.status === statusFilter)
        if (assocFilter) data = data.filter(s => s.association_id === assocFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.ward?.toLowerCase().includes(q) ||
                s.leader_name?.toLowerCase().includes(q) ||
                s.association_name?.toLowerCase().includes(q)
            )
        }
        return data
    }, [subAssociations, search, statusFilter, assocFilter])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (assocFilter) {
            const a = associations.find(x => x.id === assocFilter)
            f.push({ key: 'assoc', label: 'Hội', value: a?.name || assocFilter })
        }
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [statusFilter, assocFilter, search, associations])

    const totalClubs = subAssociations.reduce((s, a) => s + (a.total_clubs || 0), 0)
    const totalAthletes = subAssociations.reduce((s, a) => s + (a.total_athletes || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">📌 Quản Lý Chi Hội Phường/Xã</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách Chi hội Võ cổ truyền cấp phường/xã trực thuộc Hội quận/huyện</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng Chi hội', value: subAssociations.length, icon: <VCT_Icons.MapPin size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Chi hội hoạt động', value: subAssociations.filter(s => s.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-success)' },
                { label: 'Chờ duyệt', value: subAssociations.filter(s => s.status === 'pending').length, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-warning)' },
                { label: 'Tổng CLB', value: totalClubs, icon: <VCT_Icons.Building2 size={18} />, color: 'var(--vct-info)' },
                { label: 'Tổng VĐV', value: totalAthletes, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-danger)' },
            ] as StatItem[]} className="mb-6" />

            <VCT_FilterChips
                filters={activeFilters}
                onRemove={(k) => {
                    if (k === 'status') setStatusFilter(null)
                    if (k === 'assoc') setAssocFilter(null)
                    if (k === 'search') setSearch('')
                }}
                onClearAll={() => { setStatusFilter(null); setAssocFilter(null); setSearch('') }}
            />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[280px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm Chi hội, phường/xã..." />
                    </div>
                    <select value={assocFilter || ''} onChange={(e) => setAssocFilter(e.target.value || null)}
                        className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent-cyan) transition-colors">
                        <option value="">Tất cả Hội</option>
                        {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent-cyan) transition-colors">
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm Chi hội sẽ có ở phiên bản tiếp theo', 'info')}>Thêm Chi hội</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có Chi hội nào" description={loading ? 'Đang tải...' : 'Thử thay đổi bộ lọc.'} icon="📌" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {['Chi hội', 'Phường/Xã', 'Thuộc Hội', 'Chi hội trưởng', 'CLB', 'VĐV', 'Trạng thái'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(sa => {
                                const st = STATUS_MAP[sa.status] || { label: sa.status, type: 'neutral' }
                                return (
                                    <tr key={sa.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <VCT_AvatarLetter name={sa.name} size={36} />
                                                <div>
                                                    <div className="font-semibold text-sm">{sa.name}</div>
                                                    <div className="text-xs opacity-50 font-mono">{sa.code}</div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{sa.ward}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="text-xs px-2 py-1 rounded-full bg-(--vct-bg-elevated) text-(--vct-text-secondary)">
                                                {sa.association_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{sa.leader_name}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: 'var(--vct-accent-cyan)' }}>{sa.total_clubs}</td>
                                        <td className="px-4 py-3 text-sm text-center font-bold" style={{ color: 'var(--vct-info)' }}>{sa.total_athletes}</td>
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
