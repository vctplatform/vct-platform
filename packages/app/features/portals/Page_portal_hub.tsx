'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Portal Hub v4 (Grand Lobby Edition)
// Enterprise-grade workspace selector — "Đại Sảnh" style:
//   • Dramatic hero welcome with oversized typography
//   • Spacious grand lobby layout
//   • Instance-level cards with premium glass effects
//   • Favorites + Recent with persistence
//   • Vietnamese diacritics search + sort
//   • Responsive: full-width hero, 3-col grid below
//   • Composable sub-components
// ════════════════════════════════════════════════════════════════

import React, { Suspense, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n'
import { useWorkspaceStore, generateWorkspaceCards } from '../layout/workspace-store'
import { WORKSPACE_META } from '../layout/workspace-types'
import type { WorkspaceCard } from '../layout/workspace-types'
import { VCT_CommandPalette } from '../components/VCT_CommandPalette'

// Sub-components
import { PortalSearchBar } from './portal/PortalSearchBar'
import { PortalFavorites } from './portal/PortalFavorites'
import { PortalRecent } from './portal/PortalRecent'
import { PortalCategoryTabs } from './portal/PortalCategoryTabs'
import { PortalWorkspaceCard } from './portal/PortalWorkspaceCard'
import { PortalWorkspaceRow } from './portal/PortalWorkspaceRow'
import { PortalEmptyState } from './portal/PortalEmptyState'
import { PortalBackground } from './portal/PortalBackground'
import { PortalWelcomeHeader } from './portal/PortalWelcomeHeader'
import { PortalActivityFeed } from './portal/PortalActivityFeed'
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
    <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="flex flex-col items-center gap-4 pt-16 pb-8">
            <div className="h-10 w-32 rounded-full vct-skeleton" />
            <div className="h-14 w-96 rounded-lg vct-skeleton" />
            <div className="h-[1px] w-24 rounded vct-skeleton mt-4" />
            <div className="h-5 w-64 rounded vct-skeleton" />
        </div>
        <div className="h-12 w-full max-w-xl mx-auto rounded-xl vct-skeleton" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[220px] rounded-2xl vct-skeleton" />
            ))}
        </div>
    </div>
)

