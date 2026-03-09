'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Badge, VCT_Button,
} from 'app/features/components/vct-ui'
import { useChannel, useRealtimeStatus } from 'app/features/data/repository/realtime-client'
import { calculateFormsScore, type FormsScoreResult } from 'app/features/data/scoring-engine'

/* ── Types ──────────────────────────────────────────────────── */

interface PerformanceData {
    id: string
    athleteName: string
    teamName: string
    formName: string
    judgeCount: 5 | 7
}

interface PenaltyItem {
    id: string
    label: string
    deduction: number
    checked: boolean
}

/* ── Page Component ─────────────────────────────────────────── */

export function Page_FormsScoringPad() {
    const status = useRealtimeStatus()
    const [scoreStr, setScoreStr] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<FormsScoreResult | null>(null)
    const [penalties, setPenalties] = useState<PenaltyItem[]>([
        { id: '1', label: 'Mất thăng bằng (-0.1)', deduction: 0.1, checked: false },
        { id: '2', label: 'Sai động tác (-0.2)', deduction: 0.2, checked: false },
        { id: '3', label: 'Quên bài (-0.5)', deduction: 0.5, checked: false },
        { id: '4', label: 'Vi phạm thời gian (-0.3)', deduction: 0.3, checked: false },
        { id: '5', label: 'Ra ngoài khu vực (-0.1)', deduction: 0.1, checked: false },
    ])

    // Demo performance data
    const performance: PerformanceData = {
        id: 'perf-001',
        athleteName: 'Phạm Hoàng Nam',
        teamName: 'Bình Định',
        formName: 'Ngọc Trản Quyền',
        judgeCount: 5,
    }

    // Listen for scoring channel
    useChannel(`forms:${performance.id}`, (event) => {
        if (event.action === 'score_final' && event.payload) {
            setResult(event.payload as unknown as FormsScoreResult)
        }
    })

    const appendKey = useCallback((key: string) => {
        if (key === 'C') {
            setScoreStr('')
            return
        }
        if (key === '←') {
            setScoreStr((s) => s.slice(0, -1))
            return
        }
        if (key === '.') {
            if (scoreStr.includes('.')) return
            setScoreStr((s) => s + '.')
            return
        }
        // Max 2 decimal places
        const dotIdx = scoreStr.indexOf('.')
        if (dotIdx >= 0 && scoreStr.length - dotIdx > 2) return

        const newStr = scoreStr + key
        const num = parseFloat(newStr)
        if (!isNaN(num) && num <= 10) {
            setScoreStr(newStr)
        }
    }, [scoreStr])

    const togglePenalty = (id: string) => {
        setPenalties((prev) => prev.map((p) => p.id === id ? { ...p, checked: !p.checked } : p))
    }

    const totalPenalty = penalties.filter((p) => p.checked).reduce((s, p) => s + p.deduction, 0)
    const currentScore = parseFloat(scoreStr) || 0
    const isValid = currentScore >= 0 && currentScore <= 10 && scoreStr.length > 0

    const submitScore = () => {
        if (!isValid) return
        setSubmitted(true)
        // Would POST to API: POST /api/v1/forms/{id}/score
        // with body: { score: currentScore, penalties: totalPenalty }

        // Demo: simulate all judges scored → calculate result
        const demoScores = [currentScore, 8.5, 8.7, 8.3, 8.6] // Demo 5 judges
        const calcResult = calculateFormsScore(demoScores, 5, totalPenalty)
        setTimeout(() => setResult(calcResult), 1500)
    }

    const keypadKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'C', '←']

    return (
        <div className="min-h-screen select-none" style={{ background: 'var(--vct-bg-base)' }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <VCT_Text variant="h3" style={{ color: '#fff', margin: 0 }}>Chấm điểm Quyền</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {performance.judgeCount} trọng tài
                        </VCT_Text>
                    </div>
                    <VCT_Badge type={status === 'connected' ? 'success' : 'warning'} text={status === 'connected' ? 'LIVE' : 'Offline'} />
                </div>
            </div>

            {/* ── Athlete Info ────────────────────────────────────── */}
            <VCT_Card style={{ margin: '0.75rem', marginBottom: 0 }}>
                <div className="p-4">
                    <VCT_Text variant="h2" style={{ margin: 0 }}>{performance.athleteName}</VCT_Text>
                    <VCT_Text variant="body" style={{ color: 'var(--vct-text-secondary)' }}>
                        {performance.teamName} · {performance.formName}
                    </VCT_Text>
                </div>
            </VCT_Card>

            {!submitted ? (
                <div className="p-3">
                    {/* ── Score Display ─────────────────────────────────── */}
                    <div className="text-center my-4">
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                            ĐIỂM SỐ (0.0 - 10.0)
                        </VCT_Text>
                        <motion.div
                            className="inline-block rounded-2xl px-10 py-4 mt-2"
                            style={{
                                background: 'var(--vct-bg-elevated)',
                                border: `3px solid ${isValid ? '#7c3aed' : 'var(--vct-border-subtle)'}`,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '3.5rem',
                                fontWeight: 800,
                                color: isValid ? '#7c3aed' : 'var(--vct-text-tertiary)',
                                minWidth: '180px',
                            }}
                            animate={{ borderColor: isValid ? '#7c3aed' : 'var(--vct-border-subtle)' }}
                        >
                            {scoreStr || '0.00'}
                        </motion.div>
                    </div>

                    {/* ── Slide-to-Score ────────────────────────────────────────── */}
                    <div className="mb-6 max-w-lg mx-auto px-4 mt-6">
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                            Kéo thanh trượt để chấm điểm
                        </VCT_Text>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={scoreStr || '0'}
                            onChange={(e) => setScoreStr(e.target.value)}
                            style={{
                                width: '100%',
                                height: '16px',
                                borderRadius: '8px',
                                accentColor: '#7c3aed',
                                outline: 'none',
                                appearance: 'auto',
                                cursor: 'grab',
                                touchAction: 'none'
                            }}
                        />
                        <div className="flex justify-between mt-2" style={{ color: 'var(--vct-text-tertiary)', fontSize: '0.875rem' }}>
                            <span>0.0</span>
                            <span>5.0</span>
                            <span>10.0</span>
                        </div>
                    </div>

                    {/* ── Penalties ─────────────────────────────────────── */}
                    <VCT_Card style={{ marginBottom: '1rem' }}>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <VCT_Text variant="h3" style={{ margin: 0 }}>Trừ điểm kỹ thuật</VCT_Text>
                                {totalPenalty > 0 && (
                                    <VCT_Badge type="danger" text={`-${totalPenalty.toFixed(1)}`} />
                                )}
                            </div>
                            {penalties.map((p) => (
                                <label
                                    key={p.id}
                                    className="flex items-center gap-3 py-2 cursor-pointer"
                                    style={{ borderBottom: '1px solid var(--vct-border-subtle)' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={p.checked}
                                        onChange={() => togglePenalty(p.id)}
                                        style={{ width: 18, height: 18, accentColor: '#7c3aed' }}
                                    />
                                    <VCT_Text variant="body">{p.label}</VCT_Text>
                                </label>
                            ))}
                        </div>
                    </VCT_Card>

                    {/* ── Submit ────────────────────────────────────────── */}
                    <div className="flex gap-3">
                        <VCT_Button variant="ghost" style={{ flex: 1 }} onClick={() => { setScoreStr(''); setPenalties((p) => p.map((pp) => ({ ...pp, checked: false }))) }}>
                            Xóa tất cả
                        </VCT_Button>
                        <VCT_Button variant="primary" style={{ flex: 2 }} onClick={submitScore} disabled={!isValid}>
                            ✓ GỬI ĐIỂM ({isValid ? (currentScore - totalPenalty).toFixed(2) : '—'})
                        </VCT_Button>
                    </div>
                </div>
            ) : (
                /* ── Result Display ─────────────────────────────────── */
                <div className="p-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <VCT_Card>
                            <div className="p-6 text-center">
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    Điểm của bạn
                                </VCT_Text>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#7c3aed', margin: '0.5rem 0' }}>
                                    {currentScore.toFixed(2)}
                                </div>
                                {totalPenalty > 0 && (
                                    <VCT_Badge type="danger" text={`Trừ kỹ thuật: -${totalPenalty.toFixed(1)}`} />
                                )}
                                <VCT_Text variant="body" style={{ color: 'var(--vct-text-secondary)', marginTop: '1rem' }}>
                                    ✓ Đã gửi điểm. Đang chờ các trọng tài khác...
                                </VCT_Text>
                            </div>
                        </VCT_Card>
                    </motion.div>

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <VCT_Card style={{ marginTop: '1rem' }}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <VCT_Text variant="h3" style={{ margin: 0 }}>Kết quả chấm điểm</VCT_Text>
                                        <VCT_Badge type="success" text="Đã hoàn tất" />
                                    </div>

                                    {/* Judge Scores */}
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        {result.judgeScores.map((s, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg px-3 py-2 text-center"
                                                style={{
                                                    background: s === result.trimmedHigh || s === result.trimmedLow
                                                        ? 'rgba(239,68,68,0.1)' : 'var(--vct-bg-input)',
                                                    textDecoration: s === result.trimmedHigh || s === result.trimmedLow
                                                        ? 'line-through' : 'none',
                                                    color: s === result.trimmedHigh || s === result.trimmedLow
                                                        ? '#ef4444' : 'var(--vct-text-primary)',
                                                    fontWeight: 700,
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                {s.toFixed(2)}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Final Score */}
                                    <div className="text-center">
                                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                            Điểm trung bình (sau loại cao/thấp)
                                        </VCT_Text>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22c55e' }}>
                                            {result.finalScore.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </VCT_Card>
                        </motion.div>
                    )}

                    <VCT_Button
                        variant="secondary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={() => { setSubmitted(false); setScoreStr(''); setResult(null); setPenalties((p) => p.map((pp) => ({ ...pp, checked: false }))) }}
                    >
                        Lượt tiếp theo
                    </VCT_Button>
                </div>
            )}
        </div>
    )
}
