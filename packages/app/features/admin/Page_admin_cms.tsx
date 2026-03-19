'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_Modal, VCT_Input,
    VCT_ConfirmDialog
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface CMSConfigItem {
    id: string
    key: string
    value: any
    category: string
    label: string
    description: string
    type: 'text' | 'color' | 'image' | 'boolean' | 'json' | 'number' | 'select'
    options?: string[]
    updated_at?: string
}

interface CMSCategory {
    id: string
    label: string
    icon: React.ReactNode
    description: string
    color: string
}

// ════════════════════════════════════════
// CMS CONFIG CATEGORIES
// ════════════════════════════════════════
const CMS_CATEGORIES: CMSCategory[] = [
    { id: 'branding', label: 'Thương hiệu', icon: <VCT_Icons.Star size={18} />, description: 'Logo, tên, favicon, slogan nền tảng', color: '#f59e0b' },
    { id: 'theme', label: 'Giao diện', icon: <VCT_Icons.Palette size={18} />, description: 'Màu sắc, dark/light mode, font chữ', color: '#8b5cf6' },
    { id: 'navigation', label: 'Điều hướng', icon: <VCT_Icons.Columns size={18} />, description: 'Menu chính, sidebar, footer links', color: '#0ea5e9' },
    { id: 'homepage', label: 'Trang chủ', icon: <VCT_Icons.Home size={18} />, description: 'Hero banner, thông báo, nổi bật', color: '#10b981' },
    { id: 'seo', label: 'SEO & Meta', icon: <VCT_Icons.Globe size={18} />, description: 'Title, description, OG image', color: '#06b6d4' },
    { id: 'advanced', label: 'Nâng cao', icon: <VCT_Icons.Settings size={18} />, description: 'Custom CSS, HTML head inject, scripts', color: '#ef4444' },
]

