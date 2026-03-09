'use client';
import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_KpiCard,
    VCT_Toast, VCT_Modal, VCT_SearchInput, VCT_Table, VCT_AvatarLetter,
    VCT_ConfirmDialog, VCT_EmptyState
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { NOI_DUNG_QUYENS, HANG_CANS, genId } from '../data/mock-data';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import type { DangKy, TrangThaiDK, VanDongVien, HangCan, DonVi } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

const RST_MAP: Record<TrangThaiDK, { l: string; t: string }> = {
    da_duyet: { l: 'Đã duyệt', t: 'success' },
    cho_duyet: { l: 'Chờ duyệt', t: 'warning' },
    tu_choi: { l: 'Từ chối', t: 'danger' }
};

// Help Functions
const vLT = (yob: string) => {
    const t = new Date().getFullYear() - parseInt(yob.substring(0, 4));
    if (t >= 16 && t <= 18) return '16-18';
    if (t >= 19 && t <= 35) return '19-35';
    return 'other';
};
const fmtDK = (d: HangCan) => d.can_den === 0 ? `Trên ${d.can_tu}kg` : `${d.can_tu}-${d.can_den}kg`;
const bestDK = (dkList: HangCan[], can: number) => {
    let best: string | null = null, bestDist = 999;
    dkList.forEach(d => {
        if (can >= d.can_tu && (d.can_den === 0 || can < d.can_den)) {
            const dist = can - d.can_tu;
            if (dist < bestDist) { bestDist = dist; best = d.id; }
        }
    });
    return best;
};

