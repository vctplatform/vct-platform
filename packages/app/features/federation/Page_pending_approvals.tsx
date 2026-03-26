// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PENDING APPROVALS PAGE
// Shows all approval requests pending for the current user's role.
// Allows Approve / Reject actions with inline comments.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';
import { VCT_EmptyState, VCT_Badge } from '@vct/ui';
import { useAuth } from '../auth/AuthProvider';

// ── Types ────────────────────────────────────────────────────

interface ApprovalRequest {
    id: string;
    workflow_code: string;
    title: string;
    entity_type: string;
    status: string;
    current_step: number;
    total_steps: number;
    requested_by: string;
    requester_name?: string;
    created_at: string;
    updated_at: string;
}

interface PendingResponse {
    role: string;
    requests: ApprovalRequest[];
    total: number;
}

interface MyRequestsResponse {
    user_id: string;
    requests: ApprovalRequest[];
    total: number;
}

// ── Metadata ─────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Chờ duyệt', color: 'var(--vct-warning)', icon: <VCT_Icons.Clock size={14} /> },
    approved: { label: 'Đã duyệt', color: 'var(--vct-success)', icon: <VCT_Icons.CheckCircle size={14} /> },
    rejected: { label: 'Từ chối', color: 'var(--vct-danger)', icon: <VCT_Icons.X size={14} /> },
    returned: { label: 'Trả lại', color: 'var(--vct-info)', icon: <VCT_Icons.ArrowRight size={14} /> },
    cancelled: { label: 'Đã hủy', color: 'var(--vct-text-tertiary)', icon: <VCT_Icons.X size={14} /> },
};

const WORKFLOW_LABELS: Record<string, string> = {
    club_registration: 'Đăng ký CLB',
    member_registration: 'Đăng ký hội viên',
    referee_card: 'Thẻ Trọng tài',
    tournament_hosting: 'Tổ chức Giải đấu',
    team_registration: 'Đăng ký Đoàn',
    athlete_registration: 'Đăng ký VĐV',
    result_approval: 'Kết quả Thi đấu',
    expense_small: 'Chi tiêu nhỏ',
    expense_medium: 'Chi tiêu vừa',
    expense_large: 'Chi tiêu lớn',
    fee_confirmation: 'Xác nhận Lệ phí',
    belt_promotion: 'Thi Thăng Đai',
    training_class: 'Lớp Đào tạo',
    news_publish: 'Tin tức',
    complaint: 'Khiếu nại',
};

// ── Component ────────────────────────────────────────────────

type TabView = 'pending' | 'my-requests';

