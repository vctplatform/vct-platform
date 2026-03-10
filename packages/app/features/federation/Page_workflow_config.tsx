// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — WORKFLOW CONFIGURATION PAGE
// Admin page for viewing and managing 15 predefined approval
// workflow templates with step details.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState } from 'react';

// ── Types ────────────────────────────────────────────────────

interface WorkflowStep {
    step: number;
    name: string;
    role: string;
    requires_all?: boolean;
    min_approvals?: number;
}

interface WorkflowDefinition {
    code: string;
    entity_type: string;
    display_name: string;
    steps: WorkflowStep[];
    group: string;
}

// ── Data ─────────────────────────────────────────────────────

const WORKFLOW_DEFS: WorkflowDefinition[] = [
    // ── Group A: Hành chính ──
    {
        code: 'club_registration', entity_type: 'club', group: 'administration',
        display_name: 'Đăng ký thành lập CLB / Võ đường',
        steps: [
            { step: 1, name: 'LĐ Tỉnh xem xét', role: 'provincial_admin' },
            { step: 2, name: 'LĐ Quốc gia xác nhận', role: 'federation_secretary' },
        ],
    },
    {
        code: 'member_registration', entity_type: 'member', group: 'administration',
        display_name: 'Đăng ký hội viên vào CLB',
        steps: [{ step: 1, name: 'HLV xác nhận', role: 'coach' }],
    },
    {
        code: 'referee_card', entity_type: 'referee', group: 'administration',
        display_name: 'Cấp/Gia hạn Thẻ Trọng tài',
        steps: [
            { step: 1, name: 'GĐ Kỹ thuật kiểm tra', role: 'technical_director' },
            { step: 2, name: 'LĐ Quốc gia ký', role: 'president' },
        ],
    },
    // ── Group B: Giải đấu ──
    {
        code: 'tournament_hosting', entity_type: 'tournament', group: 'tournament',
        display_name: 'Đăng ký Tổ chức Giải đấu',
        steps: [
            { step: 1, name: 'Thư ký LĐ thẩm định', role: 'federation_secretary' },
            { step: 2, name: 'GĐ Kỹ thuật kiểm tra', role: 'technical_director' },
            { step: 3, name: 'Chủ tịch LĐ phê duyệt', role: 'president' },
        ],
    },
    {
        code: 'team_registration', entity_type: 'team', group: 'tournament',
        display_name: 'Đoàn Đăng ký Tham gia Giải',
        steps: [{ step: 1, name: 'BTC giải duyệt', role: 'tournament_director' }],
    },
    {
        code: 'athlete_registration', entity_type: 'registration', group: 'tournament',
        display_name: 'VĐV Đăng ký Nội dung Thi đấu',
        steps: [{ step: 1, name: 'Auto-validate + BTC duyệt', role: 'tournament_director' }],
    },
    {
        code: 'result_approval', entity_type: 'match_result', group: 'tournament',
        display_name: 'Phê duyệt Kết quả Thi đấu',
        steps: [
            { step: 1, name: 'Trọng tài chính xác nhận', role: 'chief_referee' },
            { step: 2, name: 'BTC phê duyệt', role: 'tournament_director' },
        ],
    },
    // ── Group C: Tài chính ──
    {
        code: 'expense_small', entity_type: 'transaction', group: 'finance',
        display_name: 'Phê duyệt Chi tiêu (≤ 5 triệu)',
        steps: [{ step: 1, name: 'Thư ký LĐ duyệt', role: 'federation_secretary' }],
    },
    {
        code: 'expense_medium', entity_type: 'transaction', group: 'finance',
        display_name: 'Phê duyệt Chi tiêu (5-50 triệu)',
        steps: [
            { step: 1, name: 'Thư ký LĐ duyệt', role: 'federation_secretary' },
            { step: 2, name: 'Chủ tịch LĐ phê duyệt', role: 'president' },
        ],
    },
    {
        code: 'expense_large', entity_type: 'transaction', group: 'finance',
        display_name: 'Phê duyệt Chi tiêu (> 50 triệu)',
        steps: [
            { step: 1, name: 'Thư ký LĐ duyệt', role: 'federation_secretary' },
            { step: 2, name: 'Chủ tịch LĐ phê duyệt', role: 'president' },
            { step: 3, name: 'Ban thường vụ (2/3 đồng ý)', role: 'executive_board', requires_all: false, min_approvals: 3 },
        ],
    },
    {
        code: 'fee_confirmation', entity_type: 'payment', group: 'finance',
        display_name: 'Xác nhận Đóng Lệ phí Đoàn',
        steps: [{ step: 1, name: 'Kế toán xác nhận', role: 'accountant' }],
    },
    // ── Group D: Đào tạo ──
    {
        code: 'belt_promotion', entity_type: 'belt_exam', group: 'training',
        display_name: 'Thi Thăng Đai',
        steps: [
            { step: 1, name: 'Ban chuyên môn xét điều kiện', role: 'technical_director' },
            { step: 2, name: 'LĐ cấp bằng', role: 'president' },
        ],
    },
    {
        code: 'training_class', entity_type: 'training_class', group: 'training',
        display_name: 'Mở Lớp Đào tạo / Tập huấn',
        steps: [
            { step: 1, name: 'GĐ Kỹ thuật thẩm định', role: 'technical_director' },
            { step: 2, name: 'LĐ phê duyệt', role: 'president' },
        ],
    },
    // ── Group E: Nội dung ──
    {
        code: 'news_publish', entity_type: 'news', group: 'content',
        display_name: 'Phê duyệt Tin tức / Thông báo',
        steps: [{ step: 1, name: 'Thư ký duyệt', role: 'federation_secretary' }],
    },
    {
        code: 'complaint', entity_type: 'complaint', group: 'content',
        display_name: 'Khiếu nại & Kháng nghị',
        steps: [
            { step: 1, name: 'Ban giải quyết KN xem xét', role: 'discipline_board' },
            { step: 2, name: 'BTC ra quyết định', role: 'tournament_director' },
        ],
    },
];

