'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Badge, VCT_Button,
} from 'app/features/components/vct-ui'
import { useChannel, useRealtimeStatus } from 'app/features/data/repository/realtime-client'

/* ── Types ──────────────────────────────────────────────────── */

interface AthleteProfile {
    id: string
    hoTen: string
    team: string
    gioiTinh: string
    canNang: number
    ngaySinh: string
    trangThai: string
    avatarUrl?: string
}

/* ── Demo Data ──────────────────────────────────────────────── */

const PROFILE: AthleteProfile = {
    id: 'vdv-001',
    hoTen: 'Nguyễn Văn A',
    team: 'Đoàn Hà Nội',
    gioiTinh: 'Nam',
    canNang: 58.5,
    ngaySinh: '2002-05-15',
    trangThai: 'da_duyet',
}

const MY_SCHEDULE = [
    { time: '08:30', date: '2026-03-15', category: 'Đối kháng Nam 56-60kg', vong: 'Vòng loại', arena: 'Sân A1', opponent: 'Trần Văn B (TP.HCM)', status: 'sap_dau' },
    { time: '14:00', date: '2026-03-15', category: 'Đối kháng Nam 56-60kg', vong: 'Tứ kết', arena: 'Sân A1', opponent: 'Chưa xác định', status: 'chua_dau' },
    { time: '09:00', date: '2026-03-16', category: 'Quyền Nam', vong: 'Chung kết', arena: 'Sân B1', opponent: '—', status: 'chua_dau' },
]

const MY_RESULTS: { category: string; vong: string; opponent: string; score: string; result: 'win' | 'loss' }[] = [
    { category: 'Đối kháng Nam 56-60kg', vong: 'Vòng loại', opponent: 'Lê Văn C', score: '12-8', result: 'win' },
    { category: 'Quyền Nam', vong: 'Bán kết', opponent: '—', score: '8.7', result: 'win' },
]

const WEIGH_IN_STATUS = {
    time: '2026-03-14 07:30',
    canNangThuc: 58.2,
    ketQua: 'dat' as const,
    hangCan: '56-60kg',
}

/* ── Page Component ─────────────────────────────────────────── */

type Tab = 'overview' | 'schedule' | 'results' | 'weighin'

export function Page_AthletePortal() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const status = useRealtimeStatus()

    // Listen for personal notifications
    useChannel(`athlete:${PROFILE.id}`, (event) => {
        // Handle schedule changes, results, etc.
    })

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Tổng quan', icon: '👤' },
        { id: 'schedule', label: 'Lịch thi đấu', icon: '📅' },
        { id: 'results', label: 'Kết quả', icon: '🏆' },
        { id: 'weighin', label: 'Cân nặng', icon: '⚖️' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="px-4 py-4" style={{ background: 'var(--vct-accent-gradient)' }}>
                <div className="flex items-center gap-3">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    >
                        {PROFILE.hoTen.charAt(0)}
                    </div>
                    <div>
                        <VCT_Text variant="h2" style={{ color: '#fff', margin: 0 }}>{PROFILE.hoTen}</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {PROFILE.team} · {PROFILE.gioiTinh} · {PROFILE.canNang}kg
                        </VCT_Text>
                    </div>
                    <div className="ml-auto">
                        <VCT_Badge type={status === 'connected' ? 'success' : 'warning'} text={status === 'connected' ? 'Online' : 'Offline'} />
                    </div>
                </div>
            </div>

            {/* ── Tab Bar ─────────────────────────────────────────── */}
            <div className="flex gap-1 p-2 mx-3 mt-3 rounded-xl" style={{ background: 'var(--vct-bg-elevated)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: activeTab === tab.id ? 'var(--vct-accent-cyan)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--vct-text-secondary)',
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
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'schedule' && <ScheduleTab />}
                {activeTab === 'results' && <ResultsTab />}
                {activeTab === 'weighin' && <WeighInTab />}
            </div>
        </div>
    )
}

/* ── Overview Tab ───────────────────────────────────────────── */

