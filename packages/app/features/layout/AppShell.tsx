'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VCT_Sidebar } from './sidebar'
import { VCT_Breadcrumbs } from './Breadcrumbs'
import { VCT_IconButton, VCT_Provider } from '../components/vct-ui'
import { VCT_Dropdown } from '../components/VCT_Dropdown'
import { VCT_CommandPalette } from '../components/VCT_CommandPalette'
import { VCT_ShortcutsPanel } from '../components/VCT_ShortcutsPanel'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { VCT_Icons } from '../components/vct-icons'
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-vct-border bg-vct-elevated text-vct-text-muted transition hover:border-vct-accent hover:text-vct-text"
    >
      {isDark ? <VCT_Icons.Moon size={16} /> : <VCT_Icons.Sun size={16} />}
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
      className="inline-flex h-9 items-center rounded-full border border-vct-border bg-vct-elevated p-0.5 text-[11px] font-bold transition hover:border-vct-accent"
    >
      <span
        className={`flex h-full min-w-[32px] items-center justify-center rounded-full px-2 transition-colors ${lang === 'vi' ? 'bg-vct-accent/15 text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}
      >
        VI
      </span>
      <span
        className={`flex h-full min-w-[32px] items-center justify-center rounded-full px-2 transition-colors ${lang === 'en' ? 'bg-vct-accent/15 text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}
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

  const userWorkspaces = useMemo(
    () => resolveWorkspacesForUser(currentUser),
    [currentUser]
  )

  const handleSwitchWorkspace = React.useCallback(
    (ws: typeof userWorkspaces[number]) => {
      setActiveWorkspace(ws)
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
      className={`relative z-50 vct-glass flex shrink-0 items-center justify-between border-b border-vct-border shadow-(--vct-shadow-sm) ${isMobile ? 'h-14 gap-2 px-4' : 'h-14 gap-4 px-6'}`}
    >
      {/* ── Left: mobile hamburger + breadcrumbs ── */}
      <div className="flex min-w-0 items-center gap-3">
        {showHamburger && compactNavigation && (
          <VCT_IconButton
            ariaLabel={t('shell.openMobileNav')}
            aria-label={t('shell.openMobileNav')}
            aria-controls={SHELL_SIDEBAR_ID}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((prev) => !prev)}
            icon={<VCT_Icons.List size={18} />}
            className="shrink-0"
          />
        )}

        {!isMobile && (
          <VCT_Breadcrumbs items={breadcrumbs} />
        )}
        {isMobile && (
          <VCT_Breadcrumbs items={breadcrumbs.length > 2 ? breadcrumbs.slice(-2) : breadcrumbs} className="max-w-[200px]" />
        )}
      </div>

      {/* ── Right: search, controls, avatar ── */}
      <div className="flex shrink-0 items-center gap-2">
        {isDesktop && (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="group flex h-9 w-64 items-center gap-2 overflow-hidden rounded-full border border-vct-border bg-vct-elevated px-3 text-xs text-vct-text-muted transition hover:border-vct-accent hover:text-vct-text"
          >
            <VCT_Icons.Search size={14} className="shrink-0" />
            <span className="flex-1 truncate text-left">{t('shell.searchPlaceholder')}</span>
            <kbd className="shrink-0 rounded border border-vct-border bg-vct-input px-1.5 py-0.5 text-[10px] font-bold text-vct-text-muted">⌘K</kbd>
          </button>
        )}

        <LangToggle />
        <ThemeToggle />
        <NotificationCenter />

        <VCT_Dropdown
          trigger={
            <span
              className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xs font-black text-white shadow-sm ring-1 ring-vct-border transition hover:ring-vct-accent ${currentWorkspaceMeta
                ? `bg-gradient-to-br ${currentWorkspaceMeta.gradient}`
                : 'bg-gradient-to-br from-red-700 to-emerald-700'
                }`}
              title={`${currentUser.name} — ${roleLabel}`}
            >
              {userInitials}
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

  // ── Portal route: full-screen, NO sidebar, NO shell header ──
  // Portal Hub has its own header/layout, so we just pass children through.
  if (isPortalRoute) {
    return (
      <VCT_Provider>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="h-dvh w-full overflow-y-auto"
        >
          {children}
        </motion.div>
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
          workspaces={userWorkspaces}
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
