package community

import (
	"context"
	"fmt"
	"time"
)

// ── Domain Models ────────────────────────────────────────────

// Club represents a martial arts club/school.
type Club struct {
	ID        string    `json:"id"`
	Ten       string    `json:"ten"`
	DiaChi    string    `json:"dia_chi"`
	Tinh      string    `json:"tinh"`
	ChuNhiem  string    `json:"chu_nhiem"` // owner/master name
	Sdt       string    `json:"sdt"`
	Email     string    `json:"email"`
	Website   string    `json:"website,omitempty"`
	SoHocVien int       `json:"so_hoc_vien"`
	TrangThai string    `json:"trang_thai"` // "hoat_dong", "tam_nghi", "giai_the"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Member represents a community member (practitioner, not necessarily a competing athlete).
type Member struct {
	ID        string    `json:"id"`
	HoTen     string    `json:"ho_ten"`
	ClubID    string    `json:"club_id"`
	ClubTen   string    `json:"club_ten"`
	BeltLevel int       `json:"belt_level"`
	NgaySinh  string    `json:"ngay_sinh"`
	Sdt       string    `json:"sdt"`
	Email     string    `json:"email,omitempty"`
	TrangThai string    `json:"trang_thai"` // "dang_tap", "nghi", "chuyen_clb"
	NgayTG    string    `json:"ngay_tg"`    // join date
	CreatedAt time.Time `json:"created_at"`
}

// Event represents a community event (seminar, camp, etc.).
type Event struct {
	ID          string    `json:"id"`
	Ten         string    `json:"ten"`
	Loai        string    `json:"loai"` // "seminar", "camp", "thang_hang", "giao_luu"
	NgayBatDau  string    `json:"ngay_bat_dau"`
	NgayKetThuc string    `json:"ngay_ket_thuc"`
	DiaDiem     string    `json:"dia_diem"`
	SoLuongMax  int       `json:"so_luong_max"`
	SoDangKy    int       `json:"so_dang_ky"`
	TrangThai   string    `json:"trang_thai"` // "sap_dien_ra", "dang_dien_ra", "ket_thuc"
	CreatedAt   time.Time `json:"created_at"`
}

// ── Repository ───────────────────────────────────────────────

type ClubRepository interface {
	List(ctx context.Context) ([]Club, error)
	GetByID(ctx context.Context, id string) (*Club, error)
	Create(ctx context.Context, c Club) (*Club, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*Club, error)
	Delete(ctx context.Context, id string) error
}

type MemberRepository interface {
	List(ctx context.Context) ([]Member, error)
	GetByID(ctx context.Context, id string) (*Member, error)
	Create(ctx context.Context, m Member) (*Member, error)
	ListByClub(ctx context.Context, clubID string) ([]Member, error)
}

type EventRepository interface {
	List(ctx context.Context) ([]Event, error)
	GetByID(ctx context.Context, id string) (*Event, error)
	Create(ctx context.Context, e Event) (*Event, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*Event, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	clubRepo   ClubRepository
	memberRepo MemberRepository
	eventRepo  EventRepository
}

func NewService(c ClubRepository, m MemberRepository, e EventRepository) *Service {
	return &Service{clubRepo: c, memberRepo: m, eventRepo: e}
}

// Club operations
func (s *Service) ListClubs(ctx context.Context) ([]Club, error) {
	return s.clubRepo.List(ctx)
}

func (s *Service) GetClub(ctx context.Context, id string) (*Club, error) {
	return s.clubRepo.GetByID(ctx, id)
}

func (s *Service) CreateClub(ctx context.Context, c Club) (*Club, error) {
	if c.Ten == "" {
		return nil, fmt.Errorf("tên câu lạc bộ không được để trống")
	}
	if c.TrangThai == "" {
		c.TrangThai = "hoat_dong"
	}
	return s.clubRepo.Create(ctx, c)
}

// Member operations
func (s *Service) ListMembers(ctx context.Context) ([]Member, error) {
	return s.memberRepo.List(ctx)
}

func (s *Service) ListMembersByClub(ctx context.Context, clubID string) ([]Member, error) {
	return s.memberRepo.ListByClub(ctx, clubID)
}

func (s *Service) CreateMember(ctx context.Context, m Member) (*Member, error) {
	if m.HoTen == "" {
		return nil, fmt.Errorf("họ tên hội viên không được để trống")
	}
	return s.memberRepo.Create(ctx, m)
}

// Event operations
func (s *Service) ListEvents(ctx context.Context) ([]Event, error) {
	return s.eventRepo.List(ctx)
}

func (s *Service) CreateEvent(ctx context.Context, e Event) (*Event, error) {
	if e.Ten == "" {
		return nil, fmt.Errorf("tên sự kiện không được để trống")
	}
	return s.eventRepo.Create(ctx, e)
}
