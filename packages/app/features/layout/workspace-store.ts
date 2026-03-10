// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Store (Zustand)
// Manages the active workspace context across the app.
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveWorkspace, WorkspaceCard, WorkspaceType } from './workspace-types'
import { WORKSPACE_META } from './workspace-types'

interface WorkspaceState {
    /** Currently active workspace (null = Portal Hub) */
    activeWorkspace: ActiveWorkspace | null

    /** All workspace cards available to the current user */
    availableWorkspaces: WorkspaceCard[]

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
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            activeWorkspace: null,
            availableWorkspaces: [],

            enterWorkspace: (card) => {
                const meta = WORKSPACE_META[card.type]
                set({
                    activeWorkspace: {
                        type: card.type,
                        scope: card.scope,
                        label: card.label,
                        icon: meta.icon,
                        color: meta.color,
                    },
                })
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
        }),
        {
            name: 'vct-workspace',
            partialize: (state) => ({
                activeWorkspace: state.activeWorkspace,
            }),
        }
    )
)

// ── Helper: Generate workspace cards from user roles ──
export function generateWorkspaceCards(
    userRoles: Array<{ role: string; scope_type: string; scope_id: string; scope_name: string }>,
    userName: string
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
        cards.push({
            id: key,
            type: wsType,
            scope: { type: r.scope_type as any, id: r.scope_id, name: r.scope_name },
            label: r.scope_name || meta.label,
            description: meta.description,
            icon: meta.icon,
            color: meta.color,
            gradient: meta.gradient,
        })
    }

    // Always add Athlete Portal (self-service)
    if (!cards.find(c => c.type === 'athlete_portal')) {
        const meta = WORKSPACE_META.athlete_portal
        cards.push({
            id: `athlete:self`,
            type: 'athlete_portal',
            scope: { type: 'user', id: 'self', name: userName },
            label: 'Hồ sơ cá nhân',
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
        scope: { type: 'public', id: 'public', name: 'Công cộng' },
        label: 'Xem trực tiếp & Tin tức',
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
        'COACH': 'club_management',
        'coach': 'club_management',
        // Referee
        'HEAD_REFEREE': 'referee_console',
        'REFEREE': 'referee_console',
        'JUDGE': 'referee_console',
        'referee_manager': 'referee_console',
        'referee': 'referee_console',
        // Athlete
        'ATHLETE': 'athlete_portal',
        'athlete': 'athlete_portal',
        // Delegate
        'delegate': 'tournament_ops',
    }
    return map[role] || null
}
