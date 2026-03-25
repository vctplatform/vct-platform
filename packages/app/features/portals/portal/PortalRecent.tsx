'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Recent Workspaces
// Last 5 accessed workspaces with relative timestamps.
// ════════════════════════════════════════════════════════════════

import { VCT_Icons } from '../../components/vct-icons'
import { useI18n } from '../../i18n'
import type { WorkspaceCard } from '../../layout/workspace-types'
import { useWorkspaceStore } from '../../layout/workspace-store'
import { PortalWorkspaceCard } from './PortalWorkspaceCard'

interface Props {
    cards: WorkspaceCard[]
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
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {cards.map((card) => (
                    <div key={card.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
                        <PortalWorkspaceCard card={card} onClick={onClick} />
                    </div>
                ))}
            </div>
        </section>
    )
}
