package scoring

import (
	"context"
	"testing"
)

// mockScoringRepo is a simple in-memory implementation for testing.
type mockScoringRepo struct {
	events map[string][]MatchEvent
	scores map[string][]JudgeScore
	seqs   map[string]int64
}

func newMockRepo() *mockScoringRepo {
	return &mockScoringRepo{
		events: make(map[string][]MatchEvent),
		scores: make(map[string][]JudgeScore),
		seqs:   make(map[string]int64),
	}
}

func (m *mockScoringRepo) AppendMatchEvent(_ context.Context, event MatchEvent) error {
	m.events[event.MatchID] = append(m.events[event.MatchID], event)
	m.seqs[event.MatchID] = event.SequenceNumber + 1
	return nil
}

func (m *mockScoringRepo) GetMatchEvents(_ context.Context, matchID string) ([]MatchEvent, error) {
	return m.events[matchID], nil
}

func (m *mockScoringRepo) GetNextSequenceNumber(_ context.Context, matchID string) (int64, error) {
	seq := m.seqs[matchID]
	if seq == 0 {
		return 1, nil
	}
	return seq, nil
}

func (m *mockScoringRepo) SaveJudgeScore(_ context.Context, score JudgeScore) error {
	existing := m.scores[score.MatchID]
	for i, js := range existing {
		if js.RefereeID == score.RefereeID {
			existing[i] = score
			m.scores[score.MatchID] = existing
			return nil
		}
	}
	m.scores[score.MatchID] = append(existing, score)
	return nil
}

func (m *mockScoringRepo) GetJudgeScores(_ context.Context, matchID string) ([]JudgeScore, error) {
	return m.scores[matchID], nil
}

func TestCombatMatchLifecycle(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, DefaultScoringConfig())
	ctx := context.Background()
	matchID := "MATCH-001"

	// Start match
	if err := svc.StartCombatMatch(ctx, matchID, "user1"); err != nil {
		t.Fatalf("StartCombatMatch failed: %v", err)
	}

	// Verify state after start
	state, err := svc.BuildCombatState(ctx, matchID)
	if err != nil {
		t.Fatalf("BuildCombatState after start: %v", err)
	}
	if state.Status != "dang_dau" {
		t.Errorf("expected status dang_dau, got %s", state.Status)
	}
	if state.TotalRounds != 3 {
		t.Errorf("expected 3 rounds, got %d", state.TotalRounds)
	}

	// Score round 1: Red 3.0, Blue 2.0
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 1, "red", 3.0); err != nil {
		t.Fatalf("RecordCombatScore red R1: %v", err)
	}
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 1, "blue", 2.0); err != nil {
		t.Fatalf("RecordCombatScore blue R1: %v", err)
	}

	// Score round 2: Blue 4.0, Red 1.0
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 2, "blue", 4.0); err != nil {
		t.Fatalf("RecordCombatScore blue R2: %v", err)
	}
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 2, "red", 1.0); err != nil {
		t.Fatalf("RecordCombatScore red R2: %v", err)
	}

	// Score round 3: Red 5.0, Blue 1.0
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 3, "red", 5.0); err != nil {
		t.Fatalf("RecordCombatScore red R3: %v", err)
	}
	if err := svc.RecordCombatScore(ctx, matchID, "judge1", 3, "blue", 1.0); err != nil {
		t.Fatalf("RecordCombatScore blue R3: %v", err)
	}

	// Add a penalty to round 2 red
	if err := svc.RecordPenalty(ctx, matchID, "judge1", 2, "red", 0.5, "bước ra ngoài"); err != nil {
		t.Fatalf("RecordPenalty: %v", err)
	}

	// Build state and verify scores
	state, err = svc.BuildCombatState(ctx, matchID)
	if err != nil {
		t.Fatalf("BuildCombatState after scoring: %v", err)
	}

	// Round 1: red 3, blue 2
	if state.RoundScores[0].ScoreRed != 3.0 || state.RoundScores[0].ScoreBlue != 2.0 {
		t.Errorf("R1 scores: red=%.1f blue=%.1f, want red=3.0 blue=2.0",
			state.RoundScores[0].ScoreRed, state.RoundScores[0].ScoreBlue)
	}
	// Round 2: red 1 (- 0.5 pen), blue 4
	if state.RoundScores[1].PenaltiesRed != 0.5 {
		t.Errorf("R2 penalty red: got %.1f, want 0.5", state.RoundScores[1].PenaltiesRed)
	}

	// End match
	result, err := svc.EndCombatMatch(ctx, matchID, "user1")
	if err != nil {
		t.Fatalf("EndCombatMatch: %v", err)
	}

	// Red won R1 (3>2), Blue won R2 (4 > 1-0.5=0.5), Red won R3 (5>1)
	// Red wins 2 rounds to 1
	if result.Winner != "red" {
		t.Errorf("expected winner red, got %s", result.Winner)
	}
	if result.Method != "points" {
		t.Errorf("expected method points, got %s", result.Method)
	}

	// Final state should be ket_thuc
	state, _ = svc.BuildCombatState(ctx, matchID)
	if state.Status != "ket_thuc" {
		t.Errorf("expected status ket_thuc, got %s", state.Status)
	}
}

