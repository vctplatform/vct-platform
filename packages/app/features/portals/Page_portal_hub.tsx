'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Portal Hub
// The main entry point where users choose their workspace.
// ════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_Icons } from '../components/vct-icons'
import { useTheme } from '../theme/ThemeProvider'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n'
import { resolveWorkspacesForUser } from '../layout/workspace-resolver'
import type { WorkspaceCard, WorkspaceType } from '../layout/workspace-types'
import { WORKSPACE_META } from '../layout/workspace-types'
import { UI_Logo } from '../components/ui-logo'

// ── Mock: workspaces for demo user who has multiple roles ──
const MOCK_USER = {
    name: 'Nguyễn Văn Admin',
    email: 'admin@vct.vn',
    avatar: '',
}

const MOCK_WORKSPACE_CARDS: WorkspaceCard[] = [
    {
        id: 'fed:lien-doan-vct',
        type: 'federation_admin',
        scope: { type: 'federation', id: 'fed-001', name: 'Liên đoàn VCT Việt Nam' },
        label: 'Liên đoàn VCT Việt Nam',
        description: 'Quản trị tổ chức, CLB, BXH quốc gia, Di sản',
        icon: 'Building',
        color: '#8b5cf6',
        gradient: 'from-[#8b5cf6] to-[#6d28d9]',
        badge: 'Admin',
        stats: [
            { label: 'CLB', value: 128 },
            { label: 'VĐV', value: '2,450' },
            { label: 'Giải/Năm', value: 12 },
        ],
        lastAccessed: '5 phút trước',
    },
    {
        id: 'tourn:giai-qg-2026',
        type: 'tournament_ops',
        scope: { type: 'tournament', id: 'tourn-001', name: 'Giải VĐQG 2026' },
        label: 'Giải Vô Địch Quốc Gia 2026',
        description: 'Điều hành giải từ chuẩn bị đến kết quả',
        icon: 'Trophy',
        color: '#ef4444',
        gradient: 'from-[#ef4444] to-[#dc2626]',
        badge: 'Ban tổ chức',
        stats: [
            { label: 'VĐV', value: 486 },
            { label: 'Đơn vị', value: 42 },
            { label: 'Nội dung', value: 68 },
        ],
        lastAccessed: '2 giờ trước',
    },
    {
        id: 'tourn:cup-truyen-thong',
        type: 'tournament_ops',
        scope: { type: 'tournament', id: 'tourn-002', name: 'Cúp Truyền Thống 2026' },
        label: 'Cúp Truyền Thống TP.HCM 2026',
        description: 'Điều hành giải từ chuẩn bị đến kết quả',
        icon: 'Trophy',
        color: '#ef4444',
        gradient: 'from-[#f97316] to-[#ea580c]',
        badge: 'Điều phối',
        stats: [
            { label: 'VĐV', value: 210 },
            { label: 'Đơn vị', value: 18 },
            { label: 'Nội dung', value: 32 },
        ],
        lastAccessed: '1 ngày trước',
    },
    {
        id: 'club:son-long',
        type: 'club_management',
        scope: { type: 'club', id: 'club-001', name: 'CLB Sơn Long Quyền' },
        label: 'CLB Sơn Long Quyền',
        description: 'Võ sinh, đào tạo, điểm danh, tài chính',
        icon: 'Home',
        color: '#f59e0b',
        gradient: 'from-[#f59e0b] to-[#d97706]',
        badge: 'HLV trưởng',
        stats: [
            { label: 'Võ sinh', value: 67 },
            { label: 'Lớp/Tuần', value: 12 },
            { label: 'Chuyên cần', value: '85%' },
        ],
        lastAccessed: '30 phút trước',
    },

    {
        id: 'athlete:self',
        type: 'athlete_portal',
        scope: { type: 'user', id: 'user-001', name: 'Nguyễn Văn Admin' },
        label: 'Hồ sơ VĐV cá nhân',
        description: 'Hồ sơ, thành tích, đăng ký giải',
        icon: 'User',
        color: '#10b981',
        gradient: 'from-[#10b981] to-[#059669]',
        stats: [
            { label: 'BXH', value: '#42' },
            { label: 'Huy chương', value: 7 },
            { label: 'ELO', value: '1,680' },
        ],
    },
    {
        id: 'sysadmin:system',
        type: 'system_admin',
        scope: { type: 'system', id: 'system', name: 'Hệ thống' },
        label: 'Quản trị hệ thống',
        description: 'Users, Roles, Feature Flags, Audit',
        icon: 'Settings',
        color: '#64748b',
        gradient: 'from-[#64748b] to-[#475569]',
        badge: 'Admin',
        stats: [
            { label: 'Users', value: 3240 },
            { label: 'Uptime', value: '99.8%' },
        ],
    },
    {
        id: 'public:spectator',
        type: 'public_spectator',
        scope: { type: 'public', id: 'public', name: 'Công cộng' },
        label: 'Xem trực tiếp & Tin tức',
        description: 'Live score, BXH, tin tức cộng đồng',
        icon: 'Monitor',
        color: '#ec4899',
        gradient: 'from-[#ec4899] to-[#db2777]',
        stats: [
            { label: 'Đang LIVE', value: 3 },
            { label: 'Giải đấu', value: 2 },
        ],
    },
]

