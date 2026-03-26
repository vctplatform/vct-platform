// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Store (Zustand)
// Manages the active workspace context across the app.
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveWorkspace, WorkspaceCard, WorkspaceCategory, WorkspaceScope, WorkspaceType } from './workspace-types'
import { WORKSPACE_META } from './workspace-types'

const RECENT_MAX = 10

interface WorkspaceState {
    /** Currently active workspace (null = Portal Hub) */
    activeWorkspace: ActiveWorkspace | null

    /** All workspace cards available to the current user */
    availableWorkspaces: WorkspaceCard[]

    /** Pinned/favorite workspace IDs */
    pinnedWorkspaceIds: string[]

    /** Timestamp map: workspace ID → last accessed epoch ms */
    lastAccessedMap: Record<string, number>

    /** Portal Search Query */
    searchQuery: string
    setSearchQuery: (query: string) => void

    /** Portal Active Category Filter (null if show all) */
    activeCategory: WorkspaceCategory | null
    setActiveCategory: (cat: WorkspaceCategory | null) => void

    /** Is currently impersonating another user's workspace view */
    isImpersonating: boolean
    setImpersonating: (is: boolean) => void

    /** Kiosk Mode / Privacy Mode (blurs sensitive data) */
    isPrivacyMode: boolean
    togglePrivacyMode: () => void

    /** Set the active workspace (entering a workspace) */
    enterWorkspace: (card: WorkspaceCard) => void

    /** Leave workspace and return to Portal Hub */
    exitToHub: () => void

    /** Update the list of available workspaces (called after login/role change) */
    setAvailableWorkspaces: (cards: WorkspaceCard[]) => void

    /** Check if user is in a workspace or at the hub */
    isInWorkspace: () => boolean

    /** Get workspace type label */
    getWorkspaceLabel: () => string

    /** Pin/favorite a workspace */
    pinWorkspace: (id: string) => void

    /** Unpin/unfavorite a workspace */
    unpinWorkspace: (id: string) => void

    /** Toggle pin state */
    togglePin: (id: string) => void

    /** Reorder pinned workspaces (for drag and drop) */
    reorderPinnedWorkspaces: (newOrder: string[]) => void

    /** Track workspace access (updates lastAccessedMap) */
    trackAccess: (id: string) => void

    /** Get recent workspace IDs (sorted by most recent) */
    getRecentIds: () => string[]

    /** Check if a workspace is pinned */
    isPinned: (id: string) => boolean
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            activeWorkspace: null,
            availableWorkspaces: [],
            pinnedWorkspaceIds: [],
            lastAccessedMap: {},
            searchQuery: '',
            activeCategory: null,
            isImpersonating: false,
            isPrivacyMode: false,

            setSearchQuery: (query) => set({ searchQuery: query }),
            setActiveCategory: (cat) => set({ activeCategory: cat }),
            setImpersonating: (is) => set({ isImpersonating: is }),
            togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

            enterWorkspace: (card) => {
                const meta = WORKSPACE_META[card.type]
                const now = Date.now()
                set((state) => ({
                    activeWorkspace: {
                        type: card.type,
                        scope: card.scope,
                        label: card.label,
                        icon: meta.icon,
                        color: meta.color,
                    },
                    lastAccessedMap: { ...state.lastAccessedMap, [card.id]: now },
                }))
            },

            exitToHub: () => {
                set({ activeWorkspace: null })
            },

            setAvailableWorkspaces: (cards) => {
                set({ availableWorkspaces: cards })
            },

            isInWorkspace: () => {
                return get().activeWorkspace !== null
            },

            getWorkspaceLabel: () => {
                const ws = get().activeWorkspace
                return ws ? ws.label : 'VCT Ecosystem'
            },

            pinWorkspace: (id) => {
                set((state) => ({
                    pinnedWorkspaceIds: state.pinnedWorkspaceIds.includes(id)
                        ? state.pinnedWorkspaceIds
                        : [...state.pinnedWorkspaceIds, id],
                }))
            },

            unpinWorkspace: (id) => {
                set((state) => ({
                    pinnedWorkspaceIds: state.pinnedWorkspaceIds.filter((pid) => pid !== id),
                }))
            },

            togglePin: (id) => {
                const { pinnedWorkspaceIds } = get()
                if (pinnedWorkspaceIds.includes(id)) {
                    set({ pinnedWorkspaceIds: pinnedWorkspaceIds.filter((pid) => pid !== id) })
                } else {
                    set({ pinnedWorkspaceIds: [...pinnedWorkspaceIds, id] })
                }
            },

            reorderPinnedWorkspaces: (newOrder) => {
                set({ pinnedWorkspaceIds: newOrder })
            },

            trackAccess: (id) => {
                set((state) => ({
                    lastAccessedMap: { ...state.lastAccessedMap, [id]: Date.now() },
                }))
            },

            getRecentIds: () => {
                const { lastAccessedMap } = get()
                return Object.entries(lastAccessedMap)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, RECENT_MAX)
                    .map(([id]) => id)
            },

            isPinned: (id) => {
                return get().pinnedWorkspaceIds.includes(id)
            },
        }),
        {
            name: 'vct-workspace',
            partialize: (state) => ({
                activeWorkspace: state.activeWorkspace,
                pinnedWorkspaceIds: state.pinnedWorkspaceIds,
                lastAccessedMap: state.lastAccessedMap,
                isImpersonating: state.isImpersonating,
                isPrivacyMode: state.isPrivacyMode,
            }),
        }
    )
)

