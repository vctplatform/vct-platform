'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const WEIGHT_STATS = [
    { cat: '48kg', male: 12, female: 8 }, { cat: '52kg', male: 15, female: 10 },
    { cat: '56kg', male: 18, female: 12 }, { cat: '60kg', male: 22, female: 14 },
    { cat: '65kg', male: 20, female: 11 }, { cat: '70kg', male: 16, female: 8 },
    { cat: '75kg', male: 10, female: 5 }, { cat: '80kg', male: 8, female: 0 },
    { cat: '+80kg', male: 6, female: 0 },
]

const TEAM_RANKINGS = [
    { rank: 1, team: 'Bình Định', gold: 8, silver: 5, bronze: 7, total: 20, score: 156 },
    { rank: 2, team: 'TP.HCM', gold: 6, silver: 7, bronze: 4, total: 17, score: 132 },
    { rank: 3, team: 'Hà Nội', gold: 5, silver: 4, bronze: 8, total: 17, score: 118 },
    { rank: 4, team: 'Đà Nẵng', gold: 4, silver: 3, bronze: 5, total: 12, score: 96 },
    { rank: 5, team: 'Thanh Hóa', gold: 3, silver: 4, bronze: 3, total: 10, score: 82 },
    { rank: 6, team: 'Nghệ An', gold: 2, silver: 3, bronze: 6, total: 11, score: 74 },
    { rank: 7, team: 'Cần Thơ', gold: 2, silver: 2, bronze: 4, total: 8, score: 58 },
    { rank: 8, team: 'Khánh Hòa', gold: 1, silver: 3, bronze: 2, total: 6, score: 44 },
]

const MATCH_STATS = {
    totalMatches: 186, koFinishes: 28, pointFinishes: 142, draws: 16,
    avgScore: 4.8, avgDuration: '2:45', longestMatch: '5:00', shortestMatch: '0:35',
}

const CONTENT_STATS = [
    { name: 'Đối kháng', athletes: 280, matches: 186, color: '#ef4444' },
    { name: 'Quyền thuật', athletes: 120, matches: 0, color: '#8b5cf6' },
    { name: 'Biểu diễn', athletes: 45, matches: 0, color: '#f59e0b' },
    { name: 'Đồng đội', athletes: 60, matches: 24, color: '#3b82f6' },
]

