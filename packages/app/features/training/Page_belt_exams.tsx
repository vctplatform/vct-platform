'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_Select, VCT_EmptyState, VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Exam {
    id: string
    title: string
    date: string
    location: string
    levels: string[]
    candidates_count: number
    status: 'draft' | 'registration' | 'grading' | 'completed'
}

const MOCK_EXAMS: Exam[] = [
    { id: 'E1', title: 'Kỳ thi Thăng cấp đai Quý 4/2023', date: '2023-12-15', location: 'Nhà thi đấu Tỉnh Long An', levels: ['Vàng', 'Cam', 'Xanh lục'], candidates_count: 156, status: 'registration' },
    { id: 'E2', title: 'Kỳ thi Thăng cấp đai Đen Quốc gia', date: '2023-11-28', location: 'Trung tâm HLQG', levels: ['Đen 1 Đẳng', 'Đen 2 Đẳng'], candidates_count: 45, status: 'grading' },
    { id: 'E3', title: 'Kỳ thi Thăng cấp đai cơ sở Liên Hoa', date: '2023-10-10', location: 'Võ Đường Liên Hoa', levels: ['Vàng', 'Cam'], candidates_count: 89, status: 'completed' },
]

const STATUS_MAP = {
    draft: { label: 'Bản nháp', render: <VCT_Badge text="Bản nháp" type="neutral" /> },
    registration: { label: 'Đang đăng ký', render: <VCT_Badge text="Đang đăng ký" type="info" /> },
    grading: { label: 'Đang chấm điểm', render: <VCT_Badge text="Đang chấm thi" type="warning" /> },
    completed: { label: 'Đã hoàn tất', render: <VCT_Badge text="Hoàn tất" type="success" /> },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_belt_exams = () => {
    const [exams, setExams] = useState(MOCK_EXAMS)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        let v = exams
        if (statusFilter !== 'all') v = v.filter(e => e.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
        }
        return v
    }, [exams, search, statusFilter])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Award size={24} />}
                title="Kỳ thi Thăng Cấp Đai"
                subtitle="Tổ chức, quản lý hồ sơ đăng ký thi và chấm điểm thăng cấp."
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(245, 158, 11, 0.06)"
                actions={<VCT_Button icon={<VCT_Icons.Plus size={16} />}>Tạo Kỳ thi mới</VCT_Button>}
            />

            <VCT_StatRow items={[
                { label: 'Đang đăng ký', value: exams.filter(e => e.status === 'registration').length, icon: <VCT_Icons.Calendar size={18} />, color: '#0ea5e9' },
                { label: 'Đang chấm điểm', value: exams.filter(e => e.status === 'grading').length, icon: <VCT_Icons.Edit size={18} />, color: '#f59e0b' },
                { label: 'Thí sinh', value: exams.reduce((s, e) => s + e.candidates_count, 0), icon: <VCT_Icons.Users size={18} />, color: '#10b981' },
                { label: 'Hoàn tất', value: exams.filter(e => e.status === 'completed').length, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── TABS & TOOLBAR ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--vct-border-subtle)] pb-4">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả kỳ thi' },
                        { key: 'registration', label: 'Đang mở đăng ký' },
                        { key: 'grading', label: 'Chấm điểm' },
                        { key: 'completed', label: 'Hoàn tất' }
                    ]}
                    activeTab={statusFilter}
                    onChange={setStatusFilter}
                />
                <div className="w-[300px]">
                    <VCT_SearchInput placeholder="Tìm tên kỳ thi, địa điểm..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── LIST VIEW ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có kỳ thi nào" description="Thử thay đổi bộ lọc hoặc thêm kỳ thi mới." icon="🏅" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(exam => (
                        <div key={exam.id} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5 hover:border-[var(--vct-accent-cyan)] hover:shadow-[0_4px_24px_-8px_var(--vct-accent-cyan)] transition-all flex flex-col group">
                            <div className="flex items-start justify-between mb-4">
                                {(STATUS_MAP as any)[exam.status].render}
                                <button className="p-1.5 text-[var(--vct-text-tertiary)] hover:text-white rounded-md transition-colors">
                                    <VCT_Icons.MoreVertical size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-[var(--vct-text-primary)] mb-3 leading-tight line-clamp-2">{exam.title}</h3>

                            <div className="flex flex-col gap-2 text-[13px] text-[var(--vct-text-secondary)] mb-4 flex-1">
                                <div className="flex items-center gap-2"><VCT_Icons.Calendar size={14} className="text-[#0ea5e9]" /> {exam.date}</div>
                                <div className="flex items-start gap-2"><VCT_Icons.MapPin size={14} className="text-[#f59e0b] shrink-0 mt-0.5" /> <span className="line-clamp-2">{exam.location}</span></div>
                                <div className="flex items-center gap-2 mt-1">
                                    <VCT_Icons.Layers size={14} className="text-[#8b5cf6]" />
                                    <div className="flex flex-wrap gap-1">
                                        {exam.levels.map(l => (
                                            <span key={l} className="bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] px-1.5 py-0.5 rounded text-[10px] font-bold text-[var(--vct-text-primary)] uppercase">{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--vct-border-strong)] flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-[var(--vct-text-tertiary)] uppercase font-bold mb-0.5">Thí sinh</div>
                                    <div className="text-xl font-black text-white">{exam.candidates_count} <span className="text-xs font-normal text-[var(--vct-text-secondary)]">người</span></div>
                                </div>
                                <VCT_Button variant="secondary" size="sm">Cấu hình Hội đồng</VCT_Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </VCT_PageContainer>
    )
}