// ── Helper: Generate workspace cards from user roles ──
// Labels use i18n keys — consumers call t(card.label) to localize
export function generateWorkspaceCards(
    userRoles: Array<{ role: string; scope_type: string; scope_id: string; scope_name: string }>,
    userName: string,
    options?: { pendingTasks?: number }
): WorkspaceCard[] {
    const cards: WorkspaceCard[] = []
    const seen = new Set<string>()

    for (const r of userRoles) {
        const key = `${r.role}:${r.scope_id}`
        if (seen.has(key)) continue
        seen.add(key)

        const wsType = mapRoleToWorkspaceType(r.role)
        if (!wsType) continue

        const meta = WORKSPACE_META[wsType]
        const isAdministrative = ['federation_admin', 'federation_provincial', 'club_management', 'system_admin'].includes(wsType)
        cards.push({
            id: key,
            type: wsType,
            scope: { type: normalizeScopeType(r.scope_type, wsType), id: r.scope_id, name: r.scope_name },
            label: r.scope_name || meta.label,
            description: meta.description,
            icon: meta.icon,
            color: meta.color,
            gradient: meta.gradient,
            pendingActions: isAdministrative ? options?.pendingTasks : undefined,
        })
    }

    // Always add Athlete Portal (self-service)
    if (!cards.find(c => c.type === 'athlete_portal')) {
        const meta = WORKSPACE_META.athlete_portal
        cards.push({
            id: `athlete:self`,
            type: 'athlete_portal',
            scope: { type: 'user', id: 'self', name: userName },
            label: 'ws.scope.profile',
            description: meta.description,
            icon: meta.icon,
            color: meta.color,
            gradient: meta.gradient,
        })
    }

    // Always add Public/Spectator
    const pubMeta = WORKSPACE_META.public_spectator
    cards.push({
        id: 'public:spectator',
        type: 'public_spectator',
        scope: { type: 'public', id: 'public', name: 'ws.scope.public' },
        label: 'ws.scope.spectatorLive',
        description: pubMeta.description,
        icon: pubMeta.icon,
        color: pubMeta.color,
        gradient: pubMeta.gradient,
    })

    return cards
}

function mapRoleToWorkspaceType(role: string): WorkspaceType | null {
    const map: Record<string, WorkspaceType> = {
        // System
        'SYSTEM_ADMIN': 'system_admin',
        'admin': 'system_admin',
        // Federation — Executive/Operations/Technical
        'FEDERATION_ADMIN': 'federation_admin',
        'FEDERATION_STAFF': 'federation_admin',
        'federation_president': 'federation_admin',
        'vice_president': 'federation_admin',
        'federation_secretary': 'federation_admin',
        'technical_director': 'federation_admin',
        'pr_manager': 'federation_admin',
        'international_liaison': 'federation_admin',
        // Federation — Provincial (scoped)
        'provincial_admin': 'federation_provincial',
        'provincial_president': 'federation_provincial',
        'provincial_vice_president': 'federation_provincial',
        'provincial_secretary': 'federation_provincial',
        'provincial_technical_head': 'federation_provincial',
        'provincial_referee_head': 'federation_provincial',
        'provincial_committee_member': 'federation_provincial',
        'provincial_accountant': 'federation_provincial',
        // Federation — Discipline & Inspection
        'discipline_board': 'federation_discipline',
        'inspector': 'federation_discipline',
        // Tournament
        'TOURNAMENT_DIRECTOR': 'tournament_ops',
        'TOURNAMENT_STAFF': 'tournament_ops',
        'BTC': 'tournament_ops',
        'btc': 'tournament_ops',
        'medical_staff': 'tournament_ops',
        // Club
        'CLUB_MANAGER': 'club_management',
        'CLUB_COACH': 'club_management',
        'CLUB_LEADER': 'club_management',
        'CLUB_VICE_LEADER': 'club_management',
        'CLUB_SECRETARY': 'club_management',
        'CLUB_ACCOUNTANT': 'club_management',
        'COACH': 'club_management',
        'coach': 'club_management',
        'club_leader': 'club_management',
        'club_vice_leader': 'club_management',
        'club_secretary': 'club_management',
        'club_accountant': 'club_management',
        // Referee
        'HEAD_REFEREE': 'referee_console',
        'REFEREE': 'referee_console',
        'JUDGE': 'referee_console',
        'referee_manager': 'referee_console',
        'referee': 'referee_console',
        // Athlete
        'ATHLETE': 'athlete_portal',
        'athlete': 'athlete_portal',
        // Parent
        'parent': 'parent_portal',
        // Delegate
        'delegate': 'tournament_ops',
    }
    return map[role] || null
}

function normalizeScopeType(
    scopeType: string,
    workspaceType: WorkspaceType
): WorkspaceScope['type'] {
    switch (scopeType.toUpperCase()) {
        case 'SYSTEM':
            return 'system'
        case 'FEDERATION':
            return workspaceType === 'federation_provincial' ? 'province' : 'federation'
        case 'PROVINCE':
            return 'province'
        case 'TOURNAMENT':
            return 'tournament'
        case 'CLUB':
            return 'club'
        case 'SELF':
        case 'USER':
            return 'user'
        case 'PUBLIC':
            return 'public'
        default:
            return workspaceType === 'public_spectator' ? 'public' : 'federation'
    }
}
