'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function PortalBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
            {/* Grain Texture Overlay for realism */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div className="absolute inset-0 z-10 opacity-[0.03] mix-blend-overlay dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

            {/* Dark mode friendly base glow */}
            <div className="absolute inset-0 bg-(--vct-bg-base) opacity-50 transition-colors duration-500" />
            
            {/* Massive Mesh Gradient Orbs with slow organic animation */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: 1, 
                    scale: [1, 1.1, 1],
                    x: ['0%', '5%', '-5%', '0%'],
                    y: ['0%', '-5%', '5%', '0%'],
                }}
                transition={{ 
                    opacity: { duration: 2, ease: 'easeOut' },
                    scale: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
                    x: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                    y: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-[100%] bg-linear-to-br from-blue-600/30 via-indigo-500/20 to-cyan-400/10 blur-[140px] mix-blend-multiply dark:mix-blend-screen" 
            />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: 1, 
                    scale: [1, 1.15, 1],
                    x: ['0%', '-8%', '6%', '0%'],
                    y: ['0%', '8%', '-6%', '0%'],
                }}
                transition={{ 
                    opacity: { duration: 2, delay: 0.5, ease: 'easeOut' },
                    scale: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                    x: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
                    y: { duration: 28, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="absolute top-[20%] -right-[15%] h-[60vh] w-[60vw] rounded-[100%] bg-linear-to-bl from-purple-500/20 via-pink-500/15 to-rose-400/10 blur-[130px] mix-blend-multiply dark:mix-blend-screen" 
            />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: 1, 
                    scale: [1, 1.05, 1],
                    x: ['0%', '4%', '-4%', '0%'],
                    y: ['0%', '-4%', '6%', '0%'],
                }}
                transition={{ 
                    opacity: { duration: 2, delay: 1, ease: 'easeOut' },
                    scale: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
                    x: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                    y: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="absolute -bottom-[20%] left-[10%] h-[60vh] w-[80vw] rounded-[100%] bg-linear-to-tr from-cyan-500/20 via-blue-500/15 to-emerald-400/10 blur-[150px] mix-blend-multiply dark:mix-blend-screen" 
            />
        </div>
    )
}