function OverviewTab() {
    const nextMatch = MY_SCHEDULE.find((s) => s.status === 'sap_dau')

    return (
        <div className="grid gap-4">
            {/* Next Match */}
            {nextMatch && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <VCT_Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <VCT_Badge type="warning" text="Sắp thi đấu" />
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    {nextMatch.date} · {nextMatch.time}
                                </VCT_Text>
                            </div>
                            <VCT_Text variant="h3">{nextMatch.category}</VCT_Text>
                            <VCT_Text variant="body" style={{ color: 'var(--vct-text-secondary)' }}>
                                {nextMatch.vong} · {nextMatch.arena}
                            </VCT_Text>
                            <VCT_Text variant="body" style={{ marginTop: '0.5rem' }}>
                                Đối thủ: <strong>{nextMatch.opponent}</strong>
                            </VCT_Text>
                        </div>
                    </VCT_Card>
                </motion.div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--vct-accent-cyan)' }}>
                            {MY_RESULTS.filter((r) => r.result === 'win').length}
                        </div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Thắng</VCT_Text>
                    </div>
                </VCT_Card>
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
                            {MY_RESULTS.filter((r) => r.result === 'loss').length}
                        </div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Thua</VCT_Text>
                    </div>
                </VCT_Card>
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>
                            {WEIGH_IN_STATUS.ketQua === 'dat' ? '✓' : '✗'}
                        </div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Cân nặng</VCT_Text>
                    </div>
                </VCT_Card>
            </div>

            {/* Profile Card */}
            <VCT_Card>
                <div className="p-4">
                    <VCT_Text variant="h3">Thông tin VĐV</VCT_Text>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Họ tên</VCT_Text>
                            <VCT_Text variant="body">{PROFILE.hoTen}</VCT_Text>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Đoàn</VCT_Text>
                            <VCT_Text variant="body">{PROFILE.team}</VCT_Text>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Giới tính</VCT_Text>
                            <VCT_Text variant="body">{PROFILE.gioiTinh}</VCT_Text>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Cân nặng</VCT_Text>
                            <VCT_Text variant="body">{PROFILE.canNang}kg</VCT_Text>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Ngày sinh</VCT_Text>
                            <VCT_Text variant="body">{PROFILE.ngaySinh}</VCT_Text>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Trạng thái</VCT_Text>
                            <VCT_Badge type="success" text="Đã duyệt" />
                        </div>
                    </div>
                </div>
            </VCT_Card>
        </div>
    )
}

/* ── Schedule Tab ───────────────────────────────────────────── */

function ScheduleTab() {
    return (
        <div className="grid gap-3">
            <VCT_Text variant="h2">Lịch thi đấu của tôi</VCT_Text>
            {MY_SCHEDULE.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <VCT_Card>
                        <div className="p-4 flex items-start gap-3">
                            <div
                                className="rounded-lg px-3 py-2 text-center min-w-[4rem]"
                                style={{ background: item.status === 'sap_dau' ? 'rgba(234,179,8,0.1)' : 'var(--vct-bg-input)' }}
                            >
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--vct-accent-cyan)' }}>{item.time}</div>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{item.date.slice(5)}</VCT_Text>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.category}</VCT_Text>
                                    <VCT_Badge type={item.status === 'sap_dau' ? 'warning' : 'info'} text={item.status === 'sap_dau' ? 'Sắp đấu' : 'Chưa đấu'} />
                                </div>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    {item.vong} · {item.arena}
                                </VCT_Text>
                                <VCT_Text variant="small">Đối thủ: {item.opponent}</VCT_Text>
                            </div>
                        </div>
                    </VCT_Card>
                </motion.div>
            ))}
        </div>
    )
}

/* ── Results Tab ────────────────────────────────────────────── */

function ResultsTab() {
    return (
        <div className="grid gap-3">
            <VCT_Text variant="h2">Kết quả thi đấu</VCT_Text>
            {MY_RESULTS.map((item, i) => (
                <VCT_Card key={i}>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.category}</VCT_Text>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                {item.vong} · vs {item.opponent}
                            </VCT_Text>
                        </div>
                        <div className="text-right">
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.result === 'win' ? '#22c55e' : '#ef4444' }}>
                                {item.score}
                            </div>
                            <VCT_Badge type={item.result === 'win' ? 'success' : 'danger'} text={item.result === 'win' ? 'Thắng' : 'Thua'} />
                        </div>
                    </div>
                </VCT_Card>
            ))}
        </div>
    )
}

/* ── Weigh-In Tab ───────────────────────────────────────────── */

function WeighInTab() {
    return (
        <div className="grid gap-4">
            <VCT_Text variant="h2">Tình trạng cân nặng</VCT_Text>
            <VCT_Card>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <VCT_Text variant="h3">Kết quả cân</VCT_Text>
                        <VCT_Badge type={WEIGH_IN_STATUS.ketQua === 'dat' ? 'success' : 'danger'} text={WEIGH_IN_STATUS.ketQua === 'dat' ? '✓ Đạt' : '✗ Không đạt'} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Cân nặng thực tế</VCT_Text>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--vct-accent-cyan)' }}>
                                {WEIGH_IN_STATUS.canNangThuc}kg
                            </div>
                        </div>
                        <div>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Hạng cân</VCT_Text>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--vct-text-primary)' }}>
                                {WEIGH_IN_STATUS.hangCan}
                            </div>
                        </div>
                    </div>
                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', marginTop: '1rem' }}>
                        Thời gian cân: {WEIGH_IN_STATUS.time}
                    </VCT_Text>
                </div>
            </VCT_Card>
        </div>
    )
}
