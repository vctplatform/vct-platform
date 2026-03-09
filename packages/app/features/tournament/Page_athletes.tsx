'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_KpiCard,
    VCT_Toast, VCT_Modal, VCT_SearchInput, VCT_ConfirmDialog,
    VCT_SegmentedControl, VCT_EmptyState
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { DON_VIS, HANG_CANS, NOI_DUNG_QUYENS, genId } from '../data/mock-data';
import type { VanDongVien, TrangThaiVDV, GioiTinh } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { csvRowsToObjects, downloadTextFile, parseCsvRows, rowsToCsv } from '../data/export-utils';
import { useToast } from '../hooks/use-toast';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

const ST_MAP: Record<TrangThaiVDV, { l: string; t: string }> = {
    du_dieu_kien: { l: 'Đủ điều kiện', t: 'success' },
    cho_xac_nhan: { l: 'Chờ xác nhận', t: 'warning' },
    thieu_ho_so: { l: 'Thiếu hồ sơ', t: 'danger' },
    nhap: { l: 'Nháp', t: 'info' }
};

const DOCS_SCHEMA = [
    { key: 'kham_sk', label: 'Giấy khám SK' },
    { key: 'bao_hiem', label: 'Bảo hiểm y tế' },
    { key: 'anh', label: 'Ảnh 3x4' },
    { key: 'cmnd', label: 'CCCD/Định danh' }
];

const getDoanTen = (id: string) => DON_VIS.find(d => d.id === id)?.ten || 'Không rõ';
const getDKTen = (id?: string) => {
    if (!id) return null;
    const dk = HANG_CANS.find(h => h.id === id);
    if (!dk) return id;
    return `ĐK ${dk.gioi === 'nam' ? 'Nam' : 'Nữ'} ${dk.can_den ? `${dk.can_tu}-${dk.can_den}kg` : `>${dk.can_tu}kg`}`;
};
const getQuyenTen = (id: string) => NOI_DUNG_QUYENS.find(q => q.id === id)?.ten || id;
const calcTuoi = (ns: string) => ns ? new Date().getFullYear() - parseInt(ns.substring(0, 4)) : 0;

const VDV_STATUS_LIST: TrangThaiVDV[] = ['du_dieu_kien', 'cho_xac_nhan', 'thieu_ho_so', 'nhap'];
const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const normalizeString = (value: unknown) => String(value ?? '').trim();
const normalizeNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const normalizeBoolean = (value: unknown) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return ['true', '1', 'x', 'yes', 'co', 'có'].includes(normalized);
};

const pickField = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return value;
        }
    }
    return '';
};

const parseNdQuyen = (value: unknown) => {
    const raw = String(value ?? '').trim();
    if (!raw) return [] as string[];
    return raw
        .split(/[;,|]/g)
        .map(item => item.trim())
        .filter(Boolean);
};

const normalizeDoanId = (rawDoanId: string, rawDoanTen: string) => {
    if (rawDoanId) return rawDoanId;
    const matchedByName = DON_VIS.find(d => d.ten.toLowerCase() === rawDoanTen.toLowerCase());
    return matchedByName?.id || '';
};