// ════════════════════════════════════════
// MODAL ĐĂNG KÝ (Nội dung Đa Cột)
// ════════════════════════════════════════
const RegistrationModal = ({
    isOpen,
    onClose,
    vdvId,
    existingRegs,
    onSave,
    isEdit,
    athletes,
    canSave,
    onDenied,
}: {
    isOpen: boolean,
    onClose: () => void,
    vdvId: string,
    existingRegs: DangKy[],
    onSave: (vId: string, regs: any[]) => void,
    isEdit: boolean,
    athletes: VanDongVien[],
    canSave: boolean,
    onDenied?: () => void,
}) => {
    const [checkedQ, setCheckedQ] = useState<Record<string, boolean>>({});
    const [checkedDK, setCheckedDK] = useState<string>('');

    useEffect(() => {
        if (!isOpen || !vdvId) return;
        const qMap: any = {};
        let dk = '';
        existingRegs.forEach((r) => {
            if (r.vdv_id !== vdvId) return;
            if (r.loai === 'quyen') qMap[r.nd_id] = true;
            if (r.loai === 'doi_khang') dk = r.nd_id;
        });
        setCheckedQ(qMap);
        setCheckedDK(dk);
    }, [isOpen, vdvId, existingRegs]);

    const vdv = athletes.find(v => v.id === vdvId);
    if (!vdv) return null;

    const tuoi = new Date().getFullYear() - parseInt(vdv.ngay_sinh.substring(0, 4));
    const lt = vLT(vdv.ngay_sinh);

    // Filter available events for this athlete
    const availQ = NOI_DUNG_QUYENS.filter(q => (q.gioi === vdv.gioi || q.gioi === 'nam_nu') && q.lua_tuoi === lt);
    const availDK = HANG_CANS.filter(d => d.gioi === vdv.gioi && d.lua_tuoi === lt);
    const bestId = bestDK(availDK, vdv.can_nang);

    const newQCount = Object.keys(checkedQ).filter(k => checkedQ[k]).length;
    const newTotal = newQCount + (checkedDK ? 1 : 0);
    const maxNd = TOURNAMENT_CONFIG.quota.max_nd_per_vdv;
    const overQuota = newTotal > maxNd;

    const handleSave = () => {
        if (!canSave) {
            onDenied?.();
            return;
        }
        if (newTotal === 0) return;
        if (overQuota) return;
        const newRegs: any[] = [];
        Object.keys(checkedQ).forEach(qId => {
            if (!checkedQ[qId]) return;
            const q = NOI_DUNG_QUYENS.find(x => x.id === qId);
            if (q) newRegs.push({ loai: 'quyen', nd_id: qId });
        });
        if (checkedDK) {
            newRegs.push({ loai: 'doi_khang', nd_id: checkedDK });
        }
        onSave(vdvId, newRegs);
    };

    return (
        <VCT_Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Sửa thẻ thi đấu' : 'Đăng ký thi đấu mới'} width="850px" footer={
            <VCT_Stack direction="row" justify="space-between" align="center" style={{ width: '100%' }}>
                <VCT_Text variant="small" style={{ opacity: 0.5, fontWeight: 600 }}>Cập nhật Đăng ký • Giới hạn: {newTotal}/{maxNd} nội dung</VCT_Text>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="secondary" onClick={onClose}>Đóng</VCT_Button>
                    <VCT_Button disabled={newTotal === 0 || overQuota || !canSave} onClick={handleSave}>Lưu Hồ Sơ Đăng Ký</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>
        }>
            <VCT_Stack gap={24}>
                {/* Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: 'var(--vct-bg-input)', borderRadius: '16px' }}>
                    <VCT_AvatarLetter name={vdv.ho_ten} size={56} color={vdv.gioi === 'nam' ? '#60a5fa' : '#f472b6'} />
                    <div>
                        <VCT_Text variant="h2" style={{ fontSize: 18 }}>{vdv.ho_ten}</VCT_Text>
                        <VCT_Text variant="small" style={{ opacity: 0.7, fontWeight: 500, marginTop: 4 }}>{vdv.gioi === 'nam' ? '♂ Nam' : '♀ Nữ'} • {tuoi} tuổi ({lt}) • {vdv.can_nang}kg • Mã VĐV: {vdv.id}</VCT_Text>
                    </div>
                </div>

                {/* Quota Warning */}
                <AnimatePresence>
                    {overQuota && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>
                                ⚠️ Vượt quá giới hạn {maxNd} nội dung/VĐV (Cấu hình Đoàn). Vui lòng bỏ bớt để được duyệt.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
                    {/* CỘT QUYỀN */}
                    <div style={{ border: '1px solid rgba(34, 211, 238, 0.2)', background: 'rgba(34, 211, 238, 0.02)', borderRadius: '16px', padding: '16px' }}>
                        <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                            <VCT_Text style={{ fontWeight: 800, color: '#22d3ee' }}>🥋 NỘI DUNG QUYỀN</VCT_Text>
                            <div style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', fontWeight: 800 }}>{newQCount} ĐÃ CHỌN</div>
                        </VCT_Stack>

                        <VCT_Stack gap={10}>
                            {availQ.length === 0 && <VCT_Text variant="small" style={{ opacity: 0.5, textAlign: 'center', padding: '16px' }}>Không có nội dung Quyền phù hợp cho Lứa tuổi ({lt}) + Giới tính này.</VCT_Text>}
                            {availQ.map(q => {
                                const isChecked = !!checkedQ[q.id];
                                return (
                                    <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '12px', border: `1.5px solid ${isChecked ? '#22d3ee' : 'var(--vct-border-subtle)'}`, background: isChecked ? 'rgba(34, 211, 238, 0.08)' : 'var(--vct-bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <input type="checkbox" checked={isChecked} onChange={() => setCheckedQ(p => ({ ...p, [q.id]: !p[q.id] }))} style={{ width: 18, height: 18, accentColor: '#22d3ee' }} />
                                        <div className="flex-1">
                                            <VCT_Text style={{ fontSize: '13px', fontWeight: isChecked ? 700 : 500 }}>{q.ten}</VCT_Text>
                                        </div>
                                    </label>
                                )
                            })}
                        </VCT_Stack>
                    </div>

                    {/* CỘT ĐỐI KHÁNG */}
                    <div style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.02)', borderRadius: '16px', padding: '16px' }}>
                        <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                            <VCT_Text style={{ fontWeight: 800, color: '#f59e0b' }}>🥊 HẠNG CÂN ĐỐI KHÁNG</VCT_Text>
                            {checkedDK && <div onClick={() => setCheckedDK('')} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 800, cursor: 'pointer' }}>✕ BỎ CHỌN</div>}
                        </VCT_Stack>

                        <VCT_Stack gap={10}>
                            {availDK.length === 0 && <VCT_Text variant="small" style={{ opacity: 0.5, textAlign: 'center', padding: '16px' }}>Không có hạng cân Đối kháng phù hợp.</VCT_Text>}
                            {availDK.map(d => {
                                const isChecked = checkedDK === d.id;
                                const isBestMatch = d.id === bestId;
                                return (
                                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '12px', border: `1.5px solid ${isChecked ? '#f59e0b' : isBestMatch ? 'rgba(245, 158, 11, 0.4)' : 'var(--vct-border-subtle)'}`, background: isChecked ? 'rgba(245, 158, 11, 0.12)' : isBestMatch ? 'rgba(245, 158, 11, 0.04)' : 'var(--vct-bg-card)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                                        <input type="radio" name="dk_sel" checked={isChecked} onChange={() => setCheckedDK(d.id)} style={{ width: 18, height: 18, accentColor: '#f59e0b' }} />
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <VCT_Text style={{ fontSize: '13px', fontWeight: isChecked ? 700 : 500 }}>{fmtDK(d)}</VCT_Text>
                                            {isBestMatch && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: '#f59e0b', color: '#000', fontWeight: 900 }}>GỢI Ý ({distToBest(vdv.can_nang, d)}kg)</span>}
                                        </div>
                                    </label>
                                )
                            })}
                        </VCT_Stack>
                    </div>
                </div>
            </VCT_Stack>
        </VCT_Modal>
    );
};
// Helper for suggest distance
const distToBest = (can: number, d: HangCan) => can >= d.can_tu && (d.can_den === 0 || can < d.can_den) ? can - d.can_tu : 'N/A';


