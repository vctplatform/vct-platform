'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_SectionCard, VCT_StatRow } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import type { StatItem } from '../components/VCT_StatRow'
import { useAthletes, useCoaches, useReferees } from '../hooks/usePeopleAPI'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
interface Person {
    id: string
    name: string
    role: 'athlete' | 'coach' | 'referee' | 'staff'
    org: string
    belt?: string
    status: 'active' | 'inactive' | 'pending'
    phone: string
    email: string
}

const ROLE_MAP: Record<string, { label: string; color: string }> = {
    athlete: { label: 'VĐV', color: '#0ea5e9' },
    coach: { label: 'HLV', color: '#10b981' },
    referee: { label: 'Trọng tài', color: '#f59e0b' },
    staff: { label: 'Nhân sự', color: '#8b5cf6' },
}

const MOCK_PEOPLE: Person[] = [
    { id: 'P-001', name: 'Nguyễn Văn Tiến', role: 'athlete', org: 'CLB Sơn Long Quyền', belt: 'Đai Đen 1 Đẳng', status: 'active', phone: '0901234567', email: 'tien@vct.vn' },
    { id: 'P-002', name: 'Trần Minh Đức', role: 'coach', org: 'Võ Đường Liên Hoa', belt: 'Đai Đen 3 Đẳng', status: 'active', phone: '0912345678', email: 'duc@vct.vn' },
    { id: 'P-003', name: 'Lê Thị Mai', role: 'referee', org: 'Liên đoàn Võ thuật VN', status: 'active', phone: '0923456789', email: 'mai@vct.vn' },
    { id: 'P-004', name: 'Phạm Hoàng Tâm', role: 'athlete', org: 'CLB Long An', belt: 'Đai Vàng', status: 'pending', phone: '0934567890', email: 'tam@vct.vn' },
    { id: 'P-005', name: 'Vũ Thanh Hằng', role: 'staff', org: 'BTC Giải QG', status: 'active', phone: '0945678901', email: 'hang@vct.vn' },
    { id: 'P-006', name: 'Đặng Mậu Tài', role: 'athlete', org: 'Nhà Thiếu Nhi Q1', belt: 'Đai Xanh', status: 'inactive', phone: '0956789012', email: 'tai@vct.vn' },
    { id: 'P-007', name: 'Bùi Ngọc Anh', role: 'coach', org: 'CLB Sơn Long Quyền', belt: 'Đai Đen 2 Đẳng', status: 'active', phone: '0967890123', email: 'anh@vct.vn' },
    { id: 'P-008', name: 'Hoàng Văn Phúc', role: 'referee', org: 'Liên đoàn Võ thuật VN', status: 'pending', phone: '0978901234', email: 'phuc@vct.vn' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_people = () => {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')

    // ── Real API data ──
    const { data: apiAthletes } = useAthletes()
    const { data: apiCoaches } = useCoaches()
    const { data: apiReferees } = useReferees()

    const people = useMemo(() => {
        const combined: Person[] = []
        if (apiAthletes?.length) {
            apiAthletes.forEach(a => combined.push({
                id: a.id, name: a.name || a.full_name || '',
                role: 'athlete', org: a.club_name || '', belt: a.belt_rank,
                status: (a.status || 'active') as Person['status'],
                phone: a.phone || '', email: a.email || '',
            }))
        }
        if (apiCoaches?.length) {
            apiCoaches.forEach(c => combined.push({
                id: c.id, name: c.name || c.full_name || '',
                role: 'coach', org: c.club_name || '', belt: c.belt_rank,
                status: 'active', phone: c.phone || '', email: c.email || '',
            }))
        }
        if (apiReferees?.length) {
            apiReferees.forEach(r => combined.push({
                id: r.id, name: r.name || r.full_name || '',
                role: 'referee', org: r.federation || '',
                status: 'active', phone: r.phone || '', email: r.email || '',
            }))
        }
        return combined.length > 0 ? combined : MOCK_PEOPLE
    }, [apiAthletes, apiCoaches, apiReferees])

    const filtered = useMemo(() => {
        let data = people
        if (roleFilter !== 'all') data = data.filter(p => p.role === roleFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(p => p.name.toLowerCase().includes(q) || p.org.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
        }
        return data
    }, [search, roleFilter, people])

    const kpis: StatItem[] = [
        { label: 'Tổng VĐV', value: people.filter(p => p.role === 'athlete').length, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
        { label: 'HLV', value: people.filter(p => p.role === 'coach').length, icon: <VCT_Icons.UserCheck size={18} />, color: '#10b981' },
        { label: 'Trọng tài', value: people.filter(p => p.role === 'referee').length, icon: <VCT_Icons.Shield size={18} />, color: '#f59e0b' },
        { label: 'Hồ sơ chờ duyệt', value: people.filter(p => p.status === 'pending').length, icon: <VCT_Icons.Clock size={18} />, color: '#ef4444' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ── Hero ── */}
            <VCT_PageHero
                icon={<VCT_Icons.Users size={24} />}
                title="Quản lý Nhân sự & Con người"
                subtitle="Toàn bộ VĐV, HLV, Trọng tài và nhân sự trong hệ thống VCT."
                gradientFrom="rgba(14, 165, 233, 0.06)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất Excel</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Thêm hồ sơ</VCT_Button>
                    </VCT_Stack>
                }
            />

            {/* ── KPI ── */}
            <VCT_StatRow items={kpis} className="mb-8" />

            {/* ── TABS & SEARCH ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-vct-border pb-4">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'athlete', label: 'VĐV' },
                        { key: 'coach', label: 'HLV' },
                        { key: 'referee', label: 'Trọng tài' },
                        { key: 'staff', label: 'Nhân sự' },
                    ]}
                    activeTab={roleFilter}
                    onChange={setRoleFilter}
                />
                <div className="w-[300px]">
                    <VCT_SearchInput placeholder="Tìm theo tên, CLB, email..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── TABLE ── */}
            <VCT_SectionCard flush accentColor="#0ea5e9">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-vct-elevated border-b border-vct-border text-[11px] uppercase tracking-wider text-vct-text-muted font-bold">
                            <th className="p-4">Họ tên</th>
                            <th className="p-4 w-24">Vai trò</th>
                            <th className="p-4">Đơn vị</th>
                            <th className="p-4 w-32">Cấp đai</th>
                            <th className="p-4 w-28 text-center">Trạng thái</th>
                            <th className="p-4 w-36">Liên hệ</th>
                            <th className="p-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-vct-border">
                        {filtered.map(person => (
                            <tr key={person.id} className="hover:bg-vct-accent/3 transition-colors group cursor-pointer">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md" style={{ background: ROLE_MAP[person.role]?.color ?? '#94a3b8' }}>
                                            {person.name.split(' ').pop()?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-vct-text">{person.name}</div>
                                            <div className="text-[10px] text-vct-text-muted font-mono">{person.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border" style={{ color: ROLE_MAP[person.role]?.color, background: `${ROLE_MAP[person.role]?.color}12`, borderColor: `${ROLE_MAP[person.role]?.color}25` }}>
                                        {ROLE_MAP[person.role]?.label}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-vct-text-secondary">{person.org}</td>
                                <td className="p-4 text-sm text-vct-text-secondary">{person.belt || '—'}</td>
                                <td className="p-4 text-center">
                                    {person.status === 'active' && <VCT_Badge type="success" text="Hoạt động" />}
                                    {person.status === 'pending' && <VCT_Badge type="warning" text="Chờ duyệt" />}
                                    {person.status === 'inactive' && <VCT_Badge type="neutral" text="Ngưng" />}
                                </td>
                                <td className="p-4">
                                    <div className="text-[11px] text-vct-text-muted space-y-0.5">
                                        <div className="flex items-center gap-1"><VCT_Icons.Phone size={10} /> {person.phone}</div>
                                        <div className="flex items-center gap-1"><VCT_Icons.Mail size={10} /> {person.email}</div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="p-1.5 text-vct-text-muted hover:text-vct-text opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-vct-input">
                                        <VCT_Icons.MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </VCT_SectionCard>
        </VCT_PageContainer>
    )
}
