// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SUBMIT APPROVAL REQUEST PAGE
// Wizard form: select workflow → fill details → submit to API.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../hooks/useApiQuery';
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';

// ── Types ────────────────────────────────────────────────────

interface WorkflowDef {
    code: string;
    entity_type: string;
    display_name: string;
    steps: { step: number; name: string; role: string }[];
}

interface SubmitPayload {
    workflow_code: string;
    title: string;
    description: string;
    entity_type: string;
    entity_id: string;
}

// ── Group Metadata ───────────────────────────────────────────

const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
    administration: { label: 'Hành chính', icon: '🏛️', color: 'var(--vct-info)' },
    tournament: { label: 'Giải đấu', icon: '🏆', color: 'var(--vct-warning)' },
    finance: { label: 'Tài chính', icon: '💰', color: 'var(--vct-success)' },
    training: { label: 'Đào tạo', icon: '🥋', color: 'var(--vct-info)' },
    content: { label: 'Nội dung', icon: '📢', color: 'var(--vct-accent-pink)' },
};

function inferGroup(entityType: string): string {
    const map: Record<string, string> = {
        club: 'administration', member: 'administration', referee: 'administration',
        tournament: 'tournament', team: 'tournament', registration: 'tournament', match_result: 'tournament',
        transaction: 'finance', payment: 'finance',
        belt_exam: 'training', training_class: 'training',
        news: 'content', complaint: 'content',
    };
    return map[entityType] || 'administration';
}

// ── Component ────────────────────────────────────────────────

type Step = 'select' | 'details' | 'confirm' | 'done';

