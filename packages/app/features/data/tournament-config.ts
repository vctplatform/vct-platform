import type { TournamentConfig } from './types';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT CONFIG (Shared across all modules)
// ════════════════════════════════════════════════════════════════

export const TOURNAMENT_CONFIG: TournamentConfig = {
    ten_giai: 'Giải Vô Địch Võ Cổ Truyền Toàn Quốc 2026',
    ma_giai: 'VCTQG-2026-032',
    cap_do: 'quoc_gia',
    lan_thu: 32,
    nam: '2026',
    ngay_bat_dau: '2026-08-15',
    ngay_ket_thuc: '2026-08-20',
    ngay_dk_cuoi: '2026-07-31',
    dia_diem: 'Nhà thi đấu Phú Thọ',
    dia_chi: '1 Lữ Gia, Phường 15, Quận 11',
    tinh: 'TP. Hồ Chí Minh',
    dv_to_chuc: 'Liên đoàn Võ thuật Cổ truyền Việt Nam',
    dv_dang_cai: 'Sở VHTT TP.HCM',
    website: 'https://vocotruyenvn.vn',
    email: 'btc@vocotruyenvn.vn',
    dien_thoai: '028 3855 1234',
    trang_thai: 'thi_dau',
    link_dieu_le: 'https://vocotruyenvn.vn/docs/dieu_le_vct_2026.pdf',

    cau_hinh_quyen: {
        hinh_thuc: 'theo_diem',
        so_giam_dinh: 5
    },

    cau_hinh_doi_khang: {
        dong_huy_chuong_dong: true,
        so_giam_dinh: 5,
        thoi_gian_hiep: 120,
        thoi_gian_nghi: 60
    },

    quota: {
        max_vdv_per_doan: 40,
        max_nd_per_vdv: 5,
        max_hlv_per_doan: 5,
        max_doan: 60,
    },

    le_phi: { vdv: 200000, noi_dung: 100000, doan: 2000000 },
    giai_thuong: { hcv: 3000000, hcb: 2000000, hcd: 1000000 },
    giai_thuong_toan_doan: { nhat: 15000000, nhi: 10000000, ba: 5000000 },
    cach_tinh_diem_toan_doan: 'theo_huy_chuong',
    diem_xep_hang: [
        { thu_hang: 1, diem: 10 },
        { thu_hang: 2, diem: 7 },
        { thu_hang: 3, diem: 5 },
        { thu_hang: 4, diem: 3 },
        { thu_hang: 5, diem: 1 },
    ],

    tai_tro: [
        { ten: 'Tập đoàn VNG', loai: 'chinh' },
        { ten: 'Vinamilk', loai: 'vang' },
        { ten: 'Herbalife', loai: 'bac' },
        { ten: 'Nike Vietnam', loai: 'dong_hanh' },
    ],

    btc: [
        { ten: 'Nguyễn Văn Minh', chuc_vu: 'Trưởng BTC', ban: 'ban_to_chuc', cap: 1, sdt: '0901000001', email: 'minh@vct.vn', dv: 'Liên đoàn VCT VN' },
        { ten: 'Trần Thị Hương', chuc_vu: 'Phó BTC', ban: 'ban_to_chuc', cap: 2, sdt: '0901000002', email: 'huong@vct.vn', dv: 'Sở VHTT TP.HCM' },
        { ten: 'Lê Quốc Cường', chuc_vu: 'Trưởng Ban Chuyên Môn', ban: 'ban_chuyen_mon', cap: 1, sdt: '0901000003', email: 'cuong@vct.vn', dv: 'HLV Quốc gia' },
        { ten: 'Phạm Thị Lan', chuc_vu: 'Trưởng Ban Trọng Tài', ban: 'ban_trong_tai', cap: 1, sdt: '0901000004', email: 'lan@vct.vn', dv: 'Ban TT QG' },
        { ten: 'Hoàng Đức An', chuc_vu: 'Trưởng Ban Y Tế', ban: 'ban_y_te', cap: 1, sdt: '0901000005', email: 'an@vct.vn', dv: 'BV ĐH Y Dược' },
        { ten: 'Võ Minh Tuấn', chuc_vu: 'Trưởng Ban Kháng Nghị', ban: 'ban_khang_nghi', cap: 1, sdt: '0901000006', email: 'tuan@vct.vn', dv: 'Luật sư đoàn' },
    ],

    y_te: {
        benh_vien: 'Bệnh viện ĐH Y Dược TP.HCM',
        bv_kc: '3.2 km',
        bv_sdt: '028 3855 4269',
        xe_cap_cuu: '2 xe túc trực',
        doi_y_te: '6 bác sĩ + 8 y tá',
    },

    phap_ly: {
        qd_to_chuc: 'QĐ số 1234/QĐ-TCTDTT ngày 15/03/2026',
        phien_ban_luat: 'Luật thi đấu VCT v5.2 (2025)',
        bao_hiem: 'Bảo Việt — Gói VĐV toàn diện',
    },

    dieu_le: 'Điều lệ giải VCTQG 2026 ban hành ngày 01/04/2026',
    ghi_chu: '',

    checklist: [
        { id: 'ck1', label: 'Quyết định tổ chức', done: true },
        { id: 'ck2', label: 'Điều lệ giải chính thức', done: true },
        { id: 'ck3', label: 'Hợp đồng nhà thi đấu', done: true },
        { id: 'ck4', label: 'Hợp đồng tài trợ', done: true },
        { id: 'ck5', label: 'Tuyển chọn trọng tài', done: true },
        { id: 'ck6', label: 'Chuẩn bị trang thiết bị', done: true },
        { id: 'ck7', label: 'Kiểm tra hệ thống CNTT', done: false },
        { id: 'ck8', label: 'Họp kỹ thuật (Technical Meeting)', done: false },
        { id: 'ck9', label: 'Tổng duyệt', done: false },
    ],

    audit: [
        { time: '2026-03-15 09:00', action: 'Tạo giải đấu', by: 'Admin' },
        { time: '2026-04-01 14:30', action: 'Ban hành điều lệ', by: 'Nguyễn Văn Minh' },
        { time: '2026-06-01 10:00', action: 'Mở đăng ký', by: 'Admin' },
        { time: '2026-07-31 23:59', action: 'Khóa đăng ký', by: 'Hệ thống' },
        { time: '2026-08-15 08:00', action: 'Bắt đầu thi đấu', by: 'Admin' },
    ],
};
