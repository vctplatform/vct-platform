'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Search Bar v3 (Premium Glass Search)
// Better touch targets, accent glow on focus, expanded toggles
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
    const [isFocused, setIsFocused] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const currentSort = SORT_OPTIONS.find(o => o.value === sortMode) ?? SORT_OPTIONS[0]!
    const SortIcon = (VCT_Icons as Record<string, React.ComponentType<any>>)[currentSort.icon] ?? VCT_Icons.Clock

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Search input — glassmorphism + focus glow */}
            <div className="relative flex-1">
                <VCT_Icons.Search
                    size={16}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                        isFocused ? 'text-vct-accent' : 'text-vct-text-muted'
                    }`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t('portal.searchPlaceholder') || 'Tìm kiếm workspace...'}
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-10 text-sm text-vct-text backdrop-blur-2xl placeholder:text-vct-text-muted/40 focus:border-vct-accent/40 focus:outline-none focus:ring-2 focus:ring-vct-accent/15 focus:bg-white/[0.06] transition-all duration-300 shadow-sm"
                    aria-label={t('portal.searchPlaceholder') || 'Tìm kiếm workspace'}
                />
                {/* Bottom accent glow on focus */}
                <div
                    className={`absolute inset-x-4 bottom-0 h-[1.5px] rounded-full transition-all duration-300 ${
                        isFocused ? 'opacity-100 bg-vct-accent shadow-[0_0_8px_var(--vct-accent-cyan)]' : 'opacity-0'
                    }`}
                />

                {!searchQuery && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-vct-text-muted/50 sm:inline-block">
                            ⌘K
                        </kbd>
                    </div>
                )}
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        title={t('portal.clearSearch') || 'Xóa tìm kiếm'}
                        aria-label={t('portal.clearSearch') || 'Xóa tìm kiếm'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-vct-text-muted hover:text-vct-text hover:bg-white/10 transition-all"
                    >
                        <VCT_Icons.X size={14} />
                    </button>
                )}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2.5">
                {/* Count badge */}
                {searchQuery && filteredCount !== totalCount && (
                    <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-full bg-vct-accent/10 px-3 py-1 text-xs font-bold text-vct-accent ring-1 ring-vct-accent/20"
                    >
                        {filteredCount}/{totalCount}
                    </motion.span>
                )}

                {/* Custom sort dropdown */}
                <div ref={sortRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setSortOpen(!sortOpen)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-semibold text-vct-text-muted transition-all hover:border-vct-accent/30 hover:text-vct-text focus:outline-none focus-visible:ring-2 focus-visible:ring-vct-accent/20 backdrop-blur-xl"
                        aria-label={t('portal.sort') || 'Sắp xếp'}
                        aria-expanded={sortOpen}
                        aria-haspopup="menu"
                    >
                        <SortIcon size={14} />
                        <span className="hidden sm:inline">{t(currentSort.labelKey) || 'Gần đây'}</span>
                        <VCT_Icons.ChevronDown size={12} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {sortOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/[0.1] bg-vct-elevated/95 shadow-xl backdrop-blur-2xl"
                            >
                                <div role="menu" className="flex w-full flex-col p-1">
                                    {SORT_OPTIONS.map((opt) => {
                                        const OptIcon = (VCT_Icons as Record<string, React.ComponentType<any>>)[opt.icon] ?? VCT_Icons.Clock
                                        const isActive = sortMode === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                role="menuitem"
                                                type="button"
                                                onClick={() => { onSortChange(opt.value); setSortOpen(false) }}
                                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-vct-accent/10 text-vct-accent'
                                                        : 'text-vct-text-muted hover:bg-white/[0.06] hover:text-vct-text'
                                                }`}
                                            >
                                                <OptIcon size={14} />
                                                {t(opt.labelKey) || opt.value}
                                                {isActive && <VCT_Icons.Check size={13} className="ml-auto text-vct-accent" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* View toggle — pill style with 44px touch targets */}
                <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('grid')}
                        title={t('portal.gridView') || 'Lưới'}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                            viewMode === 'grid'
                                ? 'bg-vct-accent/15 text-vct-accent shadow-sm shadow-vct-accent/20'
                                : 'text-vct-text-muted hover:text-vct-text hover:bg-white/[0.05]'
                        }`}
                    >
                        <VCT_Icons.LayoutGrid size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('list')}
                        title={t('portal.listView') || 'Danh sách'}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                            viewMode === 'list'
                                ? 'bg-vct-accent/15 text-vct-accent shadow-sm shadow-vct-accent/20'
                                : 'text-vct-text-muted hover:text-vct-text hover:bg-white/[0.05]'
                        }`}
                    >
                        <VCT_Icons.List size={15} />
                    </button>
                </div>
            </div>
        </div>
    )
}