type Tab = 'overview' | 'teams' | 'matches' | 'comparison'

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_tournament_statistics() {
    const [tab, setTab] = useState<Tab>('overview')
    const maxWeight = Math.max(...WEIGHT_STATS.map(w => w.male + w.female))

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Thống Kê Giải Đấu</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Phân tích dữ liệu và thống kê Giải VĐQG 2025</p>
                </div>
                <div className="flex gap-2">
                    <select className="rounded-lg border border-vct-border bg-vct-elevated px-3 py-2 text-sm outline-none">
                        <option>Giải VĐQG 2025</option><option>Giải Trẻ 2026</option><option>Giải Giao hữu 2025</option>
                    </select>
                    <button className="flex items-center gap-1.5 rounded-lg border border-vct-border px-3 py-2 text-xs font-bold text-vct-text-muted hover:border-vct-accent transition">
                        <VCT_Icons.Download size={14} /> Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng VĐV', v: '486', i: '👥', c: '#0ea5e9' },
                { l: 'Tổng trận', v: MATCH_STATS.totalMatches, i: '⚔️', c: '#ef4444' },
                { l: 'Đoàn tham gia', v: '42', i: '🏛️', c: '#8b5cf6' },
                { l: 'Huy chương phát', v: '124', i: '🏅', c: '#f59e0b' },
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-xl mb-1">{s.i}</div><div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                {[{ key: 'overview' as Tab, l: '📊 Tổng quan' }, { key: 'teams' as Tab, l: '🏛️ BXH Đoàn' }, { key: 'matches' as Tab, l: '⚔️ Trận đấu' }, { key: 'comparison' as Tab, l: '📈 So sánh' }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${tab === t.key ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{t.l}</button>
                ))}
            </div>

            {/* TAB: Overview */}
            {tab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid tablet:grid-cols-2 gap-6">
                    {/* Weight distribution chart */}
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <h3 className="font-bold text-sm mb-4">Phân bổ VĐV theo hạng cân</h3>
                        <div className="grid gap-2">
                            {WEIGHT_STATS.map(w => (
                                <div key={w.cat} className="flex items-center gap-3">
                                    <span className="w-12 text-xs font-bold text-right text-vct-text-muted">{w.cat}</span>
                                    <div className="flex-1 flex items-center gap-1 h-5">
                                        <div className="h-full rounded-l bg-blue-500 transition-all" style={{ width: `${(w.male / maxWeight) * 100}%` }} />
                                        <div className="h-full rounded-r bg-pink-500 transition-all" style={{ width: `${(w.female / maxWeight) * 100}%` }} />
                                    </div>
                                    <span className="text-[10px] text-vct-text-muted w-10">{w.male + w.female}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-3 text-[10px] text-vct-text-muted">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Nam</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-500" /> Nữ</span>
                        </div>
                    </div>
                    {/* Content stats */}
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <h3 className="font-bold text-sm mb-4">Nội dung thi đấu</h3>
                        <div className="grid gap-3">
                            {CONTENT_STATS.map(cs => (
                                <div key={cs.name} className="flex items-center gap-3 p-3 rounded-lg bg-vct-input">
                                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: cs.color }} />
                                    <div className="flex-1"><div className="font-bold text-sm">{cs.name}</div></div>
                                    <div className="text-right"><div className="font-bold text-sm">{cs.athletes}</div><div className="text-[10px] text-vct-text-muted">VĐV</div></div>
                                    <div className="text-right w-16"><div className="font-bold text-sm">{cs.matches || '—'}</div><div className="text-[10px] text-vct-text-muted">Trận</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TAB: Teams */}
            {tab === 'teams' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-vct-input border-b border-vct-border text-[11px] uppercase tracking-wider text-vct-text-muted font-bold">
                                <th className="p-4 w-16 text-center">#</th><th className="p-4">Đoàn</th>
                                <th className="p-4 text-center w-16">🥇</th><th className="p-4 text-center w-16">🥈</th><th className="p-4 text-center w-16">🥉</th>
                                <th className="p-4 text-center w-20">Tổng HC</th><th className="p-4 text-center w-20">Điểm</th>
                            </tr></thead>
                            <tbody className="divide-y divide-vct-border">
                                {TEAM_RANKINGS.map(t => (
                                    <tr key={t.rank} className="hover:bg-vct-input/50 transition">
                                        <td className="p-4 text-center"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${t.rank <= 3 ? 'bg-vct-accent/15 text-vct-accent' : 'text-vct-text-muted'}`}>{t.rank}</span></td>
                                        <td className="p-4 font-bold text-sm">{t.team}</td>
                                        <td className="p-4 text-center font-bold text-amber-500">{t.gold}</td>
                                        <td className="p-4 text-center font-bold text-slate-400">{t.silver}</td>
                                        <td className="p-4 text-center font-bold text-amber-700">{t.bronze}</td>
                                        <td className="p-4 text-center font-bold">{t.total}</td>
                                        <td className="p-4 text-center"><span className="font-black text-vct-accent">{t.score}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* TAB: Matches */}
            {tab === 'matches' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid tablet:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <h3 className="font-bold text-sm mb-4">Kết quả trận đấu</h3>
                        <div className="grid gap-3">
                            {[{ l: 'Thắng KO/TKO', v: MATCH_STATS.koFinishes, c: '#ef4444', pct: Math.round(MATCH_STATS.koFinishes / MATCH_STATS.totalMatches * 100) },
                            { l: 'Thắng điểm', v: MATCH_STATS.pointFinishes, c: '#3b82f6', pct: Math.round(MATCH_STATS.pointFinishes / MATCH_STATS.totalMatches * 100) },
                            { l: 'Hòa', v: MATCH_STATS.draws, c: '#94a3b8', pct: Math.round(MATCH_STATS.draws / MATCH_STATS.totalMatches * 100) },
                            ].map(s => (
                                <div key={s.l}>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-vct-text-muted">{s.l}</span><span className="font-bold">{s.v} ({s.pct}%)</span></div>
                                    <div className="h-2 rounded-full bg-vct-input overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.c }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <h3 className="font-bold text-sm mb-4">Số liệu trận đấu</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[{ l: 'Điểm TB/trận', v: MATCH_STATS.avgScore, c: '#0ea5e9' },
                            { l: 'Thời gian TB', v: MATCH_STATS.avgDuration, c: '#8b5cf6' },
                            { l: 'Trận dài nhất', v: MATCH_STATS.longestMatch, c: '#f59e0b' },
                            { l: 'Trận ngắn nhất', v: MATCH_STATS.shortestMatch, c: '#ef4444' },
                            ].map(s => (
                                <div key={s.l} className="p-4 rounded-xl bg-vct-input text-center">
                                    <div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                                    <div className="text-[10px] text-vct-text-muted mt-1">{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TAB: Comparison */}
            {tab === 'comparison' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-5">
                        <h3 className="font-bold text-sm mb-4">So sánh với giải trước</h3>
                        <div className="grid gap-3">
                            {[{ l: 'Tổng VĐV', now: 486, prev: 420, unit: '' },
                            { l: 'Tổng đoàn', now: 42, prev: 38, unit: '' },
                            { l: 'Trận đấu', now: 186, prev: 162, unit: '' },
                            { l: 'Tỷ lệ KO', now: 15.1, prev: 12.3, unit: '%' },
                            { l: 'Điểm TB/trận', now: 4.8, prev: 4.5, unit: '' },
                            ].map(s => {
                                const diff = s.now - s.prev
                                const pct = ((diff / s.prev) * 100).toFixed(1)
                                const up = diff > 0
                                return (
                                    <div key={s.l} className="flex items-center justify-between p-4 rounded-lg bg-vct-input">
                                        <span className="text-sm text-vct-text-muted">{s.l}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-vct-text-muted">2024: {s.prev}{s.unit}</span>
                                            <span className="font-bold text-sm">2025: {s.now}{s.unit}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
                                                {up ? '↑' : '↓'} {pct}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
