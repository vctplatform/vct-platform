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
  getPageTitle,
  getSidebarGroups,
  isRouteAccessible,
} from './route-registry'
import { getFilteredSidebar } from './workspace-resolver'
import { WORKSPACE_META } from './workspace-types'

const MOBILE_MAX_WIDTH = 767
const TABLET_MAX_WIDTH = 1199
const PUBLIC_ROUTES = ['/login', '/portal', '/register', '/forgot-password']
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition hover:scale-105 ${isDark
        ? 'border-cyan-400/25 bg-cyan-300/10 text-cyan-300 hover:bg-cyan-300/20'
        : 'border-amber-500/25 bg-amber-100/60 text-amber-600 hover:bg-amber-200/60'
        }`}
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
      className="inline-flex h-9 items-center gap-0 overflow-hidden rounded-full border border-emerald-500/25 text-xs font-extrabold transition hover:border-emerald-400/40"
    >
      <span
        className={`px-2 py-1.5 transition-all ${lang === 'vi' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400'}`}
      >
        VI
      </span>
      <span
        className={`px-2 py-1.5 transition-all ${lang === 'en' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400'}`}
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
        className="w-full cursor-pointer rounded-lg border border-vct-border bg-vct-elevated px-2.5 py-2 text-xs font-bold text-[var(--vct-text-secondary)]"
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
      <p className="m-0 leading-7 text-[var(--vct-text-secondary)]">
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
            { label: activeWorkspace.scopeName },
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
        <div className="grid min-h-dvh place-items-center bg-vct-bg text-[var(--vct-text-secondary)]">
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
          workspaceLabel={activeWorkspace?.scopeName}
        />

        {compactNavigation && mobileNavOpen && (
          <button
            type="button"
            aria-label={t('shell.closeMobileMenu')}
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-[80] border-none bg-slate-900/50"
          />
        )}

        <div className="relative z-20 flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            role="banner"
            className={`vct-glass flex shrink-0 items-center justify-between border-b border-vct-border shadow-[var(--vct-shadow-sm)] ${isMobile ? 'h-14 gap-2 px-4' : 'h-14 gap-4 px-6'}`}
          >
            {/* ── Left: mobile hamburger + breadcrumbs ── */}
            <div className="flex min-w-0 items-center gap-3">
              {compactNavigation && (
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
                <span className="truncate text-sm font-bold">{pageTitle}</span>
              )}
            </div>

            {/* ── Right: search, controls, avatar ── */}
            <div className="flex shrink-0 items-center gap-2">
              {isDesktop && (
                <div className="relative w-56">
                  <label htmlFor="global-search" className="sr-only">
                    {t('shell.searchLabel')}
                  </label>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted">
                    <VCT_Icons.Search size={14} />
                  </span>
                  <input
                    id="global-search"
                    type="text"
                    placeholder={t('shell.searchPlaceholder')}
                    className="w-full rounded-full border border-vct-border bg-vct-elevated py-1.5 pl-8 pr-3 text-xs text-vct-text outline-none transition placeholder:text-vct-text-muted focus:border-vct-accent"
                  />
                </div>
              )}

              <LangToggle />
              <ThemeToggle />
              <NotificationCenter />

              <VCT_Dropdown
                trigger={
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-emerald-700 text-[11px] font-black text-white shadow-md cursor-pointer transition hover:scale-105"
                    title={`${currentUser.name} — ${roleLabel}`}
                  >
                    {userInitials}
                  </span>
                }
                items={[
                  { label: `${currentUser.name} (${roleLabel})`, icon: <VCT_Icons.User size={16} />, onClick: () => { router.push('/profile') } },
                  { label: t('shell.notifications'), icon: <VCT_Icons.Bell size={16} />, onClick: () => { router.push('/notifications') } },
                  { label: t('shell.portalHub'), icon: <VCT_Icons.LayoutGrid size={16} />, onClick: () => { router.push('/portal') } },
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
