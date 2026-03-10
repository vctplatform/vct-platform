// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — APPROVAL DETAIL PAGE
// Full approval request detail with step timeline, actions,
// attachments, and audit history.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo } from 'react';

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
    status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'returned' | 'cancelled';
    current_step: number;
    total_steps: number;
    requested_by: string;
    requested_at: string;
    deadline?: string;
    attachments: { name: string; url: string; type: string }[];
    steps: ApprovalStep[];
    history: HistoryEntry[];
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_REQUEST: ApprovalRequest = {
    id: 'apr-001',
    workflow_code: 'club_registration',
    entity_type: 'club',
    entity_id: 'club-abc',
    title: 'Đăng ký thành lập CLB Tân Khánh Bà Trà - Quận 7',
    description: 'CLB chuyên đào tạo võ cổ truyền cho lứa tuổi 8-18. Cơ sở tại 123 Nguyễn Hữu Thọ, Quận 7, TP.HCM. HLV trưởng: Nguyễn Văn B (Huyền đai nhị đẳng).',
    status: 'in_review',
    current_step: 2,
    total_steps: 2,
    requested_by: 'Nguyễn Văn B',
    requested_at: '2026-03-05T10:30:00Z',
    deadline: '2026-03-20T23:59:59Z',
    attachments: [
        { name: 'Đơn đăng ký CLB.pdf', url: '#', type: 'pdf' },
        { name: 'Bằng cấp HLV.jpg', url: '#', type: 'image' },
        { name: 'Ảnh cơ sở (1).jpg', url: '#', type: 'image' },
        { name: 'Ảnh cơ sở (2).jpg', url: '#', type: 'image' },
        { name: 'Kế hoạch đào tạo.docx', url: '#', type: 'document' },
    ],
    steps: [
        {
            id: 'step-1', step_number: 1, step_name: 'LĐ Tỉnh TP.HCM xem xét',
            approver_role: 'provincial_admin', decision: 'approved',
            decision_by: 'Trần Thị C', decision_at: '2026-03-08T14:20:00Z',
            comment: 'Hồ sơ đầy đủ, cơ sở vật chất đạt yêu cầu.',
        },
        {
            id: 'step-2', step_number: 2, step_name: 'LĐ Quốc gia xác nhận',
            approver_role: 'federation_secretary', decision: '',
            decision_by: '', decision_at: '', comment: '',
        },
    ],
    history: [
        { id: 'h1', action: 'submitted', action_by: 'Nguyễn Văn B', action_at: '2026-03-05T10:30:00Z', comment: 'Nộp hồ sơ đăng ký CLB', from_step: 0, to_step: 1 },
        { id: 'h2', action: 'approved', action_by: 'Trần Thị C', action_at: '2026-03-08T14:20:00Z', comment: 'Hồ sơ đầy đủ, cơ sở vật chất đạt yêu cầu.', from_step: 1, to_step: 2 },
    ],
};

// ── Status Helpers ───────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: 'Chờ xử lý', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
    in_review: { label: 'Đang xem xét', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🔍' },
    approved: { label: 'Đã phê duyệt', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '✅' },
    rejected: { label: 'Từ chối', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '❌' },
    returned: { label: 'Trả lại', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: '↩️' },
    cancelled: { label: 'Đã hủy', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '🚫' },
};

const DECISION_MAP: Record<string, { label: string; color: string }> = {
    approved: { label: 'Đồng ý', color: '#10b981' },
    rejected: { label: 'Từ chối', color: '#ef4444' },
    returned: { label: 'Trả lại', color: '#f97316' },
};

