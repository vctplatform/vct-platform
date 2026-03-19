'use client'

import * as React from 'react'
import { useState } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_EmptyState,
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'


// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface LiveMatch {
    id: string; event_name: string; category: 'doi_khang' | 'quyen' | 'bieu_dien'
    athlete_red: string; athlete_blue: string
    score_red: number; score_blue: number
    round: number; max_rounds: number
    status: 'live' | 'paused' | 'finished' | 'upcoming'
    arena: string; start_time: string
    referee: string
    penalties_red: number; penalties_blue: number
}

interface JudgeScore {
    judge: string; score_red: number; score_blue: number; submitted: boolean
}

const STATUS_BADGE: Record<string, { label: string; type: string }> = {
    live: { label: '🔴 TRỰC TIẾP', type: 'danger' },
    paused: { label: '⏸ Tạm dừng', type: 'warning' },
    finished: { label: '✅ Kết thúc', type: 'success' },
    upcoming: { label: '🕐 Sắp tới', type: 'neutral' },
}

const CAT_BADGE: Record<string, { label: string; type: string }> = {
    doi_khang: { label: 'Đối kháng', type: 'danger' },
    quyen: { label: 'Quyền thuật', type: 'info' },
    bieu_dien: { label: 'Biểu diễn', type: 'success' },
}

const MOCK_MATCHES: LiveMatch[] = [
    { id: 'M-001', event_name: 'Đối kháng Nam 60kg - Vòng Bán kết', category: 'doi_khang', athlete_red: 'Nguyễn Văn An', athlete_blue: 'Trần Minh Tuấn', score_red: 7, score_blue: 5, round: 2, max_rounds: 3, status: 'live', arena: 'Sàn A1', start_time: '10:30', referee: 'Trần Văn Minh', penalties_red: 1, penalties_blue: 0 },
    { id: 'M-002', event_name: 'Đối kháng Nữ 48kg - Tứ kết', category: 'doi_khang', athlete_red: 'Trần Thị Bình', athlete_blue: 'Lê Thị Hoa', score_red: 3, score_blue: 4, round: 1, max_rounds: 3, status: 'live', arena: 'Sàn A2', start_time: '10:45', referee: 'Lê Thị Ngọc', penalties_red: 0, penalties_blue: 1 },
    { id: 'M-003', event_name: 'Quyền thuật Nam - Ngũ Hình Quyền', category: 'quyen', athlete_red: 'Hoàng Văn Phong', athlete_blue: '-', score_red: 8.75, score_blue: 0, round: 1, max_rounds: 1, status: 'live', arena: 'Sàn B1', start_time: '11:00', referee: 'Võ Minh Đức', penalties_red: 0, penalties_blue: 0 },
    { id: 'M-004', event_name: 'Đối kháng Nam 68kg - Vòng 1', category: 'doi_khang', athlete_red: 'Lê Minh Cường', athlete_blue: 'Phạm Đức Huy', score_red: 10, score_blue: 8, round: 3, max_rounds: 3, status: 'finished', arena: 'Sàn A1', start_time: '09:30', referee: 'Trần Văn Minh', penalties_red: 2, penalties_blue: 1 },
    { id: 'M-005', event_name: 'Biểu diễn Đồng đội - Quyền', category: 'bieu_dien', athlete_red: 'Đội Bình Định', athlete_blue: 'Đội TP.HCM', score_red: 0, score_blue: 0, round: 0, max_rounds: 1, status: 'upcoming', arena: 'Sàn B1', start_time: '14:00', referee: 'TBD', penalties_red: 0, penalties_blue: 0 },
]

const MOCK_JUDGES: JudgeScore[] = [
    { judge: 'GK 1 - Nguyễn Văn Hải', score_red: 7.5, score_blue: 5.0, submitted: true },
    { judge: 'GK 2 - Trần Thị Mai', score_red: 7.0, score_blue: 5.5, submitted: true },
    { judge: 'GK 3 - Lê Đức Phong', score_red: 7.0, score_blue: 4.5, submitted: true },
    { judge: 'GK 4 - Phạm Minh Hà', score_red: 0, score_blue: 0, submitted: false },
    { judge: 'GK 5 - Võ Thanh Sơn', score_red: 0, score_blue: 0, submitted: false },
]

