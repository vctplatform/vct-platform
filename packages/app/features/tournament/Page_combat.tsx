'use client';
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_Modal, VCT_StatusPipeline, VCT_EmptyState, VCT_SegmentedControl, VCT_Card
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import type { TranDauDK, TrangThaiTranDau, VongDau } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

const ST_MAP: Record<TrangThaiTranDau, { label: string; color: string; type: string }> = {
    dang_dau: { label: '🔴 LIVE', color: '#ef4444', type: 'warning' },
    chua_dau: { label: 'Chờ thi đấu', color: '#f59e0b', type: 'info' },
    ket_thuc: { label: 'Kết thúc', color: '#10b981', type: 'success' },
};
const VONG_MAP: Record<VongDau, string> = { vong_loai: 'Vòng loại', tu_ket: 'Tứ kết', ban_ket: 'Bán kết', chung_ket: 'Chung kết' };

// ════════════════════════════════════════
// EVENT LOG
// ════════════════════════════════════════
interface MatchEvent {
    hiep: number;
    time: string;
    side: 'do' | 'xanh';
    action: string;
    points: number;
    color: string;
}

// ════════════════════════════════════════
// TIMER HOOK
// ════════════════════════════════════════
function useTimer(running: boolean, initialSec: number = 120) {
    const [seconds, setSeconds] = useState(initialSec);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (running && seconds > 0) {
            intervalRef.current = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, seconds]);
    const reset = (s: number) => setSeconds(s);
    const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    return { seconds, formatted, reset };
}

// ════════════════════════════════════════
// SCORE ACTIONS
// ════════════════════════════════════════
const ROUNDS = [1, 2, 3];

const PENALTY_ACTIONS = [
    { label: 'Cảnh cáo (Gamjeom)', points: -1, icon: '🟡' },
    { label: 'Hạ đo ván', points: 0, icon: '💥', special: 'knockout' },
];

