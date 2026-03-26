/**
 * VCT Notification Center
 * 
 * In-app notification center for all user roles.
 * Listens to WebSocket channel `notifications:{userId}` for real-time updates.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Card, VCT_Button, VCT_Badge } from '..'

/* ── Types ──────────────────────────────────────────────────── */

interface Notification {
    id: string
    type: 'info' | 'warning' | 'success' | 'danger'
    title: string
    body: string
    time: string
    read: boolean
    link?: string
}

/* ── Demo Data ──────────────────────────────────────────────── */

const DEMO_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'danger', title: 'Dừng trận khẩn cấp', body: 'Y tế yêu cầu dừng trận tại Sân A1 — VĐV Trần Văn D chấn thương', time: '5 phút trước', read: false },
    { id: '2', type: 'warning', title: 'Cân ký sắp đến', body: 'Lịch cân ký hạng 56-60kg bắt đầu lúc 14:00 hôm nay', time: '30 phút trước', read: false },
    { id: '3', type: 'success', title: 'Kết quả trận đấu', body: 'Nguyễn Văn A thắng Lê Văn C (12-8) ở vòng loại Đối kháng Nam 56-60kg', time: '1 giờ trước', read: true },
    { id: '4', type: 'info', title: 'Lịch thi đấu cập nhật', body: 'Trận Bán kết Quyền Nam đã được chuyển sang Sân B1 lúc 15:00', time: '2 giờ trước', read: true },
    { id: '5', type: 'info', title: 'Đoàn mới đăng ký', body: 'Đoàn Bình Dương đã gửi hồ sơ đăng ký (12 VĐV)', time: '3 giờ trước', read: true },
]

/* ── Notification Center Component ──────────────────────────── */

interface NotificationCenterProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const iconMap: Record<string, string> = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        danger: '🚨',
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-40"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed top-0 right-0 z-50 h-full overflow-y-auto"
                        style={{
                            width: '380px',
                            maxWidth: '90vw',
                            background: 'var(--vct-bg-base)',
                            borderLeft: '1px solid var(--vct-border-subtle)',
                            boxShadow: '-8px 0 24px rgba(0,0,0,0.2)',
                        }}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
                            style={{ background: 'var(--vct-bg-elevated)', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                            <div className="flex items-center gap-2">
                                <VCT_Text variant="h3" style={{ margin: 0 }}>🔔 Thông báo</VCT_Text>
                                {unreadCount > 0 && (
                                    <VCT_Badge type="danger" text={String(unreadCount)} />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <VCT_Button variant="ghost" size="sm" onClick={markAllRead}>
                                        Đọc tất cả
                                    </VCT_Button>
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--vct-text-tertiary)', fontSize: '1.25rem',
                                        cursor: 'pointer', padding: '4px',
                                    }}
                                >✕</button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="p-3 grid gap-2">
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div
                                        className="rounded-xl p-3 cursor-pointer transition-all"
                                        style={{
                                            background: n.read ? 'transparent' : 'rgba(0,188,212,0.05)',
                                            border: `1px solid ${n.read ? 'var(--vct-border-subtle)' : 'rgba(0,188,212,0.2)'}`,
                                        }}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">{iconMap[n.type]}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <VCT_Text variant="body" style={{ fontWeight: n.read ? 400 : 700, margin: 0 }}>
                                                        {n.title}
                                                    </VCT_Text>
                                                    {!n.read && (
                                                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--vct-accent-cyan)', flexShrink: 0 }} />
                                                    )}
                                                </div>
                                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)', margin: '2px 0' }}>
                                                    {n.body}
                                                </VCT_Text>
                                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                                    {n.time}
                                                </VCT_Text>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

/* ── Notification Bell ──────────────────────────────────────── */

interface NotificationBellProps {
    count: number
    onClick: () => void
}

export function VCT_NotificationBell({ count, onClick }: NotificationBellProps) {
    return (
        <button
            onClick={onClick}
            className="relative"
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '8px',
                color: 'var(--vct-text-secondary)',
            }}
            aria-label={`${count} thông báo chưa đọc`}
        >
            🔔
            {count > 0 && (
                <motion.span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                    style={{
                        background: '#ef4444',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 4px',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                    {count > 99 ? '99+' : count}
                </motion.span>
            )}
        </button>
    )
}
