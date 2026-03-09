'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Badge, VCT_Button,
} from 'app/features/components/vct-ui'
import { useChannel, useRealtimeStatus } from 'app/features/data/repository/realtime-client'

/* ── Types ──────────────────────────────────────────────────── */

interface InjuryReport {
    id: string
    athleteId: string
    athleteName: string
    team: string
    type: 'nhe' | 'trung_binh' | 'nang'
    description: string
    arena: string
    time: string
    status: 'new' | 'treating' | 'done'
}

interface PreCheckItem {
    athleteId: string
    athleteName: string
    team: string
    weightClass: string
    checked: boolean
    notes?: string
}

/* ── Demo Data ──────────────────────────────────────────────── */

const INJURY_REPORTS: InjuryReport[] = [
    { id: '1', athleteId: 'vdv-001', athleteName: 'Nguyễn Văn A', team: 'Hà Nội', type: 'nhe', description: 'Trầy xước chân trái', arena: 'Sân A1', time: '10:25', status: 'done' },
    { id: '2', athleteId: 'vdv-005', athleteName: 'Trần Văn D', team: 'TP.HCM', type: 'trung_binh', description: 'Bong gân cổ tay phải', arena: 'Sân B2', time: '11:00', status: 'treating' },
]

const PRE_CHECK_LIST: PreCheckItem[] = [
    { athleteId: 'vdv-001', athleteName: 'Nguyễn Văn A', team: 'Hà Nội', weightClass: '56-60kg', checked: true },
    { athleteId: 'vdv-002', athleteName: 'Trần Văn B', team: 'TP.HCM', weightClass: '56-60kg', checked: true },
    { athleteId: 'vdv-003', athleteName: 'Lê Văn C', team: 'Đà Nẵng', weightClass: '60-65kg', checked: false },
    { athleteId: 'vdv-004', athleteName: 'Phạm Văn E', team: 'Bình Định', weightClass: '65-70kg', checked: false },
]

/* ── Page Component ─────────────────────────────────────────── */

type Tab = 'dashboard' | 'precheck' | 'injury' | 'firstaid'

