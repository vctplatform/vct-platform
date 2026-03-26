'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Empty State
// Shown when no workspaces, no search results, etc.
// ════════════════════════════════════════════════════════════════

import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'

interface Props {
    variant: 'no-workspaces' | 'no-results' | 'empty-category'
    searchQuery?: string
}

export const PortalEmptyState = ({ variant, searchQuery }: Props) => {
    const { t } = useI18n()

    if (variant === 'no-workspaces') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vct-accent/10">
                    <VCT_Icons.LayoutGrid size={28} className="text-vct-accent" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-vct-text">{t('portal.empty')}</h3>
                    <p className="mt-1 max-w-md text-sm text-vct-text-muted">
                        {t('portal.emptyDesc')}
                    </p>
                </div>
            </div>
        )
    }

    if (variant === 'no-results') {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <VCT_Icons.Search size={32} className="text-vct-text-muted/40" />
                <div>
                    <h3 className="text-sm font-bold text-vct-text">{t('portal.noResults')}</h3>
                    {searchQuery && (
                         <p className="mt-1 text-xs text-vct-text-muted">
                            {t('portal.noResultsDesc')} &ldquo;{searchQuery}&rdquo;
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return null
}
