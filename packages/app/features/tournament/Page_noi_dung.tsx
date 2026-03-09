'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Field, VCT_Input,
    VCT_Select, VCT_Stack, VCT_Toast, VCT_Modal, VCT_Table,
    VCT_SegmentedControl, VCT_SearchInput, VCT_ConfirmDialog, VCT_EmptyState
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { genId } from '../data/mock-data';
import type { NoiDungQuyen, HangCan, LuaTuoi, HinhThucQuyen, TrangThaiND } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

// ════════════════════════════════════════
// CONSTANTS & MAPS
// ════════════════════════════════════════
const HT_MAP: Record<string, string> = { ca_nhan: 'Cá nhân', doi: 'Đôi', dong_doi: 'Đồng đội' };
const GIOI_MAP: Record<string, any> = {
    nam: { l: 'Nam', c: '#60a5fa' },
    nu: { l: 'Nữ', c: '#f472b6' },
    nam_nu: { l: 'Nam Nữ', c: '#a78bfa' }
};
const ST_MAP: Record<string, any> = {
    active: { l: 'Hoạt động', t: 'success' },
    draft: { l: 'Nháp', t: 'info' },
    closed: { l: 'Đóng', t: 'danger' }
};

// ════════════════════════════════════════
// BLANK FORMS
// ════════════════════════════════════════
const BLANK_Q: Partial<NoiDungQuyen> = { ten: '', hinh_thuc: 'ca_nhan', hinh_thuc_thi_dau: 'theo_diem', gioi: 'nam', lua_tuoi: '', trang_thai: 'draft', ghi_chu: '' };
const BLANK_DK: Partial<HangCan> = { gioi: 'nam', lua_tuoi: '', can_tu: 0, can_den: 0, trang_thai: 'draft' };
const BLANK_LT: Partial<LuaTuoi> = { ma: '', ten: '', tu_tuoi: 0, den_tuoi: 0, trang_thai: 'draft' };

