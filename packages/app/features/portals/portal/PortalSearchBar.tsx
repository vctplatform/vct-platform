'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Search Bar
// Search with diacritics + sort dropdown + view mode toggle.
// ════════════════════════════════════════════════════════════════

import { VCT_Icons } from '../../components/vct-icons'
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

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Search input */}
            <div className="relative flex-1">
                <VCT_Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t('portal.searchPlaceholder')}
                    className="h-11 w-full rounded-xl border border-vct-border/60 bg-(--vct-bg-elevated) pl-11 pr-10 text-sm text-vct-text placeholder:text-vct-text-muted/50 focus:border-vct-accent focus:outline-none focus:ring-2 focus:ring-vct-accent/20 transition-all shadow-sm"
                    aria-label={t('portal.searchPlaceholder')}
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        title={t('portal.clearSearch') || 'Xóa'}
                        aria-label="Xóa tìm kiếm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-vct-text-muted hover:text-vct-text transition-colors"
                    >
                        <VCT_Icons.X size={14} />
                    </button>
                )}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
                {/* Count */}
                {searchQuery && filteredCount !== totalCount && (
                    <span className="text-xs text-vct-text-muted">
                        {filteredCount}/{totalCount}
                    </span>
                )}

                {/* Sort */}
                <select
                    value={sortMode}
                    onChange={(e) => onSortChange(e.target.value as SortMode)}
                    className="h-9 rounded-lg border border-vct-border bg-(--vct-bg-elevated) px-2.5 text-xs font-semibold text-vct-text-muted cursor-pointer focus:border-vct-accent focus:outline-none"
                    aria-label="Sort workspaces"
                >
                    <option value="recent">{t('portal.sortRecent')}</option>
                    <option value="az">{t('portal.sortAZ')}</option>
                    <option value="pending">{t('portal.sortPending')}</option>
                </select>

                {/* View toggle */}
                <div className="flex rounded-lg border border-vct-border p-0.5">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('grid')}
                        title="Grid view"
                        className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-vct-accent/15 text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}
                    >
                        <VCT_Icons.LayoutGrid size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('list')}
                        title="List view"
                        className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-vct-accent/15 text-vct-accent' : 'text-vct-text-muted hover:text-vct-text'}`}
                    >
                        <VCT_Icons.List size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
