import type {
    DonVi, VanDongVien, DangKy, TrongTai, CanKy,
    TranDauDK, LuotThiQuyen, LichThiDau, KhieuNai,
    NoiDungQuyen, HangCan, LuaTuoi, SanDau
} from './types';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — CENTRALIZED MOCK DATA STORE
// ════════════════════════════════════════════════════════════════
// Sử dụng mutable arrays để các page có thể CRUD trực tiếp.
// Import và gọi getter functions từ bất kỳ page nào.

// ── Lứa tuổi ──────────────────────────────────────────────────
export const LUA_TUOIS: LuaTuoi[] = [
    { id: 'LT01', ma: 'thieu_nhi', ten: 'Thiếu nhi', tu_tuoi: 10, den_tuoi: 12, trang_thai: 'active' },
    { id: 'LT02', ma: 'thieu_nien', ten: 'Thiếu niên', tu_tuoi: 13, den_tuoi: 15, trang_thai: 'active' },
    { id: 'LT03', ma: 'tre', ten: 'Trẻ', tu_tuoi: 16, den_tuoi: 18, trang_thai: 'active' },
    { id: 'LT04', ma: 'thanh_nien', ten: 'Thanh niên', tu_tuoi: 19, den_tuoi: 35, trang_thai: 'active' },
    { id: 'LT05', ma: 'trung_nien', ten: 'Trung niên', tu_tuoi: 36, den_tuoi: 50, trang_thai: 'draft' },
];

