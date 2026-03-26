'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Workspace Card (Grid view)
// Shows instance name, type, branding, status, badges.
// ════════════════════════════════════════════════════════════════

import * as React from 'react'
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import { useWorkspaceStore } from '../../layout/workspace-store'
import type { WorkspaceCard } from '../../layout/workspace-types'
import { WORKSPACE_META } from '../../layout/workspace-types'

interface Props {
    card: WorkspaceCard
    onClick: (card: WorkspaceCard) => void
}

function getRelativeTime(timestamp: number, t: (key: string) => string): string {
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('time.justNow') || 'Vừa xong'
    if (mins < 60) return `${mins} ${t('time.minsAgo') || 'phút trước'}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ${t('time.hoursAgo') || 'giờ trước'}`
    const days = Math.floor(hours / 24)
    if (days === 1) return t('time.yesterday') || 'Hôm qua'
    if (days < 7) return `${days} ${t('time.daysAgo') || 'ngày trước'}`
    return `${Math.floor(days / 7)} ${t('time.weeksAgo') || 'tuần trước'}`
}

export const PortalWorkspaceCard = ({ card, onClick }: Props) => {
    const { t } = useI18n()
    const { togglePin, isPinned, lastAccessedMap, isPrivacyMode } = useWorkspaceStore()
    const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false)
    
    // Spotlight Effect Tracker
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }
    
    const meta = WORKSPACE_META[card.type]
    const pinned = isPinned(card.id)
    const lastAccess = lastAccessedMap[card.id]

    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const CardIcon = iconMap[card.icon] ?? iconMap[meta?.icon ?? 'Activity'] ?? VCT_Icons.Activity

    const status = card.status ?? 'active'
    const permission = card.permission ?? 'manage'
    const displayName = card.scope.name && card.scope.name !== card.label
        ? t(card.scope.name)
        : t(card.label)
    const typeName = t(meta?.label ?? card.label)

    // Handlers for context menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsContextMenuOpen(true)
    }

    const closeContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsContextMenuOpen(false)
    }

    return (
        <div className="relative">
            <motion.div
                role="button"
                tabIndex={0}
                aria-label={`${displayName} - ${typeName}`}
                aria-roledescription="workspace card"
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(card)}
                onContextMenu={handleContextMenu}
                onMouseMove={handleMouseMove}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(card) } }}
                className="group relative flex min-h-[180px] cursor-pointer flex-col gap-3 rounded-2xl border border-white/40 bg-white/40 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-white/20 backdrop-blur-2xl transition-all duration-300 hover:border-white/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-vct-accent/30 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
            >
            {/* Spotlight Overlay */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            350px circle at ${mouseX}px ${mouseY}px,
                            rgba(99, 102, 241, 0.12),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Ambient Background Glow Effect inside the card (visible on hover) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-vct-accent/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-b-2xl pointer-events-none" />

            {/* Top row: icon + pin + badges */}
            <div className="relative flex w-full items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo or icon with premium background */}
                    {card.logoUrl ? (
                        <img
                            src={card.logoUrl}
                            alt={displayName}
                            className="h-10 w-10 rounded-xl object-cover transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                        />
                    ) : (
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md bg-(--card-icon-bg) transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm ring-1 ring-white/20"
                            style={{ 
                                '--card-icon-bg': `${card.color}18` 
                            } as React.CSSProperties}
                        >
                            <CardIcon size={20} style={{ color: card.color }} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-vct-text group-hover:text-vct-primary transition-colors">{displayName}</div>
                        <div className="truncate text-xs text-vct-text-muted">{typeName}</div>
                    </div>
                </div>

                {/* Top right actions */}
                <div className="flex items-center gap-1 shrink-0 relative z-10">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePin(card.id) }}
                        title={pinned ? t('portal.unpin') : t('portal.pin')}
                        className={`shrink-0 rounded-lg p-1.5 transition-colors ${pinned ? 'text-amber-500' : 'text-vct-text-muted/40 opacity-0 group-hover:opacity-100'} hover:text-amber-500`}
                    >
                        <VCT_Icons.Star size={14} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleContextMenu}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-vct-text-muted/60 opacity-0 transition-colors hover:bg-slate-100 hover:text-vct-text group-hover:opacity-100 dark:hover:bg-slate-700"
                        title={t('common.actions') || 'Thao tác'}
                        aria-label="Menu"
                    >
                        <VCT_Icons.MoreVertical size={14} />
                    </button>
                </div>
            </div>

            {/* Description */}
            <p className="line-clamp-2 text-xs leading-relaxed text-vct-text-muted group-hover:text-vct-text/80 transition-colors">
                {t(card.description)}
            </p>

            {/* Bottom: status + permission + pending + last access */}
            <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                {/* Status dot */}
                {status === 'active' && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {t('common.status.active')}
                    </span>
                )}
                {status === 'archived' && (
                    <span className="flex items-center gap-1 text-vct-text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {t('portal.archived')}
                    </span>
                )}
                {status === 'upcoming' && (
                    <span className="flex items-center gap-1 text-blue-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {t('portal.upcoming')}
                    </span>
                )}

                {/* Permission badge */}
                {permission === 'view' && (
                    <span className="rounded-full bg-vct-text-muted/10 px-2 py-0.5 text-vct-text-muted">
                        {t('portal.viewOnly')}
                    </span>
                )}

                {/* Pending actions */}
                {(card.pendingActions ?? 0) > 0 && (
                    <span className={`rounded-full px-2 py-0.5 ${isPrivacyMode ? 'bg-zinc-500/15 text-zinc-500 blur-[2px]' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                        {isPrivacyMode ? '***' : card.pendingActions} {t('portal.pendingCount')}
                    </span>
                )}

                {/* Spacer */}
                <span className="flex-1" />

                {/* Last access or New Badge */}
                {lastAccess ? (
                    <span className="text-vct-text-muted">
                        {getRelativeTime(lastAccess, t)}
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-vct-primary/10 px-2.5 py-0.5 text-vct-primary ring-1 ring-vct-primary/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vct-primary opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vct-primary"></span>
                        </span>
                        {t('portal.newWorkspace') || 'Mới'}
                    </span>
                )}
            </div>
            </motion.div>

            {/* Context Menu Overlay */}
            <AnimatePresence>
                {isContextMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={closeContextMenu}
                            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(e) }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-4 top-16 z-50 flex w-52 flex-col rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95"
                        >
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-vct-text hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                    alert(t('portal.featureComingSoon') || 'Tính năng liên kết cấu hình đang được cập nhật')
                                }}
                            >
                                <VCT_Icons.Settings size={14} />
                                {t('portal.workspaceSettings') || 'Cấu hình không gian'}
                            </button>
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-vct-text hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                    alert(t('portal.featureComingSoon') || 'Tính năng xuất dữ liệu đang được cập nhật')
                                }}
                            >
                                <VCT_Icons.FileText size={14} />
                                {t('portal.exportData') || 'Truy xuất báo cáo nhanh'}
                            </button>
                            <div className="my-1 h-px w-full bg-slate-200 dark:bg-slate-700" />
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                onClick={closeContextMenu}
                            >
                                <VCT_Icons.LogOut size={14} />
                                {t('common.close') || 'Đóng menu'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
