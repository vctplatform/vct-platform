package scoring

import (
	"context"

	"vct-platform/backend/internal/domain"
)

// RegistrationRepository defines operations for event registrations.
type RegistrationRepository interface {
	List(ctx context.Context) ([]domain.Registration, error)
	GetByID(ctx context.Context, id string) (*domain.Registration, error)
	Create(ctx context.Context, reg domain.Registration) (*domain.Registration, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Registration, error)
	Delete(ctx context.Context, id string) error
	ListByAthlete(ctx context.Context, athleteID string) ([]domain.Registration, error)
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Registration, error)
}
