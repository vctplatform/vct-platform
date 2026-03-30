'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Grand Lobby Welcome Header v3
// Dramatic hero section: large typography, decorative accents,
// animated badge, time greeting, and keyboard shortcut hint.
// ════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'

interface WelcomeHeaderProps {
    name: string
    count: number
    t: (key: string) => string
}

function getTimeGreeting(t: (key: string) => string): { text: string; icon: React.ReactNode; period: string } {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
        return {
            text: t('portal.goodMorning') || 'Chào buổi sáng',
            icon: <VCT_Icons.Sun size={18} className="text-amber-400" />,
            period: 'morning',
        }
    }
    if (hour >= 12 && hour < 18) {
        return {
            text: t('portal.goodAfternoon') || 'Chào buổi chiều',
            icon: <VCT_Icons.Sun size={18} className="text-orange-400" />,
            period: 'afternoon',
        }
    }
    return {
        text: t('portal.goodEvening') || 'Chào buổi tối',
        icon: <VCT_Icons.Moon size={18} className="text-indigo-300" />,
        period: 'evening',
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 flex flex-col items-center text-center lg:items-start lg:text-left"
        >
            {/* Ecosystem badge — with live pulse */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-300 backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.08)]"
            >
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('portal.ecosystem') || 'VCT ECOSYSTEM'}
                <span className="h-3 w-px bg-indigo-400/30" />
                <span className="text-emerald-400 font-bold">{t('portal.online') || 'ONLINE'}</span>
            </motion.div>

            {/* Time-of-day greeting — subtle accent */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-3 flex items-center gap-2 text-sm text-white/40"
            >
                {greeting.icon}
                <span className="font-medium">{greeting.text}</span>
            </motion.div>

            {/* ── Main Headline — The Grand Statement ── */}
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
                <span className="block">{t('portal.welcome') || 'Chào mừng trở lại'},</span>
                <span className="portal-gradient-name">{displayName}</span>
            </h1>

            {/* Decorative divider line */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="my-6 h-[1px] w-24 origin-left lg:w-32"
                style={{
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.6), rgba(168,85,247,0.3), transparent)',
                }}
            />

            {/* Sub-info with workspace count */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-md text-sm leading-relaxed text-white/40 sm:text-base lg:text-lg"
            >
                {t('portal.lobbyMessage') || 'Chọn không gian làm việc bên dưới để bắt đầu.'}{' '}
                <span className="font-semibold text-white/70">{count} {t('portal.workspaces') || 'workspace'}</span>{' '}
                {t('portal.available') || 'khả dụng'}.
            </motion.p>

            {/* Quick switch keyboard hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 hidden items-center gap-2.5 text-xs text-white/25 sm:flex"
            >
                <kbd className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                    ⌘K
                </kbd>
                <span>{t('portal.quickSwitchSuffix') || 'để tìm kiếm nhanh'}</span>
            </motion.div>

            <style>{`
                .portal-gradient-name {
                    background: linear-gradient(
                        135deg,
                        #818cf8 0%,
                        #a78bfa 25%,
                        #c084fc 50%,
                        #818cf8 75%,
                        #6366f1 100%
                    );
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: portalGradientShift 6s ease-in-out infinite;
                }
                @keyframes portalGradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50%      { background-position: 100% 50%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .portal-gradient-name { animation: none; }
                }
            `}</style>
        </motion.div>
    )
}
