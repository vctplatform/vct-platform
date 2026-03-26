'use client'
import React, { useState, useCallback } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_Image } from '@vct/ui'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_StatRow, VCT_Badge } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile, ClubMembership, TournamentEntry } from '@vct/shared-types'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE PORTAL (Enhanced)
// Skill stats, belt timeline, personal goals, notifications
// ═══════════════════════════════════════════════════════════════

/* ── Skill Bar Visual Component ────────────────────────────── */

function SkillBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
    const pct = Math.min((value / max) * 100, 100)
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-vct-text-muted w-20 text-right">{label}</span>
            <div className="flex-1 h-2.5 bg-vct-bg rounded-full border border-vct-border overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }}></div>
            </div>
            <span className="text-xs font-bold w-8" style={{ color }}>{value}</span>
        </div>
    )
}

/* ── Belt Timeline — derived from profile ─────────────────── */

const BELT_COLOR_MAP: Record<string, string> = {
    'Trắng đai': 'var(--vct-border-subtle)',
    'Lam đai 1': 'var(--vct-info)', 'Lam đai 2': 'var(--vct-info)', 'Lam đai 3': 'var(--vct-info)',
    'Hoàng đai 1': 'var(--vct-warning)', 'Hoàng đai 2': 'var(--vct-warning)', 'Hoàng đai 3': 'var(--vct-warning)',
    'Hồng đai 1': 'var(--vct-danger)', 'Hồng đai 2': 'var(--vct-danger)', 'Hồng đai 3': 'var(--vct-danger)',
}

function deriveBeltHistory(profile: AthleteProfile | null) {
    if (profile?.belt_history && Array.isArray(profile.belt_history) && profile.belt_history.length > 0) {
        return profile.belt_history.map((b: { belt: string; date: string }) => ({
            belt: b.belt,
            date: b.date,
            color: BELT_COLOR_MAP[b.belt] || 'var(--vct-text-tertiary)',
        }))
    }
    // Fallback: single entry from current belt
    if (profile?.belt_label) {
        return [{ belt: profile.belt_label, date: '—', color: BELT_COLOR_MAP[profile.belt_label] || 'var(--vct-warning)' }]
    }
    return []
}

/* ── Goals — derived from profile ─────────────────────────── */

function deriveGoals(profile: AthleteProfile | null) {
    if (profile?.goals && Array.isArray(profile.goals) && profile.goals.length > 0) {
        const iconMap: Record<string, React.ReactNode> = {
            belt: <VCT_Icons.Award size={16} />,
            tournament: <VCT_Icons.Trophy size={16} />,
            training: <VCT_Icons.Activity size={16} />,
        }
        const colorMap: Record<string, string> = {
            belt: 'var(--vct-danger)', tournament: 'var(--vct-info)', training: 'var(--vct-success)',
        }
        return profile.goals.map((g: { id: number; title: string; progress: number; type?: string }, idx: number) => ({
            id: g.id || idx + 1,
            title: g.title,
            progress: g.progress,
            icon: iconMap[g.type || 'training'] || <VCT_Icons.Target size={16} />,
            color: colorMap[g.type || 'training'] || 'var(--vct-info)',
        }))
    }
    // Fallback: derive from profile stats
    const goals: Array<{ id: number; title: string; progress: number; icon: React.ReactNode; color: string }> = []
    if (profile) {
        goals.push({
            id: 1, title: 'Nâng đẳng cấp đai', progress: Math.min(((profile.elo_rating || 0) / 2000) * 100, 95),
            icon: <VCT_Icons.Award size={16} />, color: 'var(--vct-danger)',
        })
        goals.push({
            id: 2, title: `Thi đấu nhiều giải hơn`, progress: Math.min(((profile.total_tournaments || 0) / 10) * 100, 100),
            icon: <VCT_Icons.Trophy size={16} />, color: 'var(--vct-info)',
        })
        goals.push({
            id: 3, title: 'Duy trì tập luyện đều đặn', progress: 75,
            icon: <VCT_Icons.Activity size={16} />, color: 'var(--vct-success)',
        })
    }
    return goals
}

