'use client';
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Card, VCT_Button, VCT_Text, VCT_Field, VCT_Input,
    VCT_Select, VCT_Stack, VCT_Toast, VCT_Wizard
} from '@vct/ui';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import type { TournamentConfig } from '../data/types';
import { useRouter } from 'next/navigation';

export const Page_tournament_wizard = () => {
    const router = useRouter();
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [config, setConfig] = useState<TournamentConfig>({
        ...TOURNAMENT_CONFIG,
        ten_giai: '',
        ma_giai: '',
        cap_do: 'quoc_gia',
        nam: String(new Date().getFullYear()),
        lan_thu: 1,
        dv_to_chuc: '',
        dv_dang_cai: '',
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        dia_diem: '',
        tinh: '',
        trang_thai: 'nhap',
        checklist: [],
        audit: [{ time: new Date().toLocaleString('vi-VN'), action: 'Khởi tạo bản nháp', by: 'Admin' }]
    });

    const showToast = (msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    const handleChange = (key: keyof TournamentConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleNestedChange = (parent: 'quota' | 'le_phi' | 'giai_thuong' | 'y_te' | 'phap_ly' | 'cau_hinh_quyen' | 'cau_hinh_doi_khang' | 'giai_thuong_toan_doan', key: string, value: any) => {
        setConfig(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
    };

    // Bước 1: Thông tin cơ bản
    const step1 = (
        <VCT_Stack gap={20}>
            <VCT_Text variant="h2" style={{ borderBottom: '1px solid var(--vct-border-subtle)', paddingBottom: 12 }}>Thông tin cơ bản</VCT_Text>
            <VCT_Field label="Tên giải đấu *">
                <VCT_Input value={config.ten_giai} onChange={(e: any) => handleChange('ten_giai', e.target.value)} placeholder="Giải vô địch Vovinam toàn quốc..." />
            </VCT_Field>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Mã giải *" className="flex-1">
                    <VCT_Input value={config.ma_giai} onChange={(e: any) => handleChange('ma_giai', e.target.value)} placeholder="VĐQG-2026" />
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
                    onChange={(v: any) => handleChange('cap_do', v)}
                />
            </VCT_Stack>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Đơn vị tổ chức" className="flex-1">
                    <VCT_Input value={config.dv_to_chuc} onChange={(e: any) => handleChange('dv_to_chuc', e.target.value)} placeholder="Liên đoàn Vovinam Việt Nam" />
                </VCT_Field>
                <VCT_Field label="Đơn vị đăng cai" className="flex-1">
                    <VCT_Input value={config.dv_dang_cai} onChange={(e: any) => handleChange('dv_dang_cai', e.target.value)} placeholder="Sở VH-TT-DL..." />
                </VCT_Field>
            </VCT_Stack>
        </VCT_Stack>
    );

    // Bước 2: Thời gian & Địa điểm
    const step2 = (
        <VCT_Stack gap={20}>
            <VCT_Text variant="h2" style={{ borderBottom: '1px solid var(--vct-border-subtle)', paddingBottom: 12 }}>Thời gian & Địa điểm</VCT_Text>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Ngày bắt đầu *" className="flex-1">
                    <VCT_Input type="date" value={config.ngay_bat_dau} onChange={(e: any) => handleChange('ngay_bat_dau', e.target.value)} />
                </VCT_Field>
                <VCT_Field label="Ngày kết thúc *" className="flex-1">
                    <VCT_Input type="date" value={config.ngay_ket_thuc} onChange={(e: any) => handleChange('ngay_ket_thuc', e.target.value)} />
                </VCT_Field>
                <VCT_Field label="Hạn đăng ký cuối *" className="flex-1">
                    <VCT_Input type="date" value={config.ngay_dk_cuoi} onChange={(e: any) => handleChange('ngay_dk_cuoi', e.target.value)} />
                </VCT_Field>
            </VCT_Stack>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Địa điểm (Nhà thi đấu) *" style={{ flex: 2 }}>
                    <VCT_Input value={config.dia_diem} onChange={(e: any) => handleChange('dia_diem', e.target.value)} placeholder="Nhà thi đấu đa năng..." />
                </VCT_Field>
                <VCT_Field label="Tỉnh/Thành phố *" className="flex-1">
                    <VCT_Input value={config.tinh} onChange={(e: any) => handleChange('tinh', e.target.value)} placeholder="Hà Nội" />
                </VCT_Field>
            </VCT_Stack>
        </VCT_Stack>
    );

    // Bước 3: Cấu hình Kỹ thuật
    const step3 = (
        <VCT_Stack gap={20}>
            <VCT_Text variant="h2" style={{ borderBottom: '1px solid var(--vct-border-subtle)', paddingBottom: 12 }}>Cấu hình Kỹ thuật</VCT_Text>

            <VCT_Text variant="h3" style={{ color: 'var(--vct-accent-cyan)' }}>1. Giới hạn số lượng (Quota)</VCT_Text>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Tối đa Đoàn tham dự" className="flex-1">
                    <VCT_Input type="number" value={config.quota.max_doan} onChange={(e: any) => handleNestedChange('quota', 'max_doan', Number(e.target.value))} />
                </VCT_Field>
                <VCT_Field label="Tối đa VĐV/Đoàn" className="flex-1">
                    <VCT_Input type="number" value={config.quota.max_vdv_per_doan} onChange={(e: any) => handleNestedChange('quota', 'max_vdv_per_doan', Number(e.target.value))} />
                </VCT_Field>
                <VCT_Field label="Nội dung/VĐV" className="flex-1">
                    <VCT_Input type="number" value={config.quota.max_nd_per_vdv} onChange={(e: any) => handleNestedChange('quota', 'max_nd_per_vdv', Number(e.target.value))} />
                </VCT_Field>
            </VCT_Stack>

            <VCT_Text variant="h3" style={{ color: 'var(--vct-accent-cyan)', marginTop: 12 }}>2. Đối kháng & Quyền</VCT_Text>
            <VCT_Stack direction="row" gap={16}>
                <VCT_Field label="Gian định Đối Kháng" className="flex-1">
                    <VCT_Select
                        options={[{ value: 3, label: '3 Giám định' }, { value: 5, label: '5 Giám định' }]}
                        value={String(config.cau_hinh_doi_khang.so_giam_dinh)}
                        onChange={(v: any) => handleNestedChange('cau_hinh_doi_khang', 'so_giam_dinh', Number(v))}
                    />
                </VCT_Field>
                <VCT_Field label="Giám định Quyền" className="flex-1">
                    <VCT_Select
                        options={[
                            { value: 5, label: '5 Giám định (Bỏ cao/thấp)' },
                            { value: 7, label: '7 Giám định (Bỏ cao/thấp)' }
                        ]}
                        value={String(config.cau_hinh_quyen.so_giam_dinh)}
                        onChange={(v: any) => handleNestedChange('cau_hinh_quyen', 'so_giam_dinh', Number(v))}
                    />
                </VCT_Field>
            </VCT_Stack>
        </VCT_Stack>
    );

    // Bước 4: Chốt & Xác nhận
    const step4 = (
        <VCT_Stack gap={20}>
            <VCT_Text variant="h2" style={{ borderBottom: '1px solid var(--vct-border-subtle)', paddingBottom: 12 }}>Xác nhận thông tin</VCT_Text>
            <div style={{ background: 'var(--vct-bg-input)', padding: 20, borderRadius: 12, border: '1px dashed var(--vct-border-strong)' }}>
                <VCT_Stack gap={12}>
                    <VCT_Text><strong>Tên giải:</strong> {config.ten_giai || <span style={{ color: 'var(--vct-danger)' }}>Chưa nhập</span>}</VCT_Text>
                    <VCT_Text><strong>Mã giải:</strong> {config.ma_giai || <span style={{ color: 'var(--vct-danger)' }}>Chưa nhập</span>}</VCT_Text>
                    <VCT_Text><strong>Thời gian:</strong> {config.ngay_bat_dau} → {config.ngay_ket_thuc}</VCT_Text>
                    <VCT_Text><strong>Địa điểm:</strong> {config.dia_diem}, {config.tinh}</VCT_Text>
                    <VCT_Text><strong>Giới hạn Đoàn:</strong> {config.quota.max_doan} (Tối đa {config.quota.max_vdv_per_doan} VĐV/Đoàn)</VCT_Text>
                </VCT_Stack>
            </div>
            <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)', textAlign: 'center', marginTop: 12 }}>
                {`Sau khi nhấn "Hoàn tất", hệ thống sẽ tạo một bản nháp cho Giải đấu này. Bạn có thể tiếp tục cấu hình các thông số chi tiết khác tại Trung tâm Điều hành.`}
            </VCT_Text>
        </VCT_Stack>
    );

    const handleComplete = () => {
        // Validation cuối cùng
        if (!config.ten_giai || !config.ma_giai || !config.ngay_bat_dau || !config.ngay_ket_thuc || !config.tinh) {
            showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error');
            return;
        }

        showToast('Tạo giải đấu thành công. Đang chuyển hướng...', 'success');
        setTimeout(() => {
            // Chuyển hướng về trang cấu hình giải
            router.push('/giai-dau');
        }, 1500);
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 0' }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <VCT_Card>
                    <div style={{ marginBottom: 32, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                        <VCT_Text variant="h1" style={{ marginBottom: 8 }}>Khởi tạo Giải đấu mới</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)' }}>
                            Trợ lý thiết lập các thông số cơ bản cho giải đấu. Quá trình này mất khoảng 2 phút.
                        </VCT_Text>
                    </div>

                    <VCT_Wizard
                        steps={[
                            {
                                title: 'Thông tin chung',
                                content: step1,
                                validate: () => {
                                    if (!config.ten_giai || !config.ma_giai) {
                                        showToast('Cần nhập Tên giải và Mã giải', 'warning');
                                        return false;
                                    }
                                    return true;
                                }
                            },
                            {
                                title: 'Thời gian & Địa điểm',
                                content: step2,
                                validate: () => {
                                    if (!config.ngay_bat_dau || !config.ngay_ket_thuc || !config.tinh || !config.dia_diem) {
                                        showToast('Cần điền đủ các thông tin ngày tháng và địa điểm', 'warning');
                                        return false;
                                    }
                                    return true;
                                }
                            },
                            {
                                title: 'Cấu hình Kỹ thuật',
                                content: step3
                            },
                            {
                                title: 'Hoàn tất',
                                content: step4
                            }
                        ]}
                        onComplete={handleComplete}
                        labels={{
                            next: 'Tiếp tục',
                            back: 'Quay lại',
                            complete: 'Tạo Giải đấu'
                        }}
                    />
                </VCT_Card>
            </motion.div>
        </div>
    );
};
