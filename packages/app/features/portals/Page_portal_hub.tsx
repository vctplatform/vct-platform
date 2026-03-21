'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Portal Hub (v2 — Scalable Category Layout)
// Hierarchical category grouping, search, collapse/expand,
// designed to scale to 100+ organizations over 50 years.
// ════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_Icons } from '../components/vct-icons'
import { useTheme } from '../theme/ThemeProvider'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n'
import { resolveWorkspacesForUser } from '../layout/workspace-resolver'
import type { WorkspaceCard, WorkspaceType, WorkspaceCategory } from '../layout/workspace-types'
import { WORKSPACE_META, WORKSPACE_CATEGORIES, getCategoryForType } from '../layout/workspace-types'
import { UI_Logo } from '../components/ui-logo'

// ── Constants ───────────────────────────────────────────────
const COLLAPSED_SHOW_COUNT = 4
const RECENT_MAX = 3

// ── Mock Data ───────────────────────────────────────────────
const MOCK_USER = {
    name: 'Nguyễn Văn Admin',
    email: 'admin@vct.vn',
    avatar: '',
}

const WORKSPACE_DESTINATIONS: Record<WorkspaceType, string> = {
    federation_admin: '/dashboard',
    federation_provincial: '/provincial',
    federation_discipline: '/discipline',
    federation_heritage: '/heritage/dashboard',
    training_management: '/training/dashboard',
    tournament_ops: '/giai-dau',
    club_management: '/clubs',
    referee_console: '/referee-scoring',
    athlete_portal: '/athlete-portal',
    parent_portal: '/parent',
    public_spectator: '/scoreboard',
    system_admin: '/admin',
}

const WORKSPACE_STATS: Partial<Record<WorkspaceType, WorkspaceCard['stats']>> = {
    federation_admin: [
        { label: 'CLB', value: 128 },
        { label: 'VĐV', value: '2,450' },
        { label: 'Giải/Năm', value: 12 },
    ],
    federation_heritage: [
        { label: 'Môn phái', value: 34 },
        { label: 'Võ sư', value: 210 },
        { label: 'Kỹ thuật', value: 1500 },
    ],
    training_management: [
        { label: 'Giáo trình', value: 12 },
        { label: 'Kỳ thi', value: 4 },
        { label: 'Chứng chỉ', value: 852 },
    ],
    tournament_ops: [
        { label: 'VĐV', value: 486 },
        { label: 'Đơn vị', value: 42 },
        { label: 'Nội dung', value: 68 },
    ],
    club_management: [
        { label: 'Võ sinh', value: 67 },
        { label: 'Lớp/Tuần', value: 12 },
        { label: 'Chuyên cần', value: '85%' },
    ],
    referee_console: [
        { label: 'Trận hôm nay', value: 8 },
        { label: 'Đã chấm', value: 24 },
        { label: 'VAR', value: 3 },
    ],
    athlete_portal: [
        { label: 'BXH', value: '#42' },
        { label: 'Huy chương', value: 7 },
        { label: 'ELO', value: '1,680' },
    ],
    parent_portal: [
        { label: 'Con em', value: 2 },
        { label: 'Đồng thuận', value: 4 },
        { label: 'Điểm danh', value: '96%' },
    ],
    public_spectator: [
        { label: 'Đang LIVE', value: 3 },
        { label: 'Giải', value: 2 },
        { label: 'Tin mới', value: 18 },
    ],
    system_admin: [
        { label: 'Users', value: 3240 },
        { label: 'Uptime', value: '99.8%' },
        { label: 'Alerts', value: 2 },
    ],
}

