'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Badge, VCT_Button,
} from 'app/features/components/vct-ui'
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

/* ── Page Component ─────────────────────────────────────────── */

type Tab = 'live' | 'schedule' | 'medals'

export function Page_SpectatorPortal() {
    const [activeTab, setActiveTab] = useState<Tab>('live')
    const status = useRealtimeStatus()
    const { events } = useChannelEvents('public:scores', 20)

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'live', label: 'Trực tiếp', icon: '🔴' },
        { id: 'schedule', label: 'Lịch thi đấu', icon: '📅' },
        { id: 'medals', label: 'Bảng huy chương', icon: '🏅' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0b1120 0%, #162032 100%)' }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="px-4 py-4 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <VCT_Text variant="h1" style={{ color: '#fff', margin: 0 }}>
                    🏆 Giải Vovinam Toàn Quốc 2026
                </VCT_Text>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <VCT_Badge type={status === 'connected' ? 'success' : 'warning'} text={status === 'connected' ? '● LIVE' : '○ Offline'} />
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Cập nhật tự động
                    </VCT_Text>
                </div>
            </div>

            {/* ── Tab Bar ─────────────────────────────────────────── */}
            <div className="flex gap-1 p-2 mx-4 mt-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: activeTab === tab.id ? 'var(--vct-accent-gradient)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            <div className="p-4">
                {activeTab === 'live' && <LiveScoreboard events={events} />}
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'medals' && <MedalTable />}
            </div>
        </div>
    )
}

/* ── Live Scoreboard ────────────────────────────────────────── */

function LiveScoreboard({ events }: { events: any[] }) {
    const [matches, setMatches] = useState(DEMO_MATCHES)

    // Process incoming realtime score updates
    useEffect(() => {
        if (events.length === 0) return

        const latestInfo = events[0]
        if (latestInfo.action === 'score_update' && latestInfo.payload) {
            const { matchId, redScore, blueScore } = latestInfo.payload
            setMatches(prev => prev.map(m =>
                m.id === matchId
                    ? { ...m, scoreRed: redScore ?? m.scoreRed, scoreBlue: blueScore ?? m.scoreBlue }
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
                    <VCT_Text variant="h2" style={{ color: '#fff', marginBottom: '0.75rem' }}>
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
        </div>
    )
}

function MatchScoreCard({ match, live }: { match: typeof DEMO_MATCHES[0]; live: boolean }) {
    return (
        <div
            className="rounded-xl p-4"
            style={{
                background: live ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                border: live ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
        >
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
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>{match.red}</div>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{match.teamRed}</VCT_Text>
                </div>
                <div className="text-center px-4">
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>
                        <span style={{ color: '#ef4444' }}>{match.scoreRed}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.25rem' }}>-</span>
                        <span style={{ color: '#3b82f6' }}>{match.scoreBlue}</span>
                    </div>
                </div>
                <div className="flex-1 text-right">
                    <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: '1rem' }}>{match.blue}</div>
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
            <VCT_Text variant="h2" style={{ color: '#fff', marginBottom: '0.75rem' }}>
                📅 Lịch thi đấu hôm nay
            </VCT_Text>
            <div className="grid gap-2">
                {DEMO_SCHEDULE.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 rounded-xl px-4 py-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div style={{ color: 'var(--vct-accent-cyan)', fontWeight: 700, fontFamily: 'monospace', minWidth: '3.5rem' }}>
                            {item.time}
                        </div>
                        <div className="flex-1">
                            <div style={{ color: '#fff', fontWeight: 600 }}>{item.category}</div>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {item.arena} · {item.vong}
                            </VCT_Text>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Medal Table ────────────────────────────────────────────── */

function MedalTable() {
    return (
        <div>
            <VCT_Text variant="h2" style={{ color: '#fff', marginBottom: '0.75rem' }}>
                🏅 Bảng huy chương
            </VCT_Text>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-5 gap-2 px-4 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>#</VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>Đoàn</VCT_Text>
                    <VCT_Text variant="small" style={{ color: '#fbbf24', textAlign: 'center' }}>🥇</VCT_Text>
                    <VCT_Text variant="small" style={{ color: '#94a3b8', textAlign: 'center' }}>🥈</VCT_Text>
                    <VCT_Text variant="small" style={{ color: '#cd7f32', textAlign: 'center' }}>🥉</VCT_Text>
                </div>
                {DEMO_MEDALS.map((row, i) => (
                    <div
                        key={row.team}
                        className="grid grid-cols-5 gap-2 px-4 py-3"
                        style={{
                            background: i === 0 ? 'rgba(251,191,36,0.06)' : 'transparent',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{i + 1}</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{row.team}</div>
                        <div style={{ color: '#fbbf24', fontWeight: 700, textAlign: 'center' }}>{row.gold}</div>
                        <div style={{ color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>{row.silver}</div>
                        <div style={{ color: '#cd7f32', fontWeight: 700, textAlign: 'center' }}>{row.bronze}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
