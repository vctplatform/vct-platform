// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Sidebar Configs
// Labels use i18n translation keys (resolved at render time).
// ════════════════════════════════════════════════════════════════

import type { WorkspaceSidebarConfig, WorkspaceType } from './workspace-types'

const FEDERATION_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'federation_admin',
    groups: [
        {
            id: 'overview', label: 'ws.fed.overview', items: [
                { id: 'fed-dashboard', path: '/', label: 'ws.fed.dashboard', icon: 'Dashboard' },
                { id: 'fed-calendar', path: '/calendar', label: 'ws.fed.calendar', icon: 'Calendar' },
                { id: 'fed-approvals', path: '/fed/approvals', label: 'ws.fed.approvals', icon: 'CheckSquare' },
            ],
        },
        {
            id: 'organization', label: 'ws.fed.org', items: [
                { id: 'fed-orgs', path: '/organizations', label: 'ws.fed.orgs', icon: 'Building' },
                { id: 'fed-clubs', path: '/clubs', label: 'ws.fed.clubs', icon: 'Home' },
                { id: 'fed-people', path: '/people', label: 'ws.fed.people', icon: 'Users' },
                { id: 'fed-provinces', path: '/fed/provinces', label: 'ws.fed.provinces', icon: 'MapPin' },
                { id: 'fed-orgchart', path: '/fed/org-chart', label: 'ws.fed.orgChart', icon: 'GitMerge' },
            ],
        },
        {
            id: 'tournaments', label: 'ws.fed.tournaments', items: [
                { id: 'fed-tournaments', path: '/giai-dau', label: 'ws.fed.tournamentList', icon: 'Trophy' },
                { id: 'fed-tourn-mgmt', path: '/giai-dau/quan-ly', label: 'ws.fed.tournMgmt', icon: 'Settings' },
                { id: 'fed-tourn-cats', path: '/giai-dau/noi-dung', label: 'ws.fed.tournCategories', icon: 'List' },
                { id: 'fed-tourn-reg', path: '/giai-dau/dang-ky', label: 'ws.fed.tournRegistration', icon: 'ClipboardCheck' },
                { id: 'fed-tourn-schedule', path: '/giai-dau/lich-thi', label: 'ws.fed.tournSchedule', icon: 'Calendar' },
                { id: 'fed-tourn-results', path: '/giai-dau/ket-qua', label: 'ws.fed.tournResults', icon: 'Award' },
                { id: 'fed-reports', path: '/reports', label: 'ws.fed.reports', icon: 'Printer' },
            ],
        },
        {
            id: 'regulations', label: 'ws.fed.regulations', items: [
                { id: 'fed-regulations', path: '/fed/regulations', label: 'ws.fed.regulationsOverview', icon: 'ScrollText' },
                { id: 'fed-masterdata', path: '/fed/master-data', label: 'ws.fed.masterData', icon: 'Database' },
            ],
        },
        {
            id: 'ranking', label: 'ws.fed.ranking', items: [
                { id: 'fed-rankings', path: '/rankings', label: 'ws.fed.rankings', icon: 'BarChart2' },
                { id: 'fed-heritage', path: '/heritage', label: 'ws.fed.heritage', icon: 'Network' },
                { id: 'fed-lineage', path: '/heritage/lineage', label: 'ws.fed.lineage', icon: 'GitMerge' },
                { id: 'fed-techniques', path: '/heritage/techniques', label: 'ws.fed.techniques', icon: 'Video' },
            ],
        },
        {
            id: 'training', label: 'ws.fed.training', items: [
                { id: 'fed-curriculum', path: '/training/curriculum', label: 'ws.fed.curriculum', icon: 'Book' },
                { id: 'fed-techniques', path: '/training/techniques', label: 'ws.fed.techLib', icon: 'Video' },
                { id: 'fed-beltexams', path: '/training/belt-exams', label: 'ws.fed.beltExams', icon: 'Award' },
            ],
        },
        {
            id: 'finance', label: 'ws.fed.finance', items: [
                { id: 'fed-finance', path: '/finance', label: 'ws.fed.financeOverview', icon: 'DollarSign' },
                { id: 'fed-invoices', path: '/finance/invoices', label: 'ws.fed.invoices', icon: 'FileText' },
                { id: 'fed-fees', path: '/finance/fees', label: 'ws.fed.fees', icon: 'CreditCard' },
                { id: 'fed-sponsorship', path: '/finance/sponsorship', label: 'ws.fed.sponsorship', icon: 'Heart' },
                { id: 'fed-budget', path: '/finance/budget', label: 'ws.fed.budget', icon: 'BarChart2' },
            ],
        },
        {
            id: 'community', label: 'ws.fed.community', items: [
                { id: 'fed-community', path: '/community', label: 'ws.fed.news', icon: 'Heart' },
                { id: 'fed-groups', path: '/community/groups', label: 'ws.fed.groups', icon: 'Users' },
                { id: 'fed-events', path: '/community/events', label: 'ws.fed.events', icon: 'Calendar' },
            ],
        },
    ],
}