// ════════════════════════════════════════
// COMPONENT CHÍNH: PAGE REGISTRATION
// ════════════════════════════════════════
export const Page_registration = () => {
    const { items: data, setItems: setDataState } = useEntityCollection(repositories.registration.mock);
    const athleteStore = useEntityCollection(repositories.athletes.mock);
    const teamStore = useEntityCollection(repositories.teams.mock);
    const athletes = athleteStore.items;
    const teams = teamStore.items;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(''); // '' | 'quyen' | 'doi_khang' | 'cho_duyet' | 'da_duyet'
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const [modalMode, setModalMode] = useState<'picker' | 'reg' | null>(null);
    const [selectedVdv, setSelectedVdv] = useState('');

    const setData = useCallback((updater: React.SetStateAction<DangKy[]>) => {
        setDataState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: DangKy[]) => DangKy[])(prev)
                : updater;
            void repositories.registration.mock.replaceAll(next);
            return next;
        });
    }, [setDataState]);

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);
    const { can, requireAction } = useRouteActionGuard('/registration', {
        notifyDenied: (message) => showToast(message, 'error')
    });
    const permissions = useMemo(() => ({
        canCreate: can('create'),
        canUpdate: can('update'),
        canApprove: can('approve'),
    }), [can]);
    const canManageCard = permissions.canCreate || permissions.canUpdate;

    // Enrich Data with Names
    const enrichedData = useMemo(() => {
        return data.map(r => {
            const vdv = athletes.find(v => v.id === r.vdv_id) || { ho_ten: 'Không rõ', doan_id: '' };
            const doan = teams.find(d => d.id === r.doan_id) || { ten: 'Không rõ' };
            const ndTen = r.loai === 'quyen'
                ? (NOI_DUNG_QUYENS.find(q => q.id === r.nd_id)?.ten || r.nd_id)
                : (HANG_CANS.find(h => h.id === r.nd_id) ? `ĐK ${fmtDK(HANG_CANS.find(h => h.id === r.nd_id)!)}` : r.nd_id);

            return {
                ...r,
                vdv_ten: vdv.ho_ten,
                doan_ten: doan.ten,
                nd_ten: ndTen
            };
        }).filter(r => {
            const mS = !search || r.vdv_ten.toLowerCase().includes(search.toLowerCase()) || r.nd_ten.toLowerCase().includes(search.toLowerCase());
            const mF = !filter || (filter === 'quyen' || filter === 'doi_khang' ? r.loai === filter : r.trang_thai === filter);
            return mS && mF;
        }).sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime());
    }, [data, athletes, teams, search, filter]);

    // Bulk / Quick Actions
    const approveAll = () => {
        if (!requireAction('approve', 'duyệt đăng ký')) return;
        const toDuyet = data.filter(r => r.trang_thai === 'cho_duyet').length;
        if (toDuyet === 0) return showToast('Không có đơn nào chờ duyệt', 'info');
        setData(prev => prev.map(r => r.trang_thai === 'cho_duyet' ? { ...r, trang_thai: 'da_duyet' } : r));
        showToast(`Đã duyệt thành công ${toDuyet} đăng ký!`, 'success');
    };

    const handleSaveRegs = (vdvId: string, newRegs: any[]) => {
        if (!canManageCard || !requireAction('update', 'cập nhật thẻ đăng ký')) return;
        const vdv = athletes.find(v => v.id === vdvId);
        if (!vdv) return;

        setData(prev => {
            const kept = prev.filter(r => r.vdv_id !== vdvId);
            const added = newRegs.map((nr, i) => {
                const old = prev.find(r => r.vdv_id === vdvId && r.nd_id === nr.nd_id);
                return {
                    id: old ? old.id : genId('DK'),
                    vdv_id: vdvId,
                    vdv_ten: vdv.ho_ten,
                    doan_id: vdv.doan_id,
                    doan_ten: teams.find(d => d.id === vdv.doan_id)?.ten || '',
                    loai: nr.loai,
                    nd_id: nr.nd_id,
                    nd_ten: '',
                    trang_thai: old ? old.trang_thai : 'cho_duyet',
                    ngay: old ? old.ngay : new Date().toISOString()
                } as DangKy;
            });
            return [...kept, ...added];
        });
        showToast(`Cập nhật thẻ đăng ký cho ${vdv.ho_ten} thành công.`, 'success');
        setModalMode(null);
    };

    const openRegistrationPicker = useCallback(() => {
        if (!canManageCard) {
            requireAction('create', 'quản lý thẻ đăng ký');
            return;
        }
        setModalMode('picker');
    }, [canManageCard, requireAction]);

    const openRegistrationEditor = useCallback((vdvId: string) => {
        if (!canManageCard) {
            requireAction('update', 'quản lý thẻ đăng ký');
            return;
        }
        setSelectedVdv(vdvId);
        setModalMode('reg');
    }, [canManageCard, requireAction]);

    const pipeline = [
        { k: '', l: 'Tất cả ĐK', c: '#22d3ee', i: <VCT_Icons.List size={14} /> },
        { k: 'quyen', l: 'Quyền', c: '#22d3ee', i: '🥋' },
        { k: 'doi_khang', l: 'Đối kháng', c: '#f59e0b', i: '🥊' },
        { k: 'cho_duyet', l: 'Chờ duyệt', c: '#f59e0b', i: <VCT_Icons.Clock size={14} /> },
        { k: 'da_duyet', l: 'Đã duyệt', c: '#10b981', i: <VCT_Icons.Check size={14} /> },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* KPI STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <VCT_KpiCard label="Tổng Lượt Đăng Ký" value={data.length} icon={<VCT_Icons.List size={24} />} color="#22d3ee" sub={`${data.filter(r => r.loai === 'quyen').length} Quyền - ${data.filter(r => r.loai === 'doi_khang').length} Đối kháng`} />
                <VCT_KpiCard label="Số VĐV có thẻ" value={new Set(data.map(d => d.vdv_id)).size} icon={<VCT_Icons.Users size={24} />} color="#a78bfa" sub={`Max ${TOURNAMENT_CONFIG.quota.max_nd_per_vdv} thẻ / VĐV`} />
                <VCT_KpiCard label="Tỷ lệ lấp đầy Quota" value={`${Math.round((new Set(data.map(d => d.doan_id)).size / Math.max(1, teams.length)) * 100)}%`} icon={<VCT_Icons.Activity size={24} />} color="#f59e0b" sub="Đoàn đã đăng ký thi đấu" />
                <VCT_KpiCard label="Tỷ lệ phê duyệt" value={`${Math.round((data.filter(r => r.trang_thai === 'da_duyet').length / Math.max(1, data.length)) * 100)}%`} icon={<VCT_Icons.Check size={24} />} color="#10b981" sub={`${data.filter(r => r.trang_thai === 'cho_duyet').length} chờ duyệt`} />
            </div>

            {/* DEADLINE WARNING */}
            <div style={{ padding: '16px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, background: '#ef4444', color: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VCT_Icons.Alert size={20} /></div>
                <div>
                    <VCT_Text style={{ fontWeight: 800, color: '#ef4444' }}>Cổng Đăng Ký Đang Mở</VCT_Text>
                    <VCT_Text variant="small" style={{ color: '#ef4444', opacity: 0.8 }}>Hạn chót đăng ký: <strong>{TOURNAMENT_CONFIG.ngay_dk_cuoi}</strong>. Các Đoàn vẫn có thể thêm/rút VĐV khỏi nội dung.</VCT_Text>
                </div>
                <VCT_Button variant="secondary" style={{ marginLeft: 'auto', background: 'var(--vct-bg-card)', borderColor: '#ef4444', color: '#ef4444' }}>Đóng cổng ĐK</VCT_Button>
            </div>

            {/* PIPELINE & TOOLBAR */}
            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: '8px', padding: '6px', background: 'var(--vct-bg-input)', borderRadius: '16px', border: '1px solid var(--vct-border-subtle)', flexWrap: 'wrap' }}>
                    {pipeline.map(p => {
                        const isActive = filter === p.k;
                        const count = p.k === '' ? data.length : data.filter(r => p.k === 'quyen' || p.k === 'doi_khang' ? r.loai === p.k : r.trang_thai === p.k).length;
                        return (
                            <button key={p.k} onClick={() => setFilter(p.k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '12px', border: 'none', background: isActive ? 'var(--vct-bg-card)' : 'transparent', color: isActive ? p.c : 'var(--vct-text-tertiary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: '0.2s', boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none' }}>
                                {p.i} {p.l} <span style={{ padding: '2px 6px', background: isActive ? `${p.c}20` : 'rgba(128,128,128,0.1)', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>{count}</span>
                            </button>
                        )
                    })}
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <div style={{ width: 280 }}><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm VĐV, nội dung thi..." /></div>
                    <VCT_Button icon={<VCT_Icons.Check size={16} />} variant="secondary" onClick={approveAll} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }} disabled={!permissions.canApprove}>Duyệt loạt</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openRegistrationPicker} disabled={!canManageCard}>Quản lý Thẻ (In-card)</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* BẢNG DỮ LIỆU ĐĂNG KÝ */}
            {enrichedData.length === 0 ? <VCT_EmptyState title="Không có lượt đăng ký nào" icon="🎫" /> : (
                <div style={{ overflowX: 'auto', background: 'var(--vct-bg-card)', borderRadius: 16, border: '1px solid var(--vct-border-subtle)' }}>
                    <VCT_Table
                        columns={[
                            {
                                key: 'vdv_ten', label: 'Vận động viên', render: (r: any) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <VCT_AvatarLetter name={r.vdv_ten} size={40} color="var(--vct-accent-cyan)" />
                                        <div><VCT_Text style={{ fontWeight: 800, fontSize: 15 }}>{r.vdv_ten}</VCT_Text><VCT_Text variant="small" style={{ opacity: 0.6, marginTop: 2 }}>{r.doan_ten}</VCT_Text></div>
                                    </div>
                                )
                            },
                            {
                                key: 'loai_noi_dung', label: 'Phân loại', render: (r: any) => (
                                    <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: r.loai === 'quyen' ? 'rgba(34,211,238,0.1)' : 'rgba(245,158,11,0.1)', color: r.loai === 'quyen' ? '#22d3ee' : '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        {r.loai === 'quyen' ? '🥋 Quyền' : '🥊 Đối kháng'}
                                    </span>
                                )
                            },
                            { key: 'nd_ten', label: 'Nội dung đăng ký', render: (r: any) => <VCT_Text style={{ fontWeight: 700, fontSize: 14 }}>{r.nd_ten}</VCT_Text> },
                            { key: 'ngay_dang_ky', label: 'Thời gian ĐK', render: (r: any) => <VCT_Text variant="mono" className="text-xs opacity-60">{new Date(r.ngay).toLocaleDateString('vi-VN')} {new Date(r.ngay).toLocaleTimeString('vi-VN')}</VCT_Text> },
                            { key: 'trang_thai', label: 'Trạng thái', render: (r: any) => <VCT_Badge text={RST_MAP[r.trang_thai as TrangThaiDK].l} type={RST_MAP[r.trang_thai as TrangThaiDK].t as any} /> },
                            {
                                key: 'actions', label: '', align: 'right', render: (r: any) => (
                                    <VCT_Button variant="secondary" onClick={() => openRegistrationEditor(r.vdv_id)} style={{ padding: '8px 14px', fontSize: '12px' }} icon={<VCT_Icons.Edit size={14} />} disabled={!canManageCard}>
                                        Sửa thẻ
                                    </VCT_Button>
                                )
                            }
                        ]}
                        data={enrichedData}
                    />
                </div>
            )}

            {/* VĐV PICKER MODAL (Chọn VĐV để đăng ký) */}
            <VCT_Modal isOpen={modalMode === 'picker'} onClose={() => setModalMode(null)} title="Danh sách VĐV ghi danh" width="600px">
                <VCT_Stack gap={10} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4, paddingBottom: 12 }} className="vct-hide-scrollbar">
                    {athletes.length === 0 ? <VCT_EmptyState title="Chưa có VĐV nào trong hệ thống" icon="👥" /> :
                        athletes.map(v => {
                            const curCount = data.filter(r => r.vdv_id === v.id).length;
                            const isMax = curCount >= TOURNAMENT_CONFIG.quota.max_nd_per_vdv;
                            return (
                                <div key={v.id} onClick={() => openRegistrationEditor(v.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--vct-bg-card)',
                                        borderRadius: '16px', cursor: 'pointer', border: '1px solid var(--vct-border-subtle)', transition: '0.2s',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--vct-accent-cyan)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--vct-border-subtle)'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <VCT_AvatarLetter name={v.ho_ten} size={44} color={v.gioi === 'nam' ? '#60a5fa' : '#f472b6'} />
                                        <div>
                                            <VCT_Text style={{ fontWeight: 800, fontSize: 15 }}>{v.ho_ten}</VCT_Text>
                                            <VCT_Text variant="small" style={{ marginTop: 4 }}>{v.gioi === 'nam' ? 'Nam' : 'Nữ'} • {v.can_nang}kg • {teams.find(d => d.id === v.doan_id)?.ten}</VCT_Text>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: 8, background: isMax ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isMax ? '#ef4444' : '#10b981' }}>
                                            {curCount}/{TOURNAMENT_CONFIG.quota.max_nd_per_vdv} NỘI DUNG
                                        </div>
                                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)', fontWeight: 600 }}>Tùy chỉnh »</VCT_Text>
                                    </div>
                                </div>
                            )
                        })
                    }
                </VCT_Stack>
            </VCT_Modal>

            {/* REGISTRATION MODAL */}
            <RegistrationModal
                isOpen={modalMode === 'reg'}
                onClose={() => setModalMode(null)}
                vdvId={selectedVdv}
                existingRegs={data}
                onSave={handleSaveRegs}
                isEdit={!!data.find(r => r.vdv_id === selectedVdv)}
                athletes={athletes}
                canSave={canManageCard}
                onDenied={() => {
                    requireAction('update', 'lưu thẻ đăng ký');
                }}
            />
        </div>
    );
};
