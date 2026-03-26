// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — WORKFLOW CONFIGURATION PAGE
// Admin page for viewing and managing 15 predefined approval
// workflow templates with animated step-chain visualization.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VCT_PageContainer } from '@vct/ui';

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
    administration: { label: 'Hành chính — Tổ chức', icon: '🏛️', color: 'var(--vct-info)' },
    tournament: { label: 'Giải đấu', icon: '🏆', color: 'var(--vct-warning)' },
    finance: { label: 'Tài chính', icon: '💰', color: 'var(--vct-success)' },
    training: { label: 'Đào tạo & Di sản', icon: '🥋', color: 'var(--vct-info)' },
    content: { label: 'Nội dung & Cộng đồng', icon: '📢', color: 'var(--vct-accent-pink)' },
};

const ROLE_LABELS: Record<string, string> = {
    provincial_admin: 'Admin Tỉnh', federation_secretary: 'Thư ký LĐ',
    coach: 'HLV', technical_director: 'GĐ Kỹ thuật', president: 'Chủ tịch LĐ',
    tournament_director: 'Giám đốc giải', chief_referee: 'Trọng tài chính',
    accountant: 'Kế toán', executive_board: 'Ban thường vụ',
    discipline_board: 'Ban Kỷ luật',
};

// ── Animation Variants ───────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
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
        <VCT_PageContainer size="wide" animated>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
                <h1 className="text-[22px] font-bold text-vct-text m-0">
                    ⚙️ Cấu hình Luồng phê duyệt
                </h1>
                <p className="text-sm text-vct-text-muted mt-1.5">
                    {WORKFLOW_DEFS.length} luồng phê duyệt đã được cấu hình • Tổng cộng {WORKFLOW_DEFS.reduce((s, w) => s + w.steps.length, 0)} bước duyệt
                </p>
            </motion.div>

            {/* Filter Tabs */}
            <div className="relative flex gap-2 mb-6 flex-wrap">
                <FilterPill active={filterGroup === 'all'} onClick={() => setFilterGroup('all')} color="var(--vct-info)">
                    Tất cả ({WORKFLOW_DEFS.length})
                </FilterPill>
                {groups.map(g => {
                    const meta = GROUP_META[g]!;
                    const count = WORKFLOW_DEFS.filter(w => w.group === g).length;
                    return (
                        <FilterPill key={g} active={filterGroup === g} color={meta.color} onClick={() => setFilterGroup(g)}>
                            {meta.icon} {meta.label} ({count})
                        </FilterPill>
                    );
                })}
            </div>

            {/* Workflow Cards */}
            <AnimatePresence mode="wait">
                <motion.div key={filterGroup} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {groups.map(g => {
                        const items = groupedWorkflows[g];
                        if (!items || items.length === 0) return null;
                        const meta = GROUP_META[g]!;

                        return (
                            <div key={g} className="mb-7">
                                <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2" style={{ color: meta.color }}>
                                    <span>{meta.icon}</span> {meta.label}
                                </h2>

                                {items.map((wf, wi) => {
                                    const isExpanded = expandedCode === wf.code;
                                    return (
                                        <motion.div
                                            key={wf.code}
                                            custom={wi} variants={fadeUp} initial="hidden" animate="visible"
                                            className="mb-2.5 rounded-xl border overflow-hidden transition-colors"
                                            style={{
                                                background: 'var(--vct-elevated, rgba(30,41,59,0.5))',
                                                borderColor: isExpanded ? `${meta.color}40` : 'var(--vct-border, rgba(148,163,184,0.1))',
                                            }}
                                        >
                                            <button
                                                onClick={() => setExpandedCode(isExpanded ? null : wf.code)}
                                                className="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left cursor-pointer text-vct-text hover:bg-white/2 transition-colors"
                                            >
                                                <span
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0"
                                                    style={{ background: `${meta.color}15`, color: meta.color }}
                                                >{wf.steps.length}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate">{wf.display_name}</div>
                                                    <div className="text-xs text-vct-text-muted mt-0.5">{wf.code} • {wf.entity_type}</div>
                                                </div>
                                                <span className="text-xs text-vct-text-muted mr-1">{wf.steps.length} bước</span>
                                                <motion.span
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-sm text-vct-text-muted"
                                                >▼</motion.span>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4 border-t border-white/6">
                                                            {/* ── Step Chain SVG ── */}
                                                            <div className="flex items-center gap-0 py-4 overflow-x-auto">
                                                                {wf.steps.map((s, si) => (
                                                                    <React.Fragment key={s.step}>
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            transition={{ delay: si * 0.12 }}
                                                                            className="flex flex-col items-center min-w-[140px] p-3 rounded-xl text-center border"
                                                                            style={{
                                                                                background: `${meta.color}08`,
                                                                                borderColor: `${meta.color}30`,
                                                                            }}
                                                                        >
                                                                            <div
                                                                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2"
                                                                                style={{ background: `${meta.color}20`, color: meta.color }}
                                                                            >{s.step}</div>
                                                                            <div className="text-[13px] font-semibold text-vct-text mb-1">{s.name}</div>
                                                                            <div className="text-[11px] px-2 py-0.5 rounded-md bg-white/6 text-vct-text-muted">
                                                                                {ROLE_LABELS[s.role] || s.role}
                                                                            </div>
                                                                            {s.requires_all !== undefined && (
                                                                                <div className="text-[11px] text-amber-500 mt-1">⚠️ Cần {s.min_approvals || 1} phiếu</div>
                                                                            )}
                                                                        </motion.div>
                                                                        {si < wf.steps.length - 1 && (
                                                                            <div className="relative flex-shrink-0 w-10 h-0.5 mx-0">
                                                                                {/* SVG animated connector */}
                                                                                <svg width="40" height="12" viewBox="0 0 40 12" className="absolute top-1/2 -translate-y-1/2">
                                                                                    <line x1="0" y1="6" x2="30" y2="6" stroke={meta.color} strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
                                                                                    <motion.circle
                                                                                        cx="0" cy="6" r="2.5" fill={meta.color}
                                                                                        animate={{ cx: [0, 30, 0] }}
                                                                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                                                    />
                                                                                    <polygon points="30,2 38,6 30,10" fill={meta.color} opacity="0.7" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </VCT_PageContainer>
    );
}

/* ── Filter Pill Sub-Component ────────────────────────────── */
function FilterPill({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors"
            style={{
                background: active ? `${color}20` : 'rgba(148,163,184,0.08)',
                color: active ? color: 'var(--vct-text-tertiary)',
            }}
        >{children}</motion.button>
    );
}

export default Page_workflow_config;
