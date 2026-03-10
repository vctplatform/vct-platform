'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_AvatarLetter, VCT_EmptyState, VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_SectionCard, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Referee {
    id: string
    name: string
    certification_level: string
    federation: string
    city: string
    phone: string
    email: string
    tournaments_judged: number
    experience_years: number
    status: 'active' | 'inactive' | 'suspended'
    specialties: string[]
    rating: number
    avatar_letter: string
}

const CERT_COLORS: Record<string, string> = {
    'Quốc tế': '#8b5cf6', 'Quốc gia A': '#ef4444', 'Quốc gia B': '#f59e0b', 'Cấp tỉnh': '#0ea5e9',
}

const MOCK_REFEREES: Referee[] = [
    { id: 'TT-001', name: 'Nguyễn Đức Hòa', certification_level: 'Quốc tế', federation: 'LĐVT VN', city: 'TP.HCM', phone: '0901234567', email: 'hoa@vct.vn', tournaments_judged: 85, experience_years: 20, status: 'active', specialties: ['Đối kháng', 'Quyền thuật'], rating: 4.9, avatar_letter: 'H' },
    { id: 'TT-002', name: 'Trần Thị Mai', certification_level: 'Quốc gia A', federation: 'LĐVT HN', city: 'Hà Nội', phone: '0912345678', email: 'mai@vct.vn', tournaments_judged: 52, experience_years: 12, status: 'active', specialties: ['Quyền thuật'], rating: 4.7, avatar_letter: 'M' },
    { id: 'TT-003', name: 'Lê Văn Phúc', certification_level: 'Quốc gia A', federation: 'LĐVT ĐN', city: 'Đà Nẵng', phone: '0923456789', email: 'phuc@vct.vn', tournaments_judged: 40, experience_years: 10, status: 'active', specialties: ['Đối kháng'], rating: 4.5, avatar_letter: 'P' },
    { id: 'TT-004', name: 'Phạm Minh Tâm', certification_level: 'Quốc gia B', federation: 'LĐVT BD', city: 'Bình Dương', phone: '0934567890', email: 'tam@vct.vn', tournaments_judged: 22, experience_years: 6, status: 'active', specialties: ['Quyền thuật', 'Biểu diễn'], rating: 4.3, avatar_letter: 'T' },
    { id: 'TT-005', name: 'Đặng Hồng Nhung', certification_level: 'Quốc gia B', federation: 'LĐVT LA', city: 'Long An', phone: '0945678901', email: 'nhung@vct.vn', tournaments_judged: 18, experience_years: 5, status: 'inactive', specialties: ['Quyền thuật'], rating: 4.1, avatar_letter: 'N' },
    { id: 'TT-006', name: 'Võ Văn Long', certification_level: 'Cấp tỉnh', federation: 'LĐVT CT', city: 'Cần Thơ', phone: '0956789012', email: 'long@vct.vn', tournaments_judged: 8, experience_years: 3, status: 'active', specialties: ['Đối kháng'], rating: 4.0, avatar_letter: 'L' },
]

const STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'error' | 'neutral' }> = {
    active: { label: 'Đang hoạt động', type: 'success' },
    inactive: { label: 'Tạm nghỉ', type: 'neutral' },
    suspended: { label: 'Tạm đình chỉ', type: 'error' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_referees = () => {
    const [search, setSearch] = useState('')
    const [certFilter, setCertFilter] = useState('all')

    const filtered = useMemo(() => {
        let data = MOCK_REFEREES
        if (certFilter !== 'all') data = data.filter(r => r.certification_level === certFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(r => r.name.toLowerCase().includes(q) || r.federation.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
        }
        return data
    }, [certFilter, search])

    const kpis: StatItem[] = [
        { label: 'Tổng trọng tài', value: MOCK_REFEREES.length, icon: <VCT_Icons.UserCheck size={18} />, color: '#8b5cf6' },
        { label: 'Cấp quốc tế', value: MOCK_REFEREES.filter(r => r.certification_level === 'Quốc tế').length, icon: <VCT_Icons.Award size={18} />, color: '#ef4444' },
        { label: 'Rating TB', value: (MOCK_REFEREES.reduce((s, r) => s + r.rating, 0) / MOCK_REFEREES.length).toFixed(1), icon: <VCT_Icons.Star size={18} />, color: '#f59e0b' },
        { label: 'Giải đã điều', value: MOCK_REFEREES.reduce((s, r) => s + r.tournaments_judged, 0), icon: <VCT_Icons.Trophy size={18} />, color: '#0ea5e9' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Shield size={24} />}
                title="Trọng Tài"
                subtitle="Quản lý danh sách trọng tài, cấp chứng nhận và phân công giải đấu."
                gradientFrom="rgba(245, 158, 11, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất danh sách</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Đăng ký TT mới</VCT_Button>
                    </VCT_Stack>
                }
            />

            <VCT_StatRow items={kpis} className="mb-8" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-vct-border pb-4">
                <VCT_Tabs
                    tabs={[{ key: 'all', label: 'Tất cả' }, ...Object.keys(CERT_COLORS).map(k => ({ key: k, label: k }))]}
                    activeTab={certFilter}
                    onChange={setCertFilter}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm trọng tài..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy trọng tài" description="Thử thay đổi bộ lọc hoặc từ khóa." icon="⚖️" />
            ) : (
                <VCT_SectionCard flush accentColor="#f59e0b">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-vct-border bg-vct-elevated text-[11px] uppercase tracking-wider font-bold text-vct-text-muted">
                                <th className="p-4 text-left">Trọng tài</th><th className="p-4 text-left">Cấp chứng nhận</th><th className="p-4 text-left">Liên đoàn</th><th className="p-4 text-center">Giải đã điều</th><th className="p-4 text-center">Rating</th><th className="p-4 text-center">Trạng thái</th><th className="p-4 text-left">Chuyên môn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vct-border">
                            {filtered.map(ref => (
                                <tr key={ref.id} className="hover:bg-vct-accent/[0.03] transition-colors cursor-pointer group">
                                    <td className="p-4">
                                        <VCT_Stack direction="row" gap={10} align="center">
                                            <VCT_AvatarLetter name={ref.name} size={36} />
                                            <div>
                                                <div className="font-bold text-sm text-vct-text group-hover:text-vct-accent transition-colors">{ref.name}</div>
                                                <div className="text-[11px] text-vct-text-muted">{ref.id} • {ref.city}</div>
                                            </div>
                                        </VCT_Stack>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold px-2 py-1 rounded-lg border" style={{ color: CERT_COLORS[ref.certification_level] || '#64748b', background: `${CERT_COLORS[ref.certification_level] || '#64748b'}12`, borderColor: `${CERT_COLORS[ref.certification_level] || '#64748b'}25` }}>
                                            {ref.certification_level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-vct-text-secondary">{ref.federation}</td>
                                    <td className="p-4 text-center font-black text-sm text-vct-text">{ref.tournaments_judged}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <VCT_Icons.Star size={14} className="text-amber-500" />
                                            <span className="font-bold text-sm text-vct-text">{ref.rating}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center"><VCT_Badge text={STATUS_MAP[ref.status]?.label || ''} type={STATUS_MAP[ref.status]?.type || 'neutral'} /></td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {ref.specialties.map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-vct-accent/10 text-vct-accent border border-vct-accent/20">{s}</span>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </VCT_SectionCard>
            )}
        </VCT_PageContainer>
    )
}
