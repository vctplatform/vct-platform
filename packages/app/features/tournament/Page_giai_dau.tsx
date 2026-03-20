'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Field, VCT_Input,
    VCT_Select, VCT_Stack, VCT_Toast, VCT_Modal, VCT_Table, VCT_Tabs,
    VCT_ConfirmDialog
} from '../components/vct-ui';
import { VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import type { TournamentConfig, TrangThaiGiai } from '../data/types';
import { useDonVis, useVanDongViens, useTrongTais, useSanDaus } from '../hooks/useTournamentAPI';
import { repositories, useEntityCollection, type TournamentConfigRecord } from '../data/repository';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

const GIAI_STATES: Record<TrangThaiGiai, { l: string; t: string; desc: string }> = {
    nhap: { l: 'Bản nháp', t: 'info', desc: 'Đang thiết lập thông số, chưa công bố' },
    dang_ky: { l: 'Đang đăng ký', t: 'info', desc: 'Cho phép các đoàn gửi danh sách VĐV' },
    khoa_dk: { l: 'Khoá đăng ký', t: 'warning', desc: 'Đóng cổng, chuẩn bị bốc thăm xếp lịch' },
    thi_dau: { l: 'Đang thi đấu', t: 'danger', desc: 'Giải đang diễn ra, các sàn hoạt động' },
    ket_thuc: { l: 'Đã kết thúc', t: 'success', desc: 'Hoàn tất giải, công bố kết quả' }
};

const CAP_DO_LABELS: Record<string, string> = {
    'quoc_gia': 'Quốc gia',
    'khu_vuc': 'Khu vực',
    'tinh': 'Tỉnh/TP',
    'clb': 'Cấp CLB'
};

const toTournamentConfig = (row: TournamentConfigRecord): TournamentConfig => {
    const { id: _id, ...payload } = row;
    return payload;
};

// ── CUSTOM COMPONENTS ──
const CurrencyInput = ({ value, onChange, disabled, placeholder }: { value: number; onChange: (v: number) => void; disabled?: boolean; placeholder?: string }) => {
    // Hiển thị số có dấu chấm phân cách hàng nghìn (VD: 1.000.000)
    const displayValue = value ? new Intl.NumberFormat('vi-VN').format(value) : '';

    const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawString = e.target.value.replace(/[^0-9]/g, ''); // Chỉ giữ số
        const numeric = rawString ? parseInt(rawString, 10) : 0;
        onChange(numeric);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <VCT_Input
                value={displayValue}
                onChange={handleRawChange}
                disabled={disabled}
                placeholder={placeholder}
                style={{ paddingRight: '40px', textAlign: 'right', fontWeight: 600 }}
            />
            <span style={{ position: 'absolute', right: '12px', color: 'var(--vct-text-tertiary)', fontWeight: 500, pointerEvents: 'none' }}>đ</span>
        </div>
    );
};

