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
                { id: 'fed-dashboard', path: '/dashboard', label: 'ws.fed.dashboard', icon: 'Dashboard' },
                { id: 'fed-executive', path: '/federation/executive', label: 'ws.fed.executive', icon: 'BarChart2' },
                { id: 'fed-calendar', path: '/federation/calendar', label: 'ws.fed.calendar', icon: 'Calendar' },
            ],
        },
        {
            id: 'approvals', label: 'ws.fed.approvals', items: [
                { id: 'fed-approvals', path: '/federation/approvals', label: 'ws.fed.approvalCenter', icon: 'CheckSquare' },
                { id: 'fed-pending', path: '/federation/pending-approvals', label: 'ws.fed.pendingApprovals', icon: 'Clock' },
                { id: 'fed-submit', path: '/federation/submit-approval', label: 'ws.fed.submitApproval', icon: 'Upload' },
                { id: 'fed-workflow', path: '/federation/workflow-config', label: 'ws.fed.workflow', icon: 'GitMerge' },
            ],
        },
        {
            id: 'organization', label: 'ws.fed.org', items: [
                { id: 'fed-orgs', path: '/organizations', label: 'ws.fed.orgs', icon: 'Building' },
                { id: 'fed-orgchart', path: '/federation/org-chart', label: 'ws.fed.orgChart', icon: 'Network' },
                { id: 'fed-personnel', path: '/federation/personnel', label: 'ws.fed.personnel', icon: 'Users' },
                { id: 'fed-provinces', path: '/federation/provinces', label: 'ws.fed.provinces', icon: 'MapPin' },
            ],
        },
        {
            id: 'regulations', label: 'ws.fed.regulations', items: [
                { id: 'fed-regulations', path: '/federation/regulations', label: 'ws.fed.regulationsOverview', icon: 'ScrollText' },
                { id: 'fed-masterdata', path: '/federation/master-data', label: 'ws.fed.masterData', icon: 'Database' },
                { id: 'fed-docs', path: '/federation/documents', label: 'ws.fed.documents', icon: 'FileText' },
            ],
        },
        {
            id: 'compliance', label: 'ws.fed.compliance', items: [
                { id: 'fed-certifications', path: '/federation/certifications', label: 'ws.fed.certifications', icon: 'Award' },
                { id: 'fed-cert-verify', path: '/federation/cert-verification', label: 'ws.fed.certVerify', icon: 'Search' },
                { id: 'fed-discipline', path: '/federation/discipline', label: 'ws.fed.discipline', icon: 'Shield' },
            ],
        },
        {
            id: 'finance', label: 'ws.fed.finance', items: [
                { id: 'fed-finance', path: '/federation/finance', label: 'ws.fed.financeOverview', icon: 'DollarSign' },
                { id: 'fed-invoices', path: '/federation/invoices', label: 'ws.fed.invoices', icon: 'FileText' },
                { id: 'fed-fees', path: '/federation/fees', label: 'ws.fed.fees', icon: 'CreditCard' },
                { id: 'fed-sponsorship', path: '/federation/sponsorship', label: 'ws.fed.sponsorship', icon: 'Heart' },
                { id: 'fed-budget', path: '/federation/budget', label: 'ws.fed.budget', icon: 'BarChart2' },
            ],
        },
        {
            id: 'external', label: 'ws.fed.external', items: [
                { id: 'fed-international', path: '/federation/international', label: 'ws.fed.international', icon: 'Globe' },
                { id: 'fed-pr', path: '/federation/pr', label: 'ws.fed.pr', icon: 'Megaphone' },
            ],
        },
        {
            id: 'settings', label: 'ws.fed.settings', items: [
                { id: 'fed-notifications', path: '/federation/notifications', label: 'ws.fed.notifications', icon: 'Bell' },
            ],
        },
    ],
}