// ════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════
export const Page_noi_dung = () => {
    const [activeTab, setActiveTab] = useState('quyen');
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [search, setSearch] = useState('');

    const quyenStore = useEntityCollection(repositories.formCategories.mock);
    const combatStore = useEntityCollection(repositories.combatCategories.mock);
    const ageGroupStore = useEntityCollection(repositories.ageGroups.mock);

    const dataQuyen = quyenStore.items;
    const dataDK = combatStore.items;
    const dataLT = ageGroupStore.items;

    const setDataQuyen = useCallback((updater: React.SetStateAction<NoiDungQuyen[]>) => {
        quyenStore.setItems(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: NoiDungQuyen[]) => NoiDungQuyen[])(prev)
                : updater;
            void repositories.formCategories.mock.replaceAll(next);
            return next;
        });
    }, [quyenStore]);

    const setDataDK = useCallback((updater: React.SetStateAction<HangCan[]>) => {
        combatStore.setItems(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: HangCan[]) => HangCan[])(prev)
                : updater;
            void repositories.combatCategories.mock.replaceAll(next);
            return next;
        });
    }, [combatStore]);

    const setDataLT = useCallback((updater: React.SetStateAction<LuaTuoi[]>) => {
        ageGroupStore.setItems(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: LuaTuoi[]) => LuaTuoi[])(prev)
                : updater;
            void repositories.ageGroups.mock.replaceAll(next);
            return next;
        });
    }, [ageGroupStore]);

    // Modals
    const [showModalQ, setShowModalQ] = useState(false);
    const [showModalDK, setShowModalDK] = useState(false);
    const [showModalLT, setShowModalLT] = useState(false);

    const [formQ, setFormQ] = useState<any>({ ...BLANK_Q });
    const [formDK, setFormDK] = useState<any>({ ...BLANK_DK });
    const [formLT, setFormLT] = useState<any>({ ...BLANK_LT });

    const [editMode, setEditMode] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: string, id: string, name: string } | null>(null);

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);
    const { can, requireAction } = useRouteActionGuard('/noi-dung', {
        notifyDenied: (message) => showToast(message, 'error')
    });
    const permissions = useMemo(() => ({
        canCreate: can('create'),
        canUpdate: can('update'),
        canDelete: can('delete'),
    }), [can]);

    const luaTuoiOptions = useMemo(() => dataLT.map(lt => ({ value: lt.ten, label: lt.ten })), [dataLT]);

    // ── CRUD QUYỀN ──
    const openAddQ = () => {
        if (!requireAction('create', 'thêm bài quyền')) return;
        setEditMode(false);
        setFormQ({ ...BLANK_Q, lua_tuoi: luaTuoiOptions[0]?.value || '' });
        setShowModalQ(true);
    };
    const openEditQ = (item: NoiDungQuyen) => {
        if (!requireAction('update', 'chỉnh sửa bài quyền')) return;
        setEditMode(true);
        setFormQ(item);
        setShowModalQ(true);
    };
    const handleSaveQ = () => {
        if (!requireAction(editMode ? 'update' : 'create', editMode ? 'chỉnh sửa bài quyền' : 'thêm bài quyền')) return;
        if (!formQ.ten || !formQ.lua_tuoi) { showToast('Vui lòng nhập tên và chọn lứa tuổi', 'error'); return; }
        if (editMode) {
            setDataQuyen(prev => prev.map(q => q.id === formQ.id ? { ...q, ...formQ, updated: new Date().toISOString().split('T')[0] } : q));
            showToast('Đã cập nhật bài quyền');
        } else {
            setDataQuyen([{ ...formQ, id: genId('Q'), updated: new Date().toISOString().split('T')[0] } as NoiDungQuyen, ...dataQuyen]);
            showToast('Đã thêm bài quyền mới');
        }
        setShowModalQ(false);
    };

    // ── CRUD ĐỐI KHÁNG ──
    const openAddDK = () => {
        if (!requireAction('create', 'thêm hạng cân')) return;
        setEditMode(false);
        setFormDK({ ...BLANK_DK, lua_tuoi: luaTuoiOptions[0]?.value || '' });
        setShowModalDK(true);
    };
    const openEditDK = (item: HangCan) => {
        if (!requireAction('update', 'chỉnh sửa hạng cân')) return;
        setEditMode(true);
        setFormDK(item);
        setShowModalDK(true);
    };
    const handleSaveDK = () => {
        if (!requireAction(editMode ? 'update' : 'create', editMode ? 'chỉnh sửa hạng cân' : 'thêm hạng cân')) return;
        if (!formDK.lua_tuoi || formDK.can_tu < 0 || formDK.can_den < formDK.can_tu) { showToast('Thông tin hạng cân không hợp lệ', 'error'); return; }
        if (editMode) {
            setDataDK(prev => prev.map(dk => dk.id === formDK.id ? { ...dk, ...formDK } : dk));
            showToast('Đã cập nhật hạng cân');
        } else {
            setDataDK([{ ...formDK, id: genId('DK') } as HangCan, ...dataDK]);
            showToast('Đã thêm hạng cân mới');
        }
        setShowModalDK(false);
    };

    // ── CRUD LỨA TUỔI ──
    const openAddLT = () => {
        if (!requireAction('create', 'thêm lứa tuổi')) return;
        setEditMode(false);
        setFormLT({ ...BLANK_LT });
        setShowModalLT(true);
    };
    const openEditLT = (item: LuaTuoi) => {
        if (!requireAction('update', 'chỉnh sửa lứa tuổi')) return;
        setEditMode(true);
        setFormLT(item);
        setShowModalLT(true);
    };
    const handleSaveLT = () => {
        if (!requireAction(editMode ? 'update' : 'create', editMode ? 'chỉnh sửa lứa tuổi' : 'thêm lứa tuổi')) return;
        if (!formLT.ten || !formLT.ma || formLT.tu_tuoi < 0 || formLT.den_tuoi < formLT.tu_tuoi) { showToast('Thông tin lứa tuổi không hợp lệ', 'error'); return; }
        if (editMode) {
            setDataLT(prev => prev.map(lt => lt.id === formLT.id ? { ...lt, ...formLT } : lt));
            showToast('Đã cập nhật lứa tuổi');
        } else {
            setDataLT([{ ...formLT, id: genId('LT') } as LuaTuoi, ...dataLT]);
            showToast('Đã thêm lứa tuổi mới');
        }
        setShowModalLT(false);
    };

    // ── DELETE ──
    const handleDelete = () => {
        if (!requireAction('delete', 'xóa danh mục')) return;
        if (!deleteTarget) return;
        if (deleteTarget.type === 'quyen') setDataQuyen(prev => prev.filter(q => q.id !== deleteTarget.id));
        if (deleteTarget.type === 'doikhang') setDataDK(prev => prev.filter(dk => dk.id !== deleteTarget.id));
        if (deleteTarget.type === 'luatuoi') setDataLT(prev => prev.filter(lt => lt.id !== deleteTarget.id));
        showToast(`Đã xóa ${deleteTarget.name}`, 'success');
        setDeleteTarget(null);
    };

    // ── RENDER TABS ──
    const renderQuyen = () => {
        const filtered = dataQuyen.filter(q => q.ten.toLowerCase().includes(search.toLowerCase()) || q.lua_tuoi.toLowerCase().includes(search.toLowerCase()));
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                    <div style={{ width: 300 }}><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm bài quyền, lứa tuổi..." /></div>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddQ} disabled={!permissions.canCreate}>Thêm bài quyền</VCT_Button>
                </VCT_Stack>
                {filtered.length === 0 ? <VCT_EmptyState title="Không có dữ liệu" icon="🥋" /> : (
                    <VCT_Table data={filtered} columns={[
                        { key: 'ten', label: 'Tên bài quyền', render: (r: any) => <VCT_Text className="font-bold">{r.ten}</VCT_Text> },
                        { key: 'hinh_thuc', label: 'Đội hình', render: (r: any) => HT_MAP[r.hinh_thuc] },
                        { key: 'hinh_thuc_thi_dau', label: 'Hình thức thi đấu', render: (r: any) => r.hinh_thuc_thi_dau === 'dau_loai_ban_ket' ? 'Đấu loại Top 4' : 'Tính điểm' },
                        { key: 'gioi', label: 'Giới', render: (r: any) => <span style={{ color: GIOI_MAP[r.gioi].c, fontWeight: 600 }}>{GIOI_MAP[r.gioi].l}</span> },
                        { key: 'lua_tuoi', label: 'Lứa tuổi' },
                        { key: 'trang_thai', label: 'Trạng thái', render: (r: any) => <VCT_Badge text={ST_MAP[r.trang_thai].l} type={ST_MAP[r.trang_thai].t} /> },
                        {
                            key: 'actions', label: '', align: 'right', render: (r: any) => (
                                <VCT_Stack direction="row" gap={8} justify="flex-end">
                                    {permissions.canUpdate && (
                                        <button onClick={() => openEditQ(r)} style={{ background: 'none', border: 'none', color: 'var(--vct-text-tertiary)', cursor: 'pointer' }} aria-label="Sửa bài quyền"><VCT_Icons.Edit size={16} /></button>
                                    )}
                                    {permissions.canDelete && (
                                        <button onClick={() => setDeleteTarget({ type: 'quyen', id: r.id, name: r.ten })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} aria-label="Xóa bài quyền"><VCT_Icons.Trash size={16} /></button>
                                    )}
                                </VCT_Stack>
                            )
                        }
                    ]} />
                )}
            </motion.div>
        );
    };

    const renderDoiKhang = () => {
        const filtered = dataDK.filter(dk => dk.lua_tuoi.toLowerCase().includes(search.toLowerCase()));
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                    <div style={{ width: 300 }}><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm lứa tuổi..." /></div>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddDK} disabled={!permissions.canCreate}>Thêm hạng cân</VCT_Button>
                </VCT_Stack>
                {filtered.length === 0 ? <VCT_EmptyState title="Không có dữ liệu" icon="🥊" /> : (
                    <VCT_Table data={filtered} columns={[
                        { key: 'hang_can', label: 'Hạng cân', render: (r: any) => <VCT_Text className="font-bold">{r.can_den ? `${r.can_tu} - ${r.can_den} kg` : `Trên ${r.can_tu} kg`}</VCT_Text> },
                        { key: 'gioi', label: 'Giới tính', render: (r: any) => <span style={{ color: GIOI_MAP[r.gioi].c, fontWeight: 600 }}>{GIOI_MAP[r.gioi].l}</span> },
                        { key: 'lua_tuoi', label: 'Lứa tuổi' },
                        { key: 'trang_thai', label: 'Trạng thái', render: (r: any) => <VCT_Badge text={ST_MAP[r.trang_thai].l} type={ST_MAP[r.trang_thai].t} /> },
                        {
                            key: 'actions', label: '', align: 'right', render: (r: any) => (
                                <VCT_Stack direction="row" gap={8} justify="flex-end">
                                    {permissions.canUpdate && (
                                        <button onClick={() => openEditDK(r)} style={{ background: 'none', border: 'none', color: 'var(--vct-text-tertiary)', cursor: 'pointer' }} aria-label="Sửa hạng cân"><VCT_Icons.Edit size={16} /></button>
                                    )}
                                    {permissions.canDelete && (
                                        <button onClick={() => setDeleteTarget({ type: 'doikhang', id: r.id, name: r.can_den ? `${r.can_tu}-${r.can_den}kg` : `>${r.can_tu}kg` })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} aria-label="Xóa hạng cân"><VCT_Icons.Trash size={16} /></button>
                                    )}
                                </VCT_Stack>
                            )
                        }
                    ]} />
                )}
            </motion.div>
        );
    };

    const renderLuaTuoi = () => {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                    <VCT_Text variant="h2">Cấu hình nhóm tuổi (<span style={{ color: '#ef4444' }}>Cảnh báo: Ảnh hưởng toàn hệ thống</span>)</VCT_Text>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddLT} disabled={!permissions.canCreate}>Thêm lứa tuổi</VCT_Button>
                </VCT_Stack>
                {dataLT.length === 0 ? <VCT_EmptyState title="Không có dữ liệu" icon="📅" /> : (
                    <VCT_Table data={dataLT} columns={[
                        { key: 'ma', label: 'Mã', render: (r: any) => <VCT_Text variant="mono">{r.ma}</VCT_Text> },
                        { key: 'ten', label: 'Tên lứa tuổi', render: (r: any) => <VCT_Text className="font-bold">{r.ten}</VCT_Text> },
                        { key: 'khoang', label: 'Khoảng tuổi', render: (r: any) => `${r.tu_tuoi} → ${r.den_tuoi} tuổi` },
                        { key: 'trang_thai', label: 'Trạng thái', render: (r: any) => <VCT_Badge text={ST_MAP[r.trang_thai].l} type={ST_MAP[r.trang_thai].t} /> },
                        {
                            key: 'actions', label: '', align: 'right', render: (r: any) => (
                                <VCT_Stack direction="row" gap={8} justify="flex-end">
                                    {permissions.canUpdate && (
                                        <button onClick={() => openEditLT(r)} style={{ background: 'none', border: 'none', color: 'var(--vct-text-tertiary)', cursor: 'pointer' }} aria-label="Sửa lứa tuổi"><VCT_Icons.Edit size={16} /></button>
                                    )}
                                    {permissions.canDelete && (
                                        <button onClick={() => setDeleteTarget({ type: 'luatuoi', id: r.id, name: r.ten })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} aria-label="Xóa lứa tuổi"><VCT_Icons.Trash size={16} /></button>
                                    )}
                                </VCT_Stack>
                            )
                        }
                    ]} />
                )}
            </motion.div>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* DASHBOARD TỔNG QUAN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(280px, 1.5fr) minmax(280px, 1.5fr)', gap: '16px', marginBottom: '24px' }}>
                <VCT_Card style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(139,92,246,0.1))', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 900, background: 'var(--vct-accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                        {dataQuyen.length + dataDK.length}
                    </div>
                    <VCT_Text variant="small" style={{ marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Tổng nội dung thi đấu</VCT_Text>
                </VCT_Card>

                <VCT_Card>
                    <VCT_Stack direction="row" align="center" gap={12} className="mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>🥋</div>
                        <VCT_Text variant="h2" style={{ fontSize: 16 }}>Nội dung Quyền</VCT_Text>
                    </VCT_Stack>
                    <VCT_Stack gap={10}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--vct-bg-input)', borderRadius: 8 }}>
                            <VCT_Text variant="small" style={{ fontWeight: 600 }}>Đang hoạt động</VCT_Text>
                            <VCT_Text style={{ fontWeight: 800, color: '#10b981' }}>{dataQuyen.filter(q => q.trang_thai === 'active').length}</VCT_Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--vct-bg-input)', borderRadius: 8 }}>
                            <VCT_Text variant="small" style={{ fontWeight: 600 }}>Nháp / Đóng</VCT_Text>
                            <VCT_Text style={{ fontWeight: 800, color: '#f59e0b' }}>{dataQuyen.filter(q => q.trang_thai !== 'active').length}</VCT_Text>
                        </div>
                    </VCT_Stack>
                </VCT_Card>

                <VCT_Card>
                    <VCT_Stack direction="row" align="center" gap={12} className="mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>🥊</div>
                        <VCT_Text variant="h2" style={{ fontSize: 16 }}>Hạng cân Đối kháng</VCT_Text>
                    </VCT_Stack>
                    <VCT_Stack gap={10}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--vct-bg-input)', borderRadius: 8 }}>
                            <VCT_Text variant="small" style={{ fontWeight: 600 }}>Nam</VCT_Text>
                            <VCT_Text style={{ fontWeight: 800, color: '#60a5fa' }}>{dataDK.filter(q => q.gioi === 'nam').length}</VCT_Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--vct-bg-input)', borderRadius: 8 }}>
                            <VCT_Text variant="small" style={{ fontWeight: 600 }}>Nữ</VCT_Text>
                            <VCT_Text style={{ fontWeight: 800, color: '#f472b6' }}>{dataDK.filter(q => q.gioi === 'nu').length}</VCT_Text>
                        </div>
                    </VCT_Stack>
                </VCT_Card>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ marginBottom: '24px' }}>
                <VCT_SegmentedControl
                    options={[
                        { value: 'quyen', label: `🥋 Nội dung Quyền (${dataQuyen.length})` },
                        { value: 'doikhang', label: `🥊 Hạng cân Đối kháng (${dataDK.length})` },
                        { value: 'luatuoi', label: `📅 Nhóm tuổi (${dataLT.length})` },
                    ]}
                    value={activeTab}
                    onChange={(v: string) => { setActiveTab(v); setSearch(''); }}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ background: 'var(--vct-bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--vct-border-subtle)' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'quyen' && renderQuyen()}
                    {activeTab === 'doikhang' && renderDoiKhang()}
                    {activeTab === 'luatuoi' && renderLuaTuoi()}
                </AnimatePresence>
            </div>

            {/* ── MODALS ── */}

            {/* QUYỀN MODAL */}
            <VCT_Modal isOpen={showModalQ} onClose={() => setShowModalQ(false)} title={`${editMode ? 'Sửa' : 'Thêm'} Bài Quyền`} width="600px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModalQ(false)}>Hủy</VCT_Button><VCT_Button onClick={handleSaveQ} disabled={editMode ? !permissions.canUpdate : !permissions.canCreate}>Lưu</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên bài quyền *"><VCT_Input value={formQ.ten} onChange={(e: any) => setFormQ({ ...formQ, ten: e.target.value })} placeholder="VD: Lão Mai Quyền" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Đội hình thi đấu" className="flex-1"><VCT_Select options={[{ value: 'ca_nhan', label: 'Cá nhân' }, { value: 'doi', label: 'Đôi' }, { value: 'dong_doi', label: 'Đồng đội' }]} value={formQ.hinh_thuc} onChange={(v: any) => setFormQ({ ...formQ, hinh_thuc: v })} /></VCT_Field>
                        <VCT_Field label="Hình thức thi" className="flex-1"><VCT_Select options={[{ value: 'theo_diem', label: 'Tính điểm xếp hạng' }, { value: 'dau_loai_ban_ket', label: 'Đấu loại từ Bán kết (Top 4)' }]} value={formQ.hinh_thuc_thi_dau || 'theo_diem'} onChange={(v: any) => setFormQ({ ...formQ, hinh_thuc_thi_dau: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Giới tính" className="flex-1"><VCT_Select options={[{ value: 'nam', label: 'Nam' }, { value: 'nu', label: 'Nữ' }, { value: 'nam_nu', label: 'Nam Nữ' }]} value={formQ.gioi} onChange={(v: any) => setFormQ({ ...formQ, gioi: v })} /></VCT_Field>
                        <VCT_Field label="Lứa tuổi" className="flex-1"><VCT_Select options={luaTuoiOptions} value={formQ.lua_tuoi} onChange={(v: any) => setFormQ({ ...formQ, lua_tuoi: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Trạng thái" className="flex-1"><VCT_Select options={[{ value: 'active', label: 'Hoạt động' }, { value: 'draft', label: 'Nháp' }, { value: 'closed', label: 'Đóng' }]} value={formQ.trang_thai} onChange={(v: any) => setFormQ({ ...formQ, trang_thai: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Ghi chú"><VCT_Input value={formQ.ghi_chu || ''} onChange={(e: any) => setFormQ({ ...formQ, ghi_chu: e.target.value })} placeholder="Ghi chú thêm" /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* ĐỐI KHÁNG MODAL */}
            <VCT_Modal isOpen={showModalDK} onClose={() => setShowModalDK(false)} title={`${editMode ? 'Sửa' : 'Thêm'} Hạng Cân Đối Kháng`} width="600px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModalDK(false)}>Hủy</VCT_Button><VCT_Button onClick={handleSaveDK} disabled={editMode ? !permissions.canUpdate : !permissions.canCreate}>Lưu</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Cân từ (kg) *" className="flex-1"><VCT_Input type="number" value={formDK.can_tu} onChange={(e: any) => setFormDK({ ...formDK, can_tu: Number(e.target.value) })} /></VCT_Field>
                        <VCT_Field label="Cân đến (kg) (0 = vô hạn) *" className="flex-1"><VCT_Input type="number" value={formDK.can_den} onChange={(e: any) => setFormDK({ ...formDK, can_den: Number(e.target.value) })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Giới tính" className="flex-1"><VCT_Select options={[{ value: 'nam', label: 'Nam' }, { value: 'nu', label: 'Nữ' }]} value={formDK.gioi} onChange={(v: any) => setFormDK({ ...formDK, gioi: v })} /></VCT_Field>
                        <VCT_Field label="Lứa tuổi" className="flex-1"><VCT_Select options={luaTuoiOptions} value={formDK.lua_tuoi} onChange={(v: any) => setFormDK({ ...formDK, lua_tuoi: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Trạng thái"><VCT_Select options={[{ value: 'active', label: 'Hoạt động' }, { value: 'draft', label: 'Nháp' }, { value: 'closed', label: 'Đóng' }]} value={formDK.trang_thai} onChange={(v: any) => setFormDK({ ...formDK, trang_thai: v })} /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* LỨA TUỔI MODAL */}
            <VCT_Modal isOpen={showModalLT} onClose={() => setShowModalLT(false)} title={`${editMode ? 'Sửa' : 'Thêm'} Nhóm Tuổi`} width="600px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModalLT(false)}>Hủy</VCT_Button><VCT_Button onClick={handleSaveLT} disabled={editMode ? !permissions.canUpdate : !permissions.canCreate}>Lưu</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã quy ước *" className="flex-1"><VCT_Input value={formLT.ma} onChange={(e: any) => setFormLT({ ...formLT, ma: e.target.value })} placeholder="VD: thieu_nien" /></VCT_Field>
                        <VCT_Field label="Tên hiển thị *" className="flex-1"><VCT_Input value={formLT.ten} onChange={(e: any) => setFormLT({ ...formLT, ten: e.target.value })} placeholder="VD: Thiếu niên" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Từ (tuổi) *" className="flex-1"><VCT_Input type="number" value={formLT.tu_tuoi} onChange={(e: any) => setFormLT({ ...formLT, tu_tuoi: Number(e.target.value) })} /></VCT_Field>
                        <VCT_Field label="Đến (tuổi) *" className="flex-1"><VCT_Input type="number" value={formLT.den_tuoi} onChange={(e: any) => setFormLT({ ...formLT, den_tuoi: Number(e.target.value) })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Trạng thái"><VCT_Select options={[{ value: 'active', label: 'Hoạt động' }, { value: 'draft', label: 'Nháp' }]} value={formLT.trang_thai} onChange={(v: any) => setFormLT({ ...formLT, trang_thai: v })} /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* DELETE CONFIRM */}
            <VCT_ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Xác nhận xóa"
                message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"? Hệ thống sẽ mất đi cấu hình này.`}
                onConfirm={handleDelete}
                confirmLabel="Xóa vĩnh viễn"
            />
        </div>
    );
};
