package ranking

import (
	"context"
	"time"
)

// ── Domain Models ────────────────────────────────────────────

// AthleteRanking represents an athlete's position in a ranking table.
type AthleteRanking struct {
	ID        string    `json:"id"`
	VdvID     string    `json:"vdv_id"`
	VdvTen    string    `json:"vdv_ten"`
	DoanID    string    `json:"doan_id"`
	DoanTen   string    `json:"doan_ten"`
	HangMuc   string    `json:"hang_muc"` // e.g. "doi_khang_nam_60kg"
	EloRating float64   `json:"elo_rating"`
	Rank      int       `json:"rank"`
	Wins      int       `json:"wins"`
	Losses    int       `json:"losses"`
	Draws     int       `json:"draws"`
	GoldCount int       `json:"gold_count"`
	SilverCnt int       `json:"silver_count"`
	BronzeCnt int       `json:"bronze_count"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TeamRanking represents a team's medal tally and ranking.
type TeamRanking struct {
	ID        string    `json:"id"`
	DoanID    string    `json:"doan_id"`
	DoanTen   string    `json:"doan_ten"`
	Gold      int       `json:"gold"`
	Silver    int       `json:"silver"`
	Bronze    int       `json:"bronze"`
	TotalPts  float64   `json:"total_pts"`
	Rank      int       `json:"rank"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ── Repository ───────────────────────────────────────────────

type AthleteRankingRepository interface {
	List(ctx context.Context) ([]AthleteRanking, error)
	GetByID(ctx context.Context, id string) (*AthleteRanking, error)
	Upsert(ctx context.Context, r AthleteRanking) error
	ListByCategory(ctx context.Context, hangMuc string) ([]AthleteRanking, error)
}

type TeamRankingRepository interface {
	List(ctx context.Context) ([]TeamRanking, error)
	GetByID(ctx context.Context, id string) (*TeamRanking, error)
	Upsert(ctx context.Context, r TeamRanking) error
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	athleteRepo AthleteRankingRepository
	teamRepo    TeamRankingRepository
}

func NewService(ar AthleteRankingRepository, tr TeamRankingRepository) *Service {
	return &Service{athleteRepo: ar, teamRepo: tr}
}

func (s *Service) ListAthleteRankings(ctx context.Context) ([]AthleteRanking, error) {
	return s.athleteRepo.List(ctx)
}

func (s *Service) ListAthleteRankingsByCategory(ctx context.Context, category string) ([]AthleteRanking, error) {
	return s.athleteRepo.ListByCategory(ctx, category)
}

func (s *Service) GetAthleteRanking(ctx context.Context, id string) (*AthleteRanking, error) {
	return s.athleteRepo.GetByID(ctx, id)
}

func (s *Service) ListTeamRankings(ctx context.Context) ([]TeamRanking, error) {
	return s.teamRepo.List(ctx)
}

func (s *Service) GetTeamRanking(ctx context.Context, id string) (*TeamRanking, error) {
	return s.teamRepo.GetByID(ctx, id)
}
