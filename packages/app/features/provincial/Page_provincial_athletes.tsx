'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_FilterChips, VCT_AvatarLetter } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Athlete { id: string; full_name: string; gender: string; date_of_birth: string; club_name: string; belt_rank: string; weight: number; height: number; status: string }

const GENDER_MAP: Record<string, string> = { nam: 'Nam', nu: 'Nữ' }
const STATUS_MAP: Record<string, { label: string; type: any }> = { active: { label: 'Đang tập', type: 'success' }, pending: { label: 'Chờ duyệt', type: 'warning' }, inactive: { label: 'Ngưng', type: 'neutral' } }

export const Page_provincial_athletes = () => {
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [search, setSearch] = useState('')
    const [genderFilter, setGenderFilter] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/athletes?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setAthletes((d.data?.athletes || d.athletes) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        let data = athletes
        if (genderFilter) data = data.filter(a => a.gender === genderFilter)
        if (search) { const q = search.toLowerCase(); data = data.filter(a => a.full_name.toLowerCase().includes(q) || a.club_name?.toLowerCase().includes(q) || a.belt_rank?.toLowerCase().includes(q)) }
        return data
    }, [athletes, search, genderFilter])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (genderFilter) f.push({ key: 'gender', label: 'Giới tính', value: GENDER_MAP[genderFilter] || genderFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [genderFilter, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">🥋 Quản Lý Vận Động Viên</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Danh sách VĐV thuộc liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng VĐV', value: athletes.length, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'Nam', value: athletes.filter(a => a.gender === 'nam').length, icon: <VCT_Icons.User size={18} />, color: '#3b82f6' },
                { label: 'Nữ', value: athletes.filter(a => a.gender === 'nu').length, icon: <VCT_Icons.User size={18} />, color: '#ec4899' },
                { label: 'Đang tập luyện', value: athletes.filter(a => a.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            <VCT_FilterChips filters={activeFilters} onRemove={(k) => { if (k === 'gender') setGenderFilter(null); if (k === 'search') setSearch('') }} onClearAll={() => { setGenderFilter(null); setSearch('') }} />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm VĐV, CLB, đẳng cấp..." /></div>
                    <select value={genderFilter || ''} onChange={e => setGenderFilter(e.target.value || null)} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] text-[var(--vct-text-primary)] text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả giới tính</option><option value="nam">Nam</option><option value="nu">Nữ</option>
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm VĐV sẽ có ở phiên bản tiếp theo', 'info')}>Thêm VĐV</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có VĐV nào" description={loading ? 'Đang tải...' : 'Thử thay đổi bộ lọc.'} icon="🥋" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                            {['VĐV', 'CLB', 'Đẳng cấp', 'Cân nặng', 'Giới tính', 'Trạng thái'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.map(a => {
                                const st = STATUS_MAP[a.status] || { label: a.status, type: 'neutral' }
                                return (
                                    <tr key={a.id} className="border-b border-[var(--vct-border-subtle)] hover:bg-[var(--vct-bg-hover)] transition-colors">
                                        <td className="px-4 py-3"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={a.full_name} size={36} /><div><div className="font-semibold text-sm">{a.full_name}</div><div className="text-xs opacity-50">{a.date_of_birth}</div></div></VCT_Stack></td>
                                        <td className="px-4 py-3 text-sm">{a.club_name}</td>
                                        <td className="px-4 py-3"><VCT_Badge text={a.belt_rank || '—'} type="info" /></td>
                                        <td className="px-4 py-3 text-sm text-center">{a.weight ? `${a.weight} kg` : '—'}</td>
                                        <td className="px-4 py-3 text-sm text-center">{GENDER_MAP[a.gender] || a.gender}</td>
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