// Default CMS config template (shown when no data from API)
const DEFAULT_CMS_ITEMS: Omit<CMSConfigItem, 'id' | 'updated_at'>[] = [
    // Branding
    { key: 'branding.platform_name', value: 'VCT Platform', category: 'branding', label: 'Tên Nền Tảng', description: 'Tên hiển thị của platform trên header, title, email', type: 'text' },
    { key: 'branding.tagline', value: 'Nền tảng Quản trị Võ Cổ Truyền Việt Nam', category: 'branding', label: 'Slogan', description: 'Dòng mô tả ngắn hiển thị dưới logo', type: 'text' },
    { key: 'branding.logo_url', value: '/assets/logo-vct.svg', category: 'branding', label: 'Logo URL', description: 'Đường dẫn hình logo chính', type: 'text' },
    { key: 'branding.favicon_url', value: '/favicon.ico', category: 'branding', label: 'Favicon URL', description: 'Đường dẫn favicon', type: 'text' },
    { key: 'branding.copyright', value: '© 2024 VCT Platform', category: 'branding', label: 'Copyright', description: 'Text copyright hiển thị ở footer', type: 'text' },
    // Theme
    { key: 'theme.primary_color', value: '#0ea5e9', category: 'theme', label: 'Màu chính (Primary)', description: 'Màu accent chính cho nút, link, highlight', type: 'color' },
    { key: 'theme.secondary_color', value: '#8b5cf6', category: 'theme', label: 'Màu phụ (Secondary)', description: 'Màu phụ cho badges, icons, gradient', type: 'color' },
    { key: 'theme.success_color', value: '#10b981', category: 'theme', label: 'Màu thành công', description: 'Màu cho badge success, thông báo OK', type: 'color' },
    { key: 'theme.danger_color', value: '#ef4444', category: 'theme', label: 'Màu nguy hiểm', description: 'Màu cho lỗi, xóa, cảnh báo nghiêm trọng', type: 'color' },
    { key: 'theme.default_mode', value: 'dark', category: 'theme', label: 'Theme mặc định', description: 'Chế độ hiển thị mặc định cho người dùng mới', type: 'select', options: ['light', 'dark', 'system'] },
    { key: 'theme.border_radius', value: '12', category: 'theme', label: 'Border Radius (px)', description: 'Độ bo tròn mặc định cho card, button', type: 'number' },
    // Navigation
    { key: 'nav.show_search', value: true, category: 'navigation', label: 'Hiển thị Search', description: 'Hiển thị thanh tìm kiếm trên header', type: 'boolean' },
    { key: 'nav.show_notifications', value: true, category: 'navigation', label: 'Hiển thị Thông báo', description: 'Hiển thị icon chuông thông báo', type: 'boolean' },
    { key: 'nav.footer_links', value: '[]', category: 'navigation', label: 'Footer Links (JSON)', description: 'Danh sách link ở footer [{ label, href }]', type: 'json' },
    // Homepage
    { key: 'homepage.hero_title', value: 'Nền Tảng Quản Trị Võ Cổ Truyền', category: 'homepage', label: 'Hero Title', description: 'Tiêu đề lớn trên trang chủ', type: 'text' },
    { key: 'homepage.hero_subtitle', value: 'Số hóa toàn diện hệ sinh thái võ cổ truyền Việt Nam', category: 'homepage', label: 'Hero Subtitle', description: 'Mô tả dưới tiêu đề hero', type: 'text' },
    { key: 'homepage.announcement', value: '', category: 'homepage', label: 'Thông báo Banner', description: 'Nội dung thông báo hiển thị trên header (để trống = ẩn)', type: 'text' },
    { key: 'homepage.announcement_color', value: '#f59e0b', category: 'homepage', label: 'Màu Banner Thông báo', description: 'Màu nền của banner thông báo', type: 'color' },
    // SEO
    { key: 'seo.site_title', value: 'VCT Platform — Quản trị Võ Cổ Truyền', category: 'seo', label: 'Site Title', description: 'Tiêu đề hiển thị trên tab trình duyệt', type: 'text' },
    { key: 'seo.meta_description', value: 'Nền tảng quản trị toàn diện cho Võ Cổ Truyền Việt Nam.', category: 'seo', label: 'Meta Description', description: 'Mô tả hiển thị trên Google Search', type: 'text' },
    { key: 'seo.og_image', value: '/assets/og-vct.png', category: 'seo', label: 'OG Image URL', description: 'Hình ảnh preview khi chia sẻ trên MXH', type: 'text' },
    // Advanced
    { key: 'advanced.custom_css', value: '', category: 'advanced', label: 'Custom CSS', description: 'CSS tùy chỉnh inject vào toàn hệ thống (nguy hiểm!)', type: 'json' },
    { key: 'advanced.head_scripts', value: '', category: 'advanced', label: 'Head Scripts', description: 'Scripts inject vào <head> — analytics, tracking', type: 'json' },
    { key: 'advanced.maintenance_mode', value: false, category: 'advanced', label: 'Chế độ Bảo trì', description: 'Bật chế độ bảo trì — chỉ admin truy cập được', type: 'boolean' },
]

// ════════════════════════════════════════
// COLOR PICKER COMPONENT
// ════════════════════════════════════════
const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3">
        <div
            className="admin-color-swatch admin-color-swatch--picker"
            style={{ '--_swatch-color': value } as React.CSSProperties}
        >
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Chọn màu"
            />
        </div>
        <VCT_Input
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="font-mono text-xs"
        />
    </div>
)

