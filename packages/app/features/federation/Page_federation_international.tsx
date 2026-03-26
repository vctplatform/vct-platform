'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_PageContainer, VCT_StatRow
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useIntlPartners, useIntlEvents, type InternationalPartner, type InternationalEvent } from '../hooks/useFederationAPI'

// ════════════════════════════════════════
// FEDERATION — QUAN HỆ QUỐC TẾ
// (Wired to /api/v1/federation/partners + /intl-events)
// ════════════════════════════════════════

const FLAG_MAP: Record<string, string> = {
    'KR': '🇰🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'FR': '🇫🇷', 'ASEAN': '🌏',
    'Thái Lan': '🇹🇭', 'Hàn Quốc': '🇰🇷',
}

const STATUS_MAP: Record<string, { text: string; type: 'success' | 'warning' | 'info' | 'neutral' }> = {
    planning: { text: 'Đang chuẩn bị', type: 'warning' },
    confirmed: { text: 'Xác nhận', type: 'info' },
    ongoing: { text: 'Đang diễn ra', type: 'success' },
    completed: { text: 'Đã hoàn thành', type: 'success' },
}

export function Page_federation_international() {
    const [tab, setTab] = useState<'partners' | 'events'>('partners')
    const [search, setSearch] = useState('')

    const { data: partnersRaw, isLoading: loadingP } = useIntlPartners()
    const { data: eventsRaw, isLoading: loadingE } = useIntlEvents()

    const partners: InternationalPartner[] = useMemo(() => {
        if (partnersRaw && Array.isArray(partnersRaw)) return partnersRaw
        if (partnersRaw && typeof partnersRaw === 'object' && 'items' in partnersRaw) return (partnersRaw as { items: InternationalPartner[] }).items
        return []
    }, [partnersRaw])

    const events: InternationalEvent[] = useMemo(() => {
        if (eventsRaw && Array.isArray(eventsRaw)) return eventsRaw
        if (eventsRaw && typeof eventsRaw === 'object' && 'items' in eventsRaw) return (eventsRaw as { items: InternationalEvent[] }).items
        return []
    }, [eventsRaw])

    const filteredPartners = useMemo(() => {
        if (!search) return partners
        const q = search.toLowerCase()
        return partners.filter(p =>
            p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
        )
    }, [partners, search])

    const filteredEvents = useMemo(() => {
        if (!search) return events
        const q = search.toLowerCase()
        return events.filter(e =>
            e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
        )
    }, [events, search])

    const activePartners = partners.filter(p => p.status === 'active').length
    const totalAthletes = events.reduce((sum, e) => sum + (e.athlete_count || 0), 0)
    const totalMedals = events.reduce((s, e) => s + (e.medal_gold || 0) + (e.medal_silver || 0) + (e.medal_bronze || 0), 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    Quan hệ Quốc tế
                    {(loadingP || loadingE) && <span className="ml-2 text-sm font-normal text-(--vct-accent-cyan)">Đang tải...</span>}
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">
                    Đối tác quốc tế, sự kiện quốc tế và hợp tác lưỡng phương/đa phương.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Đối tác QT', value: partners.length, icon: <VCT_Icons.Globe size={18} />, color: 'var(--vct-info)' },
                { label: 'Đang hoạt động', value: activePartners, icon: <VCT_Icons.CheckCircle size={18} />, color: 'var(--vct-success)' },
                { label: 'Sự kiện QT', value: events.length, icon: <VCT_Icons.Calendar size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Tổng huy chương', value: totalMedals, icon: <VCT_Icons.Award size={18} />, color: 'var(--vct-warning)' },
            ] as StatItem[]} className="mb-6" />

            {/* ── Tab Bar + Search ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex gap-1 p-1 rounded-xl bg-(--vct-bg-elevated)">
                    {(['partners', 'events'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                tab === t ? 'bg-(--vct-accent-gold) text-white shadow-sm' : 'text-(--vct-text-secondary) hover:text-(--vct-text-primary)'
                            }`}>
                            {t === 'partners' ? '🌍 Đối tác' : '🏅 Sự kiện'}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--vct-text-secondary)" />
                    <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) text-(--vct-text-primary) focus:outline-none focus:ring-2 focus:ring-(--vct-accent-cyan)" />
                </div>
            </div>

            {/* ── Partners Tab ── */}
            {tab === 'partners' && (
                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5">
                    <h2 className="text-sm font-bold text-(--vct-text-primary) mb-4 uppercase tracking-wide">🌍 Đối tác Quốc tế ({filteredPartners.length})</h2>
                    <div className="space-y-3">
                        {filteredPartners.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-(--vct-bg-elevated) transition-colors cursor-pointer group">
                                <div className="text-2xl">{FLAG_MAP[p.country_code] || '🌐'}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-(--vct-text-primary) truncate group-hover:text-(--vct-accent-gold) transition-colors">
                                        {p.name} {p.abbreviation ? `(${p.abbreviation})` : ''}
                                    </div>
                                    <div className="text-xs text-(--vct-text-secondary)">{p.type} · {p.country} · Từ {p.partner_since}</div>
                                </div>
                                <VCT_Badge text={p.status === 'active' ? 'Hoạt động' : p.status === 'pending' ? 'Đang xúc tiến' : 'Hết hạn'} type={p.status === 'active' ? 'success' : p.status === 'pending' ? 'warning' : 'neutral'} />
                            </div>
                        ))}
                        {filteredPartners.length === 0 && <p className="text-sm text-(--vct-text-secondary) text-center py-8">Không tìm thấy đối tác phù hợp.</p>}
                    </div>
                </div>
            )}

            {/* ── Events Tab ── */}
            {tab === 'events' && (
                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5">
                    <h2 className="text-sm font-bold text-(--vct-text-primary) mb-4 uppercase tracking-wide">🏅 Sự kiện Quốc tế ({filteredEvents.length})</h2>
                    <div className="space-y-3">
                        {filteredEvents.map(e => {
                            const st = STATUS_MAP[e.status] || { text: e.status, type: 'neutral' as const }
                            return (
                                <div key={e.id} className="p-4 rounded-xl border border-(--vct-border-subtle) hover:border-(--vct-accent-cyan) transition-all hover:shadow-md cursor-pointer">
                                    <VCT_Stack direction="row" justify="space-between" align="center" className="mb-2">
                                        <div className="text-sm font-bold text-(--vct-text-primary)">{e.name}</div>
                                        <VCT_Badge text={st.text} type={st.type} />
                                    </VCT_Stack>
                                    <VCT_Stack direction="row" gap={16} className="text-xs text-(--vct-text-secondary)">
                                        <span>📍 {e.location}, {e.country}</span>
                                        <span>📅 {e.start_date} → {e.end_date}</span>
                                        <span>👥 {e.athlete_count} VĐV</span>
                                        {(e.medal_gold || e.medal_silver || e.medal_bronze) > 0 && (
                                            <span>🏅 {e.medal_gold}V / {e.medal_silver}B / {e.medal_bronze}Đ</span>
                                        )}
                                    </VCT_Stack>
                                </div>
                            )
                        })}
                        {filteredEvents.length === 0 && <p className="text-sm text-(--vct-text-secondary) text-center py-8">Không có sự kiện phù hợp.</p>}
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    )
}
