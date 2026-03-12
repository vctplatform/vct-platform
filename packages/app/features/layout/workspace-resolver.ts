// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Workspace Resolver
// Resolves available workspaces and filters sidebar based on UUID permissions.
// ════════════════════════════════════════════════════════════════

import type { WorkspaceType, WorkspaceSidebarConfig } from './workspace-types'
import type { AuthUser, WorkspaceAccess, UserRoleAssignment } from '../auth/types'
import { WORKSPACE_SIDEBARS } from './workspace-sidebar-configs'

// ── Route → Permission mapping ──
// Maps sidebar item paths to required permissions
const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
    // Tournament ops
    '/giai-dau': ['tournament.read'],
    '/noi-dung': ['tournament.read'],
    '/san-dau': ['tournament.read'],
    '/referees': ['scoring.read'],
    '/teams': ['athlete.read'],
    '/athletes': ['athlete.read'],
    '/registration': ['athlete.read'],
    '/weigh-in': ['tournament.read'],
    '/hop-chuyen-mon': ['tournament.read'],
    '/boc-tham': ['tournament.read'],
    '/schedule': ['tournament.read'],
    '/referee-assignments': ['scoring.read'],
    '/combat': ['scoring.read'],
    '/forms': ['scoring.read'],
    '/forms-scoring': ['scoring.record'],
    '/bracket': ['tournament.read'],
    '/results': ['tournament.read'],
    '/medals': ['tournament.read'],
    '/appeals': ['tournament.read'],
    '/reports': ['tournament.read'],
    '/scoreboard': ['scoring.read'],
    '/spectator': [],

    // Federation
    '/organizations': ['system.manage_tenants'],
    '/clubs': ['training.read'],
    '/people': ['athlete.read'],
    '/coaches': ['training.read'],
    '/calendar': [],
    '/rankings': ['tournament.read'],
    '/heritage': ['heritage.read'],
    '/heritage/lineage': ['heritage.read'],
    '/heritage/techniques': ['heritage.read'],

    // Training
    '/training/curriculum': ['training.read'],
    '/training/techniques': ['training.read'],
    '/training/belt-exams': ['training.manage_exams'],
    '/training/plans': ['training.read'],
    '/training/attendance': ['training.manage_attendance'],
    '/training/elearning': ['training.read'],

    // Finance
    '/finance': ['payment.read'],
    '/finance/invoices': ['payment.read'],
    '/finance/fees': ['payment.read'],
    '/finance/sponsorship': ['payment.read'],
    '/finance/budget': ['payment.read'],

    // Community
    '/community': ['community.create_post'],
    '/community/groups': ['community.manage_groups'],
    '/community/events': ['community.create_post'],

    // Admin
    '/admin': ['system.manage_config'],
    '/admin/users': ['system.manage_users'],
    '/admin/roles': ['system.manage_users'],
    '/admin/reference-data': ['system.manage_config'],
    '/admin/feature-flags': ['system.manage_config'],
    '/admin/documents': ['system.manage_config'],
    '/admin/data-quality': ['system.manage_config'],
    '/admin/integrity': ['system.manage_config'],
    '/admin/notifications': ['system.manage_config'],
    '/admin/audit-logs': ['system.view_audit'],
    '/admin/system': ['system.manage_config'],

    // Clubs
    '/clubs/classes': ['training.read'],
    '/clubs/facilities': ['training.read'],
    '/club': ['clubs.view'],
    '/club/members': ['members.view'],
    '/club/classes': ['training.read'],
    '/club/training': ['training.read'],
    '/club/certifications': ['belts.view'],
    '/club/finance': ['transactions.view'],
    '/club/tournaments': ['tournaments.view'],
    '/club/settings': ['clubs.update'],

    // Athlete portal
    '/athlete-portal': [],

    // Tournament management
    '/giai-dau/thong-ke': ['tournament.read'],
    '/giai-dau/quan-ly': ['tournament.read'],
    '/giai-dau/noi-dung': ['tournament.read'],
    '/giai-dau/dang-ky': ['tournament.read'],
    '/giai-dau/lich-thi': ['tournament.read'],
    '/giai-dau/ket-qua': ['tournament.read'],
    '/tournament-media/gallery': ['tournament.read'],
}

/** Permission set helper */
const buildPermissionSet = (user: AuthUser): Set<string> => {
    const set = new Set<string>()
    if (user.permissions) {
        for (const p of user.permissions) set.add(p)
    }
    return set
}

/** Check if user has the given permission */
const checkPermission = (
    permSet: Set<string>,
    permission: string,
    isAdmin: boolean
): boolean => {
    if (isAdmin) return true
    if (permSet.has('*')) return true
    const [resource] = permission.split('.')
    if (resource && permSet.has(`${resource}.*`)) return true
    return permSet.has(permission)
}

/**
 * Resolve which workspace types a user can access based on their role assignments.
 * Scope names use i18n keys — consumers should call t(scopeName) to localize.
 */
