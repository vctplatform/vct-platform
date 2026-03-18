'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_Badge, VCT_Button, VCT_Stack } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Timeline } from '../components/VCT_Timeline'
import type { TimelineEvent } from '../components/VCT_Timeline'
import { AdminPageShell } from './components/AdminPageShell'
import { AdminGuard } from './components/AdminGuard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import { useI18n as _useI18n } from '../i18n'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const SERVICE_STATUS = [
    { name: 'Next.js Frontend', status: 'online', uptime: '99.98%', latency: '45ms' },
    { name: 'Go API Backend', status: 'online', uptime: '99.95%', latency: '12ms' },
    { name: 'PostgreSQL Database', status: 'online', uptime: '99.99%', latency: '3ms' },
    { name: 'Redis Cache', status: 'online', uptime: '99.97%', latency: '1ms' },
    { name: 'File Storage (S3)', status: 'online', uptime: '99.99%', latency: '85ms' },
    { name: 'Email Service', status: 'degraded', uptime: '98.50%', latency: '250ms' },
]

const ACTIVE_ALERTS = [
    { id: 'ALT-01', severity: 'warning', title: 'Email Service latency cao', detail: 'Latency trung bình 250ms (ngưỡng: 100ms)', time: '5 phút trước', service: 'Email Service' },
    { id: 'ALT-02', severity: 'info', title: 'Backup hoàn tất', detail: 'PostgreSQL backup 2.3GB thành công', time: '25 phút trước', service: 'Database' },
    { id: 'ALT-03', severity: 'error', title: 'Login brute-force detected', detail: '5 lần đăng nhập thất bại từ IP 45.67.89.12', time: '1 giờ trước', service: 'Auth' },
]

const TIMELINE_EVENTS: TimelineEvent[] = [
    { time: '00:32:15', title: 'Cập nhật cấu hình giải', description: 'admin@vct.vn · IP: 192.168.1.100', icon: <VCT_Icons.Settings size={14} />, color: '#0ea5e9' },
    { time: '00:28:40', title: 'Phê duyệt VĐV #ATH-156', description: 'btc@vct.vn · Nguyễn Văn A', icon: <VCT_Icons.CheckCircle size={14} />, color: '#10b981' },
    { time: '00:25:12', title: 'Backup database tự động', description: 'system · PostgreSQL 2.3GB', icon: <VCT_Icons.Database size={14} />, color: '#8b5cf6' },
    { time: '00:20:05', title: 'Đăng nhập từ thiết bị mới', description: 'referee@vct.vn · IP: 172.16.0.22', icon: <VCT_Icons.Users size={14} />, color: '#f59e0b' },
    { time: '00:15:30', title: 'Tạo kỳ thi thăng cấp Q2/2024', description: 'admin@vct.vn · IP: 192.168.1.100', icon: <VCT_Icons.Plus size={14} />, color: '#10b981' },
    { time: '23:58:45', title: 'Đăng nhập thất bại 5 lần', description: 'unknown · IP: 45.67.89.12', icon: <VCT_Icons.Shield size={14} />, color: '#ef4444' },
    { time: '23:45:10', title: 'Xóa tài khoản test_user_01', description: 'admin@vct.vn · Dọn dẹp tài khoản thử nghiệm', icon: <VCT_Icons.Trash size={14} />, color: '#ef4444' },
]