export const Page_combat = () => {
    const { items: matches, setItems: setMatchesState, uiState } = useEntityCollection(repositories.combatMatches.mock);
    const [filter, setFilter] = useState('all');
    const [vongFilter, setVongFilter] = useState('all');
    const { toast, showToast, hideToast } = useToast();

    // Scoring state
    const [activeMatch, setActiveMatch] = useState<string | null>(null);
    const [eventLogs, setEventLogs] = useState<Record<string, MatchEvent[]>>({});
    const [warnings, setWarnings] = useState<Record<string, { do: number; xanh: number }>>({});

    // Timer
    const activeMatchData = matches.find(m => m.id === activeMatch);
    const isTimerRunning = !!activeMatchData && activeMatchData.trang_thai === 'dang_dau';
    const timer = useTimer(isTimerRunning);

    const setMatches = useCallback((updater: React.SetStateAction<TranDauDK[]>) => {
        setMatchesState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: TranDauDK[]) => TranDauDK[])(prev)
                : updater;
            void repositories.combatMatches.mock.replaceAll(next);
            return next;
        });
    }, [setMatchesState]);

    const filtered = useMemo(() => {
        let d = matches;
        if (filter !== 'all') d = d.filter(m => m.trang_thai === filter);
        if (vongFilter !== 'all') d = d.filter(m => m.vong === vongFilter);
        return d;
    }, [matches, filter, vongFilter]);

    const pStages = useMemo(() => [
        { key: 'dang_dau', label: '🔴 LIVE', color: '#ef4444', count: matches.filter(m => m.trang_thai === 'dang_dau').length },
        { key: 'chua_dau', label: 'Chờ', color: '#f59e0b', count: matches.filter(m => m.trang_thai === 'chua_dau').length },
        { key: 'ket_thuc', label: 'Xong', color: '#10b981', count: matches.filter(m => m.trang_thai === 'ket_thuc').length },
    ], [matches]);

    // ── SCORING ──
    const updateRoundScore = useCallback((matchId: string, side: 'do' | 'xanh', round: number, score: number) => {
        setMatches(p => p.map(m => {
            if (m.id !== matchId) return m;
            const roundIdx = round - 1;
            const currentScores = (side === 'do' ? m.diem_hiep_do : m.diem_hiep_xanh) || [0, 0, 0];
            const newRoundScores = [...currentScores];
            newRoundScores[roundIdx] = score;

            const total = newRoundScores.reduce((a, b) => a + b, 0);

            return {
                ...m,
                [side === 'do' ? 'diem_hiep_do' : 'diem_hiep_xanh']: newRoundScores,
                [side === 'do' ? 'diem_do' : 'diem_xanh']: total
            };
        }));
    }, [setMatches]);

    const addWarning = useCallback((matchId: string, side: 'do' | 'xanh') => {
        const match = matches.find(m => m.id === matchId);
        if (!match || match.trang_thai !== 'dang_dau') return;

        const curr = warnings[matchId] || { do: 0, xanh: 0 };
        const newW = { ...curr, [side]: curr[side] + 1 };
        setWarnings(p => ({ ...p, [matchId]: newW }));

        // Each gamjeom = +1 point for opponent
        const oppSide = side === 'do' ? 'xanh' : 'do';
        setMatches(p => p.map(m => m.id === matchId ? {
            ...m,
            [`diem_${oppSide}`]: (oppSide === 'do' ? m.diem_do : m.diem_xanh) + 1,
        } : m));

        const event: MatchEvent = {
            hiep: match.hiep || 1, time: timer.formatted, side,
            action: `Cảnh cáo (${newW[side]})`, points: -1, color: '#f59e0b',
        };
        setEventLogs(p => ({ ...p, [matchId]: [...(p[matchId] || []), event] }));
        showToast(`🟡 Cảnh cáo ${side === 'do' ? 'Đỏ' : 'Xanh'} (${newW[side]})`, 'warning');
    }, [matches, warnings, setMatches, timer.formatted, showToast]);

    const startMatch = useCallback((matchId: string) => {
        setMatches(p => p.map(m => m.id === matchId ? { ...m, trang_thai: 'dang_dau' as TrangThaiTranDau, hiep: 1, thoi_gian: '2:00' } : m));
        setActiveMatch(matchId);
        timer.reset(120);
        showToast('▶ Trận đấu bắt đầu!');
    }, [setMatches, showToast, timer]);

    const nextHiep = useCallback((matchId: string) => {
        setMatches(p => p.map(m => m.id === matchId ? { ...m, hiep: (m.hiep || 1) + 1 } : m));
        timer.reset(120);
        showToast('⏭ Bắt đầu hiệp mới!');
    }, [setMatches, showToast, timer]);

    const endMatch = useCallback((matchId: string, reason?: string) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        const winner = match.diem_do > match.diem_xanh ? 'Đỏ' : match.diem_xanh > match.diem_do ? 'Xanh' : 'Hòa';
        const ketQua = reason || `Thắng điểm ${winner}`;
        setMatches(p => p.map(m => m.id === matchId ? { ...m, trang_thai: 'ket_thuc' as TrangThaiTranDau, ket_qua: ketQua } : m));
        if (activeMatch === matchId) setActiveMatch(null);
        showToast(`🏁 ${ketQua}!`);
    }, [matches, activeMatch, setMatches, showToast]);

    const knockout = useCallback((matchId: string, side: 'do' | 'xanh') => {
        endMatch(matchId, `Hạ đo ván — ${side === 'do' ? '🔴 Đỏ' : '🔵 Xanh'} thắng`);
    }, [endMatch]);

    // ── Render Match Card ──
    const renderMatchCard = (m: TranDauDK, isSidePanel: boolean = false) => {
        const st = ST_MAP[m.trang_thai];
        const isLive = m.trang_thai === 'dang_dau';
        const isActive = activeMatch === m.id;
        const logs = eventLogs[m.id] || [];
        const w = warnings[m.id] || { do: 0, xanh: 0 };

        return (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <VCT_Card>
                    {/* Header */}
                    <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                        <VCT_Stack direction="row" gap={10} align="center">
                            <VCT_Text variant="mono" style={{ fontSize: 11, opacity: 0.4 }}>{m.id}</VCT_Text>
                            <VCT_Badge text={m.hang_can} type="info" />
                            <VCT_Badge text={VONG_MAP[m.vong]} type="info" />
                            <VCT_Badge text={st.label} type={st.type} pulse={isLive} />
                        </VCT_Stack>
                        {isLive && isActive && (
                            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}
                                style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: timer.seconds <= 10 ? '#ef4444' : '#1e40af', background: timer.seconds <= 10 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.08)', padding: '4px 16px', borderRadius: 12 }}
                            >
                                ⏱ {timer.formatted}
                            </motion.div>
                        )}
                        {isLive && !isActive && <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>Hiệp {m.hiep}</span>}
                    </VCT_Stack>

                    {/* Scoreboard */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-(--vct-bg-elevated) border-2 border-(--vct-border-subtle) bg-white/5 backdrop-blur-md shadow-inner flex items-center justify-center gap-8">
                        {isLive && <motion.div animate={{ opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10" />}
                        {/* Blue */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 8px', boxShadow: isLive ? '0 0 16px rgba(59,130,246,0.6)' : 'none' }} />
                            <VCT_Text style={{ fontWeight: 900, fontSize: 16 }}>{m.vdv_xanh.ten}</VCT_Text>
                            <VCT_Text variant="small" style={{ opacity: 0.5 }}>{m.vdv_xanh.doan}</VCT_Text>
                            {w.xanh > 0 && <div style={{ marginTop: 4 }}>{Array.from({ length: w.xanh }).map((_, i) => <span key={i} style={{ fontSize: 14 }}>🟡</span>)}</div>}
                        </div>
                        {/* Score */}
                        <div style={{ textAlign: 'center', minWidth: 140 }}>
                            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '0.05em', fontFamily: 'monospace', lineHeight: 1 }}>
                                <span style={{ color: '#3b82f6' }}>{m.diem_xanh}</span>
                                <span style={{ opacity: 0.15, margin: '0 6px' }}>:</span>
                                <span style={{ color: '#ef4444' }}>{m.diem_do}</span>
                            </div>
                            {isLive && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, opacity: 0.4 }}>Hiệp {m.hiep || 1}</div>}
                            {m.ket_qua && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#10b981' }}>{m.ket_qua}</div>}
                        </div>
                        {/* Red */}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ef4444', margin: '0 auto 8px', boxShadow: isLive ? '0 0 16px rgba(239,68,68,0.6)' : 'none' }} />
                            <VCT_Text style={{ fontWeight: 900, fontSize: 16 }}>{m.vdv_do.ten}</VCT_Text>
                            <VCT_Text variant="small" style={{ opacity: 0.5 }}>{m.vdv_do.doan}</VCT_Text>
                            {w.do > 0 && <div style={{ marginTop: 4 }}>{Array.from({ length: w.do }).map((_, i) => <span key={i} style={{ fontSize: 14 }}>🟡</span>)}</div>}
                        </div>
                    </div>

                    {/* Quick Score Panel — visible when LIVE, but ONLY in Side Panel if active */}
                    {isLive && isActive && !isSidePanel ? (
                        <div className="mt-4 text-center p-4 bg-blue-500/10 rounded-xl text-blue-600 font-bold border border-blue-500/20">
                            👉 Đang điều khiển ở bảng bên phải
                        </div>
                    ) : isLive && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: 16, borderRadius: 14, background: 'rgba(59,130,246,0.03)', border: '1px solid var(--vct-border-subtle)' }}>
                                {/* Xanh round scores */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>🔵 {m.vdv_xanh.ten}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {ROUNDS.map(r => (
                                            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, width: 40, opacity: 0.6 }}>Hiệp {r}</span>
                                                <input
                                                    type="number"
                                                    value={m.diem_hiep_xanh?.[r - 1] || 0}
                                                    onChange={(e) => updateRoundScore(m.id, 'xanh', r, parseInt(e.target.value) || 0)}
                                                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', background: 'white', fontSize: 13, fontWeight: 700, color: '#3b82f6' }}
                                                />
                                            </div>
                                        ))}
                                        <button onClick={() => addWarning(m.id, 'xanh')}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#f59e0b', marginTop: 4 }}
                                        >🟡 Cảnh cáo</button>
                                    </div>
                                </div>

                                {/* Center controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', minWidth: 100 }}>
                                    <VCT_Button variant="secondary" onClick={() => nextHiep(m.id)} style={{ fontSize: 11, width: '100%' }}>⏭ Hiệp tiếp</VCT_Button>
                                    <div style={{ borderTop: '1px solid var(--vct-border-subtle)', width: '100%', margin: '4px 0' }} />
                                    <VCT_Button variant="secondary" onClick={() => knockout(m.id, 'xanh')} style={{ fontSize: 11, color: '#3b82f6', width: '100%' }}>💥 KO Xanh</VCT_Button>
                                    <VCT_Button variant="secondary" onClick={() => knockout(m.id, 'do')} style={{ fontSize: 11, color: '#ef4444', width: '100%' }}>💥 KO Đỏ</VCT_Button>
                                    <div style={{ borderTop: '1px solid var(--vct-border-subtle)', width: '100%', margin: '4px 0' }} />
                                    <VCT_Button variant="danger" onClick={() => endMatch(m.id)} style={{ fontSize: 11, width: '100%' }}>🏁 Kết thúc</VCT_Button>
                                </div>

                                {/* Do round scores */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>🔴 {m.vdv_do.ten}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {ROUNDS.map(r => (
                                            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, width: 40, opacity: 0.6 }}>Hiệp {r}</span>
                                                <input
                                                    type="number"
                                                    value={m.diem_hiep_do?.[r - 1] || 0}
                                                    onChange={(e) => updateRoundScore(m.id, 'do', r, parseInt(e.target.value) || 0)}
                                                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', background: 'white', fontSize: 13, fontWeight: 700, color: '#ef4444' }}
                                                />
                                            </div>
                                        ))}
                                        <button onClick={() => addWarning(m.id, 'do')}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#f59e0b', marginTop: 4 }}
                                        >🟡 Cảnh cáo</button>
                                    </div>
                                </div>
                            </div>

                            {/* Event Log */}
                            {logs.length > 0 && (
                                <div style={{ marginTop: 12, maxHeight: 160, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--vct-border-subtle)', padding: '8px 12px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.4, marginBottom: 4 }}>Diễn biến ({logs.length})</div>
                                    {[...logs].reverse().map((e, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--vct-border-subtle)' : 'none', fontSize: 12 }}>
                                            <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.4, minWidth: 50 }}>H{e.hiep} {e.time}</span>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                                            <span style={{ fontWeight: 600 }}>{e.action}</span>
                                            <span style={{ marginLeft: 'auto', fontWeight: 900, color: e.points > 0 ? e.color : '#f59e0b', fontFamily: 'monospace' }}>{e.points > 0 ? `+${e.points}` : e.points}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Actions for non-live */}
                    {!isLive && m.trang_thai === 'chua_dau' && (
                        <VCT_Stack direction="row" gap={8} justify="flex-end" className="mt-4">
                            <VCT_Button onClick={() => startMatch(m.id)}>▶ Bắt đầu trận</VCT_Button>
                        </VCT_Stack>
                    )}
                    {!isLive && m.trang_thai === 'ket_thuc' && logs.length > 0 && (
                        <details style={{ marginTop: 12 }}>
                            <summary style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--vct-text-tertiary)' }}>📋 Xem diễn biến ({logs.length} sự kiện)</summary>
                            <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto', fontSize: 11, padding: 8, borderRadius: 8, background: 'var(--vct-bg-elevated)' }}>
                                {logs.map((e, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0' }}>
                                        <span style={{ fontFamily: 'monospace', opacity: 0.4 }}>H{e.hiep} {e.time}</span>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, marginTop: 4 }} />
                                        <span>{e.action} {e.points > 0 ? `+${e.points}` : e.points}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </VCT_Card>
            </motion.div>
        );
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />

            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải dữ liệu đối kháng: {uiState.error}
                </div>
            )}

            <VCT_StatRow items={[
                { label: 'Tổng trận', value: matches.length, icon: <VCT_Icons.Swords size={18} />, color: '#0ea5e9' },
                { label: 'LIVE', value: matches.filter(m => m.trang_thai === 'dang_dau').length, icon: <VCT_Icons.Play size={18} />, color: '#ef4444', sub: '🔴 LIVE' },
                { label: 'Kết thúc', value: matches.filter(m => m.trang_thai === 'ket_thuc').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Chờ', value: matches.filter(m => m.trang_thai === 'chua_dau').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            <VCT_StatusPipeline stages={pStages} activeStage={filter === 'all' ? null : filter} onStageClick={(k) => setFilter(k || 'all')} />

            <VCT_Stack direction="row" gap={16} align="center" className="mb-6 flex-wrap">
                <VCT_SegmentedControl options={[{ value: 'all', label: 'Tất cả vòng' }, { value: 'vong_loai', label: 'Vòng loại' }, { value: 'tu_ket', label: 'Tứ kết' }, { value: 'ban_ket', label: 'Bán kết' }, { value: 'chung_ket', label: 'CK 🏆' }]} value={vongFilter} onChange={setVongFilter} />
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có trận đấu" description="Thử thay đổi bộ lọc." icon="🥊" />
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Danh sách trận đấu (Left side) */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase text-(--vct-text-tertiary) tracking-wider">Danh sách trận đấu ({filtered.length})</h2>
                        </div>
                        <VCT_Stack gap={16}>
                            {filtered.map(m => (
                                <div key={m.id} onClick={() => m.trang_thai === 'dang_dau' ? setActiveMatch(m.id) : null} className={`cursor-pointer transition-transform hover:-translate-y-1 ${activeMatch === m.id ? 'ring-2 ring-blue-500 rounded-2xl' : ''}`}>
                                    {renderMatchCard(m, false)}
                                </div>
                            ))}
                        </VCT_Stack>
                    </div>

                    {/* Live Control Panel (Right side - Sticky) */}
                    {activeMatchData && activeMatchData.trang_thai === 'dang_dau' && (
                        <div className="w-full lg:w-[480px] xl:w-[560px] flex-shrink-0">
                            <div className="sticky top-24">
                                <div className="flex items-center justify-between mb-4 mt-8 lg:mt-0">
                                    <h2 className="text-sm font-bold uppercase text-red-500 tracking-wider flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        Live Control Panel
                                    </h2>
                                    <VCT_Button variant="secondary" onClick={() => setActiveMatch(null)} style={{ padding: '4px 12px', fontSize: 11 }}>Đóng</VCT_Button>
                                </div>
                                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) shadow-xl overflow-hidden backdrop-blur-xl">
                                    {renderMatchCard(activeMatchData, true)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </VCT_PageContainer>
    );
};
