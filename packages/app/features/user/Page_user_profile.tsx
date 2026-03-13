'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_PageContainer } from '../components/vct-ui'
import { useAuth } from '../auth/AuthProvider'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const PROFILE = {
    name: 'Admin Tùng', email: 'admin@vct-platform.vn', phone: '0912 345 678',
    role: 'Super Admin', club: 'Liên đoàn Võ thuật Cổ truyền VN', belt: 'Đai Đen — Nhất Đẳng',
    joinedDate: '15/01/2020', dob: '12/08/1990', address: 'Quận 1, TP. Hồ Chí Minh',
}

const STATS = [
    { label: 'Giải đấu', value: 24, target: 24, icon: 'Trophy', color: '#f59e0b' },
    { label: 'Năm KN', value: 6, target: 6, icon: 'Award', color: '#8b5cf6' },
    { label: 'VĐV giám sát', value: 1200, target: 1200, icon: 'Users', color: '#0ea5e9', fmt: '1.2k' },
    { label: 'Chứng nhận', value: 8, target: 8, icon: 'FileText', color: '#10b981' },
]

const SKILLS = [
    { label: 'Quản trị', value: 95 },
    { label: 'Kỹ thuật', value: 82 },
    { label: 'Chiến lược', value: 88 },
    { label: 'Đào tạo', value: 90 },
    { label: 'Ngoại giao', value: 78 },
]

const ACHIEVEMENTS = [
    { title: 'Quản lý Giải VĐQG 2025', date: '06/2025', type: 'gold' as const },
    { title: 'Tổ chức Hội thảo Quốc tế VN-Hàn', date: '07/2025', type: 'silver' as const },
    { title: 'Triển khai VCT Platform v2.0', date: '01/2026', type: 'gold' as const },
    { title: 'Đào tạo 80 Trọng tài Quốc gia', date: '03/2025', type: 'bronze' as const },
]

const CERTIFICATIONS = [
    { name: 'Chứng nhận Quản lý Giải đấu QG', org: 'Tổng cục TDTT', year: '2023', status: 'active' },
    { name: 'Trọng tài Quốc gia Hạng A', org: 'Liên đoàn VCT VN', year: '2021', status: 'active' },
    { name: 'Huấn luyện viên Cấp Cao', org: 'Liên đoàn VCT VN', year: '2020', status: 'active' },
    { name: 'Đai Đen Nhất Đẳng', org: 'Phong Trào VCT', year: '2018', status: 'active' },
]

const TIMELINE = [
    { icon: 'Trophy', text: 'Tạo giải Vô địch Quốc gia 2026', time: '2 giờ trước', color: '#f59e0b', date: 'Hôm nay' },
    { icon: 'CheckCircle', text: 'Duyệt 23 hồ sơ VĐV mới', time: '5 giờ trước', color: '#10b981', date: 'Hôm nay' },
    { icon: 'FileText', text: 'Cập nhật luật thi đấu 2026', time: '1 ngày trước', color: '#3b82f6', date: 'Hôm qua' },
    { icon: 'DollarSign', text: 'Phê duyệt ngân sách Q2/2026', time: '2 ngày trước', color: '#8b5cf6', date: '11/03' },
    { icon: 'Award', text: 'Mở khóa đào tạo TT cấp QG', time: '3 ngày trước', color: '#0ea5e9', date: '10/03' },
]

type Tab = 'overview' | 'achievements' | 'certifications' | 'activity'