const FILTER_LABEL_MAP: Record<string, string> = {
    federation_admin: '🏛️ Liên đoàn',
    federation_provincial: '🏛️ Liên đoàn',
    federation_discipline: '🏛️ Liên đoàn',
    tournament_ops: '🏆 Giải đấu',
    club_management: '🥋 CLB',
    athlete_portal: '👤 Cá nhân',
    parent_portal: '👨‍👩‍👧‍👦 Phụ huynh',
    public_spectator: '📺 Khán giả',
    system_admin: '⚙️ Hệ thống',
}

const WORKSPACE_DESTINATIONS: Record<WorkspaceType, string> = {
    federation_admin: '/dashboard',
    federation_provincial: '/provincial',
    federation_discipline: '/discipline',
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

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
}

function formatRoleBadge(role: string) {
    return role
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getIconForWorkspace(icon: string) {
    const iconMap: Record<string, keyof typeof VCT_Icons> = {
        'Building': 'Building',
        'Trophy': 'Trophy',
        'Home': 'Building2',
        'Scale': 'Scale',
        'User': 'User',
        'Users': 'Users',
        'Monitor': 'MonitorPlay',
        'Settings': 'Settings',
    }
    const IconComp = VCT_Icons[iconMap[icon] || 'Dashboard']
    return IconComp ? <IconComp size={26} /> : <span>📋</span>
}

export function Page_portal_hub() {
    const router = useRouter()
    const { currentUser, activeWorkspace, setActiveWorkspace } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { t } = useI18n()
    const [filter, setFilter] = useState('all')
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    const resolvedWorkspaces = useMemo(
        () => resolveWorkspacesForUser(currentUser),
        [currentUser]
    )

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
                        workspace.type === 'system_admin'
                            ? 'system'
                            : workspace.type === 'public_spectator'
                                ? 'public'
                                : workspace.type === 'athlete_portal' || workspace.type === 'parent_portal'
                                    ? 'user'
                                : workspace.type === 'club_management'
                                    ? 'club'
                                    : workspace.type === 'federation_provincial'
                                        ? 'province'
                                        : workspace.type === 'tournament_ops' || workspace.type === 'referee_console'
                                            ? 'tournament'
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

    // Build dynamic filter options from actual workspace types
    const filterOptions = useMemo(() => {
        const types = new Set(workspaceCards.map(c => c.type))
        const options: { label: string; value: string }[] = [{ label: 'Tất cả', value: 'all' }]
        for (const type of Array.from(types)) {
            const label = FILTER_LABEL_MAP[type]
            if (label && !options.some(o => o.label === label)) {
                options.push({ label, value: type })
            }
        }
        return options
    }, [workspaceCards])

    const filteredCards = useMemo(() => {
        if (filter === 'all') return workspaceCards
        return workspaceCards.filter(c => c.type === filter)
    }, [filter, workspaceCards])

    const handleEnterWorkspace = (card: WorkspaceCard) => {
        const selectedWorkspace = resolvedWorkspaces.find(
            (workspace) =>
                workspace.type === card.type &&
                workspace.scopeId === card.scope.id
        )

        if (selectedWorkspace) {
            setActiveWorkspace(selectedWorkspace)
        }

        router.push(WORKSPACE_DESTINATIONS[card.type] || '/')
    }

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
                    {/* Theme Toggle */}
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

            {/* ── Hero ────────────────────────────────────── */}
            <div className="px-8 pb-10 pt-5 text-center md:px-12">
                <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-vct-text">Chọn không gian làm việc</h1>
                <p className="mx-auto max-w-[600px] text-base text-vct-text-muted">
                    Bạn có <strong className="text-vct-accent">{workspaceCards.length} workspace</strong>{' '}
                    khả dụng. Chọn một workspace để bắt đầu hoặc chuyển đổi vai trò.
                </p>
            </div>

            {/* ── Filter Bar ─────────────────────────────── */}
            {filterOptions.length > 2 && (
                <div className="flex flex-wrap justify-center gap-2 px-8 pb-8 md:px-12">
                    {filterOptions.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all ${filter === f.value
                                ? 'border border-vct-accent bg-vct-accent text-white shadow-(--vct-shadow-glow)'
                                : 'border border-vct-border bg-transparent text-vct-text-muted hover:border-vct-border-strong hover:text-vct-text-secondary'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Workspace Cards Grid ────────────────────── */}
            <div className="vct-stagger mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-8 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:px-12">
                {filteredCards.map(card => {
                    const isHovered = hoveredCard === card.id
                    return (
                        <div
                            key={card.id}
                            className="group relative cursor-pointer overflow-hidden rounded-[20px] border border-vct-border backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: 'var(--vct-bg-card)',
                                borderColor: isHovered ? card.color : undefined,
                                boxShadow: isHovered
                                    ? `0 20px 60px ${card.color}22, 0 0 0 1px ${card.color}44`
                                    : 'var(--vct-shadow-sm)',
                            }}
                            onMouseEnter={() => setHoveredCard(card.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            onClick={() => handleEnterWorkspace(card)}
                        >
                            {card.lastAccessed && (
                                <div className="absolute right-4 top-4 text-[11px] text-vct-text-muted">🕐 {card.lastAccessed}</div>
                            )}

                            {/* Top row: Icon + Badge */}
                            <div className="flex items-start justify-between px-6 pb-4 pt-6">
                                <div
                                    className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl text-white"
                                    style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}
                                >
                                    {getIconForWorkspace(card.icon)}
                                </div>
                                {card.badge && (
                                    <div
                                        className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                        style={{ background: `${card.color}22`, color: card.color }}
                                    >
                                        {card.badge}
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-4">
                                <div className="mb-1 text-lg font-bold text-vct-text">{card.label}</div>
                                <div className="text-[13px] leading-relaxed text-vct-text-muted">{card.description}</div>
                            </div>

                            {/* Stats Footer */}
                            {card.stats && card.stats.length > 0 && (
                                <div className="mx-5 mt-1 mb-0">
                                    {/* Gradient separator */}
                                    <div
                                        className="h-px w-full"
                                        style={{
                                            background: `linear-gradient(90deg, transparent, ${card.color}40, transparent)`,
                                        }}
                                    />
                                    <div className="flex py-4">
                                        {card.stats.map((s, i) => (
                                            <div key={i} className="relative flex-1 text-center">
                                                {/* Subtle vertical dot separator */}
                                                {i > 0 && (
                                                    <div
                                                        className="absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 opacity-20"
                                                        style={{ background: card.color }}
                                                    />
                                                )}
                                                <div className="text-[17px] font-extrabold tracking-tight" style={{ color: card.color }}>{s.value}</div>
                                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-vct-text-muted">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hover glow effect */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[3px] transition-all"
                                style={{
                                    background: isHovered ? `linear-gradient(90deg, transparent, ${card.color}, transparent)` : 'transparent',
                                }}
                            />
                        </div>
                    )
                })}
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
