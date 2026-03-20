// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — INTERNATIONAL RELATIONS PAGE
// Manage partner organizations, international events,
// delegations, and cultural exchange programs.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useApiFetch } from './useApiFetch';

// ── Types ────────────────────────────────────────────────────

interface Partner {
    id: string; name: string; country: string; country_code: string;
    org_type: string; status: 'active' | 'inactive' | 'pending';
    mou_signed: boolean; mou_expiry: string; contact_name: string;
    description: string;
}

interface IntlEvent {
    id: string; name: string; event_type: string; host_country: string;
    host_city: string; start_date: string; end_date: string;
    status: string; max_delegates: number;
}

// ── Fallback Data ────────────────────────────────────────────

const FALLBACK_PARTNERS: Partner[] = [
    { id: 'p1', name: 'World Vovinam Federation (WVVF)', country: 'Quốc tế', country_code: '🌍', org_type: 'federation', status: 'active', mou_signed: true, mou_expiry: '2028-12-31', contact_name: 'President WVVF', description: 'Liên đoàn Vovinam Thế giới' },
    { id: 'p2', name: 'French Vovinam Federation', country: 'Pháp', country_code: '🇫🇷', org_type: 'federation', status: 'active', mou_signed: true, mou_expiry: '2027-06-30', contact_name: 'Jean Dupont', description: 'LĐ Vovinam Pháp — đối tác lâu năm' },
    { id: 'p3', name: 'Japan VCT Association', country: 'Nhật Bản', country_code: '🇯🇵', org_type: 'federation', status: 'active', mou_signed: true, mou_expiry: '2027-03-31', contact_name: 'Tanaka Sensei', description: 'Hiệp hội VCT Nhật Bản' },
    { id: 'p4', name: 'Cambodia Martial Arts Federation', country: 'Campuchia', country_code: '🇰🇭', org_type: 'federation', status: 'active', mou_signed: false, mou_expiry: '', contact_name: 'Sok Visal', description: 'LĐ Võ thuật Campuchia — đang thương lượng MOU' },
    { id: 'p5', name: 'Korea Traditional MA Institute', country: 'Hàn Quốc', country_code: '🇰🇷', org_type: 'university', status: 'pending', mou_signed: false, mou_expiry: '', contact_name: 'Prof. Kim', description: 'Viện Nghiên cứu Võ thuật Truyền thống Hàn Quốc' },
    { id: 'p6', name: 'ASEAN Martial Arts Committee', country: 'ASEAN', country_code: '🌏', org_type: 'federation', status: 'active', mou_signed: true, mou_expiry: '2029-01-01', contact_name: 'Secretary ASEAN MA', description: 'Ủy ban Võ thuật ASEAN' },
];

const FALLBACK_EVENTS: IntlEvent[] = [
    { id: 'e1', name: 'Giải Vô địch Thế giới Vovinam 2026', event_type: 'competition', host_country: 'Pháp', host_city: 'Paris', start_date: '2026-08-15', end_date: '2026-08-20', status: 'planned', max_delegates: 30 },
    { id: 'e2', name: 'Hội thảo Kỹ thuật VCT Quốc tế', event_type: 'seminar', host_country: 'Việt Nam', host_city: 'TP.HCM', start_date: '2026-05-10', end_date: '2026-05-12', status: 'confirmed', max_delegates: 100 },
    { id: 'e3', name: 'SEA Games 2026 — Môn Võ cổ truyền', event_type: 'competition', host_country: 'Thái Lan', host_city: 'Bangkok', start_date: '2026-11-01', end_date: '2026-11-05', status: 'planned', max_delegates: 25 },
    { id: 'e4', name: 'Giao lưu Võ thuật Việt-Nhật', event_type: 'exchange', host_country: 'Nhật Bản', host_city: 'Tokyo', start_date: '2026-04-20', end_date: '2026-04-25', status: 'confirmed', max_delegates: 15 },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    inactive: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    planned: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    confirmed: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    ongoing: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
    completed: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
};

const EVENT_ICONS: Record<string, string> = {
    competition: '🏆', seminar: '📚', exhibition: '🎭', exchange: '🤝', conference: '🎤',
};

// ── Component ────────────────────────────────────────────────

type TabType = 'partners' | 'events' | 'delegations';

