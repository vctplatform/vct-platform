package domain

import "time"

// ── Domain Models ────────────────────────────────────────────
// Typed structs for compile-time safety. Field names use JSON
// snake_case tags to match the frontend TypeScript interfaces
// defined in @vct/shared-types.

type TrangThaiGiai string

const (
	TrangThaiGiaiNhap    TrangThaiGiai = "nhap"
	TrangThaiGiaiDangKy  TrangThaiGiai = "dang_ky"
	TrangThaiGiaiKhoaDK  TrangThaiGiai = "khoa_dk"
	TrangThaiGiaiThiDau  TrangThaiGiai = "thi_dau"
	TrangThaiGiaiKetThuc TrangThaiGiai = "ket_thuc"
)

type GioiTinh string

const (
	GioiTinhNam GioiTinh = "nam"
	GioiTinhNu  GioiTinh = "nu"
)

type TrangThaiDoan string

const (
	TrangThaiDoanNhap     TrangThaiDoan = "nhap"
	TrangThaiDoanChoDuyet TrangThaiDoan = "cho_duyet"
	TrangThaiDoanYCBS     TrangThaiDoan = "yeu_cau_bo_sung"
	TrangThaiDoanXacNhan  TrangThaiDoan = "da_xac_nhan"
	TrangThaiDoanCheckin  TrangThaiDoan = "da_checkin"
	TrangThaiDoanTuChoi   TrangThaiDoan = "tu_choi"
)

type TrangThaiVDV string

const (
	TrangThaiVDVDuDK    TrangThaiVDV = "du_dieu_kien"
	TrangThaiVDVChoXN   TrangThaiVDV = "cho_xac_nhan"
	TrangThaiVDVThieuHS TrangThaiVDV = "thieu_ho_so"
	TrangThaiVDVNhap    TrangThaiVDV = "nhap"
)

// ── Tournament ───────────────────────────────────────────────

type Tournament struct {
	ID          string        `json:"id"`
	TenGiai     string        `json:"ten_giai"`
	MaGiai      string        `json:"ma_giai"`
	CapDo       string        `json:"cap_do"`
	TrangThai   TrangThaiGiai `json:"trang_thai"`
	NgayBatDau  string        `json:"ngay_bat_dau"`
	NgayKetThuc string        `json:"ngay_ket_thuc"`
	DiaDiem     string        `json:"dia_diem"`
	DvToChuc    string        `json:"dv_to_chuc"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// ── Team (Đoàn) ──────────────────────────────────────────────

type Team struct {
	ID         string        `json:"id"`
	Ma         string        `json:"ma"`
	Ten        string        `json:"ten"`
	Tat        string        `json:"tat"`
	Loai       string        `json:"loai"`
	Tinh       string        `json:"tinh"`
	TruongDoan string        `json:"truong_doan"`
	Sdt        string        `json:"sdt"`
	Email      string        `json:"email"`
	TrangThai  TrangThaiDoan `json:"trang_thai"`
	SoVDV      int           `json:"so_vdv"`
	NgayDK     string        `json:"ngay_dk"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

// ── Athlete (VĐV) ────────────────────────────────────────────

type Athlete struct {
	ID        string       `json:"id"`
	HoTen     string       `json:"ho_ten"`
	Gioi      GioiTinh     `json:"gioi"`
	NgaySinh  string       `json:"ngay_sinh"`
	CanNang   float64      `json:"can_nang"`
	ChieuCao  float64      `json:"chieu_cao"`
	DoanID    string       `json:"doan_id"`
	DoanTen   string       `json:"doan_ten"`
	TrangThai TrangThaiVDV `json:"trang_thai"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// ── Referee (Trọng tài) ──────────────────────────────────────

type Referee struct {
	ID        string    `json:"id"`
	HoTen     string    `json:"ho_ten"`
	Gioi      GioiTinh  `json:"gioi"`
	NgaySinh  string    `json:"ngay_sinh"`
	CapBac    string    `json:"cap_bac"`
	ChuyenMon string    `json:"chuyen_mon"`
	DonVi     string    `json:"don_vi"`
	Sdt       string    `json:"sdt"`
	Email     string    `json:"email"`
	TrangThai string    `json:"trang_thai"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── Arena (Sàn đấu) ─────────────────────────────────────────

type Arena struct {
	ID        string    `json:"id"`
	Ten       string    `json:"ten"`
	ViTri     string    `json:"vi_tri"`
	Loai      string    `json:"loai"`
	KichThuoc string    `json:"kich_thuoc"`
	TrangThai string    `json:"trang_thai"`
	PhuTrach  string    `json:"phu_trach"`
	Capacity  int       `json:"capacity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── Registration (Đăng ký nội dung) ──────────────────────────

type Registration struct {
	ID        string `json:"id"`
	VdvID     string `json:"vdv_id"`
	VdvTen    string `json:"vdv_ten"`
	DoanID    string `json:"doan_id"`
	DoanTen   string `json:"doan_ten"`
	Loai      string `json:"loai"`
	NdID      string `json:"nd_id"`
	NdTen     string `json:"nd_ten"`
	TrangThai string `json:"trang_thai"`
	Ngay      string `json:"ngay"`
}
