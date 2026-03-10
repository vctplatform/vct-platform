'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

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

const RECENT_ACTIVITIES = [
    { time: '00:32:15', user: 'admin@vct.vn', action: 'Cập nhật cấu hình giải', ip: '192.168.1.100' },
    { time: '00:28:40', user: 'btc@vct.vn', action: 'Phê duyệt VĐV #ATH-156', ip: '10.0.0.55' },
    { time: '00:25:12', user: 'system', action: 'Backup database tự động', ip: 'internal' },
    { time: '00:20:05', user: 'referee@vct.vn', action: 'Đăng nhập hệ thống', ip: '172.16.0.22' },
    { time: '00:15:30', user: 'admin@vct.vn', action: 'Tạo kỳ thi thăng cấp', ip: '192.168.1.100' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_dashboard = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Bảng Điều Khiển Hệ Thống</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Giám sát tình trạng, hiệu suất và bảo mật hệ thống.</p>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Uptime TB', value: '99.9%', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Online', value: 128, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
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
                        {SERVICE_STATUS.map(svc => (
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
                        ))}
                    </div>
                </div>

                {/* ── RECENT ACTIVITY ── */}
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                        <VCT_Icons.Clock size={20} className="text-[#f59e0b]" /> Hoạt động gần đây
                    </h2>
                    <div className="space-y-2">
                        {RECENT_ACTIVITIES.map((act, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-colors">
                                <div className="text-[10px] font-mono text-[var(--vct-text-tertiary)] mt-0.5 shrink-0 w-16">{act.time}</div>
                                <div className="flex-1">
                                    <div className="text-sm text-[var(--vct-text-primary)]">{act.action}</div>
                                    <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-0.5">
                                        <span className="font-semibold text-[var(--vct-accent-cyan)]">{act.user}</span> • IP: {act.ip}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SYSTEM CARDS ── */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#0ea5e920] to-transparent border border-[#0ea5e940] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#0ea5e9] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#0ea5e940]">
                        <VCT_Icons.Users size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Quản lý Tài khoản</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Người dùng, vai trò & phân quyền</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#8b5cf620] to-transparent border border-[#8b5cf640] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#8b5cf6] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#8b5cf640]">
                        <VCT_Icons.Shield size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Bảo mật</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Chính sách, 2FA & phiên đăng nhập</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#f59e0b20] to-transparent border border-[#f59e0b40] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#f59e0b] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#f59e0b40]">
                        <VCT_Icons.Settings size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Cấu hình</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Feature flags & tham số hệ thống</div>
                    </div>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
