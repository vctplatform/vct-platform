package scoring

import (
	"fmt"
	"math"
	"sort"
)

// ── Combat Score Calculator ──────────────────────────────────

// CalculateCombatResult computes the final combat match result
// from the collected round scores.
//
// Rules:
//   - Each round: scoreRed - penaltiesRed vs scoreBlue - penaltiesBlue
//   - The athlete who wins more rounds wins the match
//   - If tied on rounds, total score difference decides
//   - If still tied, last round winner wins
func CalculateCombatResult(rounds []CombatRoundScore) CombatResult {
	var result CombatResult
	result.Rounds = rounds

	var roundsWonRed, roundsWonBlue int
	var totalRed, totalBlue float64

	for _, r := range rounds {
		netRed := r.ScoreRed - r.PenaltiesRed
		netBlue := r.ScoreBlue - r.PenaltiesBlue
		totalRed += netRed
		totalBlue += netBlue

		if netRed > netBlue {
			roundsWonRed++
		} else if netBlue > netRed {
			roundsWonBlue++
		}
	}

	result.TotalScoreRed = totalRed
	result.TotalScoreBlue = totalBlue
	result.RoundsWonRed = roundsWonRed
	result.RoundsWonBlue = roundsWonBlue

	switch {
	case roundsWonRed > roundsWonBlue:
		result.Winner = "red"
		result.Method = "points"
	case roundsWonBlue > roundsWonRed:
		result.Winner = "blue"
		result.Method = "points"
	default:
		// Tie on rounds → check total score
		if totalRed > totalBlue {
			result.Winner = "red"
			result.Method = "total_score"
		} else if totalBlue > totalRed {
			result.Winner = "blue"
			result.Method = "total_score"
		} else if len(rounds) > 0 {
			// Still tied → last round decides
			last := rounds[len(rounds)-1]
			if last.ScoreRed > last.ScoreBlue {
				result.Winner = "red"
			} else {
				result.Winner = "blue"
			}
			result.Method = "last_round"
		}
	}

	return result
}

// CombatResult holds the computed outcome of a combat match.
type CombatResult struct {
	Rounds         []CombatRoundScore `json:"rounds"`
	TotalScoreRed  float64            `json:"total_score_red"`
	TotalScoreBlue float64            `json:"total_score_blue"`
	RoundsWonRed   int                `json:"rounds_won_red"`
	RoundsWonBlue  int                `json:"rounds_won_blue"`
	Winner         string             `json:"winner"` // "red" or "blue"
	Method         string             `json:"method"` // "points", "total_score", "last_round", "ko", "disqualify"
}

// ── Forms Score Calculator ───────────────────────────────────

// CalculateFormsResult computes the final forms performance score.
//
// Rules:
//   - N judges (typically 5 or 7) each give a score 0.0 – 10.0
//   - If dropHighLow is true: remove highest and lowest score
//   - Final score = average of remaining scores
func CalculateFormsResult(scores []float64, dropHighLow bool) (FormsResult, error) {
	n := len(scores)
	if n == 0 {
		return FormsResult{}, fmt.Errorf("no scores provided")
	}

	sorted := make([]float64, n)
	copy(sorted, scores)
	sort.Float64s(sorted)

	result := FormsResult{
		RawScores:   scores,
		JudgeCount:  n,
		DropHighLow: dropHighLow,
	}

	if dropHighLow && n >= 3 {
		result.HighDropped = sorted[n-1]
		result.LowDropped = sorted[0]

		// Use middle scores (exclude first and last)
		middle := sorted[1 : n-1]
		var sum float64
		for _, s := range middle {
			sum += s
		}
		result.FinalScore = roundTo2(sum / float64(len(middle)))
	} else {
		// No drop: average all scores
		var sum float64
		for _, s := range scores {
			sum += s
		}
		result.FinalScore = roundTo2(sum / float64(n))
	}

	return result, nil
}

// FormsResult holds the computed outcome of a forms performance.
type FormsResult struct {
	RawScores   []float64 `json:"raw_scores"`
	JudgeCount  int       `json:"judge_count"`
	DropHighLow bool      `json:"drop_high_low"`
	HighDropped float64   `json:"high_dropped,omitempty"`
	LowDropped  float64   `json:"low_dropped,omitempty"`
	FinalScore  float64   `json:"final_score"`
}

// ── ELO Rating Calculator ────────────────────────────────────

const (
	eloBaseK   = 32.0
	eloDefault = 1500.0
)

// CalculateEloChange computes new ELO ratings after a match.
//
//   - ratingA, ratingB: current ratings
//   - scoreA: 1.0 = win, 0.5 = draw, 0.0 = loss
//   - Returns: (newRatingA, newRatingB)
func CalculateEloChange(ratingA, ratingB, scoreA float64) (float64, float64) {
	expectedA := 1.0 / (1.0 + math.Pow(10, (ratingB-ratingA)/400.0))
	expectedB := 1.0 - expectedA

	scoreB := 1.0 - scoreA

	newA := ratingA + eloBaseK*(scoreA-expectedA)
	newB := ratingB + eloBaseK*(scoreB-expectedB)

	return roundTo2(newA), roundTo2(newB)
}

// ── Helpers ──────────────────────────────────────────────────

func roundTo2(v float64) float64 {
	return math.Round(v*100) / 100
}
