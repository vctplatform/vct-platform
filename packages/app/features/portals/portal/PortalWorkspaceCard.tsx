'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Workspace Card (Grid view)
// Shows instance name, type, branding, status, badges.
// ════════════════════════════════════════════════════════════════

import * as React from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../../components/vct-icons'
import { useI18n } from '../../i18n'
import { useWorkspaceStore } from '../../layout/workspace-store'
import type { WorkspaceCard } from '../../layout/workspace-types'
import { WORKSPACE_META } from '../../layout/workspace-types'

interface Props {
    card: WorkspaceCard
    onClick: (card: WorkspaceCard) => void
}

function getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Hôm qua'
    if (days < 7) return `${days} ngày trước`
    return `${Math.floor(days / 7)} tuần trước`
}

export const PortalWorkspaceCard = ({ card, onClick }: Props) => {
    const { t } = useI18n()
    const { togglePin, isPinned, lastAccessedMap } = useWorkspaceStore()
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

    return (
        <motion.button
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onClick(card)}
            className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-vct-border/40 bg-white/40 p-6 text-left shadow-xs backdrop-blur-xl transition-all duration-300 hover:border-vct-accent/50 hover:bg-white/60 hover:shadow-2xl hover:shadow-vct-accent/20 focus:outline-none focus:ring-2 focus:ring-vct-accent/30 dark:bg-black/40 dark:hover:bg-black/60"
        >
            {/* Ambient Background Glow Effect inside the card (visible on hover) */}
            <div className="absolute -inset-x-0 -bottom-0 h-1/2 bg-gradient-to-t from-vct-accent/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Top row: icon + pin + badges */}
            <div className="relative flex w-full items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo or icon with premium background */}
                    {card.logoUrl ? (
                        <img
                            src={card.logoUrl}
                            alt={displayName}
                            className="h-10 w-10 rounded-xl object-cover"
                        />
                    ) : (
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${card.color}18` }}
                        >
                            <CardIcon size={20} color={card.color} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-vct-text">{displayName}</div>
                        <div className="truncate text-xs text-vct-text-muted">{typeName}</div>
                    </div>
                </div>

                {/* Pin button */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePin(card.id) }}
                    title={pinned ? t('portal.unpin') : t('portal.pin')}
                    className={`shrink-0 rounded-lg p-1.5 transition-colors ${pinned ? 'text-amber-500' : 'text-vct-text-muted/40 opacity-0 group-hover:opacity-100'} hover:text-amber-500`}
                >
                    <VCT_Icons.Star size={14} />
                </button>
            </div>

            {/* Description */}
            <p className="line-clamp-2 text-xs leading-relaxed text-vct-text-muted">
                {t(card.description)}
            </p>

            {/* Bottom: status + permission + pending + last access */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                {/* Status dot */}
                {status === 'active' && (
                    <span className="flex items-center gap-1 text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Active
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
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-500">
                        {card.pendingActions} pending
                    </span>
                )}

                {/* Spacer */}
                <span className="flex-1" />

                {/* Last access */}
                {lastAccess && (
                    <span className="text-vct-text-muted/70">
                        {getRelativeTime(lastAccess)}
                    </span>
                )}
            </div>
        </motion.button>
    )
}
