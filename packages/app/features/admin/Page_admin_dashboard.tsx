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
import { useAdminFetch } from './hooks/useAdminAPI'
import { useI18n } from '../i18n'


// ════════════════════════════════════════
// TYPES (for API data)
// ════════════════════════════════════════
interface ServiceStatus {
    name: string
    status: string
    latency: string
    clients?: number
}

interface DashboardStats {
    services: ServiceStatus[]
    timeline: { time: string; title: string; description: string }[]
    goroutines: number
    memory_mb: number
    gc_runs: number
    ws_clients: number
    storage: string
    go_version: string
}

// ── System Admin Navigation (primary) ──
const QUICK_NAV = [
    { label: 'Quản lý Tài khoản', desc: 'Người dùng & phân quyền', icon: VCT_Icons.Users, color: '#0ea5e9', href: '/admin/users' },
    { label: 'Vai trò & Quyền', desc: 'RBAC, phân quyền chi tiết', icon: VCT_Icons.Shield, color: '#6366f1', href: '/admin/roles' },
    { label: 'Tổ chức (Tenants)', desc: 'Quản lý multi-tenant', icon: VCT_Icons.Building, color: '#8b5cf6', href: '/admin/tenants' },
    { label: 'Feature Flags', desc: 'Bật/tắt tính năng, rollout', icon: VCT_Icons.Flag, color: '#ef4444', href: '/admin/feature-flags' },
    { label: 'CMS Nội Dung', desc: 'Branding, theme, giao diện', icon: VCT_Icons.Layout, color: '#8b5cf6', href: '/admin/cms' },
    { label: 'Cấu hình Hệ thống', desc: 'Tham số, health & cài đặt', icon: VCT_Icons.Settings, color: '#f59e0b', href: '/admin/system' },
    { label: 'Nhật ký Audit', desc: 'Lịch sử thao tác & bảo mật', icon: VCT_Icons.FileText, color: '#0ea5e9', href: '/admin/audit-logs' },
    { label: 'Toàn vẹn Dữ liệu', desc: 'Giám sát liêm chính hệ thống', icon: VCT_Icons.ShieldCheck, color: '#10b981', href: '/admin/integrity' },
    { label: 'Chất lượng Dữ liệu', desc: 'Kiểm tra & xác thực dữ liệu', icon: VCT_Icons.Activity, color: '#06b6d4', href: '/admin/data-quality' },
    { label: 'Thông báo Hệ thống', desc: 'Quản lý thông báo platform', icon: VCT_Icons.Bell, color: '#f97316', href: '/admin/notifications' },
    { label: 'Gói Dịch vụ', desc: 'Subscription, thanh toán & gia hạn', icon: VCT_Icons.CreditCard, color: '#a855f7', href: '/admin/subscriptions' },
    { label: 'Chứng chỉ & Tài liệu', desc: 'Quản lý văn bằng, chứng chỉ', icon: VCT_Icons.FileText, color: '#14b8a6', href: '/admin/documents' },
]

