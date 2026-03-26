'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Select, VCT_Tabs,
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { VCT_Timeline } from '@vct/ui'
import type { TimelineEvent } from '@vct/ui'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'


// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Invoice {
    id: string; tournament: string; payer: string
    amount: number; type: 'registration' | 'sponsorship' | 'equipment' | 'venue' | 'other'
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    due_date: string; paid_date?: string
}

interface Budget {
    id: string; name: string; allocated: number; spent: number; category: string
}

interface Sponsorship {
    id: string; sponsor: string; amount: number; tournament: string
    status: 'active' | 'pending' | 'expired'; start_date: string; end_date: string
}

const STATUS_BADGE: Record<string, { label: string; type: string }> = {
    pending: { label: 'Chờ thanh toán', type: 'warning' },
    paid: { label: 'Đã thanh toán', type: 'success' },
    overdue: { label: 'Quá hạn', type: 'danger' },
    cancelled: { label: 'Đã hủy', type: 'neutral' },
    active: { label: 'Đang hiệu lực', type: 'success' },
    expired: { label: 'Hết hạn', type: 'neutral' },
}

const TYPE_BADGE: Record<string, { label: string; type: string }> = {
    registration: { label: 'Lệ phí', type: 'info' },
    sponsorship: { label: 'Tài trợ', type: 'success' },
    equipment: { label: 'Thiết bị', type: 'warning' },
    venue: { label: 'Địa điểm', type: 'neutral' },
    other: { label: 'Khác', type: 'neutral' },
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-001', tournament: 'Giải VCT Quốc gia 2024', payer: 'CLB VCT Bình Định', amount: 15000000, type: 'registration', status: 'paid', due_date: '2024-06-01', paid_date: '2024-05-28' },
    { id: 'INV-002', tournament: 'Giải VCT Quốc gia 2024', payer: 'CLB VCT TP.HCM', amount: 18000000, type: 'registration', status: 'pending', due_date: '2024-06-01' },
    { id: 'INV-003', tournament: 'Giải VCT Quốc gia 2024', payer: 'Cty CP Thiết bị TT', amount: 120000000, type: 'equipment', status: 'paid', due_date: '2024-05-15', paid_date: '2024-05-10' },
    { id: 'INV-004', tournament: 'Giải VCT Mở rộng TP.HCM', payer: 'CLB VCT Đà Nẵng', amount: 8000000, type: 'registration', status: 'overdue', due_date: '2024-06-25' },
    { id: 'INV-005', tournament: 'Giải VCT Quốc gia 2024', payer: 'Nhà thi đấu Phú Thọ', amount: 250000000, type: 'venue', status: 'paid', due_date: '2024-05-01', paid_date: '2024-04-28' },
    { id: 'INV-006', tournament: 'Giải VCT Mở rộng TP.HCM', payer: 'CLB VCT Huế', amount: 10000000, type: 'registration', status: 'pending', due_date: '2024-07-01' },
]

const MOCK_BUDGETS: Budget[] = [
    { id: 'BG-001', name: 'Giải VCT Quốc gia 2024', allocated: 2500000000, spent: 1850000000, category: 'Giải đấu' },
    { id: 'BG-002', name: 'Giải VCT Mở rộng TP.HCM', allocated: 800000000, spent: 320000000, category: 'Giải đấu' },
    { id: 'BG-003', name: 'Đào tạo trọng tài Q2/2024', allocated: 200000000, spent: 150000000, category: 'Đào tạo' },
    { id: 'BG-004', name: 'Văn phòng & hành chính', allocated: 500000000, spent: 280000000, category: 'Vận hành' },
]

const MOCK_SPONSORS: Sponsorship[] = [
    { id: 'SP-001', sponsor: 'Tập đoàn Vingroup', amount: 500000000, tournament: 'Giải VCT Quốc gia 2024', status: 'active', start_date: '2024-01-01', end_date: '2024-12-31' },
    { id: 'SP-002', sponsor: 'Ngân hàng VPBank', amount: 300000000, tournament: 'Giải VCT Quốc gia 2024', status: 'active', start_date: '2024-03-01', end_date: '2024-09-30' },
    { id: 'SP-003', sponsor: 'Cty TNHH Thể thao ABC', amount: 100000000, tournament: 'Giải VCT Mở rộng TP.HCM', status: 'pending', start_date: '2024-06-01', end_date: '2024-08-31' },
]