export function Page_MedicalPortal() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')
    const [showEmergency, setShowEmergency] = useState(false)
    const status = useRealtimeStatus()

    // Listen for medical emergency channels
    useChannel('medical:emergency', (event) => {
        if (event.action === 'match_stop_request') {
            // Handle emergency stop from referee
        }
    })

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Tổng quan', icon: '🏥' },
        { id: 'precheck', label: 'Kiểm tra y tế', icon: '📋' },
        { id: 'injury', label: 'Chấn thương', icon: '🩹' },
        { id: 'firstaid', label: 'Sơ cứu', icon: '🚑' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="px-4 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                <div>
                    <VCT_Text variant="h2" style={{ color: '#fff', margin: 0 }}>🏥 Y Tế Giải Đấu</VCT_Text>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Giải Vovinam Toàn Quốc 2026
                    </VCT_Text>
                </div>
                <div className="flex items-center gap-2">
                    <VCT_Badge type={status === 'connected' ? 'success' : 'warning'} text={status === 'connected' ? 'Online' : 'Offline'} />
                </div>
            </div>

            {/* ── EMERGENCY STOP ──────────────────────────────────── */}
            <div className="p-4">
                <motion.button
                    onClick={() => setShowEmergency(true)}
                    className="w-full rounded-2xl py-6 text-white text-xl font-black tracking-wider"
                    style={{
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        border: '3px solid #fca5a5',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ boxShadow: '0 6px 30px rgba(220,38,38,0.6)' }}
                >
                    🚨 DỪNG TRẬN KHẨN CẤP
                </motion.button>
            </div>

            {/* ── Tab Bar ─────────────────────────────────────────── */}
            <div className="flex gap-1 p-2 mx-3 rounded-xl" style={{ background: 'var(--vct-bg-elevated)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: activeTab === tab.id ? '#059669' : 'transparent',
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
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'precheck' && <PreCheckTab />}
                {activeTab === 'injury' && <InjuryTab />}
                {activeTab === 'firstaid' && <FirstAidTab />}
            </div>

            {/* ── Emergency Confirm Dialog ────────────────────────── */}
            <AnimatePresence>
                {showEmergency && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEmergency(false)}
                    >
                        <motion.div
                            className="rounded-2xl p-6 w-[90vw] max-w-md"
                            style={{ background: 'var(--vct-bg-elevated)', border: '2px solid #ef4444' }}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <VCT_Text variant="h2" style={{ color: '#ef4444' }}>🚨 Xác nhận dừng trận?</VCT_Text>
                            <VCT_Text variant="body" style={{ color: 'var(--vct-text-secondary)', margin: '1rem 0' }}>
                                Hành động này sẽ gửi tín hiệu dừng trận đến trọng tài qua WebSocket.
                                Timer sẽ bị tạm dừng ngay lập tức.
                            </VCT_Text>
                            <select
                                className="w-full rounded-lg px-3 py-2 mb-3"
                                style={{
                                    background: 'var(--vct-bg-input)',
                                    border: '1px solid var(--vct-border-subtle)',
                                    color: 'var(--vct-text-primary)',
                                }}
                            >
                                <option value="">Chọn sàn đấu...</option>
                                <option value="san-a1">Sân A1</option>
                                <option value="san-a2">Sân A2</option>
                                <option value="san-b1">Sân B1</option>
                                <option value="san-b2">Sân B2</option>
                            </select>
                            <textarea
                                placeholder="Mô tả tình huống y tế..."
                                rows={3}
                                className="w-full rounded-lg px-3 py-2 mb-4"
                                style={{
                                    background: 'var(--vct-bg-input)',
                                    border: '1px solid var(--vct-border-subtle)',
                                    color: 'var(--vct-text-primary)',
                                    resize: 'none',
                                }}
                            />
                            <div className="flex gap-3">
                                <VCT_Button variant="ghost" onClick={() => setShowEmergency(false)} style={{ flex: 1 }}>Hủy</VCT_Button>
                                <VCT_Button variant="danger" onClick={() => { setShowEmergency(false) }} style={{ flex: 1 }}>
                                    🚨 DỪNG NGAY
                                </VCT_Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── Dashboard Tab ──────────────────────────────────────────── */

function DashboardTab() {
    const treating = INJURY_REPORTS.filter((r) => r.status === 'treating').length
    const today = INJURY_REPORTS.length
    const unchecked = PRE_CHECK_LIST.filter((p) => !p.checked).length

    return (
        <div className="grid gap-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{treating}</div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Đang điều trị</VCT_Text>
                    </div>
                </VCT_Card>
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{today}</div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Ca hôm nay</VCT_Text>
                    </div>
                </VCT_Card>
                <VCT_Card>
                    <div className="p-3 text-center">
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{unchecked}</div>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Chưa khám</VCT_Text>
                    </div>
                </VCT_Card>
            </div>

            {/* Active Cases */}
            <VCT_Card>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--vct-border-subtle)' }}>
                    <VCT_Text variant="h3">Ca đang theo dõi</VCT_Text>
                </div>
                <div className="p-3">
                    {INJURY_REPORTS.filter((r) => r.status !== 'done').map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2"
                            style={{ borderBottom: '1px solid var(--vct-border-subtle)' }}>
                            <div>
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{r.athleteName}</VCT_Text>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    {r.team} · {r.arena} · {r.time}
                                </VCT_Text>
                            </div>
                            <div className="flex items-center gap-2">
                                <VCT_Badge
                                    type={r.type === 'nang' ? 'danger' : r.type === 'trung_binh' ? 'warning' : 'info'}
                                    text={r.type === 'nang' ? 'Nặng' : r.type === 'trung_binh' ? 'Trung bình' : 'Nhẹ'}
                                />
                            </div>
                        </div>
                    ))}
                    {INJURY_REPORTS.filter((r) => r.status !== 'done').length === 0 && (
                        <VCT_Text variant="body" style={{ color: 'var(--vct-text-tertiary)', textAlign: 'center', padding: '1rem' }}>
                            Không có ca nào đang theo dõi
                        </VCT_Text>
                    )}
                </div>
            </VCT_Card>
        </div>
    )
}

/* ── Pre-Check Tab ──────────────────────────────────────────── */

