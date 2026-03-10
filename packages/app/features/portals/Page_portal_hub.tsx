'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Portal Hub
// The main entry point where users choose their workspace.
// ════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_Icons } from '../components/vct-icons'
import { useAuth } from '../auth/AuthProvider'
import { resolveWorkspacesForUser } from '../layout/workspace-resolver'
import type { WorkspaceCard, WorkspaceType } from '../layout/workspace-types'
import { WORKSPACE_META } from '../layout/workspace-types'

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
        id: 'ref:giai-qg-2026',
        type: 'referee_console',
        scope: { type: 'tournament', id: 'tourn-001', name: 'Giải VĐQG 2026' },
        label: 'Trọng tài — VĐQG 2026',
        description: 'Chấm điểm, VAR, lịch điều hành',
        icon: 'Scale',
        color: '#0ea5e9',
        gradient: 'from-[#0ea5e9] to-[#0284c7]',
        badge: 'Trọng tài A',
        stats: [
            { label: 'Trận hôm nay', value: 8 },
            { label: 'Đã chấm', value: 24 },
            { label: 'Tổng giải', value: 156 },
        ],
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

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden' as const,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '0',
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        padding: '40px 48px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    logoMark: {
        width: 56, height: 56,
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
    },
    logoText: {
        color: '#fff', fontSize: 11, fontWeight: 800,
        letterSpacing: 4, textTransform: 'uppercase' as const,
    },
    logoSub: {
        color: '#94a3b8', fontSize: 13, marginTop: 2,
    },
    userArea: {
        display: 'flex', alignItems: 'center', gap: 12,
    },
    avatar: {
        width: 44, height: 44, borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 16,
    },
    userName: { color: '#f1f5f9', fontSize: 14, fontWeight: 600 },
    userEmail: { color: '#64748b', fontSize: 12 },
    hero: {
        textAlign: 'center' as const,
        padding: '20px 48px 40px',
    },
    heroTitle: {
        fontSize: 36, fontWeight: 800, color: '#f8fafc',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    heroSub: {
        fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto',
    },
    filterBar: {
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '0 48px 32px',
        flexWrap: 'wrap' as const,
    },
    filterBtn: {
        padding: '8px 20px', borderRadius: 100,
        border: '1px solid #334155',
        background: 'transparent',
        color: '#94a3b8', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', transition: 'all .2s',
    },
    filterBtnActive: {
        background: '#3b82f6', border: '1px solid #3b82f6',
        color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))',
        gap: 24,
        padding: '0 48px 64px',
        maxWidth: 1400, margin: '0 auto',
    },
    card: {
        background: 'rgba(30,41,59,0.8)',
        border: '1px solid #334155',
        borderRadius: 20,
        padding: 0,
        cursor: 'pointer',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        position: 'relative' as const,
    },
    cardTop: {
        padding: '24px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    },
    cardIcon: {
        width: 52, height: 52, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: '#fff',
    },
    cardBadge: {
        padding: '4px 12px', borderRadius: 100,
        fontSize: 11, fontWeight: 600,
        background: 'rgba(255,255,255,0.1)',
        color: '#e2e8f0',
    },
    cardBody: {
        padding: '0 24px 16px',
    },
    cardTitle: {
        fontSize: 18, fontWeight: 700, color: '#f1f5f9',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13, color: '#64748b', lineHeight: 1.5,
    },
    cardStats: {
        display: 'flex', gap: 0,
        borderTop: '1px solid #1e293b',
    },
    cardStat: {
        flex: 1,
        padding: '14px 16px',
        textAlign: 'center' as const,
        borderRight: '1px solid #1e293b',
    },
    statValue: {
        fontSize: 18, fontWeight: 700, color: '#f1f5f9',
    },
    statLabel: {
        fontSize: 11, color: '#64748b', marginTop: 2,
    },
    lastAccessed: {
        position: 'absolute' as const, top: 16, right: 16,
        fontSize: 11, color: '#475569',
    },
    footer: {
        textAlign: 'center' as const,
        padding: '24px 48px 48px',
        borderTop: '1px solid #1e293b',
        margin: '0 48px',
    },
    footerText: {
        color: '#475569', fontSize: 13,
    },
}

const FILTER_OPTIONS: { label: string; value: string }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: '🏛️ Liên đoàn', value: 'federation_admin' },
    { label: '🏆 Giải đấu', value: 'tournament_ops' },
    { label: '🥋 CLB', value: 'club_management' },
    { label: '⚖️ Trọng tài', value: 'referee_console' },
    { label: '👤 Cá nhân', value: 'athlete_portal' },
    { label: '⚙️ Hệ thống', value: 'system_admin' },
]

const WORKSPACE_DESTINATIONS: Record<WorkspaceType, string> = {
    federation_admin: '/',
    tournament_ops: '/giai-dau',
    club_management: '/clubs',
    referee_console: '/referee-scoring',
    athlete_portal: '/athlete-portal',
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
        'Monitor': 'MonitorPlay',
        'Settings': 'Settings',
    }
    const IconComp = VCT_Icons[iconMap[icon] || 'Dashboard']
    return IconComp ? <IconComp size={26} /> : <span>📋</span>
}

