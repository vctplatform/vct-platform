'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Badge } from '@vct/ui'
import { useChannelEvents, useRealtimeStatus } from 'app/features/data/repository/realtime-client'

/* ── Demo Data ──────────────────────────────────────────────── */

const DEMO_MATCHES = [
    { id: '1', red: 'Nguyễn Văn A', blue: 'Trần Văn B', teamRed: 'Hà Nội', teamBlue: 'TP.HCM', scoreRed: 12, scoreBlue: 9, status: 'dang_dau', round: 2, arena: 'Sân A1', category: 'Đối kháng Nam 60kg' },
    { id: '2', red: 'Lê Thị C', blue: 'Phạm Thị D', teamRed: 'Đà Nẵng', teamBlue: 'Huế', scoreRed: 8, scoreBlue: 8, status: 'dang_dau', round: 1, arena: 'Sân A2', category: 'Đối kháng Nữ 52kg' },
    { id: '3', red: 'Hoàng Văn E', blue: 'Vũ Văn F', teamRed: 'Hải Phòng', teamBlue: 'Nghệ An', scoreRed: 15, scoreBlue: 10, status: 'ket_thuc', round: 3, arena: 'Sân B1', category: 'Đối kháng Nam 68kg' },
]

const DEMO_MEDALS = [
    { team: 'Hà Nội', gold: 5, silver: 3, bronze: 2 },
    { team: 'TP.HCM', gold: 4, silver: 4, bronze: 3 },
    { team: 'Đà Nẵng', gold: 3, silver: 2, bronze: 4 },
    { team: 'Huế', gold: 2, silver: 3, bronze: 1 },
    { team: 'Hải Phòng', gold: 1, silver: 2, bronze: 3 },
]

const DEMO_SCHEDULE = [
    { time: '08:00', category: 'Đối kháng Nam 56kg', arena: 'Sân A1', vong: 'Vòng loại' },
    { time: '09:30', category: 'Quyền Nam', arena: 'Sân B1', vong: 'Chung kết' },
    { time: '10:00', category: 'Đối kháng Nữ 52kg', arena: 'Sân A2', vong: 'Bán kết' },
    { time: '14:00', category: 'Đối kháng Nam 68kg', arena: 'Sân A1', vong: 'Tứ kết' },
    { time: '15:30', category: 'Quyền Nữ', arena: 'Sân B1', vong: 'Chung kết' },
]

/* ── Animation variants ────────────────────────────────────── */
const tabContentVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

/* ── Page Component ─────────────────────────────────────────── */

type Tab = 'live' | 'schedule' | 'medals' | 'search' | 'stats'

