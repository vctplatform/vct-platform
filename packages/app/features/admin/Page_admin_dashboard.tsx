'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_PageContainer, VCT_StatRow, VCT_Badge, VCT_Button, VCT_Stack } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Timeline } from '../components/VCT_Timeline'
import type { TimelineEvent } from '../components/VCT_Timeline'

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
    { label: 'Bảo mật', desc: 'Audit logs, giám sát liêm chính', icon: VCT_Icons.Shield, color: '#8b5cf6', href: '/admin/audit-logs' },
    { label: 'Cấu hình', desc: 'Feature flags & tham số hệ thống', icon: VCT_Icons.Settings, color: '#f59e0b', href: '/admin/system' },
]

// ════════════════════════════════════════
// SKELETON COMPONENTS
// ════════════════════════════════════════
const SkeletonServiceItem = () => (
    <div className="flex items-center justify-between p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--vct-bg-elevated)] animate-pulse" />
            <div className="h-4 w-32 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-14 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
        </div>
    </div>
)

const SkeletonTimelineItem = () => (
    <div className="flex items-start gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-[var(--vct-bg-elevated)] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
        </div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_dashboard = () => {
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

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">VCT Platform Analytics</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Giám sát toàn bộ nền tảng VCT — hiệu suất, bảo mật và tải hệ thống.</p>
                </div>
                <VCT_Stack direction="row" gap={8} align="center">
                    <span className="text-[10px] text-[var(--vct-text-tertiary)]">
                        Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
                    </span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${autoRefresh ? 'bg-[#10b98120] border-[#10b981] text-[#10b981]' : 'bg-transparent border-[var(--vct-border-subtle)] text-[var(--vct-text-tertiary)]'}`}
                    >
                        {autoRefresh ? '● Auto' : '○ Manual'}
                    </button>
                    <VCT_Button variant="outline" onClick={handleManualRefresh} icon={<VCT_Icons.Activity size={14} />}>
                        Refresh
                    </VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Uptime TB', value: '99.9%', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Online', value: onlineCount, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'Req/phút', value: '2.4k', icon: <VCT_Icons.TrendingUp size={18} />, color: '#f59e0b' },
                { label: 'Cảnh báo', value: 1, icon: <VCT_Icons.Alert size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── SERVICE STATUS ── */}
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={20} className="text-[#10b981]" /> Trạng thái dịch vụ
                    </h2>
                    <div className="space-y-3">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => <SkeletonServiceItem key={i} />)
                        ) : (
                            SERVICE_STATUS.map(svc => (
                                <div key={svc.name} className="flex items-center justify-between p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${svc.status === 'online' ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse'}`}></div>
                                        <span className="font-semibold text-sm text-[var(--vct-text-primary)]">{svc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-[var(--vct-text-tertiary)]">
                                        <span>Uptime: <span className="font-bold text-[var(--vct-text-primary)]">{svc.uptime}</span></span>
                                        <span>Latency: <span className="font-bold text-[var(--vct-accent-cyan)]">{svc.latency}</span></span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── RECENT ACTIVITY TIMELINE ── */}
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-[var(--vct-text-primary)] flex items-center gap-2">
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {QUICK_NAV.map(nav => (
                    <button
                        key={nav.href}
                        type="button"
                        onClick={() => router.push(nav.href)}
                        className={`bg-gradient-to-br from-[${nav.color}20] to-transparent border border-[${nav.color}40] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[${nav.color}] transition-colors text-left`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg`} style={{ backgroundColor: nav.color, boxShadow: `0 10px 15px -3px ${nav.color}40` }}>
                            <nav.icon size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-[var(--vct-text-primary)] text-lg">{nav.label}</div>
                            <div className="text-sm text-[var(--vct-text-secondary)]">{nav.desc}</div>
                        </div>
                    </button>
                ))}
            </div>
        </VCT_PageContainer>
    )
}