const QUICK_NAV = [
    { label: 'Quản lý Tài khoản', desc: 'Người dùng, vai trò & phân quyền', icon: VCT_Icons.Users, color: '#0ea5e9', href: '/admin/users' },
    { label: 'Giải đấu', desc: 'Tạo, điều hành & theo dõi giải', icon: VCT_Icons.Trophy, color: '#f59e0b', href: '/admin/tournaments' },
    { label: 'Nhân sự', desc: 'VĐV, HLV & Trọng tài', icon: VCT_Icons.Users, color: '#06b6d4', href: '/admin/people' },
    { label: 'Tài chính', desc: 'Hóa đơn, ngân sách & tài trợ', icon: VCT_Icons.DollarSign, color: '#10b981', href: '/admin/finance' },
    { label: 'Chấm điểm Live', desc: 'Giám sát trận đấu real-time', icon: VCT_Icons.Activity, color: '#ef4444', href: '/admin/scoring' },
    { label: 'Xếp hạng', desc: 'ELO rating & thăng cấp đai', icon: VCT_Icons.Trophy, color: '#d97706', href: '/admin/rankings' },
    { label: 'Liên đoàn', desc: 'Tổ chức & nhân sự các cấp', icon: VCT_Icons.Building, color: '#8b5cf6', href: '/admin/federation' },
    { label: 'Câu lạc bộ', desc: 'CLB, cơ sở & thiết bị', icon: VCT_Icons.Home, color: '#059669', href: '/admin/clubs' },
    { label: 'Bảo mật', desc: 'Audit logs, giám sát liêm chính', icon: VCT_Icons.Shield, color: '#8b5cf6', href: '/admin/audit-logs' },
    { label: 'Cấu hình', desc: 'Feature flags & tham số hệ thống', icon: VCT_Icons.Settings, color: '#f59e0b', href: '/admin/system' },
    { label: 'Dữ liệu tham chiếu', desc: 'Cấp đai, hạng cân, tiêu chí', icon: VCT_Icons.Layers, color: '#10b981', href: '/admin/reference-data' },
    { label: 'Feature Flags', desc: 'Bật/tắt tính năng, rollout', icon: VCT_Icons.Flag, color: '#ef4444', href: '/admin/feature-flags' },
    { label: 'Hỗ trợ KH', desc: 'Ticket hỗ trợ, FAQ, kỹ thuật', icon: VCT_Icons.Shield, color: '#ec4899', href: '/admin/support' },
    { label: 'Subscription', desc: 'Gói dịch vụ, thanh toán & gia hạn', icon: VCT_Icons.CreditCard, color: '#a855f7', href: '/admin/subscriptions' },
]

const CHART_DATA_API = [
    { time: '00:00', requests: 1200, errors: 12 },
    { time: '04:00', requests: 800, errors: 5 },
    { time: '08:00', requests: 3500, errors: 45 },
    { time: '12:00', requests: 5200, errors: 80 },
    { time: '16:00', requests: 4800, errors: 50 },
    { time: '20:00', requests: 6100, errors: 110 },
    { time: '24:00', requests: 2100, errors: 20 },
]

const CHART_DATA_USERS = [
    { day: 'T2', athletes: 120, clubs: 5 },
    { day: 'T3', athletes: 150, clubs: 8 },
    { day: 'T4', athletes: 180, clubs: 12 },
    { day: 'T5', athletes: 220, clubs: 15 },
    { day: 'T6', athletes: 280, clubs: 20 },
    { day: 'T7', athletes: 400, clubs: 35 },
    { day: 'CN', athletes: 350, clubs: 28 },
]

// ════════════════════════════════════════
// HEALTH SCORE CALCULATION
// ════════════════════════════════════════
function getHealthScore(services: typeof SERVICE_STATUS): { score: number; grade: string; color: string } {
    const onlineCount = services.filter(s => s.status === 'online').length
    const total = services.length
    const score = Math.round((onlineCount / total) * 100)
    if (score >= 98) return { score, grade: 'A', color: '#10b981' }
    if (score >= 90) return { score, grade: 'B', color: '#22c55e' }
    if (score >= 75) return { score, grade: 'C', color: '#f59e0b' }
    if (score >= 50) return { score, grade: 'D', color: '#ef4444' }
    return { score, grade: 'F', color: '#dc2626' }
}

// ════════════════════════════════════════
// SKELETON COMPONENTS
// ════════════════════════════════════════
const SkeletonServiceItem = () => (
    <div className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-(--vct-bg-elevated) animate-pulse" />
            <div className="h-4 w-32 bg-(--vct-bg-elevated) rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-(--vct-bg-elevated) rounded animate-pulse" />
            <div className="h-3 w-14 bg-(--vct-bg-elevated) rounded animate-pulse" />
        </div>
    </div>
)

const SkeletonTimelineItem = () => (
    <div className="flex items-start gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-(--vct-bg-elevated) animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-(--vct-bg-elevated) rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-(--vct-bg-elevated) rounded animate-pulse" />
        </div>
    </div>
)

