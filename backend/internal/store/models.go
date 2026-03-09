package store

import (
	"encoding/json"
	"time"
)

// ============ AUTH MODELS ============

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	FullName     string    `json:"full_name"`
	Email        string    `json:"email,omitempty"`
	Phone        string    `json:"phone,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Session struct {
	ID               string     `json:"id"`
	UserID           string     `json:"user_id"`
	AccessTokenJTI   string     `json:"access_token_jti"`
	RefreshTokenJTI  string     `json:"refresh_token_jti"`
	IPAddress        string     `json:"ip_address,omitempty"`
	UserAgent        string     `json:"user_agent,omitempty"`
	TournamentCode   string     `json:"tournament_code,omitempty"`
	OperationShift   string     `json:"operation_shift,omitempty"`
	ExpiresAt        time.Time  `json:"expires_at"`
	RefreshExpiresAt time.Time  `json:"refresh_expires_at"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

// ============ TOURNAMENT MODELS ============

type Tournament struct {
	ID                   string          `json:"id"`
	Name                 string          `json:"name"`
	Code                 string          `json:"code"`
	Level                string          `json:"level"`
	RoundNumber          int             `json:"round_number"`
	StartDate            string          `json:"start_date"`
	EndDate              string          `json:"end_date"`
	RegistrationDeadline string          `json:"registration_deadline,omitempty"`
	Location             string          `json:"location,omitempty"`
	Venue                string          `json:"venue,omitempty"`
	Organizer            string          `json:"organizer,omitempty"`
	Status               string          `json:"status"`
	Config               json.RawMessage `json:"config"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

type AgeGroup struct {
	ID           string `json:"id"`
	TournamentID string `json:"tournament_id"`
	Ten          string `json:"ten"`
	TuoiMin      int    `json:"tuoi_min"`
	TuoiMax      int    `json:"tuoi_max"`
}

type ContentCategory struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	Ten          string    `json:"ten"`
	Loai         string    `json:"loai"` // quyen | doi_khang
	GioiTinh     string    `json:"gioi_tinh,omitempty"`
	LuaTuoiID    string    `json:"lua_tuoi_id,omitempty"`
	SoNguoi      int       `json:"so_nguoi"`
	MoTa         string    `json:"mo_ta,omitempty"`
	TrangThai    string    `json:"trang_thai"`
	CreatedAt    time.Time `json:"created_at"`
}

type WeightClass struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	Ten          string    `json:"ten"`
	GioiTinh     string    `json:"gioi_tinh"`
	LuaTuoiID    string    `json:"lua_tuoi_id,omitempty"`
	CanNangMin   float64   `json:"can_nang_min"`
	CanNangMax   float64   `json:"can_nang_max"`
	TrangThai    string    `json:"trang_thai"`
	CreatedAt    time.Time `json:"created_at"`
}

// ============ TEAM & ATHLETE MODELS ============

type Team struct {
	ID             string          `json:"id"`
	TournamentID   string          `json:"tournament_id"`
	Ten            string          `json:"ten"`
	MaDoan         string          `json:"ma_doan"`
	Loai           string          `json:"loai,omitempty"`
	TinhThanh      string          `json:"tinh_thanh,omitempty"`
	LienHe         string          `json:"lien_he,omitempty"`
	SDT            string          `json:"sdt,omitempty"`
	Email          string          `json:"email,omitempty"`
	TrangThai      string          `json:"trang_thai"`
	Docs           json.RawMessage `json:"docs"`
	Fees           json.RawMessage `json:"fees"`
	Achievements   json.RawMessage `json:"achievements"`
	DelegateUserID string          `json:"delegate_user_id,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Athlete struct {
	ID           string          `json:"id"`
	TournamentID string          `json:"tournament_id"`
	TeamID       string          `json:"team_id"`
	HoTen        string          `json:"ho_ten"`
	GioiTinh     string          `json:"gioi_tinh"`
	NgaySinh     string          `json:"ngay_sinh"`
	CanNang      float64         `json:"can_nang"`
	ChieuCao     float64         `json:"chieu_cao,omitempty"`
	TrangThai    string          `json:"trang_thai"`
	Docs         json.RawMessage `json:"docs"`
	GhiChu       string          `json:"ghi_chu,omitempty"`
	AvatarURL    string          `json:"avatar_url,omitempty"`
	UserID       string          `json:"user_id,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type Registration struct {
	ID                string    `json:"id"`
	TournamentID      string    `json:"tournament_id"`
	AthleteID         string    `json:"athlete_id"`
	ContentCategoryID string    `json:"content_category_id,omitempty"`
	WeightClassID     string    `json:"weight_class_id,omitempty"`
	TrangThai         string    `json:"trang_thai"`
	GhiChu            string    `json:"ghi_chu,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// ============ REFEREE MODELS ============

type Referee struct {
	ID            string    `json:"id"`
	TournamentID  string    `json:"tournament_id"`
	HoTen         string    `json:"ho_ten"`
	CapBac        string    `json:"cap_bac"`
	ChuyenMon     string    `json:"chuyen_mon"`
	TinhThanh     string    `json:"tinh_thanh,omitempty"`
	DienThoai     string    `json:"dien_thoai,omitempty"`
	Email         string    `json:"email,omitempty"`
	NamKinhNghiem int       `json:"nam_kinh_nghiem,omitempty"`
	TrangThai     string    `json:"trang_thai"`
	GhiChu        string    `json:"ghi_chu,omitempty"`
	UserID        string    `json:"user_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type RefereeAssignment struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	RefereeID    string    `json:"referee_id"`
	ArenaID      string    `json:"arena_id"`
	SessionDate  string    `json:"session_date"`
	SessionShift string    `json:"session_shift"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// ============ ARENA MODEL ============

type Arena struct {
	ID           string          `json:"id"`
	TournamentID string          `json:"tournament_id"`
	Ten          string          `json:"ten"`
	Loai         string          `json:"loai"`
	TrangThai    string          `json:"trang_thai"`
	SucChua      int             `json:"suc_chua"`
	ViTri        string          `json:"vi_tri,omitempty"`
	GhiChu       string          `json:"ghi_chu,omitempty"`
	Equipment    json.RawMessage `json:"equipment"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ============ COMPETITION MODELS ============

type CombatMatch struct {
	ID                string          `json:"id"`
	TournamentID      string          `json:"tournament_id"`
	ContentCategoryID string          `json:"content_category_id,omitempty"`
	WeightClassID     string          `json:"weight_class_id,omitempty"`
	ArenaID           string          `json:"arena_id,omitempty"`
	AthleteRedID      string          `json:"athlete_red_id,omitempty"`
	AthleteBlueID     string          `json:"athlete_blue_id,omitempty"`
	Vong              string          `json:"vong,omitempty"`
	BracketPosition   int             `json:"bracket_position,omitempty"`
	DiemDo            json.RawMessage `json:"diem_do"`
	DiemXanh          json.RawMessage `json:"diem_xanh"`
	PenaltiesRed      json.RawMessage `json:"penalties_red"`
	PenaltiesBlue     json.RawMessage `json:"penalties_blue"`
	KetQua            string          `json:"ket_qua,omitempty"`
	NguoiThangID      string          `json:"nguoi_thang_id,omitempty"`
	TrangThai         string          `json:"trang_thai"`
	ThoiGianBatDau    *time.Time      `json:"thoi_gian_bat_dau,omitempty"`
	ThoiGianKetThuc   *time.Time      `json:"thoi_gian_ket_thuc,omitempty"`
	EventLog          json.RawMessage `json:"event_log"`
	GhiChu            string          `json:"ghi_chu,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type FormPerformance struct {
	ID                string          `json:"id"`
	TournamentID      string          `json:"tournament_id"`
	ContentCategoryID string          `json:"content_category_id,omitempty"`
	ArenaID           string          `json:"arena_id,omitempty"`
	AthleteID         string          `json:"athlete_id,omitempty"`
	JudgeScores       json.RawMessage `json:"judge_scores"`
	DiemTrungBinh     float64         `json:"diem_trung_binh,omitempty"`
	DiemTruHigh       float64         `json:"diem_tru_high,omitempty"`
	DiemTruLow        float64         `json:"diem_tru_low,omitempty"`
	TongDiem          float64         `json:"tong_diem,omitempty"`
	XepHang           int             `json:"xep_hang,omitempty"`
	TrangThai         string          `json:"trang_thai"`
	GhiChu            string          `json:"ghi_chu,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type WeighIn struct {
	ID            string    `json:"id"`
	TournamentID  string    `json:"tournament_id"`
	AthleteID     string    `json:"athlete_id"`
	WeightClassID string    `json:"weight_class_id,omitempty"`
	CanNangThuc   float64   `json:"can_nang_thuc"`
	KetQua        string    `json:"ket_qua"`
	ThoiGian      time.Time `json:"thoi_gian"`
	NguoiCan      string    `json:"nguoi_can,omitempty"`
	GhiChu        string    `json:"ghi_chu,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// ============ SCHEDULE MODEL ============

type ScheduleEntry struct {
	ID                string    `json:"id"`
	TournamentID      string    `json:"tournament_id"`
	Ngay              string    `json:"ngay"`
	Buoi              string    `json:"buoi"`
	GioBatDau         string    `json:"gio_bat_dau"`
	GioKetThuc        string    `json:"gio_ket_thuc"`
	ArenaID           string    `json:"arena_id,omitempty"`
	ContentCategoryID string    `json:"content_category_id,omitempty"`
	SoTran            int       `json:"so_tran"`
	GhiChu            string    `json:"ghi_chu,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// ============ APPEAL MODEL ============

type Appeal struct {
	ID            string          `json:"id"`
	TournamentID  string          `json:"tournament_id"`
	Loai          string          `json:"loai"`
	TeamID        string          `json:"team_id,omitempty"`
	NoiDung       string          `json:"noi_dung"`
	MatchID       string          `json:"match_id,omitempty"`
	PerformanceID string          `json:"performance_id,omitempty"`
	TrangThai     string          `json:"trang_thai"`
	NguoiGui      string          `json:"nguoi_gui"`
	ThoiGianGui   time.Time       `json:"thoi_gian_gui"`
	NguoiXuLy     string          `json:"nguoi_xu_ly,omitempty"`
	KetLuan       string          `json:"ket_luan,omitempty"`
	ThoiGianXuLy  *time.Time      `json:"thoi_gian_xu_ly,omitempty"`
	Attachments   json.RawMessage `json:"attachments"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// ============ NOTIFICATION MODEL ============

type Notification struct {
	ID           string          `json:"id"`
	TournamentID string          `json:"tournament_id"`
	UserID       string          `json:"user_id"`
	Type         string          `json:"type"`
	Title        string          `json:"title"`
	Body         string          `json:"body,omitempty"`
	Data         json.RawMessage `json:"data,omitempty"`
	IsRead       bool            `json:"is_read"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ============ MEDICAL MODEL ============

type MedicalRecord struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	AthleteID    string    `json:"athlete_id"`
	MatchID      string    `json:"match_id,omitempty"`
	Type         string    `json:"type"`
	Description  string    `json:"description"`
	Severity     string    `json:"severity,omitempty"`
	ActionTaken  string    `json:"action_taken,omitempty"`
	CanContinue  bool      `json:"can_continue,omitempty"`
	ReportedBy   string    `json:"reported_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// ============ MEDIA MODEL ============

type MediaFile struct {
	ID           string          `json:"id"`
	TournamentID string          `json:"tournament_id"`
	UploadedBy   string          `json:"uploaded_by,omitempty"`
	Type         string          `json:"type"`
	URL          string          `json:"url"`
	ThumbnailURL string          `json:"thumbnail_url,omitempty"`
	Title        string          `json:"title,omitempty"`
	Description  string          `json:"description,omitempty"`
	Tags         json.RawMessage `json:"tags"`
	MatchID      string          `json:"match_id,omitempty"`
	AthleteID    string          `json:"athlete_id,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ============ DATA AUDIT MODEL ============

type DataAuditEntry struct {
	ID           string          `json:"id"`
	TournamentID string          `json:"tournament_id"`
	EntityType   string          `json:"entity_type"`
	EntityID     string          `json:"entity_id"`
	Action       string          `json:"action"`
	OldData      json.RawMessage `json:"old_data,omitempty"`
	NewData      json.RawMessage `json:"new_data,omitempty"`
	ChangedBy    string          `json:"changed_by,omitempty"`
	ChangedAt    time.Time       `json:"changed_at"`
}
