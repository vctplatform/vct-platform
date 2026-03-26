// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — APPROVAL DETAIL PAGE (API-DRIVEN)
// Full approval request detail with live step timeline, actions,
// attachments, and audit history. Fetches from backend API.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { VCT_PageContainer } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';

// ── Types ────────────────────────────────────────────────────

interface ApprovalStep {
    id: string;
    step_number: number;
    step_name: string;
    approver_role: string;
    decision: 'approved' | 'rejected' | 'returned' | '';
    decision_by: string;
    decision_at: string;
    comment: string;
}

interface HistoryEntry {
    id: string;
    action: string;
    action_by: string;
    action_at: string;
    comment: string;
    from_step: number;
    to_step: number;
}

interface ApprovalRequest {
    id: string;
    workflow_code: string;
    entity_type: string;
    entity_id: string;
    title: string;
    description: string;
    status: string;
    current_step: number;
    total_steps: number;
    requested_by: string;
    requested_at: string;
    deadline?: string;
    attachments?: { name: string; url: string; type: string }[];
}

// ── Status Helpers ───────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: 'Chờ xử lý', color: 'var(--vct-warning)', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
    in_review: { label: 'Đang xem xét', color: 'var(--vct-info)', bg: 'rgba(59,130,246,0.15)', icon: '🔍' },
    approved: { label: 'Đã phê duyệt', color: 'var(--vct-success)', bg: 'rgba(16,185,129,0.15)', icon: '✅' },
    rejected: { label: 'Từ chối', color: 'var(--vct-danger)', bg: 'rgba(239,68,68,0.15)', icon: '❌' },
    returned: { label: 'Trả lại', color: 'var(--vct-warning)', bg: 'rgba(249,115,22,0.15)', icon: '↩️' },
    cancelled: { label: 'Đã hủy', color: 'var(--vct-text-tertiary)', bg: 'rgba(107,114,128,0.15)', icon: '🚫' },
};

const DECISION_MAP: Record<string, { label: string; color: string }> = {
    approved: { label: 'Đồng ý', color: 'var(--vct-success)' },
    rejected: { label: 'Từ chối', color: 'var(--vct-danger)' },
    returned: { label: 'Trả lại', color: 'var(--vct-warning)' },
};

const ROLE_LABELS: Record<string, string> = {
    provincial_admin: 'Admin Tỉnh', federation_secretary: 'Thư ký LĐ',
    coach: 'HLV', technical_director: 'GĐ Kỹ thuật', president: 'Chủ tịch LĐ',
    tournament_director: 'Giám đốc giải', chief_referee: 'Trọng tài chính',
    accountant: 'Kế toán', executive_board: 'Ban thường vụ', discipline_board: 'Ban Kỷ luật',
};

