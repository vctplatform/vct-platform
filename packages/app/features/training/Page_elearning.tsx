'use client'

import * as React from 'react'
import Image from 'next/image'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_EmptyState
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const MOCK_COURSES = [
    { id: 'C1', title: 'Khóa Đào tạo Trọng tài Cấp Quốc gia', progress: 80, instructor: 'Võ sư Phạm A', modules: 12, students: 450, thumbnail: 'https://images.unsplash.com/photo-1542360548-fbcd067d264f?auto=format&fit=crop&q=80&w=400' },
    { id: 'C2', title: 'Luật thi đấu Cổ truyền 2024 (Cập nhật)', progress: 0, instructor: 'Hội đồng Trọng tài', modules: 5, students: 1200, thumbnail: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=400' },
    { id: 'C3', title: 'Kỹ năng sư phạm Võ thuật (Cấp 1)', progress: 100, instructor: 'Viện Khoa học TDTT', modules: 8, students: 320, thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_elearning = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Video size={24} />}
                title="Học trực tuyến (E-Learning)"
                subtitle="Nền tảng đào tạo từ xa cho HLV, Trọng tài và Cán bộ chuyên môn."
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={<VCT_Button icon={<VCT_Icons.Plus size={16} />}>Tạo Khóa học mới</VCT_Button>}
            />

            <VCT_StatRow items={[
                { label: 'Khóa học mở', value: 15, icon: <VCT_Icons.Video size={18} />, color: '#0ea5e9' },
                { label: 'Học viên', value: 2450, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
                { label: 'Chứng chỉ cấp', value: 890, icon: <VCT_Icons.Award size={18} />, color: '#10b981' },
                { label: 'Hoàn thành', value: '68%', icon: <VCT_Icons.Activity size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── LIST VIEW ── */}
            <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--vct-text-primary)] flex items-center gap-2 mb-4">
                    <VCT_Icons.Book /> Khóa học nổi bật
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_COURSES.map(course => (
                        <div key={course.id} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden hover:border-[var(--vct-accent-cyan)] hover:shadow-[0_4px_24px_-8px_var(--vct-accent-cyan)] transition-all flex flex-col group cursor-pointer">
                            <div className="aspect-video relative overflow-hidden bg-[var(--vct-bg-card)]">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                <Image
                                    src={course.thumbnail}
                                    alt={course.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {course.progress === 100 && (
                                    <div className="absolute top-2 right-2 bg-[#10b981] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase z-20 flex items-center gap-1">
                                        <VCT_Icons.Check size={12} /> Hoàn thành
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-[15px] font-bold text-[var(--vct-text-primary)] mb-2 leading-tight line-clamp-2">{course.title}</h3>

                                <div className="flex items-center gap-4 text-[12px] text-[var(--vct-text-secondary)] mb-4">
                                    <div className="flex items-center gap-1.5"><VCT_Icons.User size={14} /> {course.instructor}</div>
                                    <div className="flex items-center gap-1.5"><VCT_Icons.Layers size={14} /> {course.modules} Modules</div>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-center justify-between text-[11px] mb-2">
                                        <span className="text-[var(--vct-text-secondary)] font-medium">Tiến độ khóa học chung</span>
                                        <span className="text-[var(--vct-accent-cyan)] font-bold">{course.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--vct-bg-card)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--vct-accent-cyan)] rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-[12px] text-[var(--vct-text-tertiary)] flex items-center gap-1">
                                            <VCT_Icons.Users size={14} /> <b>{course.students}</b> học viên
                                        </div>
                                        <VCT_Button size="sm" variant={course.progress > 0 ? 'secondary' : 'primary'}>
                                            {course.progress === 100 ? 'Xem lại' : course.progress > 0 ? 'Tiếp tục học' : 'Vào học'}
                                        </VCT_Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
