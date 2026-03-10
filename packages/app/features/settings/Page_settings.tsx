'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & DATA
// ════════════════════════════════════════
interface NotifSetting {
    id: string; label: string; desc: string; email: boolean; push: boolean
}

const NOTIF_SETTINGS: NotifSetting[] = [
    { id: 'n1', label: 'Giải đấu', desc: 'Đăng ký, lịch thi đấu, kết quả', email: true, push: true },
    { id: 'n2', label: 'Tài chính', desc: 'Phiếu thu, phiếu chi, hạn thanh toán', email: true, push: false },
    { id: 'n3', label: 'Đào tạo', desc: 'Lịch tập, thi thăng cấp, điểm danh', email: false, push: true },
    { id: 'n4', label: 'Cộng đồng', desc: 'Bài viết mới, bình luận, nhóm', email: false, push: false },
    { id: 'n5', label: 'Hệ thống', desc: 'Cập nhật, bảo trì, thay đổi quyền', email: true, push: true },
]

const SESSIONS = [
    { id: 's1', device: 'Chrome — Windows 11', ip: '113.190.xxx.xx', time: 'Hiện tại', current: true },
    { id: 's2', device: 'Safari — iPhone 15', ip: '115.78.xxx.xx', time: '2 giờ trước', current: false },
    { id: 's3', device: 'Firefox — MacOS', ip: '42.113.xxx.xx', time: '3 ngày trước', current: false },
]