function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysRemaining(deadline: string) {
    const now = new Date();
    const dl = new Date(deadline);
    return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Component ────────────────────────────────────────────────

interface Props {
    requestId?: string;
}

export function Page_approval_detail({ requestId }: Props) {
    // Default to a demo ID if none provided (for fallback/demo)
    const id = requestId || 'apr-001';

    const { data: request, isLoading, refetch } = useApiQuery<ApprovalRequest>(`/api/v1/approvals/${id}`, { enabled: !!id });
    const { data: stepsData } = useApiQuery<{ request_id: string; steps: ApprovalStep[] }>(`/api/v1/approvals/${id}/steps`, { enabled: !!id });
    const { data: historyData } = useApiQuery<{ request_id: string; history: HistoryEntry[] }>(`/api/v1/approvals/${id}/history`, { enabled: !!id });

    const [actionComment, setActionComment] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [actionInFlight, setActionInFlight] = useState('');

    const { mutate: doApprove } = useApiMutation<{ comment: string }, { status: string }>('POST', `/api/v1/approvals/${id}/approve`);
    const { mutate: doReject } = useApiMutation<{ reason: string }, { status: string }>('POST', `/api/v1/approvals/${id}/reject`);
    const { mutate: doReturn } = useApiMutation<{ reason: string }, { status: string }>('POST', `/api/v1/approvals/${id}/return`);

    const steps = stepsData?.steps || [];
    const history = historyData?.history || [];

    const handleAction = async (action: 'approve' | 'reject' | 'return') => {
        setActionInFlight(action);
        try {
            if (action === 'approve') await doApprove({ comment: actionComment });
            else if (action === 'reject') await doReject({ reason: actionComment });
            else await doReturn({ reason: actionComment });
            setActionComment('');
            refetch();
        } catch { /* displayed by mutation state */ }
        setActionInFlight('');
    };

    if (isLoading) {
        return (
            <VCT_PageContainer size="narrow">
                <div className="space-y-4 py-12">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />)}
                </div>
            </VCT_PageContainer>
        );
    }

    if (!request) {
        return (
            <VCT_PageContainer size="narrow">
                <div className="text-center py-20">
                    <VCT_Icons.Alert size={48} className="text-vct-text-muted mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-vct-text mb-2">Không tìm thấy yêu cầu</h2>
                    <p className="text-sm text-vct-text-muted">Yêu cầu #{id} không tồn tại hoặc bạn không có quyền xem.</p>
                    <a href="/appeals/phe-duyet" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-vct-accent text-white text-sm font-bold">
                        ← Về danh sách
                    </a>
                </div>
            </VCT_PageContainer>
        );
    }

    const statusFallback = { label: 'Chờ xử lý', color: 'var(--vct-warning)', bg: 'rgba(245,158,11,0.15)', icon: '⏳' };
    const statusInfo = STATUS_MAP[request.status] ?? statusFallback;
    const isActionable = request.status === 'pending' || request.status === 'in_review';
    const deadlineDays = request.deadline ? daysRemaining(request.deadline) : null;
    const approvedCount = steps.filter(s => s.decision === 'approved').length;

    return (
        <VCT_PageContainer size="narrow">
            {/* Back Link */}
            <a href="/appeals/phe-duyet" className="inline-flex items-center gap-1.5 text-xs text-vct-text-muted hover:text-vct-accent mb-4 transition-colors">
                <VCT_Icons.ArrowRight size={14} className="rotate-180" /> Về danh sách phê duyệt
            </a>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                        style={{ background: statusInfo.bg, color: statusInfo.color, borderColor: `${statusInfo.color}30` }}>
                        {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span className="text-xs text-vct-text-muted">#{request.id}</span>
                    {deadlineDays !== null && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${deadlineDays <= 3 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            ⏰ {deadlineDays > 0 ? `Còn ${deadlineDays} ngày` : 'Quá hạn'}
                        </span>
                    )}
                </div>
                <h1 className="text-xl font-black text-vct-text tracking-tight mb-1">{request.title}</h1>
                {request.description && <p className="text-sm text-vct-text-muted leading-relaxed">{request.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-vct-text-muted flex-wrap">
                    <span>📝 {request.requested_by}</span>
                    <span>📅 {formatDate(request.requested_at)}</span>
                    <span>📋 {request.workflow_code.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
            </div>

            {/* Step Timeline */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-6 mb-6">
                <h2 className="text-sm font-bold text-vct-text mb-4">
                    📊 Tiến trình ({approvedCount}/{request.total_steps || steps.length})
                </h2>

                {/* Progress Bar */}
                <div className="h-1.5 bg-vct-bg rounded-full mb-6 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                        style={{
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            width: `${request.total_steps ? (approvedCount / request.total_steps) * 100 : 0}%`,
                        }} />
                </div>

                {/* Steps */}
                <div className="relative">
                    {steps.map((step, i) => {
                        const isActive = step.step_number === request.current_step && !step.decision;
                        const isDone = step.decision === 'approved';
                        const isRejected = step.decision === 'rejected' || step.decision === 'returned';

                        return (
                            <div key={step.id} className="flex gap-4 relative" style={{ marginBottom: i < steps.length - 1 ? 20 : 0 }}>
                                {i < steps.length - 1 && (
                                    <div className="absolute left-[18px] top-10 bottom-[-20px] w-0.5"
                                        style={{ background: isDone ? 'var(--vct-success)' : 'rgba(148,163,184,0.15)' }} />
                                )}
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold z-10 shrink-0 border-2"
                                    style={{
                                        background: isDone ? 'rgba(16,185,129,0.15)' : isRejected ? 'rgba(239,68,68,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.05)',
                                        borderColor: isDone ? 'var(--vct-success)' : isRejected ? 'var(--vct-danger)' : isActive ? 'var(--vct-info)' : 'rgba(148,163,184,0.15)',
                                        color: isDone ? 'var(--vct-success)' : isRejected ? 'var(--vct-danger)' : isActive ? 'var(--vct-info)' : 'var(--vct-text-tertiary)',
                                        boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
                                    }}>
                                    {isDone ? '✓' : isRejected ? '✗' : step.step_number}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className={`text-sm font-semibold ${isActive ? 'text-vct-text' : isDone ? 'text-emerald-500' : 'text-vct-text-muted'}`}>
                                            {step.step_name}
                                        </span>
                                        {isActive && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">ĐANG CHỜ</span>}
                                        {step.decision && DECISION_MAP[step.decision] && (
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                                                style={{ background: `${DECISION_MAP[step.decision]!.color}20`, color: DECISION_MAP[step.decision]!.color }}>
                                                {DECISION_MAP[step.decision]!.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-vct-text-muted">
                                        {ROLE_LABELS[step.approver_role] || step.approver_role}
                                        {step.decision_by && ` • ${step.decision_by}`}
                                        {step.decision_at && ` • ${formatDate(step.decision_at)}`}
                                    </div>
                                    {step.comment && (
                                        <div className="mt-2 px-3 py-2 rounded-lg bg-vct-bg border-l-2 border-vct-border/50 text-xs text-vct-text-muted">
                                            💬 {step.comment}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attachments */}
            {request.attachments && request.attachments.length > 0 && (
                <div className="rounded-2xl border border-vct-border bg-vct-elevated p-6 mb-6">
                    <h2 className="text-sm font-bold text-vct-text mb-3">📎 Hồ sơ đính kèm ({request.attachments.length})</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {request.attachments.map((att, i) => (
                            <a key={i} href={att.url}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-vct-bg border border-vct-border/50 text-xs text-vct-text hover:border-vct-accent/30 transition-colors no-underline">
                                <span>{att.type === 'pdf' ? '📄' : att.type === 'image' ? '🖼️' : '📝'}</span>
                                <span className="truncate">{att.name}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Panel */}
            {isActionable && (
                <div className="rounded-2xl border border-blue-500/20 bg-vct-elevated p-6 mb-6"
                    style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))' }}>
                    <h2 className="text-sm font-bold text-vct-text mb-3">⚡ Hành động</h2>
                    <textarea
                        value={actionComment}
                        onChange={e => setActionComment(e.target.value)}
                        placeholder="Nhập nhận xét (tuỳ chọn)..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-vct-bg/50 border border-vct-border text-vct-text text-sm resize-none focus:outline-none focus:border-vct-accent/50 mb-3"
                    />
                    <div className="flex gap-3">
                        <button onClick={() => handleAction('approve')} disabled={!!actionInFlight}
                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {actionInFlight === 'approve' ? '...' : '✅ Phê duyệt'}
                        </button>
                        <button onClick={() => handleAction('return')} disabled={!!actionInFlight}
                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                            {actionInFlight === 'return' ? '...' : '↩️ Trả lại'}
                        </button>
                        <button onClick={() => handleAction('reject')} disabled={!!actionInFlight}
                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                            {actionInFlight === 'reject' ? '...' : '❌ Từ chối'}
                        </button>
                    </div>
                </div>
            )}

            {/* Audit History */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-6">
                <button onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 w-full text-left bg-transparent border-0 text-sm font-bold text-vct-text cursor-pointer p-0">
                    📜 Lịch sử xử lý ({history.length})
                    <span className="ml-auto text-xs text-vct-text-muted">{showHistory ? '▲' : '▼'}</span>
                </button>

                {showHistory && (
                    <div className="mt-4 space-y-0">
                        {history.map((h, i) => (
                            <div key={h.id} className="flex gap-3 py-3"
                                style={{ borderTop: i > 0 ? '1px solid var(--vct-border)' : 'none' }}>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                                    style={{
                                        background: h.action === 'approved' ? 'rgba(16,185,129,0.15)' :
                                            h.action === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                        color: h.action === 'approved' ? 'var(--vct-success)' :
                                            h.action === 'rejected' ? 'var(--vct-danger)' : 'var(--vct-info)',
                                    }}>
                                    {h.action === 'submitted' ? '📝' : h.action === 'approved' ? '✓' : h.action === 'rejected' ? '✗' : '↩'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-vct-text">
                                        <strong>{h.action_by}</strong>
                                        <span className="text-vct-text-muted"> — {h.action}</span>
                                        {h.from_step > 0 && <span className="text-vct-text-muted"> (bước {h.from_step} → {h.to_step})</span>}
                                    </div>
                                    <div className="text-[11px] text-vct-text-muted mt-0.5">{formatDate(h.action_at)}</div>
                                    {h.comment && <div className="text-xs text-vct-text-muted mt-1">💬 {h.comment}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VCT_PageContainer>
    );
}

export default Page_approval_detail;