// ════════════════════════════════════════
// SVG SKILL RADAR
// ════════════════════════════════════════
const SkillRadar = ({ skills, size = 200 }: { skills: typeof SKILLS; size?: number }) => {
    const cx = size / 2
    const cy = size / 2
    const r = size * 0.38
    const n = skills.length
    const angleStep = (2 * Math.PI) / n

    const getPoint = (i: number, pct: number) => ({
        x: cx + r * pct * Math.sin(i * angleStep),
        y: cy - r * pct * Math.cos(i * angleStep),
    })

    const rings = [0.25, 0.5, 0.75, 1.0]
    const dataPoints = skills.map((s, i) => getPoint(i, s.value / 100))
    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
            {/* Background rings */}
            {rings.map(pct => {
                const pts = Array.from({ length: n }, (_, i) => getPoint(i, pct))
                const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
                return <path key={pct} d={d} fill="none" stroke="var(--vct-border)" strokeWidth={0.5} opacity={0.4} />
            })}
            {/* Axis lines */}
            {skills.map((_, i) => {
                const p = getPoint(i, 1)
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--vct-border)" strokeWidth={0.5} opacity={0.3} />
            })}
            {/* Filled area */}
            <motion.path
                d={dataPath}
                fill="url(#radarGradient)"
                stroke="var(--vct-accent)"
                strokeWidth={1.5}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            {/* Data points */}
            {dataPoints.map((p, i) => (
                <motion.circle
                    key={i}
                    cx={p.x} cy={p.y} r={3.5}
                    fill="var(--vct-accent)" stroke="var(--vct-bg-card)" strokeWidth={2}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                />
            ))}
            {/* Labels */}
            {skills.map((s, i) => {
                const p = getPoint(i, 1.22)
                return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                        className="fill-[var(--vct-text-secondary)]" fontSize={10} fontWeight={600}>
                        {s.label}
                    </text>
                )
            })}
            <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--vct-accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.15} />
                </linearGradient>
            </defs>
        </svg>
    )
}

