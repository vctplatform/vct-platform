'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'
import { VCT_PageContainer } from '@vct/ui'
import { useAuth } from '../auth/AuthProvider'

// ════════════════════════════════════════
// TYPES & DATA
// ════════════════════════════════════════
interface NotifSetting {
    id: string; label: string; desc: string; email: boolean; push: boolean; icon: string; color: string
}

const NOTIF_SETTINGS: NotifSetting[] = [
    { id: 'n1', label: 'Giải đấu', desc: 'Đăng ký, lịch thi đấu, kết quả', email: true, push: true, icon: 'Trophy', color: 'var(--vct-warning)' },
    { id: 'n2', label: 'Tài chính', desc: 'Phiếu thu, phiếu chi, hạn thanh toán', email: true, push: false, icon: 'DollarSign', color: 'var(--vct-success)' },
    { id: 'n3', label: 'Đào tạo', desc: 'Lịch tập, thi thăng cấp, điểm danh', email: false, push: true, icon: 'Award', color: 'var(--vct-info)' },
    { id: 'n4', label: 'Cộng đồng', desc: 'Bài viết mới, bình luận, nhóm', email: false, push: false, icon: 'Users', color: 'var(--vct-accent-pink)' },
    { id: 'n5', label: 'Hệ thống', desc: 'Cập nhật, bảo trì, thay đổi quyền', email: true, push: true, icon: 'Settings', color: 'var(--vct-text-tertiary)' },
]

const SESSIONS = [
    { id: 's1', device: 'Chrome — Windows 11', ip: '113.190.xxx.xx', time: 'Hiện tại', current: true, icon: 'Monitor' },
    { id: 's2', device: 'Safari — iPhone 15', ip: '115.78.xxx.xx', time: '2 giờ trước', current: false, icon: 'Smartphone' },
    { id: 's3', device: 'Firefox — MacOS', ip: '42.113.xxx.xx', time: '3 ngày trước', current: false, icon: 'Monitor' },
]

type Tab = 'account' | 'appearance' | 'notifications' | 'security'

const TAB_CONFIG: { key: Tab; label: string; icon: string; shortcut: string; desc: string }[] = [
    { key: 'account', label: 'Tài khoản', icon: 'User', shortcut: '⌘1', desc: 'Thông tin cá nhân, mật khẩu' },
    { key: 'appearance', label: 'Giao diện', icon: 'Palette', shortcut: '⌘2', desc: 'Theme, ngôn ngữ, font' },
    { key: 'notifications', label: 'Thông báo', icon: 'Bell', shortcut: '⌘3', desc: 'Email, push, kênh thông báo' },
    { key: 'security', label: 'Bảo mật', icon: 'Shield', shortcut: '⌘4', desc: '2FA, phiên, vùng nguy hiểm' },
]

