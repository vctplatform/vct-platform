package scoring

import "context"

// ── Repository Interface ─────────────────────────────────────
// Defined here as the canonical contract for the scoring domain.
// Implementations live in the adapter layer (e.g. adapter/postgres).
//
// NOTE: This is the single source of truth for the scoring repository
// interface. The Service depends on this interface for dependency injection.

// ScoringRepository defines the data access contract for the scoring domain.
type ScoringRepository interface {
	// Match Events (Event Sourcing — append-only)
	AppendMatchEvent(ctx context.Context, event MatchEvent) error
	GetMatchEvents(ctx context.Context, matchID string) ([]MatchEvent, error)
	GetNextSequenceNumber(ctx context.Context, matchID string) (int64, error)

	// Judge Scores
	SaveJudgeScore(ctx context.Context, score JudgeScore) error
	GetJudgeScores(ctx context.Context, matchID string) ([]JudgeScore, error)
}
