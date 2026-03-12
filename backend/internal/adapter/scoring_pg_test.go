package adapter

import (
	"context"
	"testing"

	"vct-platform/backend/internal/domain/scoring"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Scoring PG Adapter Conformance Tests
// ═══════════════════════════════════════════════════════════════

// ── Interface Conformance (compile-time check) ───────────────

var _ scoring.ScoringRepository = (*PgScoringRepository)(nil)

// ── Integration Tests ────────────────────────────────────────

func TestPgScoringRepository_EventLifecycle(t *testing.T) {
	db := pgTestDB(t)
	repo := NewPgScoringRepository(db)
	ctx := context.Background()
	matchID := "MATCH-PG-001"

	// Get next sequence (should be 1 for new match)
	seq, err := repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		t.Fatalf("GetNextSequenceNumber: %v", err)
	}
	if seq != 1 {
		t.Errorf("expected seq 1, got %d", seq)
	}

	// Append events
	event := scoring.MatchEvent{
		ID:             "EVT-PG-001",
		MatchID:        matchID,
		MatchType:      "combat",
		EventType:      scoring.EventMatchStart,
		SequenceNumber: seq,
		RecordedBy:     "user1",
		SyncStatus:     "synced",
	}
	if err := repo.AppendMatchEvent(ctx, event); err != nil {
		t.Fatalf("AppendMatchEvent: %v", err)
	}

	// Get events
	events, err := repo.GetMatchEvents(ctx, matchID)
	if err != nil {
		t.Fatalf("GetMatchEvents: %v", err)
	}
	if len(events) == 0 {
		t.Error("expected at least 1 event")
	}

	// Next sequence should be 2 now
	seq2, err := repo.GetNextSequenceNumber(ctx, matchID)
	if err != nil {
		t.Fatalf("GetNextSequenceNumber after append: %v", err)
	}
	if seq2 != 2 {
		t.Errorf("expected seq 2, got %d", seq2)
	}
}

func TestPgScoringRepository_JudgeScores(t *testing.T) {
	db := pgTestDB(t)
	repo := NewPgScoringRepository(db)
	ctx := context.Background()
	matchID := "MATCH-PG-JS"

	// Save judge score
	js := scoring.JudgeScore{
		MatchID:   matchID,
		RefereeID: "REF-001",
		AthleteID: "ATH-001",
		Score:     3.0,
	}
	if err := repo.SaveJudgeScore(ctx, js); err != nil {
		t.Fatalf("SaveJudgeScore: %v", err)
	}

	// Get judge scores
	scores, err := repo.GetJudgeScores(ctx, matchID)
	if err != nil {
		t.Fatalf("GetJudgeScores: %v", err)
	}
	if len(scores) == 0 {
		t.Error("expected at least 1 judge score")
	}

	// Upsert same referee (should update, not create duplicate)
	js.Score = 4.0
	if err := repo.SaveJudgeScore(ctx, js); err != nil {
		t.Fatalf("SaveJudgeScore upsert: %v", err)
	}
	scores2, _ := repo.GetJudgeScores(ctx, matchID)
	refCount := 0
	for _, s := range scores2 {
		if s.RefereeID == "REF-001" {
			refCount++
		}
	}
	if refCount > 1 {
		t.Errorf("expected 1 score per referee after upsert, got %d", refCount)
	}
}
