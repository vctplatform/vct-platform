'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Select, VCT_Tabs, VCT_EmptyState,
    VCT_Modal, VCT_Input, VCT_Field
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { VCT_Timeline } from '../components/VCT_Timeline'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { AdminGuard } from './components/AdminGuard'

// ════════════════════════════════════════
// TYPES & MAPS
// ════════════════════════════════════════
interface SubPlan {
    id: string; code: string; name: string; description: string; entity_type: string
    price_monthly: number; price_yearly: number; max_members: number
    max_tournaments: number; max_athletes: number; is_active: boolean; sort_order: number;
}

interface Subscription {
    id: string; plan_code: string; plan_name: string
    entity_type: string; entity_id: string; entity_name: string
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired'
    billing_cycle_type: string
    current_period_start: string; current_period_end: string
    auto_renew: boolean; created_at: string
}

interface BillingEntry { id: string; period: string; amount: number; status: string; due_date: string; paid_at?: string }

const STATUS_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
    trial:     { label: 'Dùng thử',      type: 'info' },
    active:    { label: 'Đang hoạt động', type: 'success' },
    past_due:  { label: 'Quá hạn',        type: 'warning' },
    suspended: { label: 'Tạm ngưng',      type: 'danger' },
    cancelled: { label: 'Đã hủy',         type: 'neutral' },
    expired:   { label: 'Hết hạn',        type: 'neutral' },
}

