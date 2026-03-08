'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_KpiCard,
    VCT_Toast, VCT_SearchInput, VCT_Table, VCT_EmptyState, VCT_ConfirmDialog, VCT_Modal
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { DANG_KYS, VAN_DONG_VIENS, DON_VIS, HANG_CANS, NOI_DUNG_QUYENS } from '../data/mock-data';
import type { DangKy, VanDongVien, TrangThaiDK } from '../data/types';

export const Page_technical_meeting = () => {
    const [data, setData] = useState<DangKy[]>([...DANG_KYS]);
    const [search, setSearch] = useState('');
    const [filterDoan, setFilterDoan] = useState('');
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);

    // Derived states
    const enrichedData = useMemo(() => {
        return data.filter(r => r.trang_thai === 'da_duyet').map(r => {
            const vdv = VAN_DONG_VIENS.find(v => v.id === r.vdv_id) || { ho_ten: 'Không rõ', ngay_sinh: '', can_nang: 0, gioi: 'nam' } as VanDongVien;
            const doan = DON_VIS.find(d => d.id === r.doan_id) || { ten: 'Không rõ' };
            const tuoi = vdv.ngay_sinh ? new Date().getFullYear() - parseInt(vdv.ngay_sinh.substring(0, 4)) : 0;

            let ndTen = r.nd_id;
            let expectedWeight = ''; // for combat
            if (r.loai === 'quyen') {
                ndTen = NOI_DUNG_QUYENS.find(q => q.id === r.nd_id)?.ten || r.nd_id;
            } else {
                const dk = HANG_CANS.find(h => h.id === r.nd_id);
                if (dk) {
                    ndTen = `ĐK ${dk.gioi === 'nam' ? 'Nam' : 'Nữ'} ${dk.can_den ? `${dk.can_tu}-${dk.can_den}kg` : `>${dk.can_tu}kg`}`;
                    expectedWeight = dk.can_den ? `${dk.can_tu} - ${dk.can_den}kg` : `> ${dk.can_tu}kg`;
                }
            }

            return {
                ...r,
                vdv,
                doan_ten: doan.ten,
                nd_ten: ndTen,
                tuoi,
                expectedWeight
            };
        }).filter(r => {
            const mS = !search || r.vdv.ho_ten.toLowerCase().includes(search.toLowerCase()) || r.nd_ten.toLowerCase().includes(search.toLowerCase());
            const mD = !filterDoan || r.doan_id === filterDoan;
            return mS && mD;
        }).sort((a, b) => a.doan_ten.localeCompare(b.doan_ten));
    }, [data, search, filterDoan]);

    const stats = useMemo(() => {
        const approved = data.filter(r => r.trang_thai === 'da_duyet');
        const countDoan = new Set(approved.map(a => a.doan_id)).size;
        const totalVdv = new Set(approved.map(a => a.vdv_id)).size;
        const totalQuyen = approved.filter(a => a.loai === 'quyen').length;
        const totalDK = approved.filter(a => a.loai === 'doi_khang').length;
        return { countDoan, totalVdv, totalQuyen, totalDK };
    }, [data]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* HEADER ALERT */}
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.1))', border: '1px solid var(--vct-accent-cyan)', borderRadius: '16px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <VCT_Stack direction="row" gap={12} align="center" style={{ marginBottom: 8 }}>
                            <VCT_Icons.CheckCircle size={24} color="#22d3ee" />
                            <VCT_Text variant="h2" style={{ fontSize: 20 }}>Rà Soát Danh Sách Chốt (Final Entry List)</VCT_Text>
                        </VCT_Stack>
                        <VCT_Text variant="small" style={{ opacity: 0.8, maxWidth: 600 }}>Dành cho buổi **Họp chuyên môn** trước giải. Các Trưởng đoàn kiểm tra lại thông tin VĐV, hạng cân đăng ký đã chính xác chưa. Chỉ hiển thị các trạng thái &quot;Đã Duyệt&quot;.</VCT_Text>
                    </div>
                    <VCT_Button icon={<VCT_Icons.Printer size={16} />} onClick={() => window.print()}>In Biên Bản Chốt</VCT_Button>
                </div>
            </div>

            {/* KPI STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <VCT_KpiCard label="Đoàn tham dự" value={stats.countDoan} icon={<VCT_Icons.Flag size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="VĐV Đủ điều kiện thi" value={stats.totalVdv} icon={<VCT_Icons.Users size={24} />} color="#10b981" />
                <VCT_KpiCard label="Số lượt dự thi Quyền" value={stats.totalQuyen} icon={<VCT_Icons.Activity size={24} />} color="#22d3ee" />
                <VCT_KpiCard label="Số lượt thi Đ.Kháng" value={stats.totalDK} icon={<VCT_Icons.Shuffle size={24} />} color="#ef4444" />
            </div>

            {/* TOOLBAR */}
            <VCT_Stack direction="row" gap={16} align="center" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm VĐV, nội dung thi đấu..." />
                </div>
                <div style={{ flex: '0 0 auto', width: '300px' }}>
                    <select
                        value={filterDoan} onChange={(e) => setFilterDoan(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                    >
                        <option value="">Lọc theo Đoàn / Đơn vị</option>
                        {DON_VIS.map(d => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </select>
                </div>
            </VCT_Stack>

            {/* TABLE */}
            <div style={{ background: 'var(--vct-bg-card)', borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflowX: 'auto' }}>
                <VCT_Table
                    columns={[
                        { key: 'doan_ten', label: 'Đoàn', render: (r: any) => <VCT_Text style={{ fontWeight: 800 }}>{r.doan_ten}</VCT_Text> },
                        {
                            key: 'vdv_ten', label: 'VĐV / Giới / Tuổi', render: (r: any) => (
                                <div>
                                    <VCT_Text style={{ fontWeight: 800, fontSize: 15 }}>{r.vdv.ho_ten}</VCT_Text>
                                    <VCT_Text variant="small" style={{ opacity: 0.6, marginTop: 2 }}>{r.loai === 'quyen' ? '' : `${r.vdv.gioi === 'nam' ? 'Nam' : 'Nữ'} • ${r.tuoi}T`}</VCT_Text>
                                </div>
                            )
                        },
                        {
                            key: 'can_nang', label: 'Trọng lượng ĐK (kg)', render: (r: any) => (
                                r.loai === 'quyen' ? <span style={{ opacity: 0.3 }}>-</span> : <VCT_Text style={{ fontWeight: 800 }}>{r.vdv.can_nang}</VCT_Text>
                            )
                        },
                        {
                            key: 'noi_dung_dk', label: 'Nội dung chốt thi đấu', render: (r: any) => (
                                <div>
                                    <div style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: r.loai === 'quyen' ? 'rgba(34,211,238,0.1)' : 'rgba(245,158,11,0.1)', color: r.loai === 'quyen' ? '#22d3ee' : '#f59e0b', alignItems: 'center', gap: 6 }}>
                                        {r.loai === 'quyen' ? '🥋' : '🥊'} {r.nd_ten}
                                    </div>
                                    {r.loai === 'doi_khang' && (
                                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>Y/C: {r.expectedWeight}</div>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'chu_ky', label: 'Cập nhật / Ký xác nhận', render: (r: any) => (
                                <div className="print-signature-box" style={{ width: '100%', height: 40, borderBottom: '1px dotted var(--vct-border-strong)', opacity: 0.5 }}></div>
                            )
                        }
                    ]}
                    data={enrichedData}
                />

                {enrichedData.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <VCT_EmptyState title="Không có dữ liệu trong danh sách chốt" icon="📄" />
                    </div>
                )}
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-signature-box { visibility: visible; border-bottom: 1px dotted #000 !important; opacity: 1 !important; }
                    .print-signature-box::after { content: "Chữ ký trưởng đoàn"; font-size: 8px; position: absolute; bottom: -12px; left: 0; }
                    main, nav, header { display: none !important; }
                    .vct-table { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; color: black !important; }
                    .vct-table * { visibility: visible !important; color: black !important; }
                }
            `}</style>
        </div>
    );
};
