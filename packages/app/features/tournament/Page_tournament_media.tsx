'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Tabs, VCT_EmptyState } from '@vct/ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
interface MediaItem {
    id: string
    type: 'photo' | 'video'
    title: string
    category: string
    match?: string
    uploaded_by: string
    uploaded_at: string
    size: string
    thumbnail: string
    status: 'published' | 'review' | 'draft'
}

const MOCK_MEDIA: MediaItem[] = [
    { id: 'MD-001', type: 'photo', title: 'Khai mạc Giải VĐQG 2024', category: 'Sự kiện', uploaded_by: 'Admin', uploaded_at: '15/04/2024', size: '4.2 MB', thumbnail: '🏅', status: 'published' },
    { id: 'MD-002', type: 'video', title: 'Trận CK Đối kháng Nam 60kg', category: 'Đối kháng', match: 'M-128', uploaded_by: 'Camera 1', uploaded_at: '18/04/2024', size: '120 MB', thumbnail: '🎬', status: 'published' },
    { id: 'MD-003', type: 'photo', title: 'Trao HCV Quyền thuật Nữ', category: 'Trao giải', uploaded_by: 'Admin', uploaded_at: '20/04/2024', size: '3.8 MB', thumbnail: '🏆', status: 'published' },
    { id: 'MD-004', type: 'video', title: 'Trận BK Đối kháng Nữ 52kg', category: 'Đối kháng', match: 'M-096', uploaded_by: 'Camera 2', uploaded_at: '17/04/2024', size: '95 MB', thumbnail: '🎬', status: 'review' },
    { id: 'MD-005', type: 'video', title: 'VAR - Khiếu nại trận M-089', category: 'VAR', match: 'M-089', uploaded_by: 'Giám sát', uploaded_at: '17/04/2024', size: '45 MB', thumbnail: '📹', status: 'review' },
    { id: 'MD-006', type: 'photo', title: 'Toàn cảnh sàn đấu ngày 2', category: 'Sự kiện', uploaded_by: 'Admin', uploaded_at: '16/04/2024', size: '5.1 MB', thumbnail: '📸', status: 'published' },
    { id: 'MD-007', type: 'video', title: 'Biểu diễn Long Hổ Quyền', category: 'Quyền thuật', match: 'Q-045', uploaded_by: 'Camera 3', uploaded_at: '19/04/2024', size: '78 MB', thumbnail: '🎬', status: 'draft' },
    { id: 'MD-008', type: 'photo', title: 'Cân lượng ngày 1', category: 'Cân lượng', uploaded_by: 'Staff', uploaded_at: '15/04/2024', size: '2.5 MB', thumbnail: '⚖️', status: 'published' },
]

const CATEGORIES = ['Tất cả', 'Sự kiện', 'Đối kháng', 'Quyền thuật', 'Trao giải', 'VAR', 'Cân lượng']

const STATUS_COLORS: Record<string, { label: string; type: 'success' | 'warning' | 'neutral' }> = {
    published: { label: 'Đã đăng', type: 'success' },
    review: { label: 'Chờ duyệt', type: 'warning' },
    draft: { label: 'Bản nháp', type: 'neutral' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_tournament_media = () => {
    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('Tất cả')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const filtered = useMemo(() => {
        let data = MOCK_MEDIA
        if (catFilter !== 'Tất cả') data = data.filter(m => m.category === catFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(m => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
        }
        return data
    }, [catFilter, search])

    const totalSize = MOCK_MEDIA.reduce((s, m) => s + parseFloat(m.size), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.Image size={24} />}
                title="Quản Lý Media"
                subtitle="Upload, quản lý ảnh/video giải đấu, video review (VAR)."
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(14, 165, 233, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Video size={16} />}>Upload Video</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Upload size={16} />}>Upload Ảnh</VCT_Button>
                    </VCT_Stack>
                }
            />

            <VCT_StatRow items={[
                { label: 'Tổng file', value: MOCK_MEDIA.length, icon: <VCT_Icons.Image size={18} />, color: 'var(--vct-info)' },
                { label: 'Video', value: MOCK_MEDIA.filter(m => m.type === 'video').length, icon: <VCT_Icons.Video size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Ảnh', value: MOCK_MEDIA.filter(m => m.type === 'photo').length, icon: <VCT_Icons.Camera size={18} />, color: 'var(--vct-success)' },
                { label: 'Dung lượng', value: `${totalSize.toFixed(0)} MB`, icon: <VCT_Icons.Layers size={18} />, color: 'var(--vct-warning)' },
            ] as StatItem[]} className="mb-8" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-(--vct-border-subtle) pb-4">
                <VCT_Tabs tabs={CATEGORIES.map(c => ({ key: c, label: c }))} activeTab={catFilter} onChange={setCatFilter} />
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-(--vct-bg-card) rounded-lg p-0.5 border border-(--vct-border-subtle)">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-(--vct-accent-cyan)/20 text-(--vct-accent-cyan)' : 'text-(--vct-text-tertiary)'}`}><VCT_Icons.LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-(--vct-accent-cyan)/20 text-(--vct-accent-cyan)' : 'text-(--vct-text-tertiary)'}`}><VCT_Icons.List size={16} /></button>
                    </div>
                    <div className="w-[250px]">
                        <VCT_SearchInput placeholder="Tìm media..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy" description="Thử thay đổi bộ lọc." icon="📷" />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden hover:border-(--vct-accent-cyan) transition-all cursor-pointer group">
                            <div className="h-32 bg-gradient-to-br from-(--vct-bg-card) to-(--vct-bg-base) flex items-center justify-center text-4xl relative">
                                {item.thumbnail}
                                {item.type === 'video' && <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1.5"><VCT_Icons.Play size={14} className="text-white" /></div>}
                            </div>
                            <div className="p-3">
                                <div className="font-bold text-sm text-(--vct-text-primary) mb-1 truncate group-hover:text-(--vct-accent-cyan) transition-colors">{item.title}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] text-(--vct-text-tertiary)">{item.uploaded_at} • {item.size}</div>
                                    <VCT_Badge text={STATUS_COLORS[item.status]?.label || ''} type={STATUS_COLORS[item.status]?.type || 'neutral'} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">File</th><th className="p-4 text-left">Danh mục</th><th className="p-4 text-left">Trận</th><th className="p-4 text-left">Upload bởi</th><th className="p-4 text-left">Ngày</th><th className="p-4 text-center">Dung lượng</th><th className="p-4 text-center">TT</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">{filtered.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors cursor-pointer">
                                <td className="p-4"><div className="flex items-center gap-3"><span className="text-xl">{item.type === 'video' ? '🎬' : '📸'}</span><div className="font-bold text-sm text-(--vct-text-primary)">{item.title}</div></div></td>
                                <td className="p-4 text-sm text-(--vct-text-secondary)">{item.category}</td>
                                <td className="p-4 text-sm font-mono text-(--vct-accent-cyan)">{item.match || '—'}</td>
                                <td className="p-4 text-sm text-(--vct-text-tertiary)">{item.uploaded_by}</td>
                                <td className="p-4 text-sm text-(--vct-text-tertiary)">{item.uploaded_at}</td>
                                <td className="p-4 text-center text-sm text-(--vct-text-secondary)">{item.size}</td>
                                <td className="p-4 text-center"><VCT_Badge text={STATUS_COLORS[item.status]?.label || ''} type={STATUS_COLORS[item.status]?.type || 'neutral'} /></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
