'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { VCT_AvatarLetter, VCT_Badge } from '../components/vct-ui-data-display'
import { VCT_Button } from '../components/vct-ui-layout'
import { VCT_PageContainer } from '../components/VCT_PageContainer'
import { VCT_SectionCard } from '../components/VCT_SectionCard'
import { VCT_StatRow } from '../components/VCT_StatRow'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { MOCK_USERS, ROLE_COLORS, STATUS_MAP, getRoleLabel, type SystemUser } from './admin-users.data'

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

const buildActivityFeed = (user: SystemUser) => [
    {
        title: `Đăng nhập gần nhất từ tài khoản ${user.email}`,
        time: user.last_login === '—' ? 'Chưa có phiên đăng nhập gần đây' : user.last_login,
        icon: <VCT_Icons.Clock size={16} />,
        tone: user.status === 'locked' ? 'danger' : 'info',
    },
    {
        title: `Cập nhật phạm vi vận hành: ${user.scope}`,
        time: '09/03/2024 16:20',
        icon: <VCT_Icons.Shield size={16} />,
        tone: 'info',
    },
    {
        title: `Đồng bộ vai trò ${getRoleLabel(user.role)} vào workspace`,
        time: '07/03/2024 11:05',
        icon: <VCT_Icons.CheckCircle size={16} />,
        tone: 'success',
    },
    {
        title: user.status === 'inactive' ? 'Tài khoản đang bị tạm dừng thủ công' : user.status === 'locked' ? 'Hệ thống đã khóa tài khoản do rủi ro truy cập' : 'Không có cảnh báo bảo mật mở',
        time: 'Theo dõi theo thời gian thực',
        icon: user.status === 'locked' ? <VCT_Icons.Alert size={16} /> : <VCT_Icons.Activity size={16} />,
        tone: user.status === 'locked' ? 'danger' : user.status === 'inactive' ? 'warning' : 'success',
    },
]

const buildSecuritySignals = (user: SystemUser) => [
    {
        label: 'Trạng thái xác thực',
        value: user.status === 'active' ? 'JWT hợp lệ, không có revoke mở' : user.status === 'inactive' ? 'Bị vô hiệu hóa ở tầng nghiệp vụ' : 'Bị khóa do tín hiệu rủi ro',
        tone: user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger',
    },
    {
        label: 'Mức truy cập',
        value: getRoleLabel(user.role),
        tone: user.role === 'SYSTEM_ADMIN' ? 'danger' : user.role === 'FEDERATION_ADMIN' || user.role === 'CLUB_MANAGER' ? 'warning' : 'info',
    },
    {
        label: 'Phiên hoạt động',
        value: user.last_login === '—' ? '0 phiên đang mở' : user.status === 'active' ? '2 phiên đã ghi nhận' : 'Không duy trì phiên hoạt động',
        tone: user.last_login === '—' ? 'neutral' : 'info',
    },
]

const DetailItem = ({ icon, label, value }: DetailItemProps) => (
    <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
            <span className="text-vct-accent">{icon}</span>
            {label}
        </div>
        <div className="text-sm font-semibold text-vct-text">{value}</div>
    </div>
)

