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

    // Sort categories by their defined order
    const sortedCategories = Object.entries(WORKSPACE_CATEGORIES)
        .sort(([, a], [, b]) => a.order - b.order) as [WorkspaceCategory, typeof WORKSPACE_CATEGORIES[WorkspaceCategory]][]

    // Handle keyboard navigation for ARIA tablist
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault()
            const tabs = Array.from(containerRef.current?.querySelectorAll('[role="tab"]') || []) as HTMLButtonElement[]
            if (tabs.length === 0) return
            
            const currentIndex = tabs.findIndex(tab => tab === document.activeElement)
            // If none focused (shouldn't happen on keydown inside), default to 0
            const current = currentIndex === -1 ? 0 : currentIndex
            
            let nextIndex = current
            if (e.key === 'ArrowRight') {
                nextIndex = (current + 1) % tabs.length
            } else if (e.key === 'ArrowLeft') {
                nextIndex = (current - 1 + tabs.length) % tabs.length
            }
            tabs[nextIndex]?.focus()
        }
    }

    return (
        <div className="relative w-full overflow-hidden">
            {/* Left and right fade gradients for scroll indication (optional polish) */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-vct-bg to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-vct-bg to-transparent" />
            
            <div 
                ref={containerRef}
                role="tablist"
                aria-label={t('portal.allCategories') || 'Workspace Categories'}
                onKeyDown={handleKeyDown}
                className="hide-scrollbar relative z-0 flex w-full snap-x snap-mandatory scroll-px-4 items-center gap-2 overflow-x-auto px-4 py-2 sm:px-0"
            >
                {/* ── "All Categories" Tab ── */}
                <button
                    role="tab"
                    aria-selected={activeCategory === null ? 'true' : 'false'}
                    tabIndex={activeCategory === null ? 0 : -1}
                    onClick={() => onSelectCategory(null)}
                    className={`relative flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-vct-primary ${
                        activeCategory === null
                            ? 'text-white dark:text-zinc-900'
                            : 'text-vct-text-muted hover:bg-black/5 hover:dark:bg-white/5 hover:text-vct-text'
                    }`}
                >
                    {activeCategory === null && (
                        <motion.div
                            layoutId="active-portal-tab"
                            className="absolute inset-0 z-0 rounded-full bg-zinc-900 shadow-sm dark:bg-zinc-100 dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            initial={false}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        <VCT_Icons.LayoutGrid size={16} />
                        {t('portal.allCategories') || 'Tất cả'}
                    </span>
                </button>

                {/* ── Dynamic Category Tabs ── */}
                {sortedCategories.map(([key, meta]) => {
                    const count = categoryCounts[key] || 0
                    if (count === 0) return null // Hide empty categories

                    const Icon = (VCT_Icons as any)[meta.icon] || VCT_Icons.Layers
                    const isActive = activeCategory === key

                    return (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={isActive ? 'true' : 'false'}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => onSelectCategory(key)}
                            style={{ 
                                '--tab-color': meta.color,
                                '--tab-glow': `${meta.color}4D`
                            } as React.CSSProperties}
                            className={`relative flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-vct-primary bg-(--tab-color)/0 hover:bg-(--tab-color)/10 ${
                                isActive
                                    ? 'shadow-[0_0_20px_var(--tab-glow)] text-white dark:text-zinc-900 contrast-more:text-black'
                                    : 'text-vct-text-muted hover:text-vct-text'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-portal-tab"
                                    className="absolute inset-0 z-0 rounded-full bg-(--tab-color)"
                                    initial={false}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                { }
                                <Icon size={16} className={isActive ? 'text-white dark:text-zinc-900' : 'text-(--tab-color)'} />
                                {t(meta.label)}
                                <span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                    isActive ? 'bg-black/20 text-white' : 'bg-black/5 dark:bg-white/10 text-vct-text-muted'
                                }`}>
                                    {count}
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
