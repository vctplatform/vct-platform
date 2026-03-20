'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { VCT_NotificationBell } from '../components/VCT_NotificationBell'
import { VCT_Timeline, type TimelineEvent } from '../components/VCT_Timeline'
import { useI18n } from '../i18n'

/* ────────────────────────────────────────────
 *  NotificationCenter
 *  Right-side drawer with tabs + notification list.
 *  Mock data for now; real API integration later (Phase 2).
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
    icon?: ReactNode
    color?: string
}

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'match', title: 'Trận đấu sắp bắt đầu', description: 'Sàn 1 — Đối kháng Nam 57kg, Hiệp bán kết', time: '2 phút trước', read: false, color: 'var(--vct-danger)' },
    { id: '2', type: 'registration', title: 'Đoàn Bình Định gửi hồ sơ', description: '15 VĐV, 8 nội dung — Chờ duyệt', time: '15 phút trước', read: false, color: 'var(--vct-info)' },
    { id: '3', type: 'match', title: 'Kết quả trận #12', description: 'Nguyễn Văn A thắng điểm 7-5 (Đối kháng Nam 60kg)', time: '30 phút trước', read: true, color: 'var(--vct-success)' },
    { id: '4', type: 'system', title: 'Cân ký sáng đã hoàn tất', description: '42/45 VĐV đạt cân nặng', time: '1 giờ trước', read: true, color: 'var(--vct-warning)' },
    { id: '5', type: 'registration', title: 'Khiếu nại mới', description: 'Đoàn TP.HCM khiếu nại trận #8', time: '2 giờ trước', read: true, color: 'var(--vct-danger)' },
    { id: '6', type: 'system', title: 'Lịch thi đấu cập nhật', description: 'Buổi chiều: 12 trận Đối kháng, 6 lượt Quyền', time: '3 giờ trước', read: true, color: 'var(--vct-accent-cyan)' },
]

export interface NotificationCenterProps {
    /** Controlled open state (optional, for external control) */
    isOpen?: boolean
    onClose?: () => void
}

export function NotificationCenter({ isOpen: externalOpen, onClose }: NotificationCenterProps) {
    const { t } = useI18n()
    const [internalOpen, setInternalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<NotifTab>('all')
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const isOpen = externalOpen ?? internalOpen
    const handleClose = onClose ?? (() => setInternalOpen(false))
    const handleOpen = () => setInternalOpen(true)

    const unreadCount = notifications.filter((n) => !n.read).length

    const filtered = activeTab === 'all'
        ? notifications
        : notifications.filter((n) => n.type === activeTab)

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const timelineEvents: TimelineEvent[] = filtered.map((n) => ({
        time: n.time,
        title: n.title,
        description: n.description,
        icon: n.icon,
        color: n.color,
    }))

    return (
        <>
            {/* Bell trigger (only if no external control) */}
            {externalOpen === undefined && (
                <VCT_NotificationBell count={unreadCount} onClick={handleOpen} />
            )}

            {/* Backdrop & Drawer - Portaled out of stacking context */}
            {mounted && createPortal(
                <>
                    {/* Backdrop */}
                    {isOpen && (
                        <div
                            onClick={handleClose}
                            className="fixed inset-0 z-[300] bg-slate-900/40 animate-[vct-fade-in_0.2s_ease_both]"
                            aria-hidden
                        />
                    )}

                    {/* Drawer panel */}
                    <aside
                        role="dialog"
                        aria-label={t('notifications.title')}
                        aria-modal="true"
                        className={`fixed right-0 top-0 bottom-0 z-[300] flex w-[min(420px,90vw)] flex-col border-l border-(--vct-border-subtle) bg-(--vct-bg-elevated) shadow-(--vct-shadow-xl) transition-transform duration-300 ease-(--vct-ease-out) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-(--vct-border-subtle) px-5 py-4">
                            <div>
                                <h3 className="m-0 text-base font-bold text-(--vct-text-primary)">
                                    {t('notifications.title')}
                                </h3>
                                {unreadCount > 0 && (
                                    <p className="mt-0.5 text-xs text-(--vct-text-tertiary)">
                                        {unreadCount} {t('notifications.unread')}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="rounded-md border-none bg-transparent px-2 py-1 text-xs font-semibold text-(--vct-accent-cyan) transition hover:bg-(--vct-bg-hover)"
                                    >
                                        {t('notifications.markAllRead')}
                                    </button>
                                )}
                                <button
                                    onClick={handleClose}
                                    aria-label={t('notifications.close')}
                                    className="inline-flex rounded-md border-none bg-transparent p-1 text-xl text-(--vct-text-tertiary) transition hover:bg-(--vct-bg-hover) hover:text-(--vct-text-primary)"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-0.5 border-b border-(--vct-border-subtle) px-5 pt-2">
                            {TAB_KEYS.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`-mb-px border-none bg-transparent px-3 py-2 text-xs font-medium transition ${activeTab === key
                                        ? 'border-b-2 border-(--vct-accent-cyan) font-bold text-(--vct-accent-cyan)'
                                        : 'border-b-2 border-transparent text-(--vct-text-tertiary) hover:text-(--vct-text-primary)'
                                        }`}
                                >
                                    {t(`notifications.tab.${key}`)}
                                    {key === 'all' && unreadCount > 0 && (
                                        <span className="ml-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-(--vct-danger) px-1 text-[9px] font-bold leading-none text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="vct-hide-scrollbar flex-1 overflow-y-auto p-5">
                            {filtered.length === 0 ? (
                                <div className="py-10 text-center text-(--vct-text-tertiary)">
                                    <div className="mb-2 text-3xl">🔔</div>
                                    <div className="text-sm">{t('notifications.empty')}</div>
                                </div>
                            ) : (
                                <VCT_Timeline events={timelineEvents} />
                            )}
                        </div>
                    </aside>
                </>,
                document.body
            )}
        </>
    )
}
