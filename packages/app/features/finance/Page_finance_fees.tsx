'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Finance: Fee Collection (Quản lý Học phí)
// Manage tuition fees, payments, and financial reports for clubs
// ════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { VCT_Text, VCT_Card, VCT_Badge, VCT_Button } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

interface FeeRecord {
    id: string; hoTen: string; email: string; loaiPhi: string; soTien: number; kyHan: string
    trangThai: 'da_dong' | 'chua_dong' | 'qua_han' | 'mien_giam'; ngayDong?: string; ngayHetHan: string
}

const MOCK_FEES: FeeRecord[] = [
    { id: 'fee-001', hoTen: 'Nguyễn Văn An', email: 'an@email.com', loaiPhi: 'Học phí tháng', soTien: 500000, kyHan: 'Tháng 3/2026', trangThai: 'da_dong', ngayDong: '05/03/2026', ngayHetHan: '31/03/2026' },
    { id: 'fee-002', hoTen: 'Trần Thị Bình', email: 'binh@email.com', loaiPhi: 'Học phí tháng', soTien: 500000, kyHan: 'Tháng 3/2026', trangThai: 'chua_dong', ngayHetHan: '15/03/2026' },
    { id: 'fee-003', hoTen: 'Lê Hoàng Cường', email: 'cuong@email.com', loaiPhi: 'Phí thi đai', soTien: 300000, kyHan: 'Q1/2026', trangThai: 'qua_han', ngayHetHan: '01/03/2026' },
    { id: 'fee-004', hoTen: 'Phạm Minh Đức', email: 'duc@email.com', loaiPhi: 'Học phí tháng', soTien: 500000, kyHan: 'Tháng 3/2026', trangThai: 'mien_giam', ngayHetHan: '31/03/2026' },
    { id: 'fee-005', hoTen: 'Hoàng Thị Em', email: 'em@email.com', loaiPhi: 'Phí giải đấu', soTien: 200000, kyHan: 'Giải VĐQG 2026', trangThai: 'da_dong', ngayDong: '08/03/2026', ngayHetHan: '10/03/2026' },
    { id: 'fee-006', hoTen: 'Võ Quốc Phong', email: 'phong@email.com', loaiPhi: 'Học phí tháng', soTien: 500000, kyHan: 'Tháng 3/2026', trangThai: 'chua_dong', ngayHetHan: '15/03/2026' },
    { id: 'fee-007', hoTen: 'Đặng Thị Giang', email: 'giang@email.com', loaiPhi: 'Phí đồng phục', soTien: 800000, kyHan: '2026', trangThai: 'da_dong', ngayDong: '01/02/2026', ngayHetHan: '28/02/2026' },
    { id: 'fee-008', hoTen: 'Ngô Thanh Hải', email: 'hai@email.com', loaiPhi: 'Học phí quý', soTien: 1400000, kyHan: 'Q1/2026', trangThai: 'da_dong', ngayDong: '10/01/2026', ngayHetHan: '31/03/2026' },
]

const STATUS_MAP: Record<
    FeeRecord['trangThai'],
    { label: string; color: string; variant: 'success' | 'warning' | 'danger' | 'info' }
> = {
    da_dong: { label: '✅ Đã đóng', color: '#10b981', variant: 'success' },
    chua_dong: { label: '⏳ Chưa đóng', color: '#f59e0b', variant: 'warning' },
    qua_han: { label: '⚠️ Quá hạn', color: '#ef4444', variant: 'danger' },
    mien_giam: { label: '🎓 Miễn giảm', color: '#8b5cf6', variant: 'info' },
}

const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