// ── Nội dung Quyền ────────────────────────────────────────────
export const NOI_DUNG_QUYENS: NoiDungQuyen[] = [
    { id: 'Q001', ten: 'Căn bản công pháp 3', hinh_thuc: 'ca_nhan', gioi: 'nam', lua_tuoi: '16-18', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q002', ten: 'Lão Mai Quyền', hinh_thuc: 'ca_nhan', gioi: 'nam', lua_tuoi: '16-18', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q003', ten: 'Lão Mai Quyền', hinh_thuc: 'ca_nhan', gioi: 'nu', lua_tuoi: '16-18', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q004', ten: 'Ngọc Trản Quyền', hinh_thuc: 'ca_nhan', gioi: 'nam_nu', lua_tuoi: '19-35', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q005', ten: 'Tứ Linh Đao', hinh_thuc: 'ca_nhan', gioi: 'nam', lua_tuoi: '19-35', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q006', ten: 'Song Luyện Côn', hinh_thuc: 'doi', gioi: 'nam_nu', lua_tuoi: '16-18', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q007', ten: 'Đồng diễn Quyền', hinh_thuc: 'dong_doi', gioi: 'nam_nu', lua_tuoi: '16-18', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
    { id: 'Q008', ten: 'Hùng Kê Quyền', hinh_thuc: 'ca_nhan', gioi: 'nam', lua_tuoi: '13-15', trang_thai: 'active', ghi_chu: '', updated: '2026-06-01' },
];

// ── Hạng cân Đối kháng ───────────────────────────────────────
export const HANG_CANS: HangCan[] = [
    { id: 'DK001', gioi: 'nam', lua_tuoi: '16-18', can_tu: 42, can_den: 45, trang_thai: 'active' },
    { id: 'DK002', gioi: 'nam', lua_tuoi: '16-18', can_tu: 45, can_den: 48, trang_thai: 'active' },
    { id: 'DK003', gioi: 'nam', lua_tuoi: '16-18', can_tu: 48, can_den: 52, trang_thai: 'active' },
    { id: 'DK004', gioi: 'nam', lua_tuoi: '16-18', can_tu: 52, can_den: 56, trang_thai: 'active' },
    { id: 'DK005', gioi: 'nam', lua_tuoi: '16-18', can_tu: 56, can_den: 60, trang_thai: 'active' },
    { id: 'DK006', gioi: 'nam', lua_tuoi: '16-18', can_tu: 60, can_den: 65, trang_thai: 'active' },
    { id: 'DK007', gioi: 'nam', lua_tuoi: '19-35', can_tu: 52, can_den: 56, trang_thai: 'active' },
    { id: 'DK008', gioi: 'nam', lua_tuoi: '19-35', can_tu: 56, can_den: 60, trang_thai: 'active' },
    { id: 'DK009', gioi: 'nu', lua_tuoi: '16-18', can_tu: 42, can_den: 45, trang_thai: 'active' },
    { id: 'DK010', gioi: 'nu', lua_tuoi: '16-18', can_tu: 45, can_den: 48, trang_thai: 'active' },
    { id: 'DK011', gioi: 'nu', lua_tuoi: '16-18', can_tu: 48, can_den: 52, trang_thai: 'active' },
    { id: 'DK012', gioi: 'nu', lua_tuoi: '19-35', can_tu: 45, can_den: 48, trang_thai: 'active' },
];

// ── Sàn đấu ──────────────────────────────────────────────────
export const SAN_DAUS: SanDau[] = [
    {
        id: 'S01', ten: 'Sàn A', vi_tri: 'Khu A — Tầng 1', loai: 'doi_khang', kich_thuoc: '12x12m',
        trang_thai: 'dang_thi_dau', phu_trach: 'Trần Minh', phu_trach_sdt: '0901111001', sub_state: 'Hiệp 2 — 1:45',
        noi_dung: 'ĐK Nam 60kg',
        match_live: { vdv1: 'Nguyễn Hoàng Nam', vdv2: 'Trần Minh Phúc', diem1: 12, diem2: 8, hiep: 2, time: '1:45' },
        queue: [{ id: 'q1', noi_dung: 'ĐK Nam 65kg', vdv1: 'Phạm Văn Kiên', vdv2: 'Bùi Quang Huy' }],
        done_today: 8, total_today: 15, capacity: 500, trong_tai: ['TT01', 'TT02', 'TT03'],
        trang_bi: [{ ten: 'Giáp hộ thân', sl: 4, tt: 'tot' }, { ten: 'Găng tay', sl: 8, tt: 'tot' }, { ten: 'Bảo hộ đầu', sl: 4, tt: 'thieu' }],
        history: [{ time: '08:00', action: 'Mở sàn', by: 'Trần Minh' }, { time: '10:15', action: 'Bắt đầu trận TD01', by: 'Trần Minh' }], ghi_chu: ''
    },
    {
        id: 'S02', ten: 'Sàn B', vi_tri: 'Khu A — Tầng 1', loai: 'quyen', kich_thuoc: '14x14m',
        trang_thai: 'dang_thi_dau', phu_trach: 'Lê Hương', phu_trach_sdt: '0901111002', sub_state: 'Đang chấm điểm',
        noi_dung: 'Quyền Nữ ĐL',
        match_live: { vdv1: 'Trần Mai Hoa', vdv2: 'N/A', diem1: 8.5, diem2: 0, hiep: 1, time: '0:45' },
        queue: [{ id: 'q3', noi_dung: 'Quyền Nam CN', vdv1: 'Lý Tiểu Long', vdv2: '' }],
        done_today: 12, total_today: 20, capacity: 100, trong_tai: ['TT04', 'TT05'],
        trang_bi: [{ ten: 'Thảm thi đấu', sl: 1, tt: 'tot' }], history: [], ghi_chu: ''
    },
    {
        id: 'S03', ten: 'Sàn C', vi_tri: 'Khu B — Tầng 2', loai: 'doi_khang', kich_thuoc: '12x12m',
        trang_thai: 'san_sang', phu_trach: 'Nguyễn Tùng', phu_trach_sdt: '0901111003', sub_state: '',
        noi_dung: '', match_live: null,
        queue: [{ id: 'q2', noi_dung: 'ĐK Nam 70kg', vdv1: 'Võ Đình Tài', vdv2: 'Đặng Thị Bích' }],
        done_today: 5, total_today: 10, capacity: 400, trong_tai: [],
        trang_bi: [{ ten: 'Giáp hộ thân', sl: 4, tt: 'tot' }], history: [], ghi_chu: ''
    },
    {
        id: 'S04', ten: 'Sàn D', vi_tri: 'Khu B — Tầng 2', loai: 'ca_hai', kich_thuoc: '14x14m',
        trang_thai: 'bao_tri', phu_trach: 'Hoàng Long', phu_trach_sdt: '0901111004', sub_state: 'Đang sửa thảm',
        noi_dung: '', match_live: null, queue: [], done_today: 0, total_today: 8, capacity: 100,
        trong_tai: [], trang_bi: [{ ten: 'Thảm thi đấu', sl: 1, tt: 'hong' }],
        history: [{ time: '10:30', action: 'Phát hiện thảm hỏng', by: 'Hoàng Long' }], ghi_chu: 'Đang chờ thảm thay thế'
    },
    {
        id: 'S05', ten: 'Sàn E', vi_tri: 'Khu C — Tầng 1', loai: 'doi_khang', kich_thuoc: '10x10m',
        trang_thai: 'dang_chuan_bi', phu_trach: 'Vũ Nam', phu_trach_sdt: '0901111005', sub_state: 'Vệ sinh sàn',
        noi_dung: 'ĐK Nữ 45kg', match_live: null, queue: [], done_today: 4, total_today: 12, capacity: 50,
        trong_tai: [], trang_bi: [{ ten: 'Giáp hộ thân', sl: 4, tt: 'tot' }], history: [], ghi_chu: ''
    },
];

// ── Đơn vị (Teams) ───────────────────────────────────────────
export const DON_VIS: DonVi[] = [
    { id: 'D001', ma: 'HCM-001', ten: 'Đoàn TP. Hồ Chí Minh', tat: 'HCM', loai: 'doan_tinh', tinh: 'TP. Hồ Chí Minh', truong_doan: 'Nguyễn Thanh Tùng', sdt: '0901234567', email: 'hcm@vct.vn', dia_chi: '1 Lữ Gia, Q.11', so_vdv: 32, nam: 18, nu: 14, hlv: 4, nd_q: 15, nd_dk: 12, trang_thai: 'da_xac_nhan', le_phi: { tong: 8400000, da_dong: 8400000 }, docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }, ngay_dk: '2026-06-15', audit: [{ time: '2026-06-15', action: 'Đăng ký', by: 'Admin' }, { time: '2026-06-20', action: 'Xác nhận hồ sơ', by: 'BTC' }], ghi_chu: '', thanh_tich: 'HCV VCTQG 2025, HCB SEA Games 2023' },
    { id: 'D002', ma: 'BD-002', ten: 'CLB Bình Định', tat: 'BĐ', loai: 'clb', tinh: 'Bình Định', truong_doan: 'Trần Văn Kiệt', sdt: '0912345678', email: 'bd@vct.vn', dia_chi: 'TP Quy Nhơn', so_vdv: 24, nam: 14, nu: 10, hlv: 3, nd_q: 10, nd_dk: 8, trang_thai: 'da_xac_nhan', le_phi: { tong: 5800000, da_dong: 5800000 }, docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }, ngay_dk: '2026-06-18', audit: [{ time: '2026-06-18', action: 'Đăng ký', by: 'Admin' }], ghi_chu: '', thanh_tich: 'Cái nôi Võ Cổ Truyền' },
    { id: 'D003', ma: 'HN-003', ten: 'CLB Hà Nội', tat: 'HN', loai: 'clb', tinh: 'Hà Nội', truong_doan: 'Lê Văn Cường', sdt: '0923456789', email: 'hn@vct.vn', dia_chi: 'Cầu Giấy, HN', so_vdv: 28, nam: 16, nu: 12, hlv: 3, nd_q: 12, nd_dk: 10, trang_thai: 'cho_duyet', le_phi: { tong: 6800000, da_dong: 4000000 }, docs: { 0: true, 1: true, 2: true, 3: false, 4: true, 5: false }, ngay_dk: '2026-07-01', audit: [], ghi_chu: 'Chưa nộp giấy khám SK + bằng HLV', thanh_tich: '' },
    { id: 'D004', ma: 'DN-004', ten: 'CLB Đà Nẵng', tat: 'ĐN', loai: 'clb', tinh: 'Đà Nẵng', truong_doan: 'Phạm Văn Đức', sdt: '0934567890', email: 'dn@vct.vn', dia_chi: 'Hải Châu, ĐN', so_vdv: 18, nam: 10, nu: 8, hlv: 2, nd_q: 8, nd_dk: 6, trang_thai: 'yeu_cau_bo_sung', le_phi: { tong: 4600000, da_dong: 2000000 }, docs: { 0: true, 1: true, 2: false, 3: false, 4: false, 5: true }, ngay_dk: '2026-07-10', audit: [], ghi_chu: 'Thiếu ảnh VĐV, khám SK, bảo hiểm', thanh_tich: '' },
    { id: 'D005', ma: 'CT-005', ten: 'Đoàn Cần Thơ', tat: 'CT', loai: 'doan_tinh', tinh: 'Cần Thơ', truong_doan: 'Hoàng Thị Elo', sdt: '0945678901', email: 'ct@vct.vn', dia_chi: 'Ninh Kiều, CT', so_vdv: 15, nam: 9, nu: 6, hlv: 2, nd_q: 6, nd_dk: 5, trang_thai: 'da_checkin', le_phi: { tong: 3800000, da_dong: 3800000 }, docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }, ngay_dk: '2026-06-20', audit: [{ time: '2026-08-14', action: 'Check-in tại giải', by: 'BTC' }], ghi_chu: '', thanh_tich: 'HCĐ VCTQG 2024' },
    { id: 'D006', ma: 'KH-006', ten: 'CLB Khánh Hòa', tat: 'KH', loai: 'clb', tinh: 'Khánh Hòa', truong_doan: 'Võ Văn Phú', sdt: '0956789012', email: 'kh@vct.vn', dia_chi: 'Nha Trang', so_vdv: 20, nam: 12, nu: 8, hlv: 2, nd_q: 8, nd_dk: 7, trang_thai: 'da_xac_nhan', le_phi: { tong: 5000000, da_dong: 5000000 }, docs: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true }, ngay_dk: '2026-06-22', audit: [], ghi_chu: '', thanh_tich: '' },
    { id: 'D007', ma: 'NA-007', ten: 'CLB Nghệ An', tat: 'NA', loai: 'clb', tinh: 'Nghệ An', truong_doan: 'Đặng Văn Giang', sdt: '0967890123', email: 'na@vct.vn', dia_chi: 'TP Vinh', so_vdv: 22, nam: 13, nu: 9, hlv: 3, nd_q: 9, nd_dk: 8, trang_thai: 'nhap', le_phi: { tong: 5400000, da_dong: 0 }, docs: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false }, ngay_dk: '2026-07-25', audit: [], ghi_chu: 'Mới tạo, chưa nộp hồ sơ', thanh_tich: '' },
    { id: 'D008', ma: 'TH-008', ten: 'Đoàn Thanh Hóa', tat: 'TH', loai: 'doan_tinh', tinh: 'Thanh Hóa', truong_doan: 'Bùi Thị Hạnh', sdt: '0978901234', email: 'th@vct.vn', dia_chi: 'TP Thanh Hóa', so_vdv: 16, nam: 10, nu: 6, hlv: 2, nd_q: 7, nd_dk: 5, trang_thai: 'tu_choi', le_phi: { tong: 4200000, da_dong: 0 }, docs: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false }, ngay_dk: '2026-07-30', audit: [{ time: '2026-08-01', action: 'Từ chối — quá hạn đăng ký', by: 'BTC' }], ghi_chu: 'Đăng ký sau deadline', thanh_tich: '' },
];