const mapImportedAthlete = (item: unknown): VanDongVien | null => {
    const record = asRecord(item);
    if (!record) return null;

    const ho_ten = normalizeString(pickField(record, ['ho_ten', 'hoTen', 'name', 'ten']));
    if (!ho_ten) return null;

    const rawGioi = normalizeString(pickField(record, ['gioi', 'gioi_tinh', 'gender'])).toLowerCase();
    const gioi: GioiTinh = rawGioi === 'nu' || rawGioi === 'nữ' || rawGioi === 'female' ? 'nu' : 'nam';

    const ngay_sinh = normalizeString(pickField(record, ['ngay_sinh', 'ngaySinh', 'dob']));
    const rawDoanId = normalizeString(pickField(record, ['doan_id', 'doanId', 'team_id']));
    const rawDoanTen = normalizeString(pickField(record, ['doan_ten', 'doanTen', 'team_name', 'team']));
    const doan_id = normalizeDoanId(rawDoanId, rawDoanTen);
    const doan_ten = rawDoanTen || getDoanTen(doan_id);

    const rawStatus = normalizeString(pickField(record, ['trang_thai', 'status'])).toLowerCase() as TrangThaiVDV;
    const trang_thai = VDV_STATUS_LIST.includes(rawStatus) ? rawStatus : 'nhap';

    const nd_quyen = parseNdQuyen(pickField(record, ['nd_quyen', 'noi_dung_quyen', 'quyen']));

    return {
        id: normalizeString(pickField(record, ['id', 'ma_vdv'])) || genId('V'),
        ho_ten,
        gioi,
        ngay_sinh,
        tuoi: calcTuoi(ngay_sinh),
        can_nang: normalizeNumber(pickField(record, ['can_nang', 'canNang', 'weight'])),
        chieu_cao: normalizeNumber(pickField(record, ['chieu_cao', 'chieuCao', 'height'])),
        doan_id,
        doan_ten,
        nd_quyen,
        nd_dk: normalizeString(pickField(record, ['nd_dk', 'noi_dung_doi_khang', 'doi_khang'])),
        trang_thai,
        ho_so: {
            kham_sk: normalizeBoolean(pickField(record, ['kham_sk', 'ho_so_kham'])),
            bao_hiem: normalizeBoolean(pickField(record, ['bao_hiem', 'ho_so_bao_hiem'])),
            anh: normalizeBoolean(pickField(record, ['anh', 'ho_so_anh'])),
            cmnd: normalizeBoolean(pickField(record, ['cmnd', 'cccd', 'ho_so_cccd'])),
        },
        ghi_chu: normalizeString(pickField(record, ['ghi_chu', 'note'])),
    };
};