const PROVINCIAL_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'federation_provincial',
    groups: [
        {
            id: 'overview', label: 'ws.prov.overview', items: [
                { id: 'prov-dashboard', path: '/province/dashboard', label: 'ws.prov.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'management', label: 'ws.prov.management', items: [
                { id: 'prov-clubs', path: '/province/clubs', label: 'ws.prov.clubs', icon: 'Home' },
                { id: 'prov-athletes', path: '/province/athletes', label: 'ws.prov.athletes', icon: 'Users' },
                { id: 'prov-coaches', path: '/province/coaches', label: 'ws.prov.coaches', icon: 'UserCheck' },
            ],
        },
        {
            id: 'tournaments', label: 'ws.prov.tournaments', items: [
                { id: 'prov-tournaments', path: '/province/tournaments', label: 'ws.prov.tournaments', icon: 'Trophy' },
                { id: 'prov-registration', path: '/registration', label: 'ws.prov.registration', icon: 'ClipboardCheck' },
            ],
        },
        {
            id: 'reports', label: 'ws.prov.reports', items: [
                { id: 'prov-reports', path: '/province/reports', label: 'ws.prov.reportList', icon: 'Printer' },
                { id: 'prov-finance', path: '/finance', label: 'ws.prov.finance', icon: 'DollarSign' },
            ],
        },
    ],
}

const DISCIPLINE_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'federation_discipline',
    groups: [
        {
            id: 'overview', label: 'ws.disc.overview', items: [
                { id: 'disc-dashboard', path: '/discipline/dashboard', label: 'ws.disc.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'cases', label: 'ws.disc.cases', items: [
                { id: 'disc-cases', path: '/discipline/cases', label: 'ws.disc.caseList', icon: 'AlertCircle' },
                { id: 'disc-hearings', path: '/discipline/hearings', label: 'ws.disc.hearings', icon: 'Scale' },
                { id: 'disc-sanctions', path: '/discipline/sanctions', label: 'ws.disc.sanctions', icon: 'Shield' },
            ],
        },
        {
            id: 'inspection', label: 'ws.disc.inspection', items: [
                { id: 'disc-inspect', path: '/discipline/inspections', label: 'ws.disc.inspections', icon: 'Search' },
                { id: 'disc-reports', path: '/discipline/reports', label: 'ws.disc.reports', icon: 'FileText' },
            ],
        },
    ],
}

