package organization

import (
	"context"
	"fmt"

	"vct-platform/backend/internal/domain"
)

// Service provides logic for organization entities: Teams, Referees, and Arenas.
type Service struct {
	teamRepo  TeamRepository
	refRepo   RefereeRepository
	arenaRepo ArenaRepository
}

func NewService(team TeamRepository, ref RefereeRepository, arena ArenaRepository) *Service {
	return &Service{
		teamRepo:  team,
		refRepo:   ref,
		arenaRepo: arena,
	}
}

// -- Team --

func (s *Service) CreateTeam(ctx context.Context, t domain.Team) (*domain.Team, error) {
	if t.Ten == "" {
		return nil, fmt.Errorf("tên đoàn không được để trống")
	}
	if t.TrangThai == "" {
		t.TrangThai = domain.TrangThaiDoanNhap
	}
	return s.teamRepo.Create(ctx, t)
}

func (s *Service) GetTeam(ctx context.Context, id string) (*domain.Team, error) {
	return s.teamRepo.GetByID(ctx, id)
}

func (s *Service) ListTeams(ctx context.Context) ([]domain.Team, error) {
	return s.teamRepo.List(ctx)
}

func (s *Service) UpdateTeamStatus(ctx context.Context, id string, status domain.TrangThaiDoan) (*domain.Team, error) {
	patch := map[string]interface{}{
		"trang_thai": status,
	}
	return s.teamRepo.Update(ctx, id, patch)
}

// -- Referee --

func (s *Service) CreateReferee(ctx context.Context, r domain.Referee) (*domain.Referee, error) {
	if r.HoTen == "" {
		return nil, fmt.Errorf("họ tên trọng tài không được để trống")
	}
	return s.refRepo.Create(ctx, r)
}

func (s *Service) GetReferee(ctx context.Context, id string) (*domain.Referee, error) {
	return s.refRepo.GetByID(ctx, id)
}

func (s *Service) ListReferees(ctx context.Context) ([]domain.Referee, error) {
	return s.refRepo.List(ctx)
}

// -- Arena --

func (s *Service) CreateArena(ctx context.Context, a domain.Arena) (*domain.Arena, error) {
	if a.Ten == "" {
		return nil, fmt.Errorf("tên sàn đấu không được để trống")
	}
	return s.arenaRepo.Create(ctx, a)
}

func (s *Service) ListArenas(ctx context.Context) ([]domain.Arena, error) {
	return s.arenaRepo.List(ctx)
}

func (s *Service) GetArena(ctx context.Context, id string) (*domain.Arena, error) {
	return s.arenaRepo.GetByID(ctx, id)
}
