'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Tabs, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Protest {
    id: string
    match_id: string
    match_desc: string
    submitter: string
    team: string
    type: string
    reason: string
    status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'appealed'
    submitted_at: string
    decided_at: string
    decision_by: string
    has_video: boolean
}

const MOCK_PROTESTS: Protest[] = [
    { id: 'PR-001', match_id: 'M-089', match_desc: 'Đối kháng Nam 56kg - BK', submitter: 'HLV Nguyễn Văn An', team: 'CLB Sơn Long', type: 'Chấm điểm', reason: 'Giám khảo 3 không tính điểm đá vào mang tai, thiếu 2 điểm quyết định', status: 'pending', submitted_at: '17/04/2024 14:30', decided_at: '', decision_by: '', has_video: true },
    { id: 'PR-002', match_id: 'M-076', match_desc: 'Đối kháng Nữ 48kg - VL', submitter: 'HLV Trần Thị Mai', team: 'VĐ Thiên Long', type: 'Phạm luật', reason: 'VĐV đối phương tấn công sau tiếng còi dừng hiệp, không bị xử phạt', status: 'reviewing', submitted_at: '16/04/2024 10:15', decided_at: '', decision_by: '', has_video: true },
    { id: 'PR-003', match_id: 'Q-023', match_desc: 'Quyền thuật Nữ - Tuyển', submitter: 'HLV Lê Hoàng', team: 'CLB Long An', type: 'Chấm điểm', reason: 'Điểm trình diễn bị cho thấp bất thường so với tiêu chuẩn', status: 'accepted', submitted_at: '18/04/2024 09:00', decided_at: '18/04/2024 11:30', decision_by: 'GS Nguyễn Đức Hòa', has_video: false },
    { id: 'PR-004', match_id: 'M-045', match_desc: 'Đối kháng Nam 48kg - VL', submitter: 'HLV Phạm Minh', team: 'CLB Q.12', type: 'Cân lượng', reason: 'VĐV đối phương cân lại sau khi đã vượt hạng cân', status: 'rejected', submitted_at: '15/04/2024 16:45', decided_at: '15/04/2024 18:00', decision_by: 'Ban trọng tài', has_video: false },
    { id: 'PR-005', match_id: 'M-102', match_desc: 'Đối kháng Nam 60kg - TK', submitter: 'HLV Đặng Nhung', team: 'CLB Đà Nẵng', type: 'Chấm điểm', reason: 'Yêu cầu xem lại video, cho rằng điểm TKO không hợp lệ', status: 'appealed', submitted_at: '19/04/2024 13:20', decided_at: '19/04/2024 15:00', decision_by: 'Ban trọng tài', has_video: true },
]