// ════════════════════════════════════════
// CONFIG FIELD RENDERER
// ════════════════════════════════════════
const ConfigFieldEditor = ({ item, value, onChange }: {
    item: Omit<CMSConfigItem, 'id' | 'updated_at'>
    value: any
    onChange: (val: any) => void
}) => {
    switch (item.type) {
        case 'color':
            return <ColorPicker value={String(value || '#000000')} onChange={onChange} />
        case 'boolean':
            return (
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    aria-label={`Chuyển đổi ${item.label}`}
                    className={`relative w-14 h-7 rounded-full transition-all duration-200 ${
                        value ? 'bg-[#10b981]' : 'bg-(--vct-bg-base) border border-(--vct-border-strong)'
                    }`}
                >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        value ? 'translate-x-7' : 'translate-x-0.5'
                    }`} />
                </button>
            )
        case 'number':
            return (
                <VCT_Input
                    type="number"
                    value={String(value ?? '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
                />
            )
        case 'select':
            return (
                <div className="flex gap-2">
                    {(item.options ?? []).map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onChange(opt)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                                value === opt
                                    ? 'bg-[#0ea5e920] border-[#0ea5e9] text-[#0ea5e9]'
                                    : 'bg-(--vct-bg-base) border-(--vct-border-subtle) text-(--vct-text-tertiary) hover:border-(--vct-border-strong)'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )
        case 'json':
            return (
                <textarea
                    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    onChange={e => onChange(e.target.value)}
                    rows={4}
                    placeholder="JSON data..."
                    aria-label={item.label}
                    className="w-full px-3 py-2 bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-lg text-xs font-mono text-(--vct-text-primary) placeholder:text-(--vct-text-tertiary) focus:outline-none focus:border-(--vct-accent-cyan) resize-y"
                />
            )
        default: // text
            return (
                <VCT_Input
                    value={String(value ?? '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    placeholder={item.description}
                />
            )
    }
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_cms = () => (
    <AdminGuard>
        <Page_admin_cms_Content />
    </AdminGuard>
)

const Page_admin_cms_Content = () => {
    const { t } = useI18n()
    const { showToast } = useShellToast()

    // Fetch existing config from backend
    const { data: apiConfigs, isLoading, refetch } = useAdminFetch<CMSConfigItem[]>('/admin/cms/config')

    // Local config state — starts with defaults, merged with API data
    const [configs, setConfigs] = useState<Record<string, any>>({})
    const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())
    const [activeCategory, setActiveCategory] = useState('branding')
    const [saving, setSaving] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    // Initialize from defaults, then overlay with API data
    useEffect(() => {
        const initial: Record<string, any> = {}
        DEFAULT_CMS_ITEMS.forEach(item => { initial[item.key] = item.value })
        if (apiConfigs && Array.isArray(apiConfigs)) {
            apiConfigs.forEach((item: CMSConfigItem) => {
                if (item.key) initial[item.key] = item.value
            })
        }
        setConfigs(initial)
    }, [apiConfigs])

    const { mutate: saveCmsConfig } = useAdminMutation<any, any>(
        '/admin/cms/config',
        { method: 'PUT', onError: () => showToast('Lỗi khi lưu cấu hình', 'error') }
    )

    const handleChange = useCallback((key: string, value: any) => {
        setConfigs(prev => ({ ...prev, [key]: value }))
        setDirtyKeys(prev => new Set(prev).add(key))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Save each dirty config item
            const promises = Array.from(dirtyKeys).map(key => {
                const defaultItem = DEFAULT_CMS_ITEMS.find(d => d.key === key)
                return saveCmsConfig({
                    key,
                    value: configs[key],
                    category: defaultItem?.category ?? 'branding',
                    label: defaultItem?.label ?? key,
                    description: defaultItem?.description ?? '',
                    type: defaultItem?.type ?? 'text',
                })
            })
            await Promise.all(promises)
            setDirtyKeys(new Set())
            showToast(`Đã lưu ${promises.length} cấu hình thành công!`)
            refetch()
        } catch {
            showToast('Có lỗi khi lưu cấu hình', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleResetAll = () => {
        const initial: Record<string, any> = {}
        DEFAULT_CMS_ITEMS.forEach(item => { initial[item.key] = item.value })
        setConfigs(initial)
        setDirtyKeys(new Set(DEFAULT_CMS_ITEMS.map(i => i.key)))
        setConfirmReset(false)
        showToast('Đã khôi phục về cấu hình mặc định. Nhấn "Lưu" để áp dụng.', 'warning')
    }

    const categoryItems = DEFAULT_CMS_ITEMS.filter(i => i.category === activeCategory)
    const activeCat = CMS_CATEGORIES.find(c => c.id === activeCategory)

    const stats: StatItem[] = [
        { label: 'Cấu hình', value: DEFAULT_CMS_ITEMS.length, icon: <VCT_Icons.Settings size={18} />, color: '#0ea5e9' },
        { label: 'Đã thay đổi', value: dirtyKeys.size, icon: <VCT_Icons.Edit size={18} />, color: dirtyKeys.size > 0 ? '#f59e0b' : '#10b981' },
        { label: 'Danh mục', value: CMS_CATEGORIES.length, icon: <VCT_Icons.Layers size={18} />, color: '#8b5cf6' },
        { label: 'Trạng thái', value: saving ? 'Saving...' : dirtyKeys.size > 0 ? 'Unsaved' : 'Synced', icon: <VCT_Icons.CheckCircle size={18} />, color: dirtyKeys.size > 0 ? '#f59e0b' : '#10b981' },
    ]

    return (
        <AdminPageShell
            title="CMS — Quản Trị Nội Dung"
            subtitle="Cấu hình giao diện, thương hiệu và nội dung toàn hệ thống — không cần đụng code."
            icon={<VCT_Icons.Layout size={28} className="text-[#8b5cf6]" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'CMS' },
            ]}
            stats={stats}
            actions={
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Eye size={16} />} onClick={() => setPreviewOpen(true)}>
                        Preview
                    </VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>
                        Reset
                    </VCT_Button>
                    <VCT_Button
                        onClick={handleSave}
                        disabled={dirtyKeys.size === 0 || saving}
                        icon={<VCT_Icons.Check size={16} />}
                    >
                        {saving ? 'Đang lưu...' : `Lưu (${dirtyKeys.size})`}
                    </VCT_Button>
                </VCT_Stack>
            }
        >

            {/* ── UNSAVED CHANGES BANNER ── */}
            {dirtyKeys.size > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-[#f59e0b40] bg-[#f59e0b10] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <VCT_Icons.AlertCircle size={20} className="text-[#f59e0b]" />
                        <span className="text-sm font-semibold text-[#f59e0b]">
                            {dirtyKeys.size} thay đổi chưa lưu
                        </span>
                    </div>
                    <VCT_Button size="sm" onClick={handleSave} disabled={saving} icon={<VCT_Icons.Check size={14} />}>
                        Lưu ngay
                    </VCT_Button>
                </div>
            )}

            {/* ── CATEGORY TABS ── */}
            <div className="flex flex-wrap gap-3 mb-8">
                {CMS_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                            activeCategory === cat.id
                                ? 'border-transparent shadow-lg'
                                : 'bg-transparent border-(--vct-border-subtle) text-(--vct-text-tertiary) hover:border-(--vct-border-strong)'
                        }`}
                        style={activeCategory === cat.id ? {
                            '--_tab-color': cat.color,
                        } as React.CSSProperties : undefined}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* ── ACTIVE CATEGORY HEADER ── */}
            {activeCat && (
                <div className="mb-6 flex items-center gap-3">
                    <div className="admin-cms-cat-icon" style={{ '--_cat-color': activeCat.color } as React.CSSProperties}>
                        {activeCat.icon}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-(--vct-text-primary)">{activeCat.label}</h2>
                        <p className="text-xs text-(--vct-text-tertiary)">{activeCat.description}</p>
                    </div>
                </div>
            )}

            {/* ── CONFIG FIELDS GRID ── */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-5 bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl animate-pulse">
                            <div className="h-4 w-32 bg-(--vct-bg-card) rounded mb-3" />
                            <div className="h-10 w-full bg-(--vct-bg-card) rounded mb-2" />
                            <div className="h-3 w-48 bg-(--vct-bg-card) rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categoryItems.map(item => {
                        const isDirty = dirtyKeys.has(item.key)
                        return (
                            <div
                                key={item.key}
                                className={`p-5 rounded-2xl border transition-all ${
                                    isDirty
                                        ? 'bg-[#f59e0b08] border-[#f59e0b40] shadow-[0_0_20px_#f59e0b10]'
                                        : 'bg-(--vct-bg-elevated) border-(--vct-border-strong)'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="font-bold text-sm text-(--vct-text-primary) flex items-center gap-2">
                                            {item.label}
                                            {isDirty && <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />}
                                        </div>
                                        <div className="text-[10px] font-mono text-(--vct-text-tertiary) mt-0.5">{item.key}</div>
                                    </div>
                                    <VCT_Badge
                                        type={item.type === 'boolean' ? 'info' : item.type === 'color' ? 'warning' : 'neutral'}
                                        text={item.type}
                                    />
                                </div>

                                <ConfigFieldEditor
                                    item={item}
                                    value={configs[item.key]}
                                    onChange={val => handleChange(item.key, val)}
                                />

                                <p className="text-[11px] text-(--vct-text-tertiary) mt-2">{item.description}</p>
                            </div>
                        )
                    })}
                </div>
            )}

            {categoryItems.length === 0 && !isLoading && (
                <div className="text-center py-16 text-(--vct-text-tertiary)">
                    <VCT_Icons.Settings size={48} className="mx-auto mb-4 opacity-30" />
                    <div className="text-lg font-bold mb-1">Không có cấu hình</div>
                    <p className="text-sm">Danh mục này chưa có cấu hình nào.</p>
                </div>
            )}

            {/* ── PREVIEW MODAL ── */}
            <VCT_Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview Cấu Hình" width="600px">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Branding Preview */}
                    <div className="rounded-xl border border-(--vct-border-subtle) p-4 bg-(--vct-bg-base)">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-3">Thương hiệu</div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-(--vct-bg-elevated) flex items-center justify-center text-xs">🏛️</div>
                            <div>
                                <div className="font-bold text-(--vct-text-primary)">{configs['branding.platform_name'] || 'VCT Platform'}</div>
                                <div className="text-xs text-(--vct-text-tertiary)">{configs['branding.tagline'] || '...'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Preview */}
                    <div className="rounded-xl border border-(--vct-border-subtle) p-4 bg-(--vct-bg-base)">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-3">Bảng màu</div>
                        <div className="flex gap-3">
                            {['theme.primary_color', 'theme.secondary_color', 'theme.success_color', 'theme.danger_color'].map(key => {
                                const label = DEFAULT_CMS_ITEMS.find(i => i.key === key)?.label ?? key
                                return (
                                    <div key={key} className="text-center">
                                        <div className="admin-color-swatch admin-color-swatch--sm rounded-xl" style={{ '--_swatch-color': configs[key] ?? '#000' } as React.CSSProperties} />
                                        <div className="text-[9px] text-(--vct-text-tertiary)">{label.replace('Màu ', '')}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Homepage Preview */}
                    <div className="rounded-xl border border-(--vct-border-subtle) p-4 bg-(--vct-bg-base)">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-3">Trang chủ</div>
                        {configs['homepage.announcement'] && (
                            <div className="admin-announcement-banner" style={{ '--_banner-color': configs['homepage.announcement_color'] || '#f59e0b' } as React.CSSProperties}>
                                📢 {configs['homepage.announcement']}
                            </div>
                        )}
                        <div className="font-bold text-lg text-(--vct-text-primary)">{configs['homepage.hero_title'] || '...'}</div>
                        <div className="text-sm text-(--vct-text-secondary) mt-1">{configs['homepage.hero_subtitle'] || '...'}</div>
                    </div>

                    {/* SEO Preview */}
                    <div className="rounded-xl border border-(--vct-border-subtle) p-4 bg-(--vct-bg-base)">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-3">Google Search Preview</div>
                        <div className="rounded-lg bg-white p-3">
                            <div className="text-[#1a0dab] text-base font-medium hover:underline cursor-pointer">{configs['seo.site_title'] || 'VCT Platform'}</div>
                            <div className="text-[#006621] text-xs mt-0.5">https://vct-platform.vn</div>
                            <div className="text-[#545454] text-xs mt-1 line-clamp-2">{configs['seo.meta_description'] || '...'}</div>
                        </div>
                    </div>

                    {/* All Config JSON */}
                    <div className="rounded-xl border border-(--vct-border-subtle) p-4 bg-(--vct-bg-base)">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-3">Raw Config (JSON)</div>
                        <pre className="text-[10px] font-mono text-(--vct-text-secondary) bg-(--vct-bg-elevated) rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(configs, null, 2)}
                        </pre>
                    </div>
                </div>
            </VCT_Modal>

            {/* ── CONFIRM RESET ── */}
            <VCT_ConfirmDialog
                isOpen={confirmReset}
                onClose={() => setConfirmReset(false)}
                onConfirm={handleResetAll}
                title="Khôi phục mặc định"
                message="Thao tác này sẽ khôi phục TOÀN BỘ cấu hình CMS về giá trị mặc định. Bạn cần nhấn Lưu sau khi reset để áp dụng."
                confirmLabel="Khôi phục"
            />
        </AdminPageShell>
    )
}
