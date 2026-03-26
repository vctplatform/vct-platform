'use client'

import React, { useState } from 'react'
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Badge, VCT_Button } from '@vct/ui'

// ════════════════════════════════════════
// FEDERATION — PHÍ & LỆ PHÍ
// ════════════════════════════════════════

interface FeeItem {
    id: string; name: string; category: string
    amount: number; unit: string; status: 'active' | 'draft' | 'expired'
    effective_from: string; note: string
}

const SEED: FeeItem[] = [
    { id: '1', name: 'Phí hội viên CLB (hàng năm)', category: 'Hội viên', amount: 5_000_000, unit: 'CLB/năm', status: 'active', effective_from: '2026-01-01', note: 'Theo QĐ-2025/045' },
    { id: '2', name: 'Phí đăng ký thành lập CLB', category: 'Đăng ký', amount: 10_000_000, unit: 'lần', status: 'active', effective_from: '2026-01-01', note: 'Bao gồm xét duyệt + cấp giấy phép' },
    { id: '3', name: 'Lệ phí thi thăng đai (Đai màu)', category: 'Thi đai', amount: 500_000, unit: 'VĐV/lần', status: 'active', effective_from: '2026-01-01', note: 'Áp dụng cấp 8 → cấp 1' },
    { id: '4', name: 'Lệ phí thi thăng đai (Đai đen)', category: 'Thi đai', amount: 2_000_000, unit: 'VĐV/lần', status: 'active', effective_from: '2026-01-01', note: 'Yêu cầu hội đồng chấm thi quốc gia' },
    { id: '5', name: 'Phí cấp giấy phép HLV', category: 'Chứng chỉ', amount: 3_000_000, unit: 'người/lần', status: 'active', effective_from: '2026-01-01', note: 'Hiệu lực 2 năm' },
    { id: '6', name: 'Phí cấp giấy phép Trọng tài', category: 'Chứng chỉ', amount: 2_500_000, unit: 'người/lần', status: 'active', effective_from: '2026-01-01', note: 'Hiệu lực 1 năm' },
    { id: '7', name: 'Phí đăng ký tham gia Giải QG', category: 'Giải đấu', amount: 1_000_000, unit: 'VĐV/nội dung', status: 'active', effective_from: '2026-01-01', note: 'Áp dụng giải cấp quốc gia' },
    { id: '8', name: 'Phí thẻ VĐV (cấp mới)', category: 'Đăng ký', amount: 200_000, unit: 'VĐV', status: 'active', effective_from: '2026-01-01', note: 'Thẻ nhựa có mã QR' },
]

const CATEGORY_COLORS: Record<string, string> = {
    'Hội viên': 'var(--vct-info)', 'Đăng ký': 'var(--vct-info)', 'Thi đai': 'var(--vct-warning)',
    'Chứng chỉ': 'var(--vct-success)', 'Giải đấu': 'var(--vct-danger)',
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

export function Page_federation_fees() {
    const [catFilter, setCatFilter] = useState('')
    const categories = Array.from(new Set(SEED.map(f => f.category)))
    const filtered = catFilter ? SEED.filter(f => f.category === catFilter) : SEED

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero title="Biểu phí & Lệ phí" subtitle="Bảng phí chính thức của Liên đoàn — hội viên, thi đai, chứng chỉ, giải đấu"
                icon={<VCT_Icons.CreditCard size={24} />} gradientFrom="rgba(245, 158, 11, 0.1)" gradientTo="rgba(239, 68, 68, 0.06)" />

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {categories.map(cat => (
                    <div key={cat} className="rounded-2xl border border-vct-border bg-vct-elevated px-4 py-3 cursor-pointer hover:border-vct-accent/50 transition-colors"
                        onClick={() => setCatFilter(catFilter === cat ? '' : cat)}>
                        <div className="text-xs text-vct-text-muted mb-1">{cat}</div>
                        <div className="text-lg font-bold" style={{ color: CATEGORY_COLORS[cat] }}>{SEED.filter(f => f.category === cat).length}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-6 items-center">
                <div className="flex gap-1 bg-vct-elevated p-1 rounded-2xl border border-vct-border">
                    <button onClick={() => setCatFilter('')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${!catFilter ? 'bg-amber-500/15 text-amber-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                        Tất cả ({SEED.length})
                    </button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCatFilter(cat)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${catFilter === cat ? 'bg-amber-500/15 text-amber-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                            {cat} ({SEED.filter(f => f.category === cat).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Fee Table */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-vct-border">
                            {['Khoản phí', 'Phân loại', 'Số tiền', 'Đơn vị', 'Hiệu lực', 'Ghi chú'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-vct-text-muted text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(fee => (
                            <tr key={fee.id} className="border-b border-vct-border/50 hover:bg-vct-bg/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-semibold text-vct-text">{fee.name}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: (CATEGORY_COLORS[fee.category] || '#666') + '15', color: CATEGORY_COLORS[fee.category] }}>{fee.category}</span>
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-amber-400">{fmt(fee.amount)}</td>
                                <td className="px-4 py-3 text-xs text-vct-text-muted">{fee.unit}</td>
                                <td className="px-4 py-3 text-xs text-vct-text-muted">{fee.effective_from}</td>
                                <td className="px-4 py-3 text-xs text-vct-text-muted">{fee.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </VCT_PageContainer>
    )
}

export default Page_federation_fees
