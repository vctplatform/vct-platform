'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_AvatarLetter, VCT_Badge } from '../components/vct-ui-data-display'
import { VCT_Button } from '../components/vct-ui-layout'
import { VCT_SectionCard } from '../components/VCT_SectionCard'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Timeline } from '../components/VCT_Timeline'
import type { TimelineEvent } from '../components/VCT_Timeline'
import { VCT_ConfirmDialog } from '../components/vct-ui'
import { VCT_StatRow } from '../components/VCT_StatRow'
import { ROLE_COLORS, STATUS_MAP, getRoleLabel, type SystemUser } from './admin-users.data'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { AdminGuard } from './components/AdminGuard'


interface PageAdminUserDetailProps {
    userId: string
}

interface DetailItemProps {
    icon: React.ReactNode
    label: string
    value: string
}

const ROLE_RESPONSIBILITIES: Record<string, string[]> = {
    SYSTEM_ADMIN: ['Điều phối toàn bộ tenant và phân quyền hệ thống', 'Giám sát audit log, integrity và release gate', 'Phê duyệt các thay đổi cấu hình có ảnh hưởng toàn nền tảng'],
    FEDERATION_ADMIN: ['Quản trị dữ liệu liên đoàn và giải đấu thuộc phạm vi', 'Duyệt hồ sơ thành viên, HLV, trọng tài', 'Theo dõi ngân sách, tài liệu và truyền thông liên đoàn'],
    CLUB_MANAGER: ['Quản lý nhân sự, VĐV và lịch đào tạo của CLB', 'Kiểm soát hồ sơ đăng ký thi đấu và lệ phí', 'Báo cáo tình hình hoạt động với liên đoàn'],
    REFEREE: ['Chấm điểm và xác nhận biên bản thi đấu', 'Kiểm tra lịch phân công trọng tài', 'Theo dõi khiếu nại và quyết định chuyên môn'],
    COACH: ['Theo dõi giáo án, tiến độ VĐV và thăng đai', 'Chuẩn bị danh sách đăng ký thi đấu', 'Đồng bộ nội dung e-learning và kiểm tra thể lực'],
    ATHLETE: ['Cập nhật hồ sơ cá nhân và thành tích', 'Theo dõi lịch thi đấu, tập luyện, cân ký', 'Nhận thông báo từ CLB và ban tổ chức'],
    VIEWER: ['Theo dõi báo cáo và thông báo được cấp quyền', 'Truy cập ở chế độ chỉ đọc', 'Không được thay đổi dữ liệu nghiệp vụ'],
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
    SYSTEM_ADMIN: ['admin.users.manage', 'admin.roles.assign', 'system.integrity.review', 'audit.logs.export'],
    FEDERATION_ADMIN: ['federation.members.approve', 'tournament.plan.manage', 'finance.invoice.review', 'community.events.publish'],
    CLUB_MANAGER: ['club.athletes.manage', 'training.schedule.manage', 'finance.invoice.track', 'documents.submit'],
    REFEREE: ['match.score.write', 'match.appeal.review', 'schedule.assignment.read'],
    COACH: ['athlete.progress.update', 'training.plan.manage', 'belt.exam.submit'],
    ATHLETE: ['profile.self.update', 'training.schedule.read', 'competition.registration.track'],
    VIEWER: ['dashboard.read', 'notifications.read'],
}

const buildTimelineEvents = (user: SystemUser): TimelineEvent[] => [
    {
        time: user.last_login === '—' ? 'N/A' : user.last_login,
        title: `Đăng nhập gần nhất từ ${user.email}`,
        description: user.status === 'locked' ? 'IP: 45.67.89.12 — Bị chặn sau 5 lần thất bại' : 'IP: 192.168.1.100 — Chrome 120.0',
        icon: <VCT_Icons.Clock size={14} />,
        color: user.status === 'locked' ? '#ef4444' : '#0ea5e9',
    },
    {
        time: '09/03/2024 16:20',
        title: `Cập nhật phạm vi: ${user.scope}`,
        description: 'admin@vct.vn đã thay đổi',
        icon: <VCT_Icons.Shield size={14} />,
        color: '#8b5cf6',
    },
    {
        time: '07/03/2024 11:05',
        title: `Đồng bộ vai trò ${getRoleLabel(user.role)}`,
        description: 'Hệ thống tự động áp dụng role mới',
        icon: <VCT_Icons.CheckCircle size={14} />,
        color: '#10b981',
    },
    {
        time: '05/03/2024 09:00',
        title: 'Thay đổi mật khẩu',
        description: 'Tự thay đổi qua portal',
        icon: <VCT_Icons.Lock size={14} />,
        color: '#f59e0b',
    },
    {
        time: user.created_at,
        title: 'Tạo tài khoản',
        description: 'Onboard vào hệ thống VCT Platform',
        icon: <VCT_Icons.Plus size={14} />,
        color: '#10b981',
    },
]

