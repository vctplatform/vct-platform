'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter, VCT_SegmentedControl,
    VCT_Modal, VCT_Select, VCT_Input, VCT_Field, VCT_Card, VCT_Text
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { TRAN_DAUS, LUOT_THI_QUYENS, DON_VIS, genId } from '../data/mock-data';
import type { VongDau } from '../data/types';
import { repositories, useEntityCollection, type ResultRecord } from '../data/repository';
import { downloadTextFile, rowsToCsv } from '../data/export-utils';

interface KetQuaItem extends ResultRecord {}

const VONG_MAP: Record<VongDau, string> = { vong_loai: 'Vòng loại', tu_ket: 'Tứ kết', ban_ket: 'Bán kết', chung_ket: 'Chung kết' };

const buildResults = (): KetQuaItem[] => {
    const results: KetQuaItem[] = [];
    TRAN_DAUS.filter(t => t.trang_thai === 'ket_thuc').forEach(t => {
        const winner = t.diem_do > t.diem_xanh ? t.vdv_do : t.vdv_xanh;
        const loser = t.diem_do > t.diem_xanh ? t.vdv_xanh : t.vdv_do;
        results.push({
            id: `R-${t.id}`, loai: 'doi_khang', noi_dung: t.hang_can,
            vdv_ten: winner.ten, doan: winner.doan, ket_qua: t.ket_qua,
            diem: `${t.diem_xanh}:${t.diem_do}`,
            huy_chuong: t.vong === 'chung_ket' ? '🥇' : t.vong === 'ban_ket' ? '🥉' : '',
            vong: VONG_MAP[t.vong], doi_thu: loser.ten,
        });
    });
    const byND = new Map<string, typeof LUOT_THI_QUYENS>();
    LUOT_THI_QUYENS.filter(l => l.trang_thai === 'da_cham').forEach(l => {
        if (!byND.has(l.noi_dung)) byND.set(l.noi_dung, []);
        byND.get(l.noi_dung)!.push(l);
    });
    byND.forEach((entries, nd) => {
        const sorted = [...entries].sort((a, b) => b.diem_tb - a.diem_tb);
        sorted.forEach((e, i) => {
            results.push({
                id: `R-${e.id}`, loai: 'quyen', noi_dung: nd,
                vdv_ten: e.vdv_ten, doan: e.doan_ten,
                ket_qua: `Hạng ${i + 1}`, diem: e.diem_tb.toFixed(2),
                huy_chuong: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
            });
        });
    });
    return results;
};