// ════════════════════════════════════════
// LIVE MATCH CARD
// ════════════════════════════════════════
const LiveMatchCard = ({ match, onClick }: { match: LiveMatch; onClick: () => void }) => {
    const isDoiKhang = match.category === 'doi_khang'
    const isLive = match.status === 'live'

    return (
        <div
            onClick={onClick}
            className={`bg-(--vct-bg-elevated) border rounded-2xl p-5 cursor-pointer hover:-() transition-all ${isLive ? 'border-[#ef444440]' : 'border-(--vct-border-strong)'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <VCT_Badge type={CAT_BADGE[match.category]?.type ?? 'neutral'} text={CAT_BADGE[match.category]?.label ?? match.category} />
                    <VCT_Badge type={STATUS_BADGE[match.status]?.type ?? 'neutral'} text={STATUS_BADGE[match.status]?.label ?? match.status} />
                </div>
                <span className="text-xs text-(--vct-text-tertiary)">{match.arena} · {match.start_time}</span>
            </div>

            {/* Event name */}
            <div className="font-bold text-(--vct-text-primary) text-sm mb-4">{match.event_name}</div>

            {/* Scoreboard */}
            {isDoiKhang ? (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-center">
                        <div className="text-xs text-[#ef4444] uppercase font-bold mb-1">🔴 Đỏ</div>
                        <div className="font-bold text-(--vct-text-primary)">{match.athlete_red}</div>
                        <div className="text-3xl font-black mt-2 text-[#ef4444]">{match.score_red}</div>
                        {match.penalties_red > 0 && <div className="text-xs text-(--vct-text-tertiary) mt-1">⚠ {match.penalties_red} lỗi</div>}
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-black text-(--vct-text-tertiary)">VS</div>
                        <div className="text-xs text-(--vct-text-tertiary) mt-1">Hiệp {match.round}/{match.max_rounds}</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-xs text-[#0ea5e9] uppercase font-bold mb-1">🔵 Xanh</div>
                        <div className="font-bold text-(--vct-text-primary)">{match.athlete_blue}</div>
                        <div className="text-3xl font-black mt-2 text-[#0ea5e9]">{match.score_blue}</div>
                        {match.penalties_blue > 0 && <div className="text-xs text-(--vct-text-tertiary) mt-1">⚠ {match.penalties_blue} lỗi</div>}
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <div className="font-bold text-(--vct-text-primary)">{match.athlete_red}</div>
                    {match.score_red > 0 && <div className="text-3xl font-black mt-2 text-[#f59e0b]">{match.score_red.toFixed(2)}</div>}
                </div>
            )}

            {/* Referee */}
            <div className="mt-4 pt-3 border-t border-(--vct-border-subtle) flex items-center justify-between">
                <span className="text-xs text-(--vct-text-tertiary)">Trọng tài: {match.referee}</span>
                {isLive && <span className="text-xs text-[#ef4444] animate-pulse">● Live</span>}
            </div>
        </div>
    )
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_scoring = () => (
    <AdminGuard>
        <Page_admin_scoring_Content />
    </AdminGuard>
)

const Page_admin_scoring_Content = () => {
    const { t } = useI18n()
    const { data: fetchedMatches, isLoading } = useAdminFetch<LiveMatch[]>('/admin/scoring/matches', { mockData: MOCK_MATCHES })
    const [selected, setSelected] = useState<LiveMatch | null>(null)
    const { showToast } = useShellToast()

    const _matches = fetchedMatches ?? MOCK_MATCHES

    const liveCount = MOCK_MATCHES.filter(m => m.status === 'live').length
    const finishedCount = MOCK_MATCHES.filter(m => m.status === 'finished').length
    const arenas = Array.from(new Set(MOCK_MATCHES.map(m => m.arena))).length

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Activity size={20} />, label: 'Trận đang diễn ra', value: liveCount, color: '#ef4444' },
        { icon: <VCT_Icons.CheckCircle size={20} />, label: 'Đã kết thúc', value: finishedCount, color: '#10b981' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Sắp tới', value: MOCK_MATCHES.filter(m => m.status === 'upcoming').length, color: '#94a3b8' },
        { icon: <VCT_Icons.Layers size={20} />, label: 'Sàn đấu', value: arenas, color: '#0ea5e9' },
    ]

    return (
        <AdminPageShell
            title="Chấm điểm & Giám sát Live"
            subtitle="Theo dõi real-time các trận đấu đang diễn ra"
            icon={<VCT_Icons.Activity size={28} className="text-[#ef4444]" />}
            stats={stats}
        >

            {/* ── Live Matches Grid ── */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 animate-pulse">
                            <div className="h-4 w-32 bg-(--vct-bg-base) rounded mb-4" />
                            <div className="h-6 w-48 bg-(--vct-bg-base) rounded mb-4" />
                            <div className="flex justify-between">
                                <div className="h-12 w-20 bg-(--vct-bg-base) rounded" />
                                <div className="h-12 w-12 bg-(--vct-bg-base) rounded" />
                                <div className="h-12 w-20 bg-(--vct-bg-base) rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : MOCK_MATCHES.length === 0 ? (
                <VCT_EmptyState icon={<VCT_Icons.Activity size={40} />} title="Không có trận đấu" description="Chưa có trận đấu nào đang diễn ra" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_MATCHES.map(m => (
                        <LiveMatchCard key={m.id} match={m} onClick={() => setSelected(m)} />
                    ))}
                </div>
            )}

            {/* ── Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Trận ${selected?.id ?? ''}`} width={560}>
                {selected && (
                    <VCT_Stack gap={20}>
                        <div className="flex items-center gap-3">
                            <VCT_Badge type={CAT_BADGE[selected.category]?.type ?? 'neutral'} text={CAT_BADGE[selected.category]?.label ?? selected.category} />
                            <VCT_Badge type={STATUS_BADGE[selected.status]?.type ?? 'neutral'} text={STATUS_BADGE[selected.status]?.label ?? selected.status} />
                        </div>

                        <div className="font-bold text-lg text-(--vct-text-primary)">{selected.event_name}</div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Sàn đấu', value: selected.arena },
                                { label: 'Thời gian', value: selected.start_time },
                                { label: 'Trọng tài', value: selected.referee },
                                { label: 'Hiệp', value: `${selected.round}/${selected.max_rounds}` },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Judge Scores */}
                        <div>
                            <h4 className="font-bold text-(--vct-text-primary) mb-3 flex items-center gap-2">
                                <VCT_Icons.Shield size={16} className="text-[#8b5cf6]" /> Bảng điểm giám khảo
                            </h4>
                            <div className="space-y-2">
                                {MOCK_JUDGES.map(j => (
                                    <div key={j.judge} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${j.submitted ? 'bg-[#10b981]' : 'bg-[#94a3b8] animate-pulse'}`} />
                                            <span className="text-sm text-(--vct-text-secondary)">{j.judge}</span>
                                        </div>
                                        {j.submitted ? (
                                            <div className="flex gap-4">
                                                <span className="font-bold text-sm text-[#ef4444]">🔴 {j.score_red.toFixed(1)}</span>
                                                <span className="font-bold text-sm text-[#0ea5e9]">🔵 {j.score_blue.toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-(--vct-text-tertiary)">Chưa chấm</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Override actions */}
                        {selected.status === 'live' && (
                            <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle)">
                                <VCT_Button variant="ghost" onClick={() => { showToast('Đã tạm dừng trận đấu', 'info'); setSelected(null) }} icon={<VCT_Icons.Pause size={14} />}>Tạm dừng</VCT_Button>
                                <VCT_Button variant="ghost" onClick={() => showToast('Yêu cầu override đã gửi', 'info')} icon={<VCT_Icons.Edit size={14} />}>Override điểm</VCT_Button>
                            </VCT_Stack>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
