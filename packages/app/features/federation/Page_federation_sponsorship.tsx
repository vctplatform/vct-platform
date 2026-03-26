'use client'

import React, { useState } from 'react'
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Badge, VCT_Button } from '@vct/ui'

// ════════════════════════════════════════
// FEDERATION — TÀI TRỢ & NHÀ TÀI TRỢ
// ════════════════════════════════════════

interface Sponsor {
    id: string; name: string; type: 'diamond' | 'gold' | 'silver' | 'bronze' | 'media'
    amount: number; contract_start: string; contract_end: string
    status: 'active' | 'expired' | 'negotiating'
    benefits: string
}

const TIER_MAP: Record<string, { label: string; color: string; icon: string }> = {
    diamond: { label: 'Kim cương', color: 'var(--vct-accent-cyan)', icon: '💎' },
    gold: { label: 'Vàng', color: 'var(--vct-warning)', icon: '🥇' },
    silver: { label: 'Bạc', color: 'var(--vct-text-tertiary)', icon: '🥈' },
    bronze: { label: 'Đồng', color: 'var(--vct-warning)', icon: '🥉' },
    media: { label: 'Truyền thông', color: 'var(--vct-info)', icon: '📺' },
}

const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`
    return n.toLocaleString('vi-VN') + ' ₫'
}

const SEED: Sponsor[] = [
    { id: '1', name: 'Tập đoàn Vingroup', type: 'diamond', amount: 2_000_000_000, contract_start: '2025-01-01', contract_end: '2027-12-31', status: 'active', benefits: 'Logo sân đấu, banner, media' },
    { id: '2', name: 'Ngân hàng Vietcombank', type: 'gold', amount: 800_000_000, contract_start: '2026-01-01', contract_end: '2026-12-31', status: 'active', benefits: 'Logo áo đấu, media online' },
    { id: '3', name: 'Công ty CP Thể thao Việt Nam', type: 'gold', amount: 500_000_000, contract_start: '2026-01-01', contract_end: '2026-12-31', status: 'active', benefits: 'Trang phục, dụng cụ thi đấu' },
    { id: '4', name: 'VTV — Đài truyền hình Việt Nam', type: 'media', amount: 0, contract_start: '2025-06-01', contract_end: '2027-06-01', status: 'active', benefits: 'Phát sóng giải đấu, phóng sự đặc biệt' },
    { id: '5', name: 'Hãng nước giải khát ABC', type: 'silver', amount: 300_000_000, contract_start: '2025-06-01', contract_end: '2026-05-31', status: 'expired', benefits: 'Logo cúp, banner sân' },
    { id: '6', name: 'Công ty Dược phẩm XYZ', type: 'bronze', amount: 150_000_000, contract_start: '2026-03-01', contract_end: '2026-12-31', status: 'negotiating', benefits: 'Đang thương lượng' },
]

export function Page_federation_sponsorship() {
    const [tierFilter, setTierFilter] = useState('')
    const filtered = tierFilter ? SEED.filter(s => s.type === tierFilter) : SEED
    const totalValue = SEED.filter(s => s.status === 'active').reduce((s, sp) => s + sp.amount, 0)

    const kpis = [
        { label: 'Nhà tài trợ', value: SEED.length, icon: <VCT_Icons.Heart size={16} />, color: 'var(--vct-accent-pink)' },
        { label: 'Đang hoạt động', value: SEED.filter(s => s.status === 'active').length, icon: <VCT_Icons.CheckCircle size={16} />, color: 'var(--vct-success)' },
        { label: 'Tổng giá trị', value: fmt(totalValue), icon: <VCT_Icons.DollarSign size={16} />, color: 'var(--vct-warning)' },
        { label: 'Đang đàm phán', value: SEED.filter(s => s.status === 'negotiating').length, icon: <VCT_Icons.Clock size={16} />, color: 'var(--vct-accent-cyan)' },
    ]

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero title="Nhà tài trợ & Đối tác" subtitle="Quản lý các hợp đồng tài trợ, đối tác truyền thông của Liên đoàn"
                icon={<VCT_Icons.Heart size={24} />} gradientFrom="rgba(236, 72, 153, 0.1)" gradientTo="rgba(245, 158, 11, 0.06)" />

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

            {/* Tier filter */}
            <div className="flex gap-1 bg-vct-elevated p-1 rounded-2xl border border-vct-border w-fit mb-6">
                <button onClick={() => setTierFilter('')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${!tierFilter ? 'bg-pink-500/15 text-pink-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                    Tất cả ({SEED.length})
                </button>
                {Object.entries(TIER_MAP).map(([k, v]) => (
                    <button key={k} onClick={() => setTierFilter(k)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${tierFilter === k ? 'bg-pink-500/15 text-pink-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                        {v.icon} {v.label}
                    </button>
                ))}
            </div>

            {/* Sponsor Cards */}
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
                {filtered.map(sp => {
                    const tier = TIER_MAP[sp.type] || { label: sp.type, color: '#666', icon: '🏢' }
                    return (
                        <div key={sp.id} className="rounded-2xl border border-vct-border bg-vct-elevated p-5 hover:border-vct-accent/50 transition-colors cursor-pointer"
                            style={{ borderTop: `3px solid ${tier.color}` }}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{tier.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-vct-text">{sp.name}</div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: tier.color + '15', color: tier.color }}>{tier.label}</span>
                                </div>
                                <VCT_Badge text={sp.status === 'active' ? 'Hoạt động' : sp.status === 'expired' ? 'Hết hạn' : 'Đàm phán'} type={sp.status === 'active' ? 'success' : sp.status === 'expired' ? 'neutral' : 'warning'} />
                            </div>
                            <div className="space-y-1.5 text-xs text-vct-text-muted">
                                {sp.amount > 0 && <div>💰 <strong className="text-amber-400">{fmt(sp.amount)}</strong></div>}
                                <div>📅 {sp.contract_start} → {sp.contract_end}</div>
                                <div>🎁 {sp.benefits}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </VCT_PageContainer>
    )
}

export default Page_federation_sponsorship
