'use client';
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_StatusPipeline, VCT_FilterChips, VCT_BulkActionsBar,
    VCT_EmptyState, VCT_AvatarLetter, VCT_SegmentedControl
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { genId } from '../data/mock-data';
import { TRANG_THAI_TT_MAP, CAP_BAC_TT_MAP, type TrongTai, type TrangThaiTT, type CapBacTT, type ChuyenMonTT } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

const CM_MAP: Record<ChuyenMonTT, { label: string; color: string }> = {
    quyen: { label: 'Quyền', color: '#22d3ee' },
    doi_khang: { label: 'Đối kháng', color: '#f59e0b' },
    ca_hai: { label: 'Cả hai', color: '#a78bfa' },
};

const PIPELINE = [
    { key: 'xac_nhan', label: 'Xác nhận', color: '#10b981' },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: '#f59e0b' },
    { key: 'tu_choi', label: 'Từ chối', color: '#ef4444' },
];

const BLANK: Partial<TrongTai> = { ho_ten: '', gioi: 'nam', ngay_sinh: '', cap_bac: 'cap_2', chuyen_mon: 'doi_khang', don_vi: '', sdt: '', email: '', kinh_nghiem: '', ghi_chu: '' };

export const Page_referees = () => {
    const {
        items: refs,
        setItems: setRefsState,
        uiState,
    } = useEntityCollection(repositories.referees.mock);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [cmFilter, setCmFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { toast, showToast, hideToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TrongTai | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TrongTai | null>(null);
    const [form, setForm] = useState<any>({ ...BLANK });

    const setRefs = useCallback((updater: React.SetStateAction<TrongTai[]>) => {
        setRefsState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: TrongTai[]) => TrongTai[])(prev)
                : updater;
            void repositories.referees.mock.replaceAll(next);
            return next;
        });
    }, [setRefsState]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); openAdd(); }
            if (e.key === 'Escape') { setShowModal(false); setDeleteTarget(null); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    const filtered = useMemo(() => {
        let d = refs;
        if (statusFilter) d = d.filter(r => r.trang_thai === statusFilter);
        if (cmFilter !== 'all') d = d.filter(r => r.chuyen_mon === cmFilter);
        if (search) { const q = search.toLowerCase(); d = d.filter(r => r.ho_ten.toLowerCase().includes(q) || r.don_vi.toLowerCase().includes(q)); }
        return d;
    }, [refs, statusFilter, cmFilter, search]);

    const pStages = useMemo(() => PIPELINE.map(s => ({ ...s, count: refs.filter(r => r.trang_thai === s.key).length })), [refs]);

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = [];
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: TRANG_THAI_TT_MAP[statusFilter as TrangThaiTT]?.label || '' });
        if (cmFilter !== 'all') f.push({ key: 'cm', label: 'Chuyên môn', value: CM_MAP[cmFilter as ChuyenMonTT]?.label || '' });
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search });
        return f;
    }, [statusFilter, cmFilter, search]);

    const removeFilter = (k: string) => { if (k === 'status') setStatusFilter(null); if (k === 'cm') setCmFilter('all'); if (k === 'search') setSearch(''); };

    const openAdd = () => { setEditing(null); setForm({ ...BLANK }); setShowModal(true); };
    const openEdit = (r: TrongTai) => { setEditing(r); setForm({ ...r }); setShowModal(true); };

    const handleSave = () => {
        if (!form.ho_ten) { showToast('Vui lòng nhập họ tên', 'error'); return; }
        if (editing) {
            setRefs(p => p.map(r => r.id === editing.id ? { ...r, ...form } : r));
            showToast(`Đã cập nhật "${form.ho_ten}"`);
        } else {
            setRefs(p => [{ ...form, id: genId('TT'), trang_thai: 'cho_duyet' as TrangThaiTT }, ...p]);
            showToast(`Đã thêm trọng tài "${form.ho_ten}"`);
        }
        setShowModal(false);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setRefs(p => p.filter(r => r.id !== deleteTarget.id));
        showToast(`Đã xóa "${deleteTarget.ho_ten}"`);
        setDeleteTarget(null);
    };

    const bulkApprove = () => {
        setRefs(p => p.map(r => selectedIds.has(r.id) ? { ...r, trang_thai: 'xac_nhan' as TrangThaiTT } : r));
        showToast(`Đã duyệt ${selectedIds.size} trọng tài`);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />
            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải danh sách trọng tài: {uiState.error}
                </div>
            )}
            {uiState.loading && refs.length === 0 && (
                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--vct-border-subtle)', background: 'var(--vct-bg-elevated)', color: 'var(--vct-text-tertiary)', fontSize: 13, fontWeight: 700 }}>
                    Đang tải dữ liệu trọng tài...
                </div>
            )}

            <VCT_StatRow items={[
                { label: 'Tổng TT', value: refs.length, icon: <VCT_Icons.Shield size={18} />, color: '#0ea5e9' },
                { label: 'Xác nhận', value: refs.filter(r => r.trang_thai === 'xac_nhan').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Quốc gia', value: refs.filter(r => r.cap_bac === 'quoc_gia').length, icon: <VCT_Icons.Star size={18} />, color: '#a78bfa', sub: 'Cấp bậc cao nhất' },
                { label: 'Đối kháng', value: refs.filter(r => r.chuyen_mon === 'doi_khang' || r.chuyen_mon === 'ca_hai').length, icon: <VCT_Icons.Swords size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* Pipeline */}
            <VCT_StatusPipeline stages={pStages} activeStage={statusFilter} onStageClick={setStatusFilter} />
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setCmFilter('all'); setSearch(''); }} />

            {/* Toolbar */}
            <VCT_Stack direction="row" gap={16} align="center" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px', minWidth: 200 }}><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm trọng tài, đơn vị..." /></div>
                <VCT_SegmentedControl options={[{ value: 'all', label: 'Tất cả' }, { value: 'quyen', label: '🥋 Quyền' }, { value: 'doi_khang', label: '🥊 ĐK' }, { value: 'ca_hai', label: '⚔️ Cả hai' }]} value={cmFilter} onChange={setCmFilter} />
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAdd}>Thêm trọng tài</VCT_Button>
            </VCT_Stack>

            {/* Table */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy trọng tài" description="Thử thay đổi bộ lọc." actionLabel="Thêm trọng tài" onAction={openAdd} icon="⚖️" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                <th style={{ padding: '12px 16px', width: 40 }}><input type="checkbox" onChange={() => setSelectedIds(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} checked={selectedIds.size === filtered.length && filtered.length > 0} style={{ accentColor: '#22d3ee' }} /></th>
                                {['Trọng tài', 'Đơn vị', 'Cấp bậc', 'Chuyên môn', 'Kinh nghiệm', 'Trạng thái', ''].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-[11px] font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, idx) => {
                                const cb = CAP_BAC_TT_MAP[r.cap_bac];
                                const cm = CM_MAP[r.chuyen_mon];
                                const st = TRANG_THAI_TT_MAP[r.trang_thai];
                                return (
                                    <React.Fragment key={r.id}>
                                        <tr onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} style={{ borderBottom: '1px solid var(--vct-border-subtle)', cursor: 'pointer', background: selectedIds.has(r.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${st.color}`, transition: 'background 0.15s' }}>
                                            <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} style={{ accentColor: '#22d3ee' }} /></td>
                                            <td className="px-4 py-3">
                                                <VCT_Stack direction="row" gap={10} align="center">
                                                    <VCT_AvatarLetter name={r.ho_ten} size={32} />
                                                    <div><div style={{ fontWeight: 700, fontSize: 13 }}>{r.ho_ten}</div><div className="text-[11px] opacity-50">{r.gioi === 'nam' ? '♂ Nam' : '♀ Nữ'}</div></div>
                                                </VCT_Stack>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.don_vi}</td>
                                            <td className="px-4 py-3"><span style={{ padding: '3px 10px', borderRadius: 8, background: `${cb.color}15`, color: cb.color, fontSize: 12, fontWeight: 700 }}>{cb.label}</span></td>
                                            <td className="px-4 py-3"><span style={{ padding: '3px 10px', borderRadius: 8, background: `${cm.color}15`, color: cm.color, fontSize: 12, fontWeight: 700 }}>{cm.label}</span></td>
                                            <td style={{ padding: '12px 16px', fontSize: 12, opacity: 0.7, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.kinh_nghiem || '—'}</td>
                                            <td className="px-4 py-3"><VCT_Badge text={st.label} type={st.type} /></td>
                                            <td className="px-4 py-3">
                                                <VCT_Stack direction="row" gap={4}>
                                                    <button onClick={(e: any) => { e.stopPropagation(); openEdit(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: 4 }}><VCT_Icons.Edit size={14} /></button>
                                                    <button onClick={(e: any) => { e.stopPropagation(); setDeleteTarget(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><VCT_Icons.Trash size={14} /></button>
                                                </VCT_Stack>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {expandedId === r.id && (
                                                <tr><td colSpan={8} style={{ padding: 0 }}>
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                        <div style={{ padding: '20px 24px', background: 'var(--vct-bg-base)', borderTop: '1px dashed var(--vct-border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                                                            <div><span className="text-[11px] opacity-50">SĐT</span><div style={{ fontWeight: 700, fontSize: 13 }}>{r.sdt}</div></div>
                                                            <div><span className="text-[11px] opacity-50">Email</span><div style={{ fontWeight: 700, fontSize: 13 }}>{r.email}</div></div>
                                                            <div><span className="text-[11px] opacity-50">Ngày sinh</span><div style={{ fontWeight: 700, fontSize: 13 }}>{r.ngay_sinh}</div></div>
                                                            <div><span className="text-[11px] opacity-50">Kinh nghiệm</span><div style={{ fontWeight: 700, fontSize: 13 }}>{r.kinh_nghiem || '—'}</div></div>
                                                            {r.ghi_chu && <div style={{ gridColumn: '1 / -1' }}><span className="text-[11px] opacity-50">Ghi chú</span><div style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b' }}>{r.ghi_chu}</div></div>}
                                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
                                                                {PIPELINE.filter(s => s.key !== r.trang_thai).map(s => (
                                                                    <button key={s.key} onClick={() => { setRefs(p => p.map(x => x.id === r.id ? { ...x, trang_thai: s.key as TrangThaiTT } : x)); showToast(`→ ${s.label}`); }}
                                                                        style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${s.color}40`, background: `${s.color}10`, color: s.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>→ {s.label}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td></tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ padding: '10px 16px', borderTop: '2px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', display: 'flex', gap: 24, fontSize: 12, fontWeight: 700, opacity: 0.6 }}>
                        <span>Hiện {filtered.length}/{refs.length}</span>
                        <span>♂ {filtered.filter(r => r.gioi === 'nam').length} — ♀ {filtered.filter(r => r.gioi === 'nu').length}</span>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            <AnimatePresence>
                <VCT_BulkActionsBar count={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} actions={[
                    { label: 'Duyệt', icon: <VCT_Icons.Check size={14} />, onClick: bulkApprove, variant: 'primary' },
                ]} />
            </AnimatePresence>

            {/* Add/Edit Modal */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Chỉnh sửa trọng tài' : 'Thêm trọng tài'} width="640px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button><VCT_Button onClick={handleSave}>{editing ? 'Cập nhật' : 'Thêm mới'}</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Họ tên *" style={{ flex: 2 }}><VCT_Input value={form.ho_ten} onChange={(e: any) => setForm({ ...form, ho_ten: e.target.value })} placeholder="Nguyễn Văn A" /></VCT_Field>
                        <VCT_Field label="Giới tính" className="flex-1"><VCT_Select options={[{ value: 'nam', label: 'Nam' }, { value: 'nu', label: 'Nữ' }]} value={form.gioi} onChange={(v: any) => setForm({ ...form, gioi: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Ngày sinh" className="flex-1"><VCT_Input type="date" value={form.ngay_sinh} onChange={(e: any) => setForm({ ...form, ngay_sinh: e.target.value })} /></VCT_Field>
                        <VCT_Field label="Đơn vị" className="flex-1"><VCT_Input value={form.don_vi} onChange={(e: any) => setForm({ ...form, don_vi: e.target.value })} placeholder="TP.HCM" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Cấp bậc" className="flex-1"><VCT_Select options={[{ value: 'quoc_gia', label: 'Quốc gia' }, { value: 'cap_1', label: 'Cấp 1' }, { value: 'cap_2', label: 'Cấp 2' }, { value: 'cap_3', label: 'Cấp 3' }]} value={form.cap_bac} onChange={(v: any) => setForm({ ...form, cap_bac: v })} /></VCT_Field>
                        <VCT_Field label="Chuyên môn" className="flex-1"><VCT_Select options={[{ value: 'quyen', label: 'Quyền' }, { value: 'doi_khang', label: 'Đối kháng' }, { value: 'ca_hai', label: 'Cả hai' }]} value={form.chuyen_mon} onChange={(v: any) => setForm({ ...form, chuyen_mon: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="SĐT" className="flex-1"><VCT_Input value={form.sdt} onChange={(e: any) => setForm({ ...form, sdt: e.target.value })} placeholder="0901..." /></VCT_Field>
                        <VCT_Field label="Email" className="flex-1"><VCT_Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="email@..." /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Kinh nghiệm"><VCT_Input value={form.kinh_nghiem} onChange={(e: any) => setForm({ ...form, kinh_nghiem: e.target.value })} placeholder="15 năm, 20 giải QG" /></VCT_Field>
                    <VCT_Field label="Ghi chú"><VCT_Input value={form.ghi_chu} onChange={(e: any) => setForm({ ...form, ghi_chu: e.target.value })} /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* Delete Confirm */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xóa trọng tài" message={`Bạn có chắc muốn xóa trọng tài "${deleteTarget?.ho_ten}"?`}
                preview={deleteTarget && <VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={deleteTarget.ho_ten} size={28} /><span>{deleteTarget.ho_ten} — {CAP_BAC_TT_MAP[deleteTarget.cap_bac].label}</span></VCT_Stack>}
                confirmLabel="Xóa" />
        </VCT_PageContainer>
    );
};
