'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_KpiCard, VCT_Badge, VCT_Tabs
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const MOCK_TRANSACTIONS = [
    { id: 'TRX-001', date: '2024-03-09 10:30', desc: 'Đóng phí liên đoàn quý 1', amount: 5000000, type: 'income', status: 'completed', source: 'Liên đoàn Võ thuật TP.HCM' },
    { id: 'TRX-002', date: '2024-03-08 14:15', desc: 'Chi phí mua sắm thảm tập', amount: 12000000, type: 'expense', status: 'completed', source: 'Cửa hàng Thể thao ABC' },
    { id: 'TRX-003', date: '2024-03-05 09:00', desc: 'Phí đăng ký thi đấu giải trẻ', amount: 2500000, type: 'income', status: 'pending', source: 'CLB Nguyễn Trãi' },
    { id: 'TRX-004', date: '2024-03-01 16:45', desc: 'Thuê sân đấu tháng 3', amount: 8000000, type: 'expense', status: 'completed', source: 'Nhà thi đấu Phú Thọ' },
    { id: 'TRX-005', date: '2024-02-28 11:20', desc: 'Tài trợ từ nhãn hàng', amount: 50000000, type: 'income', status: 'completed', source: 'Công ty RedBull' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_finance = () => {
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('all')

    const filtered = useMemo(() => {
        let v = MOCK_TRANSACTIONS
        if (tab !== 'all') {
            v = v.filter(t => t.type === tab)
        }
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.desc.toLowerCase().includes(q) || t.source.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
        }
        return v
    }, [search, tab])

    const totalIncome = MOCK_TRANSACTIONS.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
    const totalExpense = MOCK_TRANSACTIONS.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
    const balance = totalIncome - totalExpense

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản Lý Tài Chính</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý thu chi, quỹ liên đoàn, hội phí và ngân sách giải đấu.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất Báo Cáo</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Thêm Giao Dịch</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <div className="vct-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <VCT_KpiCard
                    label="Tổng Quỹ Hiện Tại"
                    value={`${(balance / 1000000).toFixed(1)}M`}
                    icon={<VCT_Icons.DollarSign size={24} />}
                    color="#0ea5e9"
                />
                <VCT_KpiCard
                    label="Tổng Thu (Tháng)"
                    value={`${(totalIncome / 1000000).toFixed(1)}M`}
                    icon={<VCT_Icons.TrendingUp size={24} />}
                    color="#10b981"
                />
                <VCT_KpiCard
                    label="Tổng Chi (Tháng)"
                    value={`${(totalExpense / 1000000).toFixed(1)}M`}
                    icon={<VCT_Icons.TrendingDown size={24} />}
                    color="#ef4444"
                />
                <VCT_KpiCard
                    label="Chờ Thanh Toán"
                    value="2.5M"
                    icon={<VCT_Icons.Clock size={24} />}
                    color="#f59e0b"
                />
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#10b98120] to-transparent border border-[#10b98140] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#10b981] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#10b98140]">
                        <VCT_Icons.ArrowDownLeft size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Tạo Phiếu Thu</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Ghi nhận khoản thu mới</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#ef444420] to-transparent border border-[#ef444440] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#ef4444] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#ef4444] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#ef444440]">
                        <VCT_Icons.ArrowUpRight size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Tạo Phiếu Chi</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Ghi nhận khoản chi mới</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#8b5cf620] to-transparent border border-[#8b5cf640] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-[#8b5cf6] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#8b5cf640]">
                        <VCT_Icons.FileText size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-lg">Hội Phí & Phí Thi</div>
                        <div className="text-sm text-[var(--vct-text-secondary)]">Quản lý các đợt thu phí</div>
                    </div>
                </div>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--vct-border-subtle)] pb-4">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả giao dịch' },
                        { key: 'income', label: 'Phiếu Thu' },
                        { key: 'expense', label: 'Phiếu Chi' }
                    ]}
                    activeTab={tab}
                    onChange={setTab}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm mã GD, mô tả, đối tác..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── LIST ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4 w-40">Mã GD</th>
                            <th className="p-4 w-48">Thời gian</th>
                            <th className="p-4">Diễn giải</th>
                            <th className="p-4">Đối tác / Đơn vị</th>
                            <th className="p-4 text-right">Số tiền (VNĐ)</th>
                            <th className="p-4 w-32">Trạng thái</th>
                            <th className="p-4 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {filtered.map(trx => (
                            <tr key={trx.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                <td className="p-4 font-mono text-sm text-[var(--vct-accent-cyan)] font-bold">
                                    {trx.id}
                                </td>
                                <td className="p-4 text-sm text-[var(--vct-text-secondary)]">
                                    <div className="flex items-center gap-2">
                                        <VCT_Icons.Calendar size={14} />
                                        {trx.date}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-semibold text-sm text-[var(--vct-text-primary)] line-clamp-1">{trx.desc}</div>
                                </td>
                                <td className="p-4 text-sm text-[var(--vct-text-secondary)]">
                                    {trx.source}
                                </td>
                                <td className="p-4 text-right">
                                    {trx.type === 'income' ? (
                                        <div className="font-bold text-[#10b981] bg-[#10b98110] px-2 py-1 rounded inline-block">
                                            + {trx.amount.toLocaleString()}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-[#ef4444] bg-[#ef444410] px-2 py-1 rounded inline-block">
                                            - {trx.amount.toLocaleString()}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {trx.status === 'completed' && <VCT_Badge type="success" text="Hoàn tất" />}
                                    {trx.status === 'pending' && <VCT_Badge type="warning" text="Chờ duyệt" />}
                                </td>
                                <td className="p-4 text-center">
                                    <VCT_Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" icon={<VCT_Icons.MoreVertical size={16} />} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
