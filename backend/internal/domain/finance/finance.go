package finance

import (
	"context"
	"fmt"
	"time"
)

// ── Domain Models ────────────────────────────────────────────

type LoaiGiaoDich string

const (
	LoaiThu LoaiGiaoDich = "thu" // income
	LoaiChi LoaiGiaoDich = "chi" // expense
)

// Transaction represents a financial transaction (thu/chi).
type Transaction struct {
	ID        string       `json:"id"`
	Loai      LoaiGiaoDich `json:"loai"`     // "thu" or "chi"
	DanhMuc   string       `json:"danh_muc"` // category: "le_phi", "tai_tro", "thiet_bi"
	MoTa      string       `json:"mo_ta"`
	SoTien    float64      `json:"so_tien"`
	DonVi     string       `json:"don_vi"`  // "VND"
	NgayGD    string       `json:"ngay_gd"` // transaction date
	NguoiTao  string       `json:"nguoi_tao"`
	TrangThai string       `json:"trang_thai"` // "nhap", "da_duyet", "tu_choi"
	GhiChu    string       `json:"ghi_chu,omitempty"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// Budget represents an allocated budget for a category.
type Budget struct {
	ID          string    `json:"id"`
	DanhMuc     string    `json:"danh_muc"`
	HanMuc      float64   `json:"han_muc"`    // allocated amount
	DaSuDung    float64   `json:"da_su_dung"` // spent amount
	ConLai      float64   `json:"con_lai"`    // remaining
	NamTaiChinh int       `json:"nam_tai_chinh"`
	CreatedAt   time.Time `json:"created_at"`
}

// ── Repository ───────────────────────────────────────────────

type TransactionRepository interface {
	List(ctx context.Context) ([]Transaction, error)
	GetByID(ctx context.Context, id string) (*Transaction, error)
	Create(ctx context.Context, t Transaction) (*Transaction, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*Transaction, error)
	Delete(ctx context.Context, id string) error
	ListByCategory(ctx context.Context, danhMuc string) ([]Transaction, error)
}

type BudgetRepository interface {
	List(ctx context.Context) ([]Budget, error)
	GetByID(ctx context.Context, id string) (*Budget, error)
	Upsert(ctx context.Context, b Budget) error
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	txRepo     TransactionRepository
	budgetRepo BudgetRepository
}

func NewService(tx TransactionRepository, b BudgetRepository) *Service {
	return &Service{txRepo: tx, budgetRepo: b}
}

func (s *Service) ListTransactions(ctx context.Context) ([]Transaction, error) {
	return s.txRepo.List(ctx)
}

func (s *Service) GetTransaction(ctx context.Context, id string) (*Transaction, error) {
	return s.txRepo.GetByID(ctx, id)
}

func (s *Service) CreateTransaction(ctx context.Context, t Transaction) (*Transaction, error) {
	if t.SoTien <= 0 {
		return nil, fmt.Errorf("số tiền phải lớn hơn 0")
	}
	if t.Loai != LoaiThu && t.Loai != LoaiChi {
		return nil, fmt.Errorf("loại giao dịch phải là 'thu' hoặc 'chi'")
	}
	if t.TrangThai == "" {
		t.TrangThai = "nhap"
	}
	return s.txRepo.Create(ctx, t)
}

func (s *Service) ListBudgets(ctx context.Context) ([]Budget, error) {
	return s.budgetRepo.List(ctx)
}