const ENTITY_MAP: Record<string, { label: string; type: 'info' | 'warning' | 'danger' | 'neutral' }> = {
    federation:   { label: 'Liên đoàn',  type: 'info' },
    organization: { label: 'Tổ chức/CLB', type: 'info' },
    tournament:   { label: 'Giải đấu',    type: 'warning' },
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
type SortKey = 'entity_name' | 'current_period_end' | 'status' | 'plan_name'
type SortDir = 'asc' | 'desc'

const daysUntil = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_subscriptions = () => (
    <AdminGuard>
        <Page_admin_subscriptions_Content />
    </AdminGuard>
)

const Page_admin_subscriptions_Content = () => {
    const [tab, setTab] = useState<'subscriptions' | 'plans' | 'history'>('subscriptions')
    const [subs, setSubs] = useState<Subscription[]>([])
    const [plans, setPlans] = useState<SubPlan[]>([])
    const [billingHistory, setBillingHistory] = useState<Record<string, BillingEntry[]>>({})
    const [search, setSearch] = useState('')
    const [filterEntity, setFilterEntity] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [selected, setSelected] = useState<Subscription | null>(null)
    const [drawerTab, setDrawerTab] = useState<'info' | 'billing'>('info')
    const [sortKey, setSortKey] = useState<SortKey>('entity_name')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    
    // Modals
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Partial<SubPlan>>({})
    const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false)
    const [subscribeForm, setSubscribeForm] = useState({ entity_id: '', entity_type: 'organization', entity_name: '', plan_id: '', billing_cycle_type: 'yearly', trial_days: 0 })

    const { showToast } = useShellToast()

    const fetchPlans = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/v1/finance/plans', { credentials: 'include' })
            if (res.ok) {
                const j = await res.json()
                setPlans(j.data || [])
            } else {
                setPlans([])
                showToast('Chưa kết nối API Backend thật sự (Plans)', 'error')
            }
        } catch {
            setPlans([])
            showToast('Lỗi lấy danh sách gói', 'error')
        } finally { setIsLoading(false) }
    }

    const fetchSubs = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/v1/finance/subscriptions', { credentials: 'include' })
            if (res.ok) {
                const j = await res.json()
                setSubs(j.data || [])
            } else {
                setSubs([])
                showToast('Chưa kết nối API Backend thật sự (Subs)', 'error')
            }
        } catch {
            setSubs([])
            showToast('Lỗi lấy danh sách đăng ký', 'error')
        } finally { setIsLoading(false) }
    }

    const fetchBilling = async (subId: string) => {
        try {
            const res = await fetch(`/api/v1/finance/billing-cycles?subscription_id=${subId}`, { credentials: 'include' })
            if (res.ok) {
                const j = await res.json()
                setBillingHistory(prev => ({ ...prev, [subId]: j.data?.items || [] }))
            } else setBillingHistory(prev => ({ ...prev, [subId]: [] }))
        } catch { setBillingHistory(prev => ({ ...prev, [subId]: [] })) }
    }

    React.useEffect(() => {
        Promise.all([fetchPlans(), fetchSubs()]).finally(() => setIsLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        if (selected && !billingHistory[selected.id]) {
            fetchBilling(selected.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    // ── Expiring soon subscriptions ──
    const expiringSoon = useMemo(() => subs.filter(s =>
        s.status === 'active' && daysUntil(s.current_period_end) <= 30 && daysUntil(s.current_period_end) > 0
    ), [subs])

    const activeSubs = subs.filter(s => s.status === 'active' || s.status === 'trial')
    const totalRevenue = subs.filter(s => s.status === 'active').reduce((a, s) => {
        const plan = plans.find(p => p.code === s.plan_code && p.entity_type === s.entity_type)
        return a + (plan ? (s.billing_cycle_type === 'yearly' ? plan.price_yearly : plan.price_monthly) : 0)
    }, 0)
    const pastDueSubs = subs.filter(s => s.status === 'past_due' || s.status === 'suspended')

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Users size={20} />, label: 'Đang hoạt động', value: `${activeSubs.length}`, color: '#10b981' },
        { icon: <VCT_Icons.AlertTriangle size={20} />, label: 'Quá hạn / Tạm ngưng', value: `${pastDueSubs.length}`, color: '#ef4444' },
        { icon: <VCT_Icons.DollarSign size={20} />, label: 'Doanh thu kỳ này', value: fmt(totalRevenue), color: '#0ea5e9' },
        { icon: <VCT_Icons.FileText size={20} />, label: 'Tổng gói dịch vụ', value: `${plans.length}`, color: '#8b5cf6' },
    ]

    // ── Sort & Filter ──
    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key as SortKey); setSortDir('asc') }
    }

    const filteredSubs = useMemo(() => {
        const filtered = subs.filter(s => {
            const matchSearch = s.entity_name.toLowerCase().includes(search.toLowerCase()) || s.plan_name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
            const matchEntity = filterEntity === 'all' || s.entity_type === filterEntity
            const matchStatus = filterStatus === 'all' || s.status === filterStatus
            return matchSearch && matchEntity && matchStatus
        })
        return filtered.sort((a, b) => {
            const va = a[sortKey] ?? ''
            const vb = b[sortKey] ?? ''
            const cmp = va < vb ? -1 : va > vb ? 1 : 0
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [subs, search, filterEntity, filterStatus, sortKey, sortDir])

    // ── Actions ──
    const handleAction = async (id: string, action: string) => {
        try {
            const token = localStorage.getItem('vct_access_token')
            const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
            // Some endpoints might require body, passing empty JSON for now
            const res = await fetch(`/api/v1/finance/subscriptions/${id}/${action}`, { method: 'POST', headers, body: JSON.stringify({}) })
            if (res.ok) {
                showToast(`Thao tác ${action} thành công`)
                await fetchSubs()
                setSelected(null)
            } else {
                const j = await res.json().catch(() => ({}))
                showToast(j.error?.message || `Lỗi khi ${action}`, 'error')
            }
        } catch { showToast(`Lỗi kết nối API`, 'error') }
    }

    const handleRenew = (id: string) => handleAction(id, 'renew')
    const handleCancel = (id: string) => handleAction(id, 'cancel')
    const handleReactivate = (id: string) => handleAction(id, 'reactivate')
    const handleSuspend = (id: string) => handleAction(id, 'suspend')

    const handleMarkPaid = async (subId: string, billingId: string) => {
        try {
            const token = localStorage.getItem('vct_access_token')
            const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
            const res = await fetch(`/api/v1/finance/billing-cycles/${billingId}/pay`, { method: 'POST', headers })
            if (res.ok) {
                showToast('Đã đánh dấu thanh toán')
                fetchBilling(subId)
            } else {
                const j = await res.json().catch(() => ({}))
                showToast(j.error?.message || 'Lỗi cập nhật', 'error')
            }
        } catch { showToast('Lỗi kết nối API', 'error') }
    }

    const tabItems = [
        { value: 'subscriptions', label: `Đăng ký (${subs.length})` },
        { value: 'plans', label: `Gói dịch vụ (${plans.length})` },
        { value: 'history', label: 'Lịch sử' },
    ]

    return (
        <AdminPageShell
            title="Quản lý Subscription & Billing"
            subtitle="Quản lý gói dịch vụ, thanh toán, và gia hạn cho liên đoàn, tổ chức, giải đấu"
            icon={<VCT_Icons.CreditCard size={28} className="text-[#8b5cf6]" />}
            stats={stats}
        >

            {/* ── Expiring Alert Banner ── */}
            {expiringSoon.length > 0 && (
                <div className="mb-6 p-4 bg-[#f59e0b10] border border-[#f59e0b40] rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f59e0b] flex items-center justify-center">
                            <VCT_Icons.AlertTriangle size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-(--vct-text-primary)">{expiringSoon.length} subscription sắp hết hạn</div>
                            <div className="text-xs text-(--vct-text-tertiary)">{expiringSoon.map(s => s.entity_name).join(', ')}</div>
                        </div>
                    </div>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Refresh size={14} />}
                        onClick={() => showToast(`Đã gửi nhắc nhở cho ${expiringSoon.length} đơn vị`)}>
                        Nhắc gia hạn
                    </VCT_Button>
                </div>
            )}

            <VCT_Tabs tabs={tabItems} activeTab={tab} onChange={v => setTab(v as typeof tab)} className="mb-6" />

            {/* ── TAB: Subscriptions ── */}
            {tab === 'subscriptions' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm tên đơn vị, gói..." className="min-w-[220px]" />
                            <VCT_Select value={filterEntity} onChange={setFilterEntity} options={[{ value: 'all', label: 'Tất cả loại' }, ...Object.entries(ENTITY_MAP).map(([k, v]) => ({ value: k, label: v.label }))]} />
                            <VCT_Select value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))]} />
                        </div>
                        <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />} onClick={() => setIsSubscribeModalOpen(true)}>Cấp gói mới</VCT_Button>
                    </div>
                    <AdminDataTable
                        data={filteredSubs}
                        isLoading={isLoading}
                        sortBy={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                        rowKey={s => s.id}
                        emptyTitle="Chưa có đăng ký nào"
                        emptyDescription="Thử thay đổi bộ lọc tìm kiếm"
                        emptyIcon="📄"
                        columns={[
                            {
                                key: 'entity_name',
                                label: 'Đơn vị',
                                sortable: true,
                                render: (sub) => (
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{sub.entity_name}</div>
                                        <div className="text-[11px] text-(--vct-text-tertiary) font-mono">{sub.id}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'entity_type',
                                label: 'Loại',
                                sortable: false,
                                hideMobile: true,
                                render: (sub) => <VCT_Badge type={ENTITY_MAP[sub.entity_type]?.type || 'info'} text={ENTITY_MAP[sub.entity_type]?.label || sub.entity_type} />
                            },
                            {
                                key: 'plan_name',
                                label: 'Gói',
                                sortable: true,
                                render: (sub) => <div className="font-bold text-(--vct-text-primary)">{sub.plan_name}</div>
                            },
                            {
                                key: 'billing_cycle_type',
                                label: 'Chu kỳ',
                                sortable: false,
                                render: (sub) => <div className="text-(--vct-text-secondary) text-xs">{sub.billing_cycle_type === 'yearly' ? 'Năm' : 'Tháng'}</div>
                            },
                            {
                                key: 'current_period_end',
                                label: 'Hạn',
                                sortable: true,
                                align: 'center',
                                render: (sub) => {
                                    const days = daysUntil(sub.current_period_end)
                                    const isExpiring = sub.status === 'active' && days <= 30 && days > 0
                                    return (
                                        <span className={`text-xs font-semibold ${isExpiring ? 'text-[#f59e0b]' : 'text-(--vct-text-tertiary)'}`}>
                                            {sub.current_period_end}
                                            {isExpiring && <span className="block text-[10px]">({days} ngày)</span>}
                                        </span>
                                    )
                                }
                            },
                            {
                                key: 'auto_renew',
                                label: 'Tự gia hạn',
                                sortable: false,
                                align: 'center',
                                render: (sub) => sub.auto_renew ? <VCT_Icons.CheckCircle size={16} className="text-[#10b981] inline" /> : <VCT_Icons.X size={16} className="text-[#94a3b8] inline" />
                            },
                            {
                                key: 'status',
                                label: 'Trạng thái',
                                sortable: true,
                                align: 'center',
                                render: (sub) => <VCT_Badge type={STATUS_MAP[sub.status]?.type || 'neutral'} text={STATUS_MAP[sub.status]?.label || sub.status} />
                            }
                        ]}
                        onRowClick={(sub) => { setSelected(sub); setDrawerTab('info') }}
                    />
                </>
            )}

            {/* ── TAB: Plans ── */}
            {tab === 'plans' && (
                <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-(--vct-text-primary)">Danh sách Gói dịch vụ</h2>
                    <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />} onClick={() => { setEditingPlan({}); setIsPlanModalOpen(true); }}>Thêm gói mới</VCT_Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 hover:border-[#8b5cf6] transition-colors group">
                            <div className="flex items-center justify-between mb-3">
                                <VCT_Badge type={ENTITY_MAP[plan.entity_type]?.type || 'info'} text={ENTITY_MAP[plan.entity_type]?.label || plan.entity_type} />
                                <div className="flex items-center gap-2">
                                    {plan.is_active && <VCT_Badge type="success" text="Đang mở" />}
                                    <button onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-(--vct-bg-base) rounded-lg" title="Chỉnh sửa">
                                        <VCT_Icons.Edit size={14} className="text-(--vct-text-tertiary)" />
                                    </button>
                                </div>
                            </div>
                            <div className="font-black text-lg text-(--vct-text-primary) mb-1">{plan.name}</div>
                            <div className="text-xs text-(--vct-text-tertiary) mb-4">{plan.description}</div>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-(--vct-text-secondary)">Giá tháng</span>
                                    <span className="font-bold text-(--vct-text-primary)">{fmt(plan.price_monthly)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-(--vct-text-secondary)">Giá năm</span>
                                    <span className="font-bold text-[#10b981]">{fmt(plan.price_yearly)}</span>
                                </div>
                                <div className="border-t border-(--vct-border-subtle) pt-2 mt-2 space-y-1 text-xs text-(--vct-text-tertiary)">
                                    <div className="flex items-center gap-2"><VCT_Icons.Users size={12} /> Tối đa {plan.max_members} thành viên</div>
                                    <div className="flex items-center gap-2"><VCT_Icons.Trophy size={12} /> {plan.max_tournaments} giải/năm</div>
                                    <div className="flex items-center gap-2"><VCT_Icons.Activity size={12} /> {plan.max_athletes} VĐV</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}

            {/* ── TAB: History ── */}
            {tab === 'history' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                    <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={18} className="text-[#8b5cf6]" /> Lịch sử gia hạn & thay đổi
                    </h3>
                    <VCT_Timeline events={[]} />
                </div>
            )}

            {/* ── Subscription Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Subscription ${selected?.id ?? ''}`} width={580}>
                {selected && (
                    <VCT_Stack gap={20}>
                        {/* Drawer Tabs: Info / Billing */}
                        <div className="flex rounded-xl border border-(--vct-border-strong) overflow-hidden">
                            {(['info', 'billing'] as const).map(t => (
                                <button key={t} onClick={() => setDrawerTab(t)}
                                    className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${drawerTab === t ? 'bg-[#8b5cf6] text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:bg-(--vct-bg-base)'}`}
                                >
                                    {t === 'info' ? 'Thông tin' : 'Thanh toán'}
                                </button>
                            ))}
                        </div>

                        {drawerTab === 'info' && (
                            <>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <VCT_Badge type={ENTITY_MAP[selected.entity_type]?.type || 'info'} text={ENTITY_MAP[selected.entity_type]?.label || selected.entity_type} />
                                    <VCT_Badge type={STATUS_MAP[selected.status]?.type || 'neutral'} text={STATUS_MAP[selected.status]?.label || selected.status} />
                                    {selected.auto_renew && <VCT_Badge type="success" text="Tự gia hạn" />}
                                </div>

                                {/* Trial progress bar */}
                                {selected.status === 'trial' && (
                                    <div className="p-3 bg-[#8b5cf610] border border-[#8b5cf640] rounded-xl">
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="text-[#8b5cf6] font-bold">Trial Period</span>
                                            <span className="text-(--vct-text-tertiary)">{Math.max(0, daysUntil(selected.current_period_end))} / {Math.ceil((new Date(selected.current_period_end).getTime() - new Date(selected.current_period_start).getTime()) / (1000 * 60 * 60 * 24))} ngày</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#8b5cf620] rounded-full overflow-hidden">
                                            <div className="h-full bg-linear-to-r from-[#8b5cf6] to-[#a855f7] rounded-full transition-all"
                                                style={{ width: `${Math.min(100, Math.max(0, 100 - (daysUntil(selected.current_period_end) / Math.max(1, Math.ceil((new Date(selected.current_period_end).getTime() - new Date(selected.current_period_start).getTime()) / (1000 * 60 * 60 * 24))) * 100)))}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Đơn vị', value: selected.entity_name },
                                        { label: 'Gói dịch vụ', value: selected.plan_name },
                                        { label: 'Chu kỳ', value: selected.billing_cycle_type === 'yearly' ? 'Năm' : 'Tháng' },
                                        { label: 'Bắt đầu', value: selected.current_period_start },
                                        { label: 'Hết hạn', value: selected.current_period_end },
                                        { label: 'Ngày đăng ký', value: selected.created_at },
                                    ].map(item => (
                                        <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                            <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions based on status */}
                                <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle) flex-wrap">
                                    {(selected.status === 'active' || selected.status === 'past_due' || selected.status === 'expired') && (
                                        <>
                                            <VCT_Button variant="primary" onClick={() => handleRenew(selected.id)} icon={<VCT_Icons.Refresh size={14} />}>Gia hạn</VCT_Button>
                                            <VCT_Button variant="outline" onClick={() => handleSuspend(selected.id)} icon={<VCT_Icons.Pause size={14} />}>Tạm ngưng</VCT_Button>
                                            <VCT_Button variant="outline" onClick={() => handleCancel(selected.id)} icon={<VCT_Icons.X size={14} />}>Hủy gói</VCT_Button>
                                        </>
                                    )}
                                    {selected.status === 'suspended' && (
                                        <>
                                            <VCT_Button variant="primary" onClick={() => handleReactivate(selected.id)} icon={<VCT_Icons.Play size={14} />}>Kích hoạt lại</VCT_Button>
                                            <VCT_Button variant="outline" onClick={() => handleCancel(selected.id)} icon={<VCT_Icons.X size={14} />}>Hủy gói</VCT_Button>
                                        </>
                                    )}
                                    {selected.status === 'trial' && (
                                        <VCT_Button variant="primary" onClick={() => handleRenew(selected.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Kích hoạt gói</VCT_Button>
                                    )}
                                </VCT_Stack>
                            </>
                        )}

                        {drawerTab === 'billing' && (
                            <div>
                                <h4 className="font-bold text-(--vct-text-primary) text-sm mb-3 flex items-center gap-2">
                                    <VCT_Icons.FileText size={16} className="text-[#0ea5e9]" /> Lịch sử thanh toán
                                </h4>
                                {(billingHistory[selected.id] || []).length === 0 ? (
                                    <VCT_EmptyState icon={<VCT_Icons.FileText size={32} />} title="Chưa có kỳ thanh toán" />
                                ) : (
                                    <div className="space-y-3">
                                        {(billingHistory[selected.id] || []).map(bc => (
                                            <div key={bc.id} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-sm text-(--vct-text-primary)">{bc.period}</div>
                                                    <div className="text-[11px] text-(--vct-text-tertiary)">Hạn TT: {bc.due_date}{bc.paid_at ? ` · Đã TT: ${bc.paid_at}` : ''}</div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="font-bold text-sm text-(--vct-text-primary)">{fmt(bc.amount)}</div>
                                                    <VCT_Badge type={bc.status === 'paid' ? 'success' : bc.status === 'pending' ? 'warning' : 'danger'} text={bc.status === 'paid' ? 'Đã TT' : bc.status === 'pending' ? 'Chờ TT' : 'Quá hạn'} />
                                                    {bc.status !== 'paid' && (
                                                        <button onClick={() => handleMarkPaid(selected.id, bc.id)} className="text-[10px] text-[#8b5cf6] hover:underline font-bold mt-1">Đánh dấu đã thu</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Drawer>

            {/* ── Create / Edit Plan Modal ── */}
            <VCT_Modal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                title={editingPlan.id ? 'Chỉnh sửa gói' : 'Thêm gói dịch vụ mới'}
                width="600px"
                footer={
                    <>
                        <VCT_Button variant="secondary" onClick={() => setIsPlanModalOpen(false)}>Hủy</VCT_Button>
                        <VCT_Button variant="primary" onClick={async () => {
                            try {
                                const token = localStorage.getItem('vct_access_token')
                                const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                                const method = editingPlan.id ? 'PATCH' : 'POST'
                                const url = editingPlan.id ? `/api/v1/finance/plans/${editingPlan.id}` : '/api/v1/finance/plans'
                                const res = await fetch(url, { method, headers, body: JSON.stringify(editingPlan) })
                                if (res.ok) {
                                    showToast(editingPlan.id ? 'Cập nhật thành công' : 'Đã tạo gói mới')
                                    setIsPlanModalOpen(false)
                                    fetchPlans()
                                } else {
                                    const err = await res.json()
                                    showToast(err.error?.message || 'Lỗi lưu gói', 'error')
                                }
                            } catch { showToast('Lỗi kết nối API', 'error') }
                        }}>
                            {editingPlan.id ? 'Lưu thay đổi' : 'Tạo gói'}
                        </VCT_Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <VCT_Field label="Mã gói (Code)" required><VCT_Input value={editingPlan.code || ''} onChange={(e: any) => setEditingPlan(p => ({ ...p, code: e?.target?.value ?? e }))} placeholder="VD: basic" disabled={!!editingPlan.id} /></VCT_Field>
                    <VCT_Field label="Tên gọi" required><VCT_Input value={editingPlan.name || ''} onChange={(e: any) => setEditingPlan(p => ({ ...p, name: e?.target?.value ?? e }))} placeholder="VD: Gói Cơ Bản" /></VCT_Field>
                    <div className="col-span-2"><VCT_Field label="Mô tả"><VCT_Input value={editingPlan.description || ''} onChange={(e: any) => setEditingPlan(p => ({ ...p, description: e?.target?.value ?? e }))} placeholder="Dành cho..." /></VCT_Field></div>
                    <VCT_Field label="Đối tượng" required>
                        <VCT_Select value={editingPlan.entity_type || 'organization'} onChange={v => setEditingPlan(p => ({ ...p, entity_type: v }))} options={[{ value: 'organization', label: 'CLB/Tổ chức' }, { value: 'federation', label: 'Liên đoàn' }, { value: 'tournament', label: 'Giải đấu' }]} disabled={!!editingPlan.id} />
                    </VCT_Field>
                    <VCT_Field label="Trạng thái"><VCT_Select value={editingPlan.is_active === false ? 'false' : 'true'} onChange={v => setEditingPlan(p => ({ ...p, is_active: v === 'true' }))} options={[{ value: 'true', label: 'Đang mở' }, { value: 'false', label: 'Đóng' }]} /></VCT_Field>
                    <VCT_Field label="Giá Tháng (VNĐ)"><VCT_Input type="number" value={editingPlan.price_monthly?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, price_monthly: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                    <VCT_Field label="Giá Năm (VNĐ)"><VCT_Input type="number" value={editingPlan.price_yearly?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, price_yearly: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                    <VCT_Field label="Tối đa thành viên"><VCT_Input type="number" value={editingPlan.max_members?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, max_members: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                    <VCT_Field label="Tối đa giải đấu"><VCT_Input type="number" value={editingPlan.max_tournaments?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, max_tournaments: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                    <VCT_Field label="Tối đa VĐV"><VCT_Input type="number" value={editingPlan.max_athletes?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, max_athletes: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                    <VCT_Field label="Thứ tự hiển thị"><VCT_Input type="number" value={editingPlan.sort_order?.toString() || '0'} onChange={(e: any) => setEditingPlan(p => ({ ...p, sort_order: Number(e?.target?.value ?? e) }))} /></VCT_Field>
                </div>
            </VCT_Modal>

            {/* ── Subscribe Modal ── */}
            <VCT_Modal
                isOpen={isSubscribeModalOpen}
                onClose={() => setIsSubscribeModalOpen(false)}
                title="Cấp gói dịch vụ mới"
                width="500px"
                footer={
                    <>
                        <VCT_Button variant="secondary" onClick={() => setIsSubscribeModalOpen(false)}>Hủy</VCT_Button>
                        <VCT_Button variant="primary" onClick={async () => {
                            try {
                                const token = localStorage.getItem('vct_access_token')
                                const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                                const res = await fetch('/api/v1/finance/subscriptions', { method: 'POST', headers, body: JSON.stringify(subscribeForm) })
                                if (res.ok) {
                                    showToast('Đã cấp gói thành công')
                                    setIsSubscribeModalOpen(false)
                                    fetchSubs()
                                } else {
                                    const err = await res.json()
                                    showToast(err.error?.message || 'Lỗi cấp gói', 'error')
                                }
                            } catch { showToast('Lỗi kết nối API', 'error') }
                        }}>Cấp gói</VCT_Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <VCT_Field label="Loại đối tượng" required>
                        <VCT_Select value={subscribeForm.entity_type} onChange={v => setSubscribeForm(p => ({ ...p, entity_type: v, plan_id: '' }))} options={[{ value: 'organization', label: 'CLB/Tổ chức' }, { value: 'federation', label: 'Liên đoàn' }, { value: 'tournament', label: 'Giải đấu' }]} />
                    </VCT_Field>
                    <VCT_Field label="ID Đối tượng (UUID)" required>
                        <VCT_Input value={subscribeForm.entity_id} onChange={(e: any) => setSubscribeForm(p => ({ ...p, entity_id: e?.target?.value ?? e }))} placeholder="Nhập UUID của liên đoàn/CLB" />
                    </VCT_Field>
                    <VCT_Field label="Gói dịch vụ" required>
                        <VCT_Select value={subscribeForm.plan_id} onChange={v => setSubscribeForm(p => ({ ...p, plan_id: v }))} options={[
                            { value: '', label: '-- Chọn gói dịch vụ --' },
                            ...plans.filter(p => p.entity_type === subscribeForm.entity_type).map(p => ({ value: p.id, label: `${p.name} - ${fmt(p.price_yearly)}/năm` }))
                        ]} />
                    </VCT_Field>
                    <div className="grid grid-cols-2 gap-4">
                        <VCT_Field label="Chu kỳ thanh toán">
                            <VCT_Select value={subscribeForm.billing_cycle_type} onChange={v => setSubscribeForm(p => ({ ...p, billing_cycle_type: v }))} options={[{ value: 'yearly', label: 'Theo năm' }, { value: 'monthly', label: 'Theo tháng' }]} />
                        </VCT_Field>
                        <VCT_Field label="Số ngày dùng thử">
                            <VCT_Input type="number" value={subscribeForm.trial_days.toString()} onChange={(e: any) => setSubscribeForm(p => ({ ...p, trial_days: Number(e?.target?.value ?? e) }))} />
                        </VCT_Field>
                    </div>
                </div>
            </VCT_Modal>
        </AdminPageShell>
    )
}
