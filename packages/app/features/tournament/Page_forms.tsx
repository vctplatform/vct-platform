'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field,
    VCT_StatusPipeline, VCT_EmptyState, VCT_AvatarLetter, VCT_Card
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import type { LuotThiQuyen, TrangThaiQuyen } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

const ST_MAP: Record<TrangThaiQuyen, { label: string; color: string; type: string }> = {
    cho_thi: { label: 'Chờ thi', color: '#f59e0b', type: 'warning' },
    dang_thi: { label: '🔴 Đang thi', color: '#ef4444', type: 'warning' },
    da_cham: { label: '✓ Đã chấm', color: '#10b981', type: 'success' },
    hoan: { label: 'Hoãn', color: '#94a3b8', type: 'info' },
};

const calcQuyenScore = (diem: number[]) => {
    if (diem.length < 3) return { avg: 0, tie_breakers: { tb1: 0, tb2: 0, tb3: 0, tb4: 0 } };
    const sorted = [...diem].sort((a, b) => a - b);
    const middle = sorted.slice(1, -1); // Bỏ cao nhất + thấp nhất

    // Explicit array elements, defaulting to 0 to satisfy TypeScript
    const d1 = sorted[0];
    const d2 = sorted[sorted.length - 1];
    const drop1 = d1 !== undefined ? d1 : 0;
    const drop2 = d2 !== undefined ? d2 : 0;

    const total = middle.reduce((s, d) => s + d, 0);

    return {
        avg: Math.round(total * 100) / 100, // Still named 'avg' for data model compatibility but stores total sum
        tie_breakers: {
            tb1: Math.max(...middle),
            tb2: Math.min(...middle),
            tb3: Math.max(drop1, drop2),
            tb4: Math.min(drop1, drop2)
        }
    };
};

