package organization

import (
	"context"

	"vct-platform/backend/internal/domain"
)

// TeamRepository defines operations for Teams (Đoàn).
type TeamRepository interface {
	List(ctx context.Context) ([]domain.Team, error)
	GetByID(ctx context.Context, id string) (*domain.Team, error)
	Create(ctx context.Context, team domain.Team) (*domain.Team, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Team, error)
	Delete(ctx context.Context, id string) error
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Team, error)
}

// RefereeRepository defines operations for Referees.
type RefereeRepository interface {
	List(ctx context.Context) ([]domain.Referee, error)
	GetByID(ctx context.Context, id string) (*domain.Referee, error)
	Create(ctx context.Context, ref domain.Referee) (*domain.Referee, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Referee, error)
	Delete(ctx context.Context, id string) error
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Referee, error)
}

// ArenaRepository defines operations for Arenas.
type ArenaRepository interface {
	List(ctx context.Context) ([]domain.Arena, error)
	GetByID(ctx context.Context, id string) (*domain.Arena, error)
	Create(ctx context.Context, arena domain.Arena) (*domain.Arena, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Arena, error)
	Delete(ctx context.Context, id string) error
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Arena, error)
}
