package scoring

import (
	"context"
	"fmt"
	"time"
)

// Service provides scoring business logic.
// It uses the ScoringRepository interface defined in repository.go.
type Service struct {
	repo   ScoringRepository
	config ScoringConfig
}

// NewService creates a new scoring service with the given repository and config.
func NewService(repo ScoringRepository, config ScoringConfig) *Service {
	return &Service{repo: repo, config: config}
}

// ── Combat Match Operations ──────────────────────────────────

// StartCombatMatch records the match start event.
func (s *Service) StartCombatMatch(ctx context.Context, matchID, userID string) error {
	seq, err := s.repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		return fmt.Errorf("start combat match: %w", err)
	}

	event := MatchEvent{
		MatchID:        matchID,
		MatchType:      "combat",
		EventType:      EventMatchStart,
		EventData:      map[string]any{"total_rounds": s.config.CombatRounds},
		SequenceNumber: seq,
		RecordedAt:     time.Now(),
		RecordedBy:     userID,
		SyncStatus:     "synced",
	}

	return s.repo.AppendMatchEvent(ctx, event)
}

// RecordCombatScore records a scoring event for a combat round.
func (s *Service) RecordCombatScore(ctx context.Context, matchID, userID string, round int, corner string, points float64) error {
	seq, err := s.repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		return fmt.Errorf("record combat score: %w", err)
	}

	var eventType MatchEventType
	switch corner {
	case "red":
		eventType = EventScoreRed
	case "blue":
		eventType = EventScoreBlue
	default:
		return fmt.Errorf("invalid corner: %s", corner)
	}

	event := MatchEvent{
		MatchID:        matchID,
		MatchType:      "combat",
		EventType:      eventType,
		EventData:      map[string]any{"points": points, "corner": corner},
		SequenceNumber: seq,
		RoundNumber:    round,
		RecordedAt:     time.Now(),
		RecordedBy:     userID,
		SyncStatus:     "synced",
	}

	return s.repo.AppendMatchEvent(ctx, event)
}

// RecordPenalty records a penalty event for a combat match.
func (s *Service) RecordPenalty(ctx context.Context, matchID, userID string, round int, corner string, deduction float64, reason string) error {
	seq, err := s.repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		return fmt.Errorf("record penalty: %w", err)
	}

	var eventType MatchEventType
	if corner == "red" {
		eventType = EventPenaltyRed
	} else {
		eventType = EventPenaltyBlue
	}

	event := MatchEvent{
		MatchID:        matchID,
		MatchType:      "combat",
		EventType:      eventType,
		EventData:      map[string]any{"deduction": deduction, "reason": reason, "corner": corner},
		SequenceNumber: seq,
		RoundNumber:    round,
		RecordedAt:     time.Now(),
		RecordedBy:     userID,
		SyncStatus:     "synced",
	}

	return s.repo.AppendMatchEvent(ctx, event)
}

// EndCombatMatch records the match end event and returns the result.
func (s *Service) EndCombatMatch(ctx context.Context, matchID, userID string) (CombatResult, error) {
	state, err := s.BuildCombatState(ctx, matchID)
	if err != nil {
		return CombatResult{}, fmt.Errorf("end combat match: %w", err)
	}

	result := CalculateCombatResult(state.RoundScores)

	seq, err := s.repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		return CombatResult{}, fmt.Errorf("end combat match seq: %w", err)
	}

	event := MatchEvent{
		MatchID:        matchID,
		MatchType:      "combat",
		EventType:      EventMatchEnd,
		EventData:      map[string]any{"winner": result.Winner, "method": result.Method},
		SequenceNumber: seq,
		RecordedAt:     time.Now(),
		RecordedBy:     userID,
		SyncStatus:     "synced",
	}

	if err := s.repo.AppendMatchEvent(ctx, event); err != nil {
		return CombatResult{}, fmt.Errorf("end combat match event: %w", err)
	}

	return result, nil
}