const TOURNAMENT_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'tournament_ops',
    groups: [
        {
            id: 'overview', label: 'ws.tourn.overview', items: [
                { id: 'tourn-dashboard', path: '/', label: 'ws.tourn.dashboard', icon: 'Dashboard' },
                { id: 'tourn-mgmt', path: '/giai-dau/quan-ly', label: 'ws.tourn.mgmtDashboard', icon: 'LayoutDashboard' },
                { id: 'tourn-statistics', path: '/giai-dau/thong-ke', label: 'ws.tourn.statistics', icon: 'BarChart2' },
            ],
        },
        {
            id: 'setup', label: 'ws.tourn.setup', items: [
                { id: 'tourn-config', path: '/giai-dau', label: 'ws.tourn.config', icon: 'Trophy' },
                { id: 'tourn-categories-mgmt', path: '/giai-dau/noi-dung', label: 'ws.tourn.categoriesMgmt', icon: 'LayoutList' },
                { id: 'tourn-categories', path: '/noi-dung', label: 'ws.tourn.categories', icon: 'List' },
                { id: 'tourn-arenas', path: '/san-dau', label: 'ws.tourn.arenas', icon: 'LayoutGrid' },
                { id: 'tourn-refs', path: '/referees', label: 'ws.tourn.refs', icon: 'UserCheck' },
            ],
        },
        {
            id: 'registration', label: 'ws.tourn.registration', items: [
                { id: 'tourn-reg-mgmt', path: '/giai-dau/dang-ky', label: 'ws.tourn.regMgmt', icon: 'FileCheck' },
                { id: 'tourn-teams', path: '/teams', label: 'ws.tourn.teams', icon: 'Building2' },
                { id: 'tourn-athletes', path: '/athletes', label: 'ws.tourn.athletes', icon: 'Users' },
                { id: 'tourn-reg', path: '/registration', label: 'ws.tourn.reg', icon: 'ClipboardCheck' },
                { id: 'tourn-weighin', path: '/weigh-in', label: 'ws.tourn.weighin', icon: 'Scale' },
            ],
        },
        {
            id: 'operations', label: 'ws.tourn.operations', items: [
                { id: 'tourn-schedule-mgmt', path: '/giai-dau/lich-thi', label: 'ws.tourn.scheduleMgmt', icon: 'CalendarClock' },
                { id: 'tourn-meeting', path: '/hop-chuyen-mon', label: 'ws.tourn.meeting', icon: 'ClipboardList' },
                { id: 'tourn-draw', path: '/boc-tham', label: 'ws.tourn.draw', icon: 'Shuffle' },
                { id: 'tourn-schedule', path: '/schedule', label: 'ws.tourn.schedule', icon: 'Calendar' },
                { id: 'tourn-refassign', path: '/referee-assignments', label: 'ws.tourn.refAssign', icon: 'GitMerge' },
                { id: 'tourn-combat', path: '/combat', label: 'ws.tourn.combat', icon: 'Swords' },
                { id: 'tourn-forms', path: '/forms', label: 'ws.tourn.forms', icon: 'Star' },
                { id: 'tourn-bracket', path: '/bracket', label: 'ws.tourn.bracket', icon: 'GitMerge' },
            ],
        },
        {
            id: 'results', label: 'ws.tourn.results', items: [
                { id: 'tourn-results-mgmt', path: '/giai-dau/ket-qua', label: 'ws.tourn.resultsMgmt', icon: 'Medal' },
                { id: 'tourn-results', path: '/results', label: 'ws.tourn.resultList', icon: 'Award' },
                { id: 'tourn-medals', path: '/medals', label: 'ws.tourn.medals', icon: 'Medal' },
                { id: 'tourn-appeals', path: '/appeals', label: 'ws.tourn.appeals', icon: 'AlertCircle' },
                { id: 'tourn-gallery', path: '/tournament-media/gallery', label: 'ws.tourn.gallery', icon: 'Image' },
                { id: 'tourn-reports', path: '/reports', label: 'ws.tourn.reports', icon: 'Printer' },
            ],
        },
    ],
}

