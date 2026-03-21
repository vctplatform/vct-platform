// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Types
// Defines the 9 workspace types and related interfaces.
// ════════════════════════════════════════════════════════════════

/** The workspace types in the VCT Ecosystem */
export const WORKSPACE_TYPES = [
    'federation_admin',
    'federation_provincial',
    'federation_discipline',
    'federation_heritage',
    'training_management',
    'tournament_ops',
    'club_management',
    'referee_console',
    'athlete_portal',
    'parent_portal',
    'public_spectator',
    'system_admin',
] as const

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number]

const WORKSPACE_TYPE_ALIASES = {
    provincial_admin: 'federation_provincial',
    provincial_management: 'federation_provincial',
} as const satisfies Record<string, WorkspaceType>

export const normalizeWorkspaceType = (value: unknown): WorkspaceType | null => {
    if (typeof value !== 'string') return null
    if ((WORKSPACE_TYPES as readonly string[]).includes(value)) {
        return value as WorkspaceType
    }
    return WORKSPACE_TYPE_ALIASES[value as keyof typeof WORKSPACE_TYPE_ALIASES] ?? null
}

export const isWorkspaceType = (value: unknown): value is WorkspaceType =>
    normalizeWorkspaceType(value) !== null

/** Scope that a workspace operates within */
export interface WorkspaceScope {
    type: 'system' | 'federation' | 'province' | 'tournament' | 'club' | 'user' | 'public'
    id: string
    name: string
}

/** A workspace card shown on the Portal Hub */
export interface WorkspaceCard {
    id: string
    type: WorkspaceType
    scope: WorkspaceScope
    label: string
    description: string
    icon: string
    color: string
    gradient: string
    badge?: string
    stats?: { label: string; value: string | number }[]
    lastAccessed?: string
}

/** Active workspace context */
export interface ActiveWorkspace {
    type: WorkspaceType
    scope: WorkspaceScope
    label: string
    icon: string
    color: string
}

/** Sidebar item within a workspace */
export interface WorkspaceSidebarItem {
    id: string
    path: string
    label: string
    icon: string
    badge?: string | number
}

/** Sidebar group within a workspace */
export interface WorkspaceSidebarGroup {
    id: string
    label: string
    items: WorkspaceSidebarItem[]
}

/** Full sidebar config for a workspace type */
export interface WorkspaceSidebarConfig {
    type: WorkspaceType
    groups: WorkspaceSidebarGroup[]
}

// ── Workspace Metadata ──
// Labels and descriptions use i18n keys — call t(meta.label) to get localized text
export const WORKSPACE_META: Record<WorkspaceType, {
    label: string; icon: string; color: string; gradient: string; description: string
}> = {
    federation_admin: {
        label: 'ws.meta.federation.label',
        icon: 'Building',
        color: '#8b5cf6',
        gradient: 'from-[#8b5cf6] to-[#6d28d9]',
        description: 'ws.meta.federation.desc',
    },
    federation_provincial: {
        label: 'ws.meta.provincial.label',
        icon: 'MapPin',
        color: '#7c3aed',
        gradient: 'from-[#7c3aed] to-[#5b21b6]',
        description: 'ws.meta.provincial.desc',
    },
    federation_discipline: {
        label: 'ws.meta.discipline.label',
        icon: 'ShieldAlert',
        color: '#dc2626',
        gradient: 'from-[#dc2626] to-[#991b1b]',
        description: 'ws.meta.discipline.desc',
    },
    federation_heritage: {
        label: 'ws.meta.heritage.label',
        icon: 'Network',
        color: '#e879f9',
        gradient: 'from-[#e879f9] to-[#c026d3]',
        description: 'ws.meta.heritage.desc',
    },
    training_management: {
        label: 'ws.meta.training.label',
        icon: 'BookOpen',
        color: '#14b8a6',
        gradient: 'from-[#14b8a6] to-[#0f766e]',
        description: 'ws.meta.training.desc',
    },
    tournament_ops: {
        label: 'ws.meta.tournament.label',
        icon: 'Trophy',
        color: '#ef4444',
        gradient: 'from-[#ef4444] to-[#dc2626]',
        description: 'ws.meta.tournament.desc',
    },
    club_management: {
        label: 'ws.meta.club.label',
        icon: 'Home',
        color: '#f59e0b',
        gradient: 'from-[#f59e0b] to-[#d97706]',
        description: 'ws.meta.club.desc',
    },
    referee_console: {
        label: 'ws.meta.referee.label',
        icon: 'Scale',
        color: '#0ea5e9',
        gradient: 'from-[#0ea5e9] to-[#0284c7]',
        description: 'ws.meta.referee.desc',
    },
    athlete_portal: {
        label: 'ws.meta.athlete.label',
        icon: 'User',
        color: '#10b981',
        gradient: 'from-[#10b981] to-[#059669]',
        description: 'ws.meta.athlete.desc',
    },
    parent_portal: {
        label: 'ws.meta.parent.label',
        icon: 'Users',
        color: '#0d9488',
        gradient: 'from-[#0d9488] to-[#115e59]',
        description: 'ws.meta.parent.desc',
    },
    public_spectator: {
        label: 'ws.meta.spectator.label',
        icon: 'Monitor',
        color: '#ec4899',
        gradient: 'from-[#ec4899] to-[#db2777]',
        description: 'ws.meta.spectator.desc',
    },
    system_admin: {
        label: 'ws.meta.sysadmin.label',
        icon: 'Settings',
        color: '#64748b',
        gradient: 'from-[#64748b] to-[#475569]',
        description: 'ws.meta.sysadmin.desc',
    },
}

