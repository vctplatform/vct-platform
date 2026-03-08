'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UI_Logo } from '../components/ui-logo'
import { VCT_Icons } from '../components/vct-icons'
import { getSidebarGroups } from './route-registry'
import type { UserRole } from '../auth/types'

interface SidebarProps {
  activeModule: string
  onNavigate: (path: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobile: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  role: UserRole
  userName: string
  roleLabel: string
}

export const VCT_Sidebar = ({
  activeModule,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onCloseMobile,
  role,
  userName,
  roleLabel,
}: SidebarProps) => {
  const groups = getSidebarGroups(role)
  const sidebarWidth = isCollapsed ? 80 : 260
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  return (
    <motion.aside
      aria-label="Điều hướng chính"
      animate={isMobile ? { x: mobileOpen ? 0 : -320 } : { width: sidebarWidth }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: isMobile ? 280 : sidebarWidth,
        height: '100dvh',
        background: 'var(--vct-bg-glass-heavy)',
        borderRight: '1px solid var(--vct-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: 80,
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: isMobile ? '0 10px 30px rgba(2, 6, 23, 0.25)' : 'none',
      }}
    >
      {!isMobile && (
        <button
          aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            right: -12,
            top: 32,
            zIndex: 60,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--vct-bg-elevated)',
            border: '1px solid var(--vct-border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--vct-text-secondary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
            <VCT_Icons.ChevronLeft size={14} />
          </motion.div>
        </button>
      )}

      <div
        style={{
          padding: isCollapsed && !isMobile ? '24px 8px' : '22px 16px',
          display: 'flex',
          justifyContent: 'center',
          borderBottom: '1px solid var(--vct-border-subtle)',
          position: 'relative',
        }}
      >
        {isMobile && (
          <button
            aria-label="Đóng điều hướng"
            onClick={onCloseMobile}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid var(--vct-border-subtle)',
              background: 'var(--vct-bg-elevated)',
              color: 'var(--vct-text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <VCT_Icons.x size={14} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {!isCollapsed || isMobile ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              <UI_Logo size={36} />
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'var(--vct-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  lineHeight: 1.4,
                  marginTop: 4,
                }}
              >
                Nền tảng quản trị võ thuật toàn diện
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              <UI_Logo size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav
        aria-label="Danh mục chức năng"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 0',
        }}
        className="vct-hide-scrollbar"
      >
        {groups.map((group) => (
          <div key={group.id} style={{ marginBottom: 24 }}>
            {(!isCollapsed || isMobile) && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--vct-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0 24px',
                  marginBottom: 8,
                }}
              >
                {group.label}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
              {group.items.map((item) => {
                const isActive = activeModule === item.path
                const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
                const IconComponent = iconMap[item.icon] ?? VCT_Icons.Activity

                return (
                  <button
                    key={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    onClick={() => {
                      onNavigate(item.path)
                      if (isMobile) onCloseMobile()
                    }}
                    title={isCollapsed && !isMobile ? item.label : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: isCollapsed && !isMobile ? '12px' : '10px 16px',
                      justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'var(--vct-accent-cyan)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--vct-text-secondary)',
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      fontFamily: 'inherit',
                      boxShadow: isActive ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none',
                    }}
                  >
                    <IconComponent
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? '#fff' : 'currentColor'}
                    />

                    <AnimatePresence>
                      {(!isCollapsed || isMobile) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid var(--vct-border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 8,
            borderRadius: 12,
            background: 'var(--vct-bg-input)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {(!isCollapsed || isMobile) && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--vct-text-primary)' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--vct-text-tertiary)' }}>{roleLabel}</div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