const CLUB_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'club_management',
    groups: [
        {
            id: 'overview', label: 'ws.club.overview', items: [
                { id: 'club-dashboard', path: '/', label: 'ws.club.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'members', label: 'ws.club.members', items: [
                { id: 'club-students', path: '/people', label: 'ws.club.students', icon: 'Users' },
                { id: 'club-coaches', path: '/coaches', label: 'ws.club.coaches', icon: 'UserCheck' },
            ],
        },
        {
            id: 'training', label: 'ws.club.training', items: [
                { id: 'club-curriculum', path: '/training/curriculum', label: 'ws.club.curriculum', icon: 'Book' },
                { id: 'club-techniques', path: '/training/techniques', label: 'ws.club.techniques', icon: 'Video' },
                { id: 'club-plans', path: '/training/plans', label: 'ws.club.plans', icon: 'Calendar' },
                { id: 'club-classes', path: '/clubs/classes', label: 'ws.club.classes', icon: 'Clock' },
                { id: 'club-attendance', path: '/training/attendance', label: 'ws.club.attendance', icon: 'CheckSquare' },
                { id: 'club-beltexams', path: '/training/belt-exams', label: 'ws.club.beltExams', icon: 'Award' },
                { id: 'club-elearning', path: '/training/elearning', label: 'ws.club.elearning', icon: 'Laptop' },
            ],
        },
        {
            id: 'facilities', label: 'ws.club.facilities', items: [
                { id: 'club-facilities', path: '/clubs/facilities', label: 'ws.club.facilityList', icon: 'Home' },
            ],
        },
        {
            id: 'finance', label: 'ws.club.finance', items: [
                { id: 'club-finance', path: '/finance', label: 'ws.club.financeOverview', icon: 'DollarSign' },
                { id: 'club-invoices', path: '/finance/invoices', label: 'ws.club.invoices', icon: 'FileText' },
                { id: 'club-fees', path: '/finance/fees', label: 'ws.club.fees', icon: 'CreditCard' },
            ],
        },
        {
            id: 'tournaments', label: 'ws.club.tournaments', items: [
                { id: 'club-tournaments', path: '/giai-dau', label: 'ws.club.tournamentList', icon: 'Trophy' },
                { id: 'club-registration', path: '/registration', label: 'ws.club.registration', icon: 'ClipboardCheck' },
            ],
        },
    ],
}

const REFEREE_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'referee_console',
    groups: [
        {
            id: 'overview', label: 'ws.ref.overview', items: [
                { id: 'ref-dashboard', path: '/', label: 'ws.ref.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'schedule', label: 'ws.ref.schedule', items: [
                { id: 'ref-schedule', path: '/schedule', label: 'ws.ref.scheduleList', icon: 'Calendar' },
                { id: 'ref-assignments', path: '/referee-assignments', label: 'ws.ref.assignments', icon: 'GitMerge' },
            ],
        },
        {
            id: 'scoring', label: 'ws.ref.scoring', items: [
                { id: 'ref-combat', path: '/combat', label: 'ws.ref.combat', icon: 'Swords' },
                { id: 'ref-forms', path: '/forms-scoring', label: 'ws.ref.forms', icon: 'Star' },
                { id: 'ref-scoreboard', path: '/scoreboard', label: 'ws.ref.scoreboard', icon: 'Monitor' },
            ],
        },
        {
            id: 'review', label: 'ws.ref.review', items: [
                { id: 'ref-appeals', path: '/appeals', label: 'ws.ref.appeals', icon: 'AlertCircle' },
                { id: 'ref-results', path: '/results', label: 'ws.ref.results', icon: 'Award' },
            ],
        },
    ],
}

const ATHLETE_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'athlete_portal',
    groups: [
        {
            id: 'overview', label: 'ws.ath.overview', items: [
                { id: 'ath-home', path: '/athlete-portal', label: 'ws.ath.home', icon: 'Dashboard' },
            ],
        },
        {
            id: 'profile_belt', label: 'ws.ath.profileBelt', items: [
                { id: 'ath-profile', path: '/athlete-portal/profile', label: 'ws.ath.profile', icon: 'User' },
            ],
        },
        {
            id: 'performance', label: 'ws.ath.performance', items: [
                { id: 'ath-rankings', path: '/athlete-portal/rankings', label: 'ws.ath.rankings', icon: 'BarChart2' },
                { id: 'ath-results', path: '/athlete-portal/results', label: 'ws.ath.results', icon: 'Award' },
            ],
        },
        {
            id: 'activity', label: 'ws.ath.activity', items: [
                { id: 'ath-tournaments', path: '/athlete-portal/tournaments', label: 'ws.ath.tournaments', icon: 'Trophy' },
                { id: 'ath-clubs', path: '/athlete-portal/clubs', label: 'ws.ath.clubs', icon: 'Building' },
                { id: 'ath-training', path: '/athlete-portal/training', label: 'ws.ath.training', icon: 'Calendar' },
            ],
        },
        {
            id: 'learning', label: 'ws.ath.learning', items: [
                { id: 'ath-elearning', path: '/athlete-portal/elearning', label: 'ws.ath.elearning', icon: 'Laptop' },
            ],
        },
    ],
}