// ── Mock workspace cards for demo ───────────────────────────
const MOCK_WORKSPACE_CARDS: WorkspaceCard[] = [
    {
        id: 'sysadmin:system', type: 'system_admin',
        scope: { type: 'system', id: 'system', name: 'Hệ thống' },
        label: 'Quản trị hệ thống', description: 'Users, Roles, Feature Flags, Audit',
        icon: 'Settings', color: '#64748b', gradient: 'from-[#64748b] to-[#475569]',
        badge: 'Admin', stats: WORKSPACE_STATS.system_admin,
    },
    {
        id: 'fed:lien-doan-vct', type: 'federation_admin',
        scope: { type: 'federation', id: 'fed-001', name: 'Liên đoàn VCT Việt Nam' },
        label: 'Liên đoàn VCT Việt Nam', description: 'Quản trị tổ chức, CLB, phê duyệt giải đấu',
        icon: 'Building', color: '#8b5cf6', gradient: 'from-[#8b5cf6] to-[#6d28d9]',
        badge: 'Admin', stats: WORKSPACE_STATS.federation_admin,
        lastAccessed: 'Đang hoạt động',
    },
    {
        id: 'heritage:fed', type: 'federation_heritage',
        scope: { type: 'federation', id: 'fed-001', name: 'Di sản VCT' },
        label: 'Di sản & Bảng xếp hạng', description: 'Quản lý bảng xếp hạng, môn phái, và kỹ thuật',
        icon: 'Network', color: '#e879f9', gradient: 'from-[#e879f9] to-[#c026d3]',
        badge: 'Admin', stats: WORKSPACE_STATS.federation_heritage,
    },
    {
        id: 'training:fed', type: 'training_management',
        scope: { type: 'federation', id: 'fed-001', name: 'Đào tạo VCT' },
        label: 'Đào tạo & Học thuật', description: 'Quản lý giáo trình, kỹ thuật và thi thăng cấp',
        icon: 'BookOpen', color: '#14b8a6', gradient: 'from-[#14b8a6] to-[#0f766e]',
        badge: 'Admin', stats: WORKSPACE_STATS.training_management,
    },
    {
        id: 'tourn:giai-qg-2026', type: 'tournament_ops',
        scope: { type: 'tournament', id: 'tourn-001', name: 'Giải VĐQG 2026' },
        label: 'Giải Vô Địch Quốc Gia 2026', description: 'Điều hành giải từ chuẩn bị đến kết quả',
        icon: 'Trophy', color: '#ef4444', gradient: 'from-[#ef4444] to-[#dc2626]',
        badge: 'Ban tổ chức', stats: WORKSPACE_STATS.tournament_ops,
    },
    {
        id: 'tourn:cup-truyen-thong', type: 'tournament_ops',
        scope: { type: 'tournament', id: 'tourn-002', name: 'Cúp Truyền Thống 2026' },
        label: 'Cúp Truyền Thống TP.HCM 2026', description: 'Điều hành giải từ chuẩn bị đến kết quả',
        icon: 'Trophy', color: '#ef4444', gradient: 'from-[#f97316] to-[#ea580c]',
        badge: 'Điều phối',
    },
    {
        id: 'club:son-long', type: 'club_management',
        scope: { type: 'club', id: 'club-001', name: 'CLB Sơn Long Quyền' },
        label: 'CLB Sơn Long Quyền', description: 'Võ sinh, đào tạo, điểm danh, tài chính',
        icon: 'Home', color: '#f59e0b', gradient: 'from-[#f59e0b] to-[#d97706]',
        badge: 'HLV trưởng', stats: WORKSPACE_STATS.club_management,
    },
    {
        id: 'athlete:self', type: 'athlete_portal',
        scope: { type: 'user', id: 'user-001', name: 'Nguyễn Văn Admin' },
        label: 'Hồ sơ VĐV cá nhân', description: 'Hồ sơ, thành tích, đăng ký giải',
        icon: 'User', color: '#10b981', gradient: 'from-[#10b981] to-[#059669]',
        stats: WORKSPACE_STATS.athlete_portal,
    },
    {
        id: 'public:spectator', type: 'public_spectator',
        scope: { type: 'public', id: 'public', name: 'Công cộng' },
        label: 'Xem trực tiếp & Tin tức', description: 'Live score, BXH, tin tức cộng đồng',
        icon: 'Monitor', color: '#ec4899', gradient: 'from-[#ec4899] to-[#db2777]',
        stats: WORKSPACE_STATS.public_spectator,
    },
]

// ── Helpers ─────────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
}

function formatRoleBadge(role: string) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getIconComponent(iconName: string) {
    const iconMap: Record<string, keyof typeof VCT_Icons> = {
        'Building': 'Building', 'Trophy': 'Trophy', 'Home': 'Building2',
        'Scale': 'Scale', 'User': 'User', 'Users': 'Users',
        'Monitor': 'MonitorPlay', 'Settings': 'Settings', 'Network': 'Network',
        'BookOpen': 'Book', 'MapPin': 'MapPin', 'ShieldAlert': 'Shield',
    }
    return VCT_Icons[iconMap[iconName] || 'Dashboard'] || null
}

