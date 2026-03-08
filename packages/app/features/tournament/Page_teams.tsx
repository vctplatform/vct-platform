'use client';
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_Table, VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_StatusPipeline, VCT_FilterChips, VCT_BulkActionsBar,
    VCT_ProgressBar, VCT_Tabs, VCT_AvatarLetter, VCT_EmptyState
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { getVDVsByDoan, genId } from '../data/mock-data';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import { TRANG_THAI_DOAN_MAP, DOC_CHECKLIST, type DonVi, type TrangThaiDoan } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';

// ════════════════════════════════════════
// STATUS PIPELINE CONFIG
// ════════════════════════════════════════
const PIPELINE_STAGES = [
    { key: 'nhap', label: 'Nháp', color: '#94a3b8' },
    { key: 'cho_duyet', label: 'Chờ duyệt', color: '#f59e0b' },
    { key: 'yeu_cau_bo_sung', label: 'Bổ sung', color: '#ef4444' },
    { key: 'da_xac_nhan', label: 'Đã xác nhận', color: '#10b981' },
    { key: 'da_checkin', label: 'Đã check-in', color: '#22d3ee' },
    { key: 'tu_choi', label: 'Từ chối', color: '#ef4444' },
];

const BLANK_FORM: Partial<DonVi> = {
    ten: '', ma: '', tat: '', loai: 'doan_tinh', tinh: '', truong_doan: '', sdt: '', email: '', dia_chi: '', ghi_chu: '',
};

