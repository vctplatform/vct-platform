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
