'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VCT_Sidebar } from './sidebar'
import { VCT_Breadcrumbs } from './Breadcrumbs'
import { VCT_IconButton, VCT_Provider } from '@vct/ui'
import { VCT_Dropdown } from '@vct/ui'
import { VCT_CommandPalette } from '../components/VCT_CommandPalette'
import { VCT_ShortcutsPanel } from '@vct/ui'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { VCT_Icons } from '@vct/ui'
import { ThemeProvider, useTheme } from '../theme/ThemeProvider'
import { AuthProvider, useAuth } from '../auth/AuthProvider'
import { type UserRole, USER_ROLE_OPTIONS } from '../auth/types'
import { useI18n, I18nProvider } from '../i18n'
import {
  getBreadcrumbs,
  getDefaultRouteForRole,
  getSidebarGroups,
  isRouteAccessible,
  getPageTitle,
} from './route-registry'
import { getFilteredSidebar, resolveWorkspacesForUser } from './workspace-resolver'
import { WORKSPACE_META } from './workspace-types'
import type { WorkspaceCard } from './workspace-types'
import { useWorkspaceStore, generateWorkspaceCards } from './workspace-store'
import { UI_Logo } from '@vct/ui'


const MOBILE_MAX_WIDTH = 767
const TABLET_MAX_WIDTH = 1199
const PUBLIC_ROUTES = ['/login', '/portal', '/register', '/forgot-password', '/public']
const PORTAL_ROUTES = ['/']
const SHELL_SIDEBAR_ID = 'vct-shell-sidebar'

type ViewportMode = 'mobile' | 'tablet' | 'desktop'
type ShellNavItem = { path: string; label: string; icon: string }
type ShellNavGroup = { id: string; label: string; items: ShellNavItem[] }

const getViewportMode = (width: number): ViewportMode => {
  if (width <= MOBILE_MAX_WIDTH) return 'mobile'
  if (width <= TABLET_MAX_WIDTH) return 'tablet'
  return 'desktop'
}

const matchesNavPath = (currentPath: string, itemPath: string) => {
  if (itemPath === '/') return currentPath === '/'
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

const findCurrentNavMatch = (
  groups: ShellNavGroup[],
  currentPath: string
) => {
  let currentGroup: ShellNavGroup | null = null
  let currentItem: ShellNavItem | null = null

  for (const group of groups) {
    for (const item of group.items) {
      if (!matchesNavPath(currentPath, item.path)) continue
      if (!currentItem || item.path.length > currentItem.path.length) {
        currentGroup = group
        currentItem = item
      }
    }
  }

  if (!currentGroup || !currentItem) return null

  return { group: currentGroup, item: currentItem }
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? t('shell.toLight') : t('shell.toDark')}
      onClick={toggleTheme}
      title={isDark ? t('shell.toLight') : t('shell.toDark')}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-vct-text-muted transition-all duration-200 hover:bg-white/8 hover:text-vct-text active:scale-95"
    >
      {isDark ? <VCT_Icons.Moon size={15} /> : <VCT_Icons.Sun size={15} />}
    </button>
  )
}

const LangToggle = () => {
  const { lang, setLang, t } = useI18n()

  return (
    <button
      type="button"
      aria-label={t('shell.toggleLang')}
      onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
      title={t('shell.toggleLang')}
      className="relative inline-flex h-8 items-center gap-0.5 rounded-lg p-0.5 text-[10px] font-extrabold tracking-wider transition-all duration-200 hover:bg-white/8 active:scale-95"
    >
      <span
        className={`flex h-full items-center justify-center rounded-md px-1.5 transition-all duration-200 ${lang === 'vi' ? 'bg-vct-accent/20 text-vct-accent shadow-sm shadow-vct-accent/10' : 'text-vct-text-muted'}`}
      >
        VI
      </span>
      <span
        className={`flex h-full items-center justify-center rounded-md px-1.5 transition-all duration-200 ${lang === 'en' ? 'bg-vct-accent/20 text-vct-accent shadow-sm shadow-vct-accent/10' : 'text-vct-text-muted'}`}
      >
        EN
      </span>
    </button>
  )
}

