'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Workspace Switcher (v3 — Searchable Dropdown)
// Enterprise-grade workspace selector in sidebar:
//   • Search with Vietnamese diacritics
//   • Favorites section (pinned)
//   • Recent section (last 3)
//   • Category dividers
//   • Notification badges
//   • "All workspaces" link → Portal Hub
// ════════════════════════════════════════════════════════════════

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { VCT_Icons } from '@vct/ui'
import type { WorkspaceCard, WorkspaceType } from './workspace-types'
import { WORKSPACE_META, WORKSPACE_CATEGORIES, getCategoryForType } from './workspace-types'
import { useWorkspaceStore } from './workspace-store'
import { useI18n } from '../i18n'
import { normalizeVietnamese } from '../portals/portal/usePortalState'

interface WorkspaceSwitcherProps {
    workspaces: WorkspaceCard[]
    currentType?: WorkspaceType | null
    onSwitch: (ws: WorkspaceCard) => void
    isCollapsed?: boolean
}

export const WorkspaceSwitcher = ({
    workspaces,
    currentType,
    onSwitch,
    isCollapsed = false,
}: WorkspaceSwitcherProps) => {
    const { t } = useI18n()
    const router = useRouter()
    const [isOpen, setIsOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const ref = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const { pinnedWorkspaceIds, lastAccessedMap, togglePin, isPinned } = useWorkspaceStore()

    const currentMeta = currentType ? WORKSPACE_META[currentType] : null
    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const CurrentIcon = currentMeta
        ? (iconMap[currentMeta.icon] ?? VCT_Icons.Activity)
        : VCT_Icons.LayoutGrid

    // Close on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus input on open
    React.useEffect(() => {
        if (isOpen) {
            setSearch('')
            setTimeout(() => inputRef.current?.focus(), 80)
        }
    }, [isOpen])

    // ── Derived lists ──
    const pinnedCards = React.useMemo(
        () => workspaces.filter(c => pinnedWorkspaceIds.includes(c.id)),
        [workspaces, pinnedWorkspaceIds]
    )

    const recentCards = React.useMemo(() => {
        return workspaces
            .filter(c => lastAccessedMap[c.id] != null)
            .sort((a, b) => (lastAccessedMap[b.id] ?? 0) - (lastAccessedMap[a.id] ?? 0))
            .slice(0, 3)
    }, [workspaces, lastAccessedMap])

    // ── Search filter ──
    const filteredWorkspaces = React.useMemo(() => {
        if (!search.trim()) return workspaces
        const q = normalizeVietnamese(search)
        return workspaces.filter(c => {
            const name = normalizeVietnamese(c.label)
            const scopeName = normalizeVietnamese(c.scope.name)
            return name.includes(q) || scopeName.includes(q)
        })
    }, [workspaces, search])

    // ── Category groups ──
    const categoryGroups = React.useMemo(() => {
        const groups: Array<{ label: string; icon: string; color: string; cards: WorkspaceCard[] }> = []
        const sorted = Object.entries(WORKSPACE_CATEGORIES).sort(([, a], [, b]) => a.order - b.order)
        for (const [cat, meta] of sorted) {
            const cards = filteredWorkspaces.filter(c => getCategoryForType(c.type) === cat)
            if (cards.length === 0) continue
            groups.push({ label: meta.label, icon: meta.icon, color: meta.color, cards })
        }
        return groups
    }, [filteredWorkspaces])

    const currentLabel = currentMeta
        ? t(currentMeta.label)
        : t('portal.allWorkspaces')

    // ── Render workspace row ──
    const renderWsItem = (ws: WorkspaceCard, showPin = false) => {
        const meta = WORKSPACE_META[ws.type]
        const WsIcon = iconMap[meta?.icon ?? 'Activity'] ?? VCT_Icons.Activity
        const isCurrent = ws.type === currentType
        const pinned = isPinned(ws.id)
        const displayName = ws.scope.name && ws.scope.name !== ws.label
            ? t(ws.scope.name)
            : t(ws.label)

        return (
            <button
                key={ws.id}
                type="button"
                onClick={() => { onSwitch(ws); setIsOpen(false) }}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isCurrent ? 'bg-vct-accent/10 text-vct-accent' : 'text-vct-text hover:bg-(--vct-bg-elevated)'
                }`}
            >
                <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta?.color ?? '#888'}20` }}
                >
                    <WsIcon size={14} color={isCurrent ? 'var(--vct-accent)' : meta?.color} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{displayName}</div>
                    <div className="truncate text-[10px] text-vct-text-muted">{t(meta?.label ?? '')}</div>
                </div>
                {/* Pending badge */}
                {(ws.pendingActions ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {ws.pendingActions}
                    </span>
                )}
                {/* Pin button */}
                {showPin && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePin(ws.id) }}
                        title={pinned ? t('portal.unpin') : t('portal.pin')}
                        className={`shrink-0 rounded p-0.5 transition-colors ${pinned ? 'text-amber-500' : 'text-vct-text-muted/30 opacity-0 group-hover:opacity-100'} hover:text-amber-500`}
                    >
                        <VCT_Icons.Star size={10} />
                    </button>
                )}
                {/* Current indicator */}
                {isCurrent && (
                    <VCT_Icons.CheckCircle size={14} className="shrink-0 text-vct-accent" />
                )}
            </button>
        )
    }

    // ── Single workspace: static label ──
    if (workspaces.length <= 1 && !isCollapsed) {
        return (
            <div className="border-b border-vct-border px-4 py-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-vct-border bg-vct-input px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${currentMeta?.color ?? '#888'}25` }}>
                        <CurrentIcon size={14} color={currentMeta?.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">Workspace</div>
                        <div className="mt-0.5 truncate text-xs font-bold text-vct-text">{currentLabel}</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={ref} className="relative border-b border-vct-border px-4 py-3">
            {/* ── Trigger ── */}
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-vct-border bg-vct-input px-3 py-2 transition-colors hover:bg-(--vct-bg-elevated)"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${currentMeta?.color ?? '#888'}25` }}>
                    <CurrentIcon size={14} color={currentMeta?.color} />
                </div>
                {!isCollapsed && (
                    <>
                        <div className="min-w-0 flex-1 text-left">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">Workspace</div>
                            <div className="mt-0.5 truncate text-xs font-bold text-vct-text">{currentLabel}</div>
                        </div>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-vct-text-muted">
                            <VCT_Icons.ChevronDown size={14} />
                        </motion.span>
                    </>
                )}
            </button>

            {/* ── Dropdown ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-4 right-4 z-50 mt-2 rounded-xl border border-vct-border bg-(--vct-bg-card) shadow-2xl"
                    >
                        {/* Search */}
                        <div className="border-b border-vct-border/50 px-3 py-2">
                            <div className="flex items-center gap-2 rounded-lg bg-vct-input px-2.5 py-1.5">
                                <VCT_Icons.Search size={13} className="shrink-0 text-vct-text-muted/50" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('portal.searchPlaceholder')}
                                    className="w-full bg-transparent text-xs text-vct-text outline-none placeholder:text-vct-text-muted/50"
                                    aria-label={t('portal.searchPlaceholder')}
                                />
                                {search && (
                                    <button type="button" onClick={() => setSearch('')} className="text-vct-text-muted hover:text-vct-text" aria-label="Clear">
                                        <VCT_Icons.X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[320px] overflow-y-auto vct-hide-scrollbar">
                            {/* Favorites */}
                            {!search && pinnedCards.length > 0 && (
                                <div className="p-2">
                                    <div className="px-2 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500/70">
                                        ⭐ {t('portal.favorites')}
                                    </div>
                                    {pinnedCards.map(ws => renderWsItem(ws))}
                                </div>
                            )}

                            {/* Recent */}
                            {!search && recentCards.length > 0 && (
                                <div className="border-t border-vct-border/30 p-2">
                                    <div className="px-2 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-vct-text-muted/50">
                                        🕐 {t('portal.recent')}
                                    </div>
                                    {recentCards.map(ws => renderWsItem(ws))}
                                </div>
                            )}

                            {/* Category groups (when searching or no search) */}
                            {categoryGroups.map((group, gi) => (
                                <div key={group.label} className={`p-2 ${gi > 0 || (!search && (pinnedCards.length > 0 || recentCards.length > 0)) ? 'border-t border-vct-border/30' : ''}`}>
                                    <div className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-vct-text-muted/50">
                                        {t(group.label)} ({group.cards.length})
                                    </div>
                                    {group.cards.map(ws => renderWsItem(ws, true))}
                                </div>
                            ))}

                            {/* No results */}
                            {search && filteredWorkspaces.length === 0 && (
                                <div className="px-4 py-6 text-center text-xs text-vct-text-muted">
                                    {t('portal.noResults')}
                                </div>
                            )}
                        </div>

                        {/* Footer: link to Portal Hub */}
                        <div className="border-t border-vct-border/50">
                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); router.push('/') }}
                                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold text-vct-accent transition-colors hover:bg-vct-accent/5"
                            >
                                <VCT_Icons.LayoutGrid size={12} />
                                {t('portal.allWorkspaces')} →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