export const Page_forms = () => {
    const { items: entries, setItems: setEntriesState, uiState } = useEntityCollection(repositories.formPerformances.mock);
    const [filter, setFilter] = useState<string | null>(null);
    const [noiDungFilter, setNoiDungFilter] = useState<string>('all');
    const [gioiTinhFilter, setGioiTinhFilter] = useState<string>('all');
    const [luaTuoiFilter, setLuaTuoiFilter] = useState<string>('all');
    const { toast, showToast, hideToast } = useToast();
    const [scoreModal, setScoreModal] = useState<LuotThiQuyen | null>(null);
    const [judgeCount, setJudgeCount] = useState<5 | 7>(5);
    const [scores, setScores] = useState<string[]>(['', '', '', '', '']);

    const setEntries = useCallback((updater: React.SetStateAction<LuotThiQuyen[]>) => {
        setEntriesState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: LuotThiQuyen[]) => LuotThiQuyen[])(prev)
                : updater;
            void repositories.formPerformances.mock.replaceAll(next);
            return next;
        });
    }, [setEntriesState]);

    const noiDungs = useMemo(() => Array.from(new Set(entries.map(e => e.noi_dung))).filter(Boolean), [entries]);
    const gioiTinhs = useMemo(() => Array.from(new Set(entries.map(e => e.gioi_tinh))).filter(Boolean), [entries]);
    const luaTuois = useMemo(() => Array.from(new Set(entries.map(e => e.lua_tuoi))).filter(Boolean), [entries]);

    const filtered = useMemo(() => {
        let d = entries;
        if (noiDungFilter !== 'all') d = d.filter(e => e.noi_dung === noiDungFilter);
        if (gioiTinhFilter !== 'all') d = d.filter(e => e.gioi_tinh === gioiTinhFilter);
        if (luaTuoiFilter !== 'all') d = d.filter(e => e.lua_tuoi === luaTuoiFilter);
        if (filter) d = d.filter(e => e.trang_thai === filter);
        return d;
    }, [entries, filter, noiDungFilter, gioiTinhFilter, luaTuoiFilter]);

    const pStages = useMemo(() => {
        let d = entries;
        if (noiDungFilter !== 'all') d = d.filter(e => e.noi_dung === noiDungFilter);
        if (gioiTinhFilter !== 'all') d = d.filter(e => e.gioi_tinh === gioiTinhFilter);
        if (luaTuoiFilter !== 'all') d = d.filter(e => e.lua_tuoi === luaTuoiFilter);
        return [
            { key: 'cho_thi', label: 'Chờ thi', color: '#f59e0b', count: d.filter(e => e.trang_thai === 'cho_thi').length },
            { key: 'dang_thi', label: 'Đang thi', color: '#ef4444', count: d.filter(e => e.trang_thai === 'dang_thi').length },
            { key: 'da_cham', label: 'Đã chấm', color: '#10b981', count: d.filter(e => e.trang_thai === 'da_cham').length },
            { key: 'hoan', label: 'Hoãn', color: '#94a3b8', count: d.filter(e => e.trang_thai === 'hoan').length },
        ];
    }, [entries, noiDungFilter, gioiTinhFilter, luaTuoiFilter]);

    // Ranking: sort by diem_tb desc, only da_cham, grouped by noi_dung
    const rankedGroups = useMemo(() => {
        let scored = entries.filter(e => e.trang_thai === 'da_cham');
        if (noiDungFilter !== 'all') scored = scored.filter(e => e.noi_dung === noiDungFilter);
        if (gioiTinhFilter !== 'all') scored = scored.filter(e => e.gioi_tinh === gioiTinhFilter);
        if (luaTuoiFilter !== 'all') scored = scored.filter(e => e.lua_tuoi === luaTuoiFilter);

        // Group by noi_dung
        const groups: Record<string, LuotThiQuyen[]> = {};
        scored.forEach(e => {
            const key = e.noi_dung;
            const bucket = groups[key] ?? [];
            bucket.push({ ...e }); // copy to avoid mutating state directly
            groups[key] = bucket;
        });

        // Compute ranks per group
        Object.keys(groups).forEach(nd => {
            const grp = groups[nd] || [];
            grp.sort((a, b) => {
                if (b.diem_tb !== a.diem_tb) return b.diem_tb - a.diem_tb;
                const tbA = a?.tie_breakers;
                const tbB = b?.tie_breakers;
                if (!tbA || !tbB) return 0;
                if (tbB.tb1 !== tbA.tb1) return tbB.tb1 - tbA.tb1;
                if (tbB.tb2 !== tbA.tb2) return tbB.tb2 - tbA.tb2;
                if (tbB.tb3 !== tbA.tb3) return tbB.tb3 - tbA.tb3;
                if (tbB.tb4 !== tbA.tb4) return tbB.tb4 - tbA.tb4;
                return 0;
            });

            let currentRank = 1;
            grp.forEach((e, i) => {
                if (i > 0) {
                    const prev = grp[i - 1];
                    if (prev && prev.diem_tb === e.diem_tb) {
                        const tbA = prev.tie_breakers;
                        const tbB = e.tie_breakers;
                        if (tbA && tbB) {
                            if (tbA.tb1 > tbB.tb1) prev.tie_breaker_reason = 'Chỉ số phụ: Điểm giữa cao nhất';
                            else if (tbA.tb2 > tbB.tb2) prev.tie_breaker_reason = 'Chỉ số phụ: Điểm giữa thấp nhất';
                            else if (tbA.tb3 > tbB.tb3) prev.tie_breaker_reason = 'Chỉ số phụ: Điểm bỏ cao nhất';
                            else if (tbA.tb4 > tbB.tb4) prev.tie_breaker_reason = 'Chỉ số phụ: Điểm bỏ thấp nhất';
                            else prev.tie_breaker_reason = 'Hòa điểm tuyệt đối';
                        }
                        currentRank++;
                    } else {
                        currentRank = i + 1;
                    }
                }
                e.xep_hang = currentRank;
            });
        });

        return groups;
    }, [entries, noiDungFilter, gioiTinhFilter, luaTuoiFilter]);

    // Flat ranked array for the table display
    const rankedFlat = useMemo(() => {
        return Object.values(rankedGroups).flat();
    }, [rankedGroups]);

    const openScoreModal = (e: LuotThiQuyen) => {
        setScoreModal(e);
        const numJ = judgeCount;
        if (e.diem.length === numJ) {
            setScores(e.diem.map(String));
        } else {
            setScores(Array(numJ).fill(''));
        }
    };

    const toggleStatus = (id: string) => {
        setEntries(p => p.map(e => {
            if (e.id !== id) return e;
            if (e.trang_thai === 'cho_thi') return { ...e, trang_thai: 'dang_thi' as TrangThaiQuyen };
            return e;
        }));
        showToast('Bắt đầu lượt thi!');
    };

    const handleScore = () => {
        if (!scoreModal) return;
        const nums = scores.map(s => parseFloat(s));
        if (nums.some(n => isNaN(n) || n < 0 || n > 10)) { showToast('Điểm phải từ 0-10', 'error'); return; }
        const { avg, tie_breakers } = calcQuyenScore(nums);
        setEntries(p => p.map(e => e.id === scoreModal.id ? { ...e, diem: nums, diem_tb: avg, tie_breakers, trang_thai: 'da_cham' as TrangThaiQuyen } : e));
        showToast(`Đã chấm: ${scoreModal.vdv_ten} — TB: ${avg.toFixed(2)}`);
        setScoreModal(null);
    };

    const liveScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
    const numJ = judgeCount;
    const liveScoreResult = liveScores.length >= 3 ? calcQuyenScore(liveScores.length === numJ ? liveScores : [...liveScores, ...Array(Math.max(0, numJ - liveScores.length)).fill(0)]) : null;
    const liveAvg = liveScoreResult?.avg ?? null;
    return (
        <div className="mx-auto max-w-[1400px] pb-24">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />

            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải dữ liệu thi quyền: {uiState.error}
                </div>
            )}

            {/* KPI */}
            <div className="vct-stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <VCT_KpiCard label="Tổng lượt thi" value={entries.length} icon={<VCT_Icons.Award size={24} />} color="#22d3ee" />
                <VCT_KpiCard label="Đã chấm" value={entries.filter(e => e.trang_thai === 'da_cham').length} icon={<VCT_Icons.Check size={24} />} color="#10b981" />
                <VCT_KpiCard label="Chờ thi" value={entries.filter(e => e.trang_thai === 'cho_thi').length} icon={<VCT_Icons.Clock size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Điểm Tổng cao nhất" value={rankedFlat.length > 0 ? Array.from(rankedFlat).sort((a, b) => b.diem_tb - a.diem_tb)[0]?.diem_tb.toFixed(2) : '—'} icon={<VCT_Icons.Star size={24} />} color="#a78bfa" sub={rankedFlat.length > 0 ? Array.from(rankedFlat).sort((a, b) => b.diem_tb - a.diem_tb)[0]?.vdv_ten : ''} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24, justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--vct-bg-card)', padding: '20px 24px', borderRadius: 16, border: '1px solid var(--vct-border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 }}>Bộ lọc Dữ liệu</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <select
                            value={luaTuoiFilter}
                            onChange={e => setLuaTuoiFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', color: 'var(--vct-text-primary)', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Tất cả Lứa tuổi</option>
                            {luaTuois.map(lt => <option key={lt} value={lt}>{lt}</option>)}
                        </select>
                        <select
                            value={gioiTinhFilter}
                            onChange={e => setGioiTinhFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', color: 'var(--vct-text-primary)', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Tất cả Giới tính</option>
                            {gioiTinhs.map(gt => <option key={gt} value={gt}>{gt}</option>)}
                        </select>
                        <select
                            value={noiDungFilter}
                            onChange={e => setNoiDungFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', color: 'var(--vct-text-primary)', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Tất cả Nội dung</option>
                            {noiDungs.map(nd => <option key={nd} value={nd}>{nd}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 }}>Trạng thái thi đấu</div>
                    <VCT_StatusPipeline stages={pStages} activeStage={filter} onStageClick={setFilter} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 }}>Số lượng Giám định</div>
                    <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: 'var(--vct-bg-input)' }}>
                        {([5, 7] as const).map(n => (
                            <button key={n} onClick={() => setJudgeCount(n)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: judgeCount === n ? 'var(--vct-accent-primary)' : 'transparent', color: judgeCount === n ? '#fff' : 'var(--vct-text-secondary)' }}
                            >{n} GĐV</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Podiums Grouper */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
                {Object.entries(rankedGroups).map(([ndName, rGrp]) => {
                    if (rGrp.length < 3) return null; // Only show podium if there are at least 3 scored
                    return (
                        <div key={ndName} style={{ background: 'var(--vct-bg-card)', padding: '24px 32px', borderRadius: 24, border: '1px solid var(--vct-border-subtle)' }}>
                            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginBottom: 24 }}>{ndName}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'flex-end' }}>
                                {[rGrp[1], rGrp[0], rGrp[2]].map((r, i) => {
                                    if (!r) return null;
                                    const podiumHeight = [90, 120, 70][i];
                                    const medal = ['🥈', '🥇', '🥉'][i];
                                    return (
                                        <motion.div key={r.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
                                            style={{ textAlign: 'center', width: 140 }}>
                                            <div style={{ fontSize: 28, marginBottom: 4 }}>{medal}</div>
                                            <VCT_AvatarLetter name={r.vdv_ten} size={i === 1 ? 48 : 36} style={{ margin: '0 auto 6px' }} />
                                            <div style={{ fontSize: 13, fontWeight: 800 }}>{r.vdv_ten}</div>
                                            <div style={{ fontSize: 11, opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.doan_ten}</div>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: '#22d3ee', fontFamily: 'monospace', marginTop: 4 }}>{r.diem_tb.toFixed(2)}</div>
                                            <div style={{ height: podiumHeight, background: `linear-gradient(180deg, ${'#22d3ee'}30, ${'#22d3ee'}08)`, borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
                                                <span style={{ fontSize: 24, fontWeight: 900, opacity: 0.3 }}>{r.xep_hang}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Entries Table */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có lượt thi" description="Thử thay đổi bộ lọc." icon="🥋" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                {['#', 'VĐV', 'Đoàn', 'Nội dung', 'GĐ1', 'GĐ2', 'GĐ3', 'GĐ4', 'GĐ5', 'Điểm Tổng', 'Trạng thái', ''].map((h, i) => (
                                    <th key={i} style={{ padding: '12px 10px', textAlign: i >= 4 && i <= 9 ? 'center' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e, idx) => {
                                const st = ST_MAP[e.trang_thai];
                                const r = rankedFlat.find(x => x.id === e.id);
                                const minD = e.diem.length > 0 ? Math.min(...e.diem) : -1;
                                const maxD = e.diem.length > 0 ? Math.max(...e.diem) : -1;
                                return (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', borderLeft: `3px solid ${st.color}`, background: idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)' }}>
                                        <td style={{ padding: '12px 10px', fontWeight: 800, color: r && r.xep_hang <= 3 ? ['', '#fbbf24', '#94a3b8', '#d97706'][r.xep_hang] : 'var(--vct-text-tertiary)', fontSize: 14 }}>
                                            {r ? r.xep_hang : '—'}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <VCT_Stack direction="row" gap={8} align="center">
                                                <VCT_AvatarLetter name={e.vdv_ten} size={28} />
                                                <span style={{ fontWeight: 700, fontSize: 13 }}>{e.vdv_ten}</span>
                                            </VCT_Stack>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontSize: 13 }}>{e.doan_ten}</td>
                                        <td style={{ padding: '12px 10px', fontSize: 12 }}>{e.noi_dung}</td>
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <td key={i} style={{ padding: '12px 6px', textAlign: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: e.diem[i] === minD ? '#ef4444' : e.diem[i] === maxD ? '#3b82f6' : 'inherit', textDecoration: (e.diem[i] === minD || e.diem[i] === maxD) && e.diem.length === 5 ? 'line-through' : 'none', opacity: (e.diem[i] === minD || e.diem[i] === maxD) && e.diem.length === 5 ? 0.4 : 1 }}>
                                                {e.diem[i] !== undefined ? e.diem[i].toFixed(1) : '—'}
                                            </td>
                                        ))}
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            {e.diem_tb > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#22d3ee', fontFamily: 'monospace' }}>{e.diem_tb.toFixed(2)}</span>
                                                    {r?.tie_breaker_reason && <span style={{ fontSize: 10, color: 'var(--vct-text-tertiary)', marginTop: 4, fontStyle: 'italic', fontWeight: 600 }}>{r.tie_breaker_reason}</span>}
                                                </div>
                                            ) : <span className="opacity-30">—</span>}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}><VCT_Badge text={st.label} type={st.type} pulse={e.trang_thai === 'dang_thi'} /></td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <VCT_Stack direction="row" gap={4}>
                                                {e.trang_thai === 'cho_thi' && <VCT_Button variant="secondary" onClick={() => toggleStatus(e.id)} style={{ padding: '4px 10px', fontSize: 11 }}>▶</VCT_Button>}
                                                <VCT_Button variant={e.trang_thai === 'da_cham' ? 'secondary' : 'primary'} onClick={() => openScoreModal(e)} style={{ padding: '4px 12px', fontSize: 11 }}>
                                                    {e.trang_thai === 'da_cham' ? '🔄 Sửa' : '✏️ Chấm'}
                                                </VCT_Button>
                                            </VCT_Stack>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Score Modal */}
            <VCT_Modal isOpen={!!scoreModal} onClose={() => setScoreModal(null)} title="✏️ Chấm điểm Quyền" width="600px" footer={
                <><VCT_Button variant="secondary" onClick={() => setScoreModal(null)}>Hủy</VCT_Button><VCT_Button onClick={handleScore}>Xác nhận điểm</VCT_Button></>
            }>
                {scoreModal && (
                    <VCT_Stack gap={20}>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-input)', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <VCT_AvatarLetter name={scoreModal.vdv_ten} size={40} />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{scoreModal.vdv_ten}</div>
                                <div className="text-xs opacity-60">{scoreModal.doan_ten} • {scoreModal.noi_dung}</div>
                            </div>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>{numJ} Giám định viên (0 - 10 điểm) — Bỏ điểm cao + thấp nhất</div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numJ}, 1fr)`, gap: numJ === 7 ? 8 : 12 }}>
                            {scores.map((s, i) => {
                                const n = parseFloat(s);
                                const allNums = scores.map(x => parseFloat(x)).filter(x => !isNaN(x));
                                const isMin = allNums.length === 5 && !isNaN(n) && n === Math.min(...allNums);
                                const isMax = allNums.length === 5 && !isNaN(n) && n === Math.max(...allNums);
                                return (
                                    <div key={i} className="text-center">
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, marginBottom: 6 }}>GĐ{i + 1}</div>
                                        <VCT_Input type="text" inputMode="decimal" value={s} onChange={(e: any) => {
                                            let val = e.target.value.replace(',', '.');
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                const ns = [...scores]; ns[i] = val; setScores(ns);
                                            }
                                        }}
                                            placeholder="8.5" style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, fontFamily: 'monospace', border: isMin ? '2px solid #ef4444' : isMax ? '2px solid #3b82f6' : undefined, opacity: (isMin || isMax) ? 0.5 : 1 }} />
                                        {isMin && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginTop: 2 }}>BỎ THẤP</div>}
                                        {isMax && <div style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700, marginTop: 2 }}>BỎ CAO</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {liveAvg !== null && liveScores.length === numJ && (
                            <div style={{ textAlign: 'center', padding: 20, borderRadius: 16, background: 'rgba(34, 211, 238, 0.05)', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>Điểm Tổng (Bỏ cao / thấp)</div>
                                <div style={{ fontSize: 42, fontWeight: 900, color: '#22d3ee', fontFamily: 'monospace', lineHeight: 1.2 }}>{liveAvg.toFixed(2)}</div>
                            </div>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Modal>
        </div>
    );
};
