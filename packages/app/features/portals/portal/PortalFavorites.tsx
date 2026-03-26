'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Favorites Section
// Pinned/starred workspaces shown at top of portal.
// ════════════════════════════════════════════════════════════════

import { Reorder } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import type { WorkspaceCard } from '../../layout/workspace-types'
import { WORKSPACE_META } from '../../layout/workspace-types'
import { useWorkspaceStore } from '../../layout/workspace-store'

interface Props {
    cards: WorkspaceCard[]
    onClick: (card: WorkspaceCard) => void
}

export const PortalFavorites = ({ cards, onClick }: Props) => {
    const { t } = useI18n()
    const { reorderPinnedWorkspaces } = useWorkspaceStore()

    if (cards.length === 0) return null

    const handleReorder = (newCards: WorkspaceCard[]) => {
        reorderPinnedWorkspaces(newCards.map(c => c.id))
    }

    return (
        <section aria-label={t('portal.favorites')}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-500">
                <VCT_Icons.Grip size={14} className="opacity-50" />
                {t('portal.favorites')} ({cards.length})
                <span className="ml-2 text-[10px] font-normal normal-case text-vct-text-muted opacity-50 hidden sm:inline">(Kéo thả để sắp xếp)</span>
            </h2>
            <Reorder.Group 
                axis="x" 
                values={cards} 
                onReorder={handleReorder} 
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin outline-none"
                as="ul"
            >
                {cards.map((card) => {
                    const meta = WORKSPACE_META[card.type]
                    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
                    const CardIcon = iconMap[card.icon] ?? iconMap[meta?.icon ?? 'Activity'] ?? VCT_Icons.Activity
                    const displayName = card.scope.name && card.scope.name !== card.label
                        ? t(card.scope.name)
                        : t(card.label)

                    return (
                        <Reorder.Item 
                            key={card.id} 
                            value={card} 
                            as="li"
                            className="shrink-0 outline-none"
                            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                        >
                            <button
                                type="button"
                                onClick={() => onClick(card)}
                                className="group cursor-grab active:cursor-grabbing flex min-w-[180px] select-none items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 w-full outline-none"
                            >
                                {card.logoUrl ? (
                                    <img src={card.logoUrl} alt="" className="pointer-events-none h-8 w-8 rounded-lg object-cover" />
                                ) : (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--card-bg) text-(--card-color)"
                                        style={{ 
                                            '--card-bg': `${card.color}20`,
                                            '--card-color': card.color
                                        } as React.CSSProperties}
                                    >
                                        <CardIcon size={16} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 pointer-events-none">
                                    <div className="truncate text-sm font-bold text-vct-text">{displayName}</div>
                                    <div className="truncate text-[11px] text-vct-text-muted">{t(meta?.label ?? '')}</div>
                                </div>
                                {(card.pendingActions ?? 0) > 0 && (
                                    <span className="pointer-events-none flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {card.pendingActions}
                                    </span>
                                )}
                            </button>
                        </Reorder.Item>
                    )
                })}
            </Reorder.Group>
        </section>
    )
}
