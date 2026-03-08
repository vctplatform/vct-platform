'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field,
    VCT_StatusPipeline, VCT_FilterChips, VCT_ProgressBar, VCT_EmptyState,
    VCT_AvatarLetter, VCT_SegmentedControl
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { CAN_KYS } from '../data/mock-data';
import type { CanKy, KetQuaCan } from '../data/types';

const KQ_MAP: Record<KetQuaCan, { label: string; color: string; type: string }> = {
    dat: { label: '✓ Đạt', color: '#10b981', type: 'success' },
    khong_dat: { label: '✗ Không đạt', color: '#ef4444', type: 'danger' },
    cho_can: { label: '⏳ Chờ cân', color: '#f59e0b', type: 'warning' },
};

const PIPELINE = [
    { key: 'dat', label: '✓ Đạt', color: '#10b981' },
    { key: 'khong_dat', label: '✗ Không đạt', color: '#ef4444' },
    { key: 'cho_can', label: '⏳ Chờ cân', color: '#f59e0b' },
];

export const Page_weigh_in = () => {
    const [records, setRecords] = useState<CanKy[]>([...CAN_KYS]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [weighModal, setWeighModal] = useState<CanKy | null>(null);
    const [weighValue, setWeighValue] = useState('');

    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500); }, []);

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
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="Tổng VĐV cần cân" value={records.length} icon={<VCT_Icons.Activity size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Đã cân" value={daCan} icon={<VCT_Icons.Check size={24} />} color="#10b981" sub={`${Math.round(daCan / records.length * 100)}% hoàn thành`} />
                <VCT_KpiCard label="Đạt cân" value={records.filter(r => r.ket_qua === 'dat').length} icon={<VCT_Icons.Check size={24} />} color="#22d3ee" />
                <VCT_KpiCard label="Lố cân" value={records.filter(r => r.ket_qua === 'khong_dat').length} icon={<VCT_Icons.Alert size={24} />} color="#ef4444" sub="Cần xử lý" />
                <VCT_KpiCard label="Chờ cân" value={records.filter(r => r.ket_qua === 'cho_can').length} icon={<VCT_Icons.Clock size={24} />} color="#f59e0b" />
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, marginBottom: 6 }}>TIẾN ĐỘ CÂN KÝ</div>
                <VCT_ProgressBar value={daCan} max={records.length} showLabel height={8} />
            </div>

            {/* Stats Row: Donut + By Đoàn */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, marginBottom: 24 }}>
                {/* Donut Chart */}
                <div style={{ padding: 16, borderRadius: 14, background: 'var(--vct-bg-glass)', border: '1px solid var(--vct-border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginBottom: 8 }}>Tỷ lệ cân ký</div>
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
                                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={sw} opacity={0.15} />
                                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={sw}
                                        strokeDasharray={`${circ * pDat} ${circ}`} strokeDashoffset={0}
                                        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
                                    {fail > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={sw}
                                        strokeDasharray={`${circ * pFail} ${circ}`} strokeDashoffset={-circ * pDat}
                                        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />}
                                    <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--vct-text-primary)" style={{ fontSize: 22, fontWeight: 900 }}>{Math.round((dat / total) * 100)}%</text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--vct-text-tertiary)" style={{ fontSize: 10, fontWeight: 600 }}>Tỷ lệ đạt</text>
                                </svg>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: 11 }}>
                                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginRight: 4 }} />Đạt {dat}</span>
                                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginRight: 4 }} />Rớt {fail}</span>
                                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginRight: 4 }} />Chờ {wait}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* By Đoàn */}
                <div style={{ padding: 16, borderRadius: 14, background: 'var(--vct-bg-glass)', border: '1px solid var(--vct-border-subtle)', overflowY: 'auto', maxHeight: 220 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginBottom: 8 }}>Thống kê theo đoàn</div>
                    {(() => {
                        const m: Record<string, { dat: number; fail: number; total: number }> = {};
                        records.forEach(r => {
                            if (!m[r.doan_ten]) m[r.doan_ten] = { dat: 0, fail: 0, total: 0 };
                            m[r.doan_ten]!.total++;
                            if (r.ket_qua === 'dat') m[r.doan_ten]!.dat++;
                            if (r.ket_qua === 'khong_dat') m[r.doan_ten]!.fail++;
                        });
                        return Object.entries(m).sort(([, a], [, b]) => b.total - a.total).map(([doan, s]) => (
                            <div key={doan} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                                <span style={{ fontWeight: 700, fontSize: 12, minWidth: 100 }}>{doan}</span>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ width: `${(s.dat / s.total) * 100}%`, height: '100%', background: '#10b981' }} />
                                    <div style={{ width: `${(s.fail / s.total) * 100}%`, height: '100%', background: '#ef4444' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#10b981', minWidth: 20, textAlign: 'right' }}>{s.dat}</span>
                                <span style={{ fontSize: 11, opacity: 0.3 }}>/</span>
                                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', minWidth: 20 }}>{s.total}</span>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Pipeline */}
            <VCT_StatusPipeline stages={pStages} activeStage={statusFilter} onStageClick={setStatusFilter} />
            <VCT_FilterChips filters={activeFilters} onRemove={k => { if (k === 'status') setStatusFilter(null); if (k === 'search') setSearch(''); }} onClearAll={() => { setStatusFilter(null); setSearch(''); }} />

            {/* Toolbar */}
            <VCT_Stack direction="row" gap={16} align="center" style={{ marginBottom: 20 }}>
                <div style={{ flex: '1 1 250px', minWidth: 200 }}><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm VĐV, đoàn..." /></div>
                <div style={{ flex: '0 0 auto' }}>
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Printer size={16} />} onClick={() => window.print()}>In danh sách Cân Ký & Bốc thăm</VCT_Button>
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
            <div className="print-weigh-in-form" style={{ display: 'none' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 10px 0' }}>DANH SÁCH CÂN KÝ VÀ BỐC THĂM - NỘI DUNG ĐỐI KHÁNG</h2>
                    <p style={{ fontSize: 16, margin: 0 }}>Ngày: ...../...../..........  Tại: ........................................</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                    <thead>
                        <tr>
                            <th style={{ width: 40, textAlign: 'center' }}>STT</th>
                            <th>Đơn Vị / Đoàn</th>
                            <th>Họ và Tên VĐV</th>
                            <th style={{ width: 60, textAlign: 'center' }}>Giới</th>
                            <th style={{ width: 100, textAlign: 'center' }}>Hạng Cân ĐK</th>
                            <th style={{ width: 100, textAlign: 'center' }}>Cân Thực Tế</th>
                            <th style={{ width: 100, textAlign: 'center' }}>Chữ Ký VĐV</th>
                            <th style={{ width: 120, textAlign: 'center' }}>Xác Nhận Trọng Tài</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={r.id}>
                                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                <td>{r.doan_ten}</td>
                                <td style={{ fontWeight: 'bold' }}>{r.vdv_ten}</td>
                                <td style={{ textAlign: 'center' }}>{r.gioi === 'nam' ? 'Nam' : 'Nữ'}</td>
                                <td style={{ textAlign: 'center' }}>{r.can_tu}-{r.can_den}kg</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, padding: '0 50px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold' }}>BAN TỔ CHỨC</p>
                        <p style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 'bold' }}>TRƯỞNG BAN TRỌNG TÀI</p>
                        <p style={{ fontStyle: 'italic', fontSize: 12 }}>(Ký và ghi rõ họ tên)</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy" description="Thử thay đổi bộ lọc." icon="⚖️" />
            ) : (
                <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                                {['VĐV', 'Đoàn', 'Giới', 'Hạng cân ĐK', 'Cân thực tế', 'Kết quả', 'Thời gian', 'Ghi chú', ''].map((h, i) => (
                                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, idx) => {
                                const kq = KQ_MAP[r.ket_qua];
                                const isOverweight = r.ket_qua === 'khong_dat';
                                return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', borderLeft: `3px solid ${kq.color}`, background: isOverweight ? 'rgba(239, 68, 68, 0.03)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <VCT_Stack direction="row" gap={8} align="center">
                                                <VCT_AvatarLetter name={r.vdv_ten} size={28} />
                                                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.vdv_ten}</span>
                                            </VCT_Stack>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.doan_ten}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.gioi === 'nam' ? '♂' : '♀'}</td>
                                        <td style={{ padding: '12px 16px' }}><span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{r.can_tu}-{r.can_den}kg</span></td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {r.can_thuc_te > 0 ? (
                                                <span style={{ fontWeight: 900, fontSize: 16, color: isOverweight ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>{r.can_thuc_te}kg</span>
                                            ) : <span style={{ opacity: 0.3, fontSize: 13 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}><VCT_Badge text={kq.label} type={kq.type} pulse={r.ket_qua === 'cho_can'} /></td>
                                        <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', opacity: 0.6 }}>{r.thoi_gian || '—'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: isOverweight ? '#ef4444' : 'inherit', fontWeight: isOverweight ? 700 : 400 }}>{r.ghi_chu || '—'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <VCT_Button variant={r.ket_qua === 'cho_can' ? 'primary' : 'secondary'} onClick={() => openWeigh(r)} style={{ padding: '4px 12px', fontSize: 11 }}>
                                                {r.ket_qua === 'cho_can' ? '⚖️ Cân' : '🔄 Cân lại'}
                                            </VCT_Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ padding: '10px 16px', borderTop: '2px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', display: 'flex', gap: 24, fontSize: 12, fontWeight: 700, opacity: 0.6 }}>
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
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-input)', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <VCT_AvatarLetter name={weighModal.vdv_ten} size={40} />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{weighModal.vdv_ten}</div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>{weighModal.doan_ten} • {weighModal.gioi === 'nam' ? '♂ Nam' : '♀ Nữ'}</div>
                            </div>
                        </div>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>Hạng cân đăng ký</div>
                            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: 'var(--vct-accent-cyan)' }}>{weighModal.can_tu} — {weighModal.can_den} kg</div>
                        </div>
                        <VCT_Field label="Cân nặng thực tế (kg)">
                            <VCT_Input type="number" value={weighValue} onChange={(e: any) => setWeighValue(e.target.value)} placeholder="VD: 47.5" autoFocus style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', fontFamily: 'monospace' }} />
                        </VCT_Field>
                        {weighValue && !isNaN(parseFloat(weighValue)) && (
                            <div style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? '#10b981' : '#ef4444'}30` }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? '#10b981' : '#ef4444' }}>
                                    {parseFloat(weighValue) >= weighModal.can_tu && parseFloat(weighValue) <= weighModal.can_den ? '✓ ĐẠT — Trong phạm vi hạng cân' : `✗ KHÔNG ĐẠT — Lệch ${Math.abs(parseFloat(weighValue) > weighModal.can_den ? parseFloat(weighValue) - weighModal.can_den : weighModal.can_tu - parseFloat(weighValue)).toFixed(1)}kg`}
                                </span>
                            </div>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Modal>
        </div>
    );
};
