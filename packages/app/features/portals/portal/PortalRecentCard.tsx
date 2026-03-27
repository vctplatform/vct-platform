'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Workspace Card (Compact/Recent view)
// Shows instance name, type, branding, and last access time horizontally.
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

export const PortalRecentCard = ({ card, onClick }: Props) => {
    const { t } = useI18n()
    const { lastAccessedMap } = useWorkspaceStore()
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
    const lastAccess = lastAccessedMap[card.id]

    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const CardIcon = iconMap[card.icon] ?? iconMap[meta?.icon ?? 'Activity'] ?? VCT_Icons.Activity

    const displayName = card.scope.name && card.scope.name !== card.label
        ? card.scope.name
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
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onMouseMove={handleMouseMove}
                className="group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 p-3 shadow-xs ring-1 ring-inset ring-white/20 backdrop-blur-2xl transition-all duration-300 hover:border-white/50 hover:shadow-md hover:shadow-vct-primary/10 focus-within:ring-2 focus-within:ring-vct-accent/30 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20"
            >
                {/* Spotlight Overlay */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                300px circle at ${mouseX}px ${mouseY}px,
                                rgba(99, 102, 241, 0.12),
                                transparent 80%
                            )
                        `,
                    }}
                />
                {/* Accessible stretched button for card click */}
                <button
                    type="button"
                    aria-label={`${displayName} - ${typeName}`}
                    onClick={(e) => {
                        // Let menu open logic work without triggering row click if needed
                        onClick(card)
                    }}
                    onContextMenu={handleContextMenu}
                    className="absolute inset-0 z-0 rounded-xl focus:outline-none"
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(card) } }}
                />

                <div className="relative z-10 flex items-center gap-3 overflow-hidden pointer-events-none">
                    {card.logoUrl ? (
                        <img
                            src={card.logoUrl}
                            alt={displayName}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                        />
                    ) : (
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg backdrop-blur-md bg-(--card-icon-bg) text-(--card-color) transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-sm ring-1 ring-white/20"
                            {...{
                                style: { 
                                    '--card-icon-bg': `${card.color}18`,
                                    '--card-color': card.color
                                } as React.CSSProperties
                            }}
                        >
                            <CardIcon size={20} />
                        </div>
                    )}
                    
                    <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-bold text-vct-text group-hover:text-vct-primary transition-colors">
                            {displayName}
                        </span>
                        <span className="truncate text-xs text-vct-text-muted">
                            {typeName}
                        </span>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 shrink-0">
                    {lastAccess && (
                        <span className="text-[10px] text-vct-text-muted transition-opacity group-hover:opacity-0 md:group-hover:opacity-100 pointer-events-none">
                            {getRelativeTime(lastAccess, t)}
                        </span>
                    )}
                    
                    {/* Quick actions button (visible on hover) */}
                    <button
                        type="button"
                        onClick={handleContextMenu}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-vct-text-muted opacity-0 transition-all hover:bg-slate-100 hover:text-vct-text group-hover:opacity-100 dark:hover:bg-slate-700"
                        title={t('common.actions') || 'Thao tác'}
                        aria-label="Menu"
                    >
                        <VCT_Icons.MoreVertical size={14} />
                    </button>
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
                            className="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95"
                        >
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-vct-text hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                    alert(t('portal.featureComingSoon') || 'Tính năng đang được cập nhật')
                                }}
                            >
                                <VCT_Icons.FileText size={14} />
                                {t('portal.exportExcel') || 'Xuất file Excel'}
                            </button>
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-vct-text hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsContextMenuOpen(false)
                                    alert(t('portal.featureComingSoon') || 'Tính năng đang được cập nhật')
                                }}
                            >
                                <VCT_Icons.Mail size={14} />
                                {t('portal.sendEmail') || 'Gửi thư thông báo'}
                            </button>
                            <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <button
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                onClick={closeContextMenu}
                            >
                                <VCT_Icons.LogOut size={14} />
                                {t('common.close') || 'Đóng'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
