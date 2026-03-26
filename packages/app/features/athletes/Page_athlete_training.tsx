'use client'
import React, { useMemo, useState } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_Badge } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { TrainingSession, AttendanceStats } from '@vct/shared-types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE TRAINING
// Lịch tập & Điểm danh riêng cho VĐV
// ═══════════════════════════════════════════════════════════════

const SESSION_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    regular: { label: 'Thường', color: 'var(--vct-info)', icon: '🥋' },
    sparring: { label: 'Đối kháng', color: 'var(--vct-danger)', icon: '⚔️' },
    exam: { label: 'Thi đấu', color: 'var(--vct-warning)', icon: '🏆' },
    special: { label: 'Đặc biệt', color: 'var(--vct-info)', icon: '⭐' },
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    completed: { label: 'Đã tập', variant: 'success' },
    scheduled: { label: 'Sắp tới', variant: 'neutral' },
    absent: { label: 'Vắng', variant: 'danger' },
    cancelled: { label: 'Hủy', variant: 'warning' },
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getWeekDates(offset: number = 0): Date[] {
    const now = new Date()
    now.setDate(now.getDate() + offset * 7)
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1))
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d
    })
}

function formatDate(d: Date) { return d.toISOString().slice(0, 10) }
function isToday(d: Date) { return formatDate(d) === formatDate(new Date()) }

/* ── Stat Card ────────────────────────────────────────────── */

function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) {
    return (
        <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated hover:border-opacity-50 transition-all group"
            style={{ borderColor: `${color}30` }}>
            <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, color }}>{icon}</div>
                <span className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-black text-vct-text group-hover:scale-105 transition-transform origin-left">{value}</div>
            {sub && <div className="text-[10px] text-vct-text-muted mt-0.5">{sub}</div>}
        </div>
    )
}

/* ── Session Card ─────────────────────────────────────────── */

