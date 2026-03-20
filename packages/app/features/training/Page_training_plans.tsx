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
import { useTrainingPlans } from '../hooks/useTrainingAPI'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface TrainingSession {
    id: string
    date: string
    time: string
    club_name: string
    class_name: string
    instructor: string
    topic: string
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
    attendees: number
    capacity: number
}

const STATUS_MAP = {
    upcoming: { label: 'Sắp diễn ra', color: 'blue', render: <VCT_Badge text="Sắp tới" type="info" /> },
    ongoing: { label: 'Đang diễn ra', color: 'green', render: <VCT_Badge text="Đang học" type="success" /> },
    completed: { label: 'Đã kết thúc', color: 'gray', render: <VCT_Badge text="Hoàn tất" type="neutral" /> },
    cancelled: { label: 'Đã hủy', color: 'red', render: <VCT_Badge text="Đã hủy" type="error" /> },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_training_plans = () => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [search, setSearch] = useState('')
    const [clubFilter, setClubFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // ── Real API data ──
    const { data: apiPlans, isLoading } = useTrainingPlans()

    const sessions = useMemo(() => {
        if (apiPlans && apiPlans.length > 0) {
            return apiPlans.flatMap(p => (p.schedule || []).map((s, i) => ({
                id: `${p.id}-${i}`, date: s.day, time: s.time,
                club_name: s.location || 'N/A', class_name: p.name,
                instructor: s.instructor || 'N/A', topic: s.focus,
                status: (p.status === 'active' ? 'upcoming' : 'completed') as TrainingSession['status'],
                attendees: 0, capacity: 30,
            })))
        }
        return []
    }, [apiPlans])

    const filtered = useMemo(() => {
        let v = sessions
        if (clubFilter !== 'all') v = v.filter(s => s.club_name.includes(clubFilter))
        if (statusFilter !== 'all') v = v.filter(s => s.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(s => s.topic.toLowerCase().includes(q) || s.class_name.toLowerCase().includes(q) || s.instructor.toLowerCase().includes(q))
        }
        return v
    }, [search, clubFilter, statusFilter])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Calendar size={24} />}
                title="Kế hoạch Giảng dạy"
                subtitle="Lịch tập luyện, phân công HLV và nội dung giáo án."
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={
                    <div className="flex bg-vct-elevated border border-vct-border rounded-lg p-1">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${viewMode === 'list' ? 'bg-(--vct-accent-cyan) text-black' : 'text-(--vct-text-secondary) hover:text-white'}`}>Danh sách</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-(--vct-accent-cyan) text-black' : 'text-(--vct-text-secondary) hover:text-white'}`}>Lịch trực quan</button>
                    </div>
                }
            />

            <VCT_StatRow items={[
                { label: 'Buổi tập hôm nay', value: 2, icon: <VCT_Icons.Calendar size={18} />, color: '#0ea5e9' },
                { label: 'Buổi tập tuần', value: 14, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
                { label: 'Võ sinh tham gia', value: 120, icon: <VCT_Icons.Users size={18} />, color: '#10b981' },
                { label: 'HLV trực', value: 5, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── TOOLBAR ── */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-(--vct-bg-elevated) p-4 rounded-xl border border-(--vct-border-subtle)">
                <div className="md:col-span-2">
                    <VCT_SearchInput placeholder="Tìm giáo án, lớp, HLV..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
                <VCT_Select
                    value={clubFilter}
                    onChange={setClubFilter}
                    options={[
                        { value: 'all', label: 'Tất cả Đơn vị/Phân đường' },
                        { value: 'Liên Hoa', label: 'Võ Đường Liên Hoa' },
                        { value: 'Long An', label: 'CLB Long An' }
                    ]}
                />
                <VCT_Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'all', label: 'Mọi trạng thái' },
                        { value: 'upcoming', label: 'Sắp tới' },
                        { value: 'completed', label: 'Đã xong' }
                    ]}
                />
            </div>

            {/* ── LIST VIEW ── */}
            {viewMode === 'list' && (
                filtered.length === 0 ? (
                    <VCT_EmptyState title="Trống" description="Không có lịch tập nào phù hợp" icon="📅" />
                ) : (
                    <div className="flex flex-col gap-4">
                        {filtered.map(session => (
                            <div key={session.id} className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-xl p-5 hover:border-(--vct-accent-cyan) transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center p-4 bg-(--vct-bg-elevated) rounded-xl shrink-0 border border-(--vct-border-subtle) w-24">
                                    <span className="text-[11px] font-bold uppercase text-(--vct-text-secondary) tracking-wider">THÁNG {session.date.split('-')[1]}</span>
                                    <span className="text-3xl font-black text-(--vct-text-primary) leading-none my-1">{session.date.split('-')[2]}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {STATUS_MAP[session.status].render}
                                        <span className="text-[12px] text-(--vct-text-secondary) font-medium flex items-center gap-1"><VCT_Icons.Clock size={13} /> {session.time}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-(--vct-text-primary) mb-1">{session.topic}</h3>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-(--vct-text-secondary)">
                                        <div className="flex items-center gap-2"><VCT_Icons.MapPin size={15} className="text-[#0ea5e9]" /> <span className="font-semibold">{session.club_name}</span></div>
                                        <div className="flex items-center gap-2"><VCT_Icons.Users size={15} className="text-[#8b5cf6]" /> {session.class_name}</div>
                                        <div className="flex items-center gap-2"><VCT_Icons.Award size={15} className="text-[#f59e0b]" /> HLV: {session.instructor}</div>
                                    </div>
                                </div>

                                {/* Actions / Stats */}
                                <div className="shrink-0 flex flex-col items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-(--vct-border-subtle) md:pl-6">
                                    <div className="text-right">
                                        <div className="text-[11px] text-(--vct-text-tertiary) uppercase font-semibold">Tỉ lệ tham gia</div>
                                        <div className="text-xl font-bold text-white tracking-tight">{session.attendees}<span className="text-sm font-medium text-(--vct-text-secondary)">/{session.capacity}</span></div>
                                    </div>
                                    <VCT_Button variant="secondary" size="sm" icon={<VCT_Icons.Edit size={14} />}>Chỉnh sửa</VCT_Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ── CALENDAR VIEW (Placeholder) ── */}
            {viewMode === 'calendar' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <VCT_Icons.Calendar size={48} className="text-(--vct-text-tertiary) mb-4" />
                    <h3 className="text-lg font-bold text-white">Chế độ xem lịch đang được phát triển</h3>
                    <p className="text-(--vct-text-secondary) mt-2">Tính năng kéo thả và xem tổng quan theo tháng sẽ sớm ra mắt.</p>
                </div>
            )}
        </VCT_PageContainer>
    )
}