const STATUS_MAP: Record<string, { label: string; type: 'warning' | 'info' | 'success' | 'error' | 'neutral'; step: number }> = {
    pending: { label: 'Chờ xử lý', type: 'warning', step: 1 },
    reviewing: { label: 'Đang xem xét', type: 'info', step: 2 },
    accepted: { label: 'Chấp nhận', type: 'success', step: 3 },
    rejected: { label: 'Từ chối', type: 'error', step: 3 },
    appealed: { label: 'Kháng nghị', type: 'neutral', step: 4 },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_tournament_protests = () => {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        let data = MOCK_PROTESTS
        if (statusFilter !== 'all') data = data.filter(p => p.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(p => p.submitter.toLowerCase().includes(q) || p.match_id.toLowerCase().includes(q) || p.reason.toLowerCase().includes(q))
        }
        return data
    }, [statusFilter, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_PageHero
                icon={<VCT_Icons.AlertCircle size={24} />}
                title="Khiếu Nại & Kháng Nghị"
                subtitle="Quản lý khiếu nại kết quả trận đấu, xem video review, ra quyết định."
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(239, 68, 68, 0.06)"
            />

            <VCT_StatRow items={[
                { label: 'Tổng khiếu nại', value: MOCK_PROTESTS.length, icon: <VCT_Icons.AlertCircle size={18} />, color: '#8b5cf6' },
                { label: 'Chờ xử lý', value: MOCK_PROTESTS.filter(p => p.status === 'pending').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Đang xem', value: MOCK_PROTESTS.filter(p => p.status === 'reviewing').length, icon: <VCT_Icons.Eye size={18} />, color: '#0ea5e9' },
                { label: 'Chấp nhận', value: MOCK_PROTESTS.filter(p => p.status === 'accepted').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Từ chối', value: MOCK_PROTESTS.filter(p => p.status === 'rejected').length, icon: <VCT_Icons.x size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-8" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--vct-border-subtle)] pb-4">
                <VCT_Tabs
                    tabs={[{ key: 'all', label: 'Tất cả' }, { key: 'pending', label: 'Chờ xử lý' }, { key: 'reviewing', label: 'Đang xem' }, { key: 'accepted', label: 'Chấp nhận' }, { key: 'rejected', label: 'Từ chối' }, { key: 'appealed', label: 'Kháng nghị' }]}
                    activeTab={statusFilter}
                    onChange={setStatusFilter}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm theo trận, người khiếu nại..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có khiếu nại" description="Chưa có khiếu nại nào phù hợp." icon="⚖️" />
            ) : (
                <div className="space-y-4">
                    {filtered.map(protest => {
                        const st = STATUS_MAP[protest.status] || STATUS_MAP.pending!
                        return (
                            <div key={protest.id} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6 hover:border-[var(--vct-accent-cyan)] transition-all">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--vct-accent-cyan)]/10 flex items-center justify-center text-sm font-bold text-[var(--vct-accent-cyan)]">{protest.id.replace('PR-', '#')}</div>
                                        <div>
                                            <div className="font-bold text-[var(--vct-text-primary)]">{protest.match_desc}</div>
                                            <div className="flex items-center gap-3 text-[11px] text-[var(--vct-text-tertiary)] mt-0.5">
                                                <span className="font-mono text-[var(--vct-accent-cyan)]">{protest.match_id}</span>
                                                <VCT_Badge text={protest.type} type="info" />
                                                {protest.has_video && <span className="flex items-center gap-0.5 text-[#f59e0b]"><VCT_Icons.Video size={10} /> VAR</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </div>

                                {/* Reason */}
                                <div className="bg-[var(--vct-bg-base)] rounded-xl p-4 mb-4 border border-[var(--vct-border-subtle)]">
                                    <div className="text-sm text-[var(--vct-text-secondary)] leading-relaxed">{protest.reason}</div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-4 text-[11px] text-[var(--vct-text-tertiary)]">
                                        <span className="flex items-center gap-1"><VCT_Icons.User size={10} /> {protest.submitter}</span>
                                        <span className="flex items-center gap-1"><VCT_Icons.Building2 size={10} /> {protest.team}</span>
                                        <span className="flex items-center gap-1"><VCT_Icons.Clock size={10} /> {protest.submitted_at}</span>
                                        {protest.decided_at && <span className="flex items-center gap-1"><VCT_Icons.Check size={10} /> Quyết định: {protest.decided_at}</span>}
                                    </div>

                                    {(protest.status === 'pending' || protest.status === 'reviewing') && (
                                        <VCT_Stack direction="row" gap={8}>
                                            {protest.has_video && <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Video size={14} />}>Xem Video</VCT_Button>}
                                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Check size={14} />}>Chấp nhận</VCT_Button>
                                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.x size={14} />}>Từ chối</VCT_Button>
                                        </VCT_Stack>
                                    )}
                                </div>

                                {/* Workflow Steps */}
                                <div className="mt-4 pt-4 border-t border-[var(--vct-border-subtle)]">
                                    <div className="flex items-center gap-2">
                                        {['Gửi', 'Xem xét', 'Quyết định', 'Kháng nghị'].map((step, i) => (
                                            <React.Fragment key={step}>
                                                <div className={`flex items-center gap-1 text-[10px] font-bold ${i < st.step ? 'text-[var(--vct-accent-cyan)]' : 'text-[var(--vct-text-tertiary)]'}`}>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${i < st.step
                                                        ? 'bg-[var(--vct-accent-cyan)] text-white'
                                                        : 'bg-[var(--vct-border-strong)] text-[var(--vct-text-tertiary)]'
                                                        }`}>{i + 1}</div>
                                                    {step}
                                                </div>
                                                {i < 3 && <div className={`flex-1 h-0.5 rounded ${i < st.step - 1 ? 'bg-[var(--vct-accent-cyan)]' : 'bg-[var(--vct-border-strong)]'}`}></div>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
