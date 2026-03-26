'use client'
import React, { useState, useMemo } from 'react'
import { VCT_Icons } from '@vct/ui'

interface Sponsor {
    id: string; name: string; tier: 'diamond' | 'gold' | 'silver' | 'bronze'; logo: string
    amount: number; startDate: string; endDate: string; status: 'active' | 'expired' | 'pending'
    benefits: string[]; contact: string
}

const SPONSORS: Sponsor[] = [
    { id: 's1', name: 'Tập đoàn Hòa Phát', tier: 'diamond', logo: '💎', amount: 500000000, startDate: '01/01/2026', endDate: '31/12/2026', status: 'active', benefits: ['Logo trên banner chính', 'Tên giải kèm nhà tài trợ', '20 vé VIP mỗi giải'], contact: 'Mr. Nguyễn (0901-xxx-xxx)' },
    { id: 's2', name: 'Vinamilk', tier: 'gold', logo: '🥇', amount: 200000000, startDate: '01/03/2026', endDate: '31/12/2026', status: 'active', benefits: ['Logo trên áo VĐV', 'Booth tại sân thi đấu', '10 vé VIP'], contact: 'Ms. Trần (0912-xxx-xxx)' },
    { id: 's3', name: 'Thể Thao Động Lực', tier: 'silver', logo: '🥈', amount: 100000000, startDate: '01/04/2026', endDate: '30/06/2026', status: 'pending', benefits: ['Logo trên backdrop', 'Tặng trang phục VĐV'], contact: 'Mr. Lê (0933-xxx-xxx)' },
    { id: 's4', name: 'Ngân hàng ACB', tier: 'gold', logo: '🏦', amount: 150000000, startDate: '01/01/2025', endDate: '31/12/2025', status: 'expired', benefits: ['Logo trên website', 'Phát Thank You card'], contact: 'Ms. Phạm (0945-xxx-xxx)' },
    { id: 's5', name: 'Red Bull Vietnam', tier: 'bronze', logo: '🐂', amount: 50000000, startDate: '15/05/2026', endDate: '30/06/2026', status: 'active', benefits: ['Logo trên standee', 'Nước uống cho VĐV'], contact: 'Mr. Võ (0967-xxx-xxx)' },
]

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    diamond: { bg: 'bg-purple-500/15', text: 'text-purple-600', label: '💎 Kim cương' },
    gold: { bg: 'bg-amber-500/15', text: 'text-amber-600', label: '🥇 Vàng' },
    silver: { bg: 'bg-gray-500/15', text: 'text-gray-600', label: '🥈 Bạc' },
    bronze: { bg: 'bg-orange-500/15', text: 'text-orange-600', label: '🥉 Đồng' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', label: '✅ Đang hợp tác' },
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-600', label: '⏳ Chờ ký kết' },
    expired: { bg: 'bg-gray-500/15', text: 'text-gray-600', label: '⬛ Hết hạn' },
}

const formatVND = (n: number) => (n / 1000000).toFixed(0) + ' triệu ₫'

export function Page_finance_sponsorship() {
    const [filter, setFilter] = useState('all')
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null)

    const filtered = useMemo(() => {
        if (filter === 'all') return SPONSORS
        return SPONSORS.filter(s => s.status === filter)
    }, [filter])

    const totalActive = SPONSORS.filter(s => s.status === 'active').reduce((s, sp) => s + sp.amount, 0)

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Quản Lý Tài Trợ</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Nhà tài trợ, hợp đồng và quyền lợi đối tác</p>
                </div>
            </div>

            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng nhà tài trợ', v: SPONSORS.length, i: '🤝', c: 'var(--vct-info)' },
                { l: 'Đang hợp tác', v: SPONSORS.filter(s => s.status === 'active').length, i: '✅', c: 'var(--vct-success)' },
                { l: 'Tổng giá trị', v: formatVND(totalActive), i: '💰', c: 'var(--vct-warning)' },
                { l: 'Chờ ký kết', v: SPONSORS.filter(s => s.status === 'pending').length, i: '📝', c: 'var(--vct-info)' }
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                        <div className="text-xl mb-1">{s.i}</div>
                        <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted font-bold">{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 w-fit">
                {[{ v: 'all', l: 'Tất cả' }, { v: 'active', l: '✅ Đang hợp tác' }, { v: 'pending', l: '⏳ Chờ' }, { v: 'expired', l: '⬛ Hết hạn' }].map(f => (
                    <button key={f.v} onClick={() => setFilter(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                ))}
            </div>

            <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {filtered.map(sp => {
                    const tier = TIER_COLORS[sp.tier]!
                    const status = STATUS_COLORS[sp.status]!
                    return (
                        <div key={sp.id} onClick={() => setSelectedSponsor(sp)}
                            className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-vct-input flex items-center justify-center text-2xl">{sp.logo}</div>
                                        <div>
                                            <div className="font-bold text-sm">{sp.name}</div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>{tier.label}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>{status.label}</span>
                                </div>
                                <div className="text-xl font-black text-vct-accent mb-2">{formatVND(sp.amount)}</div>
                                <div className="text-xs text-vct-text-muted mb-3">{sp.startDate} — {sp.endDate}</div>
                                <div className="border-t border-vct-border pt-3">
                                    <div className="text-xs font-bold mb-1">Quyền lợi:</div>
                                    {sp.benefits.slice(0, 2).map((b, i) => (
                                        <div key={i} className="text-xs text-vct-text-muted flex items-center gap-1">✓ {b}</div>
                                    ))}
                                    {sp.benefits.length > 2 && <div className="text-xs text-vct-accent font-bold mt-1">+{sp.benefits.length - 2} khác</div>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
