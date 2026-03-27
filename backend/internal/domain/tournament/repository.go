package tournament

import "context"

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT REPOSITORY INTERFACE
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT MICRO-INTERFACES (ISP APPLIED)
// ════════════════════════════════════════════════════════════════

// TournamentCoreRepository isolates core tournament CRUD operations.
type TournamentCoreRepository interface {
	Create(ctx context.Context, t *Tournament) error
	GetByID(ctx context.Context, id string) (*Tournament, error)
	Update(ctx context.Context, t *Tournament) error
	List(ctx context.Context, filter ListFilter) ([]*Tournament, int, error)
}

// MatchRepository isolates match-specific data access.
type MatchRepository interface {
	CreateMatch(ctx context.Context, m *Match) error
	GetMatch(ctx context.Context, id string) (*Match, error)
	UpdateMatch(ctx context.Context, m *Match) error
	ListMatches(ctx context.Context, tournamentID string) ([]*Match, error)
}

// EventSourcingRepository isolates event append and replay mechanisms.
type EventSourcingRepository interface {
	AppendEvent(ctx context.Context, event *MatchEvent) error
	GetEvents(ctx context.Context, matchID string) ([]*MatchEvent, error)
	GetEventsSince(ctx context.Context, matchID string, seq int64) ([]*MatchEvent, error)
}

// Repository is a composed interface for backward compatibility with Adapters.
// Consumers (Services/Handlers) MUST ONLY use the Micro-Interfaces above.
type Repository interface {
	TournamentCoreRepository
	MatchRepository
	EventSourcingRepository
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

// ════════════════════════════════════════════════════════════════
// TOURNAMENT MANAGEMENT MICRO-INTERFACES
// ════════════════════════════════════════════════════════════════

// CategoryRepository manages competition categories.
type CategoryRepository interface {
	CreateCategory(ctx context.Context, c *Category) error
	GetCategory(ctx context.Context, id string) (*Category, error)
	UpdateCategory(ctx context.Context, c *Category) error
	DeleteCategory(ctx context.Context, id string) error
	ListCategories(ctx context.Context, tournamentID string) ([]*Category, error)
}

// RegistrationRepository manages team and athlete registrations.
type RegistrationRepository interface {
	CreateRegistration(ctx context.Context, r *Registration) error
	GetRegistration(ctx context.Context, id string) (*Registration, error)
	UpdateRegistration(ctx context.Context, r *Registration) error
	ListRegistrations(ctx context.Context, tournamentID string) ([]*Registration, error)
	AddRegistrationAthlete(ctx context.Context, a *RegistrationAthlete) error
	ListRegistrationAthletes(ctx context.Context, registrationID string) ([]*RegistrationAthlete, error)
}

// ScheduleRepository manages tournament scheduling.
type ScheduleRepository interface {
	CreateScheduleSlot(ctx context.Context, s *ScheduleSlot) error
	GetScheduleSlot(ctx context.Context, id string) (*ScheduleSlot, error)
	UpdateScheduleSlot(ctx context.Context, s *ScheduleSlot) error
	DeleteScheduleSlot(ctx context.Context, id string) error
	ListScheduleSlots(ctx context.Context, tournamentID string) ([]*ScheduleSlot, error)
}

// ArenaAssignmentRepository manages arena tracking.
type ArenaAssignmentRepository interface {
	CreateArenaAssignment(ctx context.Context, a *ArenaAssignment) error
	ListArenaAssignments(ctx context.Context, tournamentID string) ([]*ArenaAssignment, error)
	DeleteArenaAssignment(ctx context.Context, id string) error
}

// ResultRepository manages final outcomes per match/category.
type ResultRepository interface {
	RecordResult(ctx context.Context, r *TournamentResult) error
	GetResult(ctx context.Context, id string) (*TournamentResult, error)
	UpdateResult(ctx context.Context, r *TournamentResult) error
	ListResults(ctx context.Context, tournamentID string) ([]*TournamentResult, error)
}

// TeamStandingRepository tracks cumulative team performance.
type TeamStandingRepository interface {
	UpsertTeamStanding(ctx context.Context, s *TeamStanding) error
	ListTeamStandings(ctx context.Context, tournamentID string) ([]*TeamStanding, error)
}

// MgmtRepository is a composed interface maintaining backward compability in DI.
// Consumer services are advised to migrate to specific micro-interfaces above.
type MgmtRepository interface {
	CategoryRepository
	RegistrationRepository
	ScheduleRepository
	ArenaAssignmentRepository
	ResultRepository
	TeamStandingRepository
}
