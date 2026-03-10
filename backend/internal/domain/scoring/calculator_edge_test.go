package scoring

import (
	"math"
	"testing"
)

// ── ELO Edge Cases ───────────────────────────────────────────

func TestCalculateEloChange_Draw(t *testing.T) {
	// Draw between equal players: no change expected
	newA, newB := CalculateEloChange(1500, 1500, 0.5)

	if math.Abs(newA-1500) > 0.01 {
		t.Errorf("expected no ELO change for draw, A=%0.2f", newA)
	}
	if math.Abs(newB-1500) > 0.01 {
		t.Errorf("expected no ELO change for draw, B=%0.2f", newB)
	}
}

func TestCalculateEloChange_DrawUnequalRatings(t *testing.T) {
	// Draw between unequal players: favorites loses rating, underdog gains
	newA, newB := CalculateEloChange(1800, 1200, 0.5)

	if newA >= 1800 {
		t.Errorf("expected favorite to lose rating on draw, got %.2f", newA)
	}
	if newB <= 1200 {
		t.Errorf("expected underdog to gain rating on draw, got %.2f", newB)
	}
}

func TestCalculateEloChange_RatingFloor(t *testing.T) {
	// Very low rated player (100) loses to high rated (2800)
	newA, newB := CalculateEloChange(100, 2800, 0.0)

	// Low rated player should not go negative or unreasonably low
	if newA < 0 {
		t.Errorf("ELO should not go negative, got %.2f", newA)
	}
	// Change should be minimal since expected result matches
	expectedA := 1.0 / (1.0 + math.Pow(10, (2800-100)/400.0))
	changeA := eloBaseK * (0.0 - expectedA)
	if math.Abs((newA-100)-changeA) > 0.02 {
		t.Errorf("unexpected ELO change for low rated player: delta=%.2f", newA-100)
	}
	_ = newB // we just care about floor behavior of A
}

func TestCalculateEloChange_HighRating(t *testing.T) {
	// Very high rated player (3000) beats low rated (1000)
	newA, newB := CalculateEloChange(3000, 1000, 1.0)

	// Winner should gain very little
	gainA := newA - 3000
	if gainA > 1.0 {
		t.Errorf("expected minimal gain for high-rated favorite, gained %.2f", gainA)
	}
	if gainA < 0 {
		t.Errorf("winner should not lose rating, got %.2f", gainA)
	}
	_ = newB
}

func TestCalculateEloChange_SamePlayer(t *testing.T) {
	// Edge case: same rating, one wins (should just be K/2 change)
	newA, newB := CalculateEloChange(1500, 1500, 1.0)

	expectedChange := eloBaseK * 0.5 // expected was 0.5, score was 1.0
	if math.Abs((newA-1500)-expectedChange) > 0.01 {
		t.Errorf("expected change of %.2f, got %.2f", expectedChange, newA-1500)
	}
	if math.Abs((1500-newB)-expectedChange) > 0.01 {
		t.Errorf("expected symmetric loss of %.2f, got %.2f", expectedChange, 1500-newB)
	}
}

// ── Forms Edge Cases ─────────────────────────────────────────

func TestCalculateFormsResult_SingleJudge(t *testing.T) {
	scores := []float64{8.5}
	result, err := CalculateFormsResult(scores, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinalScore != 8.5 {
		t.Errorf("expected 8.5 for single judge, got %.2f", result.FinalScore)
	}
}

func TestCalculateFormsResult_SingleJudgeWithDropping(t *testing.T) {
	// With only 1 judge and dropHighLow=true, should not crash
	// Dropping requires >= 3 judges, so should just average all
	scores := []float64{8.5}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinalScore != 8.5 {
		t.Errorf("expected 8.5 (no dropping with 1 judge), got %.2f", result.FinalScore)
	}
}

func TestCalculateFormsResult_TwoJudgesWithDropping(t *testing.T) {
	// With only 2 judges and dropHighLow=true, should not drop (needs >= 3)
	scores := []float64{7.0, 9.0}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinalScore != 8.0 {
		t.Errorf("expected 8.0 (no dropping with 2 judges), got %.2f", result.FinalScore)
	}
}

func TestCalculateFormsResult_AllSameScores(t *testing.T) {
	scores := []float64{8.0, 8.0, 8.0, 8.0, 8.0}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinalScore != 8.0 {
		t.Errorf("expected 8.0 for uniform scores, got %.2f", result.FinalScore)
	}
	if result.HighDropped != 8.0 || result.LowDropped != 8.0 {
		t.Errorf("expected dropped values to be 8.0, got high=%.2f low=%.2f",
			result.HighDropped, result.LowDropped)
	}
}

func TestCalculateFormsResult_ExtremeRange(t *testing.T) {
	// Wide range: 0.0, 5.0, 5.0, 5.0, 10.0
	// Drop 0.0 and 10.0, remaining: 5.0, 5.0, 5.0 → avg = 5.0
	scores := []float64{0.0, 5.0, 5.0, 5.0, 10.0}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinalScore != 5.0 {
		t.Errorf("expected 5.0, got %.2f", result.FinalScore)
	}
}

// ── Combat Edge Cases ────────────────────────────────────────

func TestCalculateCombatResult_EmptyRounds(t *testing.T) {
	result := CalculateCombatResult(nil)
	// With no rounds, no winner — but should not panic
	if result.RoundsWonRed != 0 || result.RoundsWonBlue != 0 {
		t.Error("expected 0 rounds won for empty input")
	}
}

func TestCalculateCombatResult_AllTiedRounds(t *testing.T) {
	rounds := []CombatRoundScore{
		{Round: 1, ScoreRed: 5, ScoreBlue: 5},
		{Round: 2, ScoreRed: 5, ScoreBlue: 5},
		{Round: 3, ScoreRed: 5, ScoreBlue: 5},
	}
	result := CalculateCombatResult(rounds)

	// All rounds tied, total tied → last round decides
	// Last round also tied → defaults to blue by the else branch
	if result.Method != "last_round" {
		t.Errorf("expected method 'last_round' for all tied, got '%s'", result.Method)
	}
}

func TestCalculateCombatResult_SingleRound(t *testing.T) {
	rounds := []CombatRoundScore{
		{Round: 1, ScoreRed: 7, ScoreBlue: 3},
	}
	result := CalculateCombatResult(rounds)

	if result.Winner != "red" {
		t.Errorf("expected red to win single round, got '%s'", result.Winner)
	}
	if result.RoundsWonRed != 1 {
		t.Errorf("expected 1 round won, got %d", result.RoundsWonRed)
	}
}