export const Page_admin_user_detail = ({ userId }: PageAdminUserDetailProps) => {
    const router = useRouter()
    const user = React.useMemo(
        () => MOCK_USERS.find((candidate) => candidate.id.toLowerCase() === userId.toLowerCase()),
        [userId]
    )

    if (!user) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="mx-auto max-w-3xl rounded-[28px] border border-vct-border bg-vct-elevated p-8 text-center shadow-[var(--vct-shadow-md)]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                        <VCT_Icons.AlertCircle size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-vct-text">Không tìm thấy tài khoản</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-vct-text-secondary">
                        Mã người dùng `{userId}` không tồn tại trong bộ dữ liệu quản trị hiện tại. Route động đã hoạt động, nhưng bản ghi này chưa có dữ liệu để hiển thị.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <VCT_Button variant="outline" icon={<VCT_Icons.ChevronLeft size={16} />} onClick={() => router.push('/admin/users')}>
                            Quay lại danh sách
                        </VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Users size={16} />} onClick={() => router.push('/admin/users')}>
                            Mở quản lý tài khoản
                        </VCT_Button>
                    </div>
                </div>
            </VCT_PageContainer>
        )
    }

    const accentColor = ROLE_COLORS[user.role] ?? '#0ea5e9'
    const statusMeta = STATUS_MAP[user.status]
    const roleLabel = getRoleLabel(user.role)
    const activityFeed = buildActivityFeed(user)
    const securitySignals = buildSecuritySignals(user)
    const responsibilities = ROLE_RESPONSIBILITIES[user.role] ?? []
    const permissions = ROLE_PERMISSIONS[user.role] ?? []
    const statItems: StatItem[] = [
        {
            label: 'Trạng thái truy cập',
            value: statusMeta.label,
            icon: user.status === 'active' ? <VCT_Icons.CheckCircle size={16} /> : user.status === 'inactive' ? <VCT_Icons.Pause size={16} /> : <VCT_Icons.AlertCircle size={16} />,
            color: user.status === 'active' ? '#10b981' : user.status === 'inactive' ? '#94a3b8' : '#ef4444',
            sub: user.status === 'active' ? 'Sẵn sàng đăng nhập' : user.status === 'inactive' ? 'Đang chờ kích hoạt lại' : 'Cần kiểm tra bảo mật',
        },
        {
            label: 'Phiên cuối',
            value: user.last_login,
            icon: <VCT_Icons.Clock size={16} />,
            color: '#f59e0b',
            sub: 'Dấu thời gian gần nhất',
        },
        {
            label: 'Phạm vi phụ trách',
            value: user.scope,
            icon: <VCT_Icons.Building2 size={16} />,
            color: accentColor,
            sub: 'Workspace và tổ chức hiện hành',
        },
        {
            label: 'Ngày tạo tài khoản',
            value: user.created_at,
            icon: <VCT_Icons.Calendar size={16} />,
            color: '#8b5cf6',
            sub: 'Mốc onboard vào hệ thống',
        },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <section
                className="relative mb-8 overflow-hidden rounded-[28px] border border-vct-border p-6 shadow-[var(--vct-shadow-md)] tablet:p-8"
                style={{
                    background: `linear-gradient(135deg, ${accentColor}1f 0%, rgba(15, 23, 42, 0.96) 55%, rgba(15, 118, 110, 0.12) 100%)`,
                }}
            >
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[90px]" style={{ backgroundColor: `${accentColor}55` }} />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />

                <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center">
                        <VCT_AvatarLetter name={user.name} size={88} className="ring-4 ring-white/10 shadow-[0_18px_40px_rgba(15,23,42,0.35)]" color={accentColor} />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{user.id}</span>
                                <VCT_Badge text={statusMeta.label} type={statusMeta.type} pulse={false} />
                                <span className="rounded-full px-3 py-1" style={{ background: `${accentColor}22`, color: accentColor }}>
                                    {roleLabel}
                                </span>
                            </div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-white tablet:text-4xl">{user.name}</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
                                Hồ sơ điều hành cho tài khoản {user.email}. Trang này gom thông tin định danh, phạm vi vận hành, tín hiệu bảo mật và các hoạt động gần nhất để đội admin xử lý nhanh.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                                <span className="inline-flex items-center gap-2"><VCT_Icons.Mail size={14} /> {user.email}</span>
                                <span className="inline-flex items-center gap-2"><VCT_Icons.Phone size={14} /> {user.phone}</span>
                                <span className="inline-flex items-center gap-2"><VCT_Icons.Building2 size={14} /> {user.scope}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <VCT_Button variant="outline" icon={<VCT_Icons.ChevronLeft size={16} />} onClick={() => router.push('/admin/users')}>
                            Quay lại danh sách
                        </VCT_Button>
                        <VCT_Button variant="secondary" icon={<VCT_Icons.Shield size={16} />} onClick={() => router.push('/admin/audit-logs')}>
                            Mở audit logs
                        </VCT_Button>
                    </div>
                </div>
            </section>

            <VCT_StatRow items={statItems} className="mb-8" />

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                <div className="grid gap-6">
                    <VCT_SectionCard title="Thông tin định danh" icon={<VCT_Icons.User size={18} />} accentColor={accentColor}>
                        <div className="grid gap-4 tablet:grid-cols-2">
                            <DetailItem icon={<VCT_Icons.Mail size={14} />} label="Email đăng nhập" value={user.email} />
                            <DetailItem icon={<VCT_Icons.Phone size={14} />} label="Số điện thoại" value={user.phone} />
                            <DetailItem icon={<VCT_Icons.Building2 size={14} />} label="Phạm vi tổ chức" value={user.scope} />
                            <DetailItem icon={<VCT_Icons.Calendar size={14} />} label="Ngày tạo" value={user.created_at} />
                            <DetailItem icon={<VCT_Icons.Clock size={14} />} label="Đăng nhập cuối" value={user.last_login} />
                            <DetailItem icon={<VCT_Icons.Shield size={14} />} label="Vai trò" value={roleLabel} />
                        </div>
                    </VCT_SectionCard>

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

                    <VCT_SectionCard title="Dòng hoạt động gần nhất" icon={<VCT_Icons.Activity size={18} />} accentColor={accentColor}>
                        <div className="grid gap-3">
                            {activityFeed.map((entry) => (
                                <div key={`${entry.title}-${entry.time}`} className="flex items-start gap-3 rounded-2xl border border-vct-border bg-vct-input p-4">
                                    <div
                                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                        style={{
                                            backgroundColor: entry.tone === 'danger' ? 'rgba(239,68,68,0.14)' : entry.tone === 'warning' ? 'rgba(245,158,11,0.16)' : entry.tone === 'success' ? 'rgba(16,185,129,0.14)' : 'rgba(14,165,233,0.14)',
                                            color: entry.tone === 'danger' ? '#ef4444' : entry.tone === 'warning' ? '#f59e0b' : entry.tone === 'success' ? '#10b981' : '#0ea5e9',
                                        }}
                                    >
                                        {entry.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-vct-text">{entry.title}</div>
                                        <div className="mt-1 text-xs text-vct-text-muted">{entry.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>
                </div>

                <div className="grid gap-6">
                    <VCT_SectionCard title="Tín hiệu bảo mật" icon={<VCT_Icons.Lock size={18} />} accentColor={accentColor}>
                        <div className="grid gap-3">
                            {securitySignals.map((signal) => (
                                <div key={signal.label} className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">{signal.label}</div>
                                        <VCT_Badge
                                            text={signal.tone === 'success' ? 'Ổn định' : signal.tone === 'warning' ? 'Theo dõi' : signal.tone === 'danger' ? 'Cảnh báo' : signal.tone === 'neutral' ? 'Không hoạt động' : 'Thông tin'}
                                            type={signal.tone === 'danger' ? 'danger' : signal.tone === 'warning' ? 'warning' : signal.tone === 'success' ? 'success' : signal.tone === 'neutral' ? 'neutral' : 'info'}
                                            pulse={false}
                                            size="sm"
                                        />
                                    </div>
                                    <div className="text-sm leading-relaxed text-vct-text-secondary">{signal.value}</div>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>

                    <VCT_SectionCard title="Chỉ báo vận hành" icon={<VCT_Icons.BarChart size={18} />} accentColor={accentColor}>
                        <div className="grid gap-3">
                            <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Mức ưu tiên xử lý</div>
                                <div className="mt-2 text-2xl font-black text-vct-text">
                                    {user.role === 'SYSTEM_ADMIN' ? 'P1' : user.role === 'FEDERATION_ADMIN' || user.role === 'CLUB_MANAGER' ? 'P2' : 'P3'}
                                </div>
                                <div className="mt-1 text-xs text-vct-text-muted">Dựa trên vai trò và phạm vi tác động của tài khoản.</div>
                            </div>
                            <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Mức bao phủ workspace</div>
                                <div className="mt-2 text-lg font-bold text-vct-text">{user.scope}</div>
                                <div className="mt-1 text-xs text-vct-text-muted">Điểm chạm chính mà tài khoản đang chịu trách nhiệm.</div>
                            </div>
                            <div className="rounded-2xl border border-vct-border bg-vct-input p-4">
                                <div className="text-xs font-bold uppercase tracking-[0.08em] text-vct-text-muted">Khuyến nghị quản trị</div>
                                <div className="mt-2 text-sm leading-relaxed text-vct-text-secondary">
                                    {user.status === 'locked'
                                        ? 'Rà lại audit log, xác thực nguồn IP và buộc đổi mật khẩu trước khi mở khóa.'
                                        : user.status === 'inactive'
                                            ? 'Kiểm tra nhu cầu kích hoạt lại và đối chiếu với phạm vi phân quyền hiện tại.'
                                            : 'Duy trì review định kỳ quyền truy cập và theo dõi hoạt động bất thường.'}
                                </div>
                            </div>
                        </div>
                    </VCT_SectionCard>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
