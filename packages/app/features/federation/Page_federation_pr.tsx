'use client'

import * as React from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — TRUYỀN THÔNG & PR
// ════════════════════════════════════════

const NEWS_ITEMS = [
    { id: '1', title: 'Giải Vô địch Võ Cổ Truyền Toàn quốc 2024 chính thức khởi tranh', category: 'Giải đấu', date: '12/03/2024', status: 'published', views: 3420, image: '🏆' },
    { id: '2', title: 'Liên đoàn ký kết hợp tác với Liên đoàn Wushu Trung Quốc', category: 'Quốc tế', date: '08/03/2024', status: 'published', views: 2180, image: '🤝' },
    { id: '3', title: 'Khai mạc lớp tập huấn Trọng tài quốc gia 2024', category: 'Đào tạo', date: '05/03/2024', status: 'published', views: 1560, image: '📋' },
    { id: '4', title: 'Thông báo sửa đổi Luật thi đấu 128/2024', category: 'Quy chế', date: '01/03/2024', status: 'published', views: 4200, image: '📜' },
    { id: '5', title: 'VĐV Bình Định giành 3 HCV tại SEA Games', category: 'Thành tích', date: '28/02/2024', status: 'draft', views: 0, image: '🥇' },
    { id: '6', title: 'Kế hoạch phát triển phong trào Võ Cổ Truyền 2024-2026', category: 'Chiến lược', date: '20/02/2024', status: 'review', views: 0, image: '📊' },
]

const MEDIA_STATS = {
    totalArticles: 156, publishedThisMonth: 12,
    totalViews: 45600, socialFollowers: 28400,
}

const CATEGORY_COLORS: Record<string, string> = {
    'Giải đấu': '#10b981', 'Quốc tế': '#0ea5e9', 'Đào tạo': '#8b5cf6',
    'Quy chế': '#f59e0b', 'Thành tích': '#ef4444', 'Chiến lược': '#6366f1',
}

export function Page_federation_pr() {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Truyền thông & PR</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">
                    Quản lý tin tức, bài viết, hình ảnh và truyền thông đối ngoại của Liên đoàn.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng bài viết', value: MEDIA_STATS.totalArticles, icon: <VCT_Icons.FileText size={18} />, color: '#8b5cf6' },
                { label: 'Xuất bản tháng này', value: MEDIA_STATS.publishedThisMonth, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Lượt xem', value: MEDIA_STATS.totalViews.toLocaleString('vi-VN'), icon: <VCT_Icons.Eye size={18} />, color: '#0ea5e9' },
                { label: 'Theo dõi MXH', value: MEDIA_STATS.socialFollowers.toLocaleString('vi-VN'), icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* ── News List ── */}
            <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] uppercase tracking-wide">📰 Bài viết & Tin tức</h2>
                </VCT_Stack>
                <div className="space-y-3">
                    {NEWS_ITEMS.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--vct-bg-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--vct-border-subtle)]">
                            <span className="text-2xl">{item.image}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[var(--vct-text-primary)] truncate">{item.title}</div>
                                <VCT_Stack direction="row" gap={8} align="center" className="mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: (CATEGORY_COLORS[item.category] || '#666') + '20', color: CATEGORY_COLORS[item.category] }}>{item.category}</span>
                                    <span className="text-xs text-[var(--vct-text-secondary)]">{item.date}</span>
                                </VCT_Stack>
                            </div>
                            {item.views > 0 && (
                                <span className="text-xs text-[var(--vct-text-secondary)] hidden sm:flex items-center gap-1">
                                    <VCT_Icons.Eye size={12} /> {item.views.toLocaleString('vi-VN')}
                                </span>
                            )}
                            <VCT_Badge
                                text={item.status === 'published' ? 'Đã xuất bản' : item.status === 'draft' ? 'Bản nháp' : 'Đang duyệt'}
                                type={item.status === 'published' ? 'success' : item.status === 'draft' ? 'neutral' : 'warning'}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
