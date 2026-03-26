'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Search Bar (v2)
// Glassmorphism search + custom sort dropdown + view mode toggle.
// ════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import type { SortMode, ViewMode } from './usePortalState'

interface Props {
    searchQuery: string
    onSearchChange: (query: string) => void
    sortMode: SortMode
    onSortChange: (mode: SortMode) => void
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
    totalCount: number
    filteredCount: number
}

const SORT_OPTIONS: { value: SortMode; labelKey: string; icon: keyof typeof VCT_Icons }[] = [
    { value: 'recent', labelKey: 'portal.sortRecent', icon: 'Clock' },
    { value: 'az', labelKey: 'portal.sortAZ', icon: 'Type' },
    { value: 'pending', labelKey: 'portal.sortPending', icon: 'AlertCircle' },
]

export const PortalSearchBar = ({
    searchQuery,
    onSearchChange,
    sortMode,
    onSortChange,
    viewMode,
    onViewModeChange,
    totalCount,
    filteredCount,
}: Props) => {
    const { t } = useI18n()
    const [sortOpen, setSortOpen] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setSortOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const currentSort = SORT_OPTIONS.find(o => o.value === sortMode) ?? SORT_OPTIONS[0]!
    const SortIcon = (VCT_Icons as Record<string, React.ComponentType<any>>)[currentSort.icon] ?? VCT_Icons.Clock

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Search input — glassmorphism */}
            <div className="relative flex-1">
                <VCT_Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t('portal.searchPlaceholder')}
                    className="h-11 w-full rounded-xl border border-vct-border/40 bg-(--vct-bg-elevated)/80 pl-11 pr-10 text-sm text-vct-text backdrop-blur-md placeholder:text-vct-text-muted/50 focus:border-vct-accent focus:outline-none focus:ring-2 focus:ring-vct-accent/20 transition-all shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    aria-label={t('portal.searchPlaceholder')}
                />
                {!searchQuery && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden rounded border border-vct-border/60 bg-vct-border/20 px-1.5 py-0.5 text-[10px] font-bold text-vct-text-muted sm:inline-block">
                            ⌘K
                        </kbd>
                    </div>
                )}
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        title={t('portal.clearSearch')}
                        aria-label={t('portal.clearSearch')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-vct-text-muted hover:text-vct-text transition-colors"
                    >
                        <VCT_Icons.X size={14} />
                    </button>
                )}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
                {/* Count badge */}
                {searchQuery && filteredCount !== totalCount && (
                    <span className="rounded-full bg-vct-accent/10 px-2.5 py-0.5 text-xs font-semibold text-vct-accent">
                        {filteredCount}/{totalCount}
                    </span>
                )}

                {/* Custom sort dropdown */}
                <div ref={sortRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setSortOpen(!sortOpen)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-vct-border/60 bg-(--vct-bg-elevated) px-3 text-xs font-semibold text-vct-text-muted transition-all hover:border-vct-accent/40 hover:text-vct-text focus:outline-none focus:ring-2 focus:ring-vct-accent/20 dark:border-slate-700/50 dark:bg-slate-800/40"
                        aria-label="Sort workspaces"
                        aria-expanded={sortOpen}
                        aria-haspopup="menu"
                    >
                        <SortIcon size={13} />
                        <span className="hidden sm:inline">{t(currentSort.labelKey)}</span>
                        <VCT_Icons.ChevronDown size={12} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {sortOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-vct-border/60 bg-(--vct-bg-elevated) shadow-lg backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                            >
                                <div role="menu" className="flex w-full flex-col">
                                    {SORT_OPTIONS.map((opt) => {
                                        const OptIcon = (VCT_Icons as Record<string, React.ComponentType<any>>)[opt.icon] ?? VCT_Icons.Clock
                                        const isActive = sortMode === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                role="menuitem"
                                                type="button"
                                                onClick={() => { onSortChange(opt.value); setSortOpen(false) }}
                                                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                                                    isActive 
                                                        ? 'bg-vct-accent/10 text-vct-accent' 
                                                        : 'text-vct-text-muted hover:bg-vct-accent/5 hover:text-vct-text'
                                                }`}
                                            >
                                                <OptIcon size={14} />
                                                {t(opt.labelKey)}
                                                {isActive && <VCT_Icons.Check size={13} className="ml-auto text-vct-accent" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* View toggle — pill style */}
                <div className="flex rounded-lg border border-vct-border/60 p-0.5 dark:border-slate-700/50">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('grid')}
                        title="Grid view"
                        className={`rounded-md p-1.5 transition-all duration-150 ${viewMode === 'grid' ? 'bg-vct-accent/15 text-vct-accent shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}
                    >
                        <VCT_Icons.LayoutGrid size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('list')}
                        title="List view"
                        className={`rounded-md p-1.5 transition-all duration-150 ${viewMode === 'list' ? 'bg-vct-accent/15 text-vct-accent shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}
                    >
                        <VCT_Icons.List size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
