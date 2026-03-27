'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Empty State v2 (Animated Illustrations)
// Premium empty states with CSS-only floating shapes + actionable CTAs
// ════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'

interface Props {
    variant: 'no-workspaces' | 'no-results' | 'empty-category'
    searchQuery?: string
}

function FloatingShapes() {
    return (
        <div className="relative h-28 w-28" aria-hidden="true">
            {/* Floating circle */}
            <motion.div
                animate={{ y: [-4, 4, -4], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-4 top-4 h-14 w-14 rounded-xl border border-vct-accent/20 bg-vct-accent/5"
            />
            {/* Floating square */}
            <motion.div
                animate={{ y: [3, -3, 3], rotate: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute right-2 top-0 h-10 w-10 rounded-full border border-purple-500/20 bg-purple-500/5"
            />
            {/* Floating dot */}
            <motion.div
                animate={{ y: [-2, 2, -2], x: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-4 left-8 h-5 w-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-lg backdrop-blur-md">
                    <VCT_Icons.LayoutGrid size={24} className="text-vct-accent" />
                </div>
            </div>
        </div>
    )
}

export const PortalEmptyState = ({ variant, searchQuery }: Props) => {
    const { t } = useI18n()

    if (variant === 'no-workspaces') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-6 py-24 text-center"
            >
                <FloatingShapes />
                <div>
                    <h3 className="text-lg font-bold text-vct-text">
                        {t('portal.empty') || 'Chưa có Workspace nào'}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-vct-text-muted leading-relaxed">
                        {t('portal.emptyDesc') || 'Bạn chưa được cấp quyền truy cập vào workspace nào. Vui lòng liên hệ Quản trị viên hệ thống.'}
                    </p>
                </div>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-vct-accent/20 bg-vct-accent/8 px-5 py-2.5 text-sm font-semibold text-vct-accent transition-all hover:bg-vct-accent/15 hover:shadow-[0_0_15px_rgba(var(--vct-accent-cyan),0.2)]"
                >
                    <VCT_Icons.Mail size={16} />
                    {t('portal.contactAdmin') || 'Liên hệ Quản trị'}
                </button>
            </motion.div>
        )
    }

    if (variant === 'no-results') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20 text-center"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <VCT_Icons.Search size={28} className="text-vct-text-muted/40" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-vct-text">
                        {t('portal.noResults') || 'Không tìm thấy kết quả'}
                    </h3>
                    {searchQuery && (
                        <p className="mt-1.5 text-xs text-vct-text-muted">
                            {t('portal.noResultsDesc') || 'Không tìm thấy workspace phù hợp với từ khóa'}{' '}
                            <span className="font-semibold text-vct-accent">&ldquo;{searchQuery}&rdquo;</span>
                        </p>
                    )}
                </div>
            </motion.div>
        )
    }

    if (variant === 'empty-category') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                    <VCT_Icons.Layers size={20} className="text-vct-text-muted/40" />
                </div>
                <p className="text-xs text-vct-text-muted">
                    {t('portal.emptyCategoryDesc') || 'Danh mục này chưa có workspace nào.'}
                </p>
            </motion.div>
        )
    }

    return null
}