// ── Vận động viên ─────────────────────────────────────────────
export const VAN_DONG_VIENS: VanDongVien[] = [
    { id: 'V001', ho_ten: 'Nguyễn Văn Hùng', gioi: 'nam', ngay_sinh: '2008-03-15', tuoi: 18, can_nang: 48, chieu_cao: 165, doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', nd_quyen: ['Q001', 'Q002'], nd_dk: 'DK002', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V002', ho_ten: 'Trần Thị Mai', gioi: 'nu', ngay_sinh: '2008-07-22', tuoi: 18, can_nang: 45, chieu_cao: 158, doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', nd_quyen: ['Q003'], nd_dk: 'DK009', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V003', ho_ten: 'Lê Minh Kha', gioi: 'nam', ngay_sinh: '2008-11-01', tuoi: 18, can_nang: 52, chieu_cao: 170, doan_id: 'D002', doan_ten: 'CLB Bình Định', nd_quyen: ['Q001'], nd_dk: 'DK003', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V004', ho_ten: 'Phạm Thị Ngọc', gioi: 'nu', ngay_sinh: '2008-05-10', tuoi: 18, can_nang: 48, chieu_cao: 160, doan_id: 'D002', doan_ten: 'CLB Bình Định', nd_quyen: ['Q003'], nd_dk: 'DK011', trang_thai: 'cho_xac_nhan', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: false }, ghi_chu: 'Thiếu CMND' },
    { id: 'V005', ho_ten: 'Hoàng Đức Anh', gioi: 'nam', ngay_sinh: '2000-01-20', tuoi: 26, can_nang: 56, chieu_cao: 172, doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', nd_quyen: ['Q004', 'Q005'], nd_dk: 'DK007', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V006', ho_ten: 'Nguyễn Thị Lan', gioi: 'nu', ngay_sinh: '2001-09-12', tuoi: 25, can_nang: 46, chieu_cao: 155, doan_id: 'D003', doan_ten: 'CLB Hà Nội', nd_quyen: ['Q004'], nd_dk: 'DK012', trang_thai: 'thieu_ho_so', ho_so: { kham_sk: false, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: 'Thiếu khám SK' },
    { id: 'V007', ho_ten: 'Bùi Quang Huy', gioi: 'nam', ngay_sinh: '2008-02-28', tuoi: 18, can_nang: 65, chieu_cao: 175, doan_id: 'D003', doan_ten: 'CLB Hà Nội', nd_quyen: [], nd_dk: 'DK006', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V008', ho_ten: 'Võ Đình Tài', gioi: 'nam', ngay_sinh: '2008-06-05', tuoi: 18, can_nang: 55, chieu_cao: 168, doan_id: 'D006', doan_ten: 'CLB Khánh Hòa', nd_quyen: ['Q001', 'Q002'], nd_dk: 'DK004', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V009', ho_ten: 'Đặng Thị Bích', gioi: 'nu', ngay_sinh: '2008-12-18', tuoi: 18, can_nang: 44, chieu_cao: 156, doan_id: 'D005', doan_ten: 'Đoàn Cần Thơ', nd_quyen: ['Q003'], nd_dk: 'DK009', trang_thai: 'nhap', ho_so: { kham_sk: false, bao_hiem: false, anh: true, cmnd: true }, ghi_chu: '' },
    { id: 'V010', ho_ten: 'Trần Minh Phúc', gioi: 'nam', ngay_sinh: '2008-08-30', tuoi: 18, can_nang: 60, chieu_cao: 173, doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', nd_quyen: ['Q001'], nd_dk: 'DK005', trang_thai: 'du_dieu_kien', ho_so: { kham_sk: true, bao_hiem: true, anh: true, cmnd: true }, ghi_chu: '' },
];

// ── Đăng ký nội dung ──────────────────────────────────────────
export const DANG_KYS: DangKy[] = [
    { id: 'R001', vdv_id: 'V001', vdv_ten: 'Nguyễn Văn Hùng', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'quyen', nd_id: 'Q001', nd_ten: 'Căn bản công pháp 3 — CN Nam 16-18', trang_thai: 'da_duyet', ngay: '2026-06-16' },
    { id: 'R002', vdv_id: 'V001', vdv_ten: 'Nguyễn Văn Hùng', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'quyen', nd_id: 'Q002', nd_ten: 'Lão Mai Quyền — CN Nam 16-18', trang_thai: 'da_duyet', ngay: '2026-06-16' },
    { id: 'R003', vdv_id: 'V001', vdv_ten: 'Nguyễn Văn Hùng', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'doi_khang', nd_id: 'DK002', nd_ten: 'ĐK Nam 45-48kg 16-18', trang_thai: 'da_duyet', ngay: '2026-06-16' },
    { id: 'R004', vdv_id: 'V002', vdv_ten: 'Trần Thị Mai', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'quyen', nd_id: 'Q003', nd_ten: 'Lão Mai Quyền — CN Nữ 16-18', trang_thai: 'cho_duyet', ngay: '2026-06-17' },
    { id: 'R005', vdv_id: 'V003', vdv_ten: 'Lê Minh Kha', doan_id: 'D002', doan_ten: 'CLB Bình Định', loai: 'doi_khang', nd_id: 'DK003', nd_ten: 'ĐK Nam 48-52kg 16-18', trang_thai: 'da_duyet', ngay: '2026-06-18' },
    { id: 'R006', vdv_id: 'V005', vdv_ten: 'Hoàng Đức Anh', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'quyen', nd_id: 'Q004', nd_ten: 'Ngọc Trản Quyền — CN 19-35', trang_thai: 'da_duyet', ngay: '2026-06-18' },
    { id: 'R007', vdv_id: 'V005', vdv_ten: 'Hoàng Đức Anh', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'doi_khang', nd_id: 'DK007', nd_ten: 'ĐK Nam 52-56kg 19-35', trang_thai: 'cho_duyet', ngay: '2026-06-18' },
];

// ── Trọng tài ─────────────────────────────────────────────────
export const TRONG_TAIS: TrongTai[] = [
    { id: 'TT01', ho_ten: 'Nguyễn Quốc Bảo', gioi: 'nam', ngay_sinh: '1980-05-12', cap_bac: 'quoc_gia', chuyen_mon: 'doi_khang', don_vi: 'TP.HCM', sdt: '0901500001', email: 'bao.tt@vct.vn', trang_thai: 'xac_nhan', kinh_nghiem: '15 năm, 20 giải QG', ghi_chu: '' },
    { id: 'TT02', ho_ten: 'Trần Thị Hồng', gioi: 'nu', ngay_sinh: '1985-09-20', cap_bac: 'quoc_gia', chuyen_mon: 'quyen', don_vi: 'Hà Nội', sdt: '0901500002', email: 'hong.tt@vct.vn', trang_thai: 'xac_nhan', kinh_nghiem: '12 năm, 15 giải QG', ghi_chu: '' },
    { id: 'TT03', ho_ten: 'Lê Văn Thành', gioi: 'nam', ngay_sinh: '1978-03-01', cap_bac: 'cap_1', chuyen_mon: 'ca_hai', don_vi: 'Bình Định', sdt: '0901500003', email: 'thanh.tt@vct.vn', trang_thai: 'xac_nhan', kinh_nghiem: '18 năm, 25 giải', ghi_chu: '' },
    { id: 'TT04', ho_ten: 'Phạm Minh Tuấn', gioi: 'nam', ngay_sinh: '1990-11-15', cap_bac: 'cap_2', chuyen_mon: 'doi_khang', don_vi: 'Đà Nẵng', sdt: '0901500004', email: 'tuan.tt@vct.vn', trang_thai: 'cho_duyet', kinh_nghiem: '5 năm, 8 giải', ghi_chu: '' },
    { id: 'TT05', ho_ten: 'Hoàng Thị Lan', gioi: 'nu', ngay_sinh: '1992-07-08', cap_bac: 'cap_2', chuyen_mon: 'quyen', don_vi: 'Cần Thơ', sdt: '0901500005', email: 'lan.tt@vct.vn', trang_thai: 'xac_nhan', kinh_nghiem: '6 năm, 10 giải', ghi_chu: '' },
    { id: 'TT06', ho_ten: 'Võ Thanh Sơn', gioi: 'nam', ngay_sinh: '1995-01-25', cap_bac: 'cap_3', chuyen_mon: 'doi_khang', don_vi: 'Khánh Hòa', sdt: '0901500006', email: 'son.tt@vct.vn', trang_thai: 'tu_choi', kinh_nghiem: '2 năm, 3 giải', ghi_chu: 'Chưa đủ kinh nghiệm' },
];

// ── Cân ký ────────────────────────────────────────────────────
export const CAN_KYS: CanKy[] = [
    { id: 'CK01', vdv_id: 'V001', vdv_ten: 'Nguyễn Văn Hùng', doan_ten: 'Đoàn TP. HCM', gioi: 'nam', hang_can_dk: '45-48kg', can_tu: 45, can_den: 48, can_thuc_te: 47.2, ket_qua: 'dat', ghi_chu: '', thoi_gian: '2026-08-15 07:30' },
    { id: 'CK02', vdv_id: 'V002', vdv_ten: 'Trần Thị Mai', doan_ten: 'Đoàn TP. HCM', gioi: 'nu', hang_can_dk: '42-45kg', can_tu: 42, can_den: 45, can_thuc_te: 44.8, ket_qua: 'dat', ghi_chu: '', thoi_gian: '2026-08-15 07:35' },
    { id: 'CK03', vdv_id: 'V003', vdv_ten: 'Lê Minh Kha', doan_ten: 'CLB Bình Định', gioi: 'nam', hang_can_dk: '48-52kg', can_tu: 48, can_den: 52, can_thuc_te: 52.5, ket_qua: 'khong_dat', ghi_chu: 'Lố 0.5kg — cho cân lại lúc 9h', thoi_gian: '2026-08-15 07:40' },
    { id: 'CK04', vdv_id: 'V005', vdv_ten: 'Hoàng Đức Anh', doan_ten: 'Đoàn TP. HCM', gioi: 'nam', hang_can_dk: '52-56kg', can_tu: 52, can_den: 56, can_thuc_te: 55.1, ket_qua: 'dat', ghi_chu: '', thoi_gian: '2026-08-15 07:45' },
    { id: 'CK05', vdv_id: 'V007', vdv_ten: 'Bùi Quang Huy', doan_ten: 'CLB Hà Nội', gioi: 'nam', hang_can_dk: '60-65kg', can_tu: 60, can_den: 65, can_thuc_te: 0, ket_qua: 'cho_can', ghi_chu: '', thoi_gian: '' },
    { id: 'CK06', vdv_id: 'V008', vdv_ten: 'Võ Đình Tài', doan_ten: 'CLB Khánh Hòa', gioi: 'nam', hang_can_dk: '52-56kg', can_tu: 52, can_den: 56, can_thuc_te: 0, ket_qua: 'cho_can', ghi_chu: '', thoi_gian: '' },
    { id: 'CK07', vdv_id: 'V010', vdv_ten: 'Trần Minh Phúc', doan_ten: 'Đoàn TP. HCM', gioi: 'nam', hang_can_dk: '56-60kg', can_tu: 56, can_den: 60, can_thuc_te: 59.0, ket_qua: 'dat', ghi_chu: '', thoi_gian: '2026-08-15 07:50' },
];

// ── Trận đấu Đối kháng ───────────────────────────────────────
export const TRAN_DAUS: TranDauDK[] = [
    { id: 'TD01', san_id: 'S01', vdv_do: { id: 'V001', ten: 'Nguyễn Văn Hùng', doan: 'HCM' }, vdv_xanh: { id: 'V003', ten: 'Lê Minh Kha', doan: 'BĐ' }, hang_can: '48-52kg Nam', vong: 'ban_ket', trang_thai: 'dang_dau', diem_do: 3, diem_xanh: 1, hiep: 2, thoi_gian: '1:45', ket_qua: '', trong_tai: ['TT01', 'TT03'] },
    { id: 'TD02', san_id: 'S01', vdv_do: { id: 'V005', ten: 'Hoàng Đức Anh', doan: 'HCM' }, vdv_xanh: { id: 'V008', ten: 'Võ Đình Tài', doan: 'KH' }, hang_can: '52-56kg Nam', vong: 'tu_ket', trang_thai: 'chua_dau', diem_do: 0, diem_xanh: 0, hiep: 0, thoi_gian: '', ket_qua: '', trong_tai: ['TT01', 'TT04'] },
    { id: 'TD03', san_id: 'S03', vdv_do: { id: 'V010', ten: 'Trần Minh Phúc', doan: 'HCM' }, vdv_xanh: { id: 'V007', ten: 'Bùi Quang Huy', doan: 'HN' }, hang_can: '60-65kg Nam', vong: 'vong_loai', trang_thai: 'ket_thuc', diem_do: 5, diem_xanh: 2, hiep: 3, thoi_gian: '0:00', ket_qua: 'Thắng điểm Đỏ', trong_tai: ['TT03', 'TT04'] },
];

// ── Lượt thi Quyền ────────────────────────────────────────────
export const LUOT_THI_QUYENS: LuotThiQuyen[] = [
    { id: 'LQ01', san_id: 'S02', vdv_id: 'V001', vdv_ten: 'Nguyễn Văn Hùng', doan_ten: 'HCM', noi_dung: 'Căn bản công pháp 3', gioi_tinh: 'Nam', lua_tuoi: 'Vô địch (18-35)', diem: [8.5, 8.7, 8.3, 8.6, 8.4], diem_tb: 8.5, xep_hang: 1, trang_thai: 'da_cham' },
    { id: 'LQ02', san_id: 'S02', vdv_id: 'V003', vdv_ten: 'Lê Minh Kha', doan_ten: 'BĐ', noi_dung: 'Căn bản công pháp 3', gioi_tinh: 'Nam', lua_tuoi: 'Vô địch (18-35)', diem: [8.2, 8.4, 8.1, 8.3, 8.5], diem_tb: 8.3, xep_hang: 2, trang_thai: 'da_cham' },
    { id: 'LQ03', san_id: 'S02', vdv_id: 'V008', vdv_ten: 'Võ Đình Tài', doan_ten: 'KH', noi_dung: 'Căn bản công pháp 3', gioi_tinh: 'Nam', lua_tuoi: 'Vô địch (18-35)', diem: [8.0, 8.2, 7.9, 8.1, 8.3], diem_tb: 8.1, xep_hang: 3, trang_thai: 'da_cham' },
    { id: 'LQ04', san_id: 'S02', vdv_id: 'V002', vdv_ten: 'Trần Thị Mai', doan_ten: 'HCM', noi_dung: 'Lão Mai Quyền — Nữ', gioi_tinh: 'Nữ', lua_tuoi: 'Trẻ (16-18)', diem: [], diem_tb: 0, xep_hang: 0, trang_thai: 'cho_thi' },
    { id: 'LQ05', san_id: 'S02', vdv_id: 'V005', vdv_ten: 'Hoàng Đức Anh', doan_ten: 'HCM', noi_dung: 'Ngọc Trản Quyền', gioi_tinh: 'Nam', lua_tuoi: 'Trẻ (16-18)', diem: [9.0, 8.8, 9.1, 8.9, 9.2], diem_tb: 8.97, xep_hang: 1, trang_thai: 'da_cham' },
];

// ── Lịch thi đấu ─────────────────────────────────────────────
export const LICH_THI_DAUS: LichThiDau[] = [
    { id: 'L01', ngay: '2026-08-15', phien: 'sang', gio_bat_dau: '08:00', gio_ket_thuc: '12:00', san_id: 'S01', noi_dung: 'ĐK Nam — Vòng loại', so_tran: 8, trang_thai: 'hoan_thanh' },
    { id: 'L02', ngay: '2026-08-15', phien: 'sang', gio_bat_dau: '08:00', gio_ket_thuc: '12:00', san_id: 'S02', noi_dung: 'Quyền CN — Bảng A', so_tran: 12, trang_thai: 'dang_dien_ra' },
    { id: 'L03', ngay: '2026-08-15', phien: 'chieu', gio_bat_dau: '13:30', gio_ket_thuc: '17:30', san_id: 'S01', noi_dung: 'ĐK Nam — Tứ kết', so_tran: 4, trang_thai: 'xac_nhan' },
    { id: 'L04', ngay: '2026-08-15', phien: 'chieu', gio_bat_dau: '13:30', gio_ket_thuc: '17:30', san_id: 'S02', noi_dung: 'Quyền CN — Bảng B', so_tran: 10, trang_thai: 'du_kien' },
    { id: 'L05', ngay: '2026-08-16', phien: 'sang', gio_bat_dau: '08:00', gio_ket_thuc: '12:00', san_id: 'S01', noi_dung: 'ĐK Nữ — Vòng loại', so_tran: 6, trang_thai: 'du_kien' },
    { id: 'L06', ngay: '2026-08-16', phien: 'sang', gio_bat_dau: '08:00', gio_ket_thuc: '12:00', san_id: 'S03', noi_dung: 'ĐK Nam — Bán kết', so_tran: 2, trang_thai: 'du_kien' },
    { id: 'L07', ngay: '2026-08-17', phien: 'chieu', gio_bat_dau: '14:00', gio_ket_thuc: '17:00', san_id: 'S01', noi_dung: 'Chung kết ĐK', so_tran: 3, trang_thai: 'du_kien' },
];

// ── Khiếu nại ─────────────────────────────────────────────────
export const KHIEU_NAIS: KhieuNai[] = [
    { id: 'KN01', doan_id: 'D002', doan_ten: 'CLB Bình Định', loai: 'khieu_nai', noi_dung_lien_quan: 'ĐK Nam 48-52kg', tran_dau_id: 'TD01', ly_do: 'Trọng tài bỏ qua cú đấm hợp lệ của VĐV xanh', bang_chung: 'Video quay từ góc đài', trang_thai: 'moi', ket_luan: '', nguoi_xu_ly: '', thoi_gian_nop: '2026-08-15 10:30', thoi_gian_xu_ly: '' },
    { id: 'KN02', doan_id: 'D003', doan_ten: 'CLB Hà Nội', loai: 'khang_nghi', noi_dung_lien_quan: 'Quyền CN Bảng A', tran_dau_id: '', ly_do: 'Điểm chấm của GĐ3 chênh lệch bất thường (thấp hơn 1.5 điểm so với TB)', bang_chung: 'Bảng điểm chi tiết', trang_thai: 'dang_xu_ly', ket_luan: '', nguoi_xu_ly: 'Võ Minh Tuấn', thoi_gian_nop: '2026-08-15 11:00', thoi_gian_xu_ly: '2026-08-15 11:30' },
    { id: 'KN03', doan_id: 'D001', doan_ten: 'Đoàn TP. HCM', loai: 'khieu_nai', noi_dung_lien_quan: 'Cân ký 48-52kg', tran_dau_id: '', ly_do: 'VĐV đối thủ lố cân 0.5kg nhưng vẫn được thi đấu', bang_chung: 'Biên bản cân ký', trang_thai: 'chap_nhan', ket_luan: 'VĐV Lê Minh Kha được cân lại và đạt cân', nguoi_xu_ly: 'Phạm Thị Lan', thoi_gian_nop: '2026-08-15 08:00', thoi_gian_xu_ly: '2026-08-15 09:30' },
];

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — Cross-module data access
// ════════════════════════════════════════════════════════════════

export const getDoanById = (id: string) => DON_VIS.find(d => d.id === id);
export const getVDVById = (id: string) => VAN_DONG_VIENS.find(v => v.id === id);
export const getVDVsByDoan = (doanId: string) => VAN_DONG_VIENS.filter(v => v.doan_id === doanId);
export const getDKsByVDV = (vdvId: string) => DANG_KYS.filter(d => d.vdv_id === vdvId);
export const getDKsByDoan = (doanId: string) => DANG_KYS.filter(d => d.doan_id === doanId);
export const getSanById = (id: string) => SAN_DAUS.find(s => s.id === id);
export const getTTById = (id: string) => TRONG_TAIS.find(t => t.id === id);
export const getCanKyByVDV = (vdvId: string) => CAN_KYS.find(c => c.vdv_id === vdvId);

// ID generators
let _idCounter = 1000;
export const genId = (prefix: string) => `${prefix}${String(++_idCounter).padStart(4, '0')}`;