export function Page_finance_fees() {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let list = MOCK_FEES
        if (filter !== 'all') list = list.filter(f => f.trangThai === filter)
        if (search) { const q = search.toLowerCase(); list = list.filter(f => f.hoTen.toLowerCase().includes(q) || f.loaiPhi.toLowerCase().includes(q)) }
        return list
    }, [filter, search])

    const stats = useMemo(() => ({
        total: MOCK_FEES.reduce((s, f) => s + f.soTien, 0),
        collected: MOCK_FEES.filter(f => f.trangThai === 'da_dong').reduce((s, f) => s + f.soTien, 0),
        pending: MOCK_FEES.filter(f => f.trangThai === 'chua_dong').length,
        overdue: MOCK_FEES.filter(f => f.trangThai === 'qua_han').length,
    }), [])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <VCT_Text as="h1" variant="h1" className="text-2xl">Quản Lý Học Phí & Thu Chi</VCT_Text>
                    <VCT_Text color="muted" className="text-sm mt-1">Theo dõi thu phí, công nợ và báo cáo tài chính CLB</VCT_Text>
                </div>
                <div className="flex gap-2">
                    <VCT_Button variant="outline" size="sm"><VCT_Icons.Download size={14} /> Xuất Excel</VCT_Button>
                    <VCT_Button variant="primary" size="sm"><VCT_Icons.Plus size={14} /> Tạo phiếu thu</VCT_Button>
                </div>
            </div>

            {/* KPIs */}
            <VCT_StatRow items={[
                { label: 'Tổng phải thu', value: formatVND(stats.total), icon: <VCT_Icons.DollarSign size={18} />, color: '#3b82f6' },
                { label: 'Đã thu', value: formatVND(stats.collected), icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981', sub: `${Math.round(stats.collected / stats.total * 100)}%` },
                { label: 'Chưa đóng', value: stats.pending.toString(), icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Quá hạn', value: stats.overdue.toString(), icon: <VCT_Icons.AlertCircle size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-0" />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, loại phí..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5">
                    {[{ v: 'all', l: 'Tất cả' }, { v: 'da_dong', l: '✅ Đã đóng' }, { v: 'chua_dong', l: '⏳ Chưa đóng' }, { v: 'qua_han', l: '⚠️ Quá hạn' }].map(f => (
                        <button key={f.v} onClick={() => setFilter(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>
                            {f.l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-vct-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-vct-elevated">
                        <tr>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Họ tên</th>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Loại phí</th>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Kỳ hạn</th>
                            <th className="text-right px-4 py-3 font-bold text-vct-text-muted">Số tiền</th>
                            <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Trạng thái</th>
                            <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Hạn nộp</th>
                            <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(f => {
                            const st = STATUS_MAP[f.trangThai]
                            return (
                                <tr key={f.id} className="border-t border-vct-border hover:bg-vct-elevated/50 transition">
                                    <td className="px-4 py-3">
                                        <div className="font-bold">{f.hoTen}</div>
                                        <div className="text-xs text-vct-text-muted">{f.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-vct-text-muted">{f.loaiPhi}</td>
                                    <td className="px-4 py-3 text-vct-text-muted">{f.kyHan}</td>
                                    <td className="px-4 py-3 text-right font-bold" style={{ color: st?.color }}>{formatVND(f.soTien)}</td>
                                    <td className="px-4 py-3 text-center"><VCT_Badge type={st?.variant} text={st?.label} /></td>
                                    <td className="px-4 py-3 text-vct-text-muted text-xs">{f.ngayDong ? `Đã nộp: ${f.ngayDong}` : `Hạn: ${f.ngayHetHan}`}</td>
                                    <td className="px-4 py-3 text-center">
                                        {f.trangThai === 'chua_dong' || f.trangThai === 'qua_han' ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <button className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/25 transition">Ghi nhận</button>
                                                <button className="rounded-md bg-blue-500/15 px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-500/25 transition">Nhắc nhở</button>
                                            </div>
                                        ) : (
                                            <button className="rounded-md bg-vct-input px-2 py-1 text-xs font-bold text-vct-text-muted hover:bg-vct-border transition">Chi tiết</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* QR Payment Section */}
            <VCT_Card className="p-6">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="h-32 w-32 rounded-xl bg-vct-elevated border-2 border-dashed border-vct-border flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-3xl mb-1">📱</div>
                            <div className="text-[10px] text-vct-text-muted font-bold">QR Thanh toán</div>
                        </div>
                    </div>
                    <div>
                        <VCT_Text variant="h2" className="text-lg">Thanh toán qua QR Code</VCT_Text>
                        <VCT_Text color="muted" className="text-sm mt-1">Hỗ trợ VNPay, MoMo, ZaloPay, chuyển khoản ngân hàng.</VCT_Text>
                        <VCT_Text color="muted" className="text-sm">Tự động đối soát khi nhận thanh toán thành công.</VCT_Text>
                        <VCT_Button variant="outline" size="sm" className="mt-3"><VCT_Icons.Settings size={14} /> Cấu hình cổng thanh toán</VCT_Button>
                    </div>
                </div>
            </VCT_Card>
        </VCT_PageContainer>
    )
}