function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysRemaining(deadline: string) {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

// ── Component ────────────────────────────────────────────────

export function Page_approval_detail() {
    const [request] = useState<ApprovalRequest>(MOCK_REQUEST);
    const [actionComment, setActionComment] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const statusInfo = STATUS_MAP[request.status] ?? STATUS_MAP.pending;
    const isActionable = request.status === 'pending' || request.status === 'in_review';
    const deadlineDays = request.deadline ? daysRemaining(request.deadline) : null;

    return (
        <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        color: statusInfo.color, background: statusInfo.bg,
                    }}>
                        {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>#{request.id}</span>
                    {deadlineDays !== null && (
                        <span style={{
                            fontSize: 12, padding: '2px 8px', borderRadius: 12,
                            background: deadlineDays <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)',
                            color: deadlineDays <= 3 ? '#ef4444' : '#60a5fa',
                            fontWeight: 500,
                        }}>
                            ⏰ {deadlineDays > 0 ? `Còn ${deadlineDays} ngày` : 'Quá hạn'}
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{request.title}</h1>
                <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>{request.description}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: '#64748b' }}>
                    <span>📝 Người gửi: <strong style={{ color: '#cbd5e1' }}>{request.requested_by}</strong></span>
                    <span>📅 {formatDate(request.requested_at)}</span>
                    <span>📋 {request.workflow_code.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
            </div>

            {/* Step Timeline */}
            <div style={{
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 20, margin: 0 }}>
                    📊 Tiến trình phê duyệt ({request.current_step}/{request.total_steps})
                </h2>

                {/* Progress Bar */}
                <div style={{
                    height: 6, background: 'rgba(148,163,184,0.1)', borderRadius: 3, marginBottom: 24, overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%', borderRadius: 3,
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        width: `${(request.steps.filter(s => s.decision === 'approved').length / request.total_steps) * 100}%`,
                        transition: 'width 0.5s ease',
                    }} />
                </div>

                {/* Steps */}
                <div style={{ position: 'relative' }}>
                    {request.steps.map((step, i) => {
                        const isActive = step.step_number === request.current_step && !step.decision;
                        const isDone = step.decision === 'approved';
                        const isRejected = step.decision === 'rejected' || step.decision === 'returned';

                        return (
                            <div key={step.id} style={{
                                display: 'flex', gap: 16, marginBottom: i < request.steps.length - 1 ? 20 : 0,
                                position: 'relative',
                            }}>
                                {/* Connector Line */}
                                {i < request.steps.length - 1 && (
                                    <div style={{
                                        position: 'absolute', left: 18, top: 40, bottom: -20,
                                        width: 2, background: isDone ? '#10b981' : 'rgba(148,163,184,0.15)',
                                    }} />
                                )}

                                {/* Step Icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 700, zIndex: 1,
                                    background: isDone ? 'rgba(16,185,129,0.2)' : isRejected ? 'rgba(239,68,68,0.2)' : isActive ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.1)',
                                    border: `2px solid ${isDone ? '#10b981' : isRejected ? '#ef4444' : isActive ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
                                    color: isDone ? '#10b981' : isRejected ? '#ef4444' : isActive ? '#3b82f6' : '#64748b',
                                    boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                                }}>
                                    {isDone ? '✓' : isRejected ? '✗' : step.step_number}
                                </div>

                                {/* Step Content */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: 15, fontWeight: 600,
                                            color: isActive ? '#f1f5f9' : isDone ? '#10b981' : '#94a3b8',
                                        }}>
                                            {step.step_name}
                                        </span>
                                        {isActive && (
                                            <span style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 8,
                                                background: 'rgba(59,130,246,0.2)', color: '#60a5fa',
                                                fontWeight: 600, letterSpacing: 0.5,
                                            }}>ĐANG CHỜ</span>
                                        )}
                                        {step.decision && DECISION_MAP[step.decision] && (
                                            <span style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 8,
                                                background: `${DECISION_MAP[step.decision]!.color}20`,
                                                color: DECISION_MAP[step.decision]!.color,
                                                fontWeight: 600,
                                            }}>{DECISION_MAP[step.decision]!.label}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                        Vai trò: {step.approver_role}
                                        {step.decision_by && ` • ${step.decision_by}`}
                                        {step.decision_at && ` • ${formatDate(step.decision_at)}`}
                                    </div>
                                    {step.comment && (
                                        <div style={{
                                            marginTop: 8, padding: '8px 12px', borderRadius: 8,
                                            background: 'rgba(148,163,184,0.05)', borderLeft: '3px solid rgba(148,163,184,0.2)',
                                            fontSize: 13, color: '#94a3b8', lineHeight: 1.5,
                                        }}>
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
            {request.attachments.length > 0 && (
                <div style={{
                    background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 16, padding: 24, marginBottom: 24,
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16, margin: 0 }}>
                        📎 Hồ sơ đính kèm ({request.attachments.length})
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                        {request.attachments.map((att, i) => (
                            <a key={i} href={att.url} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                borderRadius: 10, background: 'rgba(148,163,184,0.05)',
                                border: '1px solid rgba(148,163,184,0.1)', textDecoration: 'none',
                                color: '#cbd5e1', fontSize: 13, transition: 'all 0.2s',
                            }}>
                                <span style={{ fontSize: 18 }}>
                                    {att.type === 'pdf' ? '📄' : att.type === 'image' ? '🖼️' : '📝'}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {att.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Panel */}
            {isActionable && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
                    border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 24, marginBottom: 24,
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16, margin: 0 }}>
                        ⚡ Hành động
                    </h2>
                    <textarea
                        value={actionComment}
                        onChange={e => setActionComment(e.target.value)}
                        placeholder="Nhập nhận xét (tuỳ chọn)..."
                        style={{
                            width: '100%', minHeight: 80, padding: '12px 16px', borderRadius: 10,
                            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.15)',
                            color: '#e2e8f0', fontSize: 14, resize: 'vertical', outline: 'none',
                            marginBottom: 16, boxSizing: 'border-box',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    />
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{
                            flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            ✅ Phê duyệt
                        </button>
                        <button style={{
                            flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            ↩️ Trả lại (yêu cầu bổ sung)
                        </button>
                        <button style={{
                            flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            ❌ Từ chối
                        </button>
                    </div>
                </div>
            )}

            {/* Audit History */}
            <div style={{
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 16, padding: 24,
            }}>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        background: 'none', border: 'none', color: '#e2e8f0',
                        fontSize: 16, fontWeight: 600, cursor: 'pointer', padding: 0,
                    }}
                >
                    📜 Lịch sử xử lý ({request.history.length})
                    <span style={{ marginLeft: 'auto', fontSize: 14, color: '#64748b' }}>
                        {showHistory ? '▲' : '▼'}
                    </span>
                </button>

                {showHistory && (
                    <div style={{ marginTop: 16 }}>
                        {request.history.map((h, i) => (
                            <div key={h.id} style={{
                                display: 'flex', gap: 12, padding: '12px 0',
                                borderTop: i > 0 ? '1px solid rgba(148,163,184,0.1)' : 'none',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, flexShrink: 0,
                                    background: h.action === 'approved' ? 'rgba(16,185,129,0.15)' :
                                        h.action === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                    color: h.action === 'approved' ? '#10b981' :
                                        h.action === 'rejected' ? '#ef4444' : '#3b82f6',
                                }}>
                                    {h.action === 'submitted' ? '📝' : h.action === 'approved' ? '✓' : h.action === 'rejected' ? '✗' : '↩'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                                        <strong>{h.action_by}</strong>
                                        <span style={{ color: '#64748b' }}> — {h.action}</span>
                                        {h.from_step > 0 && (
                                            <span style={{ color: '#64748b' }}> (bước {h.from_step} → {h.to_step})</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{formatDate(h.action_at)}</div>
                                    {h.comment && (
                                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>💬 {h.comment}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Page_approval_detail;
