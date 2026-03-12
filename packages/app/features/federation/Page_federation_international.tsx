'use client'

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useApiFetch } from './useApiFetch'

// ════════════════════════════════════════
// FEDERATION — QUAN HỆ QUỐC TẾ
// ════════════════════════════════════════

interface Partner {
    id: string; name: string; country: string; type: string; status: string; since: string
}
interface IntlEvent {
    id: string; name: string; location: string; date: string; athletes: number; status: string; color: string
}

const FALLBACK_PARTNERS: Partner[] = [
    { id: '1', name: 'World Martial Arts Union (WoMAU)', country: '🇰🇷 Hàn Quốc', type: 'Liên đoàn Quốc tế', status: 'active', since: '2018' },
    { id: '2', name: 'Asian Martial Arts Federation', country: '🇯🇵 Nhật Bản', type: 'Liên đoàn Châu Á', status: 'active', since: '2019' },
    { id: '3', name: 'Chinese Wushu Association', country: '🇨🇳 Trung Quốc', type: 'Lưỡng phương', status: 'active', since: '2023' },
    { id: '4', name: 'SEA Games Federation', country: '🌏 Đông Nam Á', type: 'Đa phương', status: 'active', since: '2015' },
    { id: '5', name: 'French Martial Arts Federation', country: '🇫🇷 Pháp', type: 'Lưỡng phương', status: 'pending', since: '2024' },
]

const FALLBACK_EVENTS: IntlEvent[] = [
    { id: '1', name: 'SEA Games 2025 — Võ Cổ Truyền', location: 'Thái Lan', date: '12/2025', athletes: 12, status: 'Đang chuẩn bị', color: '#f59e0b' },
    { id: '2', name: 'Asian Martial Arts Championship', location: 'Seoul, Hàn Quốc', date: '08/2024', athletes: 8, status: 'Đã thi đấu', color: '#10b981' },
    { id: '3', name: 'World Martial Arts Festival', location: 'Chungju, Hàn Quốc', date: '10/2024', athletes: 15, status: 'Chờ đăng ký', color: '#0ea5e9' },
]

export function Page_federation_international() {
    const [tab, setTab] = useState<'partners' | 'events'>('partners')
    const [search, setSearch] = useState('')

    // API hooks (with graceful fallback to mock data)
    const partnersApi = useApiFetch<{ partners?: Partner[] }>()
    const eventsApi = useApiFetch<{ events?: IntlEvent[] }>()

    useEffect(() => {
        partnersApi.execute('/international/partners').catch(() => {})
        eventsApi.execute('/international/events').catch(() => {})
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const partners = useMemo(() => {
        if (partnersApi.data && Array.isArray((partnersApi.data as any)?.partners)) {
            return (partnersApi.data as any).partners as Partner[]
        }
        return FALLBACK_PARTNERS
    }, [partnersApi.data])

    const events = useMemo(() => {
        if (eventsApi.data && Array.isArray((eventsApi.data as any)?.events)) {
            return (eventsApi.data as any).events as IntlEvent[]
        }
        return FALLBACK_EVENTS
    }, [eventsApi.data])

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
            e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.status.toLowerCase().includes(q)
        )
    }, [events, search])

    const activePartners = partners.filter(p => p.status === 'active').length
    const totalAthletes = events.reduce((sum, e) => sum + e.athletes, 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quan hệ Quốc tế</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">
                    Đối tác quốc tế, sự kiện quốc tế và hợp tác lưỡng phương/đa phương.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Đối tác QT', value: partners.length, icon: <VCT_Icons.Globe size={18} />, color: '#8b5cf6' },
                { label: 'Đang hoạt động', value: activePartners, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Sự kiện QT', value: events.length, icon: <VCT_Icons.Calendar size={18} />, color: '#0ea5e9' },
                { label: 'VĐV tham gia', value: totalAthletes, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* ── Tab Bar + Search ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex gap-1 p-1 rounded-xl bg-[var(--vct-bg-elevated)]">
                    {(['partners', 'events'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                tab === t ? 'bg-[var(--vct-accent-gold)] text-white shadow-sm' : 'text-[var(--vct-text-secondary)] hover:text-[var(--vct-text-primary)]'
                            }`}>
                            {t === 'partners' ? '🌍 Đối tác' : '🏅 Sự kiện'}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vct-text-secondary)]" />
                    <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-elevated)] text-[var(--vct-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--vct-accent-cyan)]" />
                </div>
            </div>

            {/* ── Partners Tab ── */}
            {tab === 'partners' && (
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">🌍 Đối tác Quốc tế ({filteredPartners.length})</h2>
                    {partnersApi.loading && <p className="text-sm text-[var(--vct-text-secondary)] animate-pulse">Đang tải...</p>}
                    <div className="space-y-3">
                        {filteredPartners.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--vct-bg-elevated)] transition-colors cursor-pointer group">
                                <div className="text-2xl">{p.country.split(' ')[0]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[var(--vct-text-primary)] truncate group-hover:text-[var(--vct-accent-gold)] transition-colors">{p.name}</div>
                                    <div className="text-xs text-[var(--vct-text-secondary)]">{p.type} · Từ {p.since}</div>
                                </div>
                                <VCT_Badge text={p.status === 'active' ? 'Hoạt động' : 'Đang xúc tiến'} type={p.status === 'active' ? 'success' : 'warning'} />
                            </div>
                        ))}
                        {filteredPartners.length === 0 && <p className="text-sm text-[var(--vct-text-secondary)] text-center py-8">Không tìm thấy đối tác phù hợp.</p>}
                    </div>
                </div>
            )}

            {/* ── Events Tab ── */}
            {tab === 'events' && (
                <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5">
                    <h2 className="text-sm font-bold text-[var(--vct-text-primary)] mb-4 uppercase tracking-wide">🏅 Sự kiện Quốc tế ({filteredEvents.length})</h2>
                    {eventsApi.loading && <p className="text-sm text-[var(--vct-text-secondary)] animate-pulse">Đang tải...</p>}
                    <div className="space-y-3">
                        {filteredEvents.map(e => (
                            <div key={e.id} className="p-4 rounded-xl border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-all hover:shadow-md cursor-pointer">
                                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-2">
                                    <div className="text-sm font-bold text-[var(--vct-text-primary)]">{e.name}</div>
                                    <VCT_Badge text={e.status} type={e.status === 'Đã thi đấu' ? 'success' : e.status === 'Đang chuẩn bị' ? 'warning' : 'info'} />
                                </VCT_Stack>
                                <VCT_Stack direction="row" gap={16} className="text-xs text-[var(--vct-text-secondary)]">
                                    <span>📍 {e.location}</span>
                                    <span>📅 {e.date}</span>
                                    <span>👥 {e.athletes} VĐV</span>
                                </VCT_Stack>
                            </div>
                        ))}
                        {filteredEvents.length === 0 && <p className="text-sm text-[var(--vct-text-secondary)] text-center py-8">Không có sự kiện phù hợp.</p>}
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    )
}