// ════════════════════════════════════════
// ANIMATED COUNTER
// ════════════════════════════════════════
const AnimatedCounter = ({ target, fmt }: { target: number; fmt?: string }) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let frame: number
        const duration = 1200
        const start = Date.now()
        const step = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setCount(Math.round(target * eased))
            if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [target])
    return <>{fmt && count >= target ? fmt : count.toLocaleString()}</>
}

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_user_profile() {
    const [tab, setTab] = useState<Tab>('overview')
    const { currentUser } = useAuth()
    const userName = currentUser?.name || PROFILE.name
    const initials = userName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()

    const TABS: { key: Tab; label: string; icon: keyof typeof VCT_Icons }[] = [
        { key: 'overview', label: 'Tổng quan', icon: 'LayoutGrid' },
        { key: 'achievements', label: 'Thành tích', icon: 'Trophy' },
        { key: 'certifications', label: 'Chứng nhận', icon: 'Award' },
        { key: 'activity', label: 'Hoạt động', icon: 'Activity' },
    ]

    const medalMap = { gold: '🥇', silver: '🥈', bronze: '🥉' }
    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══════ HERO BANNER ══════ */}
            <div className="relative overflow-hidden rounded-2xl border border-vct-border bg-[var(--vct-bg-card)]">
                {/* Animated gradient background */}
                <div className="relative h-40 overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(139,92,246,0.3), rgba(245,158,11,0.25))',
                        backgroundSize: '400% 400%',
                        animation: 'profileGradient 12s ease infinite',
                    }} />
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                        backgroundSize: '40px 40px',
                    }} />
                    {/* Quick actions */}
                    <div className="absolute right-4 top-4 flex gap-2">
                        <button className="flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition">
                            <VCT_Icons.Download size={12} /> Export PDF
                        </button>
                        <button className="flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition">
                            <VCT_Icons.Share size={12} /> Chia sẻ
                        </button>
                    </div>
                </div>

                {/* Profile info */}
                <div className="relative px-6 pb-6 -mt-14">
                    <div className="flex flex-wrap items-end gap-5">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="relative h-28 w-28 shrink-0"
                        >
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-vct-accent to-blue-600 shadow-2xl" />
                            <div className="absolute inset-[3px] rounded-[13px] bg-[var(--vct-bg-card)] flex items-center justify-center">
                                <span className="text-4xl font-black bg-gradient-to-br from-vct-accent to-blue-500 bg-clip-text text-transparent">
                                    {initials}
                                </span>
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-emerald-500 border-[3px] border-[var(--vct-bg-card)]" />
                        </motion.div>

                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="text-2xl font-black truncate text-[var(--vct-text-primary)]">{userName}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-vct-accent/12 text-vct-accent border border-vct-accent/20">
                                    <VCT_Icons.Shield size={11} /> {PROFILE.role}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-500 border border-amber-500/20">
                                    <VCT_Icons.Award size={11} /> {PROFILE.belt}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--vct-text-secondary)]">
                                <span className="flex items-center gap-1.5"><VCT_Icons.Building size={12} /> {PROFILE.club}</span>
                                <span className="flex items-center gap-1.5"><VCT_Icons.Calendar size={12} /> Từ {PROFILE.joinedDate}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pb-1">
                            <a href="/settings" className="flex items-center gap-1.5 rounded-xl border border-vct-border px-4 py-2.5 text-xs font-bold text-[var(--vct-text-secondary)] hover:border-vct-accent hover:text-vct-accent transition bg-[var(--vct-bg-elevated)]">
                                <VCT_Icons.Settings size={14} /> Cài đặt
                            </a>
                            <button className="flex items-center gap-1.5 rounded-xl bg-vct-accent px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition shadow-lg shadow-vct-accent/20">
                                <VCT_Icons.Edit size={14} /> Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ GLASSMORPHISM STATS ══════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {STATS.map((s, i) => {
                    const Icon = iconMap[s.icon] ?? VCT_Icons.Activity
                    return (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.08 }}
                            className="group relative overflow-hidden rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-5 transition-all hover:border-vct-accent/40 hover:shadow-lg"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: s.color, filter: 'blur(20px)' }} />
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                                    <Icon size={18} style={{ color: s.color }} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tight" style={{ color: s.color }}>
                                <AnimatedCounter target={s.value} fmt={s.fmt} />
                            </div>
                            <div className="text-[11px] font-semibold text-[var(--vct-text-secondary)] mt-1 uppercase tracking-wider">{s.label}</div>
                        </motion.div>
                    )
                })}
            </div>

            {/* ══════ TABS ══════ */}
            <div className="flex gap-1 rounded-xl border border-vct-border bg-[var(--vct-bg-elevated)] p-1 mt-6 flex-wrap">
                {TABS.map(t => {
                    const TabIcon = iconMap[t.icon] ?? VCT_Icons.Activity
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === t.key ? 'text-white' : 'text-[var(--vct-text-secondary)] hover:bg-[var(--vct-bg-base)]'}`}>
                            {tab === t.key && (
                                <motion.div layoutId="profileTab" className="absolute inset-0 rounded-lg bg-vct-accent shadow-lg shadow-vct-accent/25" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <TabIcon size={15} /> {t.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* ══════ TAB CONTENT ══════ */}
            <AnimatePresence mode="wait">
                {tab === 'overview' && (
                    <motion.div key="ov" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid md:grid-cols-5 gap-6 mt-6">
                        {/* Contact Info (3 cols) */}
                        <div className="md:col-span-3 space-y-6">
                            <div className="rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-6">
                                <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-[var(--vct-text-primary)]">
                                    <VCT_Icons.User size={16} className="text-vct-accent" /> Thông tin liên hệ
                                </h3>
                                <div className="grid gap-3">
                                    {[
                                        { l: 'Email', v: PROFILE.email, icon: 'Mail', color: '#0ea5e9' },
                                        { l: 'Điện thoại', v: PROFILE.phone, icon: 'Phone', color: '#10b981' },
                                        { l: 'Ngày sinh', v: PROFILE.dob, icon: 'Calendar', color: '#f59e0b' },
                                        { l: 'Địa chỉ', v: PROFILE.address, icon: 'MapPin', color: '#8b5cf6' },
                                        { l: 'Tổ chức', v: PROFILE.club, icon: 'Building', color: '#ec4899' },
                                        { l: 'Ngày tham gia', v: PROFILE.joinedDate, icon: 'Clock', color: '#64748b' },
                                    ].map(item => {
                                        const ItemIcon = iconMap[item.icon] ?? VCT_Icons.Activity
                                        return (
                                            <div key={item.l} className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] transition hover:border-vct-accent/30">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}12` }}>
                                                    <ItemIcon size={15} style={{ color: item.color }} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-[var(--vct-text-secondary)] font-bold uppercase tracking-wider">{item.l}</div>
                                                    <div className="text-sm font-bold text-[var(--vct-text-primary)]">{item.v}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Skill Radar (2 cols) */}
                        <div className="md:col-span-2">
                            <div className="rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-6">
                                <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[var(--vct-text-primary)]">
                                    <VCT_Icons.Target size={16} className="text-vct-accent" /> Biểu đồ năng lực
                                </h3>
                                <SkillRadar skills={SKILLS} size={220} />
                                <div className="mt-4 space-y-2">
                                    {SKILLS.map(s => (
                                        <div key={s.label} className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-[var(--vct-text-secondary)] w-16">{s.label}</span>
                                            <div className="flex-1 h-1.5 rounded-full bg-[var(--vct-bg-base)] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-vct-accent to-blue-500"
                                                    initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-vct-accent w-8 text-right">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {tab === 'achievements' && (
                    <motion.div key="ach" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-3 mt-6">
                        {ACHIEVEMENTS.map((a, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                className="group flex items-center gap-4 rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-5 hover:border-vct-accent/40 hover:shadow-md transition-all">
                                <div className="text-4xl shrink-0">{medalMap[a.type]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[var(--vct-text-primary)]">{a.title}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)] mt-1 flex items-center gap-2">
                                        <VCT_Icons.Calendar size={11} /> {a.date}
                                    </div>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/12 text-emerald-500 border border-emerald-500/20">
                                    <VCT_Icons.CheckCircle size={10} className="inline mr-1" />Đạt
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {tab === 'certifications' && (
                    <motion.div key="cert" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-3 mt-6">
                        {CERTIFICATIONS.map((c, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                className="group flex items-center gap-4 rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-5 hover:border-vct-accent/40 hover:shadow-md transition-all">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-vct-accent/15 to-blue-500/10 border border-vct-accent/20 flex items-center justify-center shrink-0">
                                    <VCT_Icons.Award size={22} className="text-vct-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[var(--vct-text-primary)] truncate">{c.name}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)] mt-1 flex items-center gap-2">
                                        <VCT_Icons.Building size={11} /> {c.org} · {c.year}
                                    </div>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/12 text-emerald-500 border border-emerald-500/20">
                                    Còn hiệu lực
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {tab === 'activity' && (
                    <motion.div key="act" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6">
                        <div className="relative pl-8">
                            {/* Vertical line */}
                            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-vct-accent/40 via-vct-accent/20 to-transparent" />

                            <div className="space-y-4">
                                {TIMELINE.map((item, i) => {
                                    const TimeIcon = iconMap[item.icon] ?? VCT_Icons.Activity
                                    const showDateHeader = i === 0 || item.date !== TIMELINE[i - 1]?.date
                                    return (
                                        <React.Fragment key={i}>
                                            {showDateHeader && (
                                                <div className="relative -ml-8 mb-2 mt-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--vct-text-secondary)] bg-[var(--vct-bg-base)] px-2 py-1 rounded-md border border-[var(--vct-border-subtle)]">
                                                        {item.date}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.08 }}
                                                className="relative group"
                                            >
                                                {/* Dot on timeline */}
                                                <div className="absolute -left-8 top-4 w-[11px] h-[11px] rounded-full border-2 border-[var(--vct-bg-base)]" style={{ background: item.color }} />

                                                <div className="flex items-start gap-3 rounded-2xl border border-vct-border bg-[var(--vct-bg-elevated)] p-4 hover:border-vct-accent/30 hover:shadow-sm transition-all">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}12` }}>
                                                        <TimeIcon size={16} style={{ color: item.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-[var(--vct-text-primary)]">{item.text}</div>
                                                        <div className="text-[10px] text-[var(--vct-text-secondary)] mt-1">{item.time}</div>
                                                    </div>
                                                    <VCT_Icons.ChevronRight size={14} className="shrink-0 text-[var(--vct-text-secondary)] opacity-0 group-hover:opacity-60 transition" />
                                                </div>
                                            </motion.div>
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════ KEYFRAME ══════ */}
            <style>{`
                @keyframes profileGradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
        </VCT_PageContainer>
    )
}
