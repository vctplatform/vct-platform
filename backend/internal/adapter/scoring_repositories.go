package adapter

import (
	"context"
	"fmt"
	"sync"

	"vct-platform/backend/internal/domain/scoring"
)

// scoringRepo implements scoring.ScoringRepository using in-memory storage.
// Match events are stored as append-only lists keyed by matchID.
type scoringRepo struct {
	mu          sync.RWMutex
	events      map[string][]scoring.MatchEvent // matchID -> ordered events
	judgeScores map[string][]scoring.JudgeScore // matchID -> judge scores
	sequences   map[string]int64                // matchID -> next seq number
}

func NewScoringRepository() scoring.ScoringRepository {
	return &scoringRepo{
		events:      make(map[string][]scoring.MatchEvent),
		judgeScores: make(map[string][]scoring.JudgeScore),
		sequences:   make(map[string]int64),
	}
}

func (r *scoringRepo) AppendMatchEvent(_ context.Context, event scoring.MatchEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if event.MatchID == "" {
		return fmt.Errorf("match_id is required")
	}
	r.events[event.MatchID] = append(r.events[event.MatchID], event)
	r.sequences[event.MatchID] = event.SequenceNumber + 1
	return nil
}

func (r *scoringRepo) GetMatchEvents(_ context.Context, matchID string) ([]scoring.MatchEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	events, ok := r.events[matchID]
	if !ok {
		return nil, nil // empty is fine, not an error
	}
	// Return a copy to avoid data races
	out := make([]scoring.MatchEvent, len(events))
	copy(out, events)
	return out, nil
}

func (r *scoringRepo) GetNextSequenceNumber(_ context.Context, matchID string) (int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	seq, ok := r.sequences[matchID]
	if !ok {
		return 1, nil
	}
	return seq, nil
}

func (r *scoringRepo) SaveJudgeScore(_ context.Context, score scoring.JudgeScore) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if score.MatchID == "" {
		return fmt.Errorf("match_id is required")
	}
	// Replace existing score from same referee for same match (upsert)
	existing := r.judgeScores[score.MatchID]
	for i, js := range existing {
		if js.RefereeID == score.RefereeID {
			existing[i] = score
			r.judgeScores[score.MatchID] = existing
			return nil
		}
	}
	r.judgeScores[score.MatchID] = append(existing, score)
	return nil
}

func (r *scoringRepo) GetJudgeScores(_ context.Context, matchID string) ([]scoring.JudgeScore, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	scores := r.judgeScores[matchID]
	out := make([]scoring.JudgeScore, len(scores))
	copy(out, scores)
	return out, nil
}
