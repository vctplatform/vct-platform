'use client'

import * as React from 'react'
import { useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_PageContainer, VCT_StatRow
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { usePRArticles, type NewsArticle } from '../hooks/useFederationAPI'

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
    'Giải đấu': 'var(--vct-success)', 'Quốc tế': 'var(--vct-accent-cyan)', 'Đào tạo': 'var(--vct-info)',
    'Quy chế': 'var(--vct-warning)', 'Thành tích': 'var(--vct-danger)', 'Chiến lược': 'var(--vct-info)',
}

const CATEGORY_ICONS: Record<string, string> = {
    'Giải đấu': '🏆', 'Quốc tế': '🤝', 'Đào tạo': '📋',
    'Quy chế': '📜', 'Thành tích': '🥇', 'Chiến lược': '📊',
}

export function Page_federation_pr() {
    const { data: apiData, isLoading } = usePRArticles()

    const articles = useMemo(() => {
        if (apiData && Array.isArray(apiData)) return apiData
        if (apiData && typeof apiData === 'object' && 'items' in apiData) return (apiData as { items: NewsArticle[] }).items
        return NEWS_ITEMS.map(n => ({ ...n, summary: '', content: '', image_url: '', author: 'Ban TT', tags: [] as string[], created_at: '', view_count: n.views || 0 }) as unknown as NewsArticle)
    }, [apiData])

    const publishedCount = articles.filter((a: any) => a.status === 'published').length
    const totalViews = articles.reduce((s: number, a: any) => s + (a.view_count || a.views || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    Truyền thông & PR
                    {isLoading && <span className="ml-2 text-sm font-normal text-(--vct-accent-cyan)">Đang tải...</span>}
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">
                    Quản lý tin tức, bài viết, hình ảnh và truyền thông đối ngoại của Liên đoàn.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng bài viết', value: articles.length, icon: <VCT_Icons.FileText size={18} />, color: 'var(--vct-info)' },
                { label: 'Đã xuất bản', value: publishedCount, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)' },
                { label: 'Lượt xem', value: totalViews.toLocaleString('vi-VN'), icon: <VCT_Icons.Eye size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Theo dõi MXH', value: '28.400', icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-warning)' },
            ] as StatItem[]} className="mb-6" />

            {/* ── News List ── */}
            <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5">
                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                    <h2 className="text-sm font-bold text-(--vct-text-primary) uppercase tracking-wide">📰 Bài viết & Tin tức</h2>
                </VCT_Stack>
                <div className="space-y-3">
                    {articles.map((item: any) =>  {
                        const title = item.title
                        const category = item.category
                        const status = item.status
                        const views = item.view_count || item.views || 0
                        const icon = CATEGORY_ICONS[category] || '📋'
                        return (
                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-(--vct-bg-elevated) transition-colors cursor-pointer border border-transparent hover:border-(--vct-border-subtle)">
                                <span className="text-2xl">{icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-(--vct-text-primary) truncate">{title}</div>
                                    <VCT_Stack direction="row" gap={8} align="center" className="mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: (CATEGORY_COLORS[category] || '#666') + '20', color: CATEGORY_COLORS[category] }}>{category}</span>
                                        {item.summary && <span className="text-xs text-(--vct-text-secondary) truncate max-w-[200px]">{item.summary}</span>}
                                    </VCT_Stack>
                                </div>
                                {views > 0 && (
                                    <span className="text-xs text-(--vct-text-secondary) hidden sm:flex items-center gap-1">
                                        <VCT_Icons.Eye size={12} /> {views.toLocaleString('vi-VN')}
                                    </span>
                                )}
                                <VCT_Badge
                                    text={status === 'published' ? 'Đã xuất bản' : status === 'draft' ? 'Bản nháp' : 'Đang duyệt'}
                                    type={status === 'published' ? 'success' : status === 'draft' ? 'neutral' : 'warning'}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
