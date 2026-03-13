'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select,
    VCT_Toast
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { VCT_ConfirmDialog } from '../components/vct-ui-overlay'
import { usePagination } from '../hooks/usePagination'

// ════════════════════════════════════════
// MOCK DATA — Tenants / Organizations
// ════════════════════════════════════════
interface Tenant {
    id: string
    name: string
    type: 'federation' | 'club' | 'association'
    plan: 'free' | 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'suspended' | 'trial' | 'pending'
    members: number
    admins: number
    created_at: string
    region: string
    contact_email: string
    last_active: string
}

const MOCK_TENANTS: Tenant[] = [
    { id: 'TN-001', name: 'Liên đoàn Vovinam Việt Nam', type: 'federation', plan: 'enterprise', status: 'active', members: 12500, admins: 8, created_at: '2023-01-15', region: 'Việt Nam', contact_email: 'admin@vovinam.vn', last_active: '2024-03-13' },
    { id: 'TN-002', name: 'Fédération Française de Vovinam', type: 'federation', plan: 'professional', status: 'active', members: 3200, admins: 4, created_at: '2023-03-22', region: 'Pháp', contact_email: 'contact@vovinam.fr', last_active: '2024-03-12' },
    { id: 'TN-003', name: 'Vovinam Italia Federation', type: 'federation', plan: 'starter', status: 'active', members: 1100, admins: 3, created_at: '2023-06-10', region: 'Ý', contact_email: 'info@vovinam.it', last_active: '2024-03-11' },
    { id: 'TN-004', name: 'CLB Vovinam Thủ Đức', type: 'club', plan: 'free', status: 'active', members: 85, admins: 2, created_at: '2023-09-01', region: 'TP.HCM', contact_email: 'thuduc@vovinam.club', last_active: '2024-03-13' },
    { id: 'TN-005', name: 'Vietnam Vovinam Association USA', type: 'association', plan: 'starter', status: 'trial', members: 450, admins: 2, created_at: '2024-01-05', region: 'Mỹ', contact_email: 'usa@vovinam.org', last_active: '2024-03-10' },
    { id: 'TN-006', name: 'CLB Vovinam Đại học Bách Khoa', type: 'club', plan: 'free', status: 'pending', members: 120, admins: 1, created_at: '2024-02-20', region: 'Hà Nội', contact_email: 'bk@vovinam.edu', last_active: '—' },
    { id: 'TN-007', name: 'Vovinam Cambodia Federation', type: 'federation', plan: 'starter', status: 'suspended', members: 600, admins: 2, created_at: '2023-11-12', region: 'Campuchia', contact_email: 'info@vovinam.kh', last_active: '2024-01-15' },
    { id: 'TN-008', name: 'CLB Vovinam Quận 1', type: 'club', plan: 'starter', status: 'active', members: 200, admins: 2, created_at: '2023-08-18', region: 'TP.HCM', contact_email: 'q1@vovinam.club', last_active: '2024-03-13' },
]

const PLAN_BADGE: Record<string, { type: 'info' | 'success' | 'warning' | 'neutral'; label: string }> = {
    free: { type: 'neutral', label: 'Free' },
    starter: { type: 'info', label: 'Starter' },
    professional: { type: 'success', label: 'Professional' },
    enterprise: { type: 'warning', label: 'Enterprise' },
}

const STATUS_BADGE: Record<string, { type: 'success' | 'danger' | 'warning' | 'neutral'; label: string }> = {
    active: { type: 'success', label: 'Active' },
    suspended: { type: 'danger', label: 'Suspended' },
    trial: { type: 'warning', label: 'Trial' },
    pending: { type: 'neutral', label: 'Pending' },
}

const TYPE_OPTIONS = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'federation', label: '🏛️ Liên đoàn' },
    { value: 'club', label: '🏠 Câu lạc bộ' },
    { value: 'association', label: '🤝 Hiệp hội' },
]

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: '✅ Active' },
    { value: 'trial', label: '⏳ Trial' },
    { value: 'pending', label: '🕐 Pending' },
    { value: 'suspended', label: '🚫 Suspended' },
]