// ════════════════════════════════════════
// ANIMATED TOGGLE
// ════════════════════════════════════════
const AnimToggle = ({ checked, onChange, color }: { checked: boolean; onChange: () => void; color?: string }) => (
    <button
        onClick={onChange}
        className="relative h-[26px] w-[48px] rounded-full transition-colors duration-300 shrink-0"
        style={{ background: checked ? (color || 'var(--vct-accent)') : 'var(--vct-border)' }}
    >
        <motion.div
            className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md"
            animate={{ left: checked ? 24 : 3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
    </button>
)

// ════════════════════════════════════════
// INLINE FIELD
// ════════════════════════════════════════
const InlineField = ({ label, value, icon, disabled }: { label: string; value: string; icon: string; disabled?: boolean }) => {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const Icon = iconMap[icon] ?? VCT_Icons.Edit

    return (
        <div className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-(--vct-bg-base) border border-(--vct-border-subtle) transition hover:border-vct-accent/30">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-vct-accent/8">
                    <Icon size={15} className="text-vct-accent" />
                </div>
                <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-(--vct-text-secondary) font-bold uppercase tracking-wider block">{label}</label>
                    {editing && !disabled ? (
                        <input
                            ref={inputRef}
                            value={val}
                            onChange={e => setVal(e.target.value)}
                            onBlur={() => setEditing(false)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
                            className="w-full text-sm font-bold text-(--vct-text-primary) bg-transparent border-none outline-none mt-0.5"
                            autoFocus
                        />
                    ) : (
                        <div className="text-sm font-bold text-(--vct-text-primary) truncate mt-0.5">{val}</div>
                    )}
                </div>
            </div>
            {!disabled && (
                <button
                    onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-vct-accent/10"
                >
                    <VCT_Icons.Edit size={12} className="text-vct-accent" />
                </button>
            )}
            {disabled && (
                <VCT_Icons.Lock size={12} className="text-(--vct-text-secondary) opacity-40 shrink-0" />
            )}
        </div>
    )
}

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_settings() {
    const [tab, setTab] = useState<Tab>('account')
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
    const [lang, setLang] = useState('vi')
    const [notifs, setNotifs] = useState(NOTIF_SETTINGS)
    const [twoFA, setTwoFA] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { currentUser } = useAuth()

    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const toggleN = (id: string, f: 'email' | 'push') => {
        setNotifs(p => p.map(n => n.id === id ? { ...n, [f]: !n[f] } : n))
    }

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-(--vct-text-primary)">Cài Đặt</h1>
                <p className="mt-1 text-sm text-(--vct-text-secondary)">Quản lý tài khoản, giao diện, thông báo và bảo mật</p>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid md:grid-cols-[260px_1fr] gap-6">
                {/* ── Sidebar Tabs ── */}
                <div className="space-y-1.5">
                    {TAB_CONFIG.map(t => {
                        const Icon = iconMap[t.icon] ?? VCT_Icons.Settings
                        const isActive = tab === t.key
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`relative w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${isActive ? 'bg-vct-accent/10 border-vct-accent/30' : 'hover:bg-(--vct-bg-elevated) border-transparent'} border`}
                            >
                                {isActive && (
                                    <motion.div layoutId="settingsTab" className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-vct-accent" />
                                )}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-vct-accent text-white' : 'bg-(--vct-bg-base) text-(--vct-text-secondary)'}`}>
                                    <Icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${isActive ? 'text-vct-accent' : 'text-(--vct-text-primary)'}`}>{t.label}</span>
                                        <span className="text-[9px] font-mono text-(--vct-text-secondary) bg-(--vct-bg-base) px-1.5 py-0.5 rounded hidden lg:inline">{t.shortcut}</span>
                                    </div>
                                    <span className="text-[11px] text-(--vct-text-secondary) mt-0.5 block">{t.desc}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    {tab === 'account' && (
                        <motion.div key="acc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            {/* Avatar + Info */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.User size={16} className="text-vct-accent" /> Thông tin cá nhân
                                </h3>

                                {/* Upload Zone */}
                                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-(--vct-border-subtle)">
                                    <div className="relative group">
                                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-vct-accent to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shrink-0">
                                            {(currentUser?.name || 'AT').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()}
                                        </div>
                                        <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                            <VCT_Icons.Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{currentUser?.name || 'Admin Tùng'}</div>
                                        <div className="text-xs text-(--vct-text-secondary) mb-2">{currentUser?.email || 'admin@vct-platform.vn'}</div>
                                        <button className="text-xs font-bold text-vct-accent hover:underline flex items-center gap-1">
                                            <VCT_Icons.Upload size={11} /> Tải ảnh lên
                                        </button>
                                    </div>
                                </div>

                                {/* Inline fields */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <InlineField label="Họ và tên" value={currentUser?.name || 'Admin Tùng'} icon="User" />
                                    <InlineField label="Email" value={currentUser?.email || 'admin@vct-platform.vn'} icon="Mail" />
                                    <InlineField label="Số điện thoại" value="0912 345 678" icon="Phone" />
                                    <InlineField label="Vai trò" value="Super Admin" icon="Shield" disabled />
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button className="flex items-center gap-2 rounded-xl bg-vct-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition shadow-lg shadow-vct-accent/20">
                                        <VCT_Icons.Check size={14} /> Lưu thay đổi
                                    </button>
                                </div>
                            </div>

                            {/* Change Password */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Lock size={16} className="text-amber-500" /> Đổi mật khẩu
                                </h3>
                                <div className="grid gap-3 max-w-md">
                                    {['Mật khẩu hiện tại', 'Mật khẩu mới', 'Xác nhận mật khẩu mới'].map(l => (
                                        <div key={l}>
                                            <label className="text-[10px] font-bold text-(--vct-text-secondary) uppercase tracking-wider block mb-1.5">{l}</label>
                                            <input type="password" placeholder="••••••••"
                                                className="w-full rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-base) px-4 py-3 text-sm outline-none focus:border-vct-accent focus:ring-2 focus:ring-vct-accent/10 transition" />
                                        </div>
                                    ))}
                                    <button className="w-fit flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition shadow-lg shadow-amber-500/20 mt-1">
                                        <VCT_Icons.Lock size={14} /> Cập nhật mật khẩu
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'appearance' && (
                        <motion.div key="app" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            {/* Theme */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Moon size={16} className="text-vct-accent" /> Chế độ giao diện
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        { k: 'dark' as const, l: 'Tối', i: '🌙', desc: 'Dễ nhìn ban đêm' },
                                        { k: 'light' as const, l: 'Sáng', i: '☀️', desc: 'Tươi sáng, rõ ràng' },
                                        { k: 'system' as const, l: 'Hệ thống', i: '💻', desc: 'Theo cài đặt OS' },
                                    ]).map(t => (
                                        <button key={t.k} onClick={() => setTheme(t.k)}
                                            className={`group relative rounded-2xl border p-5 text-center transition-all ${theme === t.k
                                                ? 'border-vct-accent bg-vct-accent/8 shadow-lg shadow-vct-accent/10'
                                                : 'border-(--vct-border-subtle) hover:border-vct-accent/40 bg-(--vct-bg-base)'
                                                }`}>
                                            {theme === t.k && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-vct-accent flex items-center justify-center">
                                                    <VCT_Icons.Check size={10} className="text-white" />
                                                </div>
                                            )}
                                            <div className="text-3xl mb-2">{t.i}</div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{t.l}</div>
                                            <div className="text-[10px] text-(--vct-text-secondary) mt-1">{t.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Globe size={16} className="text-vct-accent" /> Ngôn ngữ
                                </h3>
                                <div className="grid grid-cols-2 gap-3 max-w-md">
                                    {[{ k: 'vi', l: '🇻🇳 Tiếng Việt', desc: 'Vietnamese' }, { k: 'en', l: '🇬🇧 English', desc: 'English' }].map(l => (
                                        <button key={l.k} onClick={() => setLang(l.k)}
                                            className={`relative rounded-2xl border p-4 text-left transition-all ${lang === l.k
                                                ? 'border-vct-accent bg-vct-accent/8 shadow-lg shadow-vct-accent/10'
                                                : 'border-(--vct-border-subtle) hover:border-vct-accent/40 bg-(--vct-bg-base)'
                                                }`}>
                                            {lang === l.k && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-vct-accent flex items-center justify-center">
                                                    <VCT_Icons.Check size={10} className="text-white" />
                                                </div>
                                            )}
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{l.l}</div>
                                            <div className="text-[10px] text-(--vct-text-secondary) mt-1">{l.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font size preview */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Type size={16} className="text-vct-accent" /> Cỡ chữ
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-(--vct-text-secondary)">Aa</span>
                                    <input type="range" min={12} max={18} defaultValue={14}
                                        className="flex-1 h-1.5 rounded-full appearance-none bg-(--vct-bg-base) cursor-pointer accent-(--vct-accent)" />
                                    <span className="text-lg font-bold text-(--vct-text-secondary)">Aa</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'notifications' && (
                        <motion.div key="noti" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Bell size={16} className="text-vct-accent" /> Cài đặt thông báo
                                </h3>

                                {/* Header row */}
                                <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-4 py-2 mb-2">
                                    <span className="text-[10px] font-bold text-(--vct-text-secondary) uppercase tracking-wider">Loại</span>
                                    <span className="text-[10px] font-bold text-(--vct-text-secondary) uppercase tracking-wider text-center">Email</span>
                                    <span className="text-[10px] font-bold text-(--vct-text-secondary) uppercase tracking-wider text-center">Push</span>
                                </div>

                                <div className="space-y-2">
                                    {notifs.map((n, i) => {
                                        const Icon = iconMap[n.icon] ?? VCT_Icons.Bell
                                        return (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="grid grid-cols-[1fr_80px_80px] items-center gap-4 rounded-xl p-4 border border-(--vct-border-subtle) bg-(--vct-bg-base) hover:border-vct-accent/30 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${n.color}12` }}>
                                                        <Icon size={15} style={{ color: n.color }} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-(--vct-text-primary)">{n.label}</div>
                                                        <div className="text-[11px] text-(--vct-text-secondary)">{n.desc}</div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center">
                                                    <AnimToggle checked={n.email} onChange={() => toggleN(n.id, 'email')} />
                                                </div>
                                                <div className="flex justify-center">
                                                    <AnimToggle checked={n.push} onChange={() => toggleN(n.id, 'push')} />
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'security' && (
                        <motion.div key="sec" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                            {/* 2FA */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-(--vct-text-primary)">
                                    <VCT_Icons.Shield size={16} className="text-emerald-500" /> Xác thực hai bước (2FA)
                                </h3>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-(--vct-bg-base) border border-(--vct-border-subtle)">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/12 flex items-center justify-center">
                                            <VCT_Icons.Lock size={16} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">Xác thực bằng ứng dụng</div>
                                            <div className="text-[11px] text-(--vct-text-secondary) mt-0.5">Google Authenticator hoặc tương tự</div>
                                        </div>
                                    </div>
                                    <AnimToggle checked={twoFA} onChange={() => setTwoFA(!twoFA)} color="var(--vct-success)" />
                                </div>
                                {twoFA && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-sm text-emerald-500 font-bold flex items-center gap-2"
                                    >
                                        <VCT_Icons.CheckCircle size={16} /> 2FA đã được kích hoạt — Tài khoản của bạn được bảo vệ
                                    </motion.div>
                                )}
                            </div>

                            {/* Sessions */}
                            <div className="rounded-2xl border border-vct-border bg-(--vct-bg-elevated) p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-bold text-sm flex items-center gap-2 text-(--vct-text-primary)">
                                        <VCT_Icons.Monitor size={16} className="text-vct-accent" /> Phiên đăng nhập
                                    </h3>
                                    <button className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                                        <VCT_Icons.LogOut size={11} /> Đăng xuất tất cả
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {SESSIONS.map((s, i) => {
                                        const SIcon = iconMap[s.icon] ?? VCT_Icons.Monitor
                                        return (
                                            <motion.div
                                                key={s.id}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between p-4 rounded-xl bg-(--vct-bg-base) border border-(--vct-border-subtle) hover:border-vct-accent/30 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.current ? 'bg-emerald-500/12' : 'bg-(--vct-bg-elevated)'}`}>
                                                        <SIcon size={16} className={s.current ? 'text-emerald-500' : 'text-(--vct-text-secondary)'} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-(--vct-text-primary) flex items-center gap-2">
                                                            {s.device}
                                                            {s.current && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                                                        </div>
                                                        <div className="text-[10px] text-(--vct-text-secondary) mt-0.5">IP: {s.ip} · {s.time}</div>
                                                    </div>
                                                </div>
                                                {s.current
                                                    ? <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/12 text-emerald-500 border border-emerald-500/20">Hiện tại</span>
                                                    : <button className="text-xs font-bold text-red-500 hover:underline">Thu hồi</button>
                                                }
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/3 p-6">
                                <h3 className="font-bold text-sm mb-2 text-red-500 flex items-center gap-2">
                                    <VCT_Icons.AlertTriangle size={16} /> Vùng nguy hiểm
                                </h3>
                                <p className="text-xs text-(--vct-text-secondary) mb-4">Thao tác không thể hoàn tác. Hãy suy nghĩ kỹ trước khi thực hiện.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition"
                                    >
                                        <VCT_Icons.Trash size={14} /> Xóa tài khoản
                                    </button>
                                    <button className="flex items-center gap-2 rounded-xl border border-amber-500/30 px-4 py-2.5 text-sm font-bold text-amber-500 hover:bg-amber-500/10 transition">
                                        <VCT_Icons.EyeOff size={14} /> Vô hiệu hóa
                                    </button>
                                </div>
                            </div>

                            {/* Delete Confirmation Modal */}
                            <AnimatePresence>
                                {showDeleteConfirm && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                            onClick={e => e.stopPropagation()}
                                            className="w-full max-w-md rounded-2xl border border-red-500/20 bg-(--vct-bg-elevated) p-6 shadow-2xl mx-4"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-500/12 flex items-center justify-center">
                                                    <VCT_Icons.AlertTriangle size={24} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-(--vct-text-primary)">Xác nhận xóa tài khoản</h3>
                                                    <p className="text-xs text-(--vct-text-secondary)">Hành động này không thể hoàn tác</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-(--vct-text-secondary) mb-6">
                                                Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn: hồ sơ cá nhân, lịch sử hoạt động, thành tích, và quyền truy cập.
                                            </p>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-(--vct-text-secondary) hover:bg-(--vct-bg-base) transition">Hủy bỏ</button>
                                                <button className="px-5 py-2.5 rounded-xl bg-red-500 text-sm font-bold text-white hover:brightness-110 transition shadow-lg shadow-red-500/20">
                                                    Xóa vĩnh viễn
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </VCT_PageContainer>
    )
}
