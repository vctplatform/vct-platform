'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Recent Workspaces
// Last 5 accessed workspaces with relative timestamps.
// ════════════════════════════════════════════════════════════════

import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import type { WorkspaceCard } from '../../layout/workspace-types'
import { useWorkspaceStore } from '../../layout/workspace-store'
import { PortalRecentCard } from './PortalRecentCard'

interface Props {
    cards: WorkspaceCard[]
    onClick: (card: WorkspaceCard) => void
}

export const PortalRecent = ({ cards, onClick }: Props) => {
    const { t } = useI18n()
    const { lastAccessedMap } = useWorkspaceStore()

    if (cards.length === 0) return null

    return (
        <section aria-label={t('portal.recent')}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-vct-text-muted">
                <VCT_Icons.Clock size={14} />
                {t('portal.recent')}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
                {cards.map((card) => (
                    <div key={card.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
                        <PortalRecentCard card={card} onClick={onClick} />
                    </div>
                ))}
            </div>
        </section>
    )
}
