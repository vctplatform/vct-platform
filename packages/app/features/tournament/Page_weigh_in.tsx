'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field,
    VCT_StatusPipeline, VCT_FilterChips, VCT_ProgressBar, VCT_EmptyState,
    VCT_AvatarLetter, VCT_SegmentedControl
} from '@vct/ui';
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui';
import type { StatItem } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';
import type { CanKy, KetQuaCan } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';
import { VCT_Card } from '@vct/ui';

const KQ_MAP: Record<KetQuaCan, { label: string; color: string; type: string; borderClass: string; bgClass: string }> = {
    dat: { label: '✓ Đạt', color: 'var(--vct-success)', type: 'success', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/5' },
    khong_dat: { label: '✗ Không đạt', color: 'var(--vct-danger)', type: 'danger', borderClass: 'border-red-500', bgClass: 'bg-red-500/5' },
    cho_can: { label: '⏳ Chờ cân', color: 'var(--vct-warning)', type: 'warning', borderClass: 'border-amber-500', bgClass: 'bg-amber-500/5' },
};

const PIPELINE = [
    { key: 'dat', label: '✓ Đạt', color: 'var(--vct-success)' },
    { key: 'khong_dat', label: '✗ Không đạt', color: 'var(--vct-danger)' },
    { key: 'cho_can', label: '⏳ Chờ cân', color: 'var(--vct-warning)' },
];

export const Page_weigh_in = () => {
    const { items: records, setItems: setRecordsState, uiState } = useEntityCollection(repositories.weighIns.mock);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const { toast, showToast, hideToast } = useToast();
    const [weighModal, setWeighModal] = useState<CanKy | null>(null);
    const [weighValue, setWeighValue] = useState('');
    const [isKioskMode, setIsKioskMode] = useState(false);

    const setRecords = useCallback((updater: React.SetStateAction<CanKy[]>) => {
        setRecordsState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: CanKy[]) => CanKy[])(prev)
                : updater;
            void repositories.weighIns.mock.replaceAll(next);
            return next;
        });
    }, [setRecordsState]);

    const filtered = useMemo(() => {
        let d = records;
        if (statusFilter) d = d.filter(r => r.ket_qua === statusFilter);
        if (search) { const q = search.toLowerCase(); d = d.filter(r => r.vdv_ten.toLowerCase().includes(q) || r.doan_ten.toLowerCase().includes(q)); }
        return d;
    }, [records, statusFilter, search]);

    const pStages = useMemo(() => PIPELINE.map(s => ({ ...s, count: records.filter(r => r.ket_qua === s.key).length })), [records]);
    const daCan = records.filter(r => r.ket_qua !== 'cho_can').length;

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = [];
        if (statusFilter) f.push({ key: 'status', label: 'Kết quả', value: KQ_MAP[statusFilter as KetQuaCan]?.label || '' });
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search });
        return f;
    }, [statusFilter, search]);

    const openWeigh = (r: CanKy) => { setWeighModal(r); setWeighValue(r.can_thuc_te > 0 ? String(r.can_thuc_te) : ''); };

    const handleWeigh = () => {
        if (!weighModal) return;
        const w = parseFloat(weighValue);
        if (isNaN(w) || w <= 0) { showToast('Vui lòng nhập cân nặng hợp lệ', 'error'); return; }
        const pass = w >= weighModal.can_tu && w <= weighModal.can_den;
        setRecords(p => p.map(r => r.id === weighModal.id ? { ...r, can_thuc_te: w, ket_qua: pass ? 'dat' as KetQuaCan : 'khong_dat' as KetQuaCan, thoi_gian: new Date().toLocaleString('vi-VN'), ghi_chu: pass ? '' : `Lố ${(w > weighModal.can_den ? w - weighModal.can_den : weighModal.can_tu - w).toFixed(1)}kg` } : r));
        showToast(pass ? `✓ ${weighModal.vdv_ten}: ${w}kg — ĐẠT` : `✗ ${weighModal.vdv_ten}: ${w}kg — KHÔNG ĐẠT`, pass ? 'success' : 'error');
        setWeighModal(null);
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />

            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải dữ liệu cân ký: {uiState.error}
                </div>
            )}

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase text-(--vct-text-primary)">Trạm Cân Ký</h1>
                    <p className="text-sm font-medium text-(--vct-text-tertiary)">Quản lý và cập nhật số liệu cân nặng thực tế</p>
                </div>
                <VCT_SegmentedControl
                    options={[{ label: 'Giao diện Quản lý', value: 'admin' }, { label: 'Kiosk Mode', value: 'kiosk' }]}
                    value={isKioskMode ? 'kiosk' : 'admin'}
                    onChange={(v) => setIsKioskMode(v === 'kiosk')}
                />
            </div>

            {/* KPI Row */}
            {!isKioskMode && (
                <VCT_StatRow items={[
                    { label: 'Tổng VĐV cần cân', value: records.length, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-accent-cyan)' },
                    { label: 'Đã cân', value: daCan, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)', sub: `${Math.round((daCan / Math.max(1, records.length)) * 100)}% hoàn thành` },
                    { label: 'Đạt cân', value: records.filter(r => r.ket_qua === 'dat').length, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-accent-cyan)' },
                    { label: 'Lố cân', value: records.filter(r => r.ket_qua === 'khong_dat').length, icon: <VCT_Icons.Alert size={18} />, color: 'var(--vct-danger)', sub: 'Cần xử lý' },
                    { label: 'Chờ cân', value: records.filter(r => r.ket_qua === 'cho_can').length, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-warning)' },
                ] as StatItem[]} className="mb-6" />
            )}

            {/* Progress */}
            <div className="mb-5">
                <div className="mb-1.5 text-xs font-bold opacity-60">TIẾN ĐỘ CÂN KÝ</div>
                <VCT_ProgressBar value={daCan} max={records.length} showLabel height={8} />
            </div>

            {/* Stats Row: Donut + By Đoàn */}
            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
                {/* Donut Chart */}
                <div className="rounded-[14px] border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 text-center">
                    <div className="mb-2 text-[11px] font-extrabold uppercase opacity-40">Tỷ lệ cân ký</div>
                    {(() => {
                        const total = records.length || 1;
                        const dat = records.filter(r => r.ket_qua === 'dat').length;
                        const fail = records.filter(r => r.ket_qua === 'khong_dat').length;
                        const wait = records.filter(r => r.ket_qua === 'cho_can').length;
                        const r = 60; const cx = 70; const cy = 70; const sw = 14;
                        const pDat = dat / total; const pFail = fail / total;
                        const circ = 2 * Math.PI * r;
                        return (
                            <>
                                <svg width={140} height={140} viewBox="0 0 140 140">
                                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--vct-warning)" strokeWidth={sw} opacity={0.15} />
                                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--vct-success)" strokeWidth={sw}
                                        strokeDasharray={`${circ * pDat} ${circ}`} strokeDashoffset={0}
                                        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
                                    {fail > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--vct-danger)" strokeWidth={sw}
                                        strokeDasharray={`${circ * pFail} ${circ}`} strokeDashoffset={-circ * pDat}
                                        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />}
                                    <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--vct-text-primary)" className="text-[22px] font-black">{Math.round((dat / total) * 100)}%</text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--vct-text-tertiary)" className="text-[10px] font-semibold">Tỷ lệ đạt</text>
                                </svg>
                                <div className="mt-2 flex justify-center gap-3 text-[11px]">
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Đạt {dat}</span>
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Rớt {fail}</span>
                                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Chờ {wait}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* By Đoàn */}
                <div className="max-h-[220px] overflow-y-auto rounded-[14px] border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
                    <div className="mb-2 text-[11px] font-extrabold uppercase opacity-40">Thống kê theo đoàn</div>
                    {(() => {
                        const m: Record<string, { dat: number; fail: number; total: number }> = {};
                        records.forEach(r => {
                            if (!m[r.doan_ten]) m[r.doan_ten] = { dat: 0, fail: 0, total: 0 };
                            m[r.doan_ten]!.total++;
                            if (r.ket_qua === 'dat') m[r.doan_ten]!.dat++;
                            if (r.ket_qua === 'khong_dat') m[r.doan_ten]!.fail++;
                        });
                        return Object.entries(m).sort(([, a], [, b]) => b.total - a.total).map(([doan, s]) => (
                            <div key={doan} className="flex items-center gap-2.5 border-b border-(--vct-border-subtle) py-1.5">
                                <span className="min-w-[100px] text-xs font-bold">{doan}</span>
                                <div className="flex h-1.5 flex-1 overflow-hidden rounded-[3px] bg-slate-200 dark:bg-slate-700">
                                    <div className="h-full bg-emerald-500" {...{ style: { width: `${(s.dat / s.total) * 100}%` } }} />
                                    <div className="h-full bg-red-500" {...{ style: { width: `${(s.fail / s.total) * 100}%` } }} />
                                </div>
                                <span className="min-w-[20px] text-right font-mono text-[11px] font-bold text-emerald-500">{s.dat}</span>
                                <span className="text-[11px] opacity-30">/</span>
                                <span className="min-w-[20px] font-mono text-[11px] font-bold">{s.total}</span>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Pipeline */}
            <VCT_StatusPipeline stages={pStages} activeStage={statusFilter} onStageClick={setStatusFilter} />
            <VCT_FilterChips filters={activeFilters} onRemove={k => { if (k === 'status') setStatusFilter(null); if (k === 'search') setSearch(''); }} onClearAll={() => { setStatusFilter(null); setSearch(''); }} />

            {/* Toolbar */}
            <VCT_Stack direction="row" gap={16} align="center" className="mb-5">
                <div className="min-w-[200px] flex-[1_1_250px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm VĐV, đoàn..." /></div>
                <div className="flex-none">
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Printer size={16} />} onClick={() => window.print()}>In danh sách</VCT_Button>
                </div>
            </VCT_Stack>

            {/* Print Blank Form Style */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-weigh-in-form, .print-weigh-in-form * { visibility: visible; color: #000 !important; }
                    .print-weigh-in-form { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
                    main, nav, header { display: none !important; }
                    .print-weigh-in-form td, .print-weigh-in-form th { padding: 8px !important; border: 1px solid #000 !important; font-size: 14px !important; }
                    .print-weigh-in-form th { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; font-weight: bold !important; }
                    .print-signature-weigh-in { height: 60px; }
                    
                    /* Hide UI columns */
                    .hide-on-print { display: none !important; }
                }
            `}</style>

            {/* Print Container Layout */}
            <div className="print-weigh-in-form hidden">
                <div className="mb-5 text-center">
                    <h2 className="mb-2.5 text-2xl font-bold">DANH SÁCH CÂN KÝ VÀ BỐC THĂM - NỘI DUNG ĐỐI KHÁNG</h2>
                    <p className="m-0 text-base">Ngày: ...../...../..........  Tại: ........................................</p>
                </div>
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr>
                            <th className="w-10 text-center">STT</th>
                            <th>Đơn Vị / Đoàn</th>
                            <th>Họ và Tên VĐV</th>
                            <th className="w-[60px] text-center">Giới</th>
                            <th className="w-[100px] text-center">Hạng Cân ĐK</th>
                            <th className="w-[100px] text-center">Cân Thực Tế</th>
                            <th className="w-[100px] text-center">Chữ Ký VĐV</th>
                            <th className="w-[120px] text-center">Xác Nhận Trọng Tài</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={r.id}>
                                <td className="text-center">{i + 1}</td>
                                <td>{r.doan_ten}</td>
                                <td className="font-bold">{r.vdv_ten}</td>
                                <td className="text-center">{r.gioi === 'nam' ? 'Nam' : 'Nữ'}</td>
                                <td className="text-center">{r.can_tu}-{r.can_den}kg</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-10 flex justify-between px-[50px]">
                    <div className="text-center">
                        <p className="font-bold">BAN TỔ CHỨC</p>
                        <p className="text-xs italic">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">TRƯỞNG BAN TRỌNG TÀI</p>
                        <p className="text-xs italic">(Ký và ghi rõ họ tên)</p>
                    </div>
                </div>
            </div>

            {/* Table / Kiosk View */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy" description="Thử thay đổi bộ lọc." icon="⚖️" />
            ) : isKioskMode ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map(r => {
                        const kq = KQ_MAP[r.ket_qua];
                        const isWait = r.ket_qua === 'cho_can';
                        const isOverweight = r.ket_qua === 'khong_dat';
                        return (
                            <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'relative' }}>
                                <div
                                    onClick={() => openWeigh(r)}
                                    className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-(--vct-bg-card) p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${isWait ? 'border-(--vct-accent-blue)' : (isOverweight ? 'border-red-500' : 'border-emerald-500')}`}
                                >
                                    {/* Action overlay */}
                                    <div className="absolute right-3 top-3">
                                        {isWait ? (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg animate-pulse">
                                                <VCT_Icons.Activity size={20} />
                                            </div>
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                                                <VCT_Icons.Refresh size={18} />
                                            </div>
                                        )}
                                    </div>

                                    <VCT_Stack gap={16}>
                                        <div className="flex items-center gap-3">
                                            <VCT_AvatarLetter name={r.vdv_ten} size={56} className="shadow-sm" />
                                            <div>
                                                <div className="text-lg font-black leading-tight text-(--vct-text-primary)">{r.vdv_ten}</div>
                                                <div className="text-xs font-semibold uppercase text-(--vct-text-tertiary) opacity-80">{r.doan_ten} • {r.gioi === 'nam' ? 'Nam' : 'Nữ'}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between rounded-xl bg-(--vct-bg-input) p-3">
                                            <div className="text-center">
                                                <div className="text-[10px] font-bold uppercase opacity-50">Đăng ký</div>
                                                <div className="font-mono text-base font-bold text-(--vct-text-primary)">{r.can_tu}-{r.can_den}k</div>
                                            </div>
                                            <div className="w-px bg-(--vct-border-subtle)" />
                                            <div className="text-center">
                                                <div className="text-[10px] font-bold uppercase opacity-50">Thực tế</div>
                                                <div className={`font-mono text-base font-black ${isOverweight ? 'text-red-500' : (isWait ? 'text-(--vct-text-secondary) opacity-30' : 'text-emerald-500')}`}>
                                                    {r.can_thuc_te > 0 ? `${r.can_thuc_te}k` : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {!isWait && (
                                            <div className="text-center text-xs font-bold opacity-60">
                                                {kq.label} {isOverweight && `(${r.ghi_chu})`}
                                            </div>
                                        )}
                                    </VCT_Stack>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {['VĐV', 'Đoàn', 'Giới', 'Hạng cân ĐK', 'Cân thực tế', 'Kết quả', 'Thời gian', 'Ghi chú', ''].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-[11px] font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, idx) => {
                                const kq = KQ_MAP[r.ket_qua];
                                const isOverweight = r.ket_qua === 'khong_dat';
                                return (
                                    <tr key={r.id} className={`border-b border-(--vct-border-subtle) border-l-[3px] ${kq.borderClass} ${isOverweight ? 'bg-red-500/5' : idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-500/5'}`}>
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={8} align="center">
                                                <VCT_AvatarLetter name={r.vdv_ten} size={28} />
                                                <span className="text-[13px] font-bold">{r.vdv_ten}</span>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3 text-[13px]">{r.doan_ten}</td>
                                        <td className="px-4 py-3 text-[13px]">{r.gioi === 'nam' ? '♂' : '♀'}</td>
                                        <td className="px-4 py-3"><span className="font-mono text-[13px] font-bold">{r.can_tu}-{r.can_den}kg</span></td>
                                        <td className="px-4 py-3">
                                            {r.can_thuc_te > 0 ? (
                                                <span className={`font-mono text-base font-black ${isOverweight ? 'text-red-500' : 'text-emerald-500'}`}>{r.can_thuc_te}kg</span>
                                            ) : <span className="text-[13px] opacity-30">—</span>}
                                        </td>
                                        <td className="px-4 py-3"><VCT_Badge text={kq.label} type={kq.type} pulse={r.ket_qua === 'cho_can'} /></td>
                                        <td className="px-4 py-3 font-mono text-[11px] opacity-60">{r.thoi_gian || '—'}</td>
                                        <td className={`px-4 py-3 text-xs ${isOverweight ? 'font-bold text-red-500' : ''}`}>{r.ghi_chu || '—'}</td>
                                        <td className="px-4 py-3">
                                            <VCT_Button variant={r.ket_qua === 'cho_can' ? 'primary' : 'secondary'} onClick={() => openWeigh(r)} className="px-3 py-1 text-[11px]">
                                                {r.ket_qua === 'cho_can' ? '⚖️ Cân' : '🔄 Cân lại'}
                                            </VCT_Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="flex gap-6 border-t-2 border-(--vct-border-strong) bg-(--vct-bg-card) px-4 py-3 text-xs font-bold opacity-60">
                        <span>Hiện {filtered.length}/{records.length}</span>
                        <span>♂ {filtered.filter(r => r.gioi === 'nam').length} — ♀ {filtered.filter(r => r.gioi === 'nu').length}</span>
                    </div>
                </div>
            )}

            {/* Weigh Modal */}
            <VCT_Modal isOpen={!!weighModal} onClose={() => setWeighModal(null)} title="⚖️ Nhập cân nặng thực tế" width="480px" footer={
                <><VCT_Button variant="secondary" onClick={() => setWeighModal(null)}>Hủy</VCT_Button><VCT_Button onClick={handleWeigh}>Xác nhận cân</VCT_Button></>
            }>
                {weighModal && (
                    <VCT_Stack gap={16}>
                        <div className="flex items-center gap-3 rounded-xl bg-(--vct-bg-input) p-4">
                            <VCT_AvatarLetter name={weighModal.vdv_ten} size={56} />
                            <div>
                                <div className="text-lg font-black">{weighModal.vdv_ten}</div>
                                <div className="text-sm font-bold uppercase opacity-60">{weighModal.doan_ten} • {weighModal.gioi === 'nam' ? '♂ Nam' : '♀ Nữ'}</div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) p-5 text-center">
                            <div className="text-xs font-extrabold uppercase tracking-wider opacity-50">Hạng cân đăng ký</div>
                            <div className="font-mono text-4xl font-black text-(--vct-accent-cyan)">{weighModal.can_tu} — {weighModal.can_den} kg</div>
                        </div>
                        <VCT_Field label={<span className="text-lg font-bold">Cân nặng thực tế báo cáo (kg)</span>}>
                            <VCT_Input type="number" value={weighValue} onChange={(e: any) => setWeighValue(e.target.value)} placeholder="VD: 47.5" autoFocus className="h-20 rounded-2xl text-center font-mono text-5xl font-black" />
                        </VCT_Field>
                        {weighValue && !isNaN(parseFloat(weighValue)) && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border-2 p-4 text-center ${parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                                <span className={`text-lg font-black ${parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? '✓ ĐẠT — Trong phạm vi hạng cân' : `✗ KHÔNG ĐẠT — Lệch ${Math.abs(parseFloat(weighValue) > weighModal.can_den ? parseFloat(weighValue) - weighModal.can_den : weighModal.can_tu - parseFloat(weighValue)).toFixed(1)}kg`}
                                </span>
                            </motion.div>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Modal>
        </VCT_PageContainer>
    );
};
