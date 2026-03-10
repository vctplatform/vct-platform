'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_AvatarLetter, VCT_EmptyState, VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Coach {
    id: string
    name: string
    belt_rank: string
    certification: string
    club: string
    club_city: string
    phone: string
    email: string
    students: number
    experience_years: number
    status: 'active' | 'inactive' | 'pending'
    specialties: string[]
    avatar_letter: string
}

const BELT_COLORS: Record<string, string> = {
    'Đai Đen': '#1a1a2e', 'Hồng Đai': '#ec4899', 'Đai Đỏ': '#ef4444', 'Đai Xanh': '#3b82f6',
}

const MOCK_COACHES: Coach[] = [
    { id: 'HLV-001', name: 'Võ sư Trần Văn Dũng', belt_rank: 'Hồng Đai', certification: 'Chứng nhận Quốc tế LV3', club: 'CLB Sơn Long Quyền', club_city: 'TP.HCM', phone: '0901234567', email: 'dung@sonlong.vn', students: 45, experience_years: 25, status: 'active', specialties: ['Quyền thuật', 'Đối kháng'], avatar_letter: 'D' },
    { id: 'HLV-002', name: 'Võ sư Nguyễn Thị Hà', belt_rank: 'Đai Đen', certification: 'Chứng nhận Quốc gia LV2', club: 'VĐ Thiên Long', club_city: 'Hà Nội', phone: '0912345678', email: 'ha@thienlong.vn', students: 32, experience_years: 18, status: 'active', specialties: ['Quyền thuật', 'Biểu diễn'], avatar_letter: 'H' },
    { id: 'HLV-003', name: 'Võ sư Lê Minh Tuấn', belt_rank: 'Đai Đen', certification: 'Chứng nhận Quốc gia LV2', club: 'CLB Long An', club_city: 'Long An', phone: '0923456789', email: 'tuan@longan.vn', students: 28, experience_years: 15, status: 'active', specialties: ['Đối kháng', 'Tự vệ'], avatar_letter: 'T' },
    { id: 'HLV-004', name: 'Võ sư Phạm Hồng Sơn', belt_rank: 'Đai Đỏ', certification: 'Chứng nhận Quốc gia LV1', club: 'CLB Bình Dương', club_city: 'Bình Dương', phone: '0934567890', email: 'son@bd.vn', students: 20, experience_years: 10, status: 'active', specialties: ['Quyền thuật'], avatar_letter: 'S' },
    { id: 'HLV-005', name: 'Võ sư Đặng Mai Linh', belt_rank: 'Đai Đen', certification: 'Chứng nhận Quốc gia LV2', club: 'CLB Q.12', club_city: 'TP.HCM', phone: '0945678901', email: 'linh@q12.vn', students: 35, experience_years: 20, status: 'active', specialties: ['Quyền thuật', 'Biểu diễn', 'Thiếu nhi'], avatar_letter: 'L' },
    { id: 'HLV-006', name: 'Võ sư Bùi Ngọc Khoa', belt_rank: 'Đai Xanh', certification: 'Chứng nhận cơ sở', club: 'CLB Q.7', club_city: 'TP.HCM', phone: '0956789012', email: 'khoa@q7.vn', students: 12, experience_years: 5, status: 'pending', specialties: ['Quyền thuật'], avatar_letter: 'K' },
    { id: 'HLV-007', name: 'Võ sư Hoàng Văn Nam', belt_rank: 'Đai Đen', certification: 'Chứng nhận Quốc gia LV1', club: 'CLB Đà Nẵng', club_city: 'Đà Nẵng', phone: '0967890123', email: 'nam@dn.vn', students: 22, experience_years: 12, status: 'inactive', specialties: ['Đối kháng'], avatar_letter: 'N' },
]

const STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'neutral' }> = {
    active: { label: 'Đang dạy', type: 'success' },
    inactive: { label: 'Tạm nghỉ', type: 'neutral' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_coaches = () => {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        let data = MOCK_COACHES
        if (statusFilter !== 'all') data = data.filter(c => c.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(c => c.name.toLowerCase().includes(q) || c.club.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
        }
        return data
    }, [statusFilter, search])

    const totalStudents = MOCK_COACHES.reduce((s, c) => s + c.students, 0)
    const avgExperience = Math.round(MOCK_COACHES.reduce((s, c) => s + c.experience_years, 0) / MOCK_COACHES.length)

    const kpis: StatItem[] = [
        { label: 'Tổng HLV', value: MOCK_COACHES.length, icon: <VCT_Icons.UserCheck size={18} />, color: '#8b5cf6' },
        { label: 'Đang hoạt động', value: MOCK_COACHES.filter(c => c.status === 'active').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
        { label: 'Tổng học trò', value: totalStudents, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
        { label: 'KN trung bình', value: `${avgExperience} năm`, icon: <VCT_Icons.Award size={18} />, color: '#f59e0b' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.UserCheck size={24} />}
                title="Huấn Luyện Viên"
                subtitle="Quản lý danh sách HLV, chứng chỉ, và phân công đào tạo."
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(16, 185, 129, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất danh sách</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Thêm HLV</VCT_Button>
                    </VCT_Stack>
                }
            />

            {/* ── KPI ── */}
            <VCT_StatRow items={kpis} className="mb-8" />

            {/* ── FILTER ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-vct-border pb-4">
                <VCT_Tabs
                    tabs={[{ key: 'all', label: 'Tất cả' }, { key: 'active', label: 'Đang dạy' }, { key: 'pending', label: 'Chờ duyệt' }, { key: 'inactive', label: 'Tạm nghỉ' }]}
                    activeTab={statusFilter}
                    onChange={setStatusFilter}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm HLV, CLB..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── COACH CARDS ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy HLV" description="Thử thay đổi bộ lọc hoặc từ khóa." icon="🥋" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(coach => (
                        <div key={coach.id} className="bg-vct-elevated border border-vct-border rounded-2xl p-5 hover:border-vct-accent transition-all cursor-pointer group hover:shadow-[var(--vct-shadow-md)] vct-card-press">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <VCT_Stack direction="row" gap={12} align="center">
                                    <div className="relative">
                                        <VCT_AvatarLetter name={coach.name} size={48} />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-vct-elevated"
                                            style={{ background: coach.status === 'active' ? '#10b981' : coach.status === 'pending' ? '#f59e0b' : '#94a3b8' }}></div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-vct-text group-hover:text-vct-accent transition-colors">{coach.name}</div>
                                        <div className="text-[11px] text-vct-text-muted">{coach.id}</div>
                                    </div>
                                </VCT_Stack>
                                <VCT_Badge text={STATUS_MAP[coach.status]?.label || ''} type={STATUS_MAP[coach.status]?.type || 'neutral'} />
                            </div>

                            {/* Belt + Certification */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold px-2 py-1 rounded-lg border" style={{ color: BELT_COLORS[coach.belt_rank] || '#64748b', background: `${BELT_COLORS[coach.belt_rank] || '#64748b'}12`, borderColor: `${BELT_COLORS[coach.belt_rank] || '#64748b'}25` }}>
                                    {coach.belt_rank}
                                </span>
                                <span className="text-[11px] text-vct-text-secondary">{coach.certification}</span>
                            </div>

                            {/* Club */}
                            <div className="flex items-center gap-2 mb-3 text-sm text-vct-text-secondary">
                                <VCT_Icons.Building2 size={14} className="text-vct-text-muted" />
                                <span>{coach.club}</span>
                                <span className="text-vct-text-muted">• {coach.club_city}</span>
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-1 mb-4">
                                {coach.specialties.map(s => (
                                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded bg-vct-accent/10 text-vct-accent border border-vct-accent/20">{s}</span>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-vct-border">
                                <div className="text-center">
                                    <div className="text-lg font-black text-vct-text">{coach.students}</div>
                                    <div className="text-[10px] text-vct-text-muted">Học trò</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-black text-vct-text">{coach.experience_years}</div>
                                    <div className="text-[10px] text-vct-text-muted">Năm KN</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-black text-vct-text">{coach.specialties.length}</div>
                                    <div className="text-[10px] text-vct-text-muted">Chuyên môn</div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-vct-border text-[11px] text-vct-text-muted">
                                <span className="flex items-center gap-1"><VCT_Icons.Phone size={10} /> {coach.phone}</span>
                                <span className="flex items-center gap-1"><VCT_Icons.Mail size={10} /> {coach.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </VCT_PageContainer>
    )
}
