// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Workspace Resolver
// Resolves available workspaces and filters sidebar based on UUID permissions.
// ════════════════════════════════════════════════════════════════

import { normalizeWorkspaceType, type WorkspaceType, type WorkspaceSidebarConfig } from './workspace-types'
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

    // Federation Admin (Org-level)
    '/fed/master-data': ['system.manage_config'],
    '/fed/documents': ['system.manage_config'],
    '/fed/certifications': ['system.manage_config'],
    '/fed/notifications': ['system.manage_config'],
    '/fed/workflow-config': ['system.manage_config'],

    // Community
    '/community': ['community.create_post'],
    '/community/groups': ['community.manage_groups'],
    '/community/events': ['community.create_post'],

    // Admin
    '/admin': ['system.manage_config'],
    '/admin/tenants': ['system.manage_tenants'],
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

const PROVINCIAL_ROLE_CODES = new Set([
    'PROVINCIAL_ADMIN',
    'PROVINCIAL_PRESIDENT',
    'PROVINCIAL_VICE_PRESIDENT',
    'PROVINCIAL_SECRETARY',
    'PROVINCIAL_TECHNICAL_HEAD',
    'PROVINCIAL_REFEREE_HEAD',
    'PROVINCIAL_COMMITTEE_MEMBER',
    'PROVINCIAL_ACCOUNTANT',
])

const FEDERATION_ROLE_CODES = new Set([
    'FEDERATION_ADMIN',
    'FEDERATION_STAFF',
    'FEDERATION_PRESIDENT',
    'FEDERATION_SECRETARY',
    'VICE_PRESIDENT',
    'PR_MANAGER',
    'INTERNATIONAL_LIAISON',
])

const DISCIPLINE_ROLE_CODES = new Set(['DISCIPLINE_BOARD', 'INSPECTOR'])
const CLUB_ROLE_CODES = new Set([
    'CLUB_MANAGER',
    'CLUB_COACH',
    'CLUB_LEADER',
    'CLUB_VICE_LEADER',
    'CLUB_SECRETARY',
    'CLUB_ACCOUNTANT',
    'COACH',
])
const REFEREE_ROLE_CODES = new Set([
    'HEAD_REFEREE',
    'REFEREE_MANAGER',
    'REFEREE',
    'JUDGE',
])
const TOURNAMENT_ROLE_CODES = new Set([
    'TOURNAMENT_DIRECTOR',
    'TOURNAMENT_STAFF',
    'BTC',
    'DELEGATE',
    'MEDICAL_STAFF',
])

/**
 * Resolve which workspace types a user can access based on their role assignments.
 * Scope names use i18n keys — consumers should call t(scopeName) to localize.
 */
export function resolveWorkspacesForUser(user: AuthUser): WorkspaceAccess[] {
    const workspaces: WorkspaceAccess[] = []
    const seen = new Set<string>()

    const addWorkspace = (type: WorkspaceType, scopeId: string, scopeName: string, role: string) => {
        const key = `${type}:${scopeId}`
        if (!seen.has(key)) {
            seen.add(key)
            workspaces.push({ type, scopeId, scopeName, role })
        }
    }

    // If backend already provides workspaces, use those after alias normalization.
    // If all backend workspaces fail normalization (e.g. type "custom" from a case-mismatch bug),
    // fall through to role-based derivation instead of returning only public_spectator.
    if (user.workspaces && user.workspaces.length > 0) {
        for (const workspace of user.workspaces) {
            const type = normalizeWorkspaceType(workspace.type)
            if (!type) continue
            addWorkspace(type, workspace.scopeId, workspace.scopeName, workspace.role)
        }
        // Only use backend workspaces if at least one meaningful (non-spectator) workspace resolved
        const hasMeaningful = workspaces.some(w => w.type !== 'public_spectator')
        if (hasMeaningful) {
            addWorkspace('public_spectator', 'PUBLIC', 'ws.scope.spectator', 'viewer')
            return workspaces
        }
        // Otherwise clear and fall through to role-based derivation
        workspaces.length = 0
        seen.clear()
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

    if (code === 'OWNER' || code === 'SYSTEM_ADMIN' || code === 'ADMIN') {
        add('system_admin', 'SYS', 'ws.scope.sysadmin', 'admin')
        add('federation_admin', 'FED', 'ws.scope.federation', 'admin')
        add('tournament_ops', 'TOURN', 'ws.scope.tournament', 'admin')
        add('club_management', 'CLUB', 'ws.scope.club', 'admin')
    } else if (PROVINCIAL_ROLE_CODES.has(code)) {
        add('federation_provincial', scopeId, scopeName, ra.roleCode)
    } else if (DISCIPLINE_ROLE_CODES.has(code)) {
        add('federation_discipline', scopeId, scopeName, ra.roleCode)
    } else if (FEDERATION_ROLE_CODES.has(code)) {
        add('federation_admin', scopeId, scopeName, ra.roleCode)
    } else if (code === 'TECHNICAL_DIRECTOR') {
        add('tournament_ops', scopeId, scopeName, 'technical_director')
        add('federation_admin', scopeId, scopeName, 'technical_director')
    } else if (CLUB_ROLE_CODES.has(code)) {
        add('club_management', scopeId, scopeName, ra.roleCode)
    } else if (REFEREE_ROLE_CODES.has(code)) {
        add('referee_console', scopeId, scopeName, ra.roleCode)
    } else if (TOURNAMENT_ROLE_CODES.has(code)) {
        add('tournament_ops', scopeId, scopeName, ra.roleCode.toLowerCase())
    } else if (code === 'ATHLETE') {
        add('athlete_portal', scopeId, scopeName, 'athlete')
    } else if (code === 'PARENT') {
        add('parent_portal', scopeId, scopeName, 'parent')
    }
}

function mapSingleRoleToWorkspace(
    role: string,
    add: (type: WorkspaceType, scopeId: string, scopeName: string, role: string) => void
) {
    switch (role) {
        case 'owner':
        case 'admin':
            add('system_admin', 'SYS', 'ws.scope.sysadmin', 'admin')
            add('federation_admin', 'FED', 'ws.scope.federation', 'admin')
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', 'admin')
            add('club_management', 'CLUB', 'ws.scope.club', 'admin')
            break
        case 'federation_president':
        case 'vice_president':
        case 'federation_secretary':
            add('federation_admin', 'FED', 'ws.scope.federation', role)
            break
        case 'pr_manager':
        case 'international_liaison':
            add('federation_admin', 'FED', 'ws.scope.federation', role)
            break
        case 'provincial_admin':
        case 'provincial_president':
        case 'provincial_vice_president':
        case 'provincial_secretary':
        case 'provincial_technical_head':
        case 'provincial_referee_head':
        case 'provincial_committee_member':
        case 'provincial_accountant':
            add('federation_provincial', 'PROV', 'ws.scope.provincial', role)
            break
        case 'technical_director':
            add('federation_admin', 'FED', 'ws.scope.federation', role)
            add('tournament_ops', 'TOURN', 'ws.scope.tournament', role)
            break
        case 'discipline_board':
        case 'inspector':
            add('federation_discipline', 'FED', 'ws.scope.discipline', role)
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
        case 'parent':
            add('parent_portal', 'SELF', 'ws.scope.parent', 'parent')
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