const FINANCE_TIMELINE: TimelineEvent[] = [
    { time: '11:20', title: 'Thanh toán INV-005 xác nhận', description: '250 triệu · Nhà thi đấu Phú Thọ', icon: <VCT_Icons.CheckCircle size={14} />, color: 'var(--vct-success)' },
    { time: '10:45', title: 'Tạo hóa đơn INV-006', description: '10 triệu · CLB VCT Huế', icon: <VCT_Icons.FileText size={14} />, color: 'var(--vct-accent-cyan)' },
    { time: '09:30', title: 'Cảnh báo quá hạn INV-004', description: '8 triệu · CLB VCT Đà Nẵng · Quá hạn 5 ngày', icon: <VCT_Icons.AlertTriangle size={14} />, color: 'var(--vct-danger)' },
    { time: 'Hôm qua', title: 'Nhà tài trợ VPBank duyệt', description: '300 triệu · Giải VCT Quốc gia 2024', icon: <VCT_Icons.DollarSign size={14} />, color: 'var(--vct-text-tertiary)' },
]



// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_finance = () => (
    <AdminGuard>
        <Page_admin_finance_Content />
    </AdminGuard>
)

const Page_admin_finance_Content = () => {
    const { t } = useI18n()
    const { data: fetchedInvoices, isLoading } = useAdminFetch<Invoice[]>('/admin/finance/invoices', { mockData: MOCK_INVOICES })
    const [tab, setTab] = useState<'invoices' | 'budgets' | 'sponsors'>('invoices')
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [sortColInvoices, setSortColInvoices] = useState('due_date')
    const [sortDirInvoices, setSortDirInvoices] = useState<'asc' | 'desc'>('desc')
    
    const [sortColSponsors, setSortColSponsors] = useState('sponsor')
    const [sortDirSponsors, setSortDirSponsors] = useState<'asc' | 'desc'>('asc')

    const [selected, setSelected] = useState<Invoice | null>(null)

    const { showToast } = useShellToast()
    const { mutate: mutateMarkPaid } = useAdminMutation('/admin/finance/mark-paid', { onSuccess: () => showToast('Đã xác nhận thanh toán') })

    React.useEffect(() => { if (fetchedInvoices) setInvoices(fetchedInvoices) }, [fetchedInvoices])

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
    const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.amount, 0)
    const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.amount, 0)
    const totalSponsorship = MOCK_SPONSORS.reduce((a, s) => a + s.amount, 0)

    const stats: StatItem[] = [
        { icon: <VCT_Icons.DollarSign size={20} />, label: 'Đã thu', value: fmt(totalRevenue), color: 'var(--vct-success)' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Chờ thanh toán', value: fmt(totalPending), color: 'var(--vct-warning)' },
        { icon: <VCT_Icons.AlertTriangle size={20} />, label: 'Quá hạn', value: fmt(totalOverdue), color: 'var(--vct-danger)' },
        { icon: <VCT_Icons.Award size={20} />, label: 'Tài trợ', value: fmt(totalSponsorship), color: 'var(--vct-text-tertiary)' },
    ]

    const filteredInvoices = useMemo(() => {
        let data = invoices.filter(i => {
            const matchSearch = i.id.toLowerCase().includes(search.toLowerCase()) || i.payer.toLowerCase().includes(search.toLowerCase()) || i.tournament.toLowerCase().includes(search.toLowerCase())
            const matchStatus = filterStatus === 'all' || i.status === filterStatus
            return matchSearch && matchStatus
        })

        // Sorting Invoices
        data = [...data].sort((a, b) => {
            const valA = String((a as any)[sortColInvoices] || '').toLowerCase()
            const valB = String((b as any)[sortColInvoices] || '').toLowerCase()
            if (sortColInvoices === 'amount') {
                return sortDirInvoices === 'asc' ? Number(a[sortColInvoices]) - Number(b[sortColInvoices]) : Number(b[sortColInvoices]) - Number(a[sortColInvoices])
            }
            return sortDirInvoices === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return data
    }, [invoices, search, filterStatus, sortColInvoices, sortDirInvoices])

    const filteredSponsors = useMemo(() => {
        return [...MOCK_SPONSORS].sort((a, b) => {
            const valA = String((a as any)[sortColSponsors] || '').toLowerCase()
            const valB = String((b as any)[sortColSponsors] || '').toLowerCase()
            if (sortColSponsors === 'amount') {
                return sortDirSponsors === 'asc' ? Number(a[sortColSponsors]) - Number(b[sortColSponsors]) : Number(b[sortColSponsors]) - Number(a[sortColSponsors])
            }
            return sortDirSponsors === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })
    }, [sortColSponsors, sortDirSponsors])

    const handleSortInvoices = (key: string) => {
        if (sortColInvoices === key) setSortDirInvoices(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColInvoices(key); setSortDirInvoices('asc') }
    }

    const handleSortSponsors = (key: string) => {
        if (sortColSponsors === key) setSortDirSponsors(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColSponsors(key); setSortDirSponsors('asc') }
    }

    const handleMarkPaid = async (id: string) => {
        await mutateMarkPaid({ id })
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' as const, paid_date: new Date().toISOString().split('T')[0] } : i))
        setSelected(null)
    }

    const tabItems = [
        { value: 'invoices', label: `Hóa đơn (${invoices.length})` },
        { value: 'budgets', label: `Ngân sách (${MOCK_BUDGETS.length})` },
        { value: 'sponsors', label: `Tài trợ (${MOCK_SPONSORS.length})` },
    ]

    return (
        <AdminPageShell
            title={t('admin.finance.title')}
            subtitle="Hóa đơn, ngân sách, và tài trợ cho toàn hệ thống VCT"
            icon={<VCT_Icons.DollarSign size={28} className="text-(--vct-success)" />}
            stats={stats}
        >
            <VCT_Tabs tabs={tabItems} activeTab={tab} onChange={v => setTab(v as typeof tab)} className="mb-6" />

            {/* ── TAB: Invoices ── */}
            {tab === 'invoices' && (
                <>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm hóa đơn..." className="flex-1 min-w-[220px]" />
                        <VCT_Select value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'Tất cả' }, ...Object.entries(STATUS_BADGE).filter(([k]) => ['pending', 'paid', 'overdue', 'cancelled'].includes(k)).map(([k, v]) => ({ value: k, label: v.label }))]} />
                    </div>
                    <AdminDataTable
                        data={filteredInvoices}
                        isLoading={isLoading}
                        sortBy={sortColInvoices}
                        sortDir={sortDirInvoices}
                        onSort={handleSortInvoices}
                        rowKey={inv => inv.id}
                        emptyTitle="Không tìm thấy hóa đơn"
                        emptyDescription="Thử thay đổi bộ lọc tìm kiếm"
                        emptyIcon="📄"
                        columns={[
                            {
                                key: 'id',
                                label: 'Mã',
                                sortable: true,
                                render: (inv) => <div className="font-mono text-xs text-(--vct-text-tertiary)">{inv.id}</div>
                            },
                            {
                                key: 'tournament',
                                label: 'Giải đấu',
                                sortable: true,
                                render: (inv) => <div className="text-(--vct-text-primary) font-bold">{inv.tournament}</div>
                            },
                            {
                                key: 'payer',
                                label: 'Người nộp',
                                sortable: true,
                                hideMobile: true,
                                render: (inv) => <div className="text-(--vct-text-secondary)">{inv.payer}</div>
                            },
                            {
                                key: 'type',
                                label: 'Loại',
                                sortable: true,
                                hideMobile: true,
                                render: (inv) => <VCT_Badge type={TYPE_BADGE[inv.type]?.type ?? 'neutral'} text={TYPE_BADGE[inv.type]?.label ?? inv.type} />
                            },
                            {
                                key: 'amount',
                                label: 'Số tiền',
                                sortable: true,
                                align: 'right',
                                render: (inv) => <div className="font-bold text-(--vct-text-primary)">{fmt(inv.amount)}</div>
                            },
                            {
                                key: 'due_date',
                                label: 'Hạn',
                                sortable: true,
                                align: 'center',
                                render: (inv) => <div className="text-xs text-(--vct-text-tertiary)">{inv.due_date}</div>
                            },
                            {
                                key: 'status',
                                label: 'Trạng thái',
                                sortable: true,
                                align: 'center',
                                render: (inv) => <VCT_Badge type={STATUS_BADGE[inv.status]?.type ?? 'neutral'} text={STATUS_BADGE[inv.status]?.label ?? inv.status} />
                            }
                        ]}
                        onRowClick={(item) => setSelected(item)}
                    />
                </>
            )}

            {/* ── TAB: Budgets ── */}
            {tab === 'budgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {MOCK_BUDGETS.map(b => {
                        const pct = Math.round((b.spent / b.allocated) * 100)
                        const barColor = pct > 90 ? 'var(--vct-danger)' : pct > 70 ? 'var(--vct-warning)' : 'var(--vct-success)'
                        return (
                            <div key={b.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{b.name}</div>
                                        <div className="text-xs text-(--vct-text-tertiary)">{b.category}</div>
                                    </div>
                                    <VCT_Badge type={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'} text={`${pct}%`} />
                                </div>
                                <div className="w-full h-2 bg-(--vct-bg-base) rounded-full overflow-hidden mb-2">
                                    <div className="admin-bar-fill" {...{ style: { '--_bar-width': `${pct}%`, '--_bar-color': barColor } as React.CSSProperties }} />
                                </div>
                                <div className="flex justify-between text-xs text-(--vct-text-tertiary)">
                                    <span>Đã chi: {fmt(b.spent)}</span>
                                    <span>Tổng: {fmt(b.allocated)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {tab === 'sponsors' && (
                <div className="space-y-3 mb-6">
                    <AdminDataTable
                        data={filteredSponsors}
                        isLoading={false}
                        sortBy={sortColSponsors}
                        sortDir={sortDirSponsors}
                        onSort={handleSortSponsors}
                        rowKey={s => s.id}
                        emptyTitle="Không có nhà tài trợ"
                        columns={[
                            {
                                key: 'sponsor',
                                label: 'Nhà tài trợ',
                                sortable: true,
                                render: (s) => (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-(--vct-bg-base) border border-(--vct-border-subtle) flex items-center justify-center shrink-0">
                                            <VCT_Icons.Award size={20} className="text-(--vct-info)" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-(--vct-text-primary)">{s.sponsor}</div>
                                            <div className="text-xs text-(--vct-text-tertiary)">{s.tournament}</div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'amount',
                                label: 'Gói tài trợ',
                                sortable: true,
                                render: (s) => <div className="font-black text-(--vct-text-primary)">{fmt(s.amount)}</div>
                            },
                            {
                                key: 'duration',
                                label: 'Thời hạn',
                                sortable: false,
                                hideMobile: true,
                                render: (s) => <div className="text-xs text-(--vct-text-tertiary)">{s.start_date} → {s.end_date}</div>
                            },
                            {
                                key: 'status',
                                label: 'Trạng thái',
                                sortable: true,
                                align: 'right',
                                render: (s) => <VCT_Badge type={STATUS_BADGE[s.status]?.type ?? 'neutral'} text={STATUS_BADGE[s.status]?.label ?? s.status} />
                            }
                        ]}
                    />
                </div>
            )}

            {/* ── Hoạt động gần đây ── */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                    <VCT_Icons.Activity size={18} className="text-(--vct-success)" /> Hoạt động tài chính gần đây
                </h3>
                <VCT_Timeline events={FINANCE_TIMELINE} />
            </div>

            {/* ── Invoice Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Hóa đơn ${selected?.id ?? ''}`} width={480}>
                {selected && (
                    <VCT_Stack gap={20}>
                        <div className="flex items-center gap-3 flex-wrap">
                            <VCT_Badge type={TYPE_BADGE[selected.type]?.type} text={TYPE_BADGE[selected.type]?.label} />
                            <VCT_Badge type={STATUS_BADGE[selected.status]?.type} text={STATUS_BADGE[selected.status]?.label} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Giải đấu', value: selected.tournament },
                                { label: 'Người nộp', value: selected.payer },
                                { label: 'Số tiền', value: fmt(selected.amount) },
                                { label: 'Hạn thanh toán', value: selected.due_date },
                                ...(selected.paid_date ? [{ label: 'Ngày thanh toán', value: selected.paid_date }] : []),
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                </div>
                            ))}
                        </div>
                        {(selected.status === 'pending' || selected.status === 'overdue') && (
                            <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle)">
                                <VCT_Button variant="primary" onClick={() => handleMarkPaid(selected.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Xác nhận thanh toán</VCT_Button>
                            </VCT_Stack>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
