// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — EXECUTIVE DASHBOARD
// Strategic KPI dashboard for President / Vice President.
// Shows federation-wide metrics, pending approvals, and alerts.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useMemo, useEffect } from 'react';
import { useApiFetch } from './useApiFetch';

// ── Mock KPI Data ────────────────────────────────────────────

const FALLBACK_KPI = {
    total_provinces: 63,
    active_clubs: 1247,
    total_athletes: 28500,
    certified_coaches: 890,
    certified_referees: 156,
    tournaments_year: 42,
    budget_allocated: 12500000000,
    budget_spent: 7800000000,
    pending_approvals: 14,
    international_partners: 6,
    belt_exams_scheduled: 3,
};

const FALLBACK_APPROVALS = [
    { id: 'apr-01', title: 'Đăng ký CLB Phú Nhuận', type: 'club_registration', submitted: '2026-03-09', priority: 'normal' },
    { id: 'apr-02', title: 'Chi phí tổ chức Giải QG 2026', type: 'expense_large', submitted: '2026-03-08', priority: 'urgent' },
    { id: 'apr-03', title: 'Cấp Thẻ TT Quốc gia — Đợt 1/2026', type: 'referee_card', submitted: '2026-03-07', priority: 'normal' },
    { id: 'apr-04', title: 'MOU LĐ Vovinam Nhật Bản', type: 'international', submitted: '2026-03-06', priority: 'normal' },
    { id: 'apr-05', title: 'Chi phí tập huấn TT tại Đà Nẵng', type: 'expense_medium', submitted: '2026-03-05', priority: 'urgent' },
];

const ALERTS = [
    { level: 'critical', msg: 'Ngân sách Q1 đã sử dụng 62% — cần xem xét', time: '2h trước' },
    { level: 'warning', msg: '3 MOU sẽ hết hạn trong Q2/2026', time: '1 ngày trước' },
    { level: 'info', msg: 'Giải VCT Quốc gia 2026 — cần phê duyệt kế hoạch', time: '2 ngày trước' },
];

const ALERT_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
    critical: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', icon: '🔴' },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🟡' },
    info: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', icon: '🔵' },
};

// ── Component ────────────────────────────────────────────────

export function Page_executive_dashboard() {
    // ── API Fetch ────────────────────────────────────────
    const statsApi = useApiFetch<typeof FALLBACK_KPI>()
    const pendingApi = useApiFetch<{ requests: typeof FALLBACK_APPROVALS }>()

    useEffect(() => {
        statsApi.execute('/federation/stats')
        pendingApi.execute('/approvals/my-pending')
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const KPI = statsApi.data ?? FALLBACK_KPI
    const RECENT_APPROVALS = pendingApi.data?.requests ?? FALLBACK_APPROVALS

    const budgetPercent = useMemo(() =>
        Math.round((KPI.budget_spent / KPI.budget_allocated) * 100),
        [KPI]);

    const formatVND = (v: number) => {
        if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(0)} triệu`;
        return v.toLocaleString();
    };

    return (
        <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    🏛️ Bảng điều khiển Chủ tịch
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
                    Tổng quan chiến lược — Liên đoàn Võ cổ truyền Việt Nam
                </p>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Tỉnh/Thành', value: KPI.total_provinces, icon: '🏢', color: '#3b82f6' },
                    { label: 'CLB Hoạt động', value: KPI.active_clubs.toLocaleString(), icon: '🏠', color: '#10b981' },
                    { label: 'VĐV Đăng ký', value: (KPI.total_athletes / 1000).toFixed(1) + 'K', icon: '🥋', color: '#f59e0b' },
                    { label: 'Giải đấu 2026', value: KPI.tournaments_year, icon: '🏆', color: '#8b5cf6' },
                    { label: 'HLV Chứng nhận', value: KPI.certified_coaches, icon: '👨‍🏫', color: '#ec4899' },
                    { label: 'Trọng tài QG', value: KPI.certified_referees, icon: '👨‍⚖️', color: '#06b6d4' },
                    { label: 'Đối tác QT', value: KPI.international_partners, icon: '🌍', color: '#14b8a6' },
                    { label: 'Chờ phê duyệt', value: KPI.pending_approvals, icon: '⏳', color: '#ef4444' },
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

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Budget Card */}
                <div style={{
                    background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 16, padding: 24,
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
                        💰 Ngân sách 2026
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Đã chi / Tổng phân bổ</span>
                        <span style={{ fontSize: 13, color: budgetPercent > 70 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                            {budgetPercent}%
                        </span>
                    </div>
                    <div style={{
                        height: 10, background: 'rgba(148,163,184,0.1)', borderRadius: 5, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 5,
                            background: budgetPercent > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' :
                                'linear-gradient(90deg, #10b981, #3b82f6)',
                            width: `${budgetPercent}%`, transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>Đã chi: <strong style={{ color: '#e2e8f0' }}>{formatVND(KPI.budget_spent)}</strong></span>
                        <span style={{ color: '#94a3b8' }}>Tổng: <strong style={{ color: '#e2e8f0' }}>{formatVND(KPI.budget_allocated)}</strong></span>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
                        Còn lại: <strong style={{ color: '#10b981' }}>{formatVND(KPI.budget_allocated - KPI.budget_spent)}</strong>
                    </div>
                </div>

                {/* Alerts Card */}
                <div style={{
                    background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 16, padding: 24,
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
                        🚨 Cảnh báo & Nhắc nhở
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ALERTS.map((a, i) => {
                            const style = ALERT_STYLES[a.level] ?? ALERT_STYLES.info;
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '10px 14px', borderRadius: 10,
                                    background: style.bg,
                                }}>
                                    <span>{style.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, color: '#e2e8f0' }}>{a.msg}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.time}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pending Approvals Table */}
            <div style={{
                marginTop: 20,
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 16, padding: 24,
            }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
                    ⏳ Phê duyệt cần xử lý ({RECENT_APPROVALS.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {RECENT_APPROVALS.map(a => (
                        <div key={a.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 10,
                            background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)',
                        }}>
                            <span style={{ fontSize: 14 }}>
                                {a.priority === 'urgent' ? '🔴' : '🟢'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{a.title}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                    {a.type.replace(/_/g, ' ')} • {a.submitted}
                                </div>
                            </div>
                            <button style={{
                                padding: '6px 16px', borderRadius: 8, border: 'none',
                                background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Xem →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Page_executive_dashboard;
