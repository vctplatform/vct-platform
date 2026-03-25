'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../../components/vct-icons'

interface WelcomeHeaderProps {
    name: string
    count: number
    t: (key: string) => string
}

export function PortalWelcomeHeader({ name, count, t }: WelcomeHeaderProps) {
    const firstName = name.split(' ').pop() ?? name

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-3 inline-flex items-center gap-2 rounded-full border border-vct-border/40 bg-vct-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-vct-primary backdrop-blur-md dark:bg-vct-primary/20 dark:text-vct-accent"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-vct-accent shadow-[0_0_8px_var(--vct-accent)]" />
                    {t('portal.ecosystem')}
                </motion.div>
                <h1 className="bg-linear-to-br from-vct-text via-vct-text to-vct-text-muted bg-clip-text pb-1 text-3xl font-black tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                    {t('portal.welcome')}, <span className="bg-linear-to-r from-vct-accent to-blue-500 bg-clip-text text-transparent">{firstName}</span>
                </h1>
                <p className="mt-2 text-sm text-vct-text-muted/80 sm:text-base">
                    {t('portal.accessCount')} <span className="font-bold text-vct-text">{count} {t('portal.workspaces')}</span> {t('portal.available') || 'trong hệ thống'}.
                </p>
            </div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden items-center gap-2 text-xs text-vct-text-muted/60 sm:flex"
            >
                <span>{t('portal.quickSwitch')}</span>
                <kbd className="flex items-center justify-center rounded-md border border-vct-border/50 bg-vct-border/20 px-2 py-1 text-[10px] font-bold shadow-xs backdrop-blur-sm">
                    ⌘K
                </kbd>
                <span>để tìm kiếm nhanh</span>
            </motion.div>
        </motion.div>
    )
}