export function Page_submit_approval() {
    const { data: workflows, isLoading } = useApiQuery<WorkflowDef[]>('/api/v1/approvals/workflows');
    const { mutate: submit, isLoading: submitting, error: submitError } = useApiMutation<SubmitPayload, { id: string }>(
        'POST', '/api/v1/approvals/'
    );

    const [step, setStep] = useState<Step>('select');
    const [selectedCode, setSelectedCode] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [createdId, setCreatedId] = useState('');

    const selected = useMemo(() => workflows?.find(w => w.code === selectedCode), [workflows, selectedCode]);

    const grouped = useMemo(() => {
        if (!workflows) return {};
        const groups: Record<string, WorkflowDef[]> = {};
        for (const wf of workflows) {
            const g = inferGroup(wf.entity_type);
            if (!groups[g]) groups[g] = [];
            groups[g].push(wf);
        }
        return groups;
    }, [workflows]);

    const handleSubmit = async () => {
        if (!selected) return;
        try {
            const result = await submit({
                workflow_code: selected.code,
                title,
                description,
                entity_type: selected.entity_type,
                entity_id: '',
            });
            setCreatedId(result.id);
            setStep('done');
        } catch {
            // error is shown through submitError state
        }
    };

    const resetForm = () => {
        setStep('select');
        setSelectedCode('');
        setTitle('');
        setDescription('');
        setCreatedId('');
    };

    // ── Render ────────────────────────────────────────────────

    return (
        <VCT_PageContainer size="narrow">
            <VCT_PageHero
                title="Gửi yêu cầu Phê duyệt"
                subtitle="Chọn loại yêu cầu, điền thông tin và gửi để bắt đầu quy trình phê duyệt"
                icon={<VCT_Icons.FileText size={24} />}
                gradientFrom="rgba(59, 130, 246, 0.1)"
                gradientTo="rgba(139, 92, 246, 0.06)"
            />

            {/* Progress Stepper */}
            <div className="flex items-center gap-2 mb-8 px-4">
                {['select', 'details', 'confirm', 'done'].map((s, i) => {
                    const labels = ['Chọn loại', 'Thông tin', 'Xác nhận', 'Hoàn tất'];
                    const stepIndex = ['select', 'details', 'confirm', 'done'].indexOf(step);
                    const isActive = i === stepIndex;
                    const isDone = i < stepIndex;
                    return (
                        <React.Fragment key={s}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                    style={{
                                        background: isDone ? 'var(--vct-success)' : isActive ? 'var(--vct-info)' : 'rgba(148,163,184,0.1)',
                                        color: isDone || isActive ? '#fff' : 'var(--vct-text-tertiary)',
                                    }}
                                >
                                    {isDone ? '✓' : i + 1}
                                </div>
                                <span className={`text-xs font-semibold hidden sm:inline ${isActive ? 'text-vct-accent' : isDone ? 'text-emerald-500' : 'text-vct-text-muted'}`}>
                                    {labels[i]}
                                </span>
                            </div>
                            {i < 3 && <div className="flex-1 h-0.5 rounded" style={{ background: isDone ? 'var(--vct-success)' : 'rgba(148,163,184,0.1)' }} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step 1: Select Workflow */}
            {step === 'select' && (
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />)}
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, wfs]) => {
                            const defaultMeta = { label: 'Khác', icon: '📋', color: 'var(--vct-info)' };
                            const meta = GROUP_META[group] ?? defaultMeta;
                            return (
                                <div key={group}>
                                    <h3 className="text-sm font-bold mb-2 flex gap-2 items-center" style={{ color: meta.color }}>
                                        {meta.icon} {meta.label}
                                    </h3>
                                    <div className="space-y-2">
                                        {wfs.map(wf => (
                                            <button
                                                key={wf.code}
                                                onClick={() => { setSelectedCode(wf.code); setStep('details'); }}
                                                className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all hover:bg-vct-bg"
                                                style={{
                                                    background: 'var(--vct-elevated)',
                                                    borderColor: selectedCode === wf.code ? `${meta.color}50` : 'var(--vct-border)',
                                                }}
                                            >
                                                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                                    style={{ background: `${meta.color}15`, color: meta.color }}>
                                                    {wf.steps?.length || 0}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-vct-text">{wf.display_name}</div>
                                                    <div className="text-xs text-vct-text-muted mt-0.5">{wf.steps?.length || 0} bước duyệt</div>
                                                </div>
                                                <VCT_Icons.ChevronRight size={16} className="text-vct-text-muted" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Step 2: Details Form */}
            {step === 'details' && selected && (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-vct-accent/20 bg-vct-accent/5 p-4 flex items-center gap-3">
                        <VCT_Icons.FileText size={20} className="text-vct-accent shrink-0" />
                        <div>
                            <div className="text-sm font-bold text-vct-text">{selected.display_name}</div>
                            <div className="text-xs text-vct-text-muted">{selected.steps?.length || 0} bước duyệt • {selected.entity_type}</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-vct-text mb-2">Tiêu đề yêu cầu *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="VD: Đăng ký thành lập CLB XYZ..."
                            className="w-full px-4 py-3 rounded-xl bg-vct-bg border border-vct-border text-vct-text text-sm focus:outline-none focus:border-vct-accent/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-vct-text mb-2">Mô tả chi tiết</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Mô tả nội dung yêu cầu, lý do, tài liệu đính kèm..."
                            className="w-full px-4 py-3 rounded-xl bg-vct-bg border border-vct-border text-vct-text text-sm resize-none focus:outline-none focus:border-vct-accent/50"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep('select')}
                            className="px-5 py-2.5 rounded-xl bg-vct-elevated border border-vct-border text-vct-text-muted text-sm font-bold hover:bg-vct-bg transition-colors">
                            ← Quay lại
                        </button>
                        <button
                            onClick={() => setStep('confirm')}
                            disabled={!title.trim()}
                            className="flex-1 px-5 py-2.5 rounded-xl bg-vct-accent text-white text-sm font-bold hover:bg-vct-accent/90 transition-colors disabled:opacity-50"
                        >
                            Tiếp tục →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && selected && (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-vct-border bg-vct-elevated p-6">
                        <h3 className="text-base font-bold text-vct-text mb-4">Xác nhận gửi yêu cầu</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-vct-border/50">
                                <span className="text-vct-text-muted">Loại yêu cầu</span>
                                <span className="text-vct-text font-semibold">{selected.display_name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-vct-border/50">
                                <span className="text-vct-text-muted">Tiêu đề</span>
                                <span className="text-vct-text font-semibold">{title}</span>
                            </div>
                            {description && (
                                <div className="py-2 border-b border-vct-border/50">
                                    <span className="text-vct-text-muted block mb-1">Mô tả</span>
                                    <span className="text-vct-text text-xs">{description}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2">
                                <span className="text-vct-text-muted">Quy trình</span>
                                <span className="text-vct-text font-semibold">{selected.steps?.length || 0} bước phê duyệt</span>
                            </div>
                        </div>

                        {/* Show the approval chain */}
                        <div className="mt-4 flex items-center gap-1 overflow-x-auto py-2">
                            {selected.steps?.map((s, i) => (
                                <React.Fragment key={s.step}>
                                    <span className="px-3 py-1.5 rounded-lg bg-vct-bg text-[11px] font-semibold text-vct-text-muted whitespace-nowrap border border-vct-border/50">
                                        {s.name}
                                    </span>
                                    {i < (selected.steps?.length || 0) - 1 && <span className="text-vct-text-muted text-xs">→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {submitError && (
                        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
                            ❌ {submitError.message}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setStep('details')}
                            className="px-5 py-2.5 rounded-xl bg-vct-elevated border border-vct-border text-vct-text-muted text-sm font-bold hover:bg-vct-bg transition-colors">
                            ← Quay lại
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Đang gửi...' : '✅ Gửi yêu cầu phê duyệt'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                        <VCT_Icons.CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-vct-text mb-2">Gửi yêu cầu thành công!</h3>
                    <p className="text-sm text-vct-text-muted mb-6">
                        Yêu cầu #{createdId} đã được gửi và đang chờ xử lý.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <a href="/appeals/phe-duyet"
                            className="px-5 py-2.5 rounded-xl bg-vct-accent text-white text-sm font-bold hover:bg-vct-accent/90 transition-colors inline-block">
                            Xem trạng thái phê duyệt
                        </a>
                        <button onClick={resetForm}
                            className="px-5 py-2.5 rounded-xl bg-vct-elevated border border-vct-border text-vct-text-muted text-sm font-bold hover:bg-vct-bg transition-colors">
                            Gửi yêu cầu mới
                        </button>
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    );
}

export default Page_submit_approval;