const RoleSwitcher = ({
  role,
  onChange,
}: {
  role: UserRole
  onChange: (next: UserRole) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="min-w-[180px]">
      <label htmlFor="vct-role-switcher" className="sr-only">
        {t('shell.loginRole')}
      </label>
      <select
        id="vct-role-switcher"
        value={role}
        onChange={(event) => onChange(event.target.value as UserRole)}
        className="w-full cursor-pointer rounded-lg border border-vct-border bg-vct-elevated px-2.5 py-2 text-xs font-bold text-(--vct-text-secondary)"
      >
        {USER_ROLE_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const AccessDenied = ({
  role,
  onBack,
}: {
  role: UserRole
  onBack: () => void
}) => {
  const { t } = useI18n()
  return (
    <div className="mx-auto mt-20 grid max-w-3xl gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
      <h2 className="m-0 text-2xl font-black text-red-500">{t('shell.accessDeniedTitle')}</h2>
      <p className="m-0 leading-7 text-(--vct-text-secondary)">
        {t('shell.accessDeniedDesc')}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-extrabold text-red-500">
          {t('shell.accessDeniedRole')}: {USER_ROLE_OPTIONS.find((item) => item.value === role)?.label}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-vct-border bg-vct-elevated px-3 py-2 text-sm font-bold text-vct-text transition hover:bg-vct-input"
        >
          {t('shell.accessDeniedBack')}
        </button>
      </div>
    </div>
  )
}

function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = useWorkspaceStore()
  
  return (
    <button
      type="button"
      aria-label="Toggle Privacy Mode"
      onClick={togglePrivacyMode}
      title="Toggle Privacy Mode"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/8 active:scale-95 ${isPrivacyMode ? 'text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}
    >
      {isPrivacyMode ? <VCT_Icons.EyeOff size={15} /> : <VCT_Icons.Eye size={15} />}
    </button>
  )
}

const ShellLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const {
    currentUser,
    setRole,
    canAccessRoute,
    isAuthenticated,
    isHydrating,
    logout,
    activeWorkspace,
    setActiveWorkspace,
  } = useAuth()
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // Notification badge count (mock — will be replaced with real API later)
  const notifCount = 2

  const compactNavigation = viewportMode !== 'desktop'
  const isDesktop = viewportMode === 'desktop'
  const isMobile = viewportMode === 'mobile'

  const isPublicRoute = useMemo(
    () =>
      PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname?.startsWith(`${route}/`)
      ),
    [pathname]
  )

  const isPortalRoute = useMemo(
    () => PORTAL_ROUTES.includes(pathname),
    [pathname]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setViewportMode(getViewportMode(window.innerWidth))
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isHydrating || isPublicRoute) return
    if (isAuthenticated) return
    const redirectPath =
      pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''
    router.replace(`/login${redirectPath}`)
  }, [isAuthenticated, isHydrating, isPublicRoute, pathname, router])

  const roleLabel = useMemo(
    () =>
      USER_ROLE_OPTIONS.find((item) => item.value === currentUser.role)?.label ??
      currentUser.role,
    [currentUser.role]
  )

  const navigationGroups = useMemo<ShellNavGroup[]>(() => {
    if (activeWorkspace) {
      const filtered = getFilteredSidebar(activeWorkspace.type, currentUser).groups
      if (filtered.length > 0) return filtered
    }
    return getSidebarGroups(currentUser.role)
  }, [activeWorkspace, currentUser])

  const userWorkspaceCards = useMemo(
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

  const handleSwitchWorkspace = React.useCallback(
    (ws: WorkspaceCard) => {
      // Convert WorkspaceCard → WorkspaceAccess for auth context
      setActiveWorkspace({
        type: ws.type,
        scopeId: ws.scope.id,
        scopeName: ws.scope.name,
        role: currentUser.role,
      })
      // Navigate to workspace dashboard
      const dashboardPaths: Record<string, string> = {
        system_admin: '/admin',
        federation_admin: '/dashboard',
        tournament_ops: '/giai-dau',
        club_management: '/club',
        referee_console: '/referee-scoring',
        athlete_portal: '/athlete-portal',
        parent_portal: '/parent',
        public_spectator: '/scoreboard',
        federation_provincial: '/provincial',
        federation_discipline: '/discipline/dashboard',
      }
      router.push(dashboardPaths[ws.type] ?? '/dashboard')
    },
    [setActiveWorkspace, router]
  )

  const currentNavMatch = useMemo(
    () => findCurrentNavMatch(navigationGroups, pathname),
    [navigationGroups, pathname]
  )

  const currentWorkspaceMeta = useMemo(
    () => (activeWorkspace ? WORKSPACE_META[activeWorkspace.type] : null),
    [activeWorkspace]
  )

  const canAccessCurrentRoute = useMemo(
    () => canAccessRoute(pathname),
    [canAccessRoute, pathname]
  )

  const breadcrumbs = useMemo(
    () => {
      if (!canAccessCurrentRoute) {
        return [{ label: 'VCT PLATFORM', href: '/' }, { label: t('shell.noPermission') }]
      }

      if (currentNavMatch) {
        const items = activeWorkspace
          ? [
            { label: t('shell.portalHub'), href: '/portal' },
            { label: t(activeWorkspace.scopeName) },
          ]
          : [{ label: 'VCT PLATFORM', href: '/' }]

        const groupLabel = t(currentNavMatch.group.label)
        const itemLabel = t(currentNavMatch.item.label)
        // Avoid duplicate breadcrumb when group and item translate to the same text
        if (groupLabel !== itemLabel) {
          items.push({ label: groupLabel })
        }
        items.push({ label: itemLabel })
        return items
      }

      const raw = getBreadcrumbs(pathname).map((b) => ({ ...b, label: t(b.label) }))
      // Deduplicate consecutive breadcrumb items with same translated label
      return raw.filter((item, idx) => idx === 0 || item.label !== raw[idx - 1]!.label)
    },
    [pathname, canAccessCurrentRoute, currentNavMatch, activeWorkspace, t]
  )

  const pageTitle = canAccessCurrentRoute
    ? currentNavMatch
      ? t(currentNavMatch.item.label)
      : t(getPageTitle(pathname))
    : t('shell.accessDeniedTitle').toUpperCase()

  const userInitials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  if (isPublicRoute) {
    return <>{children}</>
  }

  if (isHydrating || !isAuthenticated) {
    return (
      <VCT_Provider>
        <div className="grid min-h-dvh place-items-center bg-vct-bg text-(--vct-text-secondary)">
          <div className="w-full max-w-md px-6 text-center">
            <div className="mx-auto mb-6 h-12 w-12 rounded-2xl vct-skeleton" />
            <div className="mb-2 text-lg font-black">{t('shell.authenticating')}</div>
            <div className="text-sm opacity-70">{t('shell.pleaseWait')}</div>
            <div className="mt-8 space-y-3">
              <div className="h-10 w-full vct-skeleton" />
              <div className="flex gap-3">
                <div className="h-10 flex-1 vct-skeleton" />
                <div className="h-10 flex-1 vct-skeleton" />
              </div>
              <div className="h-10 w-3/4 vct-skeleton" />
            </div>
          </div>
        </div>
      </VCT_Provider>
    )
  }

  // ── Helper: render header bar (shared between portal & workspace layouts) ──
  const renderHeader = (showHamburger: boolean) => (
    <header
      role="banner"
      className={`relative z-50 flex shrink-0 items-center justify-between backdrop-blur-xl bg-vct-bg/80 border-b border-white/6 ${isMobile ? 'h-14 gap-2 px-4' : 'h-14 gap-4 px-5'}`}
    >
      {/* ── Accent bottom glow line ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-vct-accent/20 to-transparent" />

      {/* ── Left: mobile hamburger + logo/breadcrumbs ── */}
      <div className="flex min-w-0 items-center gap-3">
        {showHamburger && compactNavigation && (
          <button
            type="button"
            aria-label={t('shell.openMobileNav')}
            aria-controls={SHELL_SIDEBAR_ID}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-vct-text-muted transition-all duration-200 hover:bg-white/8 hover:text-vct-text active:scale-95"
          >
            <VCT_Icons.List size={18} />
          </button>
        )}

        {isPortalRoute ? (
          <div className="flex items-center gap-2.5 px-1">
            <UI_Logo size={22} />
            <span className="hidden text-[11px] font-black tracking-[0.2em] text-vct-accent sm:block">
              VCT PLATFORM
            </span>
          </div>
        ) : (
          <>
            {!isMobile && (
              <VCT_Breadcrumbs items={breadcrumbs} />
            )}
            {isMobile && (
              <VCT_Breadcrumbs items={breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs} className="max-w-[200px]" />
            )}
          </>
        )}
      </div>

      {/* ── Right: search + grouped controls + notification + avatar ── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search pill */}
        {isDesktop && (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="group flex h-9 w-56 items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 text-xs text-vct-text-muted transition-all duration-200 hover:border-vct-accent/30 hover:bg-white/6 hover:text-vct-text focus:outline-none"
          >
            <VCT_Icons.Search size={13} className="shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" />
            <span className="flex-1 truncate text-left">{t('shell.searchPlaceholder')}</span>
            <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-vct-text-muted/60">⌘K</kbd>
          </button>
        )}

        {/* ── Glass divider ── */}
        {isDesktop && (
          <div className="mx-1 h-5 w-px bg-white/8" />
        )}

        {/* ── Control capsule: Lang + Theme ── */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/6 bg-white/3 p-1">
          <LangToggle />
          {/* Internal divider */}
          <div className="h-4 w-px bg-white/8" />
          <ThemeToggle />
        </div>

        {/* ── Glass divider ── */}
        <div className="mx-0.5 h-5 w-px bg-white/8" />

        {/* ── Notification bell with badge ── */}
        <button
          type="button"
          aria-label={t('shell.notifications')}
          onClick={() => setIsNotifOpen(true)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-vct-text-muted transition-all duration-200 hover:bg-white/8 hover:text-vct-text active:scale-95"
        >
          <VCT_Icons.Bell size={16} />
          {/* Notification badge — dynamic count */}
          {notifCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-lg shadow-red-500/30 animate-pulse">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* ── User avatar with online dot ── */}
        <VCT_Dropdown
          trigger={
            <span className="relative">
              <span
                className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[11px] font-black text-white ring-1 ring-white/10 transition-all duration-200 hover:ring-vct-accent/50 hover:scale-105 active:scale-95 ${currentWorkspaceMeta
                  ? `bg-linear-to-br ${currentWorkspaceMeta.gradient}`
                  : 'bg-linear-to-br from-red-700 to-emerald-700'
                  }`}
                title={`${currentUser.name} — ${roleLabel}`}
              >
                {userInitials}
              </span>
              {/* Online status dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-vct-bg bg-emerald-500 shadow-sm shadow-emerald-500/40" />
            </span>
          }
          items={[
            { label: `${currentUser.name} (${roleLabel})`, icon: <VCT_Icons.User size={16} />, onClick: () => { router.push('/profile') } },
            { label: t('shell.notifications'), icon: <VCT_Icons.Bell size={16} />, onClick: () => { router.push('/notifications') } },
            { label: t('shell.portalHub'), icon: <VCT_Icons.LayoutGrid size={16} />, onClick: () => { router.push('/') } },
            { label: t('shell.settings'), icon: <VCT_Icons.Settings size={16} />, onClick: () => { router.push('/settings') } },
            {
              label: t('shell.logout'),
              icon: <VCT_Icons.LogOut size={16} />,
              danger: true,
              onClick: () => { void logout().then(() => { router.replace('/login') }) },
            },
          ]}
        />
      </div>
    </header>
  )

  // ── Portal route: no sidebar ──
  if (isPortalRoute) {
    return (
      <VCT_Provider>
        <a href="#vct-main-content" className="vct-skip-link">
          {t('shell.skipNav')}
        </a>
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-vct-bg text-vct-text">
          {renderHeader(false)}
          <main
            id="vct-main-content"
            role="main"
            className="vct-hide-scrollbar flex-1 overflow-y-auto"
          >
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
        <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        <VCT_CommandPalette />
        <VCT_ShortcutsPanel />
      </VCT_Provider>
    )
  }

  // ── Normal workspace route: sidebar + header + main ──
  return (
    <VCT_Provider>
      <a href="#vct-main-content" className="vct-skip-link">
        {t('shell.skipNav')}
      </a>

      <div className="relative flex h-dvh w-full overflow-hidden bg-vct-bg text-vct-text">
        <VCT_Sidebar
          id={SHELL_SIDEBAR_ID}
          activeModule={pathname}
          onNavigate={(path: string) => {
            if (!isRouteAccessible(path, currentUser.role)) return
            router.push(path)
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={compactNavigation}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          role={currentUser.role}
          userName={currentUser.name}
          roleLabel={roleLabel}
          navGroups={navigationGroups}
          workspaceLabel={activeWorkspace ? t(activeWorkspace.scopeName) : undefined}
          workspaces={userWorkspaceCards}
          currentWorkspaceType={activeWorkspace?.type}
          onSwitchWorkspace={handleSwitchWorkspace}
        />

        {compactNavigation && mobileNavOpen && (
          <button
            type="button"
            aria-label={t('shell.closeMobileMenu')}
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z- border-none bg-slate-900/50"
          />
        )}

        <div className="relative z-20 flex min-w-0 flex-1 flex-col overflow-hidden">
          {renderHeader(true)}

          <main
            id="vct-main-content"
            role="main"
            className={`vct-hide-scrollbar flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}
          >
            {canAccessCurrentRoute ? (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            ) : (
              <AccessDenied
                role={currentUser.role}
                onBack={() => router.push(getDefaultRouteForRole(currentUser.role))}
              />
            )}
          </main>
        </div>
      </div>
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <VCT_CommandPalette />
      <VCT_ShortcutsPanel />
    </VCT_Provider>
  )
}

export const VCT_AppShell = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>
    <ThemeProvider>
      <AuthProvider>
        <ShellLayout>{children}</ShellLayout>
      </AuthProvider>
    </ThemeProvider>
  </I18nProvider>
)
