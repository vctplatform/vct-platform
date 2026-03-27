'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Workspace Card v2 (Premium Glass Card)
// Features: colored border glow, spotlight effect, i18n fallbacks
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
        ? t(card.scope.name) || card.scope.name
        : t(card.label) || card.label
    const typeName = t(meta?.label ?? card.label) || meta?.label || card.label

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
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(card)}
                onContextMenu={handleContextMenu}
                onMouseMove={handleMouseMove}
                onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(card) }
                }}
                className="group relative flex min-h-[200px] cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.08)] ring-1 ring-inset ring-white/[0.05] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15] hover:shadow-[var(--card-glow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-vct-accent/40"
                style={{
                    '--card-glow': `0 8px 40px ${card.color}20, 0 0 0 1px ${card.color}15`,
                } as React.CSSProperties}
            >
                {/* Spotlight radial gradient following cursor */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                300px circle at ${mouseX}px ${mouseY}px,
                                ${card.color}18,
                                transparent 70%
                            )
                        `,
                    }}
                />

                {/* Colored accent line at top */}
                <div
                    className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }}
                />

                {/* Bottom ambient glow */}
                <div
                    className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                    style={{ background: `linear-gradient(to top, ${card.color}08, transparent)` }}
                />

                {/* ──── Top row: icon + actions ──── */}
                <div className="relative flex w-full items-start justify-between">
                    <div className="flex items-center gap-4">
                        {/* Logo or icon */}
                        {card.logoUrl ? (
                            <img
                                src={card.logoUrl}
                                alt={displayName}
                                className="h-11 w-11 rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                            />
                        ) : (
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm ring-1 ring-white/10"
                                style={{ background: `${card.color}15` }}
                            >
                                <CardIcon size={22} style={{ color: card.color }} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-vct-text transition-colors duration-200 group-hover:text-vct-accent">
                                {displayName}
                            </div>
                            <div className="truncate text-xs text-vct-text-muted">
                                {typeName}
                            </div>
                        </div>
                    </div>

                    {/* Pin + menu */}
                    <div className="flex items-center gap-1 shrink-0 relative z-10">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); togglePin(card.id) }}
                            title={pinned ? (t('portal.unpin') || 'Bỏ ghim') : (t('portal.pin') || 'Ghim')}
                            className={`shrink-0 rounded-lg p-1.5 transition-all ${
                                pinned
                                    ? 'text-amber-400 scale-110'
                                    : 'text-vct-text-muted/30 opacity-0 group-hover:opacity-100'
                            } hover:text-amber-400 hover:scale-110`}
                        >
                            <VCT_Icons.Star size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={handleContextMenu}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-vct-text-muted/40 opacity-0 transition-all hover:bg-white/10 hover:text-vct-text group-hover:opacity-100"
                            title={t('common.actions') || 'Thao tác'}
                            aria-label="Menu"
                        >
                            <VCT_Icons.MoreVertical size={14} />
                        </button>
                    </div>
                </div>

                {/* ──── Description ──── */}
                <p className="line-clamp-2 text-xs leading-relaxed text-vct-text-muted/70 transition-colors duration-200 group-hover:text-vct-text-muted">
                    {t(card.description) || card.description}
                </p>

                {/* ──── Bottom: status + badges ──── */}
                <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                    {/* Status dot */}
                    {status === 'active' && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                            {t('common.status.active') || 'Đang hoạt động'}
                        </span>
                    )}
                    {status === 'archived' && (
                        <span className="flex items-center gap-1.5 text-vct-text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {t('portal.archived') || 'Đã lưu trữ'}
                        </span>
                    )}
                    {status === 'upcoming' && (
                        <span className="flex items-center gap-1.5 text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {t('portal.upcoming') || 'Sắp diễn ra'}
                        </span>
                    )}

                    {/* Permission badge */}
                    {permission === 'view' && (
                        <span className="rounded-full bg-vct-text-muted/10 px-2 py-0.5 text-vct-text-muted">
                            {t('portal.viewOnly') || 'Chỉ xem'}
                        </span>
                    )}

                    {/* Pending actions */}
                    {(card.pendingActions ?? 0) > 0 && (
                        <span className={`rounded-full px-2 py-0.5 ${
                            isPrivacyMode
                                ? 'bg-zinc-500/15 text-zinc-400 blur-[2px]'
                                : 'bg-red-500/15 text-red-400'
                        }`}>
                            {isPrivacyMode ? '***' : card.pendingActions} {t('portal.pendingCount') || 'chờ xử lý'}
                        </span>
                    )}

                    {/* Spacer */}
                    <span className="flex-1" />

                    {/* Last access or New Badge */}
                    {lastAccess ? (
                        <span className="text-vct-text-muted/60">
                            {getRelativeTime(lastAccess, t)}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-vct-accent/10 px-2.5 py-0.5 text-vct-accent ring-1 ring-vct-accent/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vct-accent opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vct-accent" />
                            </span>
                            {t('portal.newWorkspace') || 'Mới'}
                        </span>
                    )}
                </div>
            </motion.div>

            {/* ──── Context Menu ──── */}
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
                            className="absolute right-4 top-16 z-50 flex w-52 flex-col rounded-xl border border-vct-border/30 bg-vct-elevated/95 p-1 shadow-xl backdrop-blur-2xl"
                        >
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-vct-text transition-colors hover:bg-vct-accent/8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                }}
                            >
                                <VCT_Icons.Settings size={14} />
                                {t('portal.workspaceSettings') || 'Cấu hình không gian'}
                            </button>
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-vct-text transition-colors hover:bg-vct-accent/8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                }}
                            >
                                <VCT_Icons.FileText size={14} />
                                {t('portal.exportData') || 'Truy xuất báo cáo nhanh'}
                            </button>
                            <div className="my-1 h-px w-full bg-vct-border/20" />
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-red-400 transition-colors hover:bg-red-500/8"
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