export const Page_athletes = () => {
    const { items: data, setItems: setDataState } = useEntityCollection(repositories.athletes.mock);
    const [search, setSearch] = useState('');
    const [filterDoan, setFilterDoan] = useState('');
    const [filterGioi, setFilterGioi] = useState('all');
    const { toast, showToast, hideToast } = useToast();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // For bulk actions

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<VanDongVien | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const { can, requireAction } = useRouteActionGuard('/athletes', {
        notifyDenied: (message) => showToast(message, 'error')
    });

    const permissions = useMemo(() => ({
        canImport: can('import'),
        canExport: can('export'),
        canUpdate: can('update'),
        canApprove: can('approve'),
        canDelete: can('delete'),
    }), [can]);

    const setData = useCallback((updater: React.SetStateAction<VanDongVien[]>) => {
        setDataState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: VanDongVien[]) => VanDongVien[])(prev)
                : updater;
            void repositories.athletes.mock.replaceAll(next);
            return next;
        });
    }, [setDataState]);

    const downloadImportTemplate = useCallback(() => {
        if (!requireAction('export', 'tải mẫu import')) return;
        const templateRows = [
            {
                id: 'V001',
                ho_ten: 'Nguyen Van A',
                gioi: 'nam',
                ngay_sinh: '2006-01-15',
                can_nang: 52,
                chieu_cao: 168,
                doan_id: 'D01',
                doan_ten: 'Bình Định',
                nd_quyen: 'Q01;Q03',
                nd_dk: 'HC01',
                trang_thai: 'cho_xac_nhan',
                kham_sk: true,
                bao_hiem: true,
                anh: true,
                cmnd: true,
                ghi_chu: '',
            },
        ];
        downloadTextFile('mau-import-vdv.csv', rowsToCsv(templateRows), 'text/csv;charset=utf-8');
        showToast('Đã tải file mẫu import VĐV');
    }, [requireAction, showToast]);

    const openImportPicker = () => {
        if (!requireAction('import', 'import VĐV')) return;
        fileInputRef.current?.click();
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!can('import')) {
            event.target.value = '';
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lowerName = file.name.toLowerCase();
            const rawItems: unknown[] =
                lowerName.endsWith('.json')
                    ? (() => {
                        const parsed = JSON.parse(text);
                        return Array.isArray(parsed) ? parsed : [];
                    })()
                    : csvRowsToObjects(parseCsvRows(text));

            if (rawItems.length === 0) {
                showToast('File import không có dữ liệu hợp lệ', 'error');
                return;
            }

            const imported: VanDongVien[] = [];
            let rejectedCount = 0;
            rawItems.forEach(item => {
                const normalized = mapImportedAthlete(item);
                if (!normalized || !normalized.doan_id) {
                    rejectedCount += 1;
                    return;
                }
                imported.push(normalized);
            });

            if (imported.length === 0) {
                showToast('Không có VĐV hợp lệ để import', 'error');
                return;
            }

            setData(prev => {
                const byId = new Map(prev.map(row => [row.id, row]));
                imported.forEach(row => byId.set(row.id, row));
                return Array.from(byId.values());
            });

            const skippedPart = rejectedCount > 0 ? `, bỏ qua ${rejectedCount} dòng lỗi` : '';
            showToast(`Đã import ${imported.length} VĐV${skippedPart}`, 'success');
        } catch (error) {
            showToast(
                `Không đọc được file import: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
                'error'
            );
        } finally {
            event.target.value = '';
        }
    };

    // Derived states
    const filteredData = useMemo(() => {
        return data.filter(v => {
            const matchSearch = !search || v.ho_ten.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase());
            const matchDoan = !filterDoan || v.doan_id === filterDoan;
            const matchGioi = filterGioi === 'all' || v.gioi === filterGioi;
            return matchSearch && matchDoan && matchGioi;
        });
    }, [data, search, filterDoan, filterGioi]);

    const stats = useMemo(() => {
        const total = data.length;
        const nam = data.filter(d => d.gioi === 'nam').length;
        const nu = data.filter(d => d.gioi === 'nu').length;
        const ok = data.filter(v => v.trang_thai === 'du_dieu_kien').length;
        const pending = data.filter(v => v.trang_thai !== 'du_dieu_kien' && v.trang_thai !== 'nhap').length;
        const avgW = total > 0 ? Math.round(data.reduce((s, v) => s + v.can_nang, 0) / total) : 0;
        return { total, nam, nu, ok, pending, avgW };
    }, [data]);

    // Handlers
    const handleToggleDoc = (id: string, key: keyof VanDongVien['ho_so'], val: boolean) => {
        if (!requireAction('update', 'cập nhật hồ sơ VĐV')) return;
        setData(prev => prev.map(v => {
            if (v.id !== id) return v;
            const newDocs = { ...v.ho_so, [key]: val };
            const count = Object.values(newDocs).filter(Boolean).length;
            let newStatus = v.trang_thai;
            if (count === 4 && newStatus === 'thieu_ho_so') newStatus = 'cho_xac_nhan';
            if (count < 4 && newStatus === 'du_dieu_kien') newStatus = 'thieu_ho_so';
            return { ...v, ho_so: newDocs, trang_thai: newStatus };
        }));
        showToast(val ? 'Đã bổ sung hồ sơ' : 'Đã đánh dấu thiếu', 'info');
    };

    const handleApprove = (id: string) => {
        if (!requireAction('approve', 'duyệt hồ sơ VĐV')) return;
        setData(prev => prev.map(v => v.id === id ? { ...v, trang_thai: 'du_dieu_kien' } : v));
        showToast('Đã xác nhận đủ điều kiện', 'success');
    };

    const handleReject = (id: string) => {
        if (!requireAction('approve', 'chuyển trạng thái hồ sơ VĐV')) return;
        setData(prev => prev.map(v => v.id === id ? { ...v, trang_thai: 'thieu_ho_so' } : v));
        showToast('Đã chuyển sang trạng thái Thiếu Hồ Sơ', 'warning');
    };

    const handleDelete = () => {
        if (!requireAction('delete', 'xóa VĐV')) return;
        if (!deleteTarget) return;
        setData(prev => prev.filter(v => v.id !== deleteTarget.id));
        showToast(`Đã xóa ${deleteTarget.ho_ten}`, 'success');
        setDeleteTarget(null);
    };

    // Bulk Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length) setSelectedIds([]);
        else setSelectedIds(filteredData.map(v => v.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkApprove = () => {
        if (!requireAction('approve', 'duyệt danh sách VĐV')) return;
        if (selectedIds.length === 0) return;
        setData(prev => prev.map(v => selectedIds.includes(v.id) ? { ...v, trang_thai: 'du_dieu_kien' } : v));
        showToast(`Đã duyệt ${selectedIds.length} VĐV`, 'success');
        setSelectedIds([]);
    };

    return (
        <div className="mx-auto max-w-[1200px] pb-24">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* KPI HEADERS */}
            <div className="vct-stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <VCT_KpiCard label="Tổng Võ Sinh" value={stats.total} icon={<VCT_Icons.Users size={24} />} color="#22d3ee" sub={`${stats.nam} Nam - ${stats.nu} Nữ`} />
                <VCT_KpiCard label="Đủ điều kiện y tế" value={stats.ok} icon={<VCT_Icons.Check size={24} />} color="#10b981" />
                <VCT_KpiCard label="Thiếu HS / Chờ duyệt" value={stats.pending} icon={<VCT_Icons.Alert size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Cân nặng trung bình" value={`${stats.avgW}kg`} icon={<VCT_Icons.Activity size={24} />} color="#a78bfa" sub="Phân bổ: 42kg - 85kg" />
            </div>

            {/* TOOLBAR */}
            <VCT_Stack direction="row" gap={16} align="center" className="mb-4 flex-wrap">
                <div className="min-w-[200px] flex-[1_1_250px]">
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm tên, mã VĐV, CCCD..." />
                </div>
                <div className="w-[250px] flex-none">
                    <select
                        value={filterDoan} onChange={(e) => setFilterDoan(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-input)] px-4 py-3 text-sm font-semibold text-[var(--vct-text-primary)] outline-none"
                    >
                        <option value="">Tất cả Đoàn/Thành phố</option>
                        {DON_VIS.map(d => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </select>
                </div>
                <VCT_SegmentedControl
                    options={[{ value: 'all', label: 'Tất cả' }, { value: 'nam', label: `Nam (${stats.nam})` }, { value: 'nu', label: `Nữ (${stats.nu})` }]}
                    value={filterGioi} onChange={setFilterGioi}
                />
                <div className="ml-auto flex items-center gap-2">
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Download size={14} />} onClick={downloadImportTemplate} disabled={!permissions.canExport}>
                        Tải mẫu
                    </VCT_Button>
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Upload size={14} />} onClick={openImportPicker} disabled={!permissions.canImport}>
                        Import CSV/JSON
                    </VCT_Button>
                </div>
            </VCT_Stack>

            {/* BULK ACTION BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: selectedIds.length > 0 ? 'rgba(34, 211, 238, 0.1)' : 'var(--vct-bg-card)', border: `1px solid ${selectedIds.length > 0 ? '#22d3ee' : 'var(--vct-border-subtle)'}`, borderRadius: '16px', marginBottom: '24px', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={filteredData.length > 0 && selectedIds.length === filteredData.length} onChange={toggleSelectAll} style={{ width: 18, height: 18, accentColor: '#22d3ee' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Tất cả ({filteredData.length})</span>
                    </label>
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: '1px solid var(--vct-border-strong)' }}>
                            <VCT_Text style={{ fontWeight: 800, color: '#22d3ee' }}>Đã chọn: {selectedIds.length}</VCT_Text>
                            <VCT_Button onClick={handleBulkApprove} icon={<VCT_Icons.Check size={14} />} style={{ padding: '6px 12px', fontSize: '12px' }} disabled={!permissions.canApprove}>Duyệt nhanh</VCT_Button>
                            <VCT_Button variant="secondary" onClick={() => permissions.canExport ? setShowPrintModal(true) : requireAction('export', 'in thẻ VĐV')} icon={<VCT_Icons.Printer size={14} />} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--vct-bg-input)' }} disabled={!permissions.canExport}>In Thẻ VĐV</VCT_Button>
                        </div>
                    )}
                </div>
            </div>

            {/* LIST */}
            {filteredData.length === 0 ? <VCT_EmptyState title="Không tìm thấy Vận động viên" icon="👤" /> : (
                <div className="flex flex-col gap-3">
                    {filteredData.map((v) => {
                        const isExpanded = expandedId === v.id;
                        const isSelected = selectedIds.includes(v.id);
                        const hd = Object.values(v.ho_so).filter(Boolean).length;
                        return (
                            <div key={v.id} style={{
                                background: 'var(--vct-bg-card)', borderRadius: '16px', border: `1px solid ${isSelected ? '#22d3ee' : 'var(--vct-border-subtle)'}`,
                                overflow: 'hidden', transition: 'all 0.2s',
                                boxShadow: isExpanded || isSelected ? '0 10px 40px rgba(0,0,0,0.1)' : 'none'
                            }}>
                                {/* HEADER ROW */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: '20px',
                                    background: isExpanded || isSelected ? 'rgba(34, 211, 238, 0.05)' : 'transparent'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); toggleSelect(v.id); }} style={{ width: 18, height: 18, accentColor: '#22d3ee', cursor: 'pointer' }} />
                                    </div>
                                    <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 2 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: v.gioi === 'nam' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(244, 114, 182, 0.15)', color: v.gioi === 'nam' ? '#60a5fa' : '#f472b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
                                            {v.ho_ten.charAt(0)}
                                        </div>
                                        <div>
                                            <VCT_Text style={{ fontWeight: 800, fontSize: '15px' }}>{v.ho_ten}</VCT_Text>
                                            <VCT_Text variant="mono" style={{ opacity: 0.5, fontSize: '12px', marginTop: 2 }}>{v.id}</VCT_Text>
                                        </div>
                                    </div>
                                    <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ flex: 1, textAlign: 'center' }}>
                                        <VCT_Text className="font-extrabold">{v.can_nang} <span style={{ opacity: 0.5, fontSize: 11, fontWeight: 500 }}>kg</span></VCT_Text>
                                        <VCT_Text variant="small">{calcTuoi(v.ngay_sinh)} tuổi</VCT_Text>
                                    </div>
                                    <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ flex: 2 }}>
                                        <VCT_Stack direction="row" gap={8} align="center">
                                            <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--vct-accent-cyan)' }} />
                                            <VCT_Text style={{ fontSize: '14px', fontWeight: 600 }}>{getDoanTen(v.doan_id)}</VCT_Text>
                                        </VCT_Stack>
                                    </div>
                                    <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, color: hd === 4 ? '#10b981' : '#f59e0b', background: hd === 4 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                                            Hồ sơ: {hd}/4
                                        </div>
                                    </div>
                                    <div onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ flex: 1.5, textAlign: 'right' }}>
                                        <VCT_Badge text={ST_MAP[v.trang_thai]?.l || '...'} type={ST_MAP[v.trang_thai]?.t as any} />
                                    </div>
                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} style={{ opacity: 0.5 }}><VCT_Icons.Chevron size={20} /></motion.div>
                                </div>

                                {/* EXPANDED METADATA */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ padding: '0 20px 20px' }}>
                                                <div style={{ padding: '24px', background: 'var(--vct-bg-input)', borderRadius: 16, display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(280px, 1.5fr) minmax(250px, 1fr)', gap: 32 }}>

                                                    {/* THÔNG TIN CÁ NHÂN */}
                                                    <div>
                                                        <VCT_Text variant="small" style={{ marginBottom: 12, fontWeight: 700, color: 'var(--vct-text-secondary)', textTransform: 'uppercase' }}>Thông tin nhân trắc</VCT_Text>
                                                        <VCT_Stack gap={10}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid dashed var(--vct-border-subtle)', paddingBottom: 6 }}>
                                                                <span style={{ fontSize: 13, opacity: 0.6 }}>Giới tính</span>
                                                                <span style={{ fontSize: 13, fontWeight: 700, color: v.gioi === 'nam' ? '#60a5fa' : '#f472b6' }}>{v.gioi === 'nam' ? '♂ Nam' : '♀ Nữ'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid dashed var(--vct-border-subtle)', paddingBottom: 6 }}>
                                                                <span style={{ fontSize: 13, opacity: 0.6 }}>Ngày sinh</span>
                                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{v.ngay_sinh}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid dashed var(--vct-border-subtle)', paddingBottom: 6 }}>
                                                                <span style={{ fontSize: 13, opacity: 0.6 }}>Chiều cao</span>
                                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{v.chieu_cao} cm</span>
                                                            </div>
                                                        </VCT_Stack>
                                                    </div>

                                                    {/* ĐĂNG KÝ THI ĐẤU */}
                                                    <div>
                                                        <VCT_Text variant="small" style={{ marginBottom: 12, fontWeight: 700, color: 'var(--vct-text-secondary)', textTransform: 'uppercase' }}>Nội dung đăng ký</VCT_Text>
                                                        <VCT_Stack gap={8}>
                                                            {v.nd_quyen.length > 0 ? v.nd_quyen.map(qid => (
                                                                <div key={qid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--vct-bg-elevated)', borderRadius: 8, border: '1px solid var(--vct-border-subtle)' }}>
                                                                    <span style={{ color: '#22d3ee' }}>🥋</span>
                                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{getQuyenTen(qid)}</span>
                                                                </div>
                                                            )) : <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic' }}>Chưa đăng ký quyền</div>}

                                                            {v.nd_dk ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--vct-bg-elevated)', borderRadius: 8, border: '1px dashed #f59e0b', marginTop: 4 }}>
                                                                    <span style={{ color: '#f59e0b' }}>🥊</span>
                                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{getDKTen(v.nd_dk)}</span>
                                                                </div>
                                                            ) : <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', marginTop: 4 }}>Chưa đăng ký đối kháng</div>}
                                                        </VCT_Stack>
                                                        {v.ghi_chu && (
                                                            <div style={{ marginTop: 12, fontSize: 12, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: 6 }}>
                                                                Chú ý: {v.ghi_chu}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* HỒ SƠ Y TẾ & PHÁP LÝ */}
                                                    <div>
                                                        <VCT_Text variant="small" style={{ marginBottom: 12, fontWeight: 700, color: 'var(--vct-text-secondary)', textTransform: 'uppercase' }}>Hồ sơ cứng ({hd}/4)</VCT_Text>
                                                        <VCT_Stack gap={8}>
                                                            {DOCS_SCHEMA.map(doc => {
                                                                const checked = v.ho_so[doc.key as keyof VanDongVien['ho_so']];
                                                                return (
                                                                    <label key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${checked ? 'rgba(16, 185, 129, 0.3)' : 'var(--vct-border-strong)'}`, background: checked ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                            <input type="checkbox" checked={checked} onChange={(e) => handleToggleDoc(v.id, doc.key as any, e.target.checked)} disabled={!permissions.canUpdate} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                                                                            <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, opacity: checked ? 1 : 0.6 }}>{doc.label}</span>
                                                                        </div>
                                                                        {!checked && <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4 }}>THIẾU</span>}
                                                                    </label>
                                                                )
                                                            })}
                                                        </VCT_Stack>
                                                    </div>
                                                </div>

                                                {/* FOOTER ACTIONS */}
                                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                                    {v.trang_thai === 'du_dieu_kien' ? (
                                                        <VCT_Button variant="secondary" icon={<VCT_Icons.x size={14} />} onClick={() => handleReject(v.id)} style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }} disabled={!permissions.canApprove}>Từ chối / Thiếu HS</VCT_Button>
                                                    ) : (
                                                        <VCT_Button icon={<VCT_Icons.Check size={14} />} onClick={() => handleApprove(v.id)} disabled={!permissions.canApprove}>Xác nhận Đủ Điều Kiện</VCT_Button>
                                                    )}
                                                    <VCT_Button variant="secondary" icon={<VCT_Icons.Trash size={14} />} onClick={() => permissions.canDelete ? setDeleteTarget(v) : requireAction('delete', 'xóa VĐV')} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} disabled={!permissions.canDelete}>Hủy Đăng Ký</VCT_Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* PRINT ID CARD MODAL */}
            <VCT_Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} title="In Thẻ Vận Động Viên" width="800px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowPrintModal(false)}>Đóng</VCT_Button><VCT_Button onClick={() => permissions.canExport ? window.print() : requireAction('export', 'in thẻ VĐV')} icon={<VCT_Icons.Printer size={16} />} disabled={!permissions.canExport}>In {selectedIds.length} thẻ</VCT_Button></>
            }>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: 10, maxHeight: '60vh', overflowY: 'auto' }} className="vct-hide-scrollbar print-only-cards">
                    {data.filter(v => selectedIds.includes(v.id)).map(v => (
                        <div key={v.id} style={{ border: '2px solid var(--vct-accent-cyan)', borderRadius: 12, padding: 16, background: '#fff', color: '#000', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', zIndex: 0 }} />
                            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                <div style={{ fontWeight: 900, fontSize: 15, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>THẺ GIẢI ĐẤU QUỐC GIA</div>
                                <div style={{ width: 80, height: 100, background: '#e5e7eb', margin: '0 auto', border: '3px solid #fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 32, opacity: 0.3 }}>{v.ho_ten.charAt(0)}</span>
                                </div>
                                <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>{v.ho_ten}</div>
                                <div style={{ fontSize: 13, color: '#4b5563', fontWeight: 600, marginTop: 4 }}>{getDoanTen(v.doan_id)}</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, textAlign: 'left', background: '#f3f4f6', padding: 8, borderRadius: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>Mã số</div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1f2937' }}>{v.id}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>Ngày sinh</div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1f2937' }}>{new Date(v.ngay_sinh).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>Hạng cân / Tuổi</div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1f2937' }}>{v.can_nang}kg • {calcTuoi(v.ngay_sinh)} tuổi</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, padding: '4px 0', borderTop: '1px dashed #d1d5db', borderBottom: '1px dashed #d1d5db' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}>VẬN ĐỘNG VIÊN</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .print-only-cards, .print-only-cards * { visibility: visible; }
                        .print-only-cards { position: absolute; left: 0; top: 0; display: block !important; overflow: visible !important; width: 100%; gap: 10px; }
                        .print-only-cards > div { break-inside: avoid; display: inline-block; width: 45%; margin: 10px; }
                        /* Hide app shell */
                        main, nav, header { display: none !important; }
                    }
                `}</style>
            </VCT_Modal>


            {/* DELETE CONFIRM */}
            <VCT_ConfirmDialog
                isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
                title="Xóa Vận Động Viên" message={`Xóa VĐV "${deleteTarget?.ho_ten}" sẽ gỡ bỏ tên khỏi các danh sách thi đấu và không thể khôi phục.`}
                onConfirm={handleDelete} confirmLabel="Xác nhận xóa"
            />
        </div>
    );
};