// ════════════════════════════════════════
// ALERT SEVERITY CONFIG
// ════════════════════════════════════════
const ALERT_SEVERITY: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
    error: { icon: <VCT_Icons.Alert size={16} />, bg: 'bg-[#ef444410]', border: 'border-[#ef444440]', text: 'text-[#ef4444]' },
    warning: { icon: <VCT_Icons.AlertTriangle size={16} />, bg: 'bg-[#f59e0b10]', border: 'border-[#f59e0b40]', text: 'text-[#f59e0b]' },
    info: { icon: <VCT_Icons.Info size={16} />, bg: 'bg-[#0ea5e910]', border: 'border-[#0ea5e940]', text: 'text-[#0ea5e9]' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_dashboard = () => (
    <AdminGuard>
        <Page_admin_dashboard_Content />
    </AdminGuard>
)

const Page_admin_dashboard_Content = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastRefreshed, setLastRefreshed] = useState(new Date())
    const [onlineCount, setOnlineCount] = useState(128)

    useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(() => {
            setLastRefreshed(new Date())
            setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2) // fluctuate ±2
        }, 30000)
        return () => clearInterval(interval)
    }, [autoRefresh])

    const handleManualRefresh = useCallback(() => {
        setIsLoading(true)
        setLastRefreshed(new Date())
        setTimeout(() => setIsLoading(false), 500)
    }, [])

    // Keyboard shortcut: R = refresh
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === 'r' || e.key === 'R') handleManualRefresh()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleManualRefresh])

    const health = getHealthScore(SERVICE_STATUS)

    const dashStats: StatItem[] = [
        { label: 'Uptime TB', value: '99.9%', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
        { label: 'Online', value: onlineCount, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
        { label: 'Req/phút', value: '2.4k', icon: <VCT_Icons.TrendingUp size={18} />, color: '#f59e0b' },
        { label: 'Cảnh báo', value: ACTIVE_ALERTS.length, icon: <VCT_Icons.Alert size={18} />, color: '#ef4444' },
    ]

    return (
        <AdminPageShell
            title="VCT Platform Analytics"
            subtitle="Giám sát toàn bộ nền tảng VCT — hiệu suất, bảo mật và tải hệ thống."
            icon={<VCT_Icons.Activity size={28} className="text-[#10b981]" />}
            stats={dashStats}
            actions={
                <VCT_Stack direction="row" gap={8} align="center">
                    <span className="text-[10px] text-(--vct-text-tertiary)">
                        Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
                    </span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${autoRefresh ? 'bg-[#10b98120] border-[#10b981] text-[#10b981]' : 'bg-transparent border-(--vct-border-subtle) text-(--vct-text-tertiary)'}`}
                    >
                        {autoRefresh ? '● Auto' : '○ Manual'}
                    </button>
                    <VCT_Button variant="outline" onClick={handleManualRefresh} icon={<VCT_Icons.Activity size={14} />}>
                        Refresh
                    </VCT_Button>
                </VCT_Stack>
            }
        >

            {/* ── HEALTH SCORE + ACTIVE ALERTS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Health Score Widget */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] uppercase tracking-widest text-(--vct-text-tertiary) font-bold mb-3">System Health</div>
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mb-3 relative"
                        style={{
                            background: `conic-gradient(${health.color} ${health.score * 3.6}deg, transparent 0deg)`,
                        }}
                    >
                        <div className="w-20 h-20 rounded-full bg-(--vct-bg-elevated) flex items-center justify-center">
                            <span className="text-3xl font-black" style={{ color: health.color }}>{health.grade}</span>
                        </div>
                    </div>
                    <div className="text-sm font-bold text-(--vct-text-primary)">{health.score}% Services Online</div>
                    <div className="text-[11px] text-(--vct-text-tertiary) mt-1">
                        {SERVICE_STATUS.filter(s => s.status === 'online').length}/{SERVICE_STATUS.length} dịch vụ hoạt động
                    </div>
                </div>

                {/* Active Alerts Panel */}
                <div className="lg:col-span-2 bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-(--vct-text-primary) flex items-center gap-2">
                            <VCT_Icons.Alert size={20} className="text-[#ef4444]" /> Cảnh báo hoạt động
                        </h2>
                        <VCT_Badge type={ACTIVE_ALERTS.some(a => a.severity === 'error') ? 'danger' : 'warning'} text={`${ACTIVE_ALERTS.length} cảnh báo`} />
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-(--vct-bg-base) rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ACTIVE_ALERTS.map(alert => {
                                const sev = ALERT_SEVERITY[alert.severity] ?? ALERT_SEVERITY.info!
                                return (
                                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-white/5 ${sev.bg} ${sev.border}`}>
                                        <div className={`mt-0.5 ${sev.text}`}>{sev.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold text-sm ${sev.text}`}>{alert.title}</span>
                                                <VCT_Badge type={alert.severity === 'error' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'} text={alert.severity.toUpperCase()} />
                                            </div>
                                            <div className="text-xs text-(--vct-text-secondary) mt-0.5 line-clamp-1">{alert.detail}</div>
                                            <div className="text-[10px] text-(--vct-text-tertiary) mt-1">{alert.service} · {alert.time}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CHARTS SECTION ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={20} className="text-[#0ea5e9]" /> Biểu đồ API Requests (24h)
                    </h2>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={CHART_DATA_API} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--vct-border-subtle)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--vct-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--vct-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--vct-bg-elevated)', borderRadius: '8px', border: '1px solid var(--vct-border-strong)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: 'var(--vct-text-primary)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'var(--vct-text-secondary)' }} />
                                <Line type="monotone" name="Requests" dataKey="requests" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" name="Errors" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Users size={20} className="text-[#10b981]" /> Người dùng đăng ký (7 ngày)
                    </h2>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA_USERS} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--vct-border-subtle)" vertical={false} />
                                <XAxis dataKey="day" stroke="var(--vct-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--vct-text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--vct-bg-elevated)', borderRadius: '8px', border: '1px solid var(--vct-border-strong)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: 'var(--vct-text-primary)' }}
                                    cursor={{ fill: 'var(--vct-bg-base)', opacity: 0.5 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'var(--vct-text-secondary)' }} />
                                <Bar name="Vận động viên" dataKey="athletes" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar name="Câu lạc bộ" dataKey="clubs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── SERVICE STATUS ── */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={20} className="text-[#10b981]" /> Trạng thái dịch vụ
                    </h2>
                    <div className="space-y-3">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => <SkeletonServiceItem key={i} />)
                        ) : (
                            SERVICE_STATUS.map(svc => (
                                <div key={svc.name} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${svc.status === 'online' ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse'}`}></div>
                                        <span className="font-semibold text-sm text-(--vct-text-primary)">{svc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-(--vct-text-tertiary)">
                                        <span>Uptime: <span className="font-bold text-(--vct-text-primary)">{svc.uptime}</span></span>
                                        <span>Latency: <span className="font-bold text-(--vct-accent-cyan)">{svc.latency}</span></span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── RECENT ACTIVITY TIMELINE ── */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-(--vct-text-primary) flex items-center gap-2">
                            <VCT_Icons.Clock size={20} className="text-[#f59e0b]" /> Hoạt động gần đây
                        </h2>
                        <VCT_Badge type="info" text={`${TIMELINE_EVENTS.length} sự kiện`} />
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <SkeletonTimelineItem key={i} />)}
                        </div>
                    ) : (
                        <VCT_Timeline events={TIMELINE_EVENTS} maxHeight={400} />
                    )}
                </div>
            </div>

            {/* ── QUICK NAV CARDS ── */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {QUICK_NAV.map(nav => (
                    <button
                        key={nav.href}
                        type="button"
                        onClick={() => router.push(nav.href)}
                        className="rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all text-left hover:scale-[1.02] hover:shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${nav.color}15, transparent)`,
                            border: `1px solid ${nav.color}30`,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = nav.color }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${nav.color}30` }}
                    >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: nav.color, boxShadow: `0 8px 16px -4px ${nav.color}40` }}>
                            <nav.icon size={22} />
                        </div>
                        <div>
                            <div className="font-bold text-(--vct-text-primary) text-sm">{nav.label}</div>
                            <div className="text-xs text-(--vct-text-secondary)">{nav.desc}</div>
                        </div>
                    </button>
                ))}
            </div>
        </AdminPageShell>
    )
}
