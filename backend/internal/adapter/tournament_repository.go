package adapter

import (
	"context"

	"vct-platform/backend/internal/domain"
	"vct-platform/backend/internal/store"
)

// -- Tournament Repository --
// Note: The tournament.Repository interface is complex (includes Match and Event Sourcing).
// This is a simplified CRUD-only adapter. The full tournament.Repository
// interface should be implemented with PostgreSQL when sqlc is configured.

type tournamentRepo struct {
	*StoreAdapter[domain.Tournament]
}

// TournamentCRUD defines a simplified CRUD interface for tournaments.
type TournamentCRUD interface {
	List(ctx context.Context) ([]domain.Tournament, error)
	GetByID(ctx context.Context, id string) (*domain.Tournament, error)
	Create(ctx context.Context, item domain.Tournament) (*domain.Tournament, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Tournament, error)
	Delete(ctx context.Context, id string) error
}

func NewTournamentRepository(ds store.DataStore) TournamentCRUD {
	return &tournamentRepo{
		StoreAdapter: NewStoreAdapter[domain.Tournament](ds, "tournaments"),
	}
}

func (r *tournamentRepo) List(ctx context.Context) ([]domain.Tournament, error) {
	return r.StoreAdapter.List()
}
func (r *tournamentRepo) GetByID(ctx context.Context, id string) (*domain.Tournament, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *tournamentRepo) Create(ctx context.Context, item domain.Tournament) (*domain.Tournament, error) {
	return r.StoreAdapter.Create(item)
}
func (r *tournamentRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Tournament, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *tournamentRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}
