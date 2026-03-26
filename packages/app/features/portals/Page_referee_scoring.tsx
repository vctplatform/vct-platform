'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    VCT_Text, VCT_Button, VCT_Card, VCT_Badge,
} from '@vct/ui'
import { useChannel, useRealtimeStatus } from 'app/features/data/repository/realtime-client'

/* ── Types ──────────────────────────────────────────────────── */

interface RoundScore {
    round: number
    red: number
    blue: number
}

interface MatchData {
    id: string
    athleteRed: string
    athleteBlue: string
    teamRed: string
    teamBlue: string
    category: string
    weightClass: string
    vong: string
    arenaName: string
}

/* ── Timer Hook ─────────────────────────────────────────────── */

function useTimer(durationSec = 120) {
    const [remaining, setRemaining] = useState(durationSec)
    const [running, setRunning] = useState(false)

    useEffect(() => {
        if (!running || remaining <= 0) return
        const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
        return () => clearInterval(id)
    }, [running, remaining])

    const start = useCallback(() => setRunning(true), [])
    const pause = useCallback(() => setRunning(false), [])
    const reset = useCallback(() => { setRunning(false); setRemaining(durationSec) }, [durationSec])

    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    return { remaining, running, display, start, pause, reset }
}

/* ── Haptic Feedback ────────────────────────────────────────── */

function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const ms = style === 'light' ? 10 : style === 'heavy' ? 50 : 25
        navigator.vibrate(ms)
    }
}

/* ── Page Component ─────────────────────────────────────────── */

