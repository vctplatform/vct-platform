'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_KpiCard, VCT_Badge
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const MOCK_PRODUCTS = [
    { id: 'MP-001', title: 'Thảm thi đấu tiêu chuẩn WT', price: 12500000, seller: 'Thể thao Việt', category: 'equipment', image: '🥋', condition: 'new', status: 'available' },
    { id: 'MP-002', title: 'Bộ giáp thi đấu Full Set', price: 3200000, seller: 'CLB Long An', category: 'protection', image: '🛡️', condition: 'used', status: 'available' },
    { id: 'MP-003', title: 'Đai đen chính hãng Adidas', price: 450000, seller: 'Shop VCT Official', category: 'belt', image: '🥷', condition: 'new', status: 'available' },
    { id: 'MP-004', title: 'Bao đấm treo trần 1m5', price: 1800000, seller: 'Võ Đường Sơn Long', category: 'equipment', image: '🥊', condition: 'used', status: 'sold' },
    { id: 'MP-005', title: 'Máy đo lực đá điện tử', price: 35000000, seller: 'TechSport JSC', category: 'scoring', image: '📟', condition: 'new', status: 'available' },
    { id: 'MP-006', title: 'Áo Dobok tập luyện Mooto', price: 650000, seller: 'Shop VCT Official', category: 'uniform', image: '👕', condition: 'new', status: 'available' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_marketplace = () => {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (!search) return MOCK_PRODUCTS
        const q = search.toLowerCase()
        return MOCK_PRODUCTS.filter(p => p.title.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q))
    }, [search])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Sàn Giao Dịch Võ Thuật</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Mua bán trang thiết bị, dụng cụ tập luyện & thi đấu.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Đăng sản phẩm</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <div className="vct-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <VCT_KpiCard label="Sản phẩm đang bán" value={124} icon={<VCT_Icons.ShoppingBag size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Đã bán tháng này" value={38} icon={<VCT_Icons.Check size={24} />} color="#10b981" />
                <VCT_KpiCard label="Người bán uy tín" value={56} icon={<VCT_Icons.Star size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Doanh số (triệu)" value="245M" icon={<VCT_Icons.DollarSign size={24} />} color="#8b5cf6" />
            </div>

            {/* ── SEARCH ── */}
            <div className="mb-6">
                <VCT_SearchInput placeholder="Tìm kiếm sản phẩm, người bán..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
            </div>

            {/* ── GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(product => (
                    <div key={product.id} className={`bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden hover:border-[var(--vct-accent-cyan)] hover:shadow-[0_4px_24px_-8px_var(--vct-accent-cyan)] transition-all group ${product.status === 'sold' ? 'opacity-60' : ''}`}>
                        {/* Image Area */}
                        <div className="h-40 bg-[var(--vct-bg-base)] flex items-center justify-center text-6xl relative">
                            {product.image}
                            {product.status === 'sold' && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-[#ef4444] text-white text-xs font-black px-3 py-1 rounded-full">ĐÃ BÁN</span>
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                {product.condition === 'new' ? (
                                    <VCT_Badge type="success" text="Mới" />
                                ) : (
                                    <VCT_Badge type="warning" text="Đã qua sử dụng" />
                                )}
                            </div>
                        </div>
                        {/* Details */}
                        <div className="p-4">
                            <h3 className="font-bold text-sm text-[var(--vct-text-primary)] line-clamp-2 mb-2 group-hover:text-[var(--vct-accent-cyan)] transition-colors">{product.title}</h3>
                            <div className="text-xl font-black text-[var(--vct-accent-cyan)] mb-3">{product.price.toLocaleString()} <span className="text-[10px] text-[var(--vct-text-tertiary)] font-normal">VNĐ</span></div>
                            <div className="flex items-center justify-between text-[11px] text-[var(--vct-text-tertiary)]">
                                <span className="flex items-center gap-1"><VCT_Icons.User size={12} /> {product.seller}</span>
                                <span className="font-mono">{product.id}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
