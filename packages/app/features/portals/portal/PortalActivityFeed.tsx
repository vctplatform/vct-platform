'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../../components/vct-icons'
import { useI18n } from '../../i18n'

interface ActivityItem {
    id: string
    user: string
    action: string
    workspace: string
    time: string
    type: 'payment' | 'member' | 'event' | 'system'
}

const MOCK_ACTIVITIES: ActivityItem[] = [
    { id: '1', user: 'Nguyễn Văn A', action: 'vừa đóng lệ phí niên liễm', workspace: 'CLB Võ Cổ Truyền Quận 1', time: '2 phút trước', type: 'payment' },
    { id: '2', user: 'Trần Thị B', action: 'đã đăng ký tham gia Giải Võ Cổ Truyền', workspace: 'Liên đoàn Võ Cổ Truyền TP.HCM', time: '15 phút trước', type: 'event' },
    { id: '3', user: 'Lê Văn C', action: 'đã cập nhật hồ sơ võ sinh', workspace: 'CLB Bình Định Gia', time: '1 giờ trước', type: 'member' },
    { id: '4', user: 'System', action: 'đã tự động sao lưu dữ liệu hệ thống', workspace: 'Hệ thống Quản trị', time: '3 giờ trước', type: 'system' },
    { id: '5', user: 'Hoàng Văn D', action: 'vừa phê duyệt yêu cầu cấp đai', workspace: 'Liên đoàn Võ Cổ Truyền Việt Nam', time: '5 giờ trước', type: 'member' },
]

export function PortalActivityFeed() {
    const { t } = useI18n()

    return (
        <div className="flex h-full flex-col gap-6 rounded-2xl border border-vct-border/40 bg-white/50 p-6 backdrop-blur-md dark:bg-white/5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-vct-text flex items-center gap-2">
                    <VCT_Icons.Activity size={18} className="text-vct-primary" />
                    {t('portal.activityFeed')}
                </h3>
                <button className="text-[10px] font-bold text-vct-primary hover:underline">
                    {t('portal.viewAll')}
                </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {MOCK_ACTIVITIES.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex gap-3 border-l-2 border-vct-border/30 pl-4 py-1 hover:border-vct-primary transition-colors group"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="text-[11px] leading-tight text-vct-text">
                                <span className="font-bold">{activity.user}</span> {activity.action}
                            </div>
                            <div className="text-[10px] text-vct-text-muted flex items-center gap-1">
                                <span className="truncate max-w-[120px]">{activity.workspace}</span>
                                <span>•</span>
                                <span className="whitespace-nowrap">{activity.time}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-vct-border/20">
                <div className="rounded-xl bg-vct-primary/10 p-4 border border-vct-primary/20">
                    <div className="text-[11px] font-bold text-vct-primary mb-1 flex items-center gap-1">
                        <VCT_Icons.ShieldCheck size={14} />
                        {t('portal.securitySystem')}
                    </div>
                    <p className="text-[10px] text-vct-text-muted leading-relaxed">
                        {t('portal.securityDesc')}
                    </p>
                </div>
            </div>
        </div>
    )
}
