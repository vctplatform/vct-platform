package scoring

import (
	"math"
	"testing"
)

func TestCalculateCombatResult_RedWins2to1(t *testing.T) {
	rounds := []CombatRoundScore{
		{Round: 1, ScoreRed: 5, ScoreBlue: 3, PenaltiesRed: 0, PenaltiesBlue: 0},
		{Round: 2, ScoreRed: 2, ScoreBlue: 4, PenaltiesRed: 0, PenaltiesBlue: 0},
		{Round: 3, ScoreRed: 6, ScoreBlue: 4, PenaltiesRed: 0, PenaltiesBlue: 0},
	}

	result := CalculateCombatResult(rounds)

	if result.Winner != "red" {
		t.Errorf("expected winner 'red', got '%s'", result.Winner)
	}
	if result.RoundsWonRed != 2 {
		t.Errorf("expected red won 2 rounds, got %d", result.RoundsWonRed)
	}
	if result.RoundsWonBlue != 1 {
		t.Errorf("expected blue won 1 round, got %d", result.RoundsWonBlue)
	}
	if result.Method != "points" {
		t.Errorf("expected method 'points', got '%s'", result.Method)
	}
}

func TestCalculateCombatResult_TieBreaker_TotalScore(t *testing.T) {
	// Each wins 1 round, but red has more total points
	rounds := []CombatRoundScore{
		{Round: 1, ScoreRed: 5, ScoreBlue: 3},
		{Round: 2, ScoreRed: 3, ScoreBlue: 4},
	}

	result := CalculateCombatResult(rounds)

	if result.Winner != "red" {
		t.Errorf("expected winner 'red' by total score, got '%s'", result.Winner)
	}
	if result.Method != "total_score" {
		t.Errorf("expected method 'total_score', got '%s'", result.Method)
	}
}

func TestCalculateCombatResult_Penalties(t *testing.T) {
	rounds := []CombatRoundScore{
		{Round: 1, ScoreRed: 5, ScoreBlue: 5, PenaltiesRed: 2, PenaltiesBlue: 0},
		{Round: 2, ScoreRed: 5, ScoreBlue: 5, PenaltiesRed: 0, PenaltiesBlue: 0},
		{Round: 3, ScoreRed: 5, ScoreBlue: 5, PenaltiesRed: 0, PenaltiesBlue: 0},
	}

	result := CalculateCombatResult(rounds)

	// Round 1: red net = 3, blue net = 5 → blue wins R1
	// Round 2,3: tied → neither wins
	if result.Winner != "blue" {
		t.Errorf("expected winner 'blue' due to penalties, got '%s'", result.Winner)
	}
}

func TestCalculateFormsResult_DropHighLow(t *testing.T) {
	// 5 judges: 7.5, 8.0, 8.5, 9.0, 6.0
	// Sorted: 6.0, 7.5, 8.0, 8.5, 9.0
	// Drop 6.0 (low) and 9.0 (high)
	// Remaining: 7.5, 8.0, 8.5 → avg = 8.0
	scores := []float64{7.5, 8.0, 8.5, 9.0, 6.0}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.FinalScore != 8.0 {
		t.Errorf("expected final score 8.0, got %.2f", result.FinalScore)
	}
	if result.HighDropped != 9.0 {
		t.Errorf("expected high dropped 9.0, got %.2f", result.HighDropped)
	}
	if result.LowDropped != 6.0 {
		t.Errorf("expected low dropped 6.0, got %.2f", result.LowDropped)
	}
	if result.JudgeCount != 5 {
		t.Errorf("expected judge count 5, got %d", result.JudgeCount)
	}
}

func TestCalculateFormsResult_NoDropping(t *testing.T) {
	scores := []float64{7.0, 8.0, 9.0}
	result, err := CalculateFormsResult(scores, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.FinalScore != 8.0 {
		t.Errorf("expected final score 8.0, got %.2f", result.FinalScore)
	}
}

func TestCalculateFormsResult_SevenJudges(t *testing.T) {
	// 7 judges: 7.0, 7.5, 8.0, 8.0, 8.5, 9.0, 6.5
	// Sorted: 6.5, 7.0, 7.5, 8.0, 8.0, 8.5, 9.0
	// Drop 6.5 and 9.0
	// Remaining: 7.0, 7.5, 8.0, 8.0, 8.5 → avg = 7.8
	scores := []float64{7.0, 7.5, 8.0, 8.0, 8.5, 9.0, 6.5}
	result, err := CalculateFormsResult(scores, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.FinalScore != 7.8 {
		t.Errorf("expected final score 7.8, got %.2f", result.FinalScore)
	}
}

func TestCalculateFormsResult_EmptyScores(t *testing.T) {
	_, err := CalculateFormsResult(nil, true)
	if err == nil {
		t.Error("expected error for empty scores")
	}
}

func TestCalculateEloChange(t *testing.T) {
	// Two equally rated players, one wins
	newA, newB := CalculateEloChange(1500, 1500, 1.0)

	if newA <= 1500 {
		t.Errorf("expected winner rating > 1500, got %.2f", newA)
	}
	if newB >= 1500 {
		t.Errorf("expected loser rating < 1500, got %.2f", newB)
	}

	// Verify ratings are symmetric
	diff := math.Abs((newA - 1500) - (1500 - newB))
	if diff > 0.01 {
		t.Errorf("expected symmetric ELO change, difference: %.4f", diff)
	}
}

func TestCalculateEloChange_Upset(t *testing.T) {
	// Underdog (1200) beats favorite (1800)
	newA, newB := CalculateEloChange(1200, 1800, 1.0)

	// Underdog should gain more points for an upset
	gainA := newA - 1200
	lossB := 1800 - newB

	if gainA < 20 {
		t.Errorf("expected underdog to gain significant ELO, gained %.2f", gainA)
	}
	if math.Abs(gainA-lossB) > 0.01 {
		t.Errorf("expected symmetric change, gain=%.2f loss=%.2f", gainA, lossB)
	}
}
