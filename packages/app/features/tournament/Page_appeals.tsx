'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_StatusPipeline, VCT_EmptyState, VCT_AvatarLetter
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { genId } from '../hooks/useTournamentAPI';
import { TRANG_THAI_KN_MAP, type KhieuNai, type TrangThaiKN, type LoaiKN } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

const LOAI_MAP: Record<LoaiKN, { label: string; color: string }> = {
    khieu_nai: { label: 'Khiếu nại', color: '#f59e0b' },
    khang_nghi: { label: 'Kháng nghị', color: '#ef4444' },
};

const PIPELINE = [
    { key: 'moi', label: 'Mới', color: '#ef4444' },
    { key: 'dang_xu_ly', label: 'Đang xử lý', color: '#f59e0b' },
    { key: 'chap_nhan', label: 'Chấp nhận', color: '#10b981' },
    { key: 'bac_bo', label: 'Bác bỏ', color: '#94a3b8' },
];

const BLANK: Partial<KhieuNai> = { doan_ten: '', loai: 'khieu_nai', noi_dung_lien_quan: '', tran_dau_id: '', ly_do: '', bang_chung: '' };

export const Page_appeals = () => {
    const {
        items,
        setItems: setItemsState,
        uiState,
    } = useEntityCollection(repositories.appeals.mock);
    const [filter, setFilter] = useState<string | null>(null);
    const { toast, showToast, hideToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<any>({ ...BLANK });
    const [resolveModal, setResolveModal] = useState<KhieuNai | null>(null);
    const [resolution, setResolution] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const setItems = useCallback((updater: React.SetStateAction<KhieuNai[]>) => {
        setItemsState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: KhieuNai[]) => KhieuNai[])(prev)
                : updater;
            void repositories.appeals.mock.replaceAll(next);
            return next;
        });
    }, [setItemsState]);

    const filtered = useMemo(() => filter ? items.filter(i => i.trang_thai === filter) : items, [items, filter]);
    const pStages = useMemo(() => PIPELINE.map(s => ({ ...s, count: items.filter(i => i.trang_thai === s.key).length })), [items]);

    const handleAdd = () => {
        if (!form.ly_do || !form.doan_ten) { showToast('Vui lòng nhập đầy đủ', 'error'); return; }
        setItems(p => [{ ...form, id: genId('KN'), trang_thai: 'moi' as TrangThaiKN, ket_luan: '', nguoi_xu_ly: '', thoi_gian_nop: new Date().toLocaleString('vi-VN'), thoi_gian_xu_ly: '', doan_id: '' } as KhieuNai, ...p]);
        showToast('Đã tiếp nhận khiếu nại'); setShowModal(false); setForm({ ...BLANK });
    };

    const handleResolve = (status: TrangThaiKN) => {
        if (!resolveModal) return;
        setItems(p => p.map(i => i.id === resolveModal.id ? { ...i, trang_thai: status, ket_luan: resolution, nguoi_xu_ly: 'Admin', thoi_gian_xu_ly: new Date().toLocaleString('vi-VN') } : i));
        showToast(`${status === 'chap_nhan' ? 'Chấp nhận' : status === 'bac_bo' ? 'Bác bỏ' : 'Đang xử lý'} khiếu nại`);
        setResolveModal(null); setResolution('');
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />
            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải khiếu nại: {uiState.error}
                </div>
            )}
            {uiState.loading && items.length === 0 && (
                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--vct-border-subtle)', background: 'var(--vct-bg-elevated)', color: 'var(--vct-text-tertiary)', fontSize: 13, fontWeight: 700 }}>
                    Đang tải danh sách khiếu nại...
                </div>
            )}

            <VCT_StatRow items={[
                { label: 'Tổng', value: items.length, icon: <VCT_Icons.Alert size={18} />, color: '#0ea5e9' },
                { label: 'Mới', value: items.filter(i => i.trang_thai === 'moi').length, icon: <VCT_Icons.Alert size={18} />, color: '#ef4444', sub: 'Cần xử lý ngay' },
                { label: 'Đang xử lý', value: items.filter(i => i.trang_thai === 'dang_xu_ly').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Giải quyết', value: items.filter(i => i.trang_thai === 'chap_nhan' || i.trang_thai === 'bac_bo').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            <VCT_StatusPipeline stages={pStages} activeStage={filter} onStageClick={setFilter} />

            <VCT_Stack direction="row" gap={16} align="center" className="mb-5">
                <div className="flex-1" />
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => setShowModal(true)}>Tiếp nhận KN</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có khiếu nại" description="Chưa có khiếu nại/kháng nghị nào." icon="⚖️" />
            ) : (
                <VCT_Stack gap={12}>
                    {filtered.map(item => {
                        const st = TRANG_THAI_KN_MAP[item.trang_thai];
                        const lt = LOAI_MAP[item.loai];
                        return (
                            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)', borderLeft: `4px solid ${st.color}` }}>
                                    <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <VCT_AvatarLetter name={item.doan_ten} size={32} />
                                        <div className="flex-1">
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.doan_ten}</div>
                                            <div className="text-xs opacity-60">{item.noi_dung_lien_quan}</div>
                                        </div>
                                        <VCT_Badge text={lt.label} type="info" />
                                        <VCT_Badge text={st.label} type={st.type} pulse={item.trang_thai === 'moi'} />
                                        <span style={{ fontSize: 11, opacity: 0.4, fontFamily: 'monospace' }}>{item.thoi_gian_nop}</span>
                                    </div>
                                    <AnimatePresence>
                                        {expandedId === item.id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                <div style={{ padding: '16px 20px', borderTop: '1px dashed var(--vct-border-subtle)', background: 'var(--vct-bg-base)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                                        <div><span className="text-[11px] opacity-50">Lý do</span><div style={{ fontSize: 13, fontWeight: 600 }}>{item.ly_do}</div></div>
                                                        <div><span className="text-[11px] opacity-50">Bằng chứng</span><div style={{ fontSize: 13, fontWeight: 600 }}>{item.bang_chung || '—'}</div></div>
                                                        {item.ket_luan && <div><span className="text-[11px] opacity-50">Kết luận</span><div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{item.ket_luan}</div></div>}
                                                        {item.nguoi_xu_ly && <div><span className="text-[11px] opacity-50">Người xử lý</span><div style={{ fontSize: 13, fontWeight: 600 }}>{item.nguoi_xu_ly} — {item.thoi_gian_xu_ly}</div></div>}
                                                    </div>
                                                    {(item.trang_thai === 'moi' || item.trang_thai === 'dang_xu_ly') && (
                                                        <VCT_Stack direction="row" gap={8}>
                                                            <VCT_Button variant="secondary" onClick={() => { setResolveModal(item); }} style={{ fontSize: 12 }}>📝 Xử lý</VCT_Button>
                                                        </VCT_Stack>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </VCT_Stack>
            )}

            {/* Add Modal */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tiếp nhận Khiếu nại / Kháng nghị" width="600px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button><VCT_Button onClick={handleAdd}>Tiếp nhận</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Đoàn khiếu nại *" className="flex-1"><VCT_Input value={form.doan_ten} onChange={(e: any) => setForm({ ...form, doan_ten: e.target.value })} placeholder="CLB Bình Định" /></VCT_Field>
                        <VCT_Field label="Loại" className="flex-1"><VCT_Select options={[{ value: 'khieu_nai', label: 'Khiếu nại' }, { value: 'khang_nghi', label: 'Kháng nghị' }]} value={form.loai} onChange={(v: any) => setForm({ ...form, loai: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Nội dung liên quan"><VCT_Input value={form.noi_dung_lien_quan} onChange={(e: any) => setForm({ ...form, noi_dung_lien_quan: e.target.value })} placeholder="ĐK Nam 48-52kg" /></VCT_Field>
                    <VCT_Field label="Lý do *"><VCT_Input value={form.ly_do} onChange={(e: any) => setForm({ ...form, ly_do: e.target.value })} placeholder="Mô tả chi tiết lý do..." /></VCT_Field>
                    <VCT_Field label="Bằng chứng"><VCT_Input value={form.bang_chung} onChange={(e: any) => setForm({ ...form, bang_chung: e.target.value })} placeholder="Video, biên bản..." /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* Resolve Modal */}
            <VCT_Modal isOpen={!!resolveModal} onClose={() => setResolveModal(null)} title="Xử lý Khiếu nại" width="500px" footer={
                <VCT_Stack direction="row" gap={8} style={{ width: '100%' }} justify="flex-end">
                    <VCT_Button variant="secondary" onClick={() => handleResolve('dang_xu_ly')}>⏳ Đang xử lý</VCT_Button>
                    <VCT_Button variant="secondary" onClick={() => handleResolve('bac_bo')} style={{ color: '#ef4444' }}>✗ Bác bỏ</VCT_Button>
                    <VCT_Button onClick={() => handleResolve('chap_nhan')}>✓ Chấp nhận</VCT_Button>
                </VCT_Stack>
            }>
                {resolveModal && (
                    <VCT_Stack gap={16}>
                        <div style={{ padding: 12, borderRadius: 12, background: 'var(--vct-bg-input)', fontSize: 13 }}>
                            <strong>{resolveModal.doan_ten}</strong> — {resolveModal.ly_do}
                        </div>
                        <VCT_Field label="Kết luận / Quyết định">
                            <VCT_Input value={resolution} onChange={(e: any) => setResolution(e.target.value)} placeholder="Nhập kết luận..." />
                        </VCT_Field>
                    </VCT_Stack>
                )}
            </VCT_Modal>
        </VCT_PageContainer>
    );
};