const HERITAGE_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'federation_heritage',
    groups: [
        {
            id: 'overview', label: 'ws.heritage.overview', items: [
                { id: 'herit-dashboard', path: '/heritage/dashboard', label: 'ws.heritage.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'ranking', label: 'ws.fed.ranking', items: [
                { id: 'herit-rankings', path: '/rankings', label: 'ws.fed.rankings', icon: 'BarChart2' },
                { id: 'herit-heritage', path: '/heritage', label: 'ws.fed.heritage', icon: 'Network' },
                { id: 'herit-lineage', path: '/heritage/lineage', label: 'ws.fed.lineage', icon: 'GitMerge' },
                { id: 'herit-techniques', path: '/heritage/techniques', label: 'ws.fed.techniques', icon: 'Video' },
            ],
        },
    ],
}

const TRAINING_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'training_management',
    groups: [
        {
            id: 'overview', label: 'ws.training.overview', items: [
                { id: 'train-dashboard', path: '/training/dashboard', label: 'ws.training.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'training', label: 'ws.fed.training', items: [
                { id: 'train-curriculum', path: '/training/curriculum', label: 'ws.fed.curriculum', icon: 'Book' },
                { id: 'train-techniques', path: '/training/techniques', label: 'ws.fed.techLib', icon: 'Video' },
                { id: 'train-beltexams', path: '/training/belt-exams', label: 'ws.fed.beltExams', icon: 'Award' },
                { id: 'train-elearning', path: '/training/elearning', label: 'ws.fed.elearning', icon: 'Laptop' },
            ],
        },
    ],
}

const PROVINCIAL_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'federation_provincial',
    groups: [
        {
            id: 'overview', label: 'ws.prov.overview', items: [
                { id: 'prov-dashboard', path: '/provincial', label: 'ws.prov.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'management', label: 'ws.prov.management', items: [
                { id: 'prov-clubs', path: '/provincial/clubs', label: 'ws.prov.clubs', icon: 'Home' },
                { id: 'prov-athletes', path: '/provincial/athletes', label: 'ws.prov.athletes', icon: 'Users' },
                { id: 'prov-coaches', path: '/provincial/coaches', label: 'ws.prov.coaches', icon: 'UserCheck' },
                { id: 'prov-referees', path: '/provincial/referees', label: 'ws.prov.referees', icon: 'Scale' },
                { id: 'prov-personnel', path: '/provincial/personnel', label: 'ws.prov.personnel', icon: 'Users' },
            ],
        },
        {
            id: 'tournaments', label: 'ws.prov.tournaments', items: [
                { id: 'prov-tournaments', path: '/provincial/tournaments', label: 'ws.prov.tournaments', icon: 'Trophy' },
                { id: 'prov-certifications', path: '/provincial/certifications', label: 'ws.prov.certifications', icon: 'Award' },
                { id: 'prov-vo-sinh', path: '/provincial/vo-sinh', label: 'ws.prov.voSinh', icon: 'Users' },
            ],
        },
        {
            id: 'reports', label: 'ws.prov.reports', items: [
                { id: 'prov-documents', path: '/provincial/documents', label: 'ws.prov.documents', icon: 'FileText' },
                { id: 'prov-discipline', path: '/provincial/discipline', label: 'ws.prov.discipline', icon: 'Shield' },
                { id: 'prov-reports', path: '/provincial/reports', label: 'ws.prov.reportList', icon: 'Printer' },
                { id: 'prov-finance', path: '/provincial/finance', label: 'ws.prov.finance', icon: 'DollarSign' },
            ],
        },
    ],
}

