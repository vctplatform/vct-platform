'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    VCT_Text, VCT_Badge,
} from '@vct/ui'
import { useAuth } from 'app/features/auth/AuthProvider'

/* ── Types ──────────────────────────────────────────────────── */

interface ChildLink {
    id: string; athlete_id: string; athlete_name: string; club_name: string
    belt_level: string; relation: string; status: string
}
interface ConsentRecord {
    id: string; athlete_id: string; athlete_name: string; type: string
    title: string; description: string; status: string; signed_at: string
}
interface ChildResult {
    tournament: string; category: string; result: string; date: string
}
interface AttendanceRecord {
    date: string; session: string; status: string; coach: string
}
interface DashboardData {
    children_count: number; pending_consents: number; active_consents: number
    upcoming_events: number; children: ChildLink[]; recent_results: ChildResult[]
}

type Tab = 'overview' | 'children' | 'consents' | 'attendance'

/* ── API helper ─────────────────────────────────────────────── */

const API_BASE = '/api/v1/parent'

function createApiFetch(token: string | null) {
    return async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(init?.headers as Record<string, string>),
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers,
        })
        if (!res.ok) {
            const text = await res.text()
            throw new Error(text || `HTTP ${res.status}`)
        }
        return res.json()
    }
}

/* ── Animation Variants ────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    }),
}

/* ── Count-Up Hook ─────────────────────────────────────────── */
function useCountUp(target: number, duration: number = 800) {
    const [current, setCurrent] = useState(0)
    const animRef = useRef<number | null>(null)

    useEffect(() => {
        const startTime = Date.now()
        const tick = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(Math.round(eased * target))
            if (progress < 1) {
                animRef.current = requestAnimationFrame(tick)
            }
        }
        animRef.current = requestAnimationFrame(tick)
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [target, duration])

    return current
}