export const Page_results = () => {
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [detailItem, setDetailItem] = useState<KetQuaItem | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({ noi_dung: '', vdv_ten: '', doan: '', ket_qua: '', diem: '', loai: 'doi_khang' as const });
    const { items: extraResults, setItems: setExtraResultsState } = useEntityCollection(repositories.results.mock);

    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500); }, []);

    const setExtraResults = useCallback((updater: React.SetStateAction<KetQuaItem[]>) => {
        setExtraResultsState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: KetQuaItem[]) => KetQuaItem[])(prev as KetQuaItem[])
                : updater;
            void repositories.results.mock.replaceAll(next);
            return next;
        });
    }, [setExtraResultsState]);

    const allResults = useMemo(() => [...buildResults(), ...extraResults], [extraResults]);
    const filtered = useMemo(() => {
        let d = typeFilter === 'all' ? allResults : allResults.filter(r => r.loai === typeFilter);
        if (search) d = d.filter(r => r.vdv_ten.toLowerCase().includes(search.toLowerCase()) || r.noi_dung.toLowerCase().includes(search.toLowerCase()) || r.doan.toLowerCase().includes(search.toLowerCase()));
        return d;
    }, [allResults, typeFilter, search]);

    // By đoàn stats
    const doanStats = useMemo(() => {
        const m: Record<string, { hcv: number; hcb: number; hcd: number; total: number }> = {};
        allResults.forEach(r => {
            if (!m[r.doan]) m[r.doan] = { hcv: 0, hcb: 0, hcd: 0, total: 0 };
            if (r.huy_chuong === '🥇') m[r.doan]!.hcv++;
            if (r.huy_chuong === '🥈') m[r.doan]!.hcb++;
            if (r.huy_chuong === '🥉') m[r.doan]!.hcd++;
            m[r.doan]!.total++;
        });
        return m;
    }, [allResults]);

    const handleAddManual = () => {
        if (!manualForm.vdv_ten || !manualForm.noi_dung) { showToast('Nhập tên VĐV và nội dung!', 'error'); return; }
        const item: KetQuaItem = {
            id: genId('MR'),
            loai: manualForm.loai,
            noi_dung: manualForm.noi_dung,
            vdv_ten: manualForm.vdv_ten,
            doan: manualForm.doan,
            ket_qua: manualForm.ket_qua || 'Thắng',
            diem: manualForm.diem || '—',
            huy_chuong: '',
        };
        setExtraResults(p => [...p, item]);
        setShowManualModal(false);
        setManualForm({ noi_dung: '', vdv_ten: '', doan: '', ket_qua: '', diem: '', loai: 'doi_khang' });
        showToast('Đã thêm kết quả thủ công');
    };

    const handleExport = () => {
        const rows = filtered.map((item) => ({
            loai: item.loai,
            noi_dung: item.noi_dung,
            vdv_ten: item.vdv_ten,
            doan: item.doan,
            ket_qua: item.ket_qua,
            diem: item.diem,
            huy_chuong: item.huy_chuong || '',
        }));
        const csv = rowsToCsv(rows);
        const stamp = new Date().toISOString().slice(0, 10);
        downloadTextFile(`ket-qua-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
        showToast(`Đã xuất ${rows.length} dòng kết quả`);
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="Tổng kết quả" value={allResults.length} icon={<VCT_Icons.Award size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Đối kháng" value={allResults.filter(r => r.loai === 'doi_khang').length} icon={<VCT_Icons.Swords size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Quyền" value={allResults.filter(r => r.loai === 'quyen').length} icon={<VCT_Icons.Award size={24} />} color="#22d3ee" />
                <VCT_KpiCard label="Huy chương" value={allResults.filter(r => r.huy_chuong).length} icon={<VCT_Icons.Star size={24} />} color="#fbbf24" />
            </div>

            <VCT_Stack direction="row" gap={16} align="center" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
                <VCT_SegmentedControl options={[{ value: 'all', label: 'Tất cả' }, { value: 'doi_khang', label: '🥊 Đối kháng' }, { value: 'quyen', label: '🥋 Quyền' }]} value={typeFilter} onChange={setTypeFilter} />
                <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm VĐV, nội dung, đoàn..." />
                <div style={{ flex: 1 }} />
                <VCT_Button variant="secondary" icon={<VCT_Icons.Plus size={16} />} onClick={() => setShowManualModal(true)}>Nhập kết quả</VCT_Button>
                <VCT_Button variant="secondary" icon={<VCT_Icons.Download size={16} />} onClick={handleExport}>Xuất CSV</VCT_Button>
            </VCT_Stack>

            {/* Summary by Đoàn */}
            {Object.keys(doanStats).length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                    {Object.entries(doanStats).sort(([, a], [, b]) => b.hcv - a.hcv).map(([doan, s]) => (
                        <div key={doan} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--vct-bg-glass)', border: '1px solid var(--vct-border-subtle)', flexShrink: 0, textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: 12 }}>{doan}</div>
                            <div style={{ fontSize: 11, marginTop: 2 }}>
                                {s.hcv > 0 && <span style={{ color: '#fbbf24' }}>🥇{s.hcv} </span>}
                                {s.hcb > 0 && <span style={{ color: '#94a3b8' }}>🥈{s.hcb} </span>}
                                {s.hcd > 0 && <span style={{ color: '#d97706' }}>🥉{s.hcd} </span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                        {['Loại', 'Nội dung', 'VĐV', 'Đoàn', 'Kết quả', 'Điểm', 'HC', ''].map((h, i) => (
                            <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {filtered.map((r, idx) => (
                            <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                style={{ borderBottom: '1px solid var(--vct-border-subtle)', borderLeft: `3px solid ${r.loai === 'quyen' ? '#22d3ee' : '#f59e0b'}`, background: idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', cursor: 'pointer' }}
                                onClick={() => setDetailItem(r)}
                            >
                                <td style={{ padding: '14px 16px' }}><VCT_Badge text={r.loai === 'quyen' ? '🥋 Quyền' : '🥊 ĐK'} type="info" /></td>
                                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13 }}>{r.noi_dung}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <VCT_Stack direction="row" gap={8} align="center">
                                        <VCT_AvatarLetter name={r.vdv_ten} size={26} />
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{r.vdv_ten}</span>
                                    </VCT_Stack>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: 13 }}>{r.doan}</td>
                                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>{r.ket_qua}</td>
                                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, fontFamily: 'monospace' }}>{r.diem}</td>
                                <td style={{ padding: '14px 16px', fontSize: 20 }}>{r.huy_chuong || '—'}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <VCT_Button variant="ghost" icon={<VCT_Icons.Eye size={14} />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDetailItem(r); }} />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && <VCT_EmptyState title="Không có kết quả" description="Thử thay đổi bộ lọc hoặc nhập kết quả thủ công." icon="🏆" />}

            {/* Detail Modal */}
            <VCT_Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="📋 Chi tiết Kết quả" width="500px">
                {detailItem && (
                    <VCT_Stack gap={16}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)' }}>
                            <VCT_AvatarLetter name={detailItem.vdv_ten} size={48} />
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 18 }}>{detailItem.huy_chuong} {detailItem.vdv_ten}</div>
                                <div style={{ fontSize: 13, opacity: 0.6 }}>{detailItem.doan}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            <div style={{ padding: 12, borderRadius: 10, background: 'var(--vct-bg-input)' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase' }}>Nội dung</div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{detailItem.noi_dung}</div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 10, background: 'var(--vct-bg-input)' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase' }}>Loại</div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{detailItem.loai === 'quyen' ? '🥋 Quyền' : '🥊 Đối kháng'}</div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 10, background: 'var(--vct-bg-input)' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase' }}>Kết quả</div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>{detailItem.ket_qua}</div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 10, background: 'var(--vct-bg-input)' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase' }}>Điểm</div>
                                <div style={{ fontWeight: 900, fontSize: 20, fontFamily: 'monospace', color: '#22d3ee' }}>{detailItem.diem}</div>
                            </div>
                        </div>
                        {detailItem.vong && <VCT_Badge text={`Vòng: ${detailItem.vong}`} type="info" />}
                        {detailItem.doi_thu && <div style={{ fontSize: 13, opacity: 0.6 }}>Đối thủ: {detailItem.doi_thu}</div>}
                    </VCT_Stack>
                )}
            </VCT_Modal>

            {/* Manual Entry Modal */}
            <VCT_Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="📝 Nhập kết quả thủ công" width="500px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowManualModal(false)}>Hủy</VCT_Button><VCT_Button onClick={handleAddManual}>Lưu kết quả</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Loại *">
                        <VCT_Select options={[{ value: 'doi_khang', label: '🥊 Đối kháng' }, { value: 'quyen', label: '🥋 Quyền' }]} value={manualForm.loai} onChange={(v: any) => setManualForm(p => ({ ...p, loai: v }))} />
                    </VCT_Field>
                    <VCT_Field label="Nội dung *">
                        <VCT_Input value={manualForm.noi_dung} onChange={(e: any) => setManualForm(p => ({ ...p, noi_dung: e.target.value }))} placeholder="VD: Nam 52-56kg 16-18" />
                    </VCT_Field>
                    <VCT_Field label="VĐV *">
                        <VCT_Input value={manualForm.vdv_ten} onChange={(e: any) => setManualForm(p => ({ ...p, vdv_ten: e.target.value }))} placeholder="Họ tên VĐV" />
                    </VCT_Field>
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Field label="Đoàn" style={{ flex: 1 }}>
                            <VCT_Input value={manualForm.doan} onChange={(e: any) => setManualForm(p => ({ ...p, doan: e.target.value }))} placeholder="Tên đoàn" />
                        </VCT_Field>
                        <VCT_Field label="Kết quả" style={{ flex: 1 }}>
                            <VCT_Input value={manualForm.ket_qua} onChange={(e: any) => setManualForm(p => ({ ...p, ket_qua: e.target.value }))} placeholder="VD: Hạng 1" />
                        </VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Điểm">
                        <VCT_Input value={manualForm.diem} onChange={(e: any) => setManualForm(p => ({ ...p, diem: e.target.value }))} placeholder="VD: 8.50" />
                    </VCT_Field>
                </VCT_Stack>
            </VCT_Modal>
        </div>
    );
};
