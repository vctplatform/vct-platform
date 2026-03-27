'use client'

import { useState, useMemo } from 'react'
import { 
    NotificationCenter as UINotificationCenter, 
    VCT_Timeline, 
    type TimelineEvent 
} from '@vct/ui'
import { useI18n } from '../i18n'

/* ────────────────────────────────────────────
 *  NotificationCenter (Smart Wrapper)
 *  Connects @vct/ui/NotificationCenter to app state and i18n.
 * ──────────────────────────────────────────── */

type NotifTab = 'all' | 'match' | 'registration' | 'system'
const TAB_KEYS: NotifTab[] = ['all', 'match', 'registration', 'system']

interface Notification {
    id: string
    type: NotifTab
    title: string
    description?: string
    time: string
    read: boolean
    color?: string
}

// Mock notifications (Phase 2 will replace with API/WS)
const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'match', title: 'Trận đấu sắp bắt đầu', description: 'Sàn 1 — Đối kháng Nam 57kg, Hiệp bán kết', time: '2 phút trước', read: false, color: 'var(--vct-danger)' },
    { id: '2', type: 'registration', title: 'Đoàn Bình Định gửi hồ sơ', description: '15 VĐV, 8 nội dung — Chờ duyệt', time: '15 phút trước', read: false, color: 'var(--vct-info)' },
    { id: '3', type: 'match', title: 'Kết quả trận #12', description: 'Nguyễn Văn A thắng điểm 7-5 (Đối kháng Nam 60kg)', time: '30 phút trước', read: true, color: 'var(--vct-success)' },
    { id: '4', type: 'system', title: 'Cân ký sáng đã hoàn tất', description: '42/45 VĐV đạt cân nặng', time: '1 giờ trước', read: true, color: 'var(--vct-warning)' },
    { id: '5', type: 'registration', title: 'Khiếu nại mới', description: 'Đoàn TP.HCM khiếu nại trận #8', time: '2 giờ trước', read: true, color: 'var(--vct-danger)' },
    { id: '6', type: 'system', title: 'Lịch thi đấu cập nhật', description: 'Buổi chiều: 12 trận Đối kháng, 6 lượt Quyền', time: '3 giờ trước', read: true, color: 'var(--vct-accent-cyan)' },
]

export interface NotificationCenterProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { t } = useI18n()
    const [activeTab, setActiveTab] = useState<NotifTab>('all')
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

    const unreadCount = notifications.filter((n) => !n.read).length

    const filtered = useMemo(() => 
        activeTab === 'all' 
            ? notifications 
            : notifications.filter((n) => n.type === activeTab),
        [notifications, activeTab]
    )

    const tabs = useMemo(() => TAB_KEYS.map(key => ({
        id: key,
        label: t(`notifications.tab.${key}`),
        count: key === 'all' ? unreadCount : notifications.filter(n => n.type === key && !n.read).length
    })), [t, unreadCount, notifications])

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const timelineEvents: TimelineEvent[] = filtered.map((n) => ({
        time: n.time,
        title: n.title,
        description: n.description,
        color: n.color,
    }))

    return (
        <UINotificationCenter
            isOpen={isOpen}
            onClose={onClose}
            title={t('notifications.title')}
            unreadCount={unreadCount}
            markAllReadLabel={t('notifications.markAllRead')}
            onMarkAllRead={markAllRead}
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={(id) => setActiveTab(id as NotifTab)}
        >
            <div className="p-5">
                {filtered.length === 0 ? (
                    <div className="py-10 text-center text-(--vct-text-tertiary)">
                        <div className="mb-2 text-3xl">🔔</div>
                        <div className="text-sm">{t('notifications.empty')}</div>
                    </div>
                ) : (
                    <VCT_Timeline events={timelineEvents} />
                )}
            </div>
        </UINotificationCenter>
    )
}