// ════════════════════════════════════════
// SKELETON LOADER
// ════════════════════════════════════════
const SkeletonRow = () => (
    <tr>
        {[...Array(7)].map((_, i) => (
            <td key={i} className="p-4">
                <div className="h-4 bg-[var(--vct-bg-elevated)] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
            </td>
        ))}
    </tr>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_tenants = () => {
    const [tenants, setTenants] = useState(MOCK_TENANTS)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [drawer, setDrawer] = useState<Tenant | null>(null)
    const [confirmAction, setConfirmAction] = useState<{ tenant: Tenant; action: 'suspend' | 'activate' | 'approve' } | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 700)
        return () => clearTimeout(t)
    }, [])

    const filtered = useMemo(() => {
        let v = tenants
        if (typeFilter !== 'all') v = v.filter(t => t.type === typeFilter)
        if (statusFilter !== 'all') v = v.filter(t => t.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.name.toLowerCase().includes(q) || t.contact_email.toLowerCase().includes(q) || t.region.toLowerCase().includes(q))
        }
        return v
    }, [search, typeFilter, statusFilter, tenants])

    const pagination = usePagination(filtered, { pageSize: 10 })

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    const handleConfirm = useCallback(() => {
        if (!confirmAction) return
        const { tenant, action } = confirmAction
        setTenants(prev => prev.map(t => {
            if (t.id !== tenant.id) return t
            if (action === 'suspend') return { ...t, status: 'suspended' as const }
            if (action === 'activate' || action === 'approve') return { ...t, status: 'active' as const }
            return t
        }))
        const labels = { suspend: 'đình chỉ', activate: 'kích hoạt', approve: 'phê duyệt' }
        showToast(`Đã ${labels[action]} tổ chức "${tenant.name}"`)
        setConfirmAction(null)
        // Refresh drawer if open
        if (drawer?.id === tenant.id) {
            setDrawer(prev => prev ? { ...prev, status: action === 'suspend' ? 'suspended' : 'active' } : null)
        }
    }, [confirmAction, drawer, showToast])

    const handleExport = useCallback(() => {
        const header = 'ID,Tên,Loại,Gói,Trạng thái,Thành viên,Admins,Khu vực,Email,Ngày tạo\n'
        const rows = filtered.map(t =>
            `${t.id},"${t.name}",${t.type},${t.plan},${t.status},${t.members},${t.admins},"${t.region}",${t.contact_email},${t.created_at}`
        ).join('\n')
        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'vct_tenants.csv'; a.click()
        URL.revokeObjectURL(url)
        showToast('Đã xuất danh sách tổ chức!')
    }, [filtered, showToast])

    // Stats
    const stats = useMemo(() => ({
        total: tenants.length,
        active: tenants.filter(t => t.status === 'active').length,
        totalMembers: tenants.reduce((acc, t) => acc + t.members, 0),
        pending: tenants.filter(t => t.status === 'pending' || t.status === 'trial').length,
    }), [tenants])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            {toast && <VCT_Toast isVisible={!!toast} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản Lý Tổ Chức (Tenants)</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Phê duyệt, quản lý và giám sát các tổ chức sử dụng nền tảng VCT PLATFORM.</p>
                </div>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="ghost" icon={<VCT_Icons.Download size={16} />} onClick={handleExport}>Xuất CSV</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Tổng tổ chức', value: stats.total, color: 'var(--vct-accent-blue,#3b82f6)', icon: VCT_Icons.Building },
                    { label: 'Đang hoạt động', value: stats.active, color: 'var(--vct-accent-green,#22c55e)', icon: VCT_Icons.CheckCircle },
                    { label: 'Tổng thành viên', value: stats.totalMembers.toLocaleString(), color: 'var(--vct-accent-cyan,#06b6d4)', icon: VCT_Icons.Users },
                    { label: 'Chờ xử lý', value: stats.pending, color: 'var(--vct-accent-yellow,#eab308)', icon: VCT_Icons.Clock },
                ].map(card => (
                    <div key={card.label} className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-subtle)] rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                            <card.icon size={22} color={card.color} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
                            <div className="text-xs text-[var(--vct-text-tertiary)]">{card.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <VCT_SearchInput placeholder="Tìm theo tên, email, khu vực..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
                <VCT_Select value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
                <VCT_Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            </div>

            {/* ── TABLE ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4 w-20">T.Thái</th>
                            <th className="p-4">Tên tổ chức</th>
                            <th className="p-4 w-28">Loại</th>
                            <th className="p-4 w-28">Gói</th>
                            <th className="p-4 w-28 text-right">Thành viên</th>
                            <th className="p-4 w-28">Khu vực</th>
                            <th className="p-4 w-28">Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : pagination.paginatedItems.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-[var(--vct-text-tertiary)]">Không tìm thấy tổ chức nào</td></tr>
                        ) : (
                            pagination.paginatedItems.map(t => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawer(t)}>
                                    <td className="p-4"><VCT_Badge type={STATUS_BADGE[t.status]?.type ?? 'neutral'} text={STATUS_BADGE[t.status]?.label ?? t.status} /></td>
                                    <td className="p-4">
                                        <div className="font-semibold text-[var(--vct-text-primary)]">{t.name}</div>
                                        <div className="text-[11px] text-[var(--vct-text-tertiary)] font-mono">{t.contact_email}</div>
                                    </td>
                                    <td className="p-4 text-xs text-[var(--vct-text-secondary)] capitalize">{t.type === 'federation' ? '🏛️ Liên đoàn' : t.type === 'club' ? '🏠 CLB' : '🤝 Hiệp hội'}</td>
                                    <td className="p-4"><VCT_Badge type={PLAN_BADGE[t.plan]?.type ?? 'neutral'} text={PLAN_BADGE[t.plan]?.label ?? t.plan} /></td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-accent-cyan)]">{t.members.toLocaleString()}</td>
                                    <td className="p-4 text-xs text-[var(--vct-text-secondary)]">{t.region}</td>
                                    <td className="p-4 font-mono text-[11px] text-[var(--vct-text-tertiary)]">{t.created_at}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--vct-border-subtle)]">
                        <span className="text-xs text-[var(--vct-text-tertiary)]">
                            Hiển thị {(pagination.currentPage - 1) * 10 + 1}–{Math.min(pagination.currentPage * 10, filtered.length)} / {filtered.length}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={pagination.prev} disabled={!pagination.hasPrev} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">← Trước</button>
                            <button onClick={pagination.next} disabled={!pagination.hasNext} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">Sau →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── TENANT DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawer} onClose={() => setDrawer(null)} title="Chi tiết Tổ chức" width={520}>
                {drawer && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-[var(--vct-border-subtle)]">
                            <VCT_Badge type={STATUS_BADGE[drawer.status]?.type ?? 'neutral'} text={STATUS_BADGE[drawer.status]?.label ?? drawer.status} />
                            <VCT_Badge type={PLAN_BADGE[drawer.plan]?.type ?? 'neutral'} text={PLAN_BADGE[drawer.plan]?.label ?? drawer.plan} />
                            <span className="font-mono text-xs text-[var(--vct-text-tertiary)] ml-auto">{drawer.id}</span>
                        </div>

                        <div>
                            <div className="text-lg font-bold text-[var(--vct-text-primary)]">{drawer.name}</div>
                            <div className="text-sm text-[var(--vct-text-secondary)] mt-1 capitalize">
                                {drawer.type === 'federation' ? '🏛️ Liên đoàn' : drawer.type === 'club' ? '🏠 Câu lạc bộ' : '🤝 Hiệp hội'} — {drawer.region}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                                <div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Thành viên</div>
                                <div className="text-xl font-black text-[var(--vct-accent-cyan)]">{drawer.members.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                                <div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Admins</div>
                                <div className="text-xl font-black text-[var(--vct-accent-blue)]">{drawer.admins}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Email liên hệ</div><div className="font-mono text-[var(--vct-text-primary)]">{drawer.contact_email}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Ngày tạo</div><div className="font-mono text-[var(--vct-text-primary)]">{drawer.created_at}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Khu vực</div><div className="text-[var(--vct-text-primary)]">{drawer.region}</div></div>
                            <div><div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Hoạt động cuối</div><div className="font-mono text-[var(--vct-text-primary)]">{drawer.last_active}</div></div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-[var(--vct-border-subtle)]">
                            {drawer.status === 'pending' && (
                                <VCT_Button variant="primary" icon={<VCT_Icons.CheckCircle size={14} />} onClick={() => setConfirmAction({ tenant: drawer, action: 'approve' })}>Phê duyệt</VCT_Button>
                            )}
                            {drawer.status === 'active' && (
                                <VCT_Button variant="danger" icon={<VCT_Icons.AlertTriangle size={14} />} onClick={() => setConfirmAction({ tenant: drawer, action: 'suspend' })}>Đình chỉ</VCT_Button>
                            )}
                            {drawer.status === 'suspended' && (
                                <VCT_Button variant="primary" icon={<VCT_Icons.CheckCircle size={14} />} onClick={() => setConfirmAction({ tenant: drawer, action: 'activate' })}>Kích hoạt lại</VCT_Button>
                            )}
                            {drawer.status === 'trial' && (
                                <VCT_Button variant="primary" icon={<VCT_Icons.CheckCircle size={14} />} onClick={() => setConfirmAction({ tenant: drawer, action: 'approve' })}>Chuyển sang Active</VCT_Button>
                            )}
                        </div>
                    </div>
                )}
            </VCT_Drawer>

            {/* ── CONFIRM DIALOG ── */}
            <VCT_ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction?.action === 'suspend' ? 'Đình chỉ tổ chức' : confirmAction?.action === 'approve' ? 'Phê duyệt tổ chức' : 'Kích hoạt tổ chức'}
                message={`Bạn có chắc chắn muốn ${confirmAction?.action === 'suspend' ? 'đình chỉ' : confirmAction?.action === 'approve' ? 'phê duyệt' : 'kích hoạt lại'} tổ chức "${confirmAction?.tenant.name}"?`}
                confirmLabel={confirmAction?.action === 'suspend' ? 'Đình chỉ' : 'Xác nhận'}
            />
        </div>
    )
}