const PARENT_SIDEBAR: WorkspaceSidebarConfig = {
    type: 'parent_portal',
    groups: [
        {
            id: 'overview', label: 'parent.dashboard', items: [
                { id: 'parent-dashboard', path: '/parent', label: 'parent.dashboard', icon: 'Dashboard' },
            ],
        },
        {
            id: 'children', label: 'parent.children', items: [
                { id: 'parent-children', path: '/parent/children', label: 'parent.children', icon: 'Users' },
            ],
        },
        {
            id: 'consent', label: 'parent.consent', items: [
                { id: 'parent-consent', path: '/parent/consent', label: 'parent.consent', icon: 'Shield' },
            ],
        },
        {
            id: 'attendance', label: 'parent.attendance', items: [
                { id: 'parent-attendance', path: '/parent/attendance', label: 'parent.attendance', icon: 'Calendar' },
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
                { id: 'tourn-dashboard', path: '/giai-dau', label: 'ws.tourn.dashboard', icon: 'Dashboard' },
                { id: 'tourn-mgmt', path: '/giai-dau/quan-ly', label: 'ws.tourn.mgmtDashboard', icon: 'LayoutDashboard' },
                { id: 'tourn-statistics', path: '/giai-dau/thong-ke', label: 'ws.tourn.statistics', icon: 'BarChart2' },
            ],
        },
        {
            id: 'setup', label: 'ws.tourn.setup', items: [
                { id: 'tourn-config', path: '/tournament-config', label: 'ws.tourn.config', icon: 'Trophy' },
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
                { id: 'club-dashboard', path: '/club', label: 'ws.club.dashboard', icon: 'Dashboard' },
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
                { id: 'ref-dashboard', path: '/referee-scoring', label: 'ws.ref.dashboard', icon: 'Dashboard' },
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
            id: 'analytics', label: 'ws.sys.analytics', items: [
                { id: 'sys-dashboard', path: '/admin', label: 'ws.sys.platformAnalytics', icon: 'BarChart2' },
            ],
        },
        {
            id: 'tenants', label: 'ws.sys.tenants', items: [
                { id: 'sys-tenants', path: '/admin/tenants', label: 'ws.sys.tenantMgmt', icon: 'Building' },
                { id: 'sys-users', path: '/admin/users', label: 'ws.sys.users', icon: 'Users' },
            ],
        },
        {
            id: 'access', label: 'ws.sys.access', items: [
                { id: 'sys-roles', path: '/admin/roles', label: 'ws.sys.roles', icon: 'Shield' },
                { id: 'sys-flags', path: '/admin/feature-flags', label: 'ws.sys.flags', icon: 'Flag' },
            ],
        },
        {
            id: 'platform', label: 'ws.sys.platformConfig', items: [
                { id: 'sys-health', path: '/admin/system', label: 'ws.sys.health', icon: 'Activity' },
                { id: 'sys-notifications', path: '/admin/notifications', label: 'ws.sys.notifications', icon: 'Bell' },
            ],
        },
        {
            id: 'security', label: 'ws.sys.security', items: [
                { id: 'sys-integrity', path: '/admin/integrity', label: 'ws.sys.integrity', icon: 'ShieldCheck' },
                { id: 'sys-data-quality', path: '/admin/data-quality', label: 'ws.sys.dataQuality', icon: 'Activity' },
                { id: 'sys-audit', path: '/admin/audit-logs', label: 'ws.sys.audit', icon: 'FileText' },
            ],
        },
    ],
}

// ── Registry ──
export const WORKSPACE_SIDEBARS: Record<WorkspaceType, WorkspaceSidebarConfig> = {
    federation_admin: FEDERATION_SIDEBAR,
    federation_provincial: PROVINCIAL_SIDEBAR,
    federation_discipline: DISCIPLINE_SIDEBAR,
    federation_heritage: HERITAGE_SIDEBAR,
    training_management: TRAINING_SIDEBAR,
    tournament_ops: TOURNAMENT_SIDEBAR,
    club_management: CLUB_SIDEBAR,
    referee_console: REFEREE_SIDEBAR,
    athlete_portal: ATHLETE_SIDEBAR,
    parent_portal: PARENT_SIDEBAR,
    public_spectator: PUBLIC_SIDEBAR,
    system_admin: SYSADMIN_SIDEBAR,
}

/** Get sidebar config for a workspace type */
export function getWorkspaceSidebar(type: WorkspaceType): WorkspaceSidebarConfig {
    return WORKSPACE_SIDEBARS[type]
}