type Tab = 'account' | 'appearance' | 'notifications' | 'security'

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_settings() {
    const [tab, setTab] = useState<Tab>('account')
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
    const [lang, setLang] = useState('vi')
    const [notifs, setNotifs] = useState(NOTIF_SETTINGS)
    const [twoFA, setTwoFA] = useState(false)

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'account', label: 'Tài khoản', icon: <VCT_Icons.User size={16} /> },
        { key: 'appearance', label: 'Giao diện', icon: <VCT_Icons.Moon size={16} /> },
        { key: 'notifications', label: 'Thông báo', icon: <VCT_Icons.Activity size={16} /> },
        { key: 'security', label: 'Bảo mật', icon: <VCT_Icons.Lock size={16} /> },
    ]

    const toggleN = (id: string, f: 'email' | 'push') => {
        setNotifs(p => p.map(n => n.id === id ? { ...n, [f]: !n[f] } : n))
    }

    return (
        <div className="grid gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="m-0 text-2xl font-black">Cài Đặt</h1>
                <p className="mt-1 text-sm text-vct-text-muted">Quản lý tài khoản, giao diện, thông báo và bảo mật</p>
            </div>

            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition ${tab === t.key ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'account' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.User size={16} className="text-vct-accent" /> Thông tin cá nhân</h3>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-vct-border">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-vct-accent to-blue-600 flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-lg">AT</div>
                            <div>
                                <div className="font-bold">Admin Tùng</div>
                                <div className="text-xs text-vct-text-muted mb-2">admin@vct-platform.vn</div>
                                <button className="text-xs font-bold text-vct-accent hover:underline">Đổi ảnh đại diện</button>
                            </div>
                        </div>
                        <div className="grid tablet:grid-cols-2 gap-4">
                            {[{ l: 'Họ và tên', v: 'Admin Tùng' }, { l: 'Email', v: 'admin@vct-platform.vn' }, { l: 'Số điện thoại', v: '0912 345 678' }, { l: 'Vai trò', v: 'Super Admin', d: true }].map(f => (
                                <div key={f.l}><label className="text-xs font-bold text-vct-text-muted block mb-1.5">{f.l}</label>
                                    <input defaultValue={f.v} disabled={f.d} className={`w-full rounded-lg border border-vct-border bg-vct-input px-3 py-2.5 text-sm outline-none focus:border-vct-accent transition ${f.d ? 'opacity-60 cursor-not-allowed' : ''}`} /></div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end"><button className="rounded-lg bg-vct-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition">Lưu thay đổi</button></div>
                    </div>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.Lock size={16} className="text-amber-500" /> Đổi mật khẩu</h3>
                        <div className="grid gap-4 max-w-md">
                            {['Mật khẩu hiện tại', 'Mật khẩu mới', 'Xác nhận mật khẩu mới'].map(l => (
                                <div key={l}><label className="text-xs font-bold text-vct-text-muted block mb-1.5">{l}</label>
                                    <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-vct-border bg-vct-input px-3 py-2.5 text-sm outline-none focus:border-vct-accent transition" /></div>
                            ))}
                            <button className="w-fit rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition">Cập nhật mật khẩu</button>
                        </div>
                    </div>
                </motion.div>
            )}

            {tab === 'appearance' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.Moon size={16} className="text-vct-accent" /> Giao diện</h3>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {([{ k: 'dark' as const, l: 'Tối', i: '🌙' }, { k: 'light' as const, l: 'Sáng', i: '☀️' }, { k: 'system' as const, l: 'Hệ thống', i: '💻' }]).map(t => (
                                <button key={t.k} onClick={() => setTheme(t.k)}
                                    className={`rounded-xl border p-4 text-center transition ${theme === t.k ? 'border-vct-accent bg-vct-accent/10' : 'border-vct-border hover:border-vct-accent/50'}`}>
                                    <div className="text-2xl mb-2">{t.i}</div><div className="font-bold text-sm">{t.l}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.Flag size={16} className="text-vct-accent" /> Ngôn ngữ</h3>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                            {[{ k: 'vi', l: '🇻🇳 Tiếng Việt' }, { k: 'en', l: '🇬🇧 English' }].map(l => (
                                <button key={l.k} onClick={() => setLang(l.k)}
                                    className={`rounded-xl border p-3 text-sm font-bold transition ${lang === l.k ? 'border-vct-accent bg-vct-accent/10' : 'border-vct-border hover:border-vct-accent/50'}`}>{l.l}</button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {tab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.Activity size={16} className="text-vct-accent" /> Cài đặt thông báo</h3>
                        <div className="grid gap-1">
                            <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-4 py-2 text-[10px] font-bold text-vct-text-muted uppercase tracking-wider">
                                <span>Loại</span><span className="text-center">Email</span><span className="text-center">Push</span>
                            </div>
                            {notifs.map(n => (
                                <div key={n.id} className="grid grid-cols-[1fr_80px_80px] items-center gap-4 rounded-lg p-4 hover:bg-vct-input/50 transition">
                                    <div><div className="font-bold text-sm">{n.label}</div><div className="text-xs text-vct-text-muted">{n.desc}</div></div>
                                    {(['email', 'push'] as const).map(f => (
                                        <div key={f} className="flex justify-center">
                                            <button onClick={() => toggleN(n.id, f)}
                                                className={`h-6 w-11 rounded-full transition relative ${n[f] ? 'bg-vct-accent' : 'bg-vct-input'}`}>
                                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${n[f] ? 'left-[22px]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {tab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="font-bold text-sm mb-5 flex items-center gap-2"><VCT_Icons.Lock size={16} className="text-emerald-500" /> Xác thực hai bước (2FA)</h3>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-vct-input">
                            <div><div className="font-bold text-sm">Xác thực bằng ứng dụng</div><div className="text-xs text-vct-text-muted mt-0.5">Google Authenticator hoặc tương tự</div></div>
                            <button onClick={() => setTwoFA(!twoFA)} className={`h-7 w-12 rounded-full transition relative ${twoFA ? 'bg-emerald-500' : 'bg-vct-border'}`}>
                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${twoFA ? 'left-[26px]' : 'left-1'}`} /></button>
                        </div>
                        {twoFA && <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-600 font-bold flex items-center gap-2"><VCT_Icons.Check size={16} /> 2FA đã được kích hoạt</div>}
                    </div>
                    <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-sm flex items-center gap-2"><VCT_Icons.MonitorPlay size={16} className="text-vct-accent" /> Phiên đăng nhập</h3>
                            <button className="text-xs font-bold text-red-500 hover:underline">Đăng xuất tất cả</button>
                        </div>
                        <div className="grid gap-2">
                            {SESSIONS.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-vct-input">
                                    <div className="flex items-center gap-3"><div className={`h-2 w-2 rounded-full ${s.current ? 'bg-emerald-500' : 'bg-vct-text-muted'}`} />
                                        <div><div className="font-bold text-sm">{s.device}</div><div className="text-[10px] text-vct-text-muted">IP: {s.ip} · {s.time}</div></div></div>
                                    {s.current ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">Hiện tại</span>
                                        : <button className="text-xs font-bold text-red-500 hover:underline">Thu hồi</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
                        <h3 className="font-bold text-sm mb-2 text-red-500 flex items-center gap-2"><VCT_Icons.Alert size={16} /> Vùng nguy hiểm</h3>
                        <p className="text-xs text-vct-text-muted mb-4">Thao tác không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 transition">Xóa tài khoản</button>
                            <button className="rounded-lg border border-amber-500/50 px-4 py-2 text-sm font-bold text-amber-500 hover:bg-amber-500/10 transition">Vô hiệu hóa</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
