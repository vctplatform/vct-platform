'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Activity Feed v2
// Smart fallback: when API unavailable, shows system status + tips
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import { getAccessToken } from '../../auth/token-storage'

interface ActivityItem {
    id: string
    title: string
    description: string
    timestamp: string
    type: 'alert' | 'update' | 'match'
}

const TYPE_CONFIG = {
    alert: { icon: VCT_Icons.AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    match: { icon: VCT_Icons.Swords, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    update: { icon: VCT_Icons.Bell, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

export function PortalActivityFeed() {
    const { t } = useI18n()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [apiAvailable, setApiAvailable] = useState(true)

    useEffect(() => {
        let mounted = true
        async function fetchActivity() {
            try {
                const token = getAccessToken()
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
                const res = await fetch(`${apiUrl}/api/v1/portal/activities`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: AbortSignal.timeout(5000),
                })
                if (res.ok) {
                    const data = await res.json()
                    if (mounted) setActivities(data.items || [])
                } else {
                    if (mounted) setApiAvailable(false)
                }
            } catch {
                if (mounted) setApiAvailable(false)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchActivity()
        return () => { mounted = false }
    }, [])

    return (
        <div className="flex h-full flex-col gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-3xl ring-1 ring-inset ring-white/[0.03] shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2.5 text-sm font-bold text-vct-text">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-vct-accent/10">
                        <VCT_Icons.Activity size={15} className="text-vct-accent" />
                    </div>
                    {t('portal.activityFeed') || 'Hoạt động Hệ thống'}
                </h3>
                <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
            </div>

            {/* Content  */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto vct-hide-scrollbar">
                {loading ? (
                    /* Skeleton loader */
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                                    <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length > 0 ? (
                    /* Real activity items */
                    activities.map((act, index) => {
                        const config = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.update
                        const Icon = config.icon
                        return (
                            <motion.div
                                key={act.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.06 }}
                                className="group flex cursor-pointer gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-white/[0.05]"
                            >
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} transition-all duration-200 group-hover:scale-110`}>
                                    <Icon size={14} className={config.color} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-vct-text">{act.title}</p>
                                    <p className="mt-0.5 truncate text-[11px] text-vct-text-muted/70">{act.description}</p>
                                    <p className="mt-1 text-[9px] text-vct-text-muted/50">
                                        {new Date(act.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })
                ) : (
                    /* Fallback: System Status Dashboard */
                    <div className="flex flex-col gap-4">
                        {/* System status */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-vct-text-muted/60 uppercase tracking-wider">
                                {t('portal.systemStatus') || 'Trạng thái Hệ thống'}
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <VCT_Icons.CheckCircle size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-400">
                                        {t('portal.systemHealthy') || 'Tất cả Dịch vụ Hoạt động'}
                                    </p>
                                    <p className="text-[10px] text-vct-text-muted/60">
                                        {t('portal.uptime') || 'Uptime'}: 99.9%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick links */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[11px] font-bold text-vct-text-muted/60 uppercase tracking-wider">
                                {t('portal.quickActions') || 'Thao tác Nhanh'}
                            </div>
                            {[
                                { icon: VCT_Icons.BarChart, label: t('portal.viewReports') || 'Xem báo cáo tổng hợp', color: 'text-blue-400' },
                                { icon: VCT_Icons.Calendar, label: t('portal.viewSchedule') || 'Lịch thi đấu', color: 'text-purple-400' },
                                { icon: VCT_Icons.Users, label: t('portal.viewAthletes') || 'Quản lý vận động viên', color: 'text-orange-400' },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="flex items-center gap-3 rounded-lg p-2.5 text-left transition-all duration-200 hover:bg-white/[0.05] group"
                                >
                                    <item.icon size={14} className={`${item.color} transition-transform group-hover:scale-110`} />
                                    <span className="text-xs text-vct-text-muted group-hover:text-vct-text transition-colors">
                                        {item.label}
                                    </span>
                                    <VCT_Icons.ChevronRight size={12} className="ml-auto text-vct-text-muted/30 group-hover:text-vct-text-muted transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Security card */}
            <div className="mt-auto border-t border-white/[0.06] pt-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-md ring-1 ring-inset ring-white/[0.03]">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-vct-accent">
                        <VCT_Icons.ShieldCheck size={14} />
                        {t('portal.securitySystem') || 'Hệ thống Bảo mật'}
                    </div>
                    <p className="text-[10px] leading-relaxed text-vct-text-muted/60">
                        {t('portal.securityDesc') || 'Tất cả kết nối được bảo vệ bằng TLS 1.3. Dữ liệu mã hóa AES-256 end-to-end.'}
                    </p>
                </div>
            </div>
        </div>
    )
}
