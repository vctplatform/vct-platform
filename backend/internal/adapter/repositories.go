package adapter

import (
	"context"

	"vct-platform/backend/internal/domain"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/domain/organization"
	"vct-platform/backend/internal/domain/scoring"
	"vct-platform/backend/internal/store"
)

// -- Athlete Repository --

type athleteRepo struct {
	*StoreAdapter[domain.Athlete]
}

func NewAthleteRepository(ds store.DataStore) athlete.Repository {
	return &athleteRepo{
		StoreAdapter: NewStoreAdapter[domain.Athlete](ds, "athletes"),
	}
}

func (r *athleteRepo) List(ctx context.Context) ([]domain.Athlete, error) {
	return r.StoreAdapter.List()
}
func (r *athleteRepo) GetByID(ctx context.Context, id string) (*domain.Athlete, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *athleteRepo) Create(ctx context.Context, item domain.Athlete) (*domain.Athlete, error) {
	return r.StoreAdapter.Create(item)
}
func (r *athleteRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Athlete, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *athleteRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

func (r *athleteRepo) ListByTeam(ctx context.Context, teamID string) ([]domain.Athlete, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var filtered []domain.Athlete
	for _, a := range all {
		if a.DoanID == teamID {
			filtered = append(filtered, a)
		}
	}
	return filtered, nil
}

func (r *athleteRepo) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Athlete, error) {
	// Not implemented filter, returning all for now as tournament relation is complex
	return r.List(ctx)
}

// -- Team Repository --

type teamRepo struct {
	*StoreAdapter[domain.Team]
}

func NewTeamRepository(ds store.DataStore) organization.TeamRepository {
	return &teamRepo{
		StoreAdapter: NewStoreAdapter[domain.Team](ds, "teams"),
	}
}

func (r *teamRepo) List(ctx context.Context) ([]domain.Team, error) {
	return r.StoreAdapter.List()
}
func (r *teamRepo) GetByID(ctx context.Context, id string) (*domain.Team, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *teamRepo) Create(ctx context.Context, item domain.Team) (*domain.Team, error) {
	return r.StoreAdapter.Create(item)
}
func (r *teamRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Team, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *teamRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

func (r *teamRepo) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Team, error) {
	return r.List(ctx) // Placeholder filter
}

// -- Referee Repository --

type refRepo struct {
	*StoreAdapter[domain.Referee]
}

func NewRefereeRepository(ds store.DataStore) organization.RefereeRepository {
	return &refRepo{
		StoreAdapter: NewStoreAdapter[domain.Referee](ds, "referees"),
	}
}

func (r *refRepo) List(ctx context.Context) ([]domain.Referee, error) {
	return r.StoreAdapter.List()
}
func (r *refRepo) GetByID(ctx context.Context, id string) (*domain.Referee, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *refRepo) Create(ctx context.Context, item domain.Referee) (*domain.Referee, error) {
	return r.StoreAdapter.Create(item)
}
func (r *refRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Referee, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *refRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

func (r *refRepo) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Referee, error) {
	return r.List(ctx)
}

// -- Arena Repository --

type arenaRepo struct {
	*StoreAdapter[domain.Arena]
}

func NewArenaRepository(ds store.DataStore) organization.ArenaRepository {
	return &arenaRepo{
		StoreAdapter: NewStoreAdapter[domain.Arena](ds, "arenas"),
	}
}

func (r *arenaRepo) List(ctx context.Context) ([]domain.Arena, error) {
	return r.StoreAdapter.List()
}
func (r *arenaRepo) GetByID(ctx context.Context, id string) (*domain.Arena, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *arenaRepo) Create(ctx context.Context, item domain.Arena) (*domain.Arena, error) {
	return r.StoreAdapter.Create(item)
}
func (r *arenaRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Arena, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *arenaRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

func (r *arenaRepo) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Arena, error) {
	return r.List(ctx)
}

// -- Registration Repository --

type regRepo struct {
	*StoreAdapter[domain.Registration]
}

func NewRegistrationRepository(ds store.DataStore) scoring.RegistrationRepository {
	return &regRepo{
		StoreAdapter: NewStoreAdapter[domain.Registration](ds, "registrations"),
	}
}

func (r *regRepo) List(ctx context.Context) ([]domain.Registration, error) {
	return r.StoreAdapter.List()
}
func (r *regRepo) GetByID(ctx context.Context, id string) (*domain.Registration, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *regRepo) Create(ctx context.Context, item domain.Registration) (*domain.Registration, error) {
	return r.StoreAdapter.Create(item)
}
func (r *regRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*domain.Registration, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *regRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

func (r *regRepo) ListByAthlete(ctx context.Context, athleteID string) ([]domain.Registration, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var res []domain.Registration
	for _, reg := range all {
		if reg.VdvID == athleteID {
			res = append(res, reg)
		}
	}
	return res, nil
}

func (r *regRepo) ListByTournament(ctx context.Context, tournamentID string) ([]domain.Registration, error) {
	return r.List(ctx) // Placeholder filter
}
