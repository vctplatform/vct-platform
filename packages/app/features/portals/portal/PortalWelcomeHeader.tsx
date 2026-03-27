'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Welcome Header v2
// Time-of-day greeting, Vietnamese name handling, static gradient
// ════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'

interface WelcomeHeaderProps {
    name: string
    count: number
    t: (key: string) => string
}

function getTimeGreeting(t: (key: string) => string): { text: string; icon: React.ReactNode } {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
        return {
            text: t('portal.goodMorning') || 'Chào buổi sáng',
            icon: <VCT_Icons.Sun size={20} className="text-amber-400" />,
        }
    }
    if (hour >= 12 && hour < 18) {
        return {
            text: t('portal.goodAfternoon') || 'Chào buổi chiều',
            icon: <VCT_Icons.Sun size={20} className="text-orange-400" />,
        }
    }
    return {
        text: t('portal.goodEvening') || 'Chào buổi tối',
        icon: <VCT_Icons.Moon size={20} className="text-indigo-300" />,
    }
}

export function PortalWelcomeHeader({ name, count, t }: WelcomeHeaderProps) {
    // Vietnamese names: "Nguyễn Văn Quản" → given name is LAST word
    const displayName = useMemo(() => {
        const parts = name.trim().split(/\s+/)
        return parts.length > 1 ? parts[parts.length - 1]! : name
    }, [name])

    const greeting = useMemo(() => getTimeGreeting(t), [t])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
            <div className="min-w-0 flex-1">
                {/* Ecosystem badge */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-vct-accent/20 bg-vct-accent/8 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-vct-accent backdrop-blur-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {t('portal.ecosystem') || 'HỆ SINH THÁI TOÀN DIỆN'}
                </motion.div>

                {/* Time-of-day greeting */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-1 flex items-center gap-2 text-sm text-vct-text-muted"
                >
                    {greeting.icon}
                    <span>{greeting.text}</span>
                </motion.div>

                {/* Main headline */}
                <h1 className="pb-1 text-3xl font-black tracking-tight text-vct-text sm:text-4xl lg:text-5xl">
                    {t('portal.welcome') || 'Chào mừng trở lại'},{' '}
                    <span className="vct-gradient-text">{displayName}</span>
                </h1>

                {/* Sub-info */}
                <p className="mt-2 text-sm text-vct-text-muted sm:text-base">
                    {t('portal.accessCount') || 'Bạn đang có quyền truy cập vào'}{' '}
                    <span className="font-bold text-vct-text">{count} {t('portal.workspaces') || 'workspace'}</span>{' '}
                    {t('portal.available') || 'hợp lệ'}.
                </p>
            </div>

            {/* Quick switch hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="hidden shrink-0 items-center gap-2 text-xs text-vct-text-muted/60 sm:flex"
            >
                <span>{t('portal.quickSwitch') || 'Nhấn để tìm nhanh'}</span>
                <kbd className="flex items-center justify-center rounded-md border border-vct-border/50 bg-vct-border/15 px-2 py-1 text-[10px] font-bold shadow-xs backdrop-blur-sm">
                    ⌘K
                </kbd>
                <span>{t('portal.quickSwitchSuffix') || 'để tìm kiếm nhanh'}</span>
            </motion.div>
        </motion.div>
    )
}