/* ── Skeleton Loader ───────────────────────────────────────── */
function SkeletonBlock({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-xl animate-pulse vct-skeleton-block ${className}`}
        />
    )
}
function LoadingSkeleton() {
    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} className="h-24" />)}
            </div>
            <SkeletonBlock className="h-40" />
            <SkeletonBlock className="h-32" />
        </div>
    )
}

/* ── Error Banner ──────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="rounded-xl p-4 border vct-error-banner">
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                    <div className="text-red-400 font-semibold">Lỗi tải dữ liệu</div>
                    <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{message}</VCT_Text>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border-none"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--vct-danger)' }}
                >Thử lại</motion.button>
            </div>
        </div>
    )
}

/* ── Page Component ─────────────────────────────────────────── */

export function Page_ParentDashboard() {
    const { token } = useAuth()
    const apiFetch = createApiFetch(token)
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await apiFetch<DashboardData>('/dashboard')
            setDashboard(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể kết nối server')
        } finally {
            setLoading(false)
        }
    }, [apiFetch])

    useEffect(() => { fetchDashboard() }, [fetchDashboard])

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Tổng quan', icon: '🏠' },
        { id: 'children', label: 'Con em', icon: '👨‍👧‍👦' },
        { id: 'consents', label: 'Đồng thuận', icon: '📋' },
        { id: 'attendance', label: 'Điểm danh', icon: '📅' },
    ]
    const activePanelId = `parent-tab-panel-${activeTab}`

    return (
        <div className="min-h-screen bg-linear-to-b from-[#0d1117] to-[#161b22]">
            {/* ── Header ──────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="px-6 py-5 border-b border-white/8"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-blue-500/20">
                        👪
                    </div>
                    <div>
                        <VCT_Text variant="h1" style={{ color: 'var(--vct-bg-elevated)', margin: 0, fontSize: '1.5rem' }}>
                            Cổng Phụ Huynh
                        </VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Quản lý hoạt động con em trong võ thuật
                        </VCT_Text>
                    </div>
                </div>
            </motion.div>

            {/* ── Tab Bar ─────────────────────────────────── */}
            <div
                role="tablist"
                aria-label="Điều hướng cổng phụ huynh"
                className="relative flex gap-1 p-2 mx-4 mt-4 rounded-xl bg-white/4"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        id={`parent-tab-${tab.id}`}
                        aria-controls={`parent-tab-panel-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-none cursor-pointer z-10 bg-transparent ${activeTab === tab.id ? 'text-white' : 'text-white/50'}`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="parent-tab-bg"
                                className="absolute inset-0 rounded-lg bg-linear-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.icon} {tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Content ─────────────────────────────────── */}
            <div
                id={activePanelId}
                role="tabpanel"
                aria-labelledby={`parent-tab-${activeTab}`}
                className="p-4"
            >
                {loading && <LoadingSkeleton />}
                {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}
                {!loading && !error && dashboard && (
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && <OverviewTab key="overview" data={dashboard} />}
                        {activeTab === 'children' && <ChildrenTab key="children" linkedChildren={dashboard.children} onRefresh={fetchDashboard} onNavigateTab={setActiveTab} apiFetch={apiFetch} />}
                        {activeTab === 'consents' && <ConsentsTab key="consents" linkedChildren={dashboard.children} onRefresh={fetchDashboard} apiFetch={apiFetch} />}
                        {activeTab === 'attendance' && <AttendanceTab key="attendance" linkedChildren={dashboard.children} apiFetch={apiFetch} />}
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

/* ── Overview Tab ───────────────────────────────────────────── */

function OverviewTab({ data }: { data: DashboardData }) {
    const stats = [
        { label: 'Con em', value: data.children_count, icon: '👨‍👧‍👦', colorClass: 'text-(--vct-info)' },
        { label: 'Đồng thuận', value: data.active_consents, icon: '✅', colorClass: 'text-(--vct-success)' },
        { label: 'Chờ xử lý', value: data.pending_consents, icon: '⏳', colorClass: 'text-(--vct-warning)' },
        { label: 'Sự kiện sắp tới', value: data.upcoming_events, icon: '🏆', colorClass: 'text-(--vct-info)' },
    ]

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                        whileHover={{ scale: 1.03, y: -2 }}
                        className="rounded-xl p-4 bg-white/4 border border-white/8 cursor-default backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{stat.icon}</span>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</VCT_Text>
                        </div>
                        <CountUpNumber value={stat.value} colorClass={stat.colorClass} />
                    </motion.div>
                ))}
            </div>

            {/* Children Quick Cards */}
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                👨‍👧‍👦 Con em của bạn
            </VCT_Text>
            <div className="grid gap-3 mb-6">
                {data.children.map((child, i) => (
                    <motion.div
                        key={child.id} custom={i + 4} variants={fadeUp} initial="hidden" animate="visible"
                        whileHover={{ x: 4, borderColor: 'rgba(59,130,246,0.3)' }}
                        className="flex items-center gap-4 rounded-xl p-4 bg-white/4 border border-white/8 transition-colors cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/15 text-2xl">
                            🥋
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-semibold">{child.athlete_name}</div>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {child.club_name} · {child.belt_level}
                            </VCT_Text>
                        </div>
                        <VCT_Badge type="success" text={child.status === 'approved' ? 'Đã liên kết' : 'Chờ duyệt'} />
                    </motion.div>
                ))}
            </div>

            {/* Recent Results */}
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '0.75rem' }}>
                🏆 Thành tích gần đây
            </VCT_Text>
            <div className="grid gap-2">
                {data.recent_results.map((r, i) => (
                    <motion.div
                        key={i} custom={i + 6} variants={fadeUp} initial="hidden" animate="visible"
                        className="rounded-xl px-4 py-3 bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-white font-semibold text-[0.95rem]">{r.result}</div>
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {r.tournament} · {r.category}
                                </VCT_Text>
                            </div>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.date}</VCT_Text>
                        </div>
                    </motion.div>
                ))}
                {data.recent_results.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-3xl mb-2">🏆</div>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Chưa có thành tích
                        </VCT_Text>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

/* ── Count Up Number Component ────────────────────────────── */
function CountUpNumber({ value, colorClass }: { value: number; colorClass: string }) {
    const count = useCountUp(value)
    return <div className={`text-[2rem] font-extrabold ${colorClass}`}>{count}</div>
}

/* ── Children Tab ──────────────────────────────────────────── */

type ApiFetch = <T>(path: string, init?: RequestInit) => Promise<T>

function ChildrenTab({ linkedChildren, onRefresh, onNavigateTab, apiFetch }: {
    linkedChildren: ChildLink[]; onRefresh: () => void; onNavigateTab: (tab: Tab) => void; apiFetch: ApiFetch
}) {
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkForm, setLinkForm] = useState({ athlete_id: '', athlete_name: '', relation: 'cha' })
    const [submitting, setSubmitting] = useState(false)
    const [linkError, setLinkError] = useState<string | null>(null)

    const handleLink = async () => {
        setSubmitting(true)
        setLinkError(null)
        try {
            await apiFetch('/children/link', {
                method: 'POST',
                body: JSON.stringify(linkForm),
            })
            setShowLinkModal(false)
            setLinkForm({ athlete_id: '', athlete_name: '', relation: 'cha' })
            onRefresh()
        } catch (err: unknown) {
            setLinkError(err instanceof Error ? err.message : 'Lỗi liên kết con em')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '1rem' }}>
                👨‍👧‍👦 Quản lý con em
            </VCT_Text>

            <div className="grid gap-4">
                {linkedChildren.map((child, i) => (
                    <motion.div
                        key={child.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                        className="rounded-xl p-5 bg-white/4 border border-white/8"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-linear-to-br from-blue-500/20 to-purple-500/20 text-3xl">
                                🥋
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-lg">{child.athlete_name}</div>
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    {child.club_name} · {child.belt_level} · Quan hệ: {child.relation}
                                </VCT_Text>
                            </div>
                            <VCT_Badge type={child.status === 'approved' ? 'success' : 'warning'}
                                text={child.status === 'approved' ? '✅ Đã liên kết' : '⏳ Chờ duyệt'} />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: '📊 Kết quả', bg: 'rgba(59,130,246,0.1)', color: 'var(--vct-info)', border: 'rgba(59,130,246,0.2)', tab: 'overview' as Tab },
                                { label: '📅 Điểm danh', bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)', tab: 'attendance' as Tab },
                                { label: '📋 Đồng thuận', bg: 'rgba(139,92,246,0.1)', color: 'var(--vct-info)', border: 'rgba(139,92,246,0.2)', tab: 'consents' as Tab },
                            ].map(btn => (
                                <motion.button
                                    key={btn.label}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => onNavigateTab(btn.tab)}
                                    className="py-2 rounded-lg text-sm font-medium cursor-pointer"
                                    style={{ background: btn.bg, color: btn.color, border: `1px solid ${btn.border}` }}
                                >{btn.label}</motion.button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Link New Child Button */}
            <motion.div
                whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
                onClick={() => setShowLinkModal(true)}
                className="mt-6 p-4 rounded-xl text-center cursor-pointer border-2 border-dashed border-white/10 transition-colors"
            >
                <div className="text-3xl mb-2">➕</div>
                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Liên kết thêm con em
                </VCT_Text>
            </motion.div>

            {/* ── Link Modal ──────────────────────────────── */}
            <AnimatePresence>
                {showLinkModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 vct-modal-overlay"
                        onClick={() => setShowLinkModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl p-6 vct-modal-panel"
                        >
                            <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '1.5rem' }}>
                                ➕ Liên kết con em mới
                            </VCT_Text>
                            <div className="grid gap-4">
                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Mã VĐV</label>
                                    <input
                                        type="text" placeholder="ATH-XXX"
                                        value={linkForm.athlete_id}
                                        onChange={(e) => setLinkForm(p => ({ ...p, athlete_id: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Họ tên VĐV</label>
                                    <input
                                        type="text" placeholder="Nguyễn Văn ..."
                                        value={linkForm.athlete_name}
                                        onChange={(e) => setLinkForm(p => ({ ...p, athlete_name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Quan hệ</label>
                                    <select
                                        title="Quan hệ"
                                        value={linkForm.relation}
                                        onChange={(e) => setLinkForm(p => ({ ...p, relation: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                                    >
                                        <option value="cha">Cha</option>
                                        <option value="mẹ">Mẹ</option>
                                        <option value="người giám hộ">Người giám hộ</option>
                                        <option value="ông">Ông</option>
                                        <option value="bà">Bà</option>
                                        <option value="anh/chị">Anh/Chị</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowLinkModal(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                                >Hủy</motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={handleLink}
                                    disabled={submitting || !linkForm.athlete_id.trim() || !linkForm.athlete_name.trim()}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none text-white disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                                >{submitting ? 'Đang gửi...' : '✅ Gửi yêu cầu'}</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ── Consents Tab ──────────────────────────────────────────── */

const consentTypeMap: Record<string, { icon: string; label: string; bgClass: string }> = {
    tournament: { icon: '🏆', label: 'Giải đấu', bgClass: 'bg-[#3b82f615]' },
    belt_exam: { icon: '🥋', label: 'Thi đai', bgClass: 'bg-[#8b5cf615]' },
    medical: { icon: '🏥', label: 'Y tế', bgClass: 'bg-[#22c55e15]' },
    photo_usage: { icon: '📸', label: 'Hình ảnh', bgClass: 'bg-[#f59e0b15]' },
    training: { icon: '🏋️', label: 'Tập luyện', bgClass: 'bg-[#06b6d415]' },
}

function ConsentsTab({ linkedChildren, onRefresh, apiFetch }: { linkedChildren: ChildLink[]; onRefresh: () => void; apiFetch: ApiFetch }) {
    const [consents, setConsents] = useState<ConsentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [revoking, setRevoking] = useState<string | null>(null)
    const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchConsents = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await apiFetch<ConsentRecord[]>('/consents')
            setConsents(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể tải đồng thuận')
        } finally {
            setLoading(false)
        }
    }, [apiFetch])

    useEffect(() => { fetchConsents() }, [fetchConsents])

    const handleRevoke = async (id: string) => {
        setRevoking(id)
        setError(null)
        try {
            await apiFetch(`/consents/${id}`, { method: 'DELETE' })
            setConfirmRevoke(null)
            fetchConsents()
            onRefresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Không thể thu hồi đồng thuận')
        } finally {
            setRevoking(null)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex justify-between items-center mb-4">
                <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', margin: 0 }}>📋 E-Consent</VCT_Text>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-linear-to-r from-blue-500 to-purple-600 text-white border-none cursor-pointer shadow-lg shadow-blue-500/20"
                >+ Ký mới</motion.button>
            </div>

            {loading ? <LoadingSkeleton /> : (
                <div className="grid gap-3">
                    {consents.map((c, i) => {
                        const typeInfo = consentTypeMap[c.type] || consentTypeMap.training
                        return (
                            <motion.div
                                key={c.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                                className="rounded-xl p-4 bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${typeInfo?.bgClass || 'bg-black/15'}`}>
                                        {typeInfo?.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-semibold text-[0.95rem]">{c.title}</div>
                                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {typeInfo?.label} · {c.athlete_name} · Ký ngày {c.signed_at?.split('T')[0]!}
                                        </VCT_Text>
                                    </div>
                                    <VCT_Badge
                                        type={c.status === 'active' ? 'success' : 'danger'}
                                        text={c.status === 'active' ? '✅ Hiệu lực' : '❌ Đã thu hồi'}
                                    />
                                </div>
                                {c.status === 'active' && (
                                    <div className="mt-3 flex justify-end">
                                        {confirmRevoke === c.id ? (
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setConfirmRevoke(null)}
                                                    className="px-3 py-1 rounded-lg text-xs cursor-pointer border-none vct-dark-ghost-btn"
                                                >Hủy</motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleRevoke(c.id)}
                                                    disabled={revoking === c.id}
                                                    className="px-3 py-1 rounded-lg text-xs cursor-pointer border-none vct-dark-revoke-btn"
                                                >{revoking === c.id ? '...' : '⚠️ Xác nhận thu hồi'}</motion.button>
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                onClick={() => setConfirmRevoke(c.id)}
                                                className="px-3 py-1 rounded-lg text-xs cursor-pointer bg-red-500/10 text-red-400 border border-red-500/20"
                                            >Thu hồi</motion.button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                    {consents.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-3xl mb-2">📋</div>
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>Chưa có đồng thuận nào</VCT_Text>
                        </div>
                    )}
                </div>
            )}

            {/* ── New Consent Modal ──────────────────────── */}
            <AnimatePresence>
                {showNewModal && (
                    <NewConsentModal
                        linkedChildren={linkedChildren}
                        onClose={() => setShowNewModal(false)}
                        onSuccess={() => { setShowNewModal(false); fetchConsents(); onRefresh() }}
                        apiFetch={apiFetch}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ── New Consent Modal ─────────────────────────────────────── */

function NewConsentModal({ linkedChildren, onClose, onSuccess, apiFetch }: {
    linkedChildren: ChildLink[]; onClose: () => void; onSuccess: () => void; apiFetch: ApiFetch
}) {
    const [form, setForm] = useState({
        athlete_id: '',
        athlete_name: '',
        type: 'tournament',
        title: '',
        description: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setSubmitting(true)
        setSubmitError(null)
        try {
            await apiFetch('/consents', { method: 'POST', body: JSON.stringify(form) })
            onSuccess()
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'Không thể tạo đồng thuận')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChildSelect = (athleteId: string) => {
        const child = linkedChildren.find(c => c.athlete_id === athleteId)
        setForm(f => ({ ...f, athlete_id: athleteId, athlete_name: child?.athlete_name || '' }))
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 vct-modal-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-6 vct-modal-panel"
            >
                <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', marginBottom: '1.5rem' }}>📋 Ký đồng thuận mới</VCT_Text>
                <div className="grid gap-4">
                    <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Chọn con em</label>
                        <select
                            title="Chọn con em"
                            value={form.athlete_id}
                            onChange={(e) => handleChildSelect(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                        >
                            {linkedChildren.filter(c => c.status === 'approved').map(c => (
                                <option key={c.athlete_id} value={c.athlete_id}>{c.athlete_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Loại đồng thuận</label>
                        <select
                            title="Loại đồng thuận"
                            value={form.type}
                            onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                        >
                            <option value="tournament">🏆 Giải đấu</option>
                            <option value="belt_exam">🥋 Thi đai</option>
                            <option value="medical">🏥 Y tế</option>
                            <option value="photo_usage">📸 Hình ảnh</option>
                            <option value="training">🏋️ Tập luyện</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Tiêu đề</label>
                        <input
                            type="text" placeholder="VD: Đồng ý tham gia giải..."
                            value={form.title}
                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl text-sm vct-dark-input"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1 block">Mô tả</label>
                        <textarea
                            placeholder="Chi tiết nội dung đồng thuận..."
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none vct-dark-input"
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                    >Hủy</motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={submitting || !form.title.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none text-white disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                    >{submitting ? 'Đang ký...' : '✅ Ký đồng thuận'}</motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ── Attendance Tab ────────────────────────────────────────── */

const statusMap: Record<string, { icon: string; label: string; color: string }> = {
    present: { icon: '✅', label: 'Có mặt', color: 'var(--vct-success)' },
    late: { icon: '⏰', label: 'Trễ', color: 'var(--vct-warning)' },
    absent: { icon: '❌', label: 'Vắng', color: 'var(--vct-danger)' },
}

function AttendanceTab({ linkedChildren, apiFetch }: { linkedChildren: ChildLink[]; apiFetch: ApiFetch }) {
    const approvedChildren = linkedChildren.filter(c => c.status === 'approved')
    const [selectedChild, setSelectedChild] = useState(approvedChildren[0]?.athlete_id || '')
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAttendance = useCallback(async (athleteId: string) => {
        if (!athleteId) return
        setLoading(true)
        setError(null)
        try {
            const data = await apiFetch<AttendanceRecord[]>(`/children/${athleteId}/attendance`)
            setAttendance(data)
        } catch (err: unknown) {
            setAttendance([])
            setError(err instanceof Error ? err.message : 'Không thể tải điểm danh')
        } finally {
            setLoading(false)
        }
    }, [apiFetch])

    useEffect(() => { fetchAttendance(selectedChild) }, [selectedChild, fetchAttendance])

    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const late = attendance.filter(a => a.status === 'late').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    const selectedName = approvedChildren.find(c => c.athlete_id === selectedChild)?.athlete_name || ''

    // Mini heatmap: generate 28-day grid
    const heatmapDays = Array.from({ length: 28 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]!
        const record = attendance.find(a => a.date === dateStr)
        return { date: dateStr, status: record?.status || 'none', day: d.getDate() }
    }).reverse()

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex justify-between items-center mb-4">
                <VCT_Text variant="h2" style={{ color: 'var(--vct-bg-elevated)', margin: 0 }}>
                    📅 Điểm danh tập luyện
                </VCT_Text>
                {approvedChildren.length > 1 && (
                    <select
                        title="Chọn con em"
                        value={selectedChild}
                        onChange={(e) => setSelectedChild(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm vct-dark-input"
                    >
                        {approvedChildren.map(c => (
                            <option key={c.athlete_id} value={c.athlete_id}>{c.athlete_name}</option>
                        ))}
                    </select>
                )}
            </div>

            {approvedChildren.length <= 1 && selectedName && (
                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', display: 'block' }}>
                    Đang xem: {selectedName}
                </VCT_Text>
            )}

            {loading ? <LoadingSkeleton /> : (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        {[
                            { label: 'Tổng buổi', value: total, colorClass: 'text-(--vct-info)' },
                            { label: 'Có mặt', value: present, colorClass: 'text-(--vct-success)' },
                            { label: 'Trễ', value: late, colorClass: 'text-(--vct-warning)' },
                            { label: 'Vắng', value: absent, colorClass: 'text-(--vct-danger)' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                                className="rounded-xl p-3 text-center bg-white/4 border border-white/8"
                            >
                                <CountUpNumber value={s.value} colorClass={s.colorClass} />
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</VCT_Text>
                            </motion.div>
                        ))}
                    </div>

                    {/* Attendance Rate */}
                    <div className="rounded-xl p-4 mb-6 bg-white/4 border border-white/8">
                        <div className="flex justify-between items-center mb-2">
                            <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.5)' }}>Tỷ lệ chuyên cần</VCT_Text>
                            <span className={`font-bold ${rate >= 80 ? 'text-(--vct-success)' : 'text-(--vct-warning)'}`}>{rate}%</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white/10">
                            <motion.div className={`h-3 rounded-full ${rate >= 80 ? 'bg-(--vct-success)' : 'bg-(--vct-warning)'}`} initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }} />
                        </div>
                    </div>

                    {/* Mini Heatmap Calendar */}
                    <div className="rounded-xl p-4 mb-6 bg-white/4 border border-white/8">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Lịch 28 ngày gần nhất</div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {heatmapDays.map((d, i) => {
                                const bgColor = d.status === 'present' ? 'bg-emerald-500' : d.status === 'late' ? 'bg-amber-500' : d.status === 'absent' ? 'bg-red-500' : 'bg-white/6'
                                const opacity = d.status === 'none' ? 'opacity-30' : 'opacity-90'
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className={`aspect-square rounded-md ${bgColor} ${opacity} flex items-center justify-center text-[9px] font-bold text-white/70 cursor-default`}
                                        title={`${d.date}: ${d.status}`}
                                    >
                                        {d.day}
                                    </motion.div>
                                )
                            })}
                        </div>
                        <div className="flex gap-4 mt-3 text-[10px] text-white/40">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Có mặt</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Trễ</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Vắng</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white/10"></span> Không có</span>
                        </div>
                    </div>

                    {/* Records */}
                    <div className="grid gap-2">
                        {attendance.map((a, i) => {
                            const s = statusMap[a.status] || { icon: '❓', label: 'Không rõ', color: 'var(--vct-text-tertiary)' }
                            return (
                                <motion.div
                                    key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                                    className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
                                >
                                    <div className="min-w-24 font-bold font-mono text-vct-accent">
                                        {a.date}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{a.session}</div>
                                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.coach}</VCT_Text>
                                    </div>
                                    <VCT_Badge type={a.status === 'present' ? 'success' : a.status === 'late' ? 'warning' : 'danger'}
                                        text={`${s.icon} ${s.label}`} />
                                </motion.div>
                            )
                        })}
                        {attendance.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-3xl mb-2">📅</div>
                                <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    Chưa có dữ liệu điểm danh
                                </VCT_Text>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    )
}

/* ── VCT_Text fallback (import from vct-ui) ─────────────────── */
// VCT_Text, VCT_Badge imported from app/features/components/vct-ui