export function Page_SpectatorPortal() {
    const [activeTab, setActiveTab] = useState<Tab>('live')
    const status = useRealtimeStatus()
    const { events } = useChannelEvents('public:scores', 20)

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'live', label: 'Trực tiếp', icon: '🔴' },
        { id: 'schedule', label: 'Lịch thi', icon: '📅' },
        { id: 'medals', label: 'Huy chương', icon: '🏅' },
        { id: 'search', label: 'Tìm VĐV', icon: '🔍' },
        { id: 'stats', label: 'Thống kê', icon: '📊' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0b1120 0%, #162032 100%)' }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="px-4 py-4 text-center"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
                <VCT_Text variant="h1" style={{ color: 'var(--vct-bg-elevated)', margin: 0 }}>
                    🏆 Giải Vovinam Toàn Quốc 2026
                </VCT_Text>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <VCT_Badge type={status === 'connected' ? 'success' : 'warning'} text={status === 'connected' ? '● LIVE' : '○ Offline'} />
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Cập nhật tự động
                    </VCT_Text>
                </div>
            </motion.div>

            {/* ── Tab Bar ─────────────────────────────────────────── */}
            <div className="relative flex gap-1 p-2 mx-4 mt-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="relative flex-1 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer z-10"
                        style={{
                            color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                            background: 'transparent',
                        }}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="spectator-tab-bg"
                                className="absolute inset-0 rounded-lg shadow-lg"
                                style={{ background: 'var(--vct-accent-gradient, linear-gradient(135deg, #3b82f6, #8b5cf6))' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.icon} {tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'live' && <motion.div key="live" variants={tabContentVariants} initial="initial" animate="animate" exit="exit"><LiveScoreboard events={events} status={status} /></motion.div>}
                    {activeTab === 'schedule' && <motion.div key="schedule" variants={tabContentVariants} initial="initial" animate="animate" exit="exit"><ScheduleView /></motion.div>}
                    {activeTab === 'medals' && <motion.div key="medals" variants={tabContentVariants} initial="initial" animate="animate" exit="exit"><MedalTable /></motion.div>}
                    {activeTab === 'search' && <motion.div key="search" variants={tabContentVariants} initial="initial" animate="animate" exit="exit"><AthleteSearch /></motion.div>}
                    {activeTab === 'stats' && <motion.div key="stats" variants={tabContentVariants} initial="initial" animate="animate" exit="exit"><TournamentStats /></motion.div>}
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ── Live Scoreboard ────────────────────────────────────────── */

function LiveScoreboard({ events, status }: { events: unknown[]; status: string }) {
    const [matches, setMatches] = useState(DEMO_MATCHES)

    // Auto-refresh fallback when WS offline: poll every 15s
    useEffect(() => {
        if (status === 'connected') return
        const interval = setInterval(() => {
            fetch('/api/v1/public/scoreboard')
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setMatches(data) })
                .catch(() => {/* silent */ })
        }, 15000)
        return () => clearInterval(interval)
    }, [status])

    useEffect(() => {
        if (!Array.isArray(events) || events.length === 0) return
        const latestInfo = events[0] as Record<string, unknown>
        if (latestInfo.action === 'score_update' && latestInfo.payload) {
            const payload = latestInfo.payload as Record<string, unknown>
            const { matchId, redScore, blueScore } = payload
            setMatches(prev => prev.map(m =>
                m.id === matchId
                    ? { ...m, scoreRed: (redScore as number) ?? m.scoreRed, scoreBlue: (blueScore as number) ?? m.scoreBlue }
                    : m
            ))
        }
    }, [events])

    const liveMatches = matches.filter((m) => m.status === 'dang_dau')
    const finishedMatches = matches.filter((m) => m.status === 'ket_thuc')

    return (
        <div>
            {liveMatches.length > 0 && (
                <>
                    <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                        🔴 Đang diễn ra
                    </VCT_Text>
                    <div className="grid gap-3 mb-6">
                        {liveMatches.map((match) => (
                            <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <MatchScoreCard match={match} live />
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
            {finishedMatches.length > 0 && (
                <>
                    <VCT_Text variant="h2" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>
                        ✅ Đã kết thúc
                    </VCT_Text>
                    <div className="grid gap-3">
                        {finishedMatches.map((match) => (
                            <MatchScoreCard key={match.id} match={match} live={false} />
                        ))}
                    </div>
                </>
            )}
            {liveMatches.length === 0 && finishedMatches.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">🏟️</div>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Chưa có trận đấu nào
                    </VCT_Text>
                </div>
            )}
        </div>
    )
}

function MatchScoreCard({ match, live }: { match: typeof DEMO_MATCHES[0]; live: boolean }) {
    return (
        <div className="rounded-xl p-4" style={{
            background: live ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
            border: live ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
        }}>
            <div className="flex items-center justify-between mb-1">
                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {match.arena} · {match.category}
                </VCT_Text>
                {live && (
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <VCT_Badge type="danger" text={`Hiệp ${match.round}`} />
                    </motion.div>
                )}
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="flex-1 text-left">
                    <div style={{ color: 'var(--vct-danger)', fontWeight: 700 }}>{match.red}</div>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{match.teamRed}</VCT_Text>
                </div>
                <div className="text-center px-4">
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--vct-bg-elevated)', letterSpacing: '0.1em' }}>
                        <span style={{ color: 'var(--vct-danger)' }}>{match.scoreRed}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.25rem' }}>-</span>
                        <span style={{ color: 'var(--vct-info)' }}>{match.scoreBlue}</span>
                    </div>
                </div>
                <div className="flex-1 text-right">
                    <div style={{ color: 'var(--vct-info)', fontWeight: 700 }}>{match.blue}</div>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{match.teamBlue}</VCT_Text>
                </div>
            </div>
        </div>
    )
}

/* ── Schedule View ──────────────────────────────────────────── */

function ScheduleView() {
    return (
        <div>
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                📅 Lịch thi đấu hôm nay
            </VCT_Text>
            <div className="grid gap-2">
                {DEMO_SCHEDULE.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-4 rounded-xl px-4 py-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div style={{ color: 'var(--vct-accent-cyan)', fontWeight: 700, fontFamily: 'monospace', minWidth: '3.5rem' }}>
                            {item.time}
                        </div>
                        <div className="flex-1">
                            <div style={{ color: 'var(--vct-bg-elevated)', fontWeight: 600 }}>{item.category}</div>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {item.arena} · {item.vong}
                            </VCT_Text>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

/* ── Medal Table ────────────────────────────────────────────── */

function MedalTable() {
    return (
        <div>
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                🏅 Bảng huy chương
            </VCT_Text>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-5 gap-2 px-4 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>#</VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>Đoàn</VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'var(--vct-warning)', textAlign: 'center' }}>🥇</VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', textAlign: 'center' }}>🥈</VCT_Text>
                    <VCT_Text variant="small" style={{ color: '#cd7f32', textAlign: 'center' }}>🥉</VCT_Text>
                </div>
                {DEMO_MEDALS.map((row, i) => (
                    <motion.div
                        key={row.team}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="grid grid-cols-5 gap-2 px-4 py-3"
                        style={{
                            background: i === 0 ? 'rgba(251,191,36,0.06)' : 'transparent',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{i + 1}</div>
                        <div style={{ color: 'var(--vct-bg-elevated)', fontWeight: 600 }}>{row.team}</div>
                        <div style={{ color: 'var(--vct-warning)', fontWeight: 700, textAlign: 'center' }}>{row.gold}</div>
                        <div style={{ color: 'var(--vct-text-tertiary)', fontWeight: 700, textAlign: 'center' }}>{row.silver}</div>
                        <div style={{ color: '#cd7f32', fontWeight: 700, textAlign: 'center' }}>{row.bronze}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

/* ── Athlete Search ────────────────────────────────────────── */

interface SearchAthlete {
    id: string; ho_ten: string; club: string; belt: string; province: string
}

const DEMO_ATHLETES: SearchAthlete[] = [
    { id: 'ATH-001', ho_ten: 'Nguyễn Văn An', club: 'CLB Thanh Long', belt: 'Hoàng đai', province: 'TP.HCM' },
    { id: 'ATH-002', ho_ten: 'Nguyễn Thị Bình', club: 'CLB Thanh Long', belt: 'Lam đai', province: 'TP.HCM' },
    { id: 'ATH-003', ho_ten: 'Trần Minh Đức', club: 'CLB Bạch Hổ', belt: 'Vàng đai 1', province: 'Hà Nội' },
    { id: 'ATH-004', ho_ten: 'Lê Thị Cẩm Tú', club: 'CLB Phượng Hoàng', belt: 'Hoàng đai', province: 'Đà Nẵng' },
    { id: 'ATH-005', ho_ten: 'Phạm Quốc Anh', club: 'CLB Rồng Vàng', belt: 'Lam đai 2', province: 'Bình Dương' },
]

function AthleteSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchAthlete[]>(DEMO_ATHLETES)
    const [searching, setSearching] = useState(false)

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults(DEMO_ATHLETES)
            return
        }
        setSearching(true)
        try {
            const res = await fetch(`/api/v1/public/athletes/search?q=${encodeURIComponent(q)}`)
            if (res.ok) {
                const data = await res.json()
                setResults(data)
            } else {
                // Fallback to local filter
                setResults(DEMO_ATHLETES.filter(a =>
                    a.ho_ten.toLowerCase().includes(q.toLowerCase())
                ))
            }
        } catch {
            // Fallback to local filter
            setResults(DEMO_ATHLETES.filter(a =>
                a.ho_ten.toLowerCase().includes(q.toLowerCase())
            ))
        } finally {
            setSearching(false)
        }
    }, [])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => doSearch(query), 300)
        return () => clearTimeout(timer)
    }, [query, doSearch])

    return (
        <div>
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                🔍 Tìm kiếm vận động viên
            </VCT_Text>
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Nhập tên VĐV..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'var(--vct-bg-elevated)',
                        outline: 'none',
                    }}
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                        ⏳
                    </div>
                )}
            </div>
            <div className="grid gap-3">
                {results.map((athlete, i) => (
                    <motion.div
                        key={athlete.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className="flex items-center gap-4 rounded-xl p-4"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', fontSize: '1.5rem' }}>
                                🥋
                            </div>
                            <div className="flex-1">
                                <div style={{ color: 'var(--vct-bg-elevated)', fontWeight: 600 }}>{athlete.ho_ten}</div>
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {athlete.club} · {athlete.province}
                                </VCT_Text>
                            </div>
                            <VCT_Badge type="info" text={athlete.belt} />
                        </div>
                    </motion.div>
                ))}
                {results.length === 0 && (
                    <div className="text-center py-8">
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Không tìm thấy VĐV nào khớp &quot;{query}&quot;
                        </VCT_Text>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ── Tournament Stats ──────────────────────────────────────── */

function TournamentStats() {
    const [stats, setStats] = useState([
        { label: 'Vận động viên', value: 324, icon: '🥋', color: 'var(--vct-info)' },
        { label: 'Trận đấu', value: 186, icon: '⚔️', color: 'var(--vct-danger)' },
        { label: 'Huy chương', value: 96, icon: '🏅', color: 'var(--vct-warning)' },
        { label: 'Đoàn', value: 42, icon: '🏢', color: 'var(--vct-info)' },
        { label: 'Hạng mục', value: 12, icon: '📋', color: 'var(--vct-success)' },
        { label: 'Sân đấu', value: 6, icon: '🏟️', color: 'var(--vct-accent-cyan)' },
    ])

    // Try to fetch real stats from API
    useEffect(() => {
        fetch('/api/v1/public/stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) setStats(data)
            })
            .catch(() => {/* keep demo data */ })
    }, [])

    return (
        <div>
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                📊 Thống kê giải đấu
            </VCT_Text>
            <div className="rounded-xl p-5 mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ color: 'var(--vct-bg-elevated)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    🏆 Giải Vovinam Toàn Quốc 2026
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        📅 15–20/03/2026
                    </VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        📍 Nhà thi đấu Phú Thọ, TP.HCM
                    </VCT_Text>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, idx) => (
                    <motion.div key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                    >
                        <div className="rounded-xl p-4 cursor-default"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</VCT_Text>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
