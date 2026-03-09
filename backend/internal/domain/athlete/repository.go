package athlete

import (
	"context"

	"vct-platform/backend/internal/domain"
)

// Repository is the interface for athlete data access.
type Repository interface {
	List(ctx context.Context) ([]domain.Athlete, error)
	GetByID(ctx context.Context, id string) (*domain.Athlete, error)
	Create(ctx context.Context, athlete domain.Athlete) (*domain.Athlete, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Athlete, error)
	Delete(ctx context.Context, id string) error
	ListByTeam(ctx context.Context, teamID string) ([]domain.Athlete, error)
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Athlete, error)
}
