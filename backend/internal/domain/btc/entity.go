package btc

import "time"

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — BTC (Ban Tổ Chức) DOMAIN ENTITIES
// Covers: BTC Members, Weigh-In, Draw, Referee Assignment,
//         Results, Finance, Technical Meeting, Protests
// ═══════════════════════════════════════════════════════════════

// ── BTC Member ───────────────────────────────────────────────

type BTCMember struct {
	ID       string `json:"id"`
	Ten      string `json:"ten"`
	ChucVu   string `json:"chuc_vu"`
	Ban      string `json:"ban"` // ban_to_chuc, ban_chuyen_mon, ban_trong_tai, ban_y_te, ban_khang_nghi
	Cap      int    `json:"cap"` // 1=Trưởng ban, 2=Phó, 3=Ủy viên
	Sdt      string `json:"sdt"`
	Email    string `json:"email"`
	DonVi    string `json:"don_vi"`
	GiaiID   string `json:"giai_id"`
	IsActive bool   `json:"is_active"`
}

// ── Weigh-In Record ─────────────────────────────────────────

type WeighInRecord struct {
	ID        string    `json:"id"`
	GiaiID    string    `json:"giai_id"`
	VdvID     string    `json:"vdv_id"`
	VdvTen    string    `json:"vdv_ten"`
	DoanID    string    `json:"doan_id"`
	DoanTen   string    `json:"doan_ten"`
	HangCan   string    `json:"hang_can"`
	CanNang   float64   `json:"can_nang"` // actual weight
	GioiHan   float64   `json:"gioi_han"` // max weight for category
	SaiSo     float64   `json:"sai_so"`   // tolerance ±kg
	KetQua    string    `json:"ket_qua"`  // dat, khong_dat, cho_can
	LanCan    int       `json:"lan_can"`  // attempt number
	GhiChu    string    `json:"ghi_chu"`
	NguoiCan  string    `json:"nguoi_can"`
	ThoiGian  time.Time `json:"thoi_gian"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Draw Result (Bốc thăm) ──────────────────────────────────

type DrawResult struct {
	ID         string       `json:"id"`
	GiaiID     string       `json:"giai_id"`
	NoiDungID  string       `json:"noi_dung_id"`
	NoiDungTen string       `json:"noi_dung_ten"`
	LoaiND     string       `json:"loai_nd"` // doi_khang, quyen
	HangCan    string       `json:"hang_can"`
	LuaTuoi    string       `json:"lua_tuoi"`
	SoVDV      int          `json:"so_vdv"`
	Nhanh      []DrawBranch `json:"nhanh"`
	ThuTu      []DrawOrder  `json:"thu_tu"` // for quyen
	CreatedAt  time.Time    `json:"created_at"`
	CreatedBy  string       `json:"created_by"`
}

type DrawBranch struct {
	Position int    `json:"position"`
	VdvID    string `json:"vdv_id"`
	VdvTen   string `json:"vdv_ten"`
	DoanTen  string `json:"doan_ten"`
	Seed     int    `json:"seed"`
}

type DrawOrder struct {
	ThuTu   int    `json:"thu_tu"`
	VdvID   string `json:"vdv_id"`
	VdvTen  string `json:"vdv_ten"`
	DoanTen string `json:"doan_ten"`
}

// ── Referee Assignment (Phân công Trọng tài) ────────────────

type RefereeAssignment struct {
	ID          string    `json:"id"`
	GiaiID      string    `json:"giai_id"`
	TrongTaiID  string    `json:"trong_tai_id"`
	TrongTaiTen string    `json:"trong_tai_ten"`
	CapBac      string    `json:"cap_bac"`    // quoc_gia, cap_1, cap_2, cap_3
	ChuyenMon   string    `json:"chuyen_mon"` // quyen, doi_khang, ca_hai
	SanID       string    `json:"san_id"`
	SanTen      string    `json:"san_ten"`
	Ngay        string    `json:"ngay"`
	Phien       string    `json:"phien"`      // sang, chieu, toi
	VaiTro      string    `json:"vai_tro"`    // chu_toa, giam_dinh, bien_ban, diem
	TrangThai   string    `json:"trang_thai"` // phan_cong, xac_nhan, thay_doi
	GhiChu      string    `json:"ghi_chu"`
	CreatedAt   time.Time `json:"created_at"`
}

// ── Tournament Result (Kết quả) ─────────────────────────────

type TeamResult struct {
	ID      string `json:"id"`
	GiaiID  string `json:"giai_id"`
	DoanID  string `json:"doan_id"`
	DoanTen string `json:"doan_ten"`
	Tinh    string `json:"tinh"`
	HCV     int    `json:"hcv"`
	HCB     int    `json:"hcb"`
	HCD     int    `json:"hcd"`
	TongHC  int    `json:"tong_hc"`
	Diem    int    `json:"diem"`
	XepHang int    `json:"xep_hang"`
}

type ContentResult struct {
	ID         string `json:"id"`
	GiaiID     string `json:"giai_id"`
	NoiDungID  string `json:"noi_dung_id"`
	NoiDungTen string `json:"noi_dung_ten"`
	HangCan    string `json:"hang_can"`
	LuaTuoi    string `json:"lua_tuoi"`
	VdvIDNhat  string `json:"vdv_id_nhat"`
	VdvTenNhat string `json:"vdv_ten_nhat"`
	DoanNhat   string `json:"doan_nhat"`
	VdvIDNhi   string `json:"vdv_id_nhi"`
	VdvTenNhi  string `json:"vdv_ten_nhi"`
	DoanNhi    string `json:"doan_nhi"`
	VdvIDBa1   string `json:"vdv_id_ba_1"`
	VdvTenBa1  string `json:"vdv_ten_ba_1"`
	DoanBa1    string `json:"doan_ba_1"`
	VdvIDBa2   string `json:"vdv_id_ba_2"`
	VdvTenBa2  string `json:"vdv_ten_ba_2"`
	DoanBa2    string `json:"doan_ba_2"`
}

// ── Tournament Finance ──────────────────────────────────────

type FinanceEntry struct {
	ID        string    `json:"id"`
	GiaiID    string    `json:"giai_id"`
	Loai      string    `json:"loai"`     // thu, chi
	DanhMuc   string    `json:"danh_muc"` // le_phi_vdv, le_phi_doan, tai_tro, phu_cap_tt, thue_san, ...
	MoTa      string    `json:"mo_ta"`
	SoTien    float64   `json:"so_tien"`
	DoanID    string    `json:"doan_id,omitempty"`
	DoanTen   string    `json:"doan_ten,omitempty"`
	TrangThai string    `json:"trang_thai"` // da_thu, chua_thu, da_chi
	NgayGD    string    `json:"ngay_gd"`
	GhiChu    string    `json:"ghi_chu"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Technical Meeting ───────────────────────────────────────

type TechnicalMeeting struct {
	ID          string    `json:"id"`
	GiaiID      string    `json:"giai_id"`
	TieuDe      string    `json:"tieu_de"`
	Ngay        string    `json:"ngay"`
	DiaDiem     string    `json:"dia_diem"`
	ChuTri      string    `json:"chu_tri"`
	ThamDu      []string  `json:"tham_du"`
	NoiDung     string    `json:"noi_dung"`
	QuyetDinh   []string  `json:"quyet_dinh"`
	BienBanFile string    `json:"bien_ban_file"`
	TrangThai   string    `json:"trang_thai"` // du_kien, dang_hop, hoan_thanh
	CreatedAt   time.Time `json:"created_at"`
}

// ── Protest (Khiếu nại) ─────────────────────────────────────

type Protest struct {
	ID        string     `json:"id"`
	GiaiID    string     `json:"giai_id"`
	TranID    string     `json:"tran_id"`
	TranMoTa  string     `json:"tran_mo_ta"`
	NguoiNop  string     `json:"nguoi_nop"`
	DoanTen   string     `json:"doan_ten"`
	LoaiKN    string     `json:"loai_kn"` // cham_diem, pham_luat, can_luong
	LyDo      string     `json:"ly_do"`
	TrangThai string     `json:"trang_thai"` // moi, tiep_nhan, xem_xet, chap_nhan, bac_bo, khang_nghi, hoan_tat
	HasVideo  bool       `json:"has_video"`
	QuyetDinh string     `json:"quyet_dinh"`
	NguoiXL   string     `json:"nguoi_xl"`
	NgayNop   time.Time  `json:"ngay_nop"`
	NgayXL    *time.Time `json:"ngay_xl,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// ── BTC Stats (Dashboard) ───────────────────────────────────

type BTCStats struct {
	TongVDV       int     `json:"tong_vdv"`
	TongDoan      int     `json:"tong_doan"`
	TongTran      int     `json:"tong_tran"`
	TongHuyChuong int     `json:"tong_huy_chuong"`
	DaCanKy       int     `json:"da_can_ky"`
	ChuaCanKy     int     `json:"chua_can_ky"`
	TyLeDatCan    float64 `json:"ty_le_dat_can"`
	TongTrongTai  int     `json:"tong_trong_tai"`
	DaPhanCong    int     `json:"da_phan_cong"`
	TongKhieuNai  int     `json:"tong_khieu_nai"`
	KNChoXuLy     int     `json:"kn_cho_xu_ly"`
	TongThu       float64 `json:"tong_thu"`
	TongChi       float64 `json:"tong_chi"`
}
