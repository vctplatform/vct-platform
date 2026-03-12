package tournament

import "context"

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT REPOSITORY INTERFACE
// ════════════════════════════════════════════════════════════════

// Repository defines the interface for tournament data access.
// Implementations live in the adapter layer (e.g., adapter/postgres).
type Repository interface {
	// Tournament CRUD
	Create(ctx context.Context, t *Tournament) error
	GetByID(ctx context.Context, id string) (*Tournament, error)
	Update(ctx context.Context, t *Tournament) error
	List(ctx context.Context, filter ListFilter) ([]*Tournament, int, error)

	// Match operations
	CreateMatch(ctx context.Context, m *Match) error
	GetMatch(ctx context.Context, id string) (*Match, error)
	UpdateMatch(ctx context.Context, m *Match) error
	ListMatches(ctx context.Context, tournamentID string) ([]*Match, error)

	// Event Sourcing
	AppendEvent(ctx context.Context, event *MatchEvent) error
	GetEvents(ctx context.Context, matchID string) ([]*MatchEvent, error)
	GetEventsSince(ctx context.Context, matchID string, seq int64) ([]*MatchEvent, error)
}

// ListFilter defines parameters for listing tournaments
type ListFilter struct {
	Status    string
	Level     string
	Province  string
	Year      int
	Page      int
	PageSize  int
	SortBy    string
	SortOrder string
}

// ════════════════════════════════════════════════════════════════
// TOURNAMENT MANAGEMENT REPOSITORY
// ════════════════════════════════════════════════════════════════

// MgmtRepository defines data access for tournament management operations.
type MgmtRepository interface {
	// Categories
	CreateCategory(ctx context.Context, c *Category) error
	GetCategory(ctx context.Context, id string) (*Category, error)
	UpdateCategory(ctx context.Context, c *Category) error
	DeleteCategory(ctx context.Context, id string) error
	ListCategories(ctx context.Context, tournamentID string) ([]*Category, error)

	// Registrations
	CreateRegistration(ctx context.Context, r *Registration) error
	GetRegistration(ctx context.Context, id string) (*Registration, error)
	UpdateRegistration(ctx context.Context, r *Registration) error
	ListRegistrations(ctx context.Context, tournamentID string) ([]*Registration, error)

	// Registration Athletes
	AddRegistrationAthlete(ctx context.Context, a *RegistrationAthlete) error
	ListRegistrationAthletes(ctx context.Context, registrationID string) ([]*RegistrationAthlete, error)

	// Schedule
	CreateScheduleSlot(ctx context.Context, s *ScheduleSlot) error
	GetScheduleSlot(ctx context.Context, id string) (*ScheduleSlot, error)
	UpdateScheduleSlot(ctx context.Context, s *ScheduleSlot) error
	DeleteScheduleSlot(ctx context.Context, id string) error
	ListScheduleSlots(ctx context.Context, tournamentID string) ([]*ScheduleSlot, error)

	// Arena Assignments
	CreateArenaAssignment(ctx context.Context, a *ArenaAssignment) error
	ListArenaAssignments(ctx context.Context, tournamentID string) ([]*ArenaAssignment, error)
	DeleteArenaAssignment(ctx context.Context, id string) error

	// Results
	RecordResult(ctx context.Context, r *TournamentResult) error
	GetResult(ctx context.Context, id string) (*TournamentResult, error)
	UpdateResult(ctx context.Context, r *TournamentResult) error
	ListResults(ctx context.Context, tournamentID string) ([]*TournamentResult, error)

	// Team Standings
	UpsertTeamStanding(ctx context.Context, s *TeamStanding) error
	ListTeamStandings(ctx context.Context, tournamentID string) ([]*TeamStanding, error)
}
