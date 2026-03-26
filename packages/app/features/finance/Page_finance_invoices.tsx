'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
interface Invoice {
    id: string; code: string; type: 'receipt' | 'payment'; date: string; dueDate?: string
    partner: string; description: string; amount: number; status: 'draft' | 'pending' | 'approved' | 'completed' | 'rejected'
    items: { name: string; qty: number; unitPrice: number }[]
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    draft: { label: 'Nháp', color: 'var(--vct-text-tertiary)' },
    pending: { label: 'Chờ duyệt', color: 'var(--vct-warning)' },
    approved: { label: 'Đã duyệt', color: 'var(--vct-info)' },
    completed: { label: 'Hoàn tất', color: 'var(--vct-success)' },
    rejected: { label: 'Từ chối', color: 'var(--vct-danger)' },
}

const INVOICES: Invoice[] = [
    { id: 'iv1', code: 'PT-2026-001', type: 'receipt', date: '2026-03-09', partner: 'CLB Sơn Long TP.HCM', description: 'Hội phí liên đoàn Q1/2026', amount: 15000000, status: 'completed', items: [{ name: 'Hội phí quý 1', qty: 1, unitPrice: 15000000 }] },
    { id: 'iv2', code: 'PC-2026-012', type: 'payment', date: '2026-03-08', partner: 'Nhà thi đấu Phú Thọ', description: 'Thuê sân tổ chức giải Trẻ QG', amount: 25000000, status: 'approved', items: [{ name: 'Thuê sân 3 ngày', qty: 3, unitPrice: 8000000 }, { name: 'Phí điện nước', qty: 1, unitPrice: 1000000 }] },
    { id: 'iv3', code: 'PT-2026-002', type: 'receipt', date: '2026-03-05', partner: 'Đoàn Bình Định', description: 'Phí đăng ký giải VĐQG 2026', amount: 8500000, status: 'pending', items: [{ name: 'Phí ĐK đối kháng', qty: 12, unitPrice: 500000 }, { name: 'Phí ĐK quyền', qty: 5, unitPrice: 500000 }] },
    { id: 'iv4', code: 'PC-2026-013', type: 'payment', date: '2026-03-04', dueDate: '2026-03-20', partner: 'Công ty in ấn Thăng Long', description: 'In bằng khen, giấy chứng nhận', amount: 4200000, status: 'draft', items: [{ name: 'In bằng khen A4', qty: 200, unitPrice: 15000 }, { name: 'In giấy CN A5', qty: 100, unitPrice: 12000 }] },
    { id: 'iv5', code: 'PT-2026-003', type: 'receipt', date: '2026-03-01', partner: 'Công ty RedBull VN', description: 'Tài trợ giải VĐQG 2026', amount: 100000000, status: 'completed', items: [{ name: 'Tài trợ Kim cương', qty: 1, unitPrice: 100000000 }] },
    { id: 'iv6', code: 'PC-2026-014', type: 'payment', date: '2026-02-28', partner: 'Công ty TNHH Thể thao ABC', description: 'Mua thảm thi đấu', amount: 35000000, status: 'completed', items: [{ name: 'Thảm thi đấu 10x10m', qty: 5, unitPrice: 7000000 }] },
]

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
export function Page_finance_invoices() {
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const [preview, setPreview] = useState<Invoice | null>(null)

    const filtered = useMemo(() => {
        let list = INVOICES
        if (tab === 'receipt') list = list.filter(i => i.type === 'receipt')
        else if (tab === 'payment') list = list.filter(i => i.type === 'payment')
        else if (tab !== 'all') list = list.filter(i => i.status === tab)
        if (search) { const q = search.toLowerCase(); list = list.filter(i => i.code.toLowerCase().includes(q) || i.partner.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }
        return list
    }, [tab, search])

    const totalReceipt = INVOICES.filter(i => i.type === 'receipt' && i.status === 'completed').reduce((s, i) => s + i.amount, 0)
    const totalPayment = INVOICES.filter(i => i.type === 'payment' && i.status === 'completed').reduce((s, i) => s + i.amount, 0)
    const pendingCount = INVOICES.filter(i => i.status === 'pending').length

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Quản Lý Hóa Đơn</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Phiếu thu, phiếu chi và theo dõi thanh toán</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg border border-vct-border px-3 py-2 text-xs font-bold text-vct-text-muted hover:border-vct-accent transition">
                        <VCT_Icons.Download size={14} /> Xuất Excel
                    </button>
                    <button className="flex items-center gap-2 rounded-xl bg-vct-accent px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition">
                        <VCT_Icons.Plus size={16} /> Tạo hóa đơn
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng hóa đơn', v: INVOICES.length, i: '📄', c: 'var(--vct-accent-cyan)' },
                { l: 'Tổng thu (HT)', v: `${(totalReceipt / 1e6).toFixed(0)}M`, i: '📈', c: 'var(--vct-success)' },
                { l: 'Tổng chi (HT)', v: `${(totalPayment / 1e6).toFixed(0)}M`, i: '📉', c: 'var(--vct-danger)' },
                { l: 'Chờ duyệt', v: pendingCount, i: '⏳', c: 'var(--vct-warning)' },
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-4 text-center">
                        <div className="text-xl mb-1">{s.i}</div><div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted mt-1">{s.l}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 flex-wrap">
                    {[{ v: 'all', l: 'Tất cả' }, { v: 'receipt', l: '📈 Phiếu thu' }, { v: 'payment', l: '📉 Phiếu chi' }, { v: 'pending', l: '⏳ Chờ duyệt' }, { v: 'draft', l: '📝 Nháp' }].map(f => (
                        <button key={f.v} onClick={() => setTab(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${tab === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                    ))}
                </div>
                <div className="relative w-full max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã HĐ, đối tác..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-vct-input border-b border-vct-border text-[11px] uppercase tracking-wider text-vct-text-muted font-bold">
                        <th className="p-4 w-36">Mã HĐ</th><th className="p-4 w-24">Loại</th><th className="p-4 w-28">Ngày</th>
                        <th className="p-4">Đối tác</th><th className="p-4">Diễn giải</th>
                        <th className="p-4 text-right w-36">Số tiền</th><th className="p-4 w-28">Trạng thái</th><th className="p-4 w-16" />
                    </tr></thead>
                    <tbody className="divide-y divide-vct-border">
                        {filtered.map(inv => {
                            const st = STATUS_CFG[inv.status]!
                            return (
                                <tr key={inv.id} className="hover:bg-vct-input/50 transition cursor-pointer group" onClick={() => setPreview(inv)}>
                                    <td className="p-4 font-mono text-sm font-bold text-vct-accent">{inv.code}</td>
                                    <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.type === 'receipt' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>{inv.type === 'receipt' ? 'Thu' : 'Chi'}</span></td>
                                    <td className="p-4 text-sm text-vct-text-muted">{inv.date}</td>
                                    <td className="p-4 text-sm font-bold">{inv.partner}</td>
                                    <td className="p-4 text-sm text-vct-text-muted truncate max-w-[200px]">{inv.description}</td>
                                    <td className="p-4 text-right"><span className={`font-bold text-sm ${inv.type === 'receipt' ? 'text-emerald-500' : 'text-red-500'}`}>{inv.type === 'receipt' ? '+' : '-'}{inv.amount.toLocaleString()}đ</span></td>
                                    <td className="p-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${st.color}20`, color: st.color }}>{st.label}</span></td>
                                    <td className="p-4"><button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-vct-input transition"><VCT_Icons.MoreVertical size={16} /></button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {preview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreview(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-lg rounded-2xl border border-vct-border bg-vct-elevated p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-black text-lg">{preview.code}</h2>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${preview.type === 'receipt' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>{preview.type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'}</span>
                                </div>
                                <button onClick={() => setPreview(null)} className="p-1 rounded-lg hover:bg-vct-input"><VCT_Icons.X size={20} /></button>
                            </div>
                            <div className="grid gap-2 mb-4 text-sm">
                                <div className="flex justify-between p-2 rounded bg-vct-input"><span className="text-vct-text-muted">Đối tác</span><span className="font-bold">{preview.partner}</span></div>
                                <div className="flex justify-between p-2 rounded bg-vct-input"><span className="text-vct-text-muted">Ngày</span><span className="font-bold">{preview.date}</span></div>
                                <div className="flex justify-between p-2 rounded bg-vct-input"><span className="text-vct-text-muted">Diễn giải</span><span className="font-bold">{preview.description}</span></div>
                            </div>
                            <table className="w-full text-sm mb-4">
                                <thead><tr className="border-b border-vct-border text-[10px] text-vct-text-muted uppercase"><th className="pb-2 text-left">Hạng mục</th><th className="pb-2 text-center w-16">SL</th><th className="pb-2 text-right w-28">Đơn giá</th><th className="pb-2 text-right w-28">Thành tiền</th></tr></thead>
                                <tbody>{preview.items.map((it, i) => (
                                    <tr key={i} className="border-b border-vct-border/50"><td className="py-2">{it.name}</td><td className="py-2 text-center">{it.qty}</td><td className="py-2 text-right text-vct-text-muted">{it.unitPrice.toLocaleString()}</td><td className="py-2 text-right font-bold">{(it.qty * it.unitPrice).toLocaleString()}</td></tr>
                                ))}</tbody>
                            </table>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-vct-accent/10 border border-vct-accent/30 mb-4">
                                <span className="font-bold text-sm">Tổng cộng</span>
                                <span className="text-xl font-black text-vct-accent">{preview.amount.toLocaleString()}đ</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 rounded-lg bg-vct-accent py-2.5 text-sm font-bold text-white hover:brightness-110 transition flex items-center justify-center gap-1.5"><VCT_Icons.Download size={14} /> Xuất PDF</button>
                                <button onClick={() => setPreview(null)} className="rounded-lg border border-vct-border px-4 py-2.5 text-sm font-bold text-vct-text-muted hover:bg-vct-input transition">Đóng</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