// BuildCombatState replays match events to compute current match state.
func (s *Service) BuildCombatState(ctx context.Context, matchID string) (CombatMatchState, error) {
	events, err := s.repo.GetMatchEvents(ctx, matchID)
	if err != nil {
		return CombatMatchState{}, fmt.Errorf("build combat state: %w", err)
	}

	state := CombatMatchState{
		MatchID:     matchID,
		Status:      "chua_dau",
		TotalRounds: s.config.CombatRounds,
		RoundScores: make([]CombatRoundScore, s.config.CombatRounds),
	}

	for i := range state.RoundScores {
		state.RoundScores[i].Round = i + 1
	}

	for _, e := range events {
		switch e.EventType {
		case EventMatchStart:
			state.Status = "dang_dau"
			state.CurrentRound = 1
			t := e.RecordedAt
			state.StartedAt = &t

		case EventMatchEnd:
			state.Status = "ket_thuc"
			t := e.RecordedAt
			state.EndedAt = &t
			if w, ok := e.EventData["winner"].(string); ok {
				state.WinnerID = w
			}
			if m, ok := e.EventData["method"].(string); ok {
				state.WinMethod = m
			}

		case EventRoundStart:
			if r := e.RoundNumber; r > 0 {
				state.CurrentRound = r
			}

		case EventScoreRed:
			if r := e.RoundNumber; r > 0 && r <= len(state.RoundScores) {
				if pts, ok := toFloat64(e.EventData["points"]); ok {
					state.RoundScores[r-1].ScoreRed += pts
				}
			}

		case EventScoreBlue:
			if r := e.RoundNumber; r > 0 && r <= len(state.RoundScores) {
				if pts, ok := toFloat64(e.EventData["points"]); ok {
					state.RoundScores[r-1].ScoreBlue += pts
				}
			}

		case EventPenaltyRed:
			if r := e.RoundNumber; r > 0 && r <= len(state.RoundScores) {
				if d, ok := toFloat64(e.EventData["deduction"]); ok {
					state.RoundScores[r-1].PenaltiesRed += d
				}
			}

		case EventPenaltyBlue:
			if r := e.RoundNumber; r > 0 && r <= len(state.RoundScores) {
				if d, ok := toFloat64(e.EventData["deduction"]); ok {
					state.RoundScores[r-1].PenaltiesBlue += d
				}
			}
		}
	}

	// Compute totals
	for _, rs := range state.RoundScores {
		state.TotalScoreRed += rs.ScoreRed - rs.PenaltiesRed
		state.TotalScoreBlue += rs.ScoreBlue - rs.PenaltiesBlue
	}

	return state, nil
}

// ── Forms Operations ─────────────────────────────────────────

// SubmitFormsScore records a judge's score for a forms performance.
func (s *Service) SubmitFormsScore(ctx context.Context, performanceID, refereeID, athleteID string, score float64) error {
	js := JudgeScore{
		MatchID:     performanceID,
		RefereeID:   refereeID,
		AthleteID:   athleteID,
		Score:       score,
		IsFinal:     false,
		SubmittedAt: time.Now(),
	}

	if err := s.repo.SaveJudgeScore(ctx, js); err != nil {
		return fmt.Errorf("submit forms score: %w", err)
	}

	// Also record as event
	seq, err := s.repo.GetNextSequenceNumber(ctx, performanceID)
	if err != nil {
		return fmt.Errorf("submit forms score seq: %w", err)
	}

	event := MatchEvent{
		MatchID:        performanceID,
		MatchType:      "forms",
		EventType:      EventFormScoreSubmit,
		EventData:      map[string]any{"referee_id": refereeID, "score": score},
		SequenceNumber: seq,
		RecordedAt:     time.Now(),
		RecordedBy:     refereeID,
		SyncStatus:     "synced",
	}

	return s.repo.AppendMatchEvent(ctx, event)
}

// FinalizeFormsPerformance calculates the final score using
// the drop-high/low algorithm and returns the result.
func (s *Service) FinalizeFormsPerformance(ctx context.Context, performanceID string) (FormsResult, error) {
	scores, err := s.repo.GetJudgeScores(ctx, performanceID)
	if err != nil {
		return FormsResult{}, fmt.Errorf("finalize forms: %w", err)
	}

	var raw []float64
	for _, js := range scores {
		raw = append(raw, js.Score)
	}

	result, err := CalculateFormsResult(raw, s.config.FormsDropHighLow)
	if err != nil {
		return FormsResult{}, fmt.Errorf("finalize forms calculation: %w", err)
	}

	// Record finalize event
	seq, seqErr := s.repo.GetNextSequenceNumber(ctx, performanceID)
	if seqErr != nil {
		return result, nil // Return result even if event recording fails
	}

	event := MatchEvent{
		MatchID:        performanceID,
		MatchType:      "forms",
		EventType:      EventFormFinalize,
		EventData:      map[string]any{"final_score": result.FinalScore, "judge_count": result.JudgeCount},
		SequenceNumber: seq,
		RecordedAt:     time.Now(),
		SyncStatus:     "synced",
	}

	_ = s.repo.AppendMatchEvent(ctx, event) // Best-effort event recording

	return result, nil
}

// ── Helpers ──────────────────────────────────────────────────

func toFloat64(v any) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	default:
		return 0, false
	}
}
