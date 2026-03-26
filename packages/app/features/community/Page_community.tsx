'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge
} from '@vct/ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useClubs, useCommunityEvents, useMembers } from '../hooks/useCommunityAPI'

// ════════════════════════════════════════
// FALLBACK DATA (shown while API loads or if empty)
// ════════════════════════════════════════
const FALLBACK_POSTS = [
    { id: 'P1', author: 'Liên đoàn Võ thuật VN', avatar: 'L', time: '2 giờ trước', content: 'Thông báo: Giải Vô địch Quốc gia 2024 chính thức mở đăng ký từ ngày 15/04/2024. Các CLB vui lòng chuẩn bị hồ sơ.', likes: 156, comments: 34, type: 'announcement' },
    { id: 'P2', author: 'CLB Sơn Long Quyền', avatar: 'S', time: '5 giờ trước', content: '🥋 Chúc mừng học viên Nguyễn Văn A đã xuất sắc đạt Huy chương Vàng giải trẻ Quốc gia! Tự hào lắm con ơi!', likes: 245, comments: 58, type: 'achievement' },
    { id: 'P3', author: 'HLV Trần Minh', avatar: 'T', time: '1 ngày trước', content: 'Chia sẻ kỹ thuật: Bài Quyền Thái Cực số 3 - Phân tích chi tiết từng thế thủ. Video đính kèm trong phần bình luận.', likes: 89, comments: 12, type: 'tutorial' },
    { id: 'P4', author: 'Võ Đường Thiên Long', avatar: 'V', time: '2 ngày trước', content: '📅 Lịch tập luyện tuần tới đã cập nhật. Lớp nâng cao sẽ chuyển sang sân B từ thứ 3-5. Mọi người lưu ý nhé!', likes: 45, comments: 8, type: 'update' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_community = () => {
    const [search, setSearch] = useState('')

    // ── Real API data ──
    const { data: clubs, isLoading: clubsLoading } = useClubs()
    const { data: events, isLoading: eventsLoading } = useCommunityEvents()
    const { data: members } = useMembers()

    // Use fallback posts (community posts endpoint may not exist yet)
    const posts = FALLBACK_POSTS

    const eventsDisplay = useMemo(() => {
        if (events && events.length > 0) {
            return events.map(ev => ({
                id: ev.id,
                title: ev.title || 'Sự kiện',
                date: ev.date || ev.start_date || '',
                location: ev.location || '',
                status: ev.status || 'upcoming',
            }))
        }
        return [
            { id: 'EV1', title: 'Giải Vô địch Quốc gia 2024', date: '15/06/2024', location: 'Hà Nội', status: 'upcoming' },
            { id: 'EV2', title: 'Hội thảo Kỹ thuật Võ cổ truyền', date: '20/04/2024', location: 'TP.HCM', status: 'open' },
            { id: 'EV3', title: 'Giao lưu Quốc tế VN - Hàn Quốc', date: '10/05/2024', location: 'Đà Nẵng', status: 'upcoming' },
        ]
    }, [events])

    const kpis: StatItem[] = [
        { label: 'Thành viên', value: members?.length || '12.5k', icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-accent-cyan)' },
        { label: 'Bài viết hôm nay', value: posts.length, icon: <VCT_Icons.FileText size={18} />, color: 'var(--vct-success)' },
        { label: 'Sự kiện sắp tới', value: eventsDisplay.length, icon: <VCT_Icons.Calendar size={18} />, color: 'var(--vct-warning)' },
        { label: 'CLB hoạt động', value: clubs?.length || 340, icon: <VCT_Icons.Flag size={18} />, color: 'var(--vct-info)' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Users size={24} />}
                title="Cộng Đồng Võ Thuật"
                subtitle="Tin tức, sự kiện và kết nối cộng đồng võ thuật toàn quốc."
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
                actions={<VCT_Button icon={<VCT_Icons.Plus size={16} />}>Đăng bài mới</VCT_Button>}
            />

            <VCT_StatRow items={kpis} className="mb-8" />

            {(clubsLoading || eventsLoading) && (
                <div className="text-center py-8 text-(--vct-text-tertiary) text-sm animate-pulse">
                    Đang tải dữ liệu cộng đồng...
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── NEWSFEED ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="mb-4">
                        <VCT_SearchInput placeholder="Tìm kiếm bài viết, sự kiện..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                    </div>

                    {posts.filter(p => !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase())).map(post => (
                        <div key={post.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 hover:border-(--vct-accent-cyan) transition-all">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-(--vct-accent-cyan) to-(--vct-accent-cyan) flex items-center justify-center font-bold text-white text-sm shrink-0">
                                    {post.avatar}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-(--vct-text-primary)">{post.author}</span>
                                        {post.type === 'announcement' && <VCT_Badge type="info" text="Thông báo" />}
                                        {post.type === 'achievement' && <VCT_Badge type="success" text="Thành tích" />}
                                    </div>
                                    <div className="text-[11px] text-(--vct-text-tertiary)">{post.time}</div>
                                </div>
                            </div>
                            <p className="text-sm text-(--vct-text-secondary) leading-relaxed mb-4">{post.content}</p>
                            <div className="flex items-center gap-6 text-(--vct-text-tertiary) text-xs">
                                <button className="flex items-center gap-1.5 hover:text-(--vct-danger) transition-colors">
                                    <VCT_Icons.Heart size={14} /> {post.likes}
                                </button>
                                <button className="flex items-center gap-1.5 hover:text-(--vct-accent-cyan) transition-colors">
                                    <VCT_Icons.FileText size={14} /> {post.comments} bình luận
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SIDEBAR ── */}
                <div className="space-y-6">
                    {/* Events */}
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                            <VCT_Icons.Calendar size={18} className="text-(--vct-accent-cyan)" /> Sự kiện sắp tới
                        </h3>
                        <div className="space-y-3">
                            {eventsDisplay.map(ev => (
                                <div key={ev.id} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) hover:border-(--vct-accent-cyan) transition-colors cursor-pointer">
                                    <div className="font-semibold text-sm text-(--vct-text-primary) line-clamp-1">{ev.title}</div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-(--vct-text-tertiary)">
                                        <span className="flex items-center gap-1"><VCT_Icons.Calendar size={10} /> {ev.date}</span>
                                        <span className="flex items-center gap-1"><VCT_Icons.MapPin size={10} /> {ev.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                            <VCT_Icons.Flag size={18} className="text-(--vct-warning)" /> Nổi bật
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-(--vct-text-secondary) transition-colors">📸 Album ảnh Giải Trẻ 2024</div>
                            <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-(--vct-text-secondary) transition-colors">🎥 Video highlight tháng 3</div>
                            <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-(--vct-text-secondary) transition-colors">📋 Tài liệu huấn luyện mới</div>
                        </div>
                    </div>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