function PreCheckTab() {
    const [items, setItems] = useState(PRE_CHECK_LIST)

    const toggleCheck = (idx: number) => {
        setItems((prev) => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item))
    }

    return (
        <div className="grid gap-3">
            <div className="flex items-center justify-between">
                <VCT_Text variant="h2">Kiểm tra y tế trước giải</VCT_Text>
                <VCT_Badge type="info" text={`${items.filter((i) => i.checked).length}/${items.length} đã khám`} />
            </div>
            {items.map((item, i) => (
                <motion.div key={item.athleteId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <VCT_Card>
                        <div className="p-4 flex items-center gap-3">
                            <button
                                onClick={() => toggleCheck(i)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                                style={{
                                    background: item.checked ? '#059669' : 'var(--vct-bg-input)',
                                    color: item.checked ? '#fff' : 'var(--vct-text-tertiary)',
                                    border: item.checked ? 'none' : '2px solid var(--vct-border-subtle)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                {item.checked ? '✓' : ''}
                            </button>
                            <div className="flex-1">
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{item.athleteName}</VCT_Text>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    {item.team} · {item.weightClass}
                                </VCT_Text>
                            </div>
                            <VCT_Badge
                                type={item.checked ? 'success' : 'warning'}
                                text={item.checked ? 'Đã khám' : 'Chưa khám'}
                            />
                        </div>
                    </VCT_Card>
                </motion.div>
            ))}
        </div>
    )
}

/* ── Injury Tab ──────────────────────────────────────────────── */

function InjuryTab() {
    const [showForm, setShowForm] = useState(false)

    return (
        <div className="grid gap-3">
            <div className="flex items-center justify-between">
                <VCT_Text variant="h2">Báo cáo chấn thương</VCT_Text>
                <VCT_Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
                    + Thêm báo cáo
                </VCT_Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <VCT_Card>
                        <div className="p-4 grid gap-3">
                            <VCT_Text variant="h3">Báo cáo mới</VCT_Text>
                            <input
                                placeholder="Tên VĐV..."
                                className="w-full rounded-lg px-3 py-2"
                                style={{ background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)' }}
                            />
                            <select
                                className="w-full rounded-lg px-3 py-2"
                                style={{ background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)' }}
                            >
                                <option value="nhe">Nhẹ</option>
                                <option value="trung_binh">Trung bình</option>
                                <option value="nang">Nặng</option>
                            </select>
                            <textarea
                                placeholder="Mô tả chấn thương..."
                                rows={3}
                                className="w-full rounded-lg px-3 py-2"
                                style={{ background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)', resize: 'none' }}
                            />
                            <div className="flex gap-2">
                                <VCT_Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Hủy</VCT_Button>
                                <VCT_Button variant="primary" size="sm" onClick={() => setShowForm(false)}>Lưu báo cáo</VCT_Button>
                            </div>
                        </div>
                    </VCT_Card>
                </motion.div>
            )}

            {INJURY_REPORTS.map((r) => (
                <VCT_Card key={r.id}>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <VCT_Text variant="body" style={{ fontWeight: 600 }}>{r.athleteName}</VCT_Text>
                            <div className="flex items-center gap-2">
                                <VCT_Badge
                                    type={r.status === 'done' ? 'success' : r.status === 'treating' ? 'warning' : 'danger'}
                                    text={r.status === 'done' ? 'Xử lý xong' : r.status === 'treating' ? 'Đang điều trị' : 'Mới'}
                                />
                                <VCT_Badge
                                    type={r.type === 'nang' ? 'danger' : r.type === 'trung_binh' ? 'warning' : 'info'}
                                    text={r.type === 'nang' ? 'Nặng' : r.type === 'trung_binh' ? 'TB' : 'Nhẹ'}
                                />
                            </div>
                        </div>
                        <VCT_Text variant="body">{r.description}</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', marginTop: 4 }}>
                            {r.team} · {r.arena} · {r.time}
                        </VCT_Text>
                    </div>
                </VCT_Card>
            ))}
        </div>
    )
}

/* ── First Aid Tab ──────────────────────────────────────────── */

function FirstAidTab() {
    const firstAidLog = [
        { time: '09:30', athlete: 'Nguyễn Văn A', action: 'Băng bó + chườm đá', medic: 'BS. Trần', arena: 'Sân A1' },
        { time: '10:15', athlete: 'Lê Văn C', action: 'Sát trùng vết xước', medic: 'Y tá Ngọc', arena: 'Sân B1' },
        { time: '11:00', athlete: 'Trần Văn D', action: 'Nẹp cố định + chuyển BV', medic: 'BS. Trần', arena: 'Sân B2' },
    ]

    return (
        <div className="grid gap-3">
            <VCT_Text variant="h2">Nhật ký sơ cứu</VCT_Text>
            {firstAidLog.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <VCT_Card>
                        <div className="p-4 flex items-start gap-3">
                            <div
                                className="rounded-lg px-3 py-2 text-center min-w-[3.5rem]"
                                style={{ background: 'rgba(5,150,105,0.1)' }}
                            >
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>{entry.time}</div>
                            </div>
                            <div className="flex-1">
                                <VCT_Text variant="body" style={{ fontWeight: 600 }}>{entry.athlete}</VCT_Text>
                                <VCT_Text variant="body">{entry.action}</VCT_Text>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    {entry.medic} · {entry.arena}
                                </VCT_Text>
                            </div>
                        </div>
                    </VCT_Card>
                </motion.div>
            ))}
        </div>
    )
}
