'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UI_Logo } from '../components/ui-logo'
import { VCT_Tooltip } from '../components/VCT_Tooltip'
import { VCT_IconButton } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { getSidebarGroups } from './route-registry'
import { useI18n } from '../i18n'
import type { UserRole } from '../auth/types'

interface SidebarNavItem {
  path: string
  label: string
  icon: string
}

interface SidebarNavGroup {
  id: string
  label: string
  items: SidebarNavItem[]
}

interface SidebarProps {
  id?: string
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
  navGroups?: SidebarNavGroup[]
  workspaceLabel?: string
}

const isItemActive = (currentPath: string, itemPath: string) => {
  if (itemPath === '/') return currentPath === '/'
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export const VCT_Sidebar = ({
  id,
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
  navGroups,
  workspaceLabel,
}: SidebarProps) => {
  const { t } = useI18n()
  const groups = navGroups ?? getSidebarGroups(role)
  const sidebarWidth = isCollapsed ? 88 : 272
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  const compactMode = isMobile

  return (
    <motion.aside
      id={id}
      aria-label={t('shell.mainNav')}
      animate={compactMode ? { x: mobileOpen ? 0 : -340 } : { width: sidebarWidth }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className={`${compactMode ? 'fixed inset-y-0 left-0 z-[90]' : 'relative z-30'
        } flex h-dvh shrink-0 flex-col overflow-hidden border-r border-vct-border bg-[var(--vct-bg-glass-heavy)]`}
      style={{
        width: compactMode ? 304 : sidebarWidth,
        boxShadow: compactMode ? '0 20px 40px rgba(2, 6, 23, 0.3)' : 'none',
      }}
    >
      {!compactMode && (
        <VCT_IconButton
          ariaLabel={isCollapsed ? t('shell.sidebarExpand') : t('shell.sidebarCollapse')}
          onClick={onToggleCollapse}
          size="sm"
          icon={
            <motion.span animate={{ rotate: isCollapsed ? 180 : 0 }}>
              <VCT_Icons.ChevronLeft size={14} />
            </motion.span>
          }
          className="absolute -right-3 top-8 z-[60] rounded-full shadow-md"
        />
      )}

      <div
        className={`relative flex justify-center border-b border-vct-border ${isCollapsed && !compactMode ? 'px-2 py-5' : 'px-4 py-5'
          }`}
      >
        {compactMode && (
          <VCT_IconButton
            ariaLabel={t('shell.closeMobileNav')}
            onClick={onCloseMobile}
            size="sm"
            icon={<VCT_Icons.x size={14} />}
            className="absolute right-3 top-3 rounded-full"
          />
        )}

        <AnimatePresence mode="wait">
          {!isCollapsed || compactMode ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center"
            >
              <div className="inline-flex flex-col items-center">
                <UI_Logo size={36} />
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-vct-text-muted">
                  {t('shell.platformSubtitle')}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex justify-center"
            >
              <UI_Logo size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {workspaceLabel && (!isCollapsed || compactMode) && (
        <div className="border-b border-vct-border px-4 py-3">
            <div className="rounded-xl border border-vct-border bg-vct-input px-3 py-2">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">
                {t('shell.currentWorkspace')}
              </div>
              <div className="mt-1 truncate text-sm font-bold text-vct-text">
                {workspaceLabel}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label={t('shell.navCategories')}
        className="vct-hide-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-0 py-4"
      >
        {groups.map((group) => (
          <div key={group.id} className="mb-6">
            {(!isCollapsed || compactMode) && (
              <h2 className="mb-2 px-6 text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">
                {t(group.label)}
              </h2>
            )}

            <div className="flex flex-col gap-1 px-3">
              {group.items.map((item) => {
                const isActive = isItemActive(activeModule, item.path)
                const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
                const IconComponent = iconMap[item.icon] ?? VCT_Icons.Activity
                const showTooltip = isCollapsed && !compactMode
                const translatedLabel = t(item.label)

                const btn = (
                  <button
                    key={item.path}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={translatedLabel}
                    onClick={() => {
                      onNavigate(item.path)
                      if (compactMode) onCloseMobile()
                    }}
                    className={`group inline-flex w-full items-center rounded-xl border border-transparent transition ${isCollapsed && !compactMode
                      ? 'justify-center px-3 py-3'
                      : 'justify-start px-4 py-2.5'
                      } ${isActive
                        ? 'bg-vct-accent text-white shadow-[0_6px_16px_rgba(14,165,233,0.3)]'
                        : 'text-[var(--vct-text-secondary)] hover:border-vct-border hover:bg-vct-elevated'
                      }`}
                  >
                    <IconComponent
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? '#fff' : 'currentColor'}
                    />
                    <AnimatePresence>
                      {(!isCollapsed || compactMode) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="ml-3 overflow-hidden whitespace-nowrap text-sm font-semibold"
                        >
                          {translatedLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )

                return showTooltip ? (
                  <VCT_Tooltip key={item.path} content={translatedLabel} position="right" delay={200}>
                    {btn}
                  </VCT_Tooltip>
                ) : (
                  <React.Fragment key={item.path}>{btn}</React.Fragment>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-vct-border p-4">
        <div className="flex items-center gap-3 rounded-xl border border-vct-border bg-vct-input px-2 py-2">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
            {initials}
          </div>
          {(!isCollapsed || compactMode) && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-vct-text">{userName}</div>
              <div className="truncate text-[11px] text-vct-text-muted">{roleLabel}</div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
