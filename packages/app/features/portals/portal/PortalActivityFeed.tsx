'use client'
import React, { useEffect, useState } from 'react'
import { VCT_Icons } from '@vct/ui'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthProvider'

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'alert' | 'update' | 'match';
}

export function PortalActivityFeed() {
    const { t } = useI18n()
    const { getAccessToken } = useAuth()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function fetchActivity() {
            try {
                const token = getAccessToken()
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
                const res = await fetch(`${apiUrl}/api/v1/portal/activities`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (mounted) setActivities(data.items || [])
                }
            } catch (err) {
                console.error('Failed to fetch portal activities', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchActivity()
        return () => { mounted = false }
    }, [getAccessToken])

    return (
        <div className="flex h-full flex-col gap-6 rounded-2xl border border-vct-border/40 bg-white/50 p-6 backdrop-blur-md dark:bg-white/5">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-vct-text">
                    <VCT_Icons.Activity size={18} className="text-vct-primary" />
                    {t('portal.activityFeed')}
                </h3>
            </div>

            {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-vct-primary border-t-transparent" />
                </div>
            ) : activities.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center opacity-70">
                    <div className="rounded-full bg-vct-primary/10 p-3 text-vct-primary dark:bg-vct-primary/20">
                        <VCT_Icons.Activity size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-vct-text">
                            {t('portal.noActivity') || 'Chưa có hoạt động nào'}
                        </p>
                        <p className="mt-1 max-w-[200px] text-[10px] text-vct-text-muted">
                            {t('portal.noActivityDesc') || 'Các hoạt động sự kiện hoặc thông báo mới nhất sẽ xuất hiện tại đây.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin">
                    {activities.map(act => (
                        <div key={act.id} className="group relative flex cursor-pointer gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10">
                            <div className="mt-0.5 shrink-0 rounded-full bg-vct-primary/10 p-1.5 text-vct-primary transition-colors duration-300 group-hover:bg-vct-primary group-hover:text-white dark:bg-vct-primary/20 dark:group-hover:text-white">
                                {act.type === 'alert' ? <VCT_Icons.AlertCircle size={14} /> :
                                 act.type === 'match' ? <VCT_Icons.Swords size={14} /> :
                                 <VCT_Icons.Bell size={14} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-vct-text transition-colors duration-300 group-hover:text-vct-primary">{act.title}</p>
                                <p className="mt-0.5 text-[11px] text-vct-text-muted line-clamp-2">{act.description}</p>
                                <p className="mt-1 text-[9px] text-vct-text-muted/60">{new Date(act.timestamp).toLocaleString('vi-VN')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-auto border-t border-vct-border/20 pt-4">
                <div className="rounded-xl border border-white/40 bg-white/50 backdrop-blur-md p-4 transition-all duration-300 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 shadow-xs ring-1 ring-inset ring-white/20">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-vct-primary">
                        <VCT_Icons.ShieldCheck size={14} />
                        {t('portal.securitySystem')}
                    </div>
                    <p className="leading-relaxed text-[10px] text-vct-text-muted">
                        {t('portal.securityDesc')}
                    </p>
                </div>
            </div>
        </div>
    )
}
