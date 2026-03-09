package heritage

import (
	"context"
	"fmt"
	"time"
)

// ── Domain Models ────────────────────────────────────────────

// BeltRank represents a martial arts belt/grade level.
type BeltRank struct {
	ID        string    `json:"id"`
	Ten       string    `json:"ten"`     // e.g. "Huyền đai nhất đẳng"
	MauSac    string    `json:"mau_sac"` // e.g. "den"
	CapDo     int       `json:"cap_do"`  // numeric level, 1-10
	MoTa      string    `json:"mo_ta"`
	CreatedAt time.Time `json:"created_at"`
}

// Technique represents a martial arts technique in the curriculum.
type Technique struct {
	ID        string    `json:"id"`
	Ten       string    `json:"ten"`       // Technique name
	TenTieng  string    `json:"ten_tieng"` // Vietnamese traditional name
	Loai      string    `json:"loai"`      // "don", "quyen", "tu_ve"
	CapDo     int       `json:"cap_do"`    // belt level required
	MoTa      string    `json:"mo_ta"`
	VideoURL  string    `json:"video_url,omitempty"`
	Tags      []string  `json:"tags,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// CurriculumItem maps techniques to belt levels.
type CurriculumItem struct {
	ID          string `json:"id"`
	BeltRankID  string `json:"belt_rank_id"`
	TechniqueID string `json:"technique_id"`
	BatBuoc     bool   `json:"bat_buoc"` // mandatory or optional
	ThuTu       int    `json:"thu_tu"`   // display order
}

// ── Repository ───────────────────────────────────────────────

type BeltRankRepository interface {
	List(ctx context.Context) ([]BeltRank, error)
	GetByID(ctx context.Context, id string) (*BeltRank, error)
	Create(ctx context.Context, b BeltRank) (*BeltRank, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*BeltRank, error)
	Delete(ctx context.Context, id string) error
}

type TechniqueRepository interface {
	List(ctx context.Context) ([]Technique, error)
	GetByID(ctx context.Context, id string) (*Technique, error)
	Create(ctx context.Context, t Technique) (*Technique, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*Technique, error)
	Delete(ctx context.Context, id string) error
	ListByCategory(ctx context.Context, loai string) ([]Technique, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	beltRepo BeltRankRepository
	techRepo TechniqueRepository
}

func NewService(b BeltRankRepository, t TechniqueRepository) *Service {
	return &Service{beltRepo: b, techRepo: t}
}

// Belt operations
func (s *Service) ListBelts(ctx context.Context) ([]BeltRank, error) {
	return s.beltRepo.List(ctx)
}

func (s *Service) GetBelt(ctx context.Context, id string) (*BeltRank, error) {
	return s.beltRepo.GetByID(ctx, id)
}

func (s *Service) CreateBelt(ctx context.Context, b BeltRank) (*BeltRank, error) {
	if b.Ten == "" {
		return nil, fmt.Errorf("tên đai không được để trống")
	}
	return s.beltRepo.Create(ctx, b)
}

// Technique operations
func (s *Service) ListTechniques(ctx context.Context) ([]Technique, error) {
	return s.techRepo.List(ctx)
}

func (s *Service) GetTechnique(ctx context.Context, id string) (*Technique, error) {
	return s.techRepo.GetByID(ctx, id)
}

func (s *Service) CreateTechnique(ctx context.Context, t Technique) (*Technique, error) {
	if t.Ten == "" {
		return nil, fmt.Errorf("tên kỹ thuật không được để trống")
	}
	return s.techRepo.Create(ctx, t)
}

func (s *Service) ListTechniquesByCategory(ctx context.Context, loai string) ([]Technique, error) {
	return s.techRepo.ListByCategory(ctx, loai)
}
