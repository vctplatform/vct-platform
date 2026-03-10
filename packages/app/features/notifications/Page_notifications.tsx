'use client'
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

interface Notification {
    id: string; type: 'info' | 'warning' | 'success' | 'danger'; title: string; message: string
    time: string; read: boolean; category: string; actionUrl?: string
}

const NOTIFICATIONS: Notification[] = [
    { id: 'n1', type: 'danger', title: 'Khiếu nại mới cần xử lý', message: 'Đoàn Bình Định gửi khiếu nại trận #12. Thời hạn phản hồi: 30 phút.', time: '2 phút', read: false, category: 'tournament', actionUrl: '/appeals' },
    { id: 'n2', type: 'warning', title: '3 VĐV chưa cân ký', message: 'Nguyễn Hoàng A, Trần Minh B, Lê Thanh C chưa qua cân ký. Deadline: 11:00.', time: '15 phút', read: false, category: 'tournament', actionUrl: '/weigh-in' },
    { id: 'n3', type: 'success', title: 'Giải VĐQG 2026 đã kết thúc Phase 1', message: '42/42 đoàn hoàn tất đăng ký. 486 VĐV đã confirmed.', time: '1 giờ', read: false, category: 'tournament' },
    { id: 'n4', type: 'info', title: 'CLB Sơn Long gửi danh sách VĐV', message: '15 VĐV đăng ký 8 nội dung. Đang chờ duyệt.', time: '2 giờ', read: true, category: 'registration' },
    { id: 'n5', type: 'info', title: 'Cập nhật luật thi đấu 2026', message: 'Liên đoàn VCTVN ban hành QĐ sửa đổi luật đối kháng. Hiệu lực 01/04/2026.', time: '5 giờ', read: true, category: 'system' },
    { id: 'n6', type: 'success', title: 'Thanh toán học phí tháng 3', message: '24/30 võ sinh CLB A đã đóng phí. Tổng thu: 12.000.000đ.', time: '1 ngày', read: true, category: 'finance' },
    { id: 'n7', type: 'warning', title: 'Gia hạn thẻ HLV', message: 'Thẻ HLV của bạn hết hạn trong 15 ngày. Vui lòng gia hạn.', time: '2 ngày', read: true, category: 'system' },
    { id: 'n8', type: 'info', title: 'Bài viết cộng đồng mới', message: 'Võ sư Trần Minh đăng bài chia sẻ kinh nghiệm huấn luyện.', time: '3 ngày', read: true, category: 'community' },
]

const TYPE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
    info: { icon: 'ℹ️', color: '#3b82f6', bg: 'bg-blue-500/10' },
    warning: { icon: '⚠️', color: '#f59e0b', bg: 'bg-amber-500/10' },
    success: { icon: '✅', color: '#10b981', bg: 'bg-emerald-500/10' },
    danger: { icon: '🚨', color: '#ef4444', bg: 'bg-red-500/10' },
}

const CATEGORIES: Record<string, string> = { tournament: 'Giải đấu', registration: 'Đăng ký', finance: 'Tài chính', system: 'Hệ thống', community: 'Cộng đồng' }

export function Page_notifications() {
    const [filter, setFilter] = useState('all')
    const [notifications, setNotifications] = useState(NOTIFICATIONS)

    const unreadCount = notifications.filter(n => !n.read).length

    const filtered = useMemo(() => {
        if (filter === 'all') return notifications
        if (filter === 'unread') return notifications.filter(n => !n.read)
        return notifications.filter(n => n.category === filter)
    }, [filter, notifications])

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const toggleRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))

    return (
        <div className="grid gap-6 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="m-0 text-2xl font-black">Thông Báo</h1>
                        {unreadCount > 0 && <span className="h-6 min-w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5">{unreadCount}</span>}
                    </div>
                    <p className="mt-1 text-sm text-vct-text-muted">Cập nhật từ giải đấu, CLB, và hệ thống</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-bold text-vct-accent hover:underline">
                        <VCT_Icons.Check size={14} /> Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                {[{ v: 'all', l: `Tất cả (${notifications.length})` }, { v: 'unread', l: `Chưa đọc (${unreadCount})` },
                ...Object.entries(CATEGORIES).map(([k, v]) => ({ v: k, l: v }))
                ].map(f => (
                    <button key={f.v} onClick={() => setFilter(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                ))}
            </div>

            <div className="grid gap-2">
                <AnimatePresence>
                    {filtered.map(n => {
                        const style = TYPE_STYLES[n.type]!
                        return (
                            <motion.div key={n.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer hover:shadow-md ${n.read ? 'border-vct-border bg-vct-elevated/50 opacity-70' : `border-vct-border bg-vct-elevated ${style.bg}`}`}
                                onClick={() => toggleRead(n.id)}>
                                <div className="mt-0.5 text-lg shrink-0">{style.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`font-bold text-sm ${!n.read ? '' : 'text-vct-text-muted'}`}>{n.title}</span>
                                        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                                    </div>
                                    <p className="text-xs text-vct-text-muted leading-5 mb-1">{n.message}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-vct-text-muted">
                                        <span className="font-bold px-1.5 py-0.5 rounded-full bg-vct-input">{CATEGORIES[n.category]}</span>
                                        <span>{n.time} trước</span>
                                    </div>
                                </div>
                                {n.actionUrl && (
                                    <button onClick={e => { e.stopPropagation(); window.location.href = n.actionUrl! }}
                                        className="shrink-0 rounded-lg bg-vct-accent/10 px-2.5 py-1.5 text-xs font-bold text-vct-accent hover:bg-vct-accent/20 transition">
                                        Xử lý →
                                    </button>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