// ── Main Component ──
function PortalHubContent() {
    const router = useRouter()
    const { t } = useI18n()
    const { currentUser, setActiveWorkspace } = useAuth()
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
            currentUser.name,
            { pendingTasks: currentUser.metadata?.pendingTasks as number | undefined }
        ),
        [currentUser]
    )

    const portal = usePortalState(workspaces)

    // ── Keyboard Navigation for Grid ──
    const gridRef = useRef<HTMLDivElement>(null)

    const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return

        const cards = Array.from(
            gridRef.current?.querySelectorAll('[role="button"][tabindex="0"]') || []
        ) as HTMLElement[]
        
        if (cards.length === 0) return

        const currentIndex = cards.findIndex(card => card === document.activeElement)
        if (currentIndex === -1) return

        e.preventDefault()

        let cols = 1
        if (portal.viewMode === 'list') {
            cols = 1
        } else {
            if (window.innerWidth >= 1280) cols = 3
            else if (window.innerWidth >= 640) cols = 2
        }

        let nextIndex = currentIndex
        switch (e.key) {
            case 'ArrowRight':
                nextIndex = Math.min(currentIndex + 1, cards.length - 1)
                break
            case 'ArrowLeft':
                nextIndex = Math.max(currentIndex - 1, 0)
                break
            case 'ArrowDown':
                nextIndex = Math.min(currentIndex + cols, cards.length - 1)
                break
            case 'ArrowUp':
                nextIndex = Math.max(currentIndex - cols, 0)
                break
        }

        cards[nextIndex]?.focus()
    }, [portal.viewMode])

    // ── Navigate to workspace ──
    const handleCardClick = useCallback(
        (card: WorkspaceCard) => {
            trackAccess(card.id)
            enterWorkspace(card)
            
            setActiveWorkspace({
                type: card.type,
                scopeId: card.scope.id,
                scopeName: card.scope.name,
                role: currentUser.role,
            })
            
            const dest = WORKSPACE_DESTINATIONS[card.type] ?? '/dashboard'
            router.push(dest)
        },
        [trackAccess, enterWorkspace, setActiveWorkspace, currentUser.role, router]
    )

    // ── Empty state ──
    if (workspaces.length === 0) {
        return (
            <div className="relative min-h-screen w-full">
                <PortalBackground />
                <div className="relative z-10 mx-auto max-w-4xl px-6 py-20">
                    <PortalWelcomeHeader name={currentUser.name} count={0} t={t} />
                    <PortalEmptyState variant="no-workspaces" />
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full">
            {/* Skip to main content link for screen readers */}
            <a 
                href="#portal-main-grid" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-vct-primary focus:px-4 focus:py-2 focus:text-white"
            >
                {t('portal.skipToMain') || 'Skip to main content'}
            </a>
            <PortalBackground />

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-20 sm:px-8 lg:pt-20"
            >
                {/* ═══════════ HERO ZONE — Full-Width Grand Welcome ═══════════ */}
                <PortalWelcomeHeader name={currentUser.name} count={portal.totalCount} t={t} />

                {/* ═══════════ SEARCH BAR — Centered Grand Style ═══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl"
                >
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
                </motion.div>

                {/* ═══════════ MAIN CONTENT — 2-Column Grand Layout ═══════════ */}
                <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
                    {/* ── Main Cards Area ── */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        {/* Favorites */}
                        {!portal.searchQuery && portal.pinnedCards.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mb-8"
                            >
                                <PortalFavorites
                                    cards={portal.pinnedCards}
                                    onClick={handleCardClick}
                                />
                            </motion.div>
                        )}

                        {/* Recent */}
                        {!portal.searchQuery && portal.recentCards.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="mb-8"
                            >
                                <PortalRecent
                                    cards={portal.recentCards}
                                    onClick={handleCardClick}
                                />
                            </motion.div>
                        )}

                        {/* Divider — "All Workspaces" */}
                        {!portal.searchQuery && (portal.pinnedCards.length > 0 || portal.recentCards.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-10 mb-4 flex items-center gap-4"
                            >
                                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/30">
                                    {t('portal.allWorkspaces') || 'Tất cả Workspace'}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                            </motion.div>
                        )}

                        {/* Category Tabs */}
                        {portal.searchFilteredCards.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65 }}
                                className="mb-8"
                            >
                                <PortalCategoryTabs
                                    activeCategory={portal.activeCategory}
                                    onSelectCategory={portal.setActiveCategory}
                                    categoryCounts={portal.categoryCounts}
                                />
                            </motion.div>
                        )}

                        {/* ── Smart Unified Grid ── */}
                        {portal.filteredCards.length > 0 ? (
                            <motion.div
                                id="portal-main-grid"
                                ref={gridRef}
                                onKeyDown={handleGridKeyDown}
                                role="grid"
                                aria-label={t('portal.workspaceList') || 'Workspace List'}
                                className={
                                    portal.viewMode === 'list'
                                        ? 'flex flex-col gap-2'
                                        : 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3'
                                }
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.06 },
                                    },
                                }}
                                initial="hidden"
                                animate="show"
                            >
                                {portal.filteredCards.map((card) => (
                                    <motion.div
                                        key={card.id}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.94, y: 15 },
                                            show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.35, duration: 0.6 } },
                                        }}
                                    >
                                        {portal.viewMode === 'list' ? (
                                            <PortalWorkspaceRow card={card} onClick={handleCardClick} />
                                        ) : (
                                            <PortalWorkspaceCard card={card} onClick={handleCardClick} />
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : portal.searchQuery ? (
                            <PortalEmptyState variant="no-results" searchQuery={portal.searchQuery} />
                        ) : null}
                    </div>

                    {/* ── Side Activity Feed — Info Kiosk ── */}
                    <div className="mt-14 lg:mt-0 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                        >
                            <PortalActivityFeed />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Global Command Palette (Cmd+K) */}
            <VCT_CommandPalette />
        </div>
    )
}


// ── Exported Page with Suspense ──
export default function Page_portal_hub() {
    return (
        <Suspense fallback={<PortalSkeleton />}>
            <PortalHubContent />
        </Suspense>
    )
}