export function Page_portal_hub() {
    const router = useRouter()
    const { currentUser, activeWorkspace, setActiveWorkspace } = useAuth()
    const [filter, setFilter] = useState('all')
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    const resolvedWorkspaces = useMemo(
        () => resolveWorkspacesForUser(currentUser),
        [currentUser]
    )

    const workspaceCards = useMemo(() => {
        if (resolvedWorkspaces.length === 0) return MOCK_WORKSPACE_CARDS

        return resolvedWorkspaces.map<WorkspaceCard>((workspace) => {
            const meta = WORKSPACE_META[workspace.type]
            const isActive =
                activeWorkspace?.type === workspace.type &&
                activeWorkspace.scopeId === workspace.scopeId

            return {
                id: `${workspace.type}:${workspace.scopeId}`,
                type: workspace.type,
                scope: {
                    type:
                        workspace.type === 'system_admin'
                            ? 'system'
                            : workspace.type === 'public_spectator'
                                ? 'public'
                                : workspace.type === 'athlete_portal'
                                    ? 'user'
                                    : workspace.type === 'club_management'
                                        ? 'club'
                                        : workspace.type === 'tournament_ops' || workspace.type === 'referee_console'
                                            ? 'tournament'
                                            : 'federation',
                    id: workspace.scopeId,
                    name: workspace.scopeName,
                },
                label: workspace.scopeName,
                description: meta.description,
                icon: meta.icon,
                color: meta.color,
                gradient: meta.gradient,
                badge: formatRoleBadge(workspace.role),
                stats: WORKSPACE_STATS[workspace.type],
                lastAccessed: isActive ? 'Đang hoạt động' : undefined,
            }
        })
    }, [activeWorkspace?.scopeId, activeWorkspace?.type, resolvedWorkspaces])

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
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <div style={styles.logoMark}>
                        <VCT_Icons.Trophy size={32} />
                    </div>
                    <div>
                        <div style={styles.logoText}>VCT ECOSYSTEM</div>
                        <div style={styles.logoSub}>Nền tảng Quản trị Võ thuật Toàn diện</div>
                    </div>
                </div>
                <div style={styles.userArea}>
                    <div>
                        <div style={styles.userName}>{currentUser.name || MOCK_USER.name}</div>
                        <div style={styles.userEmail}>{currentUser.email || MOCK_USER.email}</div>
                    </div>
                    <div style={styles.avatar}>{getInitials(currentUser.name || MOCK_USER.name)}</div>
                </div>
            </div>

            {/* Hero */}
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>Chọn không gian làm việc</h1>
                <p style={styles.heroSub}>
                    Bạn có <strong style={{ color: '#3b82f6' }}>{workspaceCards.length} workspace</strong>{' '}
                    khả dụng. Chọn một workspace để bắt đầu hoặc chuyển đổi vai trò.
                </p>
            </div>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
                {FILTER_OPTIONS.map(f => (
                    <button
                        key={f.value}
                        style={{
                            ...styles.filterBtn,
                            ...(filter === f.value ? styles.filterBtnActive : {}),
                        }}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Workspace Cards Grid */}
            <div style={{
                ...styles.grid,
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            }}>
                {filteredCards.map(card => {
                    const isHovered = hoveredCard === card.id
                    return (
                        <div
                            key={card.id}
                            style={{
                                ...styles.card,
                                transform: isHovered ? 'translateY(-4px)' : 'none',
                                borderColor: isHovered ? card.color : '#334155',
                                boxShadow: isHovered
                                    ? `0 20px 60px ${card.color}22, 0 0 0 1px ${card.color}44`
                                    : '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                            onMouseEnter={() => setHoveredCard(card.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            onClick={() => handleEnterWorkspace(card)}
                        >
                            {card.lastAccessed && (
                                <div style={styles.lastAccessed}>🕐 {card.lastAccessed}</div>
                            )}

                            {/* Top row: Icon + Badge */}
                            <div style={styles.cardTop}>
                                <div style={{ ...styles.cardIcon, background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}>
                                    {getIconForWorkspace(card.icon)}
                                </div>
                                {card.badge && (
                                    <div style={{ ...styles.cardBadge, background: `${card.color}22`, color: card.color }}>
                                        {card.badge}
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div style={styles.cardBody}>
                                <div style={styles.cardTitle}>{card.label}</div>
                                <div style={styles.cardDesc}>{card.description}</div>
                            </div>

                            {/* Stats Footer */}
                            {card.stats && card.stats.length > 0 && (
                                <div style={styles.cardStats}>
                                    {card.stats.map((s, i) => (
                                        <div key={i} style={{
                                            ...styles.cardStat,
                                            borderRight: i < card.stats!.length - 1 ? '1px solid #1e293b' : 'none',
                                        }}>
                                            <div style={{ ...styles.statValue, color: card.color }}>{s.value}</div>
                                            <div style={styles.statLabel}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hover glow effect */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                height: 3,
                                background: isHovered ? `linear-gradient(90deg, transparent, ${card.color}, transparent)` : 'transparent',
                                transition: 'all .3s',
                            }} />
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    VCT Ecosystem v2.0 — Nền tảng Quản trị Võ Cổ Truyền Việt Nam •{' '}
                    <span style={{ color: '#64748b' }}>
                        Powered by Next.js + Go + PostgreSQL
                    </span>
                </p>
            </div>
        </div>
    )
}
