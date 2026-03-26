// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PR & COMMUNICATIONS PAGE
// Manage news articles, press releases, announcements, and
// social media campaigns for the federation.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────

type ContentType = 'news' | 'press_release' | 'announcement' | 'social_campaign';
type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';

interface ContentItem {
    id: string;
    type: ContentType;
    title: string;
    summary: string;
    author: string;
    status: ContentStatus;
    created_at: string;
    published_at: string;
    category: string;
    views: number;
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_CONTENT: ContentItem[] = [
    { id: 'n1', type: 'news', title: 'Giải VCT Toàn quốc 2026 khởi tranh ngày 15/6', summary: 'Giải đấu quy tụ hơn 500 VĐV từ 45 tỉnh thành, dự kiến tổ chức tại Nhà thi đấu Phú Thọ.', author: 'Ban truyền thông', status: 'published', created_at: '2026-03-01', published_at: '2026-03-02', category: 'Giải đấu', views: 2340 },
    { id: 'n2', type: 'press_release', title: 'LĐ VCT ký MOU hợp tác với LĐ Vovinam Pháp', summary: 'Biên bản ghi nhớ hợp tác toàn diện về đào tạo, thi đấu, và trao đổi kỹ thuật giai đoạn 2026–2030.', author: 'Phòng đối ngoại', status: 'published', created_at: '2026-02-15', published_at: '2026-02-16', category: 'Đối ngoại', views: 1560 },
    { id: 'n3', type: 'announcement', title: 'Thông báo: Lịch thi Thăng đai Đợt 2/2026', summary: 'Đợt thi thăng đai quý II sẽ diễn ra ngày 20-22/5 tại TP.HCM và Hà Nội.', author: 'Ban kỹ thuật', status: 'published', created_at: '2026-03-05', published_at: '2026-03-05', category: 'Đào tạo', views: 890 },
    { id: 'n4', type: 'news', title: 'VĐV Nguyễn Văn A giành HCV SEA Games', summary: 'Thành tích xuất sắc của đoàn VN tại SEA Games với 3 HCV, 2 HCB, 1 HCĐ.', author: 'Ban truyền thông', status: 'draft', created_at: '2026-03-08', published_at: '', category: 'Giải đấu', views: 0 },
    { id: 'n5', type: 'social_campaign', title: 'Chiến dịch #VõCổTruyền365 trên TikTok', summary: 'Chiến dịch quảng bá võ cổ truyền trên mạng xã hội, mục tiêu 1 triệu lượt xem.', author: 'PR Manager', status: 'pending_review', created_at: '2026-03-10', published_at: '', category: 'Truyền thông', views: 0 },
    { id: 'n6', type: 'press_release', title: 'Khai mạc Lớp tập huấn Trọng tài Quốc gia', summary: 'Lớp tập huấn cho 50 trọng tài cấp quốc gia, diễn ra từ 25-28/3 tại Đà Nẵng.', author: 'Ban kỹ thuật', status: 'pending_review', created_at: '2026-03-09', published_at: '', category: 'Đào tạo', views: 0 },
];

const TYPE_META: Record<ContentType, { label: string; icon: string; color: string }> = {
    news: { label: 'Tin tức', icon: '📰', color: 'var(--vct-info)' },
    press_release: { label: 'Thông cáo', icon: '📢', color: 'var(--vct-info)' },
    announcement: { label: 'Thông báo', icon: '📋', color: 'var(--vct-warning)' },
    social_campaign: { label: 'Chiến dịch MXH', icon: '📱', color: 'var(--vct-accent-pink)' },
};

const STATUS_META: Record<ContentStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'Bản nháp', color: 'var(--vct-text-tertiary)', bg: 'rgba(148,163,184,0.15)' },
    pending_review: { label: 'Chờ duyệt', color: 'var(--vct-warning)', bg: 'rgba(245,158,11,0.15)' },
    published: { label: 'Đã đăng', color: 'var(--vct-success)', bg: 'rgba(16,185,129,0.15)' },
    archived: { label: 'Lưu trữ', color: 'var(--vct-text-tertiary)', bg: 'rgba(107,114,128,0.15)' },
};

