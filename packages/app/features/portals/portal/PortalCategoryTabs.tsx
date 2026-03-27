import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import type { WorkspaceCategory } from '../../layout/workspace-types'
import { WORKSPACE_CATEGORIES } from '../../layout/workspace-types'
import { useI18n } from '../../i18n'

interface PortalCategoryTabsProps {
    activeCategory: WorkspaceCategory | null
    onSelectCategory: (cat: WorkspaceCategory | null) => void
    categoryCounts: Record<WorkspaceCategory, number>
}

export function PortalCategoryTabs({
    activeCategory,
    onSelectCategory,
    categoryCounts,
}: PortalCategoryTabsProps) {
    const { t } = useI18n()
    const containerRef = useRef<HTMLDivElement>(null)

    const sortedCategories = Object.entries(WORKSPACE_CATEGORIES)
        .sort(([, a], [, b]) => a.order - b.order) as [WorkspaceCategory, typeof WORKSPACE_CATEGORIES[WorkspaceCategory]][]

    // Keyboard navigation for ARIA tablist
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault()
            const tabs = Array.from(containerRef.current?.querySelectorAll('[role="tab"]') || []) as HTMLButtonElement[]
            if (tabs.length === 0) return
            const currentIndex = tabs.findIndex(tab => tab === document.activeElement)
            const current = currentIndex === -1 ? 0 : currentIndex
            let nextIndex = current
            if (e.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length
            else if (e.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length
            tabs[nextIndex]?.focus()
        }
    }

    const totalCount = Object.values(categoryCounts).reduce((sum, c) => sum + c, 0)

    return (
        <div className="w-full">
            <div
                ref={containerRef}
                role="tablist"
                aria-label={t('portal.allCategories') || 'Workspace Categories'}
                onKeyDown={handleKeyDown}
                className="hide-scrollbar flex w-full items-center gap-1.5 overflow-x-auto py-1"
            >
                {/* ── "All" Tab ── */}
                <TabButton
                    isActive={activeCategory === null}
                    onClick={() => onSelectCategory(null)}
                    icon={<VCT_Icons.LayoutGrid size={15} />}
                    label={t('portal.allCategories') || 'Tất cả'}
                    count={totalCount}
                    accentColor="rgb(139, 92, 246)"
                    glowColor="rgba(139, 92, 246, 0.25)"
                />

                {/* ── Dynamic Category Tabs ── */}
                {sortedCategories.map(([key, meta]) => {
                    const count = categoryCounts[key] || 0
                    if (count === 0) return null

                    const Icon = (VCT_Icons as any)[meta.icon] || VCT_Icons.Layers

                    return (
                        <TabButton
                            key={key}
                            isActive={activeCategory === key}
                            onClick={() => onSelectCategory(key)}
                            icon={<Icon size={15} />}
                            label={t(meta.label)}
                            count={count}
                            accentColor={meta.color}
                            glowColor={`${meta.color}40`}
                        />
                    )
                })}
            </div>
        </div>
    )
}

/* ─────────────────────── Premium Tab Button ─────────────────────── */

function TabButton({
    isActive,
    onClick,
    icon,
    label,
    count,
    accentColor,
    glowColor,
}: {
    isActive: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    count: number
    accentColor: string
    glowColor: string
}) {
    return (
        <button
            role="tab"
            {...{ 'aria-selected': isActive }}
            tabIndex={isActive ? 0 : -1}
            onClick={onClick}
            className="group relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-vct-accent/50"
            style={{
                background: isActive
                    ? `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`
                    : undefined,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: isActive ? `${accentColor}35` : 'transparent',
            }}
        >
            {/* Active indicator background */}
            {isActive && (
                <motion.div
                    layoutId="active-portal-tab-v2"
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                        boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 ${accentColor}15`,
                    }}
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
            )}

            {/* Active left accent bar */}
            {isActive && (
                <motion.div
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                />
            )}

            {/* Icon */}
            <span
                className="relative z-10 transition-colors duration-200"
                style={{ color: isActive ? accentColor : undefined }}
            >
                {icon}
            </span>

            {/* Label */}
            <span
                className={`relative z-10 whitespace-nowrap transition-colors duration-200 ${
                    isActive
                        ? 'font-semibold text-white'
                        : 'text-white/50 group-hover:text-white/80'
                }`}
            >
                {label}
            </span>

            {/* Count badge */}
            <span
                className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-all duration-200"
                style={{
                    backgroundColor: isActive ? `${accentColor}30` : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? accentColor : 'rgba(255, 255, 255, 0.4)',
                }}
            >
                {count}
            </span>
        </button>
    )
}
