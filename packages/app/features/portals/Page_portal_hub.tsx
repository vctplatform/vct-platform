'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Portal Hub (v3 — Professional Edition)
// Enterprise-grade workspace selector:
//   • Instance-level cards (not type-level)
//   • Favorites + Recent with localStorage persistence
//   • Vietnamese diacritics search + sort
//   • Responsive: 1-col mobile, 2-col tablet, 3-col desktop
//   • Composable sub-components (no monolith)
//   • No mock data — uses resolveWorkspacesForUser
// ════════════════════════════════════════════════════════════════

import React, { Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n'
import { useWorkspaceStore, generateWorkspaceCards } from '../layout/workspace-store'
import { WORKSPACE_META } from '../layout/workspace-types'
import type { WorkspaceCard } from '../layout/workspace-types'

// Sub-components
import { PortalSearchBar } from './portal/PortalSearchBar'
import { PortalFavorites } from './portal/PortalFavorites'
import { PortalRecent } from './portal/PortalRecent'
import { PortalCategoryGroup } from './portal/PortalCategoryGroup'
import { PortalEmptyState } from './portal/PortalEmptyState'
import { usePortalState } from './portal/usePortalState'

// ── Workspace destination routes ──
const WORKSPACE_DESTINATIONS: Record<string, string> = {
    federation_admin: '/dashboard',
    federation_provincial: '/provincial',
    federation_discipline: '/discipline/dashboard',
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

// ── Skeleton ──
const PortalSkeleton = () => (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="h-8 w-48 rounded-lg vct-skeleton" />
        <div className="h-11 w-full rounded-xl vct-skeleton" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl vct-skeleton" />
            ))}
        </div>
    </div>
)