export function Page_international_relations() {
    const [tab, setTab] = useState<TabType>('partners');
    const [search, setSearch] = useState('');

    // ── API Fetch ────────────────────────────────────────
    const partnersApi = useApiFetch<{ partners: Partner[] }>();
    const eventsApi = useApiFetch<{ events: IntlEvent[] }>();

    useEffect(() => {
        partnersApi.execute('/international/partners');
        eventsApi.execute('/international/events');
    }, []);  

    const partners = partnersApi.data?.partners?.length ? partnersApi.data.partners : FALLBACK_PARTNERS;
    const events = eventsApi.data?.events?.length ? eventsApi.data.events : FALLBACK_EVENTS;
    const isLoading = partnersApi.loading || eventsApi.loading;

    const filteredPartners = useMemo(() =>
        partners.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.country.toLowerCase().includes(search.toLowerCase())
        ), [search, partners]);

    const filteredEvents = useMemo(() =>
        events.filter(e =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.host_country.toLowerCase().includes(search.toLowerCase())
        ), [search, events]);

    const tabs: { key: TabType; label: string; icon: string; count: number }[] = [
        { key: 'partners', label: 'Đối tác', icon: '🤝', count: partners.length },
        { key: 'events', label: 'Sự kiện Quốc tế', icon: '🌍', count: events.length },
        { key: 'delegations', label: 'Đoàn đi/đến', icon: '✈️', count: 3 },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    🌍 Đối ngoại Quốc tế
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
                    {partners.filter(p => p.status === 'active').length} đối tác hoạt động •{' '}
                    {events.length} sự kiện quốc tế •{' '}
                    {partners.filter(p => p.mou_signed).length} MOU đã ký
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Đối tác', value: partners.length, icon: '🤝', color: '#3b82f6' },
                    { label: 'MOU Đã ký', value: partners.filter(p => p.mou_signed).length, icon: '📝', color: '#10b981' },
                    { label: 'Sự kiện 2026', value: events.length, icon: '📅', color: '#f59e0b' },
                    { label: 'Quốc gia', value: new Set(partners.map(p => p.country)).size, icon: '🌏', color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: 12, padding: '16px 18px',
                    }}>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: tab === t.key ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.08)',
                        color: tab === t.key ? '#60a5fa' : '#94a3b8',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}>
                        {t.icon} {t.label} ({t.count})
                    </button>
                ))}
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    style={{
                        marginLeft: 'auto', padding: '8px 14px', borderRadius: 8,
                        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.15)',
                        color: '#e2e8f0', fontSize: 13, outline: 'none', width: 200,
                    }}
                />
            </div>

            {/* Partner Cards */}
            {tab === 'partners' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                    {filteredPartners.map(p => {
                        const sColor = STATUS_COLORS[p.status] ?? { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                        return (
                            <div key={p.id} style={{
                                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                                borderRadius: 14, padding: 20,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <span style={{ fontSize: 28 }}>{p.country_code}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{p.name}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>{p.country} • {p.org_type}</div>
                                    </div>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        background: sColor.bg, color: sColor.color,
                                    }}>
                                        {p.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0', lineHeight: 1.4 }}>{p.description}</p>
                                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                                    <span>👤 {p.contact_name}</span>
                                    {p.mou_signed && <span style={{ color: '#10b981' }}>✅ MOU → {p.mou_expiry || 'N/A'}</span>}
                                    {!p.mou_signed && <span style={{ color: '#f59e0b' }}>⏳ Chưa ký MOU</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Events */}
            {tab === 'events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredEvents.map(e => {
                        const sColor = STATUS_COLORS[e.status] ?? { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                        const icon = EVENT_ICONS[e.event_type] ?? '📌';
                        return (
                            <div key={e.id} style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                                borderRadius: 12, padding: '16px 20px',
                            }}>
                                <span style={{ fontSize: 28 }}>{icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{e.name}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                        📍 {e.host_city}, {e.host_country} • 📅 {e.start_date} → {e.end_date}
                                        {e.max_delegates > 0 && ` • 👥 ${e.max_delegates} chỉ tiêu`}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    background: sColor.bg, color: sColor.color,
                                }}>
                                    {e.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delegations */}
            {tab === 'delegations' && (
                <div style={{
                    background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 14, padding: 24, textAlign: 'center',
                }}>
                    <span style={{ fontSize: 48 }}>✈️</span>
                    <h3 style={{ color: '#e2e8f0', fontSize: 16, marginTop: 12 }}>Quản lý Đoàn đi/đến</h3>
                    <p style={{ color: '#64748b', fontSize: 13, maxWidth: 400, margin: '8px auto' }}>
                        Tạo đoàn đi thi đấu nước ngoài hoặc đón đoàn quốc tế đến giao lưu.
                        Connect to international.Service.CreateDelegation() API.
                    </p>
                </div>
            )}
        </div>
    );
}

export default Page_international_relations;