const PUBLIC_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'public_spectator',
    groups: [
        {
            id: 'live', label: 'ws.pub.live', items: [
                { id: 'pub-scoreboard', path: '/scoreboard', label: 'ws.pub.scoreboard', icon: 'Monitor' },
                { id: 'pub-spectator', path: '/spectator', label: 'ws.pub.spectator', icon: 'Eye' },
                { id: 'pub-schedule', path: '/schedule', label: 'ws.pub.schedule', icon: 'Calendar' },
            ],
        },
        {
            id: 'info', label: 'ws.pub.info', items: [
                { id: 'pub-rankings', path: '/rankings', label: 'ws.pub.rankings', icon: 'BarChart2' },
                { id: 'pub-results', path: '/results', label: 'ws.pub.results', icon: 'Award' },
                { id: 'pub-medals', path: '/medals', label: 'ws.pub.medals', icon: 'Medal' },
            ],
        },
        {
            id: 'explore', label: 'ws.pub.explore', items: [
                { id: 'pub-heritage', path: '/heritage', label: 'ws.pub.heritage', icon: 'Network' },
                { id: 'pub-community', path: '/community', label: 'ws.pub.community', icon: 'Heart' },
            ],
        },
    ],
}

const SYSADMIN_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'system_admin',
    groups: [
        {
            id: 'overview', label: 'ws.sys.overview', items: [
                { id: 'sys-dashboard', path: '/admin', label: 'ws.sys.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'access', label: 'ws.sys.access', items: [
                { id: 'sys-users', path: '/admin/users', label: 'ws.sys.users', icon: 'Users' },
                { id: 'sys-roles', path: '/admin/roles', label: 'ws.sys.roles', icon: 'Shield' },
            ],
        },
        {
            id: 'config', label: 'ws.sys.config', items: [
                { id: 'sys-refdata', path: '/admin/reference-data', label: 'ws.sys.refdata', icon: 'Database' },
                { id: 'sys-flags', path: '/admin/feature-flags', label: 'ws.sys.flags', icon: 'Flag' },
                { id: 'sys-documents', path: '/admin/documents', label: 'ws.sys.documents', icon: 'FileText' },
            ],
        },
        {
            id: 'monitoring', label: 'ws.sys.monitoring', items: [
                { id: 'sys-data-quality', path: '/admin/data-quality', label: 'ws.sys.dataQuality', icon: 'BarChart2' },
                { id: 'sys-integrity', path: '/admin/integrity', label: 'ws.sys.integrity', icon: 'ShieldCheck' },
                { id: 'sys-notifications', path: '/admin/notifications', label: 'ws.sys.notifications', icon: 'Bell' },
                { id: 'sys-audit', path: '/admin/audit-logs', label: 'ws.sys.audit', icon: 'FileText' },
                { id: 'sys-health', path: '/admin/system', label: 'ws.sys.health', icon: 'Activity' },
            ],
        },
    ],
}

// ── Registry ──
export const WORKSPACE_SIDEBARS: Record<WorkspaceType, WorkspaceSidebarConfig> = {
    federation_admin: FEDERATION_SIDEBAR,
    federation_provincial: PROVINCIAL_SIDEBAR,
    federation_discipline: DISCIPLINE_SIDEBAR,
    tournament_ops: TOURNAMENT_SIDEBAR,
    club_management: CLUB_SIDEBAR,
    referee_console: REFEREE_SIDEBAR,
    athlete_portal: ATHLETE_SIDEBAR,
    public_spectator: PUBLIC_SIDEBAR,
    system_admin: SYSADMIN_SIDEBAR,
}

/** Get sidebar config for a workspace type */
export function getWorkspaceSidebar(type: WorkspaceType): WorkspaceSidebarConfig {
    return WORKSPACE_SIDEBARS[type]
}