export function Page_pending_approvals() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabView>('pending');
    const [actionModal, setActionModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
    const [comment, setComment] = useState('');

    // Fetch pending for my role
    const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } =
        useApiQuery<PendingResponse>('/api/v1/approvals/my-pending');

    // Fetch my own submitted requests
    const { data: myData, isLoading: myLoading, refetch: refetchMy } =
        useApiQuery<MyRequestsResponse>('/api/v1/approvals/my-requests');

    // Action mutation
    const actionPath = actionModal ? `/api/v1/approvals/${actionModal.id}/${actionModal.action}` : '';
    const { mutate: performAction, isLoading: actionLoading } = useApiMutation<
        { comment?: string; reason?: string },
        { status: string }
    >('POST', actionPath);

    const pendingRequests = pendingData?.requests || [];
    const myRequests = myData?.requests || [];

    const handleAction = async () => {
        if (!actionModal) return;
        const body = actionModal.action === 'approve'
            ? { comment }
            : { reason: comment };
        try {
            await performAction(body);
            setActionModal(null);
            setComment('');
            refetchPending();
            refetchMy();
        } catch (e) {
            // Error will be shown by mutation state
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    // ── Render ───────────────────────────────────────────────

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero
                title="Phê duyệt"
                subtitle="Quản lý và xử lý các yêu cầu phê duyệt"
                icon={<VCT_Icons.CheckCircle size={24} />}
                badge={pendingRequests.length > 0 ? `${pendingRequests.length} chờ duyệt` : undefined}
                badgeType="warning"
                gradientFrom="rgba(245, 158, 11, 0.1)"
                gradientTo="rgba(16, 185, 129, 0.06)"
            />

            {/* Quick Action */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <a href="/appeals/gui-yeu-cau"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors">
                    <VCT_Icons.Plus size={16} />
                    Gửi yêu cầu mới
                </a>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 mb-6 bg-vct-elevated p-1 rounded-2xl border border-vct-border w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${activeTab === 'pending'
                            ? 'bg-amber-500/15 text-amber-500 shadow-sm'
                            : 'text-vct-text-muted hover:text-vct-text'
                        }`}
                >
                    <VCT_Icons.Clock size={14} className="inline mr-1.5" />
                    Chờ tôi duyệt ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('my-requests')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${activeTab === 'my-requests'
                            ? 'bg-blue-500/15 text-blue-500 shadow-sm'
                            : 'text-vct-text-muted hover:text-vct-text'
                        }`}
                >
                    <VCT_Icons.FileText size={14} className="inline mr-1.5" />
                    Yêu cầu của tôi ({myRequests.length})
                </button>
            </div>

            {/* ── Tab: Pending ── */}
            {activeTab === 'pending' && (
                <>
                    {pendingLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-28 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />
                            ))}
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <VCT_EmptyState
                            icon={<VCT_Icons.CheckCircle size={48} />}
                            title="Không có yêu cầu nào cần duyệt"
                            description="Tất cả các yêu cầu phê duyệt đã được xử lý. Tuyệt vời!"
                        />
                    ) : (
                        <div className="space-y-3">
                            {pendingRequests.map(req => (
                                <ApprovalCard
                                    key={req.id}
                                    request={req}
                                    showActions
                                    onApprove={() => { setActionModal({ id: req.id, action: 'approve' }); setComment(''); }}
                                    onReject={() => { setActionModal({ id: req.id, action: 'reject' }); setComment(''); }}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Tab: My Requests ── */}
            {activeTab === 'my-requests' && (
                <>
                    {myLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-28 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />
                            ))}
                        </div>
                    ) : myRequests.length === 0 ? (
                        <VCT_EmptyState
                            icon={<VCT_Icons.FileText size={48} />}
                            title="Bạn chưa có yêu cầu nào"
                            description="Các yêu cầu phê duyệt bạn đã gửi sẽ hiển thị tại đây."
                        />
                    ) : (
                        <div className="space-y-3">
                            {myRequests.map(req => (
                                <ApprovalCard key={req.id} request={req} formatDate={formatDate} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Action Modal ── */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setActionModal(null)}
                >
                    <div className="w-full max-w-md mx-4 bg-vct-elevated border border-vct-border rounded-2xl shadow-2xl p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-vct-text mb-1">
                            {actionModal.action === 'approve' ? '✅ Xác nhận Phê duyệt' : '❌ Xác nhận Từ chối'}
                        </h3>
                        <p className="text-sm text-vct-text-muted mb-4">
                            {actionModal.action === 'approve'
                                ? 'Bạn có chắc chắn muốn phê duyệt yêu cầu này?'
                                : 'Vui lòng nhập lý do từ chối.'
                            }
                        </p>

                        <textarea
                            className="w-full px-4 py-3 rounded-xl bg-vct-bg border border-vct-border text-vct-text text-sm resize-none focus:outline-none focus:border-vct-accent/50"
                            rows={3}
                            placeholder={actionModal.action === 'approve' ? 'Nhận xét (không bắt buộc)...' : 'Lý do từ chối (bắt buộc)...'}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setActionModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-vct-bg border border-vct-border text-vct-text-muted text-sm font-bold hover:bg-vct-elevated transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionLoading || (actionModal.action === 'reject' && !comment.trim())}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50
                                    ${actionModal.action === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                        : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {actionLoading ? 'Đang xử lý...' : actionModal.action === 'approve' ? 'Phê duyệt' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    );
}

// ── ApprovalCard Sub-Component ───────────────────────────────

interface ApprovalCardProps {
    request: ApprovalRequest;
    showActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    formatDate: (d: string) => string;
}

function ApprovalCard({ request, showActions, onApprove, onReject, formatDate }: ApprovalCardProps) {
    const fallback = { label: 'Chờ duyệt', color: 'var(--vct-warning)', icon: <VCT_Icons.Clock size={14} /> };
    const st = STATUS_META[request.status] || fallback;

    return (
        <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden hover:border-vct-border-hover transition-colors group">
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <a href={`/appeals/phe-duyet?detail=${request.id}`} className="text-sm font-bold text-vct-text group-hover:text-vct-accent transition-colors no-underline cursor-pointer">
                            {request.title || request.workflow_code}
                        </a>
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{ background: `${st.color}15`, color: st.color, borderColor: `${st.color}30` }}
                        >
                            {st.icon} {st.label}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-vct-text-muted">
                        <span className="inline-flex items-center gap-1">
                            <VCT_Icons.FileText size={12} />
                            {WORKFLOW_LABELS[request.workflow_code] || request.workflow_code}
                        </span>
                        {request.requester_name && (
                            <span className="inline-flex items-center gap-1">
                                <VCT_Icons.User size={12} />
                                {request.requester_name}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <VCT_Icons.Calendar size={12} />
                            {formatDate(request.created_at)}
                        </span>
                        {request.total_steps > 0 && (
                            <span className="inline-flex items-center gap-1">
                                Bước {request.current_step}/{request.total_steps}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                {showActions && request.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onApprove}
                            className="px-4 py-2 rounded-xl bg-emerald-600/15 text-emerald-500 border border-emerald-500/25 text-xs font-bold hover:bg-emerald-600/25 transition-colors"
                        >
                            <VCT_Icons.CheckCircle size={14} className="inline mr-1" />
                            Duyệt
                        </button>
                        <button
                            onClick={onReject}
                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors"
                        >
                            <VCT_Icons.X size={14} className="inline mr-1" />
                            Từ chối
                        </button>
                    </div>
                )}
            </div>

            {/* Step Progress Bar */}
            {request.total_steps > 1 && (
                <div className="px-5 pb-3">
                    <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-vct-bg">
                        {Array.from({ length: request.total_steps }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-full transition-all"
                                style={{
                                    background: i < request.current_step
                                        ? (request.status === 'rejected' ? 'var(--vct-danger)' : 'var(--vct-success)')
                                        : i === request.current_step - 1
                                            ? 'var(--vct-warning)'
                                            : 'transparent',
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Page_pending_approvals;