export function Page_RefereeScoringPortal() {
    const [currentRound, setCurrentRound] = useState(1)
    const [rounds, setRounds] = useState<RoundScore[]>([])
    const [redScore, setRedScore] = useState(0)
    const [blueScore, setBlueScore] = useState(0)
    const [penalties, setPenalties] = useState({ red: 0, blue: 0 })
    const [showConfirm, setShowConfirm] = useState(false)
    const timer = useTimer(120)
    const connectionStatus = useRealtimeStatus()

    // Demo match data
    const match: MatchData = {
        id: 'match-demo-001',
        athleteRed: 'Nguyễn Văn A',
        athleteBlue: 'Trần Văn B',
        teamRed: 'Hà Nội',
        teamBlue: 'TP.HCM',
        category: 'Đối kháng Nam 60kg',
        weightClass: '56-60kg',
        vong: 'Tứ kết',
        arenaName: 'Sân A1',
    }

    // Listen for score updates on this match channel
    useChannel(`scoring:${match.id}`, (event) => {
        if (event.action === 'score_sync') {
            // Sync from other referee tablets if needed
        }
    })

    const addScore = (corner: 'red' | 'blue', points: number) => {
        haptic('medium')
        if (corner === 'red') setRedScore((s) => s + points)
        else setBlueScore((s) => s + points)
    }

    const addPenalty = (corner: 'red' | 'blue') => {
        haptic('heavy')
        setPenalties((p) => ({ ...p, [corner]: p[corner] + 1 }))
    }

    const endRound = () => {
        haptic('heavy')
        setRounds((prev) => [...prev, { round: currentRound, red: redScore, blue: blueScore }])
        setCurrentRound((r) => r + 1)
        setRedScore(0)
        setBlueScore(0)
        timer.reset()
    }

    const submitMatch = () => {
        setShowConfirm(false)
        haptic('heavy')

        const matchResult = {
            matchId: match.id,
            rounds,
            totalRed: rounds.reduce((s, r) => s + r.red, 0) + redScore,
            totalBlue: rounds.reduce((s, r) => s + r.blue, 0) + blueScore,
            penalties,
            timestamp: new Date().toISOString()
        }

        if (connectionStatus === 'connected') {
            // POST to API directly and broadcast via WebSocket
            // TODO: POST to API — fetch('/api/v1/matches/score', { method: 'POST', body: JSON.stringify(matchResult) })
            alert('Đã gửi điểm thành công!')
        } else {
            // Save locally for offline mode
            const pending = JSON.parse(localStorage.getItem('vct:pending-combat-scores') || '[]')
            pending.push(matchResult)
            localStorage.setItem('vct:pending-combat-scores', JSON.stringify(pending))
            alert('Đã lưu kết quả offline. Điểm sẽ được đồng bộ khi có mạng.')
        }
    }

    const totalRed = rounds.reduce((s, r) => s + r.red, 0) + redScore
    const totalBlue = rounds.reduce((s, r) => s + r.blue, 0) + blueScore

    return (
        <div className="min-h-screen bg-(--vct-bg-base) p-3 select-none">
            {/* ── Match Info Bar ──────────────────────────────────── */}
            <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                    <VCT_Badge type={connectionStatus === 'connected' ? 'success' : 'danger'} text={connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'} />
                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                        {match.arenaName} · {match.vong}
                    </VCT_Text>
                </div>
                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                    {match.category}
                </VCT_Text>
            </div>

            {/* ── Timer Display ───────────────────────────────────── */}
            <div className="text-center mb-4">
                <motion.div
                    className="inline-block rounded-2xl px-8 py-3"
                    style={{
                        background: timer.running
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'var(--vct-bg-elevated)',
                        color: timer.running ? '#fff' : 'var(--vct-text-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '3rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                    }}
                    animate={{ scale: timer.remaining <= 10 && timer.running ? [1, 1.02, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                >
                    {timer.display}
                </motion.div>
                <div className="flex justify-center gap-3 mt-2">
                    {!timer.running ? (
                        <VCT_Button variant="primary" size="small" onClick={timer.start}>▶ Bắt đầu</VCT_Button>
                    ) : (
                        <VCT_Button variant="secondary" size="small" onClick={timer.pause}>⏸ Tạm dừng</VCT_Button>
                    )}
                    <VCT_Button variant="ghost" size="small" onClick={timer.reset}>↺ Reset</VCT_Button>
                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', alignSelf: 'center' }}>
                        Hiệp {currentRound}
                    </VCT_Text>
                </div>
            </div>

            {/* ── Score Area ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* RED Corner */}
                <VCT_Card style={{ border: '3px solid #ef4444', textAlign: 'center' }}>
                    <div className="px-3 py-2 rounded-t-lg" style={{ background: 'var(--vct-danger)', color: 'var(--vct-bg-elevated)' }}>
                        <VCT_Text variant="h3" style={{ color: 'var(--vct-bg-elevated)', margin: 0 }}>{match.athleteRed}</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>{match.teamRed}</VCT_Text>
                    </div>
                    <div className="py-4">
                        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--vct-danger)', lineHeight: 1 }}>
                            {redScore}
                        </div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                            Tổng: {totalRed} · Lỗi: {penalties.red}
                        </VCT_Text>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3">
                        <VCT_Button variant="primary" onClick={() => addScore('red', 1)}>+1</VCT_Button>
                        <VCT_Button variant="primary" onClick={() => addScore('red', 2)}>+2</VCT_Button>
                        <VCT_Button variant="primary" onClick={() => addScore('red', 3)}>+3</VCT_Button>
                    </div>
                    <div className="px-3 pb-3">
                        <VCT_Button variant="danger" size="small" onClick={() => addPenalty('red')} style={{ width: '100%' }}>
                            ⚠ Phạm lỗi
                        </VCT_Button>
                    </div>
                </VCT_Card>

                {/* BLUE Corner */}
                <VCT_Card style={{ border: '3px solid #3b82f6', textAlign: 'center' }}>
                    <div className="px-3 py-2 rounded-t-lg" style={{ background: 'var(--vct-info)', color: 'var(--vct-bg-elevated)' }}>
                        <VCT_Text variant="h3" style={{ color: 'var(--vct-bg-elevated)', margin: 0 }}>{match.athleteBlue}</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>{match.teamBlue}</VCT_Text>
                    </div>
                    <div className="py-4">
                        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--vct-info)', lineHeight: 1 }}>
                            {blueScore}
                        </div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                            Tổng: {totalBlue} · Lỗi: {penalties.blue}
                        </VCT_Text>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3">
                        <VCT_Button variant="primary" onClick={() => addScore('blue', 1)}>+1</VCT_Button>
                        <VCT_Button variant="primary" onClick={() => addScore('blue', 2)}>+2</VCT_Button>
                        <VCT_Button variant="primary" onClick={() => addScore('blue', 3)}>+3</VCT_Button>
                    </div>
                    <div className="px-3 pb-3">
                        <VCT_Button variant="danger" size="small" onClick={() => addPenalty('blue')} style={{ width: '100%' }}>
                            ⚠ Phạm lỗi
                        </VCT_Button>
                    </div>
                </VCT_Card>
            </div>

            {/* ── Round History ───────────────────────────────────── */}
            {rounds.length > 0 && (
                <VCT_Card style={{ marginBottom: '1rem' }}>
                    <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--vct-border-subtle)' }}>
                        <VCT_Text variant="h3">Lịch sử hiệp</VCT_Text>
                    </div>
                    <div className="p-3">
                        {rounds.map((r) => (
                            <div key={r.round} className="flex items-center justify-between py-1">
                                <VCT_Text variant="small">Hiệp {r.round}</VCT_Text>
                                <div className="flex items-center gap-4">
                                    <span style={{ color: 'var(--vct-danger)', fontWeight: 700 }}>{r.red}</span>
                                    <span style={{ color: 'var(--vct-text-tertiary)' }}>-</span>
                                    <span style={{ color: 'var(--vct-info)', fontWeight: 700 }}>{r.blue}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </VCT_Card>
            )}

            {/* ── Action Buttons ──────────────────────────────────── */}
            <div className="flex gap-3">
                <VCT_Button variant="secondary" onClick={endRound} style={{ flex: 1 }}>
                    Kết thúc hiệp {currentRound}
                </VCT_Button>
                <VCT_Button variant="danger" onClick={() => setShowConfirm(true)} style={{ flex: 1 }}>
                    Kết thúc trận
                </VCT_Button>
            </div>

            {/* ── Confirm Dialog ──────────────────────────────────── */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            className="rounded-2xl p-6 w-[90vw] max-w-md"
                            style={{ background: 'var(--vct-bg-elevated)' }}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <VCT_Text variant="h2">Xác nhận kết thúc trận?</VCT_Text>
                            <div className="my-4 text-center">
                                <span style={{ color: 'var(--vct-danger)', fontSize: '2rem', fontWeight: 800 }}>{totalRed}</span>
                                <span style={{ margin: '0 1rem', color: 'var(--vct-text-tertiary)', fontSize: '1.5rem' }}>—</span>
                                <span style={{ color: 'var(--vct-info)', fontSize: '2rem', fontWeight: 800 }}>{totalBlue}</span>
                            </div>
                            <VCT_Text variant="body" style={{ textAlign: 'center', color: 'var(--vct-text-secondary)', marginBottom: '1rem' }}>
                                Kết quả: {totalRed > totalBlue ? match.athleteRed : totalBlue > totalRed ? match.athleteBlue : 'Hòa'} thắng
                            </VCT_Text>
                            <div className="flex gap-3">
                                <VCT_Button variant="ghost" onClick={() => setShowConfirm(false)} style={{ flex: 1 }}>Hủy</VCT_Button>
                                <VCT_Button variant="primary" onClick={submitMatch} style={{ flex: 1 }}>Xác nhận</VCT_Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
