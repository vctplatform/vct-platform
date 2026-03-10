package scoring

import (
	"context"
	"fmt"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SCORING PIPELINE
// Connects scoring output to downstream services:
//   Scoring → Bracket Advancement → Medal → Ranking → ELO
// ═══════════════════════════════════════════════════════════════

// ── Pipeline Dependencies ────────────────────────────────────

// BracketAdvancer advances winners in a bracket.
type BracketAdvancer interface {
	AdvanceWinner(ctx context.Context, matchID, winnerID, winnerSide string) error
}

// RankingUpdater updates ELO ratings after a match.
type RankingUpdater interface {
	UpdateElo(ctx context.Context, athleteAID string, ratingA float64,
		athleteBID string, ratingB float64,
		scoreA float64) error
	GetRating(ctx context.Context, athleteID string) (float64, error)
}

// MatchInfoProvider provides match metadata (athlete IDs, bracket info).
type MatchInfoProvider interface {
	// GetMatchAthletes returns the red and blue athlete IDs for a bracket match.
	GetMatchAthletes(ctx context.Context, matchID string) (redID, blueID string, err error)
}

// ── Pipeline Service ─────────────────────────────────────────

// Pipeline connects scoring results to downstream operations.
type Pipeline struct {
	scoringService *Service
	bracket        BracketAdvancer
	ranking        RankingUpdater
	matchInfo      MatchInfoProvider
}

// NewPipeline creates a scoring pipeline.
func NewPipeline(
	scoring *Service,
	bracket BracketAdvancer,
	ranking RankingUpdater,
	matchInfo MatchInfoProvider,
) *Pipeline {
	return &Pipeline{
		scoringService: scoring,
		bracket:        bracket,
		ranking:        ranking,
		matchInfo:      matchInfo,
	}
}

// ProcessCombatMatchEnd handles end-of-match: calculate result → advance bracket → update ELO.
//
// Flow:
//  1. EndCombatMatch() → CombatResult (already computed)
//  2. AdvanceWinner() → move winner to next bracket match
//  3. UpdateElo() → adjust ratings for both athletes
func (p *Pipeline) ProcessCombatMatchEnd(ctx context.Context, matchID, refereeID string) (*CombatResult, error) {
	// Step 1: Finalize the match and get result
	result, err := p.scoringService.EndCombatMatch(ctx, matchID, refereeID)
	if err != nil {
		return nil, fmt.Errorf("pipeline: kết thúc trận combat: %w", err)
	}

	// Step 2: Advance winner in bracket
	if p.bracket != nil {
		if err := p.bracket.AdvanceWinner(ctx, matchID, result.Winner, result.Winner); err != nil {
			// Log but don't fail — match result is already recorded
			fmt.Printf("⚠ pipeline: không thể advance bracket cho trận %s: %v\n", matchID, err)
		}
	}

	// Step 3: Update ELO ratings
	if p.ranking != nil && p.matchInfo != nil {
		p.updateEloAfterMatch(ctx, matchID, result.Winner)
	}

	return &result, nil
}

// ProcessFormsEnd handles end-of-forms-performance: finalize → advance bracket.
func (p *Pipeline) ProcessFormsEnd(ctx context.Context, performanceID string) (*FormsResult, error) {
	result, err := p.scoringService.FinalizeFormsPerformance(ctx, performanceID)
	if err != nil {
		return nil, fmt.Errorf("pipeline: kết thúc thi quyền: %w", err)
	}

	// Forms don't directly advance brackets in the same way
	// but the result should be recorded for ranking

	return &result, nil
}

// updateEloAfterMatch retrieves current ratings and applies ELO change.
func (p *Pipeline) updateEloAfterMatch(ctx context.Context, matchID, winnerSide string) {
	redID, blueID, err := p.matchInfo.GetMatchAthletes(ctx, matchID)
	if err != nil || redID == "" || blueID == "" {
		return
	}

	ratingA, _ := p.ranking.GetRating(ctx, redID)
	ratingB, _ := p.ranking.GetRating(ctx, blueID)

	// Default rating if not found
	if ratingA == 0 {
		ratingA = 1500
	}
	if ratingB == 0 {
		ratingB = 1500
	}

	var scoreA float64
	switch winnerSide {
	case "red":
		scoreA = 1.0
	case "blue":
		scoreA = 0.0
	default:
		scoreA = 0.5 // draw
	}

	newA, newB := CalculateEloChange(ratingA, ratingB, scoreA)

	_ = p.ranking.UpdateElo(ctx, redID, newA, blueID, newB, scoreA)
}