// ════════════════════════════════════════
// HEALTH SCORE CALCULATION
// ════════════════════════════════════════
function getHealthScore(services: ServiceStatus[]): { score: number; grade: string; color: string } {
    if (services.length === 0) return { score: 0, grade: '—', color: '#94a3b8' }
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
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_dashboard = () => (
    <AdminGuard>
        <Page_admin_dashboard_Content />
    </AdminGuard>
)

const Page_admin_dashboard_Content = () => {
    const router = useRouter()
    const { t } = useI18n()
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastRefreshed, setLastRefreshed] = useState(new Date())

    // ── Fetch real dashboard data from API ──
    const { data: dashData, isLoading, refetch } = useAdminFetch<DashboardStats>('/admin/dashboard/stats')

    const services = dashData?.services ?? []
    const timelineRaw = dashData?.timeline ?? []

    // Map timeline data to TimelineEvent format
    const timelineEvents: TimelineEvent[] = timelineRaw.map((e, i) => ({
        time: e.time,
        title: e.title,
        description: e.description,
        icon: i % 3 === 0 ? <VCT_Icons.Settings size={14} /> : i % 3 === 1 ? <VCT_Icons.Users size={14} /> : <VCT_Icons.Shield size={14} />,
        color: i % 3 === 0 ? '#0ea5e9' : i % 3 === 1 ? '#10b981' : '#f59e0b',
    }))

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return
        const interval = setInterval(() => {
            refetch()
            setLastRefreshed(new Date())
        }, 30000)
        return () => clearInterval(interval)
    }, [autoRefresh, refetch])

    const handleManualRefresh = useCallback(() => {
        refetch()
        setLastRefreshed(new Date())
    }, [refetch])

    // Keyboard shortcut: R = refresh
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === 'r' || e.key === 'R') handleManualRefresh()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleManualRefresh])

    const health = getHealthScore(services)

    const dashStats: StatItem[] = [
        { label: 'Goroutines', value: dashData?.goroutines ?? '—', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
        { label: 'Memory', value: dashData ? `${dashData.memory_mb} MB` : '—', icon: <VCT_Icons.Layers size={18} />, color: '#0ea5e9' },
        { label: 'GC Runs', value: dashData?.gc_runs ?? '—', icon: <VCT_Icons.TrendingUp size={18} />, color: '#f59e0b' },
        { label: 'WS Clients', value: dashData?.ws_clients ?? 0, icon: <VCT_Icons.Users size={18} />, color: '#8b5cf6' },
    ]

    return (
        <AdminPageShell
            title={t('admin.dashboard.title')}
            subtitle={t('admin.dashboard.subtitle')}
            icon={<VCT_Icons.Activity size={28} className="text-[#10b981]" />}
            stats={dashStats}
            actions={
                <VCT_Stack direction="row" gap={8} align="center">
                    <span className="text-[10px] text-(--vct-text-tertiary)">
                        Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
                    </span>
                    {autoRefresh && <span className="admin-live-badge" role="status" aria-label="Tự động cập nhật đang bật">LIVE</span>}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        aria-label={autoRefresh ? 'Tắt tự động cập nhật' : 'Bật tự động cập nhật'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all admin-focus-ring ${autoRefresh ? 'bg-[#10b98120] border-[#10b981] text-[#10b981]' : 'bg-transparent border-(--vct-border-subtle) text-(--vct-text-tertiary)'}`}
                    >
                        {autoRefresh ? '● Auto' : '○ Manual'}
                    </button>
                    <VCT_Button variant="outline" onClick={handleManualRefresh} icon={<VCT_Icons.Activity size={14} />}>
                        Refresh
                    </VCT_Button>
                </VCT_Stack>
            }
        >

            {/* ── HEALTH SCORE + SERVICE STATUS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Health Score Widget */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] uppercase tracking-widest text-(--vct-text-tertiary) font-bold mb-3">System Health</div>
                    {isLoading ? (
                        <div className="w-24 h-24 rounded-full bg-(--vct-bg-base) animate-pulse mb-3" />
                    ) : (
                        <div
                            className="admin-health-ring mb-3"
                            style={{ '--_ring-color': health.color, '--_ring-deg': `${health.score * 3.6}deg` } as React.CSSProperties}
                        >
                            <div className="admin-health-ring__inner">
                                <span className="admin-health-grade" style={{ '--_grade-color': health.color } as React.CSSProperties}>{health.grade}</span>
                            </div>
                        </div>
                    )}
                    <div className="text-sm font-bold text-(--vct-text-primary)">{health.score}% Services Online</div>
                    <div className="text-[11px] text-(--vct-text-tertiary) mt-1">
                        {services.filter(s => s.status === 'online').length}/{services.length} dịch vụ hoạt động
                    </div>
                    {dashData && (
                        <div className="text-[10px] text-(--vct-text-tertiary) mt-2">
                            Storage: {dashData.storage} · {dashData.go_version}
                        </div>
                    )}
                </div>

                {/* Service Status Panel */}
                <div className="lg:col-span-2 bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-(--vct-text-primary) flex items-center gap-2">
                            <VCT_Icons.Activity size={20} className="text-[#10b981]" /> Trạng thái dịch vụ
                        </h2>
                        <VCT_Badge type={services.every(s => s.status === 'online') ? 'success' : 'warning'} text={`${services.length} dịch vụ`} />
                    </div>
                    <div className="space-y-3">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <SkeletonServiceItem key={i} />)
                        ) : services.length === 0 ? (
                            <div className="text-center text-(--vct-text-tertiary) py-8 text-sm">
                                <VCT_Icons.Info size={24} className="mx-auto mb-2 opacity-50" />
                                Chưa có dữ liệu dịch vụ. Khởi động backend để xem trạng thái thật.
                            </div>
                        ) : (
                            services.map(svc => (
                                <div key={svc.name} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${svc.status === 'online' ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse'}`}></div>
                                        <span className="font-semibold text-sm text-(--vct-text-primary)">{svc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-(--vct-text-tertiary)">
                                        <VCT_Badge type={svc.status === 'online' ? 'success' : 'danger'} text={svc.status} />
                                        {svc.clients !== undefined && <span>Clients: <span className="font-bold text-(--vct-accent-cyan)">{svc.clients}</span></span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── RUNTIME METRICS + TIMELINE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Runtime Metrics */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={20} className="text-[#0ea5e9]" /> Runtime Metrics
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-(--vct-bg-base) rounded-xl animate-pulse" />)}
                        </div>
                    ) : dashData ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Goroutines', value: dashData.goroutines, color: '#10b981' },
                                { label: 'Memory', value: `${dashData.memory_mb} MB`, color: '#0ea5e9' },
                                { label: 'GC Runs', value: dashData.gc_runs, color: '#f59e0b' },
                                { label: 'WS Clients', value: dashData.ws_clients, color: '#8b5cf6' },
                            ].map(m => (
                                <div key={m.label} className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{m.label}</div>
                                    <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-(--vct-text-tertiary) py-8 text-sm">
                            <VCT_Icons.Info size={24} className="mx-auto mb-2 opacity-50" />
                            Khởi động backend để xem metrics thực.
                        </div>
                    )}
                </div>

                {/* ── RECENT ACTIVITY TIMELINE ── */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-(--vct-text-primary) flex items-center gap-2">
                            <VCT_Icons.Clock size={20} className="text-[#f59e0b]" /> Hoạt động gần đây
                        </h2>
                        <VCT_Badge type="info" text={`${timelineEvents.length} sự kiện`} />
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <SkeletonTimelineItem key={i} />)}
                        </div>
                    ) : timelineEvents.length === 0 ? (
                        <div className="text-center text-(--vct-text-tertiary) py-8 text-sm">
                            <VCT_Icons.Clock size={24} className="mx-auto mb-2 opacity-50" />
                            Chưa có hoạt động. Các audit log sẽ hiển thị tại đây.
                        </div>
                    ) : (
                        <VCT_Timeline events={timelineEvents} maxHeight={400} />
                    )}
                </div>
            </div>

            {/* ── SYSTEM ADMIN QUICK NAV ── */}
            <div className="mt-6">
                <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                    <VCT_Icons.Settings size={20} className="text-[#0ea5e9]" /> Quản trị Hệ thống
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            </div>

        </AdminPageShell>
    )
}
