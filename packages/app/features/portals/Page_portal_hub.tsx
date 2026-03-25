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
import { PortalBackground } from './portal/PortalBackground'
import { PortalWelcomeHeader } from './portal/PortalWelcomeHeader'
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

    // ── Navigate to workspace ──
    const handleCardClick = React.useCallback(
        (card: WorkspaceCard) => {
            // Track access
            trackAccess(card.id)
            // Enter workspace context in Zustand
            enterWorkspace(card)
            
            // Sync with AuthProvider for legacy components (AppShell)
            setActiveWorkspace({
                type: card.type,
                scopeId: card.scope.id,
                scopeName: card.scope.name,
                role: currentUser.role,
            })
            
            // Navigate
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
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
                    <PortalWelcomeHeader name={currentUser.name} count={0} t={t} />
                    <PortalEmptyState variant="no-workspaces" />
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full">
            <PortalBackground />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12"
            >
                {/* Welcome */}
                <PortalWelcomeHeader name={currentUser.name} count={portal.totalCount} t={t} />

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


// ── Exported Page with Suspense (for useSearchParams) ──
export default function Page_portal_hub() {
    return (
        <Suspense fallback={<PortalSkeleton />}>
            <PortalHubContent />
        </Suspense>
    )
}