// ── Component ────────────────────────────────────────────────

export function Page_pr_communications() {
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        return MOCK_CONTENT.filter(c => {
            if (filterType !== 'all' && c.type !== filterType) return false;
            if (filterStatus !== 'all' && c.status !== filterStatus) return false;
            if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [filterType, filterStatus, search]);

    const totalViews = MOCK_CONTENT.reduce((s, c) => s + c.views, 0);
    const publishedCount = MOCK_CONTENT.filter(c => c.status === 'published').length;
    const pendingCount = MOCK_CONTENT.filter(c => c.status === 'pending_review').length;

    return (
        <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--vct-text-primary)', margin: 0 }}>
                    📢 Truyền thông & Quan hệ Công chúng
                </h1>
                <p style={{ fontSize: 14, color: 'var(--vct-text-tertiary)', marginTop: 6 }}>
                    {MOCK_CONTENT.length} nội dung • {publishedCount} đã đăng • {pendingCount} chờ duyệt
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Tổng nội dung', value: MOCK_CONTENT.length, icon: '📝', color: 'var(--vct-info)' },
                    { label: 'Đã đăng', value: publishedCount, icon: '✅', color: 'var(--vct-success)' },
                    { label: 'Chờ duyệt', value: pendingCount, icon: '⏳', color: 'var(--vct-warning)' },
                    { label: 'Lượt xem', value: totalViews.toLocaleString(), icon: '👁️', color: 'var(--vct-info)' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: 12, padding: '16px 18px',
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--vct-text-tertiary)', marginBottom: 4 }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setFilterType('all')} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer',
                    background: filterType === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.08)',
                    color: filterType === 'all' ? 'var(--vct-info)' : 'var(--vct-text-tertiary)',
                }}>Tất cả</button>
                {(Object.keys(TYPE_META) as ContentType[]).map(t => (
                    <button key={t} onClick={() => setFilterType(t)} style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 13, cursor: 'pointer',
                        background: filterType === t ? `${TYPE_META[t].color}20` : 'rgba(148,163,184,0.08)',
                        color: filterType === t ? TYPE_META[t].color: 'var(--vct-text-tertiary)',
                    }}>{TYPE_META[t].icon} {TYPE_META[t].label}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <select
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 13,
                            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.15)',
                            color: 'var(--vct-border-subtle)', outline: 'none',
                        }}
                    >
                        <option value="all">Mọi trạng thái</option>
                        {(Object.keys(STATUS_META) as ContentStatus[]).map(s => (
                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                    </select>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..." style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 13, width: 180,
                            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.15)',
                            color: 'var(--vct-border-subtle)', outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Content List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(c => {
                    const typeMeta = TYPE_META[c.type];
                    const statusMeta = STATUS_META[c.status];
                    return (
                        <div key={c.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                            borderRadius: 12, padding: '16px 20px',
                        }}>
                            <span style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 40, height: 40, borderRadius: 10, fontSize: 20, flexShrink: 0,
                                background: `${typeMeta.color}15`,
                            }}>{typeMeta.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--vct-text-primary)' }}>{c.title}</span>
                                </div>
                                <p style={{
                                    fontSize: 13, color: 'var(--vct-text-tertiary)', margin: '2px 0 8px',
                                    lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                }}>{c.summary}</p>
                                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--vct-text-tertiary)' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: `${typeMeta.color}15`, color: typeMeta.color }}>{typeMeta.label}</span>
                                    <span>✍️ {c.author}</span>
                                    <span>📅 {c.created_at}</span>
                                    <span>🏷️ {c.category}</span>
                                    {c.views > 0 && <span>👁️ {c.views.toLocaleString()}</span>}
                                </div>
                            </div>
                            <span style={{
                                padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                background: statusMeta.bg, color: statusMeta.color, whiteSpace: 'nowrap',
                            }}>{statusMeta.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Page_pr_communications;