func TestFormsLifecycle(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, DefaultScoringConfig())
	ctx := context.Background()
	perfID := "PERF-001"

	// Submit 5 judge scores
	scores := []float64{8.5, 9.0, 7.5, 8.0, 9.5}
	referees := []string{"ref1", "ref2", "ref3", "ref4", "ref5"}

	for i, score := range scores {
		if err := svc.SubmitFormsScore(ctx, perfID, referees[i], "athlete1", score); err != nil {
			t.Fatalf("SubmitFormsScore %s: %v", referees[i], err)
		}
	}

	// Finalize: drop high (9.5) and low (7.5), avg of 8.5, 9.0, 8.0 = 8.5
	result, err := svc.FinalizeFormsPerformance(ctx, perfID)
	if err != nil {
		t.Fatalf("FinalizeFormsPerformance: %v", err)
	}

	if result.JudgeCount != 5 {
		t.Errorf("expected 5 judges, got %d", result.JudgeCount)
	}
	if result.HighDropped != 9.5 {
		t.Errorf("expected high dropped 9.5, got %.1f", result.HighDropped)
	}
	if result.LowDropped != 7.5 {
		t.Errorf("expected low dropped 7.5, got %.1f", result.LowDropped)
	}
	expectedFinal := 8.5 // (8.5 + 9.0 + 8.0) / 3 = 8.5
	if result.FinalScore != expectedFinal {
		t.Errorf("expected final score %.2f, got %.2f", expectedFinal, result.FinalScore)
	}
}

func TestCombatInvalidCorner(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, DefaultScoringConfig())
	ctx := context.Background()

	err := svc.RecordCombatScore(ctx, "MATCH-X", "judge1", 1, "green", 5.0)
	if err == nil {
		t.Fatal("expected error for invalid corner 'green', got nil")
	}
}

func TestEventSequencing(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, DefaultScoringConfig())
	ctx := context.Background()
	matchID := "MATCH-SEQ"

	_ = svc.StartCombatMatch(ctx, matchID, "u1")
	_ = svc.RecordCombatScore(ctx, matchID, "u1", 1, "red", 2)
	_ = svc.RecordCombatScore(ctx, matchID, "u1", 1, "blue", 3)

	events, err := repo.GetMatchEvents(ctx, matchID)
	if err != nil {
		t.Fatalf("GetMatchEvents: %v", err)
	}

	if len(events) != 3 {
		t.Fatalf("expected 3 events, got %d", len(events))
	}

	// Verify sequence numbers are monotonically increasing
	for i := 1; i < len(events); i++ {
		if events[i].SequenceNumber <= events[i-1].SequenceNumber {
			t.Errorf("event %d seq (%d) not greater than event %d seq (%d)",
				i, events[i].SequenceNumber, i-1, events[i-1].SequenceNumber)
		}
	}
}
