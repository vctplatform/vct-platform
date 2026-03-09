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
import {
  getBreadcrumbs,
  getDefaultRouteForRole,
  getPageTitle,
  isRouteAccessible,
} from './route-registry'

const MOBILE_MAX_WIDTH = 767
const TABLET_MAX_WIDTH = 1199
const PUBLIC_ROUTES = ['/login']
const SHELL_SIDEBAR_ID = 'vct-shell-sidebar'

type ViewportMode = 'mobile' | 'tablet' | 'desktop'

const getViewportMode = (width: number): ViewportMode => {
  if (width <= MOBILE_MAX_WIDTH) return 'mobile'
  if (width <= TABLET_MAX_WIDTH) return 'tablet'
  return 'desktop'
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition ${isDark
        ? 'border-cyan-400/30 bg-cyan-300/10 text-cyan-300'
        : 'border-amber-500/30 bg-amber-300/15 text-amber-700'
        }`}
    >
      {isDark ? <VCT_Icons.Moon size={16} /> : <VCT_Icons.Sun size={16} />}
      <span>{isDark ? 'Tối' : 'Sáng'}</span>
    </button>
  )
}

const RoleSwitcher = ({
  role,
  onChange,
}: {
  role: UserRole
  onChange: (next: UserRole) => void
}) => (
  <div className="min-w-[180px]">
    <label htmlFor="vct-role-switcher" className="sr-only">
      Vai trò đăng nhập
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

const AccessDenied = ({
  role,
  onBack,
}: {
  role: UserRole
  onBack: () => void
}) => (
  <div className="mx-auto mt-20 grid max-w-3xl gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
    <h2 className="m-0 text-2xl font-black text-red-500">Không có quyền truy cập</h2>
    <p className="m-0 leading-7 text-[var(--vct-text-secondary)]">
      Vai trò hiện tại không có quyền mở module này. Hãy đổi vai trò hoặc quay về
      màn hình được phân quyền.
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-extrabold text-red-500">
        Vai trò: {USER_ROLE_OPTIONS.find((item) => item.value === role)?.label}
      </span>
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg border border-vct-border bg-vct-elevated px-3 py-2 text-sm font-bold text-vct-text transition hover:bg-vct-input"
      >
        Về màn hình hợp lệ
      </button>
    </div>
  </div>
)

const ShellLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const {
    currentUser,
    setRole,
    canAccessRoute,
    isAuthenticated,
    isHydrating,
    logout,
    tournamentCode,
    operationShift,
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

  const canAccessCurrentRoute = useMemo(
    () => canAccessRoute(pathname),
    [canAccessRoute, pathname]
  )

  const breadcrumbs = useMemo(
    () =>
      canAccessCurrentRoute
        ? getBreadcrumbs(pathname)
        : [{ label: 'VCT PLATFORM', href: '/' }, { label: 'Không có quyền' }],
    [pathname, canAccessCurrentRoute]
  )

  const pageTitle = canAccessCurrentRoute
    ? getPageTitle(pathname)
    : 'KHÔNG CÓ QUYỀN TRUY CẬP'

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
            <div className="mb-2 text-lg font-black">Đang xác thực phiên làm việc</div>
            <div className="text-sm opacity-70">Vui lòng chờ trong giây lát...</div>
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
        Bỏ qua điều hướng
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
        />

        {compactNavigation && mobileNavOpen && (
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-[80] border-none bg-slate-900/50"
          />
        )}

        <div className="relative z-20 flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            role="banner"
            className={`vct-glass flex shrink-0 items-center justify-between gap-3 border-b border-vct-border shadow-[var(--vct-shadow-sm)] ${isMobile ? 'h-16 px-4' : 'h-[74px] px-6'
              }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {compactNavigation && (
                <VCT_IconButton
                  ariaLabel="Mở menu điều hướng"
                  aria-label="Mở menu điều hướng"
                  aria-controls={SHELL_SIDEBAR_ID}
                  aria-expanded={mobileNavOpen}
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  icon={<VCT_Icons.List size={18} />}
                  className="shrink-0"
                />
              )}

              <div className="min-w-0">
                <h1 className="m-0 truncate text-base font-black uppercase tracking-wide tablet:text-xl">
                  {pageTitle}
                </h1>
                {!isMobile && (
                  <div className="mt-1">
                    <VCT_Breadcrumbs items={breadcrumbs} />
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-vct-text-muted">
                      <span className="rounded-full border border-vct-border bg-vct-input px-2 py-0.5">
                        Mã giải: {tournamentCode}
                      </span>
                      <span className="rounded-full border border-vct-border bg-vct-input px-2 py-0.5">
                        Ca: {operationShift}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 tablet:gap-3">
              {isDesktop && (
                <>
                  <RoleSwitcher role={currentUser.role} onChange={setRole} />
                  <div className="relative w-64">
                    <label htmlFor="global-search" className="sr-only">
                      Tìm kiếm vận động viên hoặc đơn vị
                    </label>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted">
                      <VCT_Icons.Search size={16} />
                    </span>
                    <input
                      id="global-search"
                      type="text"
                      placeholder="Tìm kiếm VĐV, Đơn vị..."
                      className="w-full rounded-full border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm text-vct-text outline-none transition focus:border-vct-accent"
                    />
                  </div>
                </>
              )}

              <ThemeToggle />

              <NotificationCenter />

              <VCT_Dropdown
                trigger={
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-700 to-emerald-700 text-xs font-black text-white shadow-md"
                    title={roleLabel}
                  >
                    {userInitials}
                  </span>
                }
                items={[
                  { label: `${currentUser.name} (${roleLabel})`, icon: <VCT_Icons.User size={16} />, onClick: () => { } },
                  { label: 'Cài đặt', icon: <VCT_Icons.Settings size={16} />, onClick: () => { } },
                  {
                    label: 'Đăng xuất',
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
  <ThemeProvider>
    <AuthProvider>
      <ShellLayout>{children}</ShellLayout>
    </AuthProvider>
  </ThemeProvider>
)