// ── Main Component ──
function PortalHubContent() {
    const router = useRouter()
    const { t } = useI18n()
    const { currentUser } = useAuth()
    const { enterWorkspace, trackAccess } = useWorkspaceStore()

    // Resolve REAL workspace cards from user roles (instance-level)
    const workspaces = useMemo(
        () => generateWorkspaceCards(
            currentUser.roles.map((r) => ({
                role: r.roleCode,
                scope_type: r.scopeType,
                scope_id: r.scopeId ?? 'default',
                scope_name: r.scopeName ?? '',
            })),
            currentUser.name
        ),
        [currentUser]
    )

    const portal = usePortalState(workspaces)

    // ── Navigate to workspace ──
    const handleCardClick = React.useCallback(
        (card: WorkspaceCard) => {
            // Track access
            trackAccess(card.id)
            // Enter workspace context
            enterWorkspace(card)
            // Navigate
            const dest = WORKSPACE_DESTINATIONS[card.type] ?? '/dashboard'
            router.push(dest)
        },
        [trackAccess, enterWorkspace, router]
    )

    // ── Empty state ──
    if (workspaces.length === 0) {
        return (
            <div className="relative min-h-screen w-full">
                <PortalAmbientBackground />
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
                    <WelcomeHeader name={currentUser.name} count={0} t={t} />
                    <PortalEmptyState variant="no-workspaces" />
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full">
            <PortalAmbientBackground />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12"
            >
                {/* Welcome */}
                <WelcomeHeader name={currentUser.name} count={portal.totalCount} t={t} />

            {/* Search + Sort + View Toggle */}
            <div className="mt-6">
                <PortalSearchBar
                    searchQuery={portal.searchQuery}
                    onSearchChange={portal.setSearchQuery}
                    sortMode={portal.sortMode}
                    onSortChange={portal.setSortMode}
                    viewMode={portal.viewMode}
                    onViewModeChange={portal.setViewMode}
                    totalCount={portal.totalCount}
                    filteredCount={portal.filteredCount}
                />
            </div>

            {/* Favorites */}
            {!portal.searchQuery && portal.pinnedCards.length > 0 && (
                <div className="mt-6">
                    <PortalFavorites
                        cards={portal.pinnedCards}
                        onClick={handleCardClick}
                    />
                </div>
            )}

            {/* Recent */}
            {!portal.searchQuery && portal.recentCards.length > 0 && (
                <div className="mt-6">
                    <PortalRecent
                        cards={portal.recentCards}
                        onClick={handleCardClick}
                    />
                </div>
            )}

            {/* Divider */}
            {!portal.searchQuery && (portal.pinnedCards.length > 0 || portal.recentCards.length > 0) && (
                <div className="mt-8 mb-2 flex items-center gap-3">
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-vct-text-muted">
                        {t('portal.allWorkspaces')}
                    </h2>
                    <div className="h-px flex-1 bg-vct-border/50" />
                </div>
            )}

            {/* Category Groups */}
            {portal.categoryGroups.length > 0 ? (
                <div className="mt-8 space-y-12">
                    {portal.categoryGroups.map((group, index) => (
                        <motion.div
                            key={group.category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        >
                            <PortalCategoryGroup
                                category={group.category}
                                label={group.label}
                                icon={group.icon}
                                color={group.color}
                                cards={group.cards}
                                viewMode={portal.viewMode}
                                isExpanded={portal.expandedCategories.has(group.category)}
                                onToggle={() => portal.toggleCategory(group.category)}
                                onCardClick={handleCardClick}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : portal.searchQuery ? (
                <PortalEmptyState variant="no-results" searchQuery={portal.searchQuery} />
            ) : null}
            </motion.div>
        </div>
    )
}

// ── Premium Ambient Background ──
function PortalAmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Dark mode friendly base glow */}
            <div className="absolute inset-0 bg-[var(--vct-bg-base)] opacity-50 transition-colors duration-500" />
            
            {/* Colorful Orbs */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute -top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-vct-accent/20 blur-[120px]" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
                className="absolute top-[30%] -right-[15%] h-[50vh] w-[50vh] rounded-full bg-blue-500/15 blur-[120px]" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                className="absolute -bottom-[20%] left-[20%] h-[70vh] w-[70vh] rounded-full bg-indigo-500/10 blur-[150px]" 
            />
        </div>
    )
}

// ── Welcome Header (extracted and upgraded) ──
function WelcomeHeader({ name, count, t }: { name: string; count: number; t: (key: string) => string }) {
    const firstName = name.split(' ').pop() ?? name

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-3 inline-flex items-center gap-2 rounded-full border border-vct-border/40 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-vct-text-muted backdrop-blur-md dark:bg-black/20"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-vct-accent shadow-[0_0_8px_var(--vct-accent)]" />
                    Hệ sinh thái toàn diện
                </motion.div>
                <h1 className="bg-gradient-to-br from-vct-text via-vct-text to-vct-text-muted bg-clip-text pb-1 text-3xl font-black tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                    {t('portal.welcome')}, <span className="bg-gradient-to-r from-vct-accent to-blue-500 bg-clip-text text-transparent">{firstName}</span>
                </h1>
                <p className="mt-2 text-sm text-vct-text-muted/80 sm:text-base">
                    Bạn đang có quyền truy cập vào <span className="font-bold text-vct-text">{count} workspace</span> trong hệ thống.
                </p>
            </div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden items-center gap-2 text-xs text-vct-text-muted/60 sm:flex"
            >
                <span>{t('portal.quickSwitch') || 'Nhấn'}</span>
                <kbd className="flex items-center justify-center rounded-md border border-vct-border/50 bg-white/30 px-2 py-1 text-[10px] font-bold shadow-xs backdrop-blur-sm dark:bg-black/30">
                    ⌘K
                </kbd>
                <span>để tìm kiếm nhanh</span>
            </motion.div>
        </motion.div>
    )
}

// ── Exported Page with Suspense (for useSearchParams) ──
export default function Page_portal_hub() {
    return (
        <Suspense fallback={<PortalSkeleton />}>
            <PortalHubContent />
        </Suspense>
    )
}
