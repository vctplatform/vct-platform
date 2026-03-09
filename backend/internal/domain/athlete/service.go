package athlete

import (
	"context"
	"fmt"

	"vct-platform/backend/internal/domain"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateAthlete(ctx context.Context, a domain.Athlete) (*domain.Athlete, error) {
	if a.HoTen == "" {
		return nil, fmt.Errorf("họ tên vận động viên không được để trống")
	}
	if a.DoanID == "" {
		return nil, fmt.Errorf("vận động viên phải thuộc về một đoàn")
	}

	// Set default status if empty
	if a.TrangThai == "" {
		a.TrangThai = domain.TrangThaiVDVNhap
	}

	return s.repo.Create(ctx, a)
}

func (s *Service) GetAthlete(ctx context.Context, id string) (*domain.Athlete, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ListAthletes(ctx context.Context) ([]domain.Athlete, error) {
	return s.repo.List(ctx)
}

func (s *Service) ListByTeam(ctx context.Context, teamID string) ([]domain.Athlete, error) {
	return s.repo.ListByTeam(ctx, teamID)
}

func (s *Service) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Athlete, error) {
	return s.repo.ListByTournament(ctx, tournamentID)
}

func (s *Service) UpdateStatus(ctx context.Context, id string, status domain.TrangThaiVDV) (*domain.Athlete, error) {
	patch := map[string]interface{}{
		"trang_thai": status,
	}
	return s.repo.Update(ctx, id, patch)
}
