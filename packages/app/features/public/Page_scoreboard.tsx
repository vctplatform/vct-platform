'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Badge } from 'app/features/components/vct-ui'
import { useChannelEvents, useRealtimeStatus } from 'app/features/data/repository/realtime-client'
import { UI_Logo } from 'app/features/components/ui-logo'

/* ── Demo Data ──────────────────────────────────────────────── */

const DEMO_MATCHES = [
    { id: '1', red: 'Nguyễn Văn A', blue: 'Trần Văn B', teamRed: 'Hà Nội', teamBlue: 'TP.HCM', scoreRed: 0, scoreBlue: 0, status: 'dang_dau', round: 1, arena: 'Sân A1', category: 'Đối kháng Nam 60kg' },
    { id: '2', red: 'Lê Thị C', blue: 'Phạm Thị D', teamRed: 'Đà Nẵng', teamBlue: 'Huế', scoreRed: 0, scoreBlue: 0, status: 'dang_dau', round: 1, arena: 'Sân A2', category: 'Đối kháng Nữ 52kg' },
]

export function Page_Scoreboard() {
    const status = useRealtimeStatus()
    const { events } = useChannelEvents('public:scores', 20)
    const [matches, setMatches] = useState(DEMO_MATCHES)
    const [activeIndex, setActiveIndex] = useState(0)

    // Process incoming realtime score updates
    useEffect(() => {
        if (events.length === 0) return

        const latestInfo = events[0]
        if (!latestInfo) return

        if (latestInfo.action === 'score_update' && latestInfo.payload) {
            const payload = latestInfo.payload as any
            const matchId = payload.matchId
            const redScore = payload.redScore as number | undefined
            const blueScore = payload.blueScore as number | undefined
            setMatches(prev => prev.map(m =>
                m.id === matchId
                    ? { ...m, scoreRed: redScore ?? m.scoreRed, scoreBlue: blueScore ?? m.scoreBlue }
                    : m
            ))
        }
    }, [events])

    // Auto-rotate matches every 10 seconds if there are multiple
    useEffect(() => {
        if (matches.length <= 1) return
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % matches.length)
        }, 10000)
        return () => clearInterval(timer)
    }, [matches.length])

    const activeMatch = matches[activeIndex]

    if (!activeMatch) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <VCT_Text variant="h1" style={{ color: 'var(--vct-text-tertiary)' }}>Không có trận đấu nào đang diễn ra</VCT_Text>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col overflow-hidden bg-black text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-4">
                    <UI_Logo size={48} />
                    <div>
                        <VCT_Text variant="h2" style={{ margin: 0, color: '#fff', letterSpacing: '0.05em' }}>GIẢI VOVINAM TOÀN QUỐC 2026</VCT_Text>
                        <VCT_Text variant="body" style={{ color: 'var(--vct-accent-cyan)' }}>{activeMatch.category} - {activeMatch.arena}</VCT_Text>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <VCT_Text variant="h3" style={{ margin: 0, color: '#fff' }}>Hiệp {activeMatch.round}</VCT_Text>
                        <VCT_Badge type={status === 'connected' ? 'success' : 'danger'} text={status === 'connected' ? 'LIVE' : 'OFFLINE'} />
                    </div>
                </div>
            </header>

            {/* Main Scoreboard Area */}
            <main className="flex-1 relative flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeMatch.id}
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* RED Corner */}
                        <div className="flex flex-col rounded-3xl overflow-hidden border-4 border-red-600 bg-red-950/30 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                            <div className="bg-red-600 p-6 text-center">
                                <VCT_Text variant="h1" style={{ fontSize: '3rem', margin: 0, color: '#fff', fontWeight: 900 }}>{activeMatch.red}</VCT_Text>
                                <VCT_Text variant="h3" style={{ color: 'rgba(255,255,255,0.8)' }}>{activeMatch.teamRed}</VCT_Text>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-12">
                                <span style={{ fontSize: '12rem', fontWeight: 900, lineHeight: 1, color: '#ef4444' }}>
                                    {activeMatch.scoreRed}
                                </span>
                            </div>
                        </div>

                        {/* VS Divider & Timer */}
                        <div className="flex flex-col items-center justify-center gap-8 py-12">
                            <div className="font-black italic text-gray-600" style={{ fontSize: '4rem' }}>VS</div>

                            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center w-full shadow-xl">
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Thời gian</VCT_Text>
                                <div style={{ fontSize: '5rem', fontWeight: 700, fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>
                                    02:00
                                </div>
                            </div>

                            {/* Paginator if multiple matches */}
                            {matches.length > 1 && (
                                <div className="flex gap-2 mt-8">
                                    {matches.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-2 rounded-full transition-all duration-500 ${idx === activeIndex ? 'w-12 bg-white' : 'w-4 bg-gray-700'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BLUE Corner */}
                        <div className="flex flex-col rounded-3xl overflow-hidden border-4 border-blue-600 bg-blue-950/30 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                            <div className="bg-blue-600 p-6 text-center">
                                <VCT_Text variant="h1" style={{ fontSize: '3rem', margin: 0, color: '#fff', fontWeight: 900 }}>{activeMatch.blue}</VCT_Text>
                                <VCT_Text variant="h3" style={{ color: 'rgba(255,255,255,0.8)' }}>{activeMatch.teamBlue}</VCT_Text>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-12">
                                <span style={{ fontSize: '12rem', fontWeight: 900, lineHeight: 1, color: '#3b82f6' }}>
                                    {activeMatch.scoreBlue}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