export const Page_giai_dau = () => {
    const { items: tournamentConfigRows, setItems: setTournamentConfigRows } = useEntityCollection(repositories.tournamentConfig.mock);
    const config = useMemo<TournamentConfig>(() => {
        const row = tournamentConfigRows[0] as TournamentConfigRecord | undefined;
        if (!row) return { ...TOURNAMENT_CONFIG };
        return toTournamentConfig(row);
    }, [tournamentConfigRows]);

    const setConfig = useCallback((updater: React.SetStateAction<TournamentConfig>) => {
        setTournamentConfigRows(prev => {
            const current = (prev[0] as TournamentConfigRecord | undefined) ?? { id: 'TOURNAMENT-2026', ...TOURNAMENT_CONFIG };
            const currentPayload = toTournamentConfig(current);
            const nextPayload = typeof updater === 'function'
                ? (updater as (value: TournamentConfig) => TournamentConfig)(currentPayload)
                : updater;
            const nextRows: TournamentConfigRecord[] = [{ id: current.id || 'TOURNAMENT-2026', ...nextPayload }];
            void repositories.tournamentConfig.mock.replaceAll(nextRows);
            return nextRows;
        });
    }, [setTournamentConfigRows]);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // State for BTC CRUD
    const [btcModal, setBtcModal] = useState({ open: false, isEdit: false, index: -1, data: { ten: '', chuc_vu: '', ban: '', cap: 2, sdt: '', email: '', dv: '' } });
    const [confirmDeleteBtc, setConfirmDeleteBtc] = useState({ open: false, index: -1 });

    const showToast = (msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };
    const { can, requireAction } = useRouteActionGuard('/giai-dau', {
        notifyDenied: (message) => showToast(message, 'error')
    });
    const permissions = useMemo(() => ({
        canUpdate: can('update'),
        canPublish: can('publish'),
    }), [can]);

    // State cho Cấu hình Điểm Xếp Hạng
    const [pointModal, setPointModal] = useState({ open: false, isEdit: false, index: -1, data: { thu_hang: 1, diem: 10 } });
    const [confirmDeletePoint, setConfirmDeletePoint] = useState({ open: false, index: -1 });

    const { data: apiDonVis } = useDonVis();
    const { data: apiVdvs } = useVanDongViens();
    const { data: apiTrongTais } = useTrongTais();
    const { data: apiSanDaus } = useSanDaus();

    const donVis = apiDonVis || [];
    const vdvs = apiVdvs || [];
    const trongTais = apiTrongTais || [];
    const sanDaus = apiSanDaus || [];

    // Live Stats
    const stats = useMemo(() => ({
        doan: donVis.length,
        vdv: vdvs.length,
        trong_tai: trongTais.length,
        san: sanDaus.length,
        san_active: sanDaus.filter(s => s.trang_thai === 'dang_thi_dau').length
    }), [donVis, vdvs, trongTais, sanDaus]);

    const daysUntil = Math.max(0, Math.ceil((new Date(config.ngay_bat_dau).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    const doneChecklist = config.checklist.filter(c => c.done).length;
    const pctReady = Math.round((doneChecklist / Math.max(1, config.checklist.length)) * 100);
    const st = GIAI_STATES[config.trang_thai];

    // Helpers
    const handleChange = (key: keyof TournamentConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };
    const handleNestedChange = (parent: 'quota' | 'le_phi' | 'giai_thuong' | 'y_te' | 'phap_ly' | 'cau_hinh_quyen' | 'cau_hinh_doi_khang' | 'giai_thuong_toan_doan', key: string, value: any) => {
        setConfig(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
    };
    const toggleChecklist = (id: string) => {
        if (!isEditing) return;
        setConfig(prev => ({
            ...prev,
            checklist: prev.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c)
        }));
    };

    const handleSaveBtc = () => {
        if (!requireAction('update', btcModal.isEdit ? 'cập nhật thành viên BTC' : 'thêm thành viên BTC')) return;
        if (!btcModal.data.ten || !btcModal.data.chuc_vu) {
            showToast('Vui lòng nhập họ tên và chức vụ', 'warning');
            return;
        }
        setConfig(prev => {
            const nextBtc = [...prev.btc];
            if (btcModal.isEdit) nextBtc[btcModal.index] = btcModal.data;
            else nextBtc.push(btcModal.data);
            return { ...prev, btc: nextBtc };
        });
        setBtcModal({ open: false, isEdit: false, index: -1, data: { ten: '', chuc_vu: '', ban: '', cap: 2, sdt: '', email: '', dv: '' } });
        showToast(btcModal.isEdit ? 'Đã cập nhật thành viên BTC' : 'Đã thêm thành viên BTC', 'success');
    };

    const handleDeleteBtc = () => {
        if (!requireAction('update', 'xóa thành viên BTC')) return;
        if (confirmDeleteBtc.index === -1) return;
        setConfig(prev => {
            const nextBtc = [...prev.btc];
            nextBtc.splice(confirmDeleteBtc.index, 1);
            return { ...prev, btc: nextBtc };
        });
        setConfirmDeleteBtc({ open: false, index: -1 });
        showToast('Đã xóa thành viên khỏi BTC', 'success');
    };

    const handleSavePoint = () => {
        if (!requireAction('update', pointModal.isEdit ? 'cập nhật cấu hình điểm' : 'thêm cấu hình điểm')) return;
        if (!pointModal.data.thu_hang || !pointModal.data.diem) {
            showToast('Vui lòng nhập cả Thứ hạng và Số điểm', 'warning');
            return;
        }
        setConfig(prev => {
            let nextPoints = [...prev.diem_xep_hang];
            if (pointModal.isEdit) {
                nextPoints[pointModal.index] = pointModal.data;
            } else {
                nextPoints.push(pointModal.data);
            }
            // Sắp xếp lại theo thứ hạng tăng dần
            nextPoints.sort((a, b) => a.thu_hang - b.thu_hang);
            return { ...prev, diem_xep_hang: nextPoints };
        });
        setPointModal({ open: false, isEdit: false, index: -1, data: { thu_hang: 1, diem: 10 } });
        showToast(pointModal.isEdit ? 'Đã cập nhật điểm xếp hạng' : 'Đã thêm điểm xếp hạng', 'success');
    };

    const handleDeletePoint = () => {
        if (!requireAction('update', 'xóa mốc điểm xếp hạng')) return;
        if (confirmDeletePoint.index === -1) return;
        setConfig(prev => {
            const nextPoints = [...prev.diem_xep_hang];
            nextPoints.splice(confirmDeletePoint.index, 1);
            return { ...prev, diem_xep_hang: nextPoints };
        });
        setConfirmDeletePoint({ open: false, index: -1 });
        showToast('Đã xóa mốc điểm xếp hạng', 'success');
    };

    // ── TABS ──
    const renderOverview = () => (
        <VCT_Stack gap={24}>
            {/* THÔNG TIN CƠ BẢN */}
            <VCT_Card title="Thông tin cơ bản">
                <VCT_Stack direction="row" gap={32}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <VCT_Field label="Tên giải đấu *"><VCT_Input value={config.ten_giai} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ten_giai', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Mã giải *" className="flex-1">
                                <VCT_Input value={config.ma_giai} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ma_giai', e.target.value)} disabled={!isEditing} />
                            </VCT_Field>
                            <VCT_Select
                                label="Cấp độ"
                                className="flex-1"
                                options={[
                                    { value: 'quoc_gia', label: 'Quốc gia' },
                                    { value: 'khu_vuc', label: 'Khu vực' },
                                    { value: 'tinh', label: 'Tỉnh/TP' },
                                    { value: 'clb', label: 'Cấp CLB' }
                                ]}
                                value={config.cap_do}
                                onChange={(v: string) => handleChange('cap_do', v)}
                                disabled={!isEditing}
                            />
                        </VCT_Stack>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Năm" className="flex-1"><VCT_Input type="number" value={config.nam} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nam', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Lần thứ" className="flex-1"><VCT_Input type="number" value={config.lan_thu} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('lan_thu', Number(e.target.value))} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="ĐV Tổ chức" className="flex-1"><VCT_Input value={config.dv_to_chuc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dv_to_chuc', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="ĐV Đăng cai" className="flex-1"><VCT_Input value={config.dv_dang_cai} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dv_dang_cai', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Bắt đầu" className="flex-1"><VCT_Input type="date" value={config.ngay_bat_dau} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ngay_bat_dau', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Kết thúc" className="flex-1"><VCT_Input type="date" value={config.ngay_ket_thuc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ngay_ket_thuc', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Hạn đăng ký" className="flex-1"><VCT_Input type="date" value={config.ngay_dk_cuoi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('ngay_dk_cuoi', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Địa điểm" style={{ flex: 2 }}><VCT_Input value={config.dia_diem} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dia_diem', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Tỉnh/TP" className="flex-1"><VCT_Input value={config.tinh} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('tinh', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                        <VCT_Field label="Địa chỉ cụ thể"><VCT_Input value={config.dia_chi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dia_chi', e.target.value)} disabled={!isEditing} placeholder="Số nhà, đường, phường/xã..." /></VCT_Field>
                        <VCT_Field label="Link Điều lệ mẫu (PDF/Docx)"><VCT_Input value={config.link_dieu_le} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('link_dieu_le', e.target.value)} disabled={!isEditing} placeholder="https://..." /></VCT_Field>
                    </div>
                </VCT_Stack>
            </VCT_Card>



            {/* ROW 2: QUY ĐỊNH KỸ THUẬT (3 Cột) */}
            < VCT_Stack direction="row" gap={24} >
                {/* CỘT 1: QUOTA */}
                < VCT_Card title="Quy định số lượng (Quota)" className="flex-1">
                    <VCT_Stack gap={16}>
                        <VCT_Field label="Tối đa Đoàn tham dự"><VCT_Input type="number" value={config.quota.max_doan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('quota', 'max_doan', Number(e.target.value))} disabled={!isEditing} /></VCT_Field>
                        <VCT_Field label="Số VĐV tối đa/Đoàn"><VCT_Input type="number" value={config.quota.max_vdv_per_doan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('quota', 'max_vdv_per_doan', Number(e.target.value))} disabled={!isEditing} /></VCT_Field>
                        <VCT_Field label="Nội dung/VĐV (thường 2/3/5)"><VCT_Input type="number" value={config.quota.max_nd_per_vdv} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('quota', 'max_nd_per_vdv', Number(e.target.value))} disabled={!isEditing} /></VCT_Field>
                        <VCT_Field label="Số HLV tối đa/Đoàn"><VCT_Input type="number" value={config.quota.max_hlv_per_doan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('quota', 'max_hlv_per_doan', Number(e.target.value))} disabled={!isEditing} /></VCT_Field>
                    </VCT_Stack>
                </VCT_Card >

                {/* CỘT 2: CHUYÊN MÔN QUYỀN */}
                < VCT_Card title="Chuyên môn Quyền" className="flex-1">
                    <VCT_Stack gap={16}>
                        <VCT_Field label="Hình thức tổ chức/Tính hạng">
                            <VCT_Select
                                options={[
                                    { value: 'theo_diem', label: 'Cộng điểm xếp hạng (truyền thống)' },
                                    { value: 'dau_loai_ban_ket', label: 'Top 4 đấu loại trực tiếp' }
                                ]}
                                value={config.cau_hinh_quyen.hinh_thuc}
                                onChange={(v: string) => handleNestedChange('cau_hinh_quyen', 'hinh_thuc', v)}
                                disabled={!isEditing}
                            />
                        </VCT_Field>
                        <VCT_Field label="Số lượng Giám định chấm">
                            <VCT_Select
                                options={[
                                    { value: 5, label: '5 Giám định (Bỏ cao/thấp lấy TB 3)' },
                                    { value: 7, label: '7 Giám định (Bỏ cao/thấp lấy TB 5)' }
                                ]}
                                value={String(config.cau_hinh_quyen.so_giam_dinh)}
                                onChange={(v: string) => handleNestedChange('cau_hinh_quyen', 'so_giam_dinh', Number(v))}
                                disabled={!isEditing}
                            />
                        </VCT_Field>
                    </VCT_Stack>
                </VCT_Card >

                {/* CỘT 3: CHUYÊN MÔN ĐỐI KHÁNG */}
                < VCT_Card title="Chuyên môn Đối kháng" className="flex-1">
                    <VCT_Stack gap={16}>
                        <VCT_Field label="Cơ cấu Huy chương Đồng">
                            <VCT_Select
                                options={[
                                    { value: 'true', label: 'Đồng hạng 3 (Trao 2 HCĐ)' },
                                    { value: 'false', label: 'Tranh hạng 3 (Trao 1 HCĐ)' }
                                ]}
                                value={String(config.cau_hinh_doi_khang.dong_huy_chuong_dong)}
                                onChange={(v: string) => handleNestedChange('cau_hinh_doi_khang', 'dong_huy_chuong_dong', v === 'true')}
                                disabled={!isEditing}
                            />
                        </VCT_Field>
                        <VCT_Field label="Số lượng Giám định Góc">
                            <VCT_Select
                                options={[{ value: 3, label: '3 Giám định' }, { value: 5, label: '5 Giám định' }]}
                                value={String(config.cau_hinh_doi_khang.so_giam_dinh)}
                                onChange={(v: string) => handleNestedChange('cau_hinh_doi_khang', 'so_giam_dinh', Number(v))}
                                disabled={!isEditing}
                            />
                        </VCT_Field>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Hiệp đấu (giây)" className="flex-1">
                                <VCT_Input type="number" value={config.cau_hinh_doi_khang.thoi_gian_hiep} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('cau_hinh_doi_khang', 'thoi_gian_hiep', Number(e.target.value))} disabled={!isEditing} />
                            </VCT_Field>
                            <VCT_Field label="Nghỉ (giây)" className="flex-1">
                                <VCT_Input type="number" value={config.cau_hinh_doi_khang.thoi_gian_nghi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('cau_hinh_doi_khang', 'thoi_gian_nghi', Number(e.target.value))} disabled={!isEditing} />
                            </VCT_Field>
                        </VCT_Stack>
                    </VCT_Stack>
                </VCT_Card >
            </VCT_Stack >

            {/* ROW 3: TÀI CHÍNH & GIẢI THƯỞNG & PHÁP LÝ */}
            < VCT_Stack direction="row" gap={24} >
                {/* CỘT 1: LỆ PHÍ */}
                < VCT_Card title="Lệ phí Tổ chức" className="flex-1">
                    <VCT_Stack gap={16}>
                        <VCT_Field label="Lệ phí Đoàn"><CurrencyInput value={config.le_phi.doan} onChange={(v: number) => handleNestedChange('le_phi', 'doan', v)} disabled={!isEditing} /></VCT_Field>
                        <VCT_Field label="Lệ phí / Nội dung"><CurrencyInput value={config.le_phi.noi_dung} onChange={(v: number) => handleNestedChange('le_phi', 'noi_dung', v)} disabled={!isEditing} /></VCT_Field>
                        <VCT_Field label="Lệ phí Thẻ VĐV / thẻ"><CurrencyInput value={config.le_phi.vdv} onChange={(v: number) => handleNestedChange('le_phi', 'vdv', v)} disabled={!isEditing} /></VCT_Field>
                    </VCT_Stack>
                </VCT_Card >

                {/* CỘT 2: CƠ CẤU GIẢI THƯỞNG */}
                < VCT_Card title="Cơ cấu Giải thưởng" className="flex-1">
                    <VCT_Stack gap={16}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Thưởng Cá nhân</div>
                        <VCT_Stack direction="row" gap={12}>
                            <VCT_Field label="🥇 Vàng"><CurrencyInput value={config.giai_thuong.hcv} onChange={(v: number) => handleNestedChange('giai_thuong', 'hcv', v)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="🥈 Bạc"><CurrencyInput value={config.giai_thuong.hcb} onChange={(v: number) => handleNestedChange('giai_thuong', 'hcb', v)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="🥉 Đồng"><CurrencyInput value={config.giai_thuong.hcd} onChange={(v: number) => handleNestedChange('giai_thuong', 'hcd', v)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Thưởng Toàn đoàn</div>
                        <VCT_Stack direction="row" gap={12}>
                            <VCT_Field label="🏆 Nhất"><CurrencyInput value={config.giai_thuong_toan_doan.nhat} onChange={(v: number) => handleNestedChange('giai_thuong_toan_doan', 'nhat', v)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="🏆 Nhì"><CurrencyInput value={config.giai_thuong_toan_doan.nhi} onChange={(v: number) => handleNestedChange('giai_thuong_toan_doan', 'nhi', v)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="🏆 Ba"><CurrencyInput value={config.giai_thuong_toan_doan.ba} onChange={(v: number) => handleNestedChange('giai_thuong_toan_doan', 'ba', v)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                    </VCT_Stack>
                </VCT_Card >

                {/* CỘT 3: Y TẾ & PHÁP LÝ */}
                < VCT_Card title="Y tế & Pháp lý" className="flex-1">
                    <VCT_Stack gap={16}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Hỗ trợ Y tế</div>
                        <VCT_Field label="Bệnh viện trực tuyến & Khoảng cách">
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 2 }}><VCT_Input value={config.y_te.benh_vien} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('y_te', 'benh_vien', e.target.value)} disabled={!isEditing} placeholder="Tên BV..." /></div>
                                <div className="flex-1"><VCT_Input value={config.y_te.bv_kc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('y_te', 'bv_kc', e.target.value)} disabled={!isEditing} placeholder="Khoảng cách..." /></div>
                            </div>
                        </VCT_Field>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Hotline cấp cứu"><VCT_Input value={config.y_te.bv_sdt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('y_te', 'bv_sdt', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Đội ngũ sơ cứu"><VCT_Input value={config.y_te.doi_y_te} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('y_te', 'doi_y_te', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Pháp lý</div>
                        <VCT_Stack direction="row" gap={16}>
                            <VCT_Field label="Quyết định tổ chức"><VCT_Input value={config.phap_ly.qd_to_chuc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('phap_ly', 'qd_to_chuc', e.target.value)} disabled={!isEditing} /></VCT_Field>
                            <VCT_Field label="Bảo hiểm VĐV"><VCT_Input value={config.phap_ly.bao_hiem} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('phap_ly', 'bao_hiem', e.target.value)} disabled={!isEditing} /></VCT_Field>
                        </VCT_Stack>
                    </VCT_Stack>
                </VCT_Card >
            </VCT_Stack >

            {/* ROW 4: HỆ THỐNG XẾP HẠNG TOÀN ĐOÀN */}
            <VCT_Card>
                <VCT_Stack direction="row" justify="space-between" align="start" className="mb-4">
                    <div>
                        <VCT_Text variant="h2" style={{ marginBottom: 4 }}>Phương thức Xếp hạng Toàn đoàn</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)' }}>
                            Hệ thống sẽ dựa vào cấu hình này để tổng hợp xếp hạng chung cuộc cho các đơn vị tham gia.
                        </VCT_Text>
                    </div>
                    <VCT_Stack direction="row" gap={8} style={{ background: 'var(--vct-bg-input)', padding: 4, borderRadius: 8, border: '1px solid var(--vct-border-subtle)' }}>
                        <button
                            disabled={!isEditing}
                            onClick={() => handleChange('cach_tinh_diem_toan_doan', 'theo_huy_chuong')}
                            style={{
                                padding: '8px 16px', borderRadius: 6, border: 'none', cursor: isEditing ? 'pointer' : 'not-allowed',
                                background: config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? 'var(--vct-surface-overlay)' : 'transparent',
                                color: config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                                fontWeight: config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? 600 : 500,
                                boxShadow: config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <VCT_Stack direction="row" gap={8} align="center">
                                <VCT_Icons.Award size={16} color={config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? '#f59e0b' : 'currentColor'} />
                                Theo Huy Chương
                            </VCT_Stack>
                        </button>
                        <button
                            disabled={!isEditing}
                            onClick={() => handleChange('cach_tinh_diem_toan_doan', 'theo_diem')}
                            style={{
                                padding: '8px 16px', borderRadius: 6, border: 'none', cursor: isEditing ? 'pointer' : 'not-allowed',
                                background: config.cach_tinh_diem_toan_doan === 'theo_diem' ? 'var(--vct-surface-overlay)' : 'transparent',
                                color: config.cach_tinh_diem_toan_doan === 'theo_diem' ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                                fontWeight: config.cach_tinh_diem_toan_doan === 'theo_diem' ? 600 : 500,
                                boxShadow: config.cach_tinh_diem_toan_doan === 'theo_diem' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <VCT_Stack direction="row" gap={8} align="center">
                                <VCT_Icons.CheckCircle size={16} color={config.cach_tinh_diem_toan_doan === 'theo_diem' ? '#10b981' : 'currentColor'} />
                                Tính Điểm
                            </VCT_Stack>
                        </button>
                    </VCT_Stack>
                </VCT_Stack>

                {config.cach_tinh_diem_toan_doan === 'theo_huy_chuong' ? (
                    <div style={{ padding: '24px', background: 'var(--vct-bg-input)', borderRadius: 12, border: '1px solid var(--vct-border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <VCT_Icons.Award size={32} color="#f59e0b" />
                        </div>
                        <div>
                            <VCT_Text style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Xếp hạng theo Chỉ số Huy Chương</VCT_Text>
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)' }}>
                                Hệ thống sẽ tự động xếp hạng toàn đoàn dựa trên số lượng Huy chương Vàng. Nếu bằng nhau sẽ xét đến Bạc, và cuối cùng là Đồng.
                            </VCT_Text>
                        </div>
                    </div>
                ) : (
                    <div style={{ borderTop: '1px solid var(--vct-border-subtle)', paddingTop: 16, marginTop: 8 }}>
                        <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)', fontWeight: 500 }}>
                                Cấu hình mức điểm tương ứng cho từng loại thứ hạng
                            </VCT_Text>
                            {isEditing && (
                                <VCT_Button
                                    variant="secondary"
                                    icon={<VCT_Icons.Plus size={16} />}
                                    onClick={() => permissions.canUpdate
                                        ? setPointModal({ open: true, isEdit: false, index: -1, data: { thu_hang: (config.diem_xep_hang?.length || 0) + 1, diem: 0 } })
                                        : requireAction('update', 'thêm cấu hình điểm')}
                                    disabled={!permissions.canUpdate}
                                >
                                    Thêm cấu hình
                                </VCT_Button>
                            )}
                        </VCT_Stack>

                        {config.diem_xep_hang && config.diem_xep_hang.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {config.diem_xep_hang.map((pt, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', background: 'var(--vct-bg-input)',
                                        border: '1px solid var(--vct-border-subtle)', borderRadius: 12, padding: '8px 16px', gap: 12
                                    }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%', background: pt.thu_hang === 1 ? '#f59e0b' : pt.thu_hang === 2 ? '#94a3b8' : pt.thu_hang === 3 ? '#d97706' : 'var(--vct-border-strong)',
                                            color: pt.thu_hang <= 3 ? '#fff' : 'var(--vct-text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 13, fontWeight: 800
                                        }}>
                                            {pt.thu_hang}
                                        </div>
                                        <div>
                                            <VCT_Text style={{ fontWeight: 800, fontSize: 16 }}>{pt.diem} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--vct-text-secondary)' }}>điểm</span></VCT_Text>
                                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hạng {pt.thu_hang}</div>
                                        </div>
                                        {isEditing && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12, paddingLeft: 12, borderLeft: '1px solid var(--vct-border-subtle)' }}>
                                                <button
                                                    onClick={() => permissions.canUpdate
                                                        ? setPointModal({ open: true, isEdit: true, index: idx, data: { ...pt } })
                                                        : requireAction('update', 'chỉnh sửa cấu hình điểm')}
                                                    style={{ background: 'none', border: 'none', color: 'var(--vct-text-tertiary)', cursor: permissions.canUpdate ? 'pointer' : 'not-allowed', padding: 2, opacity: permissions.canUpdate ? 1 : 0.5 }}
                                                    aria-label="Chỉnh sửa cấu hình điểm"
                                                    disabled={!permissions.canUpdate}
                                                >
                                                    <VCT_Icons.Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => permissions.canUpdate
                                                        ? setConfirmDeletePoint({ open: true, index: idx })
                                                        : requireAction('update', 'xóa cấu hình điểm')}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: permissions.canUpdate ? 'pointer' : 'not-allowed', padding: 2, opacity: permissions.canUpdate ? 1 : 0.5 }}
                                                    aria-label="Xóa cấu hình điểm"
                                                    disabled={!permissions.canUpdate}
                                                >
                                                    <VCT_Icons.Trash size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--vct-bg-input)', borderRadius: 12, border: '1px dashed var(--vct-border-strong)' }}>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>Chưa có cấu hình điểm nào. Vui lòng thêm mốc điểm để tự tính xếp hạng đoàn.</VCT_Text>
                            </div>
                        )}
                    </div>
                )}
            </VCT_Card>
        </VCT_Stack>
    );

    const renderBTC = () => (
        <VCT_Stack gap={24}>
            <VCT_Stack direction="row" justify="space-between" align="center">
                <VCT_Text variant="h2">Danh sách Ban Tổ Chức ({config.btc.length} thành viên)</VCT_Text>
                {isEditing && (
                    <VCT_Button
                        icon={<VCT_Icons.Plus size={16} />}
                        onClick={() => permissions.canUpdate
                            ? setBtcModal({ open: true, isEdit: false, index: -1, data: { ten: '', chuc_vu: '', ban: '', cap: 2, sdt: '', email: '', dv: '' } })
                            : requireAction('update', 'thêm thành viên BTC')}
                        disabled={!permissions.canUpdate}
                    >
                        Thêm thành viên
                    </VCT_Button>
                )}
            </VCT_Stack>
            <VCT_Table data={config.btc} columns={[
                { key: 'chuc_vu', label: 'Chức vụ', render: (r: (typeof config.btc)[number]) => <VCT_Text style={{ fontWeight: 700, color: r.cap === 1 ? 'var(--vct-accent-cyan)' : 'inherit' }}>{r.chuc_vu}</VCT_Text> },
                { key: 'ten', label: 'Họ và tên', render: (r: (typeof config.btc)[number]) => <VCT_Text className="font-bold">{r.ten}</VCT_Text> },
                { key: 'dv', label: 'Đơn vị / Chuyên môn' },
                { key: 'sdt', label: 'Liên hệ', render: (r: (typeof config.btc)[number]) => <VCT_Text variant="mono">{r.sdt} <span style={{ opacity: 0.4 }}>|</span> {r.email}</VCT_Text> },
                {
                    key: 'actions', label: '', align: 'right', render: (r: (typeof config.btc)[number], idx: number) => isEditing ? (
                        <VCT_Stack direction="row" gap={8} justify="flex-end">
                            <button
                                onClick={() => permissions.canUpdate
                                    ? setBtcModal({ open: true, isEdit: true, index: idx, data: { ...r } })
                                    : requireAction('update', 'chỉnh sửa thành viên BTC')}
                                style={{ background: 'none', border: 'none', color: 'var(--vct-text-tertiary)', cursor: permissions.canUpdate ? 'pointer' : 'not-allowed', opacity: permissions.canUpdate ? 1 : 0.5 }}
                                aria-label="Chỉnh sửa thành viên BTC"
                                disabled={!permissions.canUpdate}
                            >
                                <VCT_Icons.Edit size={16} />
                            </button>
                            <button
                                onClick={() => permissions.canUpdate
                                    ? setConfirmDeleteBtc({ open: true, index: idx })
                                    : requireAction('update', 'xóa thành viên BTC')}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: permissions.canUpdate ? 'pointer' : 'not-allowed', opacity: permissions.canUpdate ? 1 : 0.5 }}
                                aria-label="Xóa thành viên BTC"
                                disabled={!permissions.canUpdate}
                            >
                                <VCT_Icons.Trash size={16} />
                            </button>
                        </VCT_Stack>
                    ) : null
                }
            ]} />
        </VCT_Stack>
    );

    const renderActivity = () => (
        <VCT_Stack gap={24} direction="row">
            {/* CHECKLIST */}
            <div className="flex-1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <VCT_Text variant="h2">Checklist Tổ chức</VCT_Text>
                    <VCT_Badge text={`${doneChecklist}/${config.checklist.length} Hoàn tất`} type={pctReady === 100 ? 'success' : 'warning'} />
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                    {config.checklist.map(ck => (
                        <label key={ck.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--vct-bg-elevated)', borderRadius: 12, border: `1px solid ${ck.done ? 'var(--vct-border-subtle)' : 'var(--vct-border-strong)'}`, cursor: isEditing ? 'pointer' : 'default', opacity: isEditing ? 1 : 0.8 }}>
                            <input type="checkbox" checked={ck.done} onChange={() => toggleChecklist(ck.id)} disabled={!isEditing} style={{ width: 18, height: 18, accentColor: '#22d3ee' }} />
                            <span style={{ fontSize: 13, fontWeight: ck.done ? 500 : 700, textDecoration: ck.done ? 'line-through' : 'none', opacity: ck.done ? 0.6 : 1 }}>{ck.label}</span>
                            {ck.done && <VCT_Icons.Check size={16} color="#10b981" style={{ marginLeft: 'auto' }} />}
                        </label>
                    ))}
                </div>
            </div>

            <div style={{ width: 1, background: 'var(--vct-border-subtle)' }} />

            {/* AUDIT LOG */}
            <div className="flex-1">
                <VCT_Text variant="h2" style={{ marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--vct-border-subtle)' }}>Lịch sử hoạt động</VCT_Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', paddingLeft: 8 }}>
                    <div style={{ position: 'absolute', top: 12, bottom: 12, left: 14, width: 2, background: 'linear-gradient(to bottom, var(--vct-border-strong), transparent)' }} />
                    {[...config.audit].reverse().map((a, i) => (
                        <div key={i} style={{ display: 'flex', gap: 20, position: 'relative', zIndex: 1, alignItems: 'flex-start' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 8, background: i === 0 ? 'var(--vct-bg-card)' : 'var(--vct-bg-elevated)', border: `3px solid ${i === 0 ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)'}`, marginTop: 4, boxShadow: i === 0 ? '0 0 10px rgba(34, 211, 238, 0.4)' : 'none' }} />
                            <div style={{ padding: '12px 16px', background: i === 0 ? 'rgba(34, 211, 238, 0.05)' : 'var(--vct-bg-elevated)', borderRadius: 12, border: `1px solid ${i === 0 ? 'rgba(34, 211, 238, 0.2)' : 'var(--vct-border-subtle)'}`, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--vct-text-primary)' : 'var(--vct-text-secondary)', marginBottom: 6 }}>{a.action}</div>
                                <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <VCT_Icons.Clock size={12} /> <span style={{ fontFamily: 'monospace' }}>{a.time}</span>
                                    <span>•</span>
                                    <span>bởi <strong style={{ color: 'var(--vct-text-secondary)' }}>{a.by}</strong></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </VCT_Stack>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* 1. HERO BANNER */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                    padding: '40px', borderRadius: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #d1d5db 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', opacity: 0.1, backgroundImage: 'radial-gradient(circle at 80% 20%, #ffffff, transparent 70%)' }} />

                <VCT_Stack direction="row" justify="space-between" align="flex-start" style={{ position: 'relative', zIndex: 1 }}>
                    <div>
                        <VCT_Stack direction="row" gap={12} align="center" style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '32px' }}>🏆</span>
                            <VCT_Badge text={st.l} type={st.t as 'info' | 'success' | 'warning' | 'danger'} pulse={config.trang_thai === 'dang_ky' || config.trang_thai === 'thi_dau'} />
                            <VCT_Badge text={`Cấp ${CAP_DO_LABELS[config.cap_do] || config.cap_do}`} type="info" pulse={false} style={{ paddingLeft: '24px', paddingRight: '24px' }} />
                        </VCT_Stack>

                        <VCT_Text variant="h1" style={{ marginBottom: '8px', color: '#1e293b' }}>{config.ten_giai}</VCT_Text>
                        <VCT_Text variant="mono" style={{ opacity: 0.6, marginBottom: '16px', color: '#475569' }}>{config.ma_giai}</VCT_Text>

                        <VCT_Stack direction="row" gap={16} style={{ color: '#475569', fontWeight: 500 }}>
                            <VCT_Stack direction="row" gap={6} align="center"><VCT_Icons.MapPin size={14} /> <VCT_Text variant="small">{config.dia_diem}, {config.tinh}</VCT_Text></VCT_Stack>
                            <VCT_Stack direction="row" gap={6} align="center"><VCT_Icons.Clock size={14} /> <VCT_Text variant="small">{config.ngay_bat_dau} → {config.ngay_ket_thuc}</VCT_Text></VCT_Stack>
                        </VCT_Stack>
                    </div>

                    <VCT_Stack align="flex-end" gap={20}>
                        {daysUntil > 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 40px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                <VCT_Text variant="small" style={{ letterSpacing: '0.15em', marginBottom: '4px', color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>Khai mạc sau</VCT_Text>
                                <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: '#1e293b', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.05))' }}>
                                    {daysUntil} <span style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>ngày</span>
                                </div>
                            </div>
                        )}
                        <VCT_Button
                            variant={isEditing ? "primary" : "secondary"}
                            icon={isEditing ? <VCT_Icons.Check size={16} /> : <VCT_Icons.Settings size={16} />}
                            onClick={() => {
                                if (!permissions.canUpdate) {
                                    requireAction('update', isEditing ? 'lưu cấu hình giải đấu' : 'thiết lập giải đấu');
                                    return;
                                }
                                if (isEditing) {
                                    showToast('Đã lưu cấu hình giải đấu');
                                    setConfig(prev => ({ ...prev, audit: [...prev.audit, { time: new Date().toLocaleString('vi-VN'), action: 'Cập nhật cấu hình', by: 'Admin' }] }));
                                }
                                setIsEditing(!isEditing);
                            }}
                            disabled={!permissions.canUpdate}
                        >
                            {isEditing ? "Lưu cấu hình" : "Thiết lập giải"}
                        </VCT_Button>
                    </VCT_Stack>
                </VCT_Stack>
            </motion.div>

            {/* 2. LIVE STATS */}
            <VCT_StatRow items={[
                { label: 'Đoàn tham dự', value: stats.doan, icon: <VCT_Icons.Users size={18} />, color: '#22d3ee', sub: `Quota: ${config.quota.max_doan}` },
                { label: 'Vận động viên', value: stats.vdv, icon: <VCT_Icons.User size={18} />, color: '#f59e0b' },
                { label: 'Trọng tài', value: stats.trong_tai, icon: <VCT_Icons.Shield size={18} />, color: '#10b981' },
                { label: 'Sàn đang đấu', value: `${stats.san_active}/${stats.san}`, icon: <VCT_Icons.Columns size={18} />, color: '#a78bfa' },
            ] as StatItem[]} className="mb-6" />

            {/* 3. TABS CONTENT */}
            <VCT_Tabs tabs={[
                { key: 'overview', label: 'Thông số chung' },
                { key: 'btc', label: `Ban Tổ Chức (${config.btc.length})` },
                { key: 'activity', label: 'Hoạt động & Checklist' },
            ]} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'btc' && renderBTC()}
                {activeTab === 'activity' && renderActivity()}
            </div>

            {/* FLOATING ACTION BAR (Trạng thái) */}
            <div style={{
                position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
                background: 'var(--vct-bg-elevated)', borderRadius: '20px', border: '1px solid var(--vct-border-strong)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(24px)'
            }}>
                <VCT_Stack direction="row" align="center" gap={12}>
                    <VCT_Text variant="small">Tình trạng hệ thống:</VCT_Text>
                    <VCT_Badge text={st.l} type={st.t as 'info' | 'success' | 'warning' | 'danger'} pulse={config.trang_thai === 'dang_ky' || config.trang_thai === 'thi_dau'} />
                </VCT_Stack>
                <div style={{ width: 1, height: 24, background: 'var(--vct-border-subtle)' }} />
                <VCT_Button
                    variant="primary"
                    onClick={() => permissions.canPublish ? setShowStatusModal(true) : requireAction('publish', 'chuyển trạng thái hệ thống')}
                    disabled={!permissions.canPublish}
                >
                    Chuyển đổi
                </VCT_Button>
            </div>

            {/* MODAL TRẠNG THÁI */}
            <VCT_Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Chuyển trạng thái hệ thống" width="500px">
                <VCT_Stack gap={12}>
                    {(Object.keys(GIAI_STATES) as TrangThaiGiai[]).map(k => (
                        <div key={k} onClick={() => {
                            if (!permissions.canPublish) {
                                requireAction('publish', 'chuyển trạng thái hệ thống');
                                return;
                            }
                            if (config.trang_thai === k) return;
                            setConfig(prev => ({
                                ...prev, trang_thai: k,
                                audit: [...prev.audit, { time: new Date().toLocaleString('vi-VN'), action: `Chuyển hệ thống → ${GIAI_STATES[k].l}`, by: 'Admin' }]
                            }));
                            showToast(`Đã chuyển hệ thống sang: ${GIAI_STATES[k].l}`, 'success');
                            setShowStatusModal(false);
                        }} style={{
                            padding: '16px', borderRadius: '12px', cursor: config.trang_thai === k ? 'default' : 'pointer',
                            border: `2px solid ${config.trang_thai === k ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)'}`,
                            background: config.trang_thai === k ? 'rgba(34, 211, 238, 0.05)' : 'var(--vct-bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            opacity: permissions.canPublish ? (config.trang_thai === k ? 1 : 0.6) : 0.4,
                            transition: 'all 0.2s'
                        }}>
                            <div>
                                <VCT_Text variant="h2" style={{ color: config.trang_thai === k ? 'var(--vct-accent-cyan)' : 'inherit', marginBottom: 4 }}>{GIAI_STATES[k].l}</VCT_Text>
                                <VCT_Text variant="small">{GIAI_STATES[k].desc}</VCT_Text>
                            </div>
                            {config.trang_thai === k && <VCT_Icons.Check color="var(--vct-accent-cyan)" />}
                        </div>
                    ))}
                </VCT_Stack>
            </VCT_Modal>

            {/* MODAL THÊM/SỬA BTC */}
            <VCT_Modal isOpen={btcModal.open} onClose={() => setBtcModal(prev => ({ ...prev, open: false }))} title={btcModal.isEdit ? "Sửa thành viên BTC" : "Thêm thành viên BTC"} width="600px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setBtcModal(prev => ({ ...prev, open: false }))}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSaveBtc} disabled={!permissions.canUpdate}>{btcModal.isEdit ? "Cập nhật" : "Lưu thành viên"}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Stack direction="row" gap={16}>
                        <div className="flex-1">
                            <VCT_Field label="Họ và tên *"><VCT_Input value={btcModal.data.ten} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBtcModal(p => ({ ...p, data: { ...p.data, ten: e.target.value } }))} placeholder="Nhập họ và tên..." /></VCT_Field>
                        </div>
                        <div className="flex-1">
                            <VCT_Field label="Chức vụ *"><VCT_Input value={btcModal.data.chuc_vu} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBtcModal(p => ({ ...p, data: { ...p.data, chuc_vu: e.target.value } }))} placeholder="Trưởng ban, Phó ban..." /></VCT_Field>
                        </div>
                    </VCT_Stack>
                    <VCT_Field label="Đơn vị / Chuyên môn"><VCT_Input value={btcModal.data.dv} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBtcModal(p => ({ ...p, data: { ...p.data, dv: e.target.value } }))} placeholder="Cơ quan công tác..." /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <div className="flex-1">
                            <VCT_Field label="Số điện thoại"><VCT_Input value={btcModal.data.sdt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBtcModal(p => ({ ...p, data: { ...p.data, sdt: e.target.value } }))} placeholder="090..." /></VCT_Field>
                        </div>
                        <div className="flex-1">
                            <VCT_Field label="Email"><VCT_Input value={btcModal.data.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBtcModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))} placeholder="abc@email.com" /></VCT_Field>
                        </div>
                    </VCT_Stack>
                    <div style={{ width: '50%' }}>
                        <VCT_Field label="Cấp bậc">
                            <VCT_Select options={[{ value: 1, label: 'Thành viên cốt cán (Cấp 1)' }, { value: 2, label: 'Thành viên thường (Cấp 2)' }]} value={btcModal.data.cap} onChange={(v: string) => setBtcModal(p => ({ ...p, data: { ...p.data, cap: Number(v) } }))} />
                        </VCT_Field>
                    </div>
                </VCT_Stack>
            </VCT_Modal>

            {/* XÁC NHẬN XÓA BTC */}
            <VCT_ConfirmDialog
                isOpen={confirmDeleteBtc.open}
                onClose={() => setConfirmDeleteBtc({ open: false, index: -1 })}
                onConfirm={handleDeleteBtc}
                title="Xóa thành viên"
                message="Bạn có chắc chắn muốn xóa thành viên này khỏi Ban tổ chức giải? Hành động này không thể hoàn tác."
                confirmLabel="Xóa thành viên"
            />
            {/* XÁC NHẬN XÓA ĐIỂM XẾP HẠNG */}
            <VCT_ConfirmDialog
                isOpen={confirmDeletePoint.open}
                onClose={() => setConfirmDeletePoint({ open: false, index: -1 })}
                onConfirm={handleDeletePoint}
                title="Xóa mốc điểm xếp hạng"
                message="Bạn có chắc chắn muốn xóa mốc điểm xếp hạng này? Nó có thể ảnh hưởng đến kết quả toàn đoàn sau này."
                confirmLabel="Xóa điểm"
            />

            {/* MODAL THÊM/SỬA ĐIỂM XẾP HẠNG */}
            <VCT_Modal isOpen={pointModal.open} onClose={() => setPointModal(prev => ({ ...prev, open: false }))} title={pointModal.isEdit ? "Sửa Cấu hình Điểm" : "Thêm Cấu hình Điểm"} width="400px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setPointModal(prev => ({ ...prev, open: false }))}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSavePoint} disabled={!permissions.canUpdate}>{pointModal.isEdit ? "Cập nhật" : "Lưu Điểm"}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Thứ hạng đạt được (Ví dụ: 1, 2, 3...) *">
                        <VCT_Input type="number" value={pointModal.data.thu_hang} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointModal(p => ({ ...p, data: { ...p.data, thu_hang: Number(e.target.value) } }))} placeholder="Nhập thứ hạng..." />
                    </VCT_Field>
                    <VCT_Field label="Hệ số xếp hạng (Điểm số) *">
                        <VCT_Input type="number" value={pointModal.data.diem} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointModal(p => ({ ...p, data: { ...p.data, diem: Number(e.target.value) } }))} placeholder="Nhập điểm số..." />
                    </VCT_Field>
                </VCT_Stack>
            </VCT_Modal>
        </div >
    );
};