// ── Workspace Categories ──
// Groups workspace types into logical categories for the Portal Hub
export type WorkspaceCategory =
    | 'platform'      // System Admin
    | 'organization'  // Federation, Provincial, Discipline
    | 'competition'   // Tournament, Referee
    | 'club'          // Club management
    | 'academic'      // Heritage, Training
    | 'personal'      // Athlete, Parent
    | 'public'        // Spectator

export interface WorkspaceCategoryMeta {
    label: string   // i18n key
    icon: string
    color: string
    order: number
    types: WorkspaceType[]
}

export const WORKSPACE_CATEGORIES: Record<WorkspaceCategory, WorkspaceCategoryMeta> = {
    platform: {
        label: 'ws.cat.platform',
        icon: 'Settings',
        color: '#64748b',
        order: 0,
        types: ['system_admin'],
    },
    organization: {
        label: 'ws.cat.organization',
        icon: 'Building',
        color: '#8b5cf6',
        order: 1,
        types: ['federation_admin', 'federation_provincial', 'federation_discipline'],
    },
    competition: {
        label: 'ws.cat.competition',
        icon: 'Trophy',
        color: '#ef4444',
        order: 2,
        types: ['tournament_ops', 'referee_console'],
    },
    club: {
        label: 'ws.cat.club',
        icon: 'Home',
        color: '#f59e0b',
        order: 3,
        types: ['club_management'],
    },
    academic: {
        label: 'ws.cat.academic',
        icon: 'BookOpen',
        color: '#14b8a6',
        order: 4,
        types: ['federation_heritage', 'training_management'],
    },
    personal: {
        label: 'ws.cat.personal',
        icon: 'User',
        color: '#10b981',
        order: 5,
        types: ['athlete_portal', 'parent_portal'],
    },
    public: {
        label: 'ws.cat.public',
        icon: 'Monitor',
        color: '#ec4899',
        order: 6,
        types: ['public_spectator'],
    },
}

// Reverse lookup: WorkspaceType → WorkspaceCategory
const _typeToCategoryCache = new Map<WorkspaceType, WorkspaceCategory>()
for (const [cat, meta] of Object.entries(WORKSPACE_CATEGORIES)) {
    for (const t of meta.types) {
        _typeToCategoryCache.set(t, cat as WorkspaceCategory)
    }
}

export function getCategoryForType(type: WorkspaceType): WorkspaceCategory {
    return _typeToCategoryCache.get(type) ?? 'public'
}