// ════════════════════════════════════════
// EXPAND PANEL COMPONENT
// ════════════════════════════════════════
const ExpandPanel = ({ team, onDocToggle, onStatusChange }: { team: DonVi; onDocToggle: (idx: number) => void; onStatusChange: (status: TrangThaiDoan) => void }) => {
    const [tab, setTab] = useState('info');
    const docDone = Object.values(team.docs).filter(Boolean).length;
    const feeRemain = team.le_phi.tong - team.le_phi.da_dong;

    return (
        <div style={{ padding: '20px 24px', background: 'var(--vct-bg-base)', borderTop: '1px dashed var(--vct-border-subtle)' }}>
            {/* Mini tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {['info', 'docs', 'finance', 'history'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '6px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 800 : 600,
                        background: tab === t ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-elevated)', color: tab === t ? '#fff' : 'var(--vct-text-secondary)', fontFamily: 'inherit',
                    }}>
                        {{ info: '📋 Thông tin', docs: '📁 Hồ sơ', finance: '💰 Tài chính', history: '📜 Lịch sử' }[t]}
                    </button>
                ))}
            </div>

            {tab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Loại</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.loai === 'doan_tinh' ? 'Đoàn tỉnh/TP' : team.loai === 'clb' ? 'CLB' : 'Cá nhân'}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Tỉnh/TP</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.tinh}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Trưởng đoàn</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.truong_doan}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>SĐT</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.sdt}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Email</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.email}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Địa chỉ</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.dia_chi}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>VĐV</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.so_vdv} <span style={{ opacity: 0.5 }}>({team.nam}♂ {team.nu}♀)</span></div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>HLV</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.hlv}</div></div>
                    <div><span style={{ fontSize: 11, opacity: 0.5 }}>Thành tích</span><div style={{ fontWeight: 700, fontSize: 13 }}>{team.thanh_tich || '—'}</div></div>
                    {team.ghi_chu && <div style={{ gridColumn: '1 / -1' }}><span style={{ fontSize: 11, opacity: 0.5 }}>Ghi chú</span><div style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b' }}>{team.ghi_chu}</div></div>}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, display: 'block' }}>Chuyển trạng thái</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {PIPELINE_STAGES.filter(s => s.key !== team.trang_thai).map(s => (
                                <button key={s.key} onClick={() => onStatusChange(s.key as TrangThaiDoan)} style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${s.color}40`, background: `${s.color}10`, color: s.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    → {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'docs' && (
                <div>
                    <VCT_ProgressBar value={docDone} max={6} showLabel />
                    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                        {DOC_CHECKLIST.map((doc, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--vct-bg-elevated)', cursor: 'pointer', border: '1px solid var(--vct-border-subtle)' }}>
                                <input type="checkbox" checked={!!team.docs[i]} onChange={() => onDocToggle(i)} style={{ width: 18, height: 18, accentColor: '#22d3ee' }} />
                                <span style={{ fontSize: 13, fontWeight: team.docs[i] ? 700 : 500, textDecoration: team.docs[i] ? 'line-through' : 'none', opacity: team.docs[i] ? 0.6 : 1 }}>{doc}</span>
                                {team.docs[i] ? <VCT_Icons.Check size={14} color="#10b981" /> : <VCT_Icons.Clock size={14} color="#f59e0b" />}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'finance' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Tổng lệ phí</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--vct-accent-cyan)' }}>{(team.le_phi.tong / 1000000).toFixed(1)}M</div>
                        </div>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Đã đóng</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{(team.le_phi.da_dong / 1000000).toFixed(1)}M</div>
                        </div>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Còn thiếu</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: feeRemain > 0 ? '#ef4444' : '#10b981' }}>{feeRemain > 0 ? `${(feeRemain / 1000000).toFixed(1)}M` : '✓'}</div>
                        </div>
                    </div>
                    <VCT_ProgressBar value={team.le_phi.da_dong} max={team.le_phi.tong} showLabel />
                </div>
            )}

            {tab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {team.audit.length === 0 ? <div style={{ opacity: 0.4, fontSize: 13 }}>Chưa có lịch sử</div> :
                        team.audit.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--vct-bg-elevated)' }}>
                                <VCT_Icons.Clock size={14} color="var(--vct-text-tertiary)" />
                                <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.5, minWidth: 100 }}>{a.time}</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.action}</span>
                                <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 'auto' }}>bởi {a.by}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════
export const Page_teams = () => {
    const { items: teams, setItems: setTeamsState } = useEntityCollection(repositories.teams.mock);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [showModal, setShowModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState<DonVi | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DonVi | null>(null);
    const [form, setForm] = useState<any>({ ...BLANK_FORM });

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);

    const setTeams = useCallback((updater: React.SetStateAction<DonVi[]>) => {
        setTeamsState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: DonVi[]) => DonVi[])(prev)
                : updater;
            void repositories.teams.mock.replaceAll(next);
            return next;
        });
    }, [setTeamsState]);

    // Keyboard shortcut: Ctrl+N to add
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); openAddModal(); }
            if (e.key === 'Escape') { setShowModal(false); setDeleteTarget(null); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = teams;
        if (statusFilter) data = data.filter(t => t.trang_thai === statusFilter);
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(t => t.ten.toLowerCase().includes(q) || t.ma.toLowerCase().includes(q) || t.tinh.toLowerCase().includes(q) || t.truong_doan.toLowerCase().includes(q));
        }
        return data;
    }, [teams, statusFilter, search]);

    const pipelineStages = useMemo(() => PIPELINE_STAGES.map(s => ({ ...s, count: teams.filter(t => t.trang_thai === s.key).length })), [teams]);
    const totalVdv = teams.reduce((s, t) => s + t.so_vdv, 0);
    const totalNam = teams.reduce((s, t) => s + t.nam, 0);
    const totalNu = teams.reduce((s, t) => s + t.nu, 0);

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = [];
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: TRANG_THAI_DOAN_MAP[statusFilter as TrangThaiDoan]?.label || statusFilter });
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search });
        return f;
    }, [statusFilter, search]);

    const removeFilter = (key: string) => {
        if (key === 'status') setStatusFilter(null);
        if (key === 'search') setSearch('');
    };

    // ── CRUD Operations ──
    const openAddModal = () => { setEditingTeam(null); setForm({ ...BLANK_FORM }); setShowModal(true); };
    const openEditModal = (team: DonVi) => { setEditingTeam(team); setForm({ ...team }); setShowModal(true); };

    const handleSave = () => {
        if (!form.ten || !form.ma) { showToast('Vui lòng nhập tên và mã đơn vị', 'error'); return; }
        if (editingTeam) {
            setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...form } : t));
            showToast(`Đã cập nhật "${form.ten}"`);
        } else {
            const newTeam: DonVi = {
                ...form, id: genId('D'), so_vdv: 0, nam: 0, nu: 0, hlv: 0, nd_q: 0, nd_dk: 0,
                trang_thai: 'nhap', le_phi: { tong: TOURNAMENT_CONFIG.le_phi.doan, da_dong: 0 },
                docs: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false },
                ngay_dk: new Date().toISOString().split('T')[0], audit: [{ time: new Date().toLocaleString('vi-VN'), action: 'Tạo mới', by: 'Admin' }],
                thanh_tich: '',
            };
            setTeams(prev => [newTeam, ...prev]);
            showToast(`Đã thêm "${form.ten}"`);
        }
        setShowModal(false);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        const vdvCount = getVDVsByDoan(deleteTarget.id).length;
        if (vdvCount > 0) { showToast(`Không thể xóa! Đoàn "${deleteTarget.ten}" có ${vdvCount} VĐV`, 'error'); setDeleteTarget(null); return; }
        setTeams(prev => prev.filter(t => t.id !== deleteTarget.id));
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
        showToast(`Đã xóa "${deleteTarget.ten}"`, 'success');
        setDeleteTarget(null);
    };

    const handleDocToggle = (teamId: string, docIdx: number) => {
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, docs: { ...t.docs, [docIdx]: !t.docs[docIdx] } } : t));
    };

    const handleStatusChange = (teamId: string, status: TrangThaiDoan) => {
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, trang_thai: status, audit: [...t.audit, { time: new Date().toLocaleString('vi-VN'), action: `Chuyển → ${TRANG_THAI_DOAN_MAP[status].label}`, by: 'Admin' }] } : t));
        showToast(`Đã chuyển trạng thái → ${TRANG_THAI_DOAN_MAP[status].label}`);
    };

    // Bulk actions
    const bulkApprove = () => {
        setTeams(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, trang_thai: 'da_xac_nhan' as TrangThaiDoan, audit: [...t.audit, { time: new Date().toLocaleString('vi-VN'), action: 'Duyệt hàng loạt', by: 'Admin' }] } : t));
        showToast(`Đã duyệt ${selectedIds.size} đơn vị`);
        setSelectedIds(new Set());
    };

    // Select all/toggle
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));

    // ── Table columns ──
    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />, align: 'center' as const,
            render: (r: DonVi) => <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
        },
        {
            key: 'ten', label: 'Đơn vị', render: (r: DonVi) => (
                <VCT_Stack direction="row" gap={10} align="center">
                    <VCT_AvatarLetter name={r.ten} size={32} />
                    <div><div style={{ fontWeight: 700, fontSize: 13 }}>{r.ten}</div><div style={{ fontSize: 11, opacity: 0.5, fontFamily: 'monospace' }}>{r.ma}</div></div>
                </VCT_Stack>
            )
        },
        { key: 'tinh', label: 'Tỉnh/TP' },
        {
            key: 'so_vdv', label: 'VĐV', align: 'center' as const, render: (r: DonVi) => (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--vct-accent-cyan)' }}>{r.so_vdv}</span>
                    <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>/ {TOURNAMENT_CONFIG.quota.max_vdv_per_doan}</span>
                    <VCT_ProgressBar value={r.so_vdv} max={TOURNAMENT_CONFIG.quota.max_vdv_per_doan} height={3} />
                </div>
            )
        },
        {
            key: 'docs', label: 'Hồ sơ', align: 'center' as const, render: (r: DonVi) => {
                const done = Object.values(r.docs).filter(Boolean).length;
                return <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: done === 6 ? '#10b981' : '#f59e0b' }}>{done}/6</span></div>;
            }
        },
        {
            key: 'le_phi', label: 'Lệ phí', align: 'center' as const, render: (r: DonVi) => {
                const paid = r.le_phi.da_dong >= r.le_phi.tong;
                return <VCT_Badge text={paid ? '✓ Đủ' : `Thiếu ${((r.le_phi.tong - r.le_phi.da_dong) / 1000000).toFixed(1)}M`} type={paid ? 'success' : 'warning'} />;
            }
        },
        {
            key: 'trang_thai', label: 'Trạng thái', align: 'center' as const, render: (r: DonVi) => {
                const st = TRANG_THAI_DOAN_MAP[r.trang_thai];
                return <VCT_Badge text={st.label} type={st.type} />;
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: DonVi) => (
                <VCT_Stack direction="row" gap={4} justify="flex-end">
                    <button onClick={(e: any) => { e.stopPropagation(); openEditModal(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: 4 }}><VCT_Icons.Edit size={14} /></button>
                    <button onClick={(e: any) => { e.stopPropagation(); setDeleteTarget(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><VCT_Icons.Trash size={14} /></button>
                </VCT_Stack>
            )
        },
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* ── KPI ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="Tổng đơn vị" value={teams.length} icon={<VCT_Icons.Building2 size={24} />} color="#0ea5e9" sub={`Quota: ${teams.length}/${TOURNAMENT_CONFIG.quota.max_doan}`} />
                <VCT_KpiCard label="Tổng VĐV" value={totalVdv} icon={<VCT_Icons.Users size={24} />} color="#f59e0b" sub={`${totalNam} Nam — ${totalNu} Nữ`} />
                <VCT_KpiCard label="Đã xác nhận" value={teams.filter(t => t.trang_thai === 'da_xac_nhan' || t.trang_thai === 'da_checkin').length} icon={<VCT_Icons.Check size={24} />} color="#10b981" />
                <VCT_KpiCard label="Chờ duyệt" value={teams.filter(t => t.trang_thai === 'cho_duyet').length} icon={<VCT_Icons.Clock size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Cần bổ sung" value={teams.filter(t => t.trang_thai === 'yeu_cau_bo_sung' || t.trang_thai === 'nhap').length} icon={<VCT_Icons.Alert size={24} />} color="#ef4444" />
            </div>

            {/* ── STATUS PIPELINE ── */}
            <VCT_StatusPipeline stages={pipelineStages} activeStage={statusFilter} onStageClick={setStatusFilter} />

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setSearch(''); }} />

            {/* ── TOOLBAR ── */}
            <VCT_Stack direction="row" gap={16} align="center" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px', minWidth: 200 }}>
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm đơn vị, mã, tỉnh..." />
                </div>
                <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => showToast('Đang xuất Excel...', 'info')}>Export</VCT_Button>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm đơn vị</VCT_Button>
            </VCT_Stack>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy đơn vị" description={search || statusFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Chưa có đơn vị nào. Bấm "Thêm đơn vị" để bắt đầu.'} actionLabel="Thêm đơn vị" onAction={openAddModal} icon="🏢" />
            ) : (
                <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                                {columns.map((col, i) => (
                                    <th key={i} style={{ padding: '14px 16px', textAlign: (col.align || 'left') as any, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, position: 'sticky', top: 0, background: 'var(--vct-bg-card)', zIndex: 2 }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((team, idx) => {
                                const stColor = TRANG_THAI_DOAN_MAP[team.trang_thai]?.color || '#94a3b8';
                                return (
                                    <React.Fragment key={team.id}>
                                        <tr onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                                            style={{ borderBottom: '1px solid var(--vct-border-subtle)', cursor: 'pointer', background: selectedIds.has(team.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${stColor}`, transition: 'background 0.15s' }}>
                                            {columns.map((col, ci) => (
                                                <td key={ci} style={{ padding: '14px 16px', fontSize: 13, textAlign: (col.align || 'left') as any }}>
                                                    {col.render ? col.render(team) : (team as any)[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                        <AnimatePresence>
                                            {expandedId === team.id && (
                                                <tr>
                                                    <td colSpan={columns.length} style={{ padding: 0 }}>
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                                            <ExpandPanel team={team} onDocToggle={(i) => handleDocToggle(team.id, i)} onStatusChange={(st) => handleStatusChange(team.id, st)} />
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {/* Summary footer */}
                    <div style={{ padding: '12px 16px', borderTop: '2px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)', display: 'flex', gap: 24, fontSize: 12, fontWeight: 700, opacity: 0.6 }}>
                        <span>Hiện {filtered.length}/{teams.length} đơn vị</span>
                        <span>Tổng VĐV: {filtered.reduce((s, t) => s + t.so_vdv, 0)}</span>
                        <span>♂ {filtered.reduce((s, t) => s + t.nam, 0)} — ♀ {filtered.reduce((s, t) => s + t.nu, 0)}</span>
                    </div>
                </div>
            )}

            {/* ── BULK ACTIONS ── */}
            <AnimatePresence>
                <VCT_BulkActionsBar count={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} actions={[
                    { label: 'Duyệt tất cả', icon: <VCT_Icons.Check size={14} />, onClick: bulkApprove, variant: 'primary' },
                    { label: 'Xóa', icon: <VCT_Icons.Trash size={14} />, onClick: () => showToast('Chức năng xóa hàng loạt đang phát triển', 'error'), variant: 'danger' },
                ]} />
            </AnimatePresence>

            {/* ── ADD/EDIT MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTeam ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'} width="680px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingTeam ? 'Cập nhật' : 'Thêm mới'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên đơn vị *"><VCT_Input value={form.ten} onChange={(e: any) => setForm({ ...form, ten: e.target.value })} placeholder="VD: CLB Võ cổ truyền Bình Định" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã đơn vị *" style={{ flex: 1 }}><VCT_Input value={form.ma} onChange={(e: any) => setForm({ ...form, ma: e.target.value })} placeholder="VD: BD-001" /></VCT_Field>
                        <VCT_Field label="Viết tắt" style={{ flex: 1 }}><VCT_Input value={form.tat} onChange={(e: any) => setForm({ ...form, tat: e.target.value })} placeholder="VD: BĐ" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Loại" style={{ flex: 1 }}><VCT_Select options={[{ value: 'doan_tinh', label: 'Đoàn tỉnh/TP' }, { value: 'clb', label: 'Câu lạc bộ' }, { value: 'ca_nhan', label: 'Cá nhân' }]} value={form.loai} onChange={(v: any) => setForm({ ...form, loai: v })} /></VCT_Field>
                        <VCT_Field label="Tỉnh / TP" style={{ flex: 1 }}><VCT_Input value={form.tinh} onChange={(e: any) => setForm({ ...form, tinh: e.target.value })} placeholder="VD: Bình Định" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Trưởng đoàn" style={{ flex: 1 }}><VCT_Input value={form.truong_doan} onChange={(e: any) => setForm({ ...form, truong_doan: e.target.value })} placeholder="Họ và tên" /></VCT_Field>
                        <VCT_Field label="Số điện thoại" style={{ flex: 1 }}><VCT_Input value={form.sdt} onChange={(e: any) => setForm({ ...form, sdt: e.target.value })} placeholder="0901 234 567" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Email" style={{ flex: 1 }}><VCT_Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></VCT_Field>
                        <VCT_Field label="Địa chỉ" style={{ flex: 1 }}><VCT_Input value={form.dia_chi} onChange={(e: any) => setForm({ ...form, dia_chi: e.target.value })} placeholder="Địa chỉ liên hệ" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Ghi chú"><VCT_Input value={form.ghi_chu} onChange={(e: any) => setForm({ ...form, ghi_chu: e.target.value })} placeholder="Ghi chú (tùy chọn)" /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa đơn vị "${deleteTarget?.ten}"? Hành động này không thể hoàn tác.`}
                preview={deleteTarget && <VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={deleteTarget.ten} size={28} /><span>{deleteTarget.ten} ({deleteTarget.ma})</span></VCT_Stack>}
                confirmLabel="Xóa vĩnh viễn" />
        </div>
    );
};