export function resolveWorkspacesForUser(user: AuthUser): WorkspaceAccess[] {
    // If backend already provides workspaces, use those
    if (user.workspaces && user.workspaces.length > 0) {
        return user.workspaces
    }

    // Fallback: derive from roles
    const workspaces: WorkspaceAccess[] = []
    const seen = new Set<string>()

    const addWorkspace = (type: WorkspaceType, scopeId: string, scopeName: string, role: string) => {
        const key = `${type}:${scopeId}`
        if (!seen.has(key)) {
            seen.add(key)
            workspaces.push({ type, scopeId, scopeName, role })
        }
    }

    // Derive from role assignments
    if (user.roles && user.roles.length > 0) {
        for (const ra of user.roles) {
            mapRoleToWorkspace(ra, addWorkspace)
        }
    } else {
        // Fallback: single role
        mapSingleRoleToWorkspace(user.role, addWorkspace)
    }

    // Everyone gets public spectator
    addWorkspace('public_spectator', 'PUBLIC', 'ws.scope.spectator', 'viewer')

    return workspaces
}

function mapRoleToWorkspace(
    ra: UserRoleAssignment,
    add: (type: WorkspaceType, scopeId: string, scopeName: string, role: string) => void
) {
    const code = ra.roleCode.toUpperCase()
    const scopeId = ra.scopeId ?? 'DEFAULT'
    const scopeName = ra.scopeName ?? ra.roleName

    if (code === 'SYSTEM_ADMIN') {
        add('system_admin', 'SYS', 'ws.scope.sysadmin', 'admin')
        add('federation_admin', scopeId, scopeName, 'admin')
        add('tournament_ops', scopeId, scopeName, 'admin')
        add('club_management', scopeId, scopeName, 'admin')
    } else if (code === 'FEDERATION_ADMIN' || code.includes('FEDERATION') || code.includes('PRESIDENT') || code.includes('SECRETARY')) {
        add('federation_admin', scopeId, scopeName, ra.roleCode)
    } else if (code === 'CLUB_MANAGER' || code.includes('CLUB')) {
        add('club_management', scopeId, scopeName, ra.roleCode)
    } else if (code === 'REFEREE' || code.includes('REFEREE')) {
        add('referee_console', scopeId, scopeName, ra.roleCode)
    } else if (code === 'COACH') {
        add('club_management', scopeId, scopeName, 'coach')
    } else if (code === 'ATHLETE') {
        add('athlete_portal', scopeId, scopeName, 'athlete')
    } else if (code === 'DELEGATE') {
        add('tournament_ops', scopeId, scopeName, 'delegate')
    } else if (code === 'BTC' || code.includes('ORGANIZ')) {
        add('tournament_ops', scopeId, scopeName, 'btc')
    } else if (code === 'TECHNICAL_DIRECTOR') {
        add('tournament_ops', scopeId, scopeName, 'technical_director')
        add('federation_admin', scopeId, scopeName, 'technical_director')
    } else if (code === 'MEDICAL_STAFF') {
        add('tournament_ops', scopeId, scopeName, 'medical_staff')
    }
}

function mapSingleRoleToWorkspace(
    role: string,
    add: (type: WorkspaceType, scopeId: string, scopeName: string, role: string) => void
) {
    switch (role) {
        case 'admin':
            add('system_admin', 'SYS', 'ws.scope.sysadmin', 'admin')
            add('federation_admin', 'FED', 'ws.scope.federation', 'admin')
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', 'admin')
            add('club_management', 'CLUB', 'ws.scope.club', 'admin')
            break
        case 'federation_president':
        case 'federation_secretary':
        case 'provincial_admin':
            add('federation_admin', 'FED', 'ws.scope.federation', role)
            break
        case 'technical_director':
            add('federation_admin', 'FED', 'ws.scope.federation', role)
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', role)
            break
        case 'btc':
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', 'btc')
            break
        case 'referee_manager':
        case 'referee':
            add('referee_console', 'TOURN', 'ws.scope.referee', role)
            break
        case 'coach':
        case 'club_leader':
        case 'club_vice_leader':
        case 'club_secretary':
        case 'club_accountant':
            add('club_management', 'CLUB', 'ws.scope.club', 'coach')
            break
        case 'delegate':
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', 'delegate')
            break
        case 'athlete':
            add('athlete_portal', 'SELF', 'ws.scope.athlete', 'athlete')
            break
        case 'medical_staff':
            add('tournament_ops', 'TOURN', 'ws.scope.medical', 'medical_staff')
            break
    }
}

/**
 * Filter a workspace's sidebar config based on user permissions.
 * Items requiring permissions the user doesn't have are removed.
 */
export function getFilteredSidebar(
    workspaceType: WorkspaceType,
    user: AuthUser
): WorkspaceSidebarConfig {
    const config = WORKSPACE_SIDEBARS[workspaceType]
    if (!config) return { type: workspaceType, groups: [] }

    const permSet = buildPermissionSet(user)
    const isAdmin = user.role === 'admin'

    return {
        ...config,
        groups: config.groups
            .map(group => ({
                ...group,
                items: group.items.filter(item => {
                    const requiredPerms = ROUTE_PERMISSION_MAP[item.path]
                    // No mapping = always visible
                    if (!requiredPerms || requiredPerms.length === 0) return true
                    // All required permissions must be granted
                    return requiredPerms.every(p => checkPermission(permSet, p, isAdmin))
                }),
            }))
            .filter(group => group.items.length > 0),
    }
}
