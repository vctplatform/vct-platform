'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { VCT_Sidebar } from './sidebar'
import { VCT_Provider } from '../components/vct-ui'
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

const MOBILE_BREAKPOINT = 1024

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: '99px',
        border: '1px solid var(--vct-border-subtle)',
        background: isDark ? 'rgba(34, 211, 238, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: isDark ? '#22d3ee' : '#f59e0b',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 12,
        fontFamily: 'inherit',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
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
  <div style={{ minWidth: 170 }}>
    <label
      htmlFor="vct-role-switcher"
      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}
    >
      Vai trò đăng nhập
    </label>
    <select
      id="vct-role-switcher"
      value={role}
      onChange={(event) => onChange(event.target.value as UserRole)}
      style={{
        width: '100%',
        borderRadius: 10,
        border: '1px solid var(--vct-border-subtle)',
        background: 'var(--vct-bg-elevated)',
        color: 'var(--vct-text-secondary)',
        padding: '8px 10px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
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
  <div
    style={{
      maxWidth: 680,
      margin: '80px auto 0',
      borderRadius: 20,
      border: '1px solid rgba(239, 68, 68, 0.25)',
      background: 'rgba(239, 68, 68, 0.08)',
      padding: 24,
      display: 'grid',
      gap: 12,
    }}
  >
    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#ef4444' }}>
      Không có quyền truy cập
    </h2>
    <p style={{ margin: 0, color: 'var(--vct-text-secondary)', lineHeight: 1.6 }}>
      Vai trò hiện tại không có quyền mở module này. Hãy đổi vai trò hoặc quay về
      màn hình được phân quyền.
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#ef4444',
          background: 'rgba(239, 68, 68, 0.12)',
          borderRadius: 999,
          padding: '4px 10px',
        }}
      >
        Vai trò: {USER_ROLE_OPTIONS.find((item) => item.value === role)?.label}
      </span>
      <button
        type="button"
        onClick={onBack}
        style={{
          borderRadius: 10,
          border: '1px solid var(--vct-border-subtle)',
          background: 'var(--vct-bg-elevated)',
          color: 'var(--vct-text-primary)',
          fontSize: 13,
          fontWeight: 700,
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        Về màn hình hợp lệ
      </button>
    </div>
  </div>
)

const ShellLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, setRole, canAccessRoute } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

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
    () => (canAccessCurrentRoute ? getBreadcrumbs(pathname) : ['VCT PLATFORM', 'Không có quyền']),
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

  return (
    <VCT_Provider>
      <div
        style={{
          display: 'flex',
          height: '100dvh',
          width: '100vw',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <VCT_Sidebar
          activeModule={pathname}
          onNavigate={(path: string) => {
            if (!isRouteAccessible(path, currentUser.role)) return
            router.push(path)
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={isMobile}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          role={currentUser.role}
          userName={currentUser.name}
          roleLabel={roleLabel}
        />

        {isMobile && mobileNavOpen && (
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setMobileNavOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              border: 'none',
              zIndex: 70,
              cursor: 'pointer',
            }}
          />
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            marginLeft: isMobile ? 0 : undefined,
          }}
        >
          <header
            role="banner"
            style={{
              height: isMobile ? 64 : 72,
              padding: isMobile ? '0 16px' : '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--vct-border-subtle)',
              background: 'var(--vct-bg-elevated)',
              backdropFilter: 'blur(24px)',
              zIndex: 20,
              flexShrink: 0,
              borderRadius: '0 0 16px 0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {isMobile && (
                <button
                  type="button"
                  aria-label="Mở menu điều hướng"
                  onClick={() => setMobileNavOpen(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid var(--vct-border-subtle)',
                    background: 'var(--vct-bg-elevated)',
                    color: 'var(--vct-text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <VCT_Icons.List size={18} />
                </button>
              )}

              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 16 : 22,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    color: 'var(--vct-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {pageTitle}
                </h1>
                {!isMobile && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 2,
                      color: 'var(--vct-text-tertiary)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {breadcrumbs.map((crumb, idx) => (
                      <React.Fragment key={`${crumb}-${idx}`}>
                        {idx > 0 && <span style={{ opacity: 0.5 }}>/</span>}
                        <span>{crumb}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              {!isMobile && (
                <>
                  <RoleSwitcher role={currentUser.role} onChange={setRole} />
                  <div style={{ position: 'relative', width: 240 }}>
                    <label htmlFor="global-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
                      Tìm kiếm vận động viên hoặc đơn vị
                    </label>
                    <div
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--vct-text-tertiary)',
                      }}
                    >
                      <VCT_Icons.Search size={16} />
                    </div>
                    <input
                      id="global-search"
                      type="text"
                      placeholder="Tìm kiếm VĐV, Đơn vị..."
                      style={{
                        width: '100%',
                        padding: '9px 14px 9px 36px',
                        borderRadius: '99px',
                        background: 'var(--vct-bg-elevated)',
                        border: '1px solid var(--vct-border-subtle)',
                        color: 'var(--vct-text-primary)',
                        outline: 'none',
                        fontSize: 13,
                        transition: 'border-color 0.2s ease',
                      }}
                    />
                  </div>
                </>
              )}

              <ThemeToggle />
              <button
                type="button"
                aria-label="Hoạt động hệ thống"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--vct-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <VCT_Icons.Activity size={18} />
              </button>
              <button
                type="button"
                aria-label="Tài khoản hiện tại"
                title={roleLabel}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#7e22ce',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(126, 34, 206, 0.3)',
                }}
              >
                {userInitials}
              </button>
            </div>
          </header>

          <main
            role="main"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? 16 : 24,
              position: 'relative',
            }}
            className="vct-hide-scrollbar"
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

