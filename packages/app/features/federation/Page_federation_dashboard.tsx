'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_EmptyState,
    VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useFederationStats } from '../hooks/useFederationAPI'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'

// ════════════════════════════════════════
// FEDERATION — DASHBOARD (TỔNG QUAN QUỐC GIA)
// Wired to /api/v1/federation/statistics with fallback
// ════════════════════════════════════════

// ── Fallback data (used when API unavailable) ──
const FALLBACK_STATS = {
    total_provinces: 63, active_provinces: 18,
    total_clubs: 498, total_athletes: 12450, total_coaches: 856, total_referees: 324,
    active_tournaments: 5, total_tournaments_ytd: 12,
    by_region: { north: 25, central: 13, south: 25 },
    top_provinces_by_clubs: [],
}

const REGION_LABELS: Record<string, { name: string; color: string }> = {
    north: { name: 'Miền Bắc', color: '#818cf8' },
    central: { name: 'Miền Trung', color: '#34d399' },
    south: { name: 'Miền Nam', color: '#f59e0b' },
}

const RECENT_ACTIVITY = [
    { id: '1', label: 'Giải VCT Toàn quốc 2024', type: 'Giải đấu', status: 'Đang diễn ra', color: '#10b981', time: '2 giờ trước' },
    { id: '2', label: 'CLB Lý Thường Kiệt — TP.HCM', type: 'Đăng ký CLB', status: 'Chờ duyệt', color: '#f59e0b', time: '5 giờ trước' },
    { id: '3', label: 'Thi thăng đai Đợt 3/2024', type: 'Thăng đai', status: 'Hoàn thành', color: '#8b5cf6', time: '1 ngày trước' },
    { id: '4', label: 'Bình Định — Bổ nhiệm Phó CT', type: 'Nhân sự', status: 'Đã duyệt', color: '#0ea5e9', time: '2 ngày trước' },
    { id: '5', label: 'Luật 128/2024 — Sửa đổi bổ sung', type: 'Quy chế', status: 'Có hiệu lực', color: '#ef4444', time: '3 ngày trước' },
]

const QUICK_ACTIONS = [
    { label: 'Duyệt hồ sơ', icon: '✅', count: 3, color: '#10b981' },
    { label: 'CLB chờ xét', icon: '🏢', count: 7, color: '#f59e0b' },
    { label: 'Thẻ sắp hết hạn', icon: '⚠️', count: 12, color: '#ef4444' },
    { label: 'Báo cáo mới', icon: '📊', count: 2, color: '#0ea5e9' },
]

export function Page_federation_dashboard() {
    const { data: apiStats, isLoading } = useFederationStats()
    const stats = apiStats || FALLBACK_STATS

    const totalVDV = stats.total_athletes
    const regionData = Object.entries(stats.by_region || {}).map(([key, count]) => ({
        key, count: count as number,
        ...REGION_LABELS[key] || { name: key, color: '#666' },
    }))

    const { ToastContainer } = useRealtimeNotifications()

    return (
        <VCT_PageContainer size="wide" animated>
            <ToastContainer />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">
                    Tổng quan Liên đoàn Quốc gia
                </h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">
                    Dashboard tổng hợp hoạt động — KPI, thống kê theo vùng, cảnh báo và phê duyệt.
                    {isLoading && <span className="ml-2 text-[var(--vct-accent-cyan)]">Đang tải...</span>}
                </p>
            </div>

            {/* ── KPI Row ── */}
            <VCT_StatRow items={[
                { label: 'Tỉnh/TP', value: stats.total_provinces, icon: <VCT_Icons.MapPin size={18} />, color: '#8b5cf6' },
                { label: 'Có Liên đoàn', value: stats.active_provinces, icon: <VCT_Icons.Building2 size={18} />, color: '#10b981' },
                { label: 'Tổng CLB', value: stats.total_clubs, icon: <VCT_Icons.Home size={18} />, color: '#f59e0b' },
                { label: 'Tổng VĐV', value: (stats.total_athletes || 0).toLocaleString('vi-VN'), icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-6 lg:grid-cols-3 mb-6">
                {/* ── Regional Breakdown ── */}
                <div className="lg:col-span-2 rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">
                        📊 Phân bố theo Vùng miền
                    </h2>
                    <div className="space-y-4">
                        {regionData.map(r => {
                            const total = regionData.reduce((s, x) => s + x.count, 0) || 1
                            const pct = Math.round((r.count / total) * 100)
                            return (
                                <div key={r.key}>
                                    <VCT_Stack direction="row" justify="space-between" align="center" className="mb-1">
                                        <span className="text-sm font-semibold text-[var(--vct-text-primary)]">{r.name}</span>
                                        <span className="text-xs text-[var(--vct-text-secondary)]">{r.count} tỉnh</span>
                                    </VCT_Stack>
                                    <div className="h-3 rounded-full bg-[var(--vct-bg-elevated)] overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}88)` }}
                                        />
                                    </div>
                                    <div className="text-right text-[10px] font-bold mt-1" style={{ color: r.color }}>{pct}%</div>
                                </div>
                            )
                        })}
                    </div>

                    {/* ── Extra Stats ── */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[var(--vct-border-subtle)]">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#f59e0b]">{stats.total_coaches}</div>
                            <div className="text-[10px] opacity-50 uppercase font-bold">Huấn luyện viên</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#8b5cf6]">{stats.total_referees}</div>
                            <div className="text-[10px] opacity-50 uppercase font-bold">Trọng tài</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#10b981]">{stats.total_tournaments_ytd}</div>
                            <div className="text-[10px] opacity-50 uppercase font-bold">Giải đấu năm nay</div>
                        </div>
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">
                        ⚡ Cần xử lý
                    </h2>
                    <div className="space-y-3">
                        {QUICK_ACTIONS.map(a => (
                            <div key={a.label}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--vct-bg-elevated)] hover:bg-[var(--vct-bg-hover)] transition-colors cursor-pointer border border-transparent hover:border-[var(--vct-border-subtle)]">
                                <span className="text-xl">{a.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-[var(--vct-text-primary)]">{a.label}</div>
                                </div>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: a.color }}>
                                    {a.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recent Activity ── */}
            <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">
                    🕐 Hoạt động gần đây
                </h2>
                <div className="space-y-3">
                    {RECENT_ACTIVITY.map(a => (
                        <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--vct-bg-elevated)] transition-colors">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[var(--vct-text-primary)] truncate">{a.label}</div>
                                <div className="text-xs text-[var(--vct-text-secondary)]">{a.type}</div>
                            </div>
                            <VCT_Badge text={a.status} type={a.status === 'Đang diễn ra' ? 'success' : a.status === 'Chờ duyệt' ? 'warning' : 'neutral'} />
                            <span className="text-xs text-[var(--vct-text-secondary)] flex-shrink-0">{a.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </VCT_PageContainer>
    )
}