// ── Category group data ─────────────────────────────────────
interface CategoryGroup {
    category: WorkspaceCategory
    label: string
    icon: string
    color: string
    order: number
    cards: WorkspaceCard[]
}

function groupByCategory(cards: WorkspaceCard[]): CategoryGroup[] {
    const groups = new Map<WorkspaceCategory, WorkspaceCard[]>()

    for (const card of cards) {
        const cat = getCategoryForType(card.type)
        if (!groups.has(cat)) groups.set(cat, [])
        groups.get(cat)!.push(card)
    }

    return Array.from(groups.entries())
        .map(([cat, catCards]) => ({
            category: cat,
            label: WORKSPACE_CATEGORIES[cat].label,
            icon: WORKSPACE_CATEGORIES[cat].icon,
            color: WORKSPACE_CATEGORIES[cat].color,
            order: WORKSPACE_CATEGORIES[cat].order,
            cards: catCards,
        }))
        .sort((a, b) => a.order - b.order)
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export function Page_portal_hub() {
    const router = useRouter()
    const { currentUser, activeWorkspace, setActiveWorkspace } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { t } = useI18n()
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('vct-portal-view') as 'grid' | 'list') || 'grid'
        }
        return 'grid'
    })

    // Resolve workspaces from auth context
    const resolvedWorkspaces = useMemo(
        () => resolveWorkspacesForUser(currentUser),
        [currentUser]
    )

    // Build workspace cards
    const workspaceCards = useMemo(() => {
        if (resolvedWorkspaces.length === 0) return MOCK_WORKSPACE_CARDS

        return resolvedWorkspaces.flatMap<WorkspaceCard>((workspace) => {
            const meta = WORKSPACE_META[workspace.type]
            if (!meta) return []
            const isActive =
                activeWorkspace?.type === workspace.type &&
                activeWorkspace.scopeId === workspace.scopeId

            return [{
                id: `${workspace.type}:${workspace.scopeId}`,
                type: workspace.type,
                scope: {
                    type:
                        workspace.type === 'system_admin' ? 'system'
                            : workspace.type === 'public_spectator' ? 'public'
                                : workspace.type === 'athlete_portal' || workspace.type === 'parent_portal' ? 'user'
                                    : workspace.type === 'club_management' ? 'club'
                                        : workspace.type === 'federation_provincial' ? 'province'
                                            : workspace.type === 'tournament_ops' || workspace.type === 'referee_console' ? 'tournament'
                                                : 'federation',
                    id: workspace.scopeId,
                    name: workspace.scopeName,
                },
                label: t(workspace.scopeName),
                description: t(meta.description),
                icon: meta.icon,
                color: meta.color,
                gradient: meta.gradient,
                badge: formatRoleBadge(workspace.role),
                stats: WORKSPACE_STATS[workspace.type],
                lastAccessed: isActive ? 'Đang hoạt động' : undefined,
            }]
        })
    }, [activeWorkspace?.scopeId, activeWorkspace?.type, resolvedWorkspaces, t])

    // Search filter
    const filteredCards = useMemo(() => {
        if (!searchQuery.trim()) return workspaceCards
        const q = searchQuery.toLowerCase().trim()
        return workspaceCards.filter(c =>
            c.label.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            (c.scope.name && c.scope.name.toLowerCase().includes(q))
        )
    }, [searchQuery, workspaceCards])

    // Group into categories
    const categoryGroups = useMemo(() => groupByCategory(filteredCards), [filteredCards])

    // Recent workspaces (those with lastAccessed or first 3)
    const recentCards = useMemo(() => {
        const active = workspaceCards.filter(c => c.lastAccessed)
        if (active.length >= RECENT_MAX) return active.slice(0, RECENT_MAX)
        const rest = workspaceCards.filter(c => !c.lastAccessed).slice(0, RECENT_MAX - active.length)
        return [...active, ...rest]
    }, [workspaceCards])

    // Toggle category expansion
    const toggleCategory = useCallback((cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(cat)) next.delete(cat)
            else next.add(cat)
            return next
        })
    }, [])

    // Change view mode and persist
    const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
        setViewMode(mode)
        if (typeof window !== 'undefined') {
            localStorage.setItem('vct-portal-view', mode)
        }
    }, [])

    // Navigate to workspace
    const handleEnterWorkspace = useCallback((card: WorkspaceCard) => {
        const selectedWorkspace = resolvedWorkspaces.find(
            (workspace) =>
                workspace.type === card.type &&
                workspace.scopeId === card.scope.id
        )

        if (selectedWorkspace) {
            setActiveWorkspace(selectedWorkspace)
        }

        router.push(WORKSPACE_DESTINATIONS[card.type] || '/')
    }, [resolvedWorkspaces, setActiveWorkspace, router])

    const isSearching = searchQuery.trim().length > 0

    return (
        <div className="min-h-screen w-full overflow-x-hidden font-[Inter,sans-serif] transition-colors duration-300" style={{ background: 'var(--vct-bg-base)' }}>
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-start justify-between px-8 pb-5 pt-10 md:px-12">
                <div className="flex items-center gap-4">
                    <UI_Logo size={56} />
                    <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-[4px] text-vct-text">VCT PLATFORM</div>
                        <div className="mt-0.5 text-[13px] text-vct-text-muted">Nền tảng Quản trị Võ thuật Toàn diện</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-vct-border transition-all duration-200 hover:border-vct-accent hover:shadow-(--vct-shadow-glow)" style={{ background: 'var(--vct-bg-elevated)' }}
                    >
                        {theme === 'dark'
                            ? <VCT_Icons.Sun size={18} className="text-amber-400" />
                            : <VCT_Icons.Moon size={18} className="text-vct-text-muted" />
                        }
                    </button>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-vct-text">{currentUser.name || MOCK_USER.name}</div>
                        <div className="text-xs text-vct-text-muted">{currentUser.email || MOCK_USER.email}</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white" style={{ background: 'var(--vct-accent-gradient)' }}>
                        {getInitials(currentUser.name || MOCK_USER.name)}
                    </div>
                </div>
            </div>

            {/* ── Hero + Search ───────────────────────────── */}
            <div className="px-8 pb-6 pt-5 text-center md:px-12">
                <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-vct-text">Chọn không gian làm việc</h1>
                <p className="mx-auto max-w-[600px] text-base text-vct-text-muted">
                    Bạn có <strong className="text-vct-accent">{workspaceCards.length} workspace</strong>{' '}
                    khả dụng, phân theo {categoryGroups.length} nhóm chức năng.
                </p>

                {/* Search Bar */}
                <div className="mx-auto mt-6 max-w-[560px]">
                    <div className="relative">
                        <VCT_Icons.Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-vct-text-muted"
                        />
                        <input
                            id="portal-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm workspace theo tên, liên đoàn, CLB..."
                            className="w-full rounded-2xl border border-vct-border py-3.5 pl-11 pr-12 text-sm text-vct-text placeholder:text-vct-text-muted/60 transition-all duration-200 focus:border-vct-accent focus:outline-none focus:ring-2 focus:ring-vct-accent/20"
                            style={{ background: 'var(--vct-bg-elevated)' }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                title="Xóa tìm kiếm"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-vct-text-muted hover:text-vct-text transition-colors"
                            >
                                <VCT_Icons.X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* View Toggle */}
                <div className="mx-auto mt-4 flex items-center justify-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleViewModeChange('grid')}
                        className={`rounded-lg p-2 transition-all ${viewMode === 'grid'
                            ? 'bg-vct-accent/15 text-vct-accent'
                            : 'text-vct-text-muted hover:text-vct-text'}`}
                        title="Chế độ lưới"
                    >
                        <VCT_Icons.LayoutGrid size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleViewModeChange('list')}
                        className={`rounded-lg p-2 transition-all ${viewMode === 'list'
                            ? 'bg-vct-accent/15 text-vct-accent'
                            : 'text-vct-text-muted hover:text-vct-text'}`}
                        title="Chế độ danh sách"
                    >
                        <VCT_Icons.List size={18} />
                    </button>
                </div>
            </div>

            {/* ── Recent Workspaces (only when not searching) ─ */}
            {!isSearching && recentCards.length > 0 && (
                <div className="mx-auto max-w-[1400px] px-8 pb-6 xl:px-12">
                    <div className="mb-3 flex items-center gap-2">
                        <VCT_Icons.Clock size={14} className="text-vct-text-muted" />
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-vct-text-muted">
                            Truy cập gần đây
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recentCards.map(card => (
                            <WorkspaceCardLarge
                                key={card.id}
                                card={card}
                                onClick={() => handleEnterWorkspace(card)}
                                isRecent
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Search results empty ───────────────────── */}
            {isSearching && filteredCards.length === 0 && (
                <div className="py-16 text-center">
                    <VCT_Icons.Search size={48} className="mx-auto mb-4 text-vct-text-muted/30" />
                    <p className="text-lg font-semibold text-vct-text-muted">Không tìm thấy workspace</p>
                    <p className="mt-1 text-sm text-vct-text-muted/70">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </div>
            )}

            {/* ── Category Sections ──────────────────────── */}
            <div className="mx-auto max-w-[1400px] space-y-2 px-8 pb-16 xl:px-12">
                {categoryGroups.map(group => (
                    <CategorySection
                        key={group.category}
                        group={group}
                        viewMode={viewMode}
                        isExpanded={expandedCategories.has(group.category)}
                        onToggle={() => toggleCategory(group.category)}
                        onEnterWorkspace={handleEnterWorkspace}
                        isSearching={isSearching}
                    />
                ))}
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="mx-8 border-t border-vct-border px-0 pb-12 pt-6 text-center md:mx-12">
                <p className="text-[13px] text-vct-text-muted">
                    © VCT PLATFORM — NỀN TẢNG QUẢN TRỊ VÕ THUẬT TOÀN DIỆN •{' '}
                </p>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════
// CategorySection — collapsible category group
// ════════════════════════════════════════════════════════════════
function CategorySection({
    group,
    viewMode,
    isExpanded,
    onToggle,
    onEnterWorkspace,
    isSearching,
}: {
    group: CategoryGroup
    viewMode: 'grid' | 'list'
    isExpanded: boolean
    onToggle: () => void
    onEnterWorkspace: (card: WorkspaceCard) => void
    isSearching: boolean
}) {
    const { t } = useI18n()
    const needsCollapse = group.cards.length > COLLAPSED_SHOW_COUNT && !isSearching
    const showAll = isExpanded || isSearching || !needsCollapse
    const visibleCards = showAll ? group.cards : group.cards.slice(0, COLLAPSED_SHOW_COUNT)
    const hiddenCount = group.cards.length - COLLAPSED_SHOW_COUNT

    const CategoryIcon = getIconComponent(group.icon)

    return (
        <div className="rounded-2xl border border-vct-border/60 transition-all duration-200" style={{ background: 'var(--vct-bg-card)' }}>
            {/* Category Header */}
            <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
                onClick={needsCollapse ? onToggle : undefined}
                role={needsCollapse ? 'button' : undefined as unknown as React.AriaRole}
                tabIndex={needsCollapse ? 0 : undefined}
                onKeyDown={needsCollapse ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } } : undefined}
                aria-expanded={needsCollapse ? isExpanded : undefined}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${group.color}18` }}
                    >
                        {CategoryIcon && <CategoryIcon size={18} color={group.color} />}
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-vct-text">{t(group.label)}</h2>
                    </div>
                    <span
                        className="ml-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ backgroundColor: `${group.color}15`, color: group.color }}
                    >
                        {group.cards.length}
                    </span>
                </div>

                {needsCollapse && (
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-vct-text-muted transition-all hover:text-vct-text hover:bg-(--vct-bg-elevated)"
                        onClick={(e) => { e.stopPropagation(); onToggle() }}
                    >
                        {isExpanded ? 'Thu gọn' : `Xem thêm +${hiddenCount}`}
                        <span
                            className="inline-block transition-transform duration-200"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            <VCT_Icons.ChevronDown size={14} />
                        </span>
                    </button>
                )}
            </div>

            {/* Cards */}
            <div className={`px-5 pb-5 ${viewMode === 'grid'
                ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-1.5'}`}
            >
                {visibleCards.map(card => (
                    viewMode === 'grid'
                        ? <WorkspaceCardLarge key={card.id} card={card} onClick={() => onEnterWorkspace(card)} />
                        : <WorkspaceRowCompact key={card.id} card={card} onClick={() => onEnterWorkspace(card)} />
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════
// WorkspaceCardLarge — card view
// ════════════════════════════════════════════════════════════════
function WorkspaceCardLarge({
    card,
    onClick,
    isRecent,
}: {
    card: WorkspaceCard
    onClick: () => void
    isRecent?: boolean
}) {
    const [isHovered, setIsHovered] = useState(false)
    const IconComp = getIconComponent(card.icon)

    return (
        <div
            className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-vct-border/70 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{
                background: 'var(--vct-bg-elevated)',
                borderColor: isHovered ? card.color : undefined,
                boxShadow: isHovered
                    ? `0 12px 40px ${card.color}18, 0 0 0 1px ${card.color}33`
                    : 'var(--vct-shadow-sm)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Active indicator */}
            {card.lastAccessed && (
                <div className="absolute right-3 top-3 flex items-center gap-1 text-[10px] text-vct-text-muted">
                    {card.lastAccessed === 'Đang hoạt động' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {card.lastAccessed}
                </div>
            )}

            {/* Recent star */}
            {isRecent && !card.lastAccessed && (
                <div className="absolute right-3 top-3">
                    <VCT_Icons.Star size={12} className="text-amber-400 fill-amber-400" />
                </div>
            )}

            {/* Icon + Badge row */}
            <div className="flex items-start justify-between px-5 pb-3 pt-5">
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white"
                    style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}
                >
                    {IconComp && <IconComp size={22} />}
                </div>
                {card.badge && (
                    <div
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${card.color}18`, color: card.color }}
                    >
                        {card.badge}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="px-5 pb-3">
                <div className="mb-0.5 text-[15px] font-bold leading-snug text-vct-text">{card.label}</div>
                <div className="text-[12px] leading-relaxed text-vct-text-muted line-clamp-2">{card.description}</div>
            </div>

            {/* Stats Footer */}
            {card.stats && card.stats.length > 0 && (
                <div className="mx-4 mt-0.5 mb-0">
                    <div
                        className="h-px w-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${card.color}30, transparent)` }}
                    />
                    <div className="flex py-3">
                        {card.stats.map((s, i) => (
                            <div key={i} className="relative flex-1 text-center">
                                {i > 0 && (
                                    <div className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 opacity-15"
                                        style={{ background: card.color }} />
                                )}
                                <div className="text-[15px] font-extrabold tracking-tight" style={{ color: card.color }}>{s.value}</div>
                                <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-vct-text-muted">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hover glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[2px] transition-all"
                style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${card.color}, transparent)` : 'transparent' }}
            />
        </div>
    )
}

// ════════════════════════════════════════════════════════════════
// WorkspaceRowCompact — list/row view
// ════════════════════════════════════════════════════════════════
function WorkspaceRowCompact({
    card,
    onClick,
}: {
    card: WorkspaceCard
    onClick: () => void
}) {
    const IconComp = getIconComponent(card.icon)

    return (
        <div
            className="flex items-center gap-4 rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 border border-transparent hover:border-vct-border hover:bg-(--vct-bg-elevated)"
            onClick={onClick}
        >
            {/* Icon */}
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}
            >
                {IconComp && <IconComp size={20} />}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-vct-text">{card.label}</span>
                    {card.lastAccessed === 'Đang hoạt động' && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                </div>
                <div className="truncate text-[12px] text-vct-text-muted">{card.description}</div>
            </div>

            {/* Badge */}
            {card.badge && (
                <div
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${card.color}18`, color: card.color }}
                >
                    {card.badge}
                </div>
            )}

            {/* Stats (compact) */}
            {card.stats && card.stats.length > 0 && (
                <div className="hidden shrink-0 items-center gap-4 md:flex">
                    {card.stats.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-center">
                            <div className="text-[13px] font-bold" style={{ color: card.color }}>{s.value}</div>
                            <div className="text-[9px] font-medium uppercase tracking-wider text-vct-text-muted">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Arrow */}
            <VCT_Icons.ChevronRight size={16} className="shrink-0 text-vct-text-muted/40" />
        </div>
    )
}
