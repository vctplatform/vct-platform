package repository

import "vct-platform/backend/internal/domain"

// Repository is a generic typed repository interface.
// Concrete implementations convert between typed structs and
// the underlying map[string]any DataStore.
type Repository[T any] interface {
	List() ([]T, error)
	GetByID(id string) (*T, error)
	Create(item T) (*T, error)
	Update(id string, patch map[string]interface{}) (*T, error)
	Delete(id string) error
}

// TournamentRepository extends the generic repository with tournament-specific ops.
type TournamentRepository interface {
	Repository[domain.Tournament]
	ListByStatus(status string) ([]domain.Tournament, error)
}

// TeamRepository extends the generic repository with team-specific ops.
type TeamRepository interface {
	Repository[domain.Team]
	ListByTournament(tournamentID string) ([]domain.Team, error)
}

// AthleteRepository extends the generic repository with athlete-specific ops.
type AthleteRepository interface {
	Repository[domain.Athlete]
	ListByTeam(teamID string) ([]domain.Athlete, error)
	ListByTournament(tournamentID string) ([]domain.Athlete, error)
}

// RefereeRepository extends the generic repository with referee-specific ops.
type RefereeRepository interface {
	Repository[domain.Referee]
	ListByTournament(tournamentID string) ([]domain.Referee, error)
}

// ArenaRepository extends the generic repository with arena-specific ops.
type ArenaRepository interface {
	Repository[domain.Arena]
	ListByTournament(tournamentID string) ([]domain.Arena, error)
}

// RegistrationRepository for athlete event registrations.
type RegistrationRepository interface {
	Repository[domain.Registration]
	ListByAthlete(athleteID string) ([]domain.Registration, error)
	ListByTournament(tournamentID string) ([]domain.Registration, error)
}
