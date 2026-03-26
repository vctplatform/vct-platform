'use client'

import React, { useState } from 'react'
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Badge } from '@vct/ui'

// ════════════════════════════════════════
// FEDERATION — NGÂN SÁCH
// ════════════════════════════════════════

interface BudgetItem {
    id: string; name: string; category: string
    planned: number; actual: number; status: 'on_track' | 'over' | 'under'
}

const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`
    return n.toLocaleString('vi-VN')
}

const CATEGORY_COLORS: Record<string, string> = {
    'Nhân sự': 'var(--vct-info)', 'Giải đấu': 'var(--vct-danger)', 'Đào tạo': 'var(--vct-warning)',
    'Đối ngoại': 'var(--vct-success)', 'Văn phòng': 'var(--vct-accent-cyan)', 'Truyền thông': 'var(--vct-accent-pink)',
    'Dự phòng': 'var(--vct-text-tertiary)',
}

const SEED: BudgetItem[] = [
    { id: '1', name: 'Lương & phúc lợi nhân sự', category: 'Nhân sự', planned: 1_440_000_000, actual: 1_200_000_000, status: 'on_track' },
    { id: '2', name: 'Giải Vô địch Quốc gia', category: 'Giải đấu', planned: 800_000_000, actual: 0, status: 'on_track' },
    { id: '3', name: 'Giải trẻ các khu vực', category: 'Giải đấu', planned: 500_000_000, actual: 180_000_000, status: 'on_track' },
    { id: '4', name: 'Tập huấn HLV & Trọng tài', category: 'Đào tạo', planned: 360_000_000, actual: 120_000_000, status: 'on_track' },
    { id: '5', name: 'Thi thăng đai 3 đợt', category: 'Đào tạo', planned: 240_000_000, actual: 0, status: 'on_track' },
    { id: '6', name: 'Đoàn tham dự SEA Games', category: 'Đối ngoại', planned: 480_000_000, actual: 350_000_000, status: 'over' },
    { id: '7', name: 'Hợp tác quốc tế', category: 'Đối ngoại', planned: 200_000_000, actual: 80_000_000, status: 'on_track' },
    { id: '8', name: 'Thuê văn phòng & vận hành', category: 'Văn phòng', planned: 360_000_000, actual: 300_000_000, status: 'on_track' },
    { id: '9', name: 'Website, app & truyền thông', category: 'Truyền thông', planned: 200_000_000, actual: 150_000_000, status: 'on_track' },
    { id: '10', name: 'Quỹ dự phòng', category: 'Dự phòng', planned: 300_000_000, actual: 0, status: 'under' },
]

export function Page_federation_budget() {
    const [catFilter, setCatFilter] = useState('')
    const categories = Array.from(new Set(SEED.map(b => b.category)))
    const filtered = catFilter ? SEED.filter(b => b.category === catFilter) : SEED

    const totalPlanned = SEED.reduce((s, b) => s + b.planned, 0)
    const totalActual = SEED.reduce((s, b) => s + b.actual, 0)
    const pctUsed = Math.round((totalActual / totalPlanned) * 100)

    const kpis = [
        { label: 'Tổng ngân sách', value: fmt(totalPlanned), color: 'var(--vct-info)' },
        { label: 'Đã sử dụng', value: fmt(totalActual), color: 'var(--vct-warning)' },
        { label: 'Còn lại', value: fmt(totalPlanned - totalActual), color: 'var(--vct-success)' },
        { label: '% Thực hiện', value: `${pctUsed}%`, color: pctUsed > 90 ? 'var(--vct-danger)' : 'var(--vct-info)' },
    ]

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero title="Quản lý Ngân sách" subtitle="Kế hoạch ngân sách năm 2026 — theo dõi dự toán vs thực chi"
                icon={<VCT_Icons.BarChart2 size={24} />} gradientFrom="rgba(59, 130, 246, 0.1)" gradientTo="rgba(16, 185, 129, 0.06)" />

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="rounded-2xl border border-vct-border bg-vct-elevated px-4 py-4">
                        <div className="text-xs text-vct-text-muted mb-1">{kpi.label}</div>
                        <div className="text-xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Overall Progress */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-vct-text">Tiến độ ngân sách tổng thể</span>
                    <span className="text-sm font-bold" style={{ color: pctUsed > 90 ? 'var(--vct-danger)' : 'var(--vct-info)' }}>{pctUsed}%</span>
                </div>
                <div className="h-4 rounded-full bg-vct-bg overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctUsed}%`, background: pctUsed > 90 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                </div>
                <div className="flex justify-between text-[11px] text-vct-text-muted mt-1">
                    <span>Đã chi: {fmt(totalActual)}</span>
                    <span>Còn lại: {fmt(totalPlanned - totalActual)}</span>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 bg-vct-elevated p-1 rounded-2xl border border-vct-border w-fit mb-6 flex-wrap">
                <button onClick={() => setCatFilter('')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${!catFilter ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                    Tất cả
                </button>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setCatFilter(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${catFilter === cat ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Budget Table */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-vct-border">
                            {['Hạng mục', 'Phân loại', 'Dự toán', 'Thực chi', 'Tiến độ', 'Tình trạng'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-vct-text-muted text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => {
                            const pct = item.planned > 0 ? Math.round((item.actual / item.planned) * 100) : 0
                            const catColor = CATEGORY_COLORS[item.category] || 'var(--vct-text-tertiary)'
                            return (
                                <tr key={item.id} className="border-b border-vct-border/50 hover:bg-vct-bg/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-vct-text">{item.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: catColor + '15', color: catColor }}>{item.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-vct-text">{fmt(item.planned)}</td>
                                    <td className="px-4 py-3 text-sm font-bold" style={{ color: item.status === 'over' ? 'var(--vct-danger)' : 'var(--vct-info)' }}>{fmt(item.actual)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full bg-vct-bg overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: item.status === 'over' ? 'var(--vct-danger)' : catColor }} />
                                            </div>
                                            <span className="text-xs font-bold text-vct-text-muted w-8">{pct}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <VCT_Badge text={item.status === 'on_track' ? 'Bình thường' : item.status === 'over' ? 'Vượt mức' : 'Chưa chi'} type={item.status === 'on_track' ? 'success' : item.status === 'over' ? 'error' : 'neutral'} />
                                    </td>
                                </tr>
                            )
                        })}
                        {/* Total row */}
                        <tr className="border-t-2 border-vct-border bg-vct-bg/30">
                            <td className="px-4 py-3.5 text-sm font-bold text-vct-text" colSpan={2}>TỔNG CỘNG</td>
                            <td className="px-4 py-3.5 text-sm font-extrabold text-blue-400">{fmt(totalPlanned)}</td>
                            <td className="px-4 py-3.5 text-sm font-extrabold text-amber-400">{fmt(totalActual)}</td>
                            <td className="px-4 py-3.5 text-sm font-extrabold text-vct-text">{pctUsed}%</td>
                            <td className="px-4 py-3.5"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </VCT_PageContainer>
    )
}

export default Page_federation_budget