/* ── Skill Stats — derived from profile ───────────────────── */

function deriveSkillStats(profile: AthleteProfile | null) {
    if (profile?.skill_stats && Array.isArray(profile.skill_stats) && profile.skill_stats.length > 0) {
        return profile.skill_stats
    }
    // Fallback: derive from ELO and medals
    const elo = profile?.elo_rating || 1000
    const base = Math.min(Math.round((elo / 2500) * 100), 95)
    return [
        { label: 'Kỹ thuật', value: Math.min(base + 5, 100), color: 'var(--vct-info)' },
        { label: 'Thể lực', value: Math.min(base - 8, 100), color: 'var(--vct-success)' },
        { label: 'Tốc độ', value: Math.min(base - 2, 100), color: 'var(--vct-warning)' },
        { label: 'Sức mạnh', value: Math.min(base - 12, 100), color: 'var(--vct-danger)' },
        { label: 'Phản xạ', value: Math.min(base + 10, 100), color: 'var(--vct-info)' },
        { label: 'Tinh thần', value: Math.min(base + 8, 100), color: 'var(--vct-accent-cyan)' },
    ]
}

/* ── Edit Profile Modal ─────────────────────────────────────── */

function EditProfileModal({ profile, onClose, onSave }: {
    profile: AthleteProfile
    onClose: () => void
    onSave: (updates: Record<string, unknown>) => Promise<void>
}) {
    const [form, setForm] = useState({
        full_name: profile.full_name || '',
        phone: (profile as unknown as Record<string, string>).phone || '',
        weight: (profile as unknown as Record<string, string>).weight || '',
        height: (profile as unknown as Record<string, string>).height || '',
    })
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setFeedback(null)
        try {
            await onSave(form)
            setFeedback({ type: 'ok', msg: 'Cập nhật thành công!' })
            setTimeout(onClose, 800)
        } catch (err: unknown) {
            setFeedback({ type: 'err', msg: err instanceof Error ? err.message : 'Lỗi cập nhật' })
        } finally { setSaving(false) }
    }

    const inputCls = 'w-full rounded-xl border border-vct-border bg-vct-bg px-4 py-2.5 text-sm font-medium text-vct-text outline-none focus:border-vct-accent transition'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in" onClick={onClose}>
            <div className="w-full max-w-md rounded-3xl border border-vct-border bg-vct-elevated p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-vct-text">Chỉnh sửa hồ sơ</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-vct-bg transition"><VCT_Icons.X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-vct-text-muted mb-1 block">Họ và tên</label>
                        <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-vct-text-muted mb-1 block">Cân nặng (kg)</label>
                            <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-vct-text-muted mb-1 block">Chiều cao (cm)</label>
                            <input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-vct-text-muted mb-1 block">Số điện thoại</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                    </div>

                    {feedback && (
                        <div className={`text-sm font-bold px-4 py-2 rounded-xl ${feedback.type === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {feedback.msg}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-vct-border text-sm font-bold hover:bg-vct-bg transition">Hủy</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-vct-accent text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50">
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function Page_athlete_portal() {
    const router = useRouter()
    const [showEditModal, setShowEditModal] = useState(false)

    // Fetch profile
    const { data: profile, isLoading: isProfileLoading } = useApiQuery<AthleteProfile>(
        '/api/v1/athlete-profiles/me'
    )

    // Fetch recent tournaments (limit 3 on portal)
    const { data: tournaments, isLoading: isTournamentsLoading } = useApiQuery<TournamentEntry[]>(
        profile ? `/api/v1/tournament-entries?athleteId=${profile.id}` : ''
    )

    // Fetch clubs
    const { data: clubs, isLoading: isClubsLoading } = useApiQuery<ClubMembership[]>(
        profile ? `/api/v1/club-memberships?athleteId=${profile.id}` : ''
    )

    if (isProfileLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                {/* Skeleton Header */}
                <div className="mb-8 p-6 rounded-3xl border border-vct-border bg-vct-elevated shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start animate-pulse">
                    <div className="h-24 w-24 rounded-2xl bg-vct-border" />
                    <div className="flex-1 space-y-3 w-full">
                        <div className="h-8 bg-vct-border rounded-lg w-1/3"></div>
                        <div className="h-4 bg-vct-border rounded-lg w-1/2"></div>
                    </div>
                    <div className="h-10 bg-vct-border rounded-xl w-32"></div>
                </div>
                {/* Skeleton Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6 animate-pulse">
                        <div className="h-[300px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    </div>
                    <div className="space-y-6 animate-pulse">
                        <div className="h-24 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                        <div className="h-[250px] bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    </div>
                </div>
            </VCT_PageContainer>
        )
    }

    if (!profile) {
        return (
            <VCT_PageContainer>
                <VCT_EmptyState
                    icon={<VCT_Icons.User size={48} />}
                    title="Chưa có hồ sơ Vận động viên"
                    description="Tài khoản của bạn chưa được liên kết với hồ sơ VĐV nào. Vui lòng liên hệ CLB hoặc tạo hồ sơ mới."
                />
            </VCT_PageContainer>
        )
    }

    const activeClubs = clubs?.filter(c => c.status === 'active') || []
    const upcomingTournaments = tournaments?.filter(t => t.status !== 'bi_tu_choi') || []

    // Derived data from profile
    const skillStats = deriveSkillStats(profile)
    const beltHistory = deriveBeltHistory(profile)
    const goals: { id: number; title: string; progress: number; icon: React.ReactNode; color: string }[] = deriveGoals(profile)

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ NOTIFICATION BANNER ══ */}
            {upcomingTournaments.length > 0 && upcomingTournaments.some(t => t.status === 'thieu_ho_so') && (
                <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-4 animate-in">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0">
                        <VCT_Icons.AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-sm text-amber-400">Hồ sơ chưa đầy đủ!</div>
                        <div className="text-xs text-amber-400/70 mt-0.5">
                            Bạn có {upcomingTournaments.filter(t => t.status === 'thieu_ho_so').length} giải đấu cần bổ sung hồ sơ.
                        </div>
                    </div>
                    <button onClick={() => router.push('/athlete-portal/tournaments')}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm flex-shrink-0">
                        Xem ngay
                    </button>
                </div>
            )}

            {/* ══ HERO PROFILE SECTION ══ */}
            <div className="relative mb-8 p-8 rounded-3xl border border-vct-border bg-vct-elevated shadow-sm overflow-hidden group hover:border-vct-accent/30 transition-colors duration-500">
                {/* Background decorative blob */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-vct-accent opacity-5 rounded-full blur-3xl pointer-events-none group-hover:opacity-10 transition-opacity duration-700"></div>

                <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start z-10">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-5xl border border-vct-border-strong shadow-inner overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                        {profile.photo_url ? <VCT_Image src={profile.photo_url} className="w-full h-full" fill objectFit="cover" alt="avatar" sizes="96px" /> : '🥋'}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <h1 className="text-3xl font-black text-vct-text m-0">{profile?.full_name}</h1>
                            {profile.status === 'active' && <VCT_Icons.CheckCircle size={20} className="text-emerald-500" />}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-vct-text-muted mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold whitespace-nowrap">
                                <VCT_Icons.Award size={14} /> {profile?.belt_label}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vct-bg border border-vct-border whitespace-nowrap">
                                <VCT_Icons.Building size={14} /> {activeClubs.length > 0 ? activeClubs[0]?.club_name : 'Tự do'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--vct-info)/10 text-(--vct-info) border border-(--vct-info)/20 font-bold whitespace-nowrap">
                                <VCT_Icons.TrendingUp size={14} /> Elo: {profile.elo_rating}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-vct-accent text-white px-5 py-2.5 font-bold transition hover:opacity-90 shadow-sm"
                        >
                            <VCT_Icons.Edit size={16} /> Chỉnh sửa
                        </button>
                        <button
                            onClick={() => router.push('/athlete-portal/profile')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-vct-bg border border-vct-border px-5 py-2.5 font-bold text-vct-text transition hover:bg-vct-input hover:border-vct-border-strong"
                        >
                            <VCT_Icons.Eye size={16} /> Hồ sơ chi tiết
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* ══ SKILL STATS ══ */}
                    <VCT_SectionCard
                        title="Chỉ số Kỹ năng"
                        icon={<VCT_Icons.Activity size={20} />}
                        accentColor="var(--vct-info)"
                        className="border border-vct-border"
                    >
                        <div className="space-y-3 py-2">
                            {skillStats.map(s => (
                                <SkillBar key={s.label} label={s.label} value={s.value} color={s.color} />
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-vct-border flex items-center justify-between">
                            <span className="text-xs text-vct-text-muted">Điểm trung bình: <strong className="text-vct-text">{skillStats.length > 0 ? Math.round(skillStats.reduce((a, s) => a + s.value, 0) / skillStats.length) : 0}</strong>/100</span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-(--vct-info)/10 text-(--vct-info) font-bold border border-(--vct-info)/20">
                                {skillStats.length > 0 && skillStats.reduce((a, s) => a + s.value, 0) / skillStats.length >= 80 ? '⭐ Xuất sắc' : skillStats.length > 0 && skillStats.reduce((a, s) => a + s.value, 0) / skillStats.length >= 60 ? '💪 Tốt' : '📈 Đang phát triển'}
                            </span>
                        </div>
                    </VCT_SectionCard>

                    {/* ══ TOURNAMENTS SECTION ══ */}
                    <VCT_SectionCard
                        title="Giải đấu sắp tới & Gần đây"
                        icon={<VCT_Icons.Trophy size={20} />}
                        accentColor="var(--vct-info)"
                        headerAction={
                            <button onClick={() => router.push('/athlete-portal/tournaments')} className="text-xs text-(--vct-info) font-bold hover:underline">
                                Xem tất cả →
                            </button>
                        }
                        className="border border-vct-border"
                    >
                        {isTournamentsLoading ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-4 animate-pulse">
                                <div className="h-10 w-full bg-vct-bg rounded-xl"></div>
                                <div className="h-10 w-full bg-vct-bg rounded-xl"></div>
                                <div className="h-10 w-full bg-vct-bg rounded-xl"></div>
                            </div>
                        ) : !tournaments || tournaments.length === 0 ? (
                            <div className="py-8">
                                <VCT_EmptyState icon={<VCT_Icons.Calendar size={48} />} title="Chưa tham gia giải đấu" description="Bạn chưa có giải đấu nào trong thời gian gần đây." />
                            </div>
                        ) : (
                            <div className="divide-y divide-vct-border/50">
                                {tournaments.slice(0, 3).map((entry, idx) => (
                                    <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 group px-2 hover:bg-vct-bg/50 rounded-xl transition-colors -mx-2">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-vct-border flex items-center justify-center text-vct-text-muted group-hover:bg-(--vct-info)/10 group-hover:text-(--vct-info) transition-colors font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-vct-text group-hover:text-(--vct-info) transition-colors">{entry.tournament_name}</h4>
                                                <div className="text-xs text-vct-text-muted mt-1.5 flex flex-wrap gap-2">
                                                    {entry.categories?.map((c, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-vct-bg border border-vct-border">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sm:text-right self-start sm:self-center ml-14 sm:ml-0">
                                            <VCT_Badge variant={entry.status === 'du_dieu_kien' ? 'success' : entry.status === 'thieu_ho_so' ? 'warning' : 'neutral'}>
                                                {entry.status === 'du_dieu_kien' ? 'Hợp lệ' : entry.status === 'thieu_ho_so' ? 'Thiếu HS' : entry.status}
                                            </VCT_Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </VCT_SectionCard>
                </div>

                <div className="space-y-6">
                    {/* ══ QUICK STATS ══ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-(--vct-info)/10 to-(--vct-info)/10 border border-(--vct-info)/20 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                            <VCT_Icons.Trophy size={24} className="text-(--vct-info) mb-2 group-hover:scale-110 transition-transform" />
                            <div className="text-2xl font-black text-vct-text">{profile.total_tournaments}</div>
                            <div className="text-xs font-medium text-vct-text-muted mt-1 uppercase tracking-wider">Giải đấu</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                            <VCT_Icons.Award size={24} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="text-2xl font-black text-vct-text">{profile.total_medals}</div>
                            <div className="text-xs font-medium text-vct-text-muted mt-1 uppercase tracking-wider">Huy chương</div>
                        </div>
                    </div>

                    {/* ══ PERSONAL GOALS ══ */}
                    <VCT_SectionCard
                        title="Mục tiêu cá nhân"
                        icon={<VCT_Icons.Target size={18} />}
                        accentColor="var(--vct-danger)"
                        className="border border-vct-border"
                    >
                        <div className="space-y-4">
                            {goals.map(goal => (
                                <div key={goal.id} className="group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                                            style={{ background: `${goal.color}15`, color: goal.color }}>
                                            {goal.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-vct-text truncate">{goal.title}</div>
                                        </div>
                                        <span className="text-xs font-bold" style={{ color: goal.color }}>{goal.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-vct-bg rounded-full border border-vct-border overflow-hidden ml-11">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${goal.progress}%`, background: goal.color }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>

                    {/* ══ BELT TIMELINE ══ */}
                    <VCT_SectionCard
                        title="Hành trình Thăng đai"
                        icon={<VCT_Icons.Award size={18} />}
                        accentColor="var(--vct-warning)"
                        className="border border-vct-border"
                    >
                        <div className="relative pl-6">
                            {/* Vertical line */}
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-(--vct-border-subtle) via-(--vct-warning) to-(--vct-warning) rounded-full"></div>

                            <div className="space-y-4">
                                {beltHistory.map((b, i) => (
                                    <div key={i} className="relative flex items-center gap-3">
                                        {/* Dot */}
                                        <div className="absolute -left-6 w-3.5 h-3.5 rounded-full border-2 border-vct-elevated z-10 flex-shrink-0"
                                            style={{ background: b.color }}></div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-xs font-bold text-vct-text">{b.belt}</span>
                                            <span className="text-[10px] font-mono text-vct-text-muted">{b.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </VCT_SectionCard>

                    {/* ══ CLUBS SECTION ══ */}
                    <VCT_SectionCard
                        title="Đơn vị trực thuộc"
                        icon={<VCT_Icons.Building size={18} />}
                        accentColor="var(--vct-info)"
                        headerAction={<button onClick={() => router.push('/athlete-portal/clubs')} className="p-2 -mr-2 text-vct-text-muted hover:bg-vct-bg rounded-lg transition-colors"><VCT_Icons.Settings size={16} /></button>}
                        className="border border-vct-border"
                    >
                        {isClubsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-16 bg-vct-bg rounded-xl"></div>
                            </div>
                        ) : activeClubs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-vct-text-muted bg-vct-bg rounded-xl border border-dashed border-vct-border">
                                Tự do (Chưa có CLB)
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeClubs.map(c => (
                                    <div key={c.id} className="p-4 rounded-xl border border-vct-border bg-vct-bg hover:border-(--vct-info)/30 transition-colors flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-(--vct-info)/10 flex items-center justify-center text-(--vct-info)">
                                            <VCT_Icons.Building size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-vct-text">{c.club_name}</div>
                                            <div className="text-xs text-vct-text-muted mt-0.5 inline-flex items-center gap-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${c.role === 'captain' ? 'bg-amber-500' : 'bg-(--vct-info)'}`}></div>
                                                {c.role === 'captain' ? 'Đội trưởng' : 'Thành viên'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => router.push('/athlete-portal/clubs')}
                            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-vct-border text-sm font-bold text-vct-text-muted hover:text-vct-text hover:border-vct-border-strong hover:bg-vct-bg transition-all flex items-center justify-center gap-2"
                        >
                            <VCT_Icons.Plus size={16} /> Quản lý tham gia CLB
                        </button>
                    </VCT_SectionCard>
                </div>
            </div>
            {/* ══ EDIT MODAL ══ */}
            {showEditModal && profile && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSave={async (updates) => {
                        const res = await fetch(`/api/v1/athlete-profiles/${profile.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updates),
                        })
                        if (!res.ok) throw new Error(`HTTP ${res.status}`)
                    }}
                />
            )}
        </VCT_PageContainer>
    )
}