const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
    administration: { label: 'Hành chính — Tổ chức', icon: '🏛️', color: '#3b82f6' },
    tournament: { label: 'Giải đấu', icon: '🏆', color: '#f59e0b' },
    finance: { label: 'Tài chính', icon: '💰', color: '#10b981' },
    training: { label: 'Đào tạo & Di sản', icon: '🥋', color: '#8b5cf6' },
    content: { label: 'Nội dung & Cộng đồng', icon: '📢', color: '#ec4899' },
};

const ROLE_LABELS: Record<string, string> = {
    provincial_admin: 'Admin Tỉnh', federation_secretary: 'Thư ký LĐ',
    coach: 'HLV', technical_director: 'GĐ Kỹ thuật', president: 'Chủ tịch LĐ',
    tournament_director: 'Giám đốc giải', chief_referee: 'Trọng tài chính',
    accountant: 'Kế toán', executive_board: 'Ban thường vụ',
    discipline_board: 'Ban Kỷ luật',
};

// ── Component ────────────────────────────────────────────────

export function Page_workflow_config() {
    const [expandedCode, setExpandedCode] = useState<string | null>(null);
    const [filterGroup, setFilterGroup] = useState<string>('all');

    const groups = Object.keys(GROUP_META);
    const filtered = filterGroup === 'all' ? WORKFLOW_DEFS : WORKFLOW_DEFS.filter(w => w.group === filterGroup);

    const groupedWorkflows = groups.reduce((acc, g) => {
        acc[g] = filtered.filter(w => w.group === g);
        return acc;
    }, {} as Record<string, WorkflowDefinition[]>);

    return (
        <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    ⚙️ Cấu hình Luồng phê duyệt
                </h1>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
                    {WORKFLOW_DEFS.length} luồng phê duyệt đã được cấu hình • Tổng cộng {WORKFLOW_DEFS.reduce((s, w) => s + w.steps.length, 0)} bước duyệt
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilterGroup('all')}
                    style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: filterGroup === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.08)',
                        color: filterGroup === 'all' ? '#60a5fa' : '#94a3b8',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                >
                    Tất cả ({WORKFLOW_DEFS.length})
                </button>
                {groups.map(g => {
                    const meta = GROUP_META[g];
                    const count = WORKFLOW_DEFS.filter(w => w.group === g).length;
                    return (
                        <button
                            key={g}
                            onClick={() => setFilterGroup(g)}
                            style={{
                                padding: '6px 14px', borderRadius: 8, border: 'none',
                                background: filterGroup === g ? `${meta.color}20` : 'rgba(148,163,184,0.08)',
                                color: filterGroup === g ? meta.color : '#94a3b8',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            }}
                        >
                            {meta.icon} {meta.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Workflow Cards */}
            {groups.map(g => {
                const items = groupedWorkflows[g];
                if (!items || items.length === 0) return null;
                const meta = GROUP_META[g];

                return (
                    <div key={g} style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: meta.color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{meta.icon}</span> {meta.label}
                        </h2>

                        {items.map(wf => {
                            const isExpanded = expandedCode === wf.code;
                            return (
                                <div key={wf.code} style={{
                                    background: 'rgba(30,41,59,0.5)', border: `1px solid ${isExpanded ? `${meta.color}40` : 'rgba(148,163,184,0.1)'}`,
                                    borderRadius: 12, marginBottom: 10, overflow: 'hidden',
                                    transition: 'border-color 0.2s',
                                }}>
                                    <button
                                        onClick={() => setExpandedCode(isExpanded ? null : wf.code)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                            padding: '14px 18px', background: 'none', border: 'none',
                                            color: '#e2e8f0', cursor: 'pointer', textAlign: 'left',
                                        }}
                                    >
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            width: 28, height: 28, borderRadius: 8,
                                            background: `${meta.color}15`, color: meta.color,
                                            fontSize: 13, fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {wf.steps.length}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{wf.display_name}</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                                {wf.code} • {wf.entity_type}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>
                                            {wf.steps.length} bước
                                        </span>
                                        <span style={{ fontSize: 14, color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </button>

                                    {isExpanded && (
                                        <div style={{
                                            padding: '0 18px 16px', borderTop: '1px solid rgba(148,163,184,0.08)',
                                        }}>
                                            {/* Step chain visualization */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '16px 0', overflowX: 'auto' }}>
                                                {wf.steps.map((s, si) => (
                                                    <React.Fragment key={s.step}>
                                                        <div style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            minWidth: 140, padding: '12px 14px',
                                                            background: `${meta.color}08`, border: `1px solid ${meta.color}30`,
                                                            borderRadius: 10, textAlign: 'center',
                                                        }}>
                                                            <div style={{
                                                                width: 24, height: 24, borderRadius: '50%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: `${meta.color}20`, color: meta.color,
                                                                fontSize: 12, fontWeight: 700, marginBottom: 8,
                                                            }}>{s.step}</div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                                                                {s.name}
                                                            </div>
                                                            <div style={{
                                                                fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                                                background: 'rgba(148,163,184,0.1)', color: '#94a3b8',
                                                            }}>
                                                                {ROLE_LABELS[s.role] || s.role}
                                                            </div>
                                                            {s.requires_all !== undefined && (
                                                                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                                                                    ⚠️ Cần {s.min_approvals || 1} phiếu
                                                                </div>
                                                            )}
                                                        </div>
                                                        {si < wf.steps.length - 1 && (
                                                            <div style={{
                                                                width: 32, height: 2, background: `${meta.color}40`,
                                                                flexShrink: 0, position: 'relative',
                                                            }}>
                                                                <span style={{
                                                                    position: 'absolute', right: -4, top: -6,
                                                                    color: meta.color, fontSize: 14,
                                                                }}>→</span>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default Page_workflow_config;