// ════════════════════════════════════════
// SKELETON COMPONENTS
// ════════════════════════════════════════
const SkeletonHero = () => (
    <section className="relative mb-8 overflow-hidden rounded-[28px] border border-(--vct-border-subtle) p-6 bg-(--vct-bg-elevated) tablet:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center">
                <div className="w-[88px] h-[88px] rounded-full bg-(--vct-bg-card) animate-pulse" />
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="h-5 w-20 bg-(--vct-bg-card) rounded-full animate-pulse" />
                        <div className="h-5 w-16 bg-(--vct-bg-card) rounded-full animate-pulse" />
                        <div className="h-5 w-24 bg-(--vct-bg-card) rounded-full animate-pulse" />
                    </div>
                    <div className="h-9 w-64 bg-(--vct-bg-card) rounded animate-pulse" />
                    <div className="h-4 w-96 bg-(--vct-bg-card) rounded animate-pulse" />
                    <div className="flex gap-4">
                        <div className="h-4 w-40 bg-(--vct-bg-card) rounded animate-pulse" />
                        <div className="h-4 w-32 bg-(--vct-bg-card) rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    </section>
)

const SkeletonSectionCard = ({ rows = 3 }: { rows?: number }) => (
    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
        <div className="h-5 w-40 bg-(--vct-bg-card) rounded animate-pulse mb-4" />
        <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="h-16 bg-(--vct-bg-card) rounded-xl animate-pulse" />
            ))}
        </div>
    </div>
)

