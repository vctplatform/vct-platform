'use client'

import React, { useState, useMemo } from 'react'
import { useApiQuery } from '../hooks/useApiQuery'
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Badge, VCT_Button, VCT_EmptyState } from '@vct/ui'
import { exportToExcel } from '../../utils/exportUtils'

// ════════════════════════════════════════
// FEDERATION — HÓA ĐƠN THU / CHI
// ════════════════════════════════════════

type InvoiceType = 'income' | 'expense'
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

interface Invoice {
    id: string; number: string; type: InvoiceType
    title: string; counterpart: string; amount: number
    status: InvoiceStatus; issued_date: string; due_date: string
}

const STATUS_MAP: Record<InvoiceStatus, { label: string; type: 'success' | 'warning' | 'info' | 'neutral' | 'error' }> = {
    draft: { label: 'Bản nháp', type: 'neutral' },
    sent: { label: 'Đã gửi', type: 'info' },
    paid: { label: 'Đã thanh toán', type: 'success' },
    overdue: { label: 'Quá hạn', type: 'error' },
    cancelled: { label: 'Đã hủy', type: 'neutral' },
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

const SEED: Invoice[] = [
    { id: 'INV-001', number: 'HD-2026/001', type: 'income', title: 'Thu phí hội viên Quý I/2026', counterpart: 'Toàn quốc', amount: 600_000_000, status: 'paid', issued_date: '2026-01-15', due_date: '2026-02-15' },
    { id: 'INV-002', number: 'HD-2026/002', type: 'income', title: 'Tài trợ Công ty ABC', counterpart: 'Công ty ABC', amount: 500_000_000, status: 'paid', issued_date: '2026-01-20', due_date: '2026-02-20' },
    { id: 'INV-003', number: 'HD-2026/003', type: 'expense', title: 'Chi phí tổ chức Giải VĐQG', counterpart: 'BTC Giải VĐQG', amount: 180_000_000, status: 'paid', issued_date: '2026-02-01', due_date: '2026-02-28' },
    { id: 'INV-004', number: 'HD-2026/004', type: 'income', title: 'Phí đăng ký CLB mới (15 CLB)', counterpart: '15 CLB', amount: 75_000_000, status: 'sent', issued_date: '2026-03-01', due_date: '2026-03-31' },
    { id: 'INV-005', number: 'HD-2026/005', type: 'expense', title: 'Chi lương nhân sự Tháng 3', counterpart: 'Nhân sự LĐ', amount: 120_000_000, status: 'draft', issued_date: '2026-03-25', due_date: '2026-03-31' },
    { id: 'INV-006', number: 'HD-2026/006', type: 'expense', title: 'Chi đối ngoại — Đoàn tham dự SEA Games', counterpart: 'Ban Đối ngoại', amount: 240_000_000, status: 'overdue', issued_date: '2026-02-15', due_date: '2026-03-15' },
]

export function Page_federation_invoices() {
    const { data: apiData, isLoading } = useApiQuery<Invoice[]>('/api/v1/federation/finance/invoices')
    const invoices = apiData || SEED

    const [typeFilter, setTypeFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')

    const filtered = useMemo(() => {
        let data = invoices
        if (typeFilter) data = data.filter(i => i.type === typeFilter)
        if (statusFilter) data = data.filter(i => i.status === statusFilter)
        return data
    }, [invoices, typeFilter, statusFilter])

    const totalIncome = invoices.filter(i => i.type === 'income' && i.status === 'paid').reduce((s, i) => s + i.amount, 0)
    const totalExpense = invoices.filter(i => i.type === 'expense' && i.status === 'paid').reduce((s, i) => s + i.amount, 0)

    const handleExport = () => {
        const data = filtered.map((i, idx) => ({
            'STT': idx + 1, 'Số HĐ': i.number, 'Loại': i.type === 'income' ? 'Thu' : 'Chi',
            'Nội dung': i.title, 'Đối tác': i.counterpart, 'Số tiền': i.amount,
            'Trạng thái': STATUS_MAP[i.status]?.label, 'Ngày lập': i.issued_date, 'Hạn': i.due_date,
        }))
        exportToExcel(data, 'hoa_don_lien_doan')
    }

    const kpis = [
        { label: 'Tổng hóa đơn', value: invoices.length, icon: <VCT_Icons.FileText size={16} />, color: 'var(--vct-info)' },
        { label: 'Đã thu', value: fmt(totalIncome), icon: <VCT_Icons.TrendingUp size={16} />, color: 'var(--vct-success)' },
        { label: 'Đã chi', value: fmt(totalExpense), icon: <VCT_Icons.TrendingDown size={16} />, color: 'var(--vct-danger)' },
        { label: 'Quá hạn', value: invoices.filter(i => i.status === 'overdue').length, icon: <VCT_Icons.AlertCircle size={16} />, color: 'var(--vct-warning)' },
    ]

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero title="Hóa đơn Thu / Chi" subtitle="Quản lý hóa đơn, phiếu thu, phiếu chi của Liên đoàn"
                icon={<VCT_Icons.FileText size={24} />} gradientFrom="rgba(139, 92, 246, 0.1)" gradientTo="rgba(59, 130, 246, 0.06)" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="rounded-2xl border border-vct-border bg-vct-elevated px-4 py-4">
                        <div className="flex items-center gap-2 text-xs text-vct-text-muted mb-1">
                            <span style={{ color: kpi.color }}>{kpi.icon}</span> {kpi.label}
                        </div>
                        <div className="text-xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="bg-vct-elevated border border-vct-border text-vct-text text-sm rounded-xl px-3 py-2.5">
                    <option value="">Tất cả loại</option>
                    <option value="income">Thu</option>
                    <option value="expense">Chi</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-vct-elevated border border-vct-border text-vct-text text-sm rounded-xl px-3 py-2.5">
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div className="ml-auto">
                    <VCT_Button variant="secondary" onClick={handleExport}>
                        <VCT_Icons.Download size={16} className="mr-2" /> Xuất Excel
                    </VCT_Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <VCT_EmptyState icon={<VCT_Icons.FileText size={48} />} title="Không có hóa đơn" description="Thay đổi bộ lọc để xem." />
            ) : (
                <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-vct-border">
                                {['Số HĐ', 'Nội dung', 'Đối tác', 'Loại', 'Số tiền', 'Hạn TT', 'Trạng thái'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-vct-text-muted text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(inv => {
                                const st = STATUS_MAP[inv.status]
                                return (
                                    <tr key={inv.id} className="border-b border-vct-border/50 hover:bg-vct-bg/50 transition-colors cursor-pointer">
                                        <td className="px-4 py-3 text-xs font-mono text-vct-text-muted">{inv.number}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-vct-text">{inv.title}</td>
                                        <td className="px-4 py-3 text-xs text-vct-text-muted">{inv.counterpart}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-[11px] font-bold ${inv.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {inv.type === 'income' ? '↑ Thu' : '↓ Chi'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold" style={{ color: inv.type === 'income' ? 'var(--vct-success)' : 'var(--vct-danger)' }}>{fmt(inv.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-vct-text-muted">{inv.due_date}</td>
                                        <td className="px-4 py-3"><VCT_Badge text={st.label} type={st.type} /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}

export default Page_federation_invoices
