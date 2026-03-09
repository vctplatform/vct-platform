'use client'

import { useState, type ReactNode } from 'react'
import { VCT_NotificationBell } from '../components/VCT_NotificationBell'
import { VCT_Timeline, type TimelineEvent } from '../components/VCT_Timeline'

/* ────────────────────────────────────────────
 *  NotificationCenter
 *  Right-side drawer with tabs + notification list.
 *  Mock data for now; real API integration later (Phase 2).
 * ──────────────────────────────────────────── */

type NotifTab = 'all' | 'match' | 'registration' | 'system'

const TABS: { key: NotifTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'match', label: 'Thi đấu' },
    { key: 'registration', label: 'Đăng ký' },
    { key: 'system', label: 'Hệ thống' },
]

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
    const [internalOpen, setInternalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<NotifTab>('all')
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

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

            {/* Backdrop */}
            {isOpen && (
                <div
                    onClick={handleClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.35)',
                        zIndex: 'var(--vct-z-drawer, 300)' as any,
                        animation: 'vct-fade-in 0.2s ease both',
                    }}
                    aria-hidden
                />
            )}

            {/* Drawer panel */}
            <aside
                role="dialog"
                aria-label="Trung tâm thông báo"
                aria-modal="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 'min(420px, 90vw)',
                    zIndex: 'var(--vct-z-drawer, 300)' as any,
                    background: 'var(--vct-bg-elevated)',
                    borderLeft: '1px solid var(--vct-border-subtle)',
                    boxShadow: 'var(--vct-shadow-xl)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s var(--vct-ease-out)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--vct-border-subtle)',
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--vct-font-md)', fontWeight: 700, color: 'var(--vct-text-primary)' }}>
                            Thông báo
                        </h3>
                        {unreadCount > 0 && (
                            <p style={{ margin: '2px 0 0', fontSize: 'var(--vct-font-xs)', color: 'var(--vct-text-tertiary)' }}>
                                {unreadCount} chưa đọc
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--vct-accent-cyan)',
                                    fontSize: 'var(--vct-font-xs)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--vct-radius-sm)',
                                }}
                            >
                                Đọc tất cả
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            aria-label="Đóng thông báo"
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--vct-text-tertiary)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                padding: 4,
                                borderRadius: 'var(--vct-radius-sm)',
                                fontSize: 20,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'flex',
                        gap: 2,
                        padding: '8px 20px 0',
                        borderBottom: '1px solid var(--vct-border-subtle)',
                    }}
                >
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === t.key ? 'var(--vct-accent-cyan)' : 'var(--vct-text-tertiary)',
                                fontSize: 'var(--vct-font-xs)',
                                fontWeight: activeTab === t.key ? 700 : 500,
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderBottom: activeTab === t.key ? '2px solid var(--vct-accent-cyan)' : '2px solid transparent',
                                marginBottom: -1,
                                transition: 'color var(--vct-duration-fast) ease',
                            }}
                        >
                            {t.label}
                            {t.key === 'all' && unreadCount > 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: 6,
                                        minWidth: 16,
                                        height: 16,
                                        borderRadius: 'var(--vct-radius-full)',
                                        background: 'var(--vct-danger)',
                                        color: '#fff',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        padding: '0 3px',
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div
                    className="vct-hide-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px 20px',
                    }}
                >
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--vct-text-tertiary)' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                            <div style={{ fontSize: 'var(--vct-font-sm)' }}>Không có thông báo</div>
                        </div>
                    ) : (
                        <VCT_Timeline events={timelineEvents} />
                    )}
                </div>
            </aside>
        </>
    )
}