const DetailItem = ({ icon, label, value }: DetailItemProps) => (
    <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
            <span className="text-vct-accent">{icon}</span>
            {label}
        </div>
        <div className="text-sm font-semibold text-vct-text">{value}</div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_user_detail = ({ userId }: PageAdminUserDetailProps) => (
    <AdminGuard>
        <Page_admin_user_detail_Content userId={userId} />
    </AdminGuard>
)

const Page_admin_user_detail_Content = ({ userId }: PageAdminUserDetailProps) => {
    const router = useRouter()
    const { data: fetchedUser, isLoading } = useAdminFetch<SystemUser>(`/admin/users/${userId}`)
    const [confirmLock, setConfirmLock] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const { showToast } = useShellToast()

    const user = fetchedUser ?? null

    if (!user) {
        return (
            <AdminPageShell
                title="Không tìm thấy tài khoản"
                subtitle={`Mã người dùng \`${userId}\` không tồn tại`}
                icon={<VCT_Icons.AlertCircle size={28} className="text-amber-500" />}
            >
                <div className="mx-auto max-w-3xl rounded-[28px] border border-vct-border bg-vct-elevated p-8 text-center shadow-(--vct-shadow-md)">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                        <VCT_Icons.AlertCircle size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-vct-text">Không tìm thấy tài khoản</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-vct-text-secondary">
                        Mã người dùng `{userId}` không tồn tại trong bộ dữ liệu quản trị hiện tại.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <VCT_Button variant="outline" icon={<VCT_Icons.ChevronLeft size={16} />} onClick={() => router.push('/admin/users')}>
                            Quay lại danh sách
                        </VCT_Button>
                    </div>
                </div>
            </AdminPageShell>
        )
    }

    const accentColor = ROLE_COLORS[user.role] ?? '#0ea5e9'
    const statusMeta = STATUS_MAP[user.status]
    const roleLabel = getRoleLabel(user.role)
    const timelineEvents = buildTimelineEvents(user)
    const responsibilities = ROLE_RESPONSIBILITIES[user.role] ?? []
    const permissions = ROLE_PERMISSIONS[user.role] ?? []
    const statItems: StatItem[] = [
        { label: 'Trạng thái', value: statusMeta.label, icon: user.status === 'active' ? <VCT_Icons.CheckCircle size={16} /> : <VCT_Icons.AlertCircle size={16} />, color: user.status === 'active' ? '#10b981' : '#ef4444' },
        { label: 'Phiên cuối', value: user.last_login, icon: <VCT_Icons.Clock size={16} />, color: '#f59e0b' },
        { label: 'Phạm vi', value: user.scope, icon: <VCT_Icons.Building2 size={16} />, color: accentColor },
        { label: 'Ngày tạo', value: user.created_at, icon: <VCT_Icons.Calendar size={16} />, color: '#8b5cf6' },
    ]

    const handleCopyId = () => {
        navigator.clipboard?.writeText(user.id)
        showToast(`Đã copy User ID: ${user.id}`)
    }

    return (
        <AdminPageShell
            title={user.name}
            subtitle={`${roleLabel} • ${user.scope}`}
            icon={<VCT_Icons.User size={28} className="admin-metric-value" style={{ '--_metric-color': accentColor } as React.CSSProperties} />}
            stats={statItems}
            actions={
                <VCT_Button variant="outline" icon={<VCT_Icons.ChevronLeft size={16} />} onClick={() => router.push('/admin/users')}>
                    Quay lại danh sách
                </VCT_Button>
            }
        >

            {isLoading ? (
                <>
                    <SkeletonHero />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-(--vct-bg-elevated) rounded-2xl animate-pulse" />)}
                    </div>
                    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                        <div className="grid gap-6">
                            <SkeletonSectionCard rows={3} />
                            <SkeletonSectionCard rows={3} />
                        </div>
                        <div className="grid gap-6">
                            <SkeletonSectionCard rows={3} />
                            <SkeletonSectionCard rows={2} />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* ── HERO SECTION ── */}
                    <section
                        className="admin-hero-card relative mb-8 overflow-hidden rounded-[28px] border border-vct-border p-6 shadow-(--vct-shadow-md) tablet:p-8"
                        {...{ style: { '--_hero-accent': accentColor } as React.CSSProperties }}
                    >
                        <div className="admin-hero-glow" />
                        <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />

                        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                            <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center">
                                <VCT_AvatarLetter name={user.name} size={88} className="ring-4 ring-white/10 shadow-[0_18px_40px_rgba(15,23,42,0.35)]" color={accentColor} />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                                        <button onClick={handleCopyId} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 hover:bg-white/10 transition-colors cursor-pointer" title="Click để copy">
                                            {user.id}
                                        </button>
                                        <VCT_Badge text={statusMeta.label} type={statusMeta.type} pulse={false} />
                                        <span className="admin-accent-badge" {...{ style: { '--_accent-color': accentColor } as React.CSSProperties }}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white tablet:text-4xl">{user.name}</h1>
                                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
                                        Hồ sơ điều hành cho tài khoản {user.email}. Trang này gom thông tin định danh, phạm vi vận hành, tín hiệu bảo mật và các hoạt động gần nhất.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                                        <span className="inline-flex items-center gap-2"><VCT_Icons.Mail size={14} /> {user.email}</span>
                                        <span className="inline-flex items-center gap-2"><VCT_Icons.Phone size={14} /> {user.phone}</span>
                                        <span className="inline-flex items-center gap-2"><VCT_Icons.Building2 size={14} /> {user.scope}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <VCT_Button variant="outline" icon={<VCT_Icons.ChevronLeft size={16} />} onClick={() => router.push('/admin/users')}>Quay lại</VCT_Button>
                                <VCT_Button variant="secondary" icon={<VCT_Icons.Lock size={16} />} onClick={() => setConfirmReset(true)}>Đổi mật khẩu</VCT_Button>
                                <VCT_Button variant={user.status === 'locked' ? 'primary' : 'secondary'} icon={user.status === 'locked' ? <VCT_Icons.CheckCircle size={16} /> : <VCT_Icons.Alert size={16} />} onClick={() => setConfirmLock(true)}>
                                    {user.status === 'locked' ? 'Mở khóa' : 'Khóa TK'}
                                </VCT_Button>
                            </div>
                        </div>
                    </section>

                    <VCT_StatRow items={statItems} className="mb-8" />

                    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                        <div className="grid gap-6">
                            {/* ── IDENTITY ── */}
                            <VCT_SectionCard title="Thông tin định danh" icon={<VCT_Icons.User size={18} />} accentColor={accentColor}>
                                <div className="grid gap-4 tablet:grid-cols-2">
                                    <DetailItem icon={<VCT_Icons.Mail size={14} />} label="Email" value={user.email} />
                                    <DetailItem icon={<VCT_Icons.Phone size={14} />} label="SĐT" value={user.phone} />
                                    <DetailItem icon={<VCT_Icons.Building2 size={14} />} label="Phạm vi" value={user.scope} />
                                    <DetailItem icon={<VCT_Icons.Calendar size={14} />} label="Ngày tạo" value={user.created_at} />
                                    <DetailItem icon={<VCT_Icons.Clock size={14} />} label="Đăng nhập cuối" value={user.last_login} />
                                    <DetailItem icon={<VCT_Icons.Shield size={14} />} label="Vai trò" value={roleLabel} />
                                </div>
                            </VCT_SectionCard>

                            {/* ── PERMISSIONS ── */}
                            <VCT_SectionCard title="Quyền và trách nhiệm" icon={<VCT_Icons.ShieldCheck size={18} />} accentColor={accentColor}>
                                <div className="grid gap-6 tablet:grid-cols-[1.05fr_1fr]">
                                    <div>
                                        <div className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Permission footprint</div>
                                        <div className="flex flex-wrap gap-2">
                                            {permissions.map((permission) => (
                                                <span key={permission} className="rounded-full border border-vct-border bg-vct-input px-3 py-1 text-[11px] font-semibold text-vct-text-secondary">
                                                    {permission}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Trách nhiệm vận hành</div>
                                        <div className="grid gap-3">
                                            {responsibilities.map((item) => (
                                                <div key={item} className="flex items-start gap-3 rounded-2xl border border-vct-border bg-vct-input p-4">
                                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-vct-accent/10 text-vct-accent">
                                                        <VCT_Icons.CheckSquare size={15} />
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-vct-text-secondary">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </VCT_SectionCard>
                        </div>

                        <div className="grid gap-6">
                            {/* ── ACTIVITY TIMELINE ── */}
                            <VCT_SectionCard title="Dòng hoạt động" icon={<VCT_Icons.Activity size={18} />} accentColor={accentColor}>
                                <VCT_Timeline events={timelineEvents} maxHeight={360} />
                            </VCT_SectionCard>

                            {/* ── SECURITY SIGNALS ── */}
                            <VCT_SectionCard title="Tín hiệu bảo mật" icon={<VCT_Icons.Lock size={18} />} accentColor={accentColor}>
                                <div className="grid gap-3">
                                    <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Trạng thái xác thực</div>
                                            <VCT_Badge text={user.status === 'active' ? 'Ổn định' : 'Cảnh báo'} type={user.status === 'active' ? 'success' : 'danger'} pulse={false} size="sm" />
                                        </div>
                                        <div className="text-sm text-vct-text-secondary">{user.status === 'active' ? 'JWT hợp lệ, không có revoke mở' : user.status === 'locked' ? 'Bị khóa do tín hiệu rủi ro' : 'Bị vô hiệu hóa ở tầng nghiệp vụ'}</div>
                                    </div>
                                    <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted mb-2">Mức ưu tiên xử lý</div>
                                        <div className="text-2xl font-black text-vct-text">
                                            {user.role === 'SYSTEM_ADMIN' ? 'P1' : user.role === 'FEDERATION_ADMIN' || user.role === 'CLUB_MANAGER' ? 'P2' : 'P3'}
                                        </div>
                                        <div className="mt-1 text-xs text-vct-text-muted">Dựa trên vai trò và phạm vi tác động.</div>
                                    </div>
                                    <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted mb-2">Khuyến nghị</div>
                                        <div className="text-sm leading-relaxed text-vct-text-secondary">
                                            {user.status === 'locked'
                                                ? 'Rà lại audit log, xác thực nguồn IP và buộc đổi mật khẩu trước khi mở khóa.'
                                                : user.status === 'inactive'
                                                    ? 'Kiểm tra nhu cầu kích hoạt lại.'
                                                    : 'Duy trì review định kỳ quyền truy cập.'}
                                        </div>
                                    </div>
                                </div>
                            </VCT_SectionCard>
                        </div>
                    </div>
                </>
            )}

            {/* ── CONFIRM DIALOGS ── */}
            <VCT_ConfirmDialog
                isOpen={confirmLock}
                onClose={() => setConfirmLock(false)}
                onConfirm={() => { setConfirmLock(false); showToast(user.status === 'locked' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', user.status === 'locked' ? 'success' : 'warning') }}
                title={user.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                message={user.status === 'locked' ? `Mở khóa tài khoản "${user.name}"? Người dùng sẽ có thể đăng nhập lại.` : `Khóa tài khoản "${user.name}"? Người dùng sẽ bị đăng xuất ngay lập tức.`}
                confirmLabel={user.status === 'locked' ? 'Mở khóa' : 'Khóa ngay'}
            />
            <VCT_ConfirmDialog
                isOpen={confirmReset}
                onClose={() => setConfirmReset(false)}
                onConfirm={() => { setConfirmReset(false); showToast('Đã gửi email đổi mật khẩu') }}
                title="Đổi mật khẩu"
                message={`Gửi email đổi mật khẩu đến ${user.email}?`}
                confirmLabel="Gửi email"
            />
        </AdminPageShell>
    )
}