function SessionCard({ session }: { session: TrainingSession }) {
    const typeInfo = (SESSION_TYPE_LABELS[session.type] || SESSION_TYPE_LABELS.regular)!
    const statusInfo = (STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled)!

    return (
        <div className="p-3.5 rounded-xl border border-vct-border bg-vct-elevated hover:border-vct-border-strong transition-all group cursor-default">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{typeInfo.icon}</span>
                    <span className="text-xs font-bold" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                </div>
                <VCT_Badge variant={statusInfo.variant}>{statusInfo.label}</VCT_Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-vct-text mb-1">
                <VCT_Icons.Clock size={12} className="text-vct-text-muted flex-shrink-0" />
                <span className="font-bold">{session.start_time} – {session.end_time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-vct-text-muted">
                <VCT_Icons.MapPin size={11} className="flex-shrink-0" />
                <span className="truncate">{session.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-vct-text-muted mt-0.5">
                <VCT_Icons.User size={11} className="flex-shrink-0" />
                <span>{session.coach}</span>
            </div>
        </div>
    )
}

/* ── Main Component ────────────────────────────────────────── */

export function Page_athlete_training() {
    const [weekOffset, setWeekOffset] = useState(0)

    // Fetch data — hardcoded athleteId for demo
    const { data: sessions, isLoading } = useApiQuery<TrainingSession[]>('/api/v1/training-sessions?athleteId=AP-001')
    const { data: stats } = useApiQuery<AttendanceStats>('/api/v1/training-sessions/stats?athleteId=AP-001')

    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

    // Group sessions by date
    const sessionsByDate = useMemo(() => {
        const map: Record<string, TrainingSession[]> = {}
        if (sessions) {
            for (const s of sessions) {
                if (!map[s.date]) map[s.date] = []
                map[s.date]!.push(s)
            }
        }
        return map
    }, [sessions])

    const weekLabel = useMemo(() => {
        if (weekDates.length < 2) return ''
        const start = weekDates[0]!
        const end = weekDates[6]!
        return `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
    }, [weekDates])

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ HEADER ══ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-vct-border">
                        <VCT_Icons.Calendar size={24} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-vct-text m-0">Lịch tập</h1>
                        <p className="text-sm text-vct-text-muted mt-0.5">Lịch tập luyện và điểm danh cá nhân</p>
                    </div>
                </div>
            </div>

            {/* ══ ATTENDANCE STATS ══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={<VCT_Icons.Calendar size={18} />} label="Tổng buổi" value={stats?.total_sessions ?? '—'} color="var(--vct-info)" />
                <StatCard icon={<VCT_Icons.CheckCircle size={18} />} label="Đã tham gia" value={stats?.attended ?? '—'} color="var(--vct-success)"
                    sub={stats ? `Tỷ lệ: ${Math.round(stats.attendance_rate)}%` : undefined} />
                <StatCard icon={<VCT_Icons.Activity size={18} />} label="Chuỗi liên tiếp" value={stats?.current_streak ?? '—'} color="var(--vct-info)"
                    sub="buổi liên tục" />
                <StatCard icon={<VCT_Icons.AlertCircle size={18} />} label="Vắng mặt" value={stats?.absent ?? '—'} color="var(--vct-danger)"
                    sub={stats?.cancelled ? `${stats.cancelled} hủy` : undefined} />
            </div>

            {/* ══ WEEKLY VOLUME CHART (SVG) ══ */}
            <VCT_SectionCard
                title="Khối lượng tập tuần"
                icon={<VCT_Icons.BarChart2 size={20} />}
                accentColor="var(--vct-accent-cyan)"
                className="border border-vct-border mb-6"
            >
                <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
                    {weekDates.map((date, idx) => {
                        const dateStr = formatDate(date)
                        const count = (sessionsByDate[dateStr] || []).length
                        const maxCount = Math.max(3, ...weekDates.map(d => (sessionsByDate[formatDate(d)] || []).length))
                        const h = count > 0 ? Math.max(12, (count / maxCount) * 80) : 4
                        const today = isToday(date)
                        return (
                            <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-vct-text">{count || ''}</span>
                                <div
                                    className="w-full rounded-lg transition-all duration-700 hover:opacity-80"
                                    style={{
                                        height: h,
                                        background: today ? 'var(--vct-accent-cyan)' : count > 0 ? 'var(--vct-info)' : 'var(--vct-border)',
                                        opacity: today ? 1 : 0.7,
                                    }}
                                />
                                <span className={`text-[9px] font-bold ${today ? 'text-cyan-500' : 'text-vct-text-muted'}`}>
                                    {WEEKDAYS[(idx + 1) % 7]}
                                </span>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-3 pt-3 border-t border-vct-border flex items-center justify-between text-xs">
                    <span className="text-vct-text-muted">
                        Tổng tuần: <strong className="text-vct-text">
                            {weekDates.reduce((sum, d) => sum + (sessionsByDate[formatDate(d)] || []).length, 0)}
                        </strong> buổi
                    </span>
                    <span className="text-vct-text-muted">
                        {stats?.current_streak ? `🔥 Chuỗi ${stats.current_streak} buổi liên tiếp` : ''}
                    </span>
                </div>
            </VCT_SectionCard>

            {/* ══ LOG SESSION QUICK-ADD ══ */}
            <VCT_SectionCard
                title="Ghi nhận buổi tập"
                icon={<VCT_Icons.Plus size={20} />}
                accentColor="var(--vct-success)"
                className="border border-vct-border mb-6"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        const fd = new FormData(e.target as HTMLFormElement)
                        const data = {
                            type: fd.get('type') as string,
                            date: fd.get('date') as string,
                            start_time: fd.get('start_time') as string,
                            athlete_id: 'AP-001',
                            status: 'completed',
                        }
                        try {
                            await fetch('/api/v1/training-sessions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            })
                            ;(e.target as HTMLFormElement).reset()
                        } catch { /* graceful fail */ }
                    }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                >
                    <div>
                        <label className="text-[10px] font-bold text-vct-text-muted mb-1 block uppercase tracking-wider">Loại</label>
                        <select name="type" className="w-full rounded-xl border border-vct-border bg-vct-bg px-3 py-2 text-sm font-medium text-vct-text outline-none focus:border-vct-accent">
                            <option value="regular">Thường</option>
                            <option value="sparring">Đối kháng</option>
                            <option value="exam">Thi đấu</option>
                            <option value="special">Đặc biệt</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-vct-text-muted mb-1 block uppercase tracking-wider">Ngày</label>
                        <input name="date" type="date" defaultValue={formatDate(new Date())} className="w-full rounded-xl border border-vct-border bg-vct-bg px-3 py-2 text-sm font-medium text-vct-text outline-none focus:border-vct-accent" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-vct-text-muted mb-1 block uppercase tracking-wider">Thời gian</label>
                        <input name="start_time" type="time" defaultValue="17:00" className="w-full rounded-xl border border-vct-border bg-vct-bg px-3 py-2 text-sm font-medium text-vct-text outline-none focus:border-vct-accent" />
                    </div>
                    <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-600 transition shadow-sm">
                        <VCT_Icons.Check size={16} /> Ghi nhận
                    </button>
                </form>
            </VCT_SectionCard>

            {/* ══ WEEKLY SCHEDULE ══ */}
            <VCT_SectionCard
                title="Lịch tập tuần"
                icon={<VCT_Icons.Calendar size={20} />}
                accentColor="var(--vct-success)"
                className="border border-vct-border mb-6"
            >
                {/* Week navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setWeekOffset(o => o - 1)}
                        className="p-2 rounded-lg hover:bg-vct-bg transition-colors text-vct-text-muted hover:text-vct-text">
                        <VCT_Icons.Chevron size={16} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                    <div className="text-center">
                        <span className="text-sm font-bold text-vct-text">{weekLabel}</span>
                        {weekOffset !== 0 && (
                            <button onClick={() => setWeekOffset(0)} className="ml-2 text-xs text-vct-accent font-bold hover:underline">
                                Hôm nay
                            </button>
                        )}
                    </div>
                    <button onClick={() => setWeekOffset(o => o + 1)}
                        className="p-2 rounded-lg hover:bg-vct-bg transition-colors text-vct-text-muted hover:text-vct-text">
                        <VCT_Icons.Chevron size={16} style={{ transform: 'rotate(-90deg)' }} />
                    </button>
                </div>

                {/* Week grid */}
                {isLoading ? (
                    <div className="grid grid-cols-7 gap-2 animate-pulse">
                        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-32 bg-vct-bg rounded-xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {weekDates.map((date, idx) => {
                            const dateStr = formatDate(date)
                            const daySessions = sessionsByDate[dateStr] || []
                            const today = isToday(date)
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                            return (
                                <div key={dateStr} className={`rounded-xl border p-2 min-h-[120px] transition-all ${today
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : isPast ? 'border-vct-border/50 bg-vct-bg/50 opacity-70' : 'border-vct-border bg-vct-bg'
                                    }`}>
                                    {/* Day header */}
                                    <div className="text-center mb-2">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${today ? 'text-emerald-500' : 'text-vct-text-muted'}`}>
                                            {WEEKDAYS[(idx + 1) % 7]}
                                        </div>
                                        <div className={`text-sm font-black ${today ? 'text-emerald-500' : 'text-vct-text'}`}>
                                            {date.getDate()}
                                        </div>
                                    </div>

                                    {/* Sessions */}
                                    {daySessions.length === 0 ? (
                                        <div className="text-center text-[10px] text-vct-text-muted mt-4">Nghỉ</div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {daySessions.map(s => {
                                                const t = (SESSION_TYPE_LABELS[s.type] || SESSION_TYPE_LABELS.regular)!
                                                const st = (STATUS_CONFIG[s.status] || STATUS_CONFIG.scheduled)!
                                                return (
                                                    <div key={s.id} className="p-1.5 rounded-lg text-[10px] border transition-all hover:scale-[1.02]"
                                                        style={{ borderColor: `${t.color}30`, background: `${t.color}08` }}>
                                                        <div className="font-bold" style={{ color: t.color }}>{s.start_time}</div>
                                                        <div className="text-vct-text-muted truncate">{s.location.split(' - ')[1] || s.location}</div>
                                                        <div className={`mt-0.5 font-bold ${st.variant === 'success' ? 'text-emerald-500' : st.variant === 'danger' ? 'text-red-500' : 'text-vct-text-muted'}`}>
                                                            {st.label}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </VCT_SectionCard>

            {/* ══ UPCOMING SESSIONS (detail cards) ══ */}
            <VCT_SectionCard
                title="Các buổi tập sắp tới"
                icon={<VCT_Icons.Clock size={20} />}
                accentColor="var(--vct-info)"
                className="border border-vct-border mb-6"
            >
                {(() => {
                    const upcoming = sessions?.filter(s => s.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)) || []
                    if (upcoming.length === 0) {
                        return <VCT_EmptyState icon={<VCT_Icons.Calendar size={40} />} title="Không có buổi tập sắp tới" description="Lịch tập mới sẽ hiển thị tại đây khi được tạo." />
                    }
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {upcoming.map(s => <SessionCard key={s.id} session={s} />)}
                        </div>
                    )
                })()}
            </VCT_SectionCard>

            {/* ══ TRAINING TYPE BREAKDOWN ══ */}
            {stats?.by_type && Object.keys(stats.by_type).length > 0 && (
                <VCT_SectionCard
                    title="Phân loại buổi tập"
                    icon={<VCT_Icons.BarChart2 size={20} />}
                    accentColor="var(--vct-info)"
                    className="border border-vct-border"
                >
                    <div className="space-y-3">
                        {Object.entries(stats.by_type).map(([type, count]) => {
                            const info = (SESSION_TYPE_LABELS[type] || SESSION_TYPE_LABELS.regular)!
                            const pct = stats.total_sessions > 0 ? (count / stats.total_sessions) * 100 : 0
                            return (
                                <div key={type} className="flex items-center gap-3">
                                    <span className="text-sm w-6">{info.icon}</span>
                                    <span className="text-xs font-bold w-20" style={{ color: info.color }}>{info.label}</span>
                                    <div className="flex-1 h-3 bg-vct-bg rounded-full border border-vct-border overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: info.color }}></div>
                                    </div>
                                    <span className="text-sm font-black w-8 text-right text-vct-text">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </VCT_SectionCard>
            )}
        </VCT_PageContainer>
    )
}
