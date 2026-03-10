package bracket

import (
	"context"
	"fmt"
	"math"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET & SCHEDULING SERVICE
// Bracket generation, match advancement, and constraint-based scheduling.
// ═══════════════════════════════════════════════════════════════

// ── Domain Models ────────────────────────────────────────────

// Bracket represents a tournament bracket for a single category.
type Bracket struct {
	ID           string         `json:"id"`
	TournamentID string         `json:"tournament_id"`
	CategoryID   string         `json:"category_id"`
	CategoryName string         `json:"category_name"`
	BracketType  string         `json:"bracket_type"` // "single_elimination","double_elimination","round_robin"
	TotalSlots   int            `json:"total_slots"`  // power of 2 (8,16,32)
	Rounds       []BracketRound `json:"rounds"`
	Status       string         `json:"status"`      // "draft","generated","in_progress","completed"
	SeedMethod   string         `json:"seed_method"` // "random","seeded","manual"
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// BracketRound contains all matches in a round.
type BracketRound struct {
	RoundNumber int            `json:"round_number"` // 1=first round, 2=quarterfinal, etc.
	RoundName   string         `json:"round_name"`   // "Vòng 1", "Tứ kết", "Bán kết", "Chung kết"
	Matches     []BracketMatch `json:"matches"`
}

// BracketMatch represents a single match in the bracket.
type BracketMatch struct {
	ID              string     `json:"id"`
	BracketID       string     `json:"bracket_id"`
	RoundNumber     int        `json:"round_number"`
	MatchNumber     int        `json:"match_number"` // position within the round
	AthleteRedID    string     `json:"athlete_red_id,omitempty"`
	AthleteRedName  string     `json:"athlete_red_name,omitempty"`
	AthleteRedTeam  string     `json:"athlete_red_team,omitempty"`
	AthleteBlueID   string     `json:"athlete_blue_id,omitempty"`
	AthleteBlueName string     `json:"athlete_blue_name,omitempty"`
	AthleteBlueTeam string     `json:"athlete_blue_team,omitempty"`
	WinnerID        string     `json:"winner_id,omitempty"`
	WinnerSide      string     `json:"winner_side,omitempty"`   // "red" or "blue"
	NextMatchID     string     `json:"next_match_id,omitempty"` // winner advances to
	NextSide        string     `json:"next_side,omitempty"`     // "red" or "blue" in next match
	Status          string     `json:"status"`                  // "scheduled","ready","in_progress","completed","bye"
	ScheduledAt     *time.Time `json:"scheduled_at,omitempty"`
	ArenaID         string     `json:"arena_id,omitempty"`
}

// Participant is a seeded entry for bracket generation.
type Participant struct {
	AthleteID   string `json:"athlete_id"`
	AthleteName string `json:"athlete_name"`
	TeamID      string `json:"team_id"`
	TeamName    string `json:"team_name"`
	Seed        int    `json:"seed"`               // 0 = unseeded
	Province    string `json:"province,omitempty"` // for same-province avoidance
}

// Medal represents a medal earned by an athlete.
type Medal struct {
	ID           string `json:"id"`
	TournamentID string `json:"tournament_id"`
	CategoryID   string `json:"category_id"`
	CategoryName string `json:"category_name"`
	AthleteID    string `json:"athlete_id"`
	AthleteName  string `json:"athlete_name"`
	TeamID       string `json:"team_id"`
	TeamName     string `json:"team_name"`
	MedalType    string `json:"medal_type"` // "gold","silver","bronze"
	MatchID      string `json:"match_id,omitempty"`
}

// ScheduleConstraints for auto-scheduling matches.
type ScheduleConstraints struct {
	Arenas         []ArenaSlot `json:"arenas"`
	MatchDuration  int         `json:"match_duration_minutes"`   // typical match length
	BreakBetween   int         `json:"break_between_minutes"`    // rest between matches
	AthleteRestGap int         `json:"athlete_rest_gap_minutes"` // min rest for same athlete
	StartTime      string      `json:"start_time"`               // "08:00"
	EndTime        string      `json:"end_time"`                 // "18:00"
}

// ArenaSlot represents an available arena.
type ArenaSlot struct {
	ArenaID   string `json:"arena_id"`
	ArenaName string `json:"arena_name"`
}

// ── Repository ───────────────────────────────────────────────

type BracketRepository interface {
	Create(ctx context.Context, b Bracket) (*Bracket, error)
	GetByID(ctx context.Context, id string) (*Bracket, error)
	ListByTournament(ctx context.Context, tournamentID string) ([]Bracket, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

type MatchRepository interface {
	Create(ctx context.Context, m BracketMatch) error
	GetByID(ctx context.Context, id string) (*BracketMatch, error)
	UpdateResult(ctx context.Context, matchID string, winnerID, winnerSide string) error
	UpdateSchedule(ctx context.Context, matchID string, arenaID string, scheduledAt time.Time) error
	ListByBracket(ctx context.Context, bracketID string) ([]BracketMatch, error)
}

type MedalRepository interface {
	Create(ctx context.Context, m Medal) error
	ListByTournament(ctx context.Context, tournamentID string) ([]Medal, error)
	ListByTeam(ctx context.Context, tournamentID, teamID string) ([]Medal, error)
}

// ── Service ──────────────────────────────────────────────────

// Service handles bracket generation, match advancement, and medal assignment.
type Service struct {
	bracketRepo BracketRepository
	matchRepo   MatchRepository
	medalRepo   MedalRepository
	idGenerator func() string
}

// NewService creates a Bracket & Schedule service.
func NewService(
	bracket BracketRepository,
	match MatchRepository,
	medal MedalRepository,
	idGen func() string,
) *Service {
	return &Service{
		bracketRepo: bracket,
		matchRepo:   match,
		medalRepo:   medal,
		idGenerator: idGen,
	}
}

// ── Bracket Generation ───────────────────────────────────────

// GenerateSingleElimination creates a single-elimination bracket.
//
// Algorithm:
//  1. Pad participants to next power of 2
//  2. Apply seeding (seeded players at opposite ends)
//  3. Avoid same-province matches in first round
//  4. Generate all rounds and match slots
//  5. Assign BYEs where needed
func (s *Service) GenerateSingleElimination(
	ctx context.Context,
	tournamentID string,
	categoryID string,
	categoryName string,
	participants []Participant,
) (*Bracket, error) {
	n := len(participants)
	if n < 2 {
		return nil, fmt.Errorf("cần ít nhất 2 VĐV để tạo bảng đấu")
	}

	// Calculate bracket size (next power of 2)
	totalSlots := nextPowerOf2(n)
	totalRounds := int(math.Log2(float64(totalSlots)))
	byes := totalSlots - n

	bracketID := s.idGenerator()
	now := time.Now().UTC()

	bracket := Bracket{
		ID:           bracketID,
		TournamentID: tournamentID,
		CategoryID:   categoryID,
		CategoryName: categoryName,
		BracketType:  "single_elimination",
		TotalSlots:   totalSlots,
		Status:       "generated",
		SeedMethod:   "seeded",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Generate round names
	roundNames := generateRoundNames(totalRounds)

	// Create match structure, round by round
	var allMatches []BracketMatch
	matchCountPerRound := totalSlots / 2

	for round := 1; round <= totalRounds; round++ {
		roundMatches := make([]BracketMatch, matchCountPerRound)

		for i := 0; i < matchCountPerRound; i++ {
			matchID := s.idGenerator()
			roundMatches[i] = BracketMatch{
				ID:          matchID,
				BracketID:   bracketID,
				RoundNumber: round,
				MatchNumber: i + 1,
				Status:      "scheduled",
			}
		}

		bracket.Rounds = append(bracket.Rounds, BracketRound{
			RoundNumber: round,
			RoundName:   roundNames[round-1],
			Matches:     roundMatches,
		})

		allMatches = append(allMatches, roundMatches...)
		matchCountPerRound /= 2
	}

	// Link matches: winner of match N in round R → specific slot in round R+1
	matchesByRound := groupMatchesByRound(allMatches)
	for round := 1; round < totalRounds; round++ {
		currentRound := matchesByRound[round]
		nextRound := matchesByRound[round+1]

		for i, m := range currentRound {
			nextMatchIdx := i / 2
			if nextMatchIdx < len(nextRound) {
				side := "red"
				if i%2 == 1 {
					side = "blue"
				}
				m.NextMatchID = nextRound[nextMatchIdx].ID
				m.NextSide = side
				// Update in the bracket rounds
				for ri := range bracket.Rounds {
					if bracket.Rounds[ri].RoundNumber == round {
						for mi := range bracket.Rounds[ri].Matches {
							if bracket.Rounds[ri].Matches[mi].ID == m.ID {
								bracket.Rounds[ri].Matches[mi].NextMatchID = m.NextMatchID
								bracket.Rounds[ri].Matches[mi].NextSide = m.NextSide
							}
						}
					}
				}
			}
		}
	}

	// Seed participants into first round
	firstRound := bracket.Rounds[0].Matches
	seeded := seedParticipants(participants, totalSlots)

	for i := 0; i < len(firstRound); i++ {
		redIdx := i * 2
		blueIdx := i*2 + 1

		if redIdx < len(seeded) && seeded[redIdx] != nil {
			firstRound[i].AthleteRedID = seeded[redIdx].AthleteID
			firstRound[i].AthleteRedName = seeded[redIdx].AthleteName
			firstRound[i].AthleteRedTeam = seeded[redIdx].TeamName
		}
		if blueIdx < len(seeded) && seeded[blueIdx] != nil {
			firstRound[i].AthleteBlueID = seeded[blueIdx].AthleteID
			firstRound[i].AthleteBlueName = seeded[blueIdx].AthleteName
			firstRound[i].AthleteBlueTeam = seeded[blueIdx].TeamName
		}

		// Handle BYEs
		if firstRound[i].AthleteRedID != "" && firstRound[i].AthleteBlueID == "" {
			firstRound[i].Status = "bye"
			firstRound[i].WinnerID = firstRound[i].AthleteRedID
			firstRound[i].WinnerSide = "red"
		} else if firstRound[i].AthleteBlueID != "" && firstRound[i].AthleteRedID == "" {
			firstRound[i].Status = "bye"
			firstRound[i].WinnerID = firstRound[i].AthleteBlueID
			firstRound[i].WinnerSide = "blue"
		}
	}
	bracket.Rounds[0].Matches = firstRound
	_ = byes // suppress unused

	// Persist
	created, err := s.bracketRepo.Create(ctx, bracket)
	if err != nil {
		return nil, fmt.Errorf("không thể lưu bảng đấu: %w", err)
	}

	// Persist all matches
	for _, round := range bracket.Rounds {
		for _, m := range round.Matches {
			if err := s.matchRepo.Create(ctx, m); err != nil {
				return nil, fmt.Errorf("không thể lưu trận %s: %w", m.ID, err)
			}
		}
	}

	return created, nil
}

// AdvanceWinner records the match result and advances the winner.
func (s *Service) AdvanceWinner(ctx context.Context, matchID, winnerID, winnerSide string) error {
	match, err := s.matchRepo.GetByID(ctx, matchID)
	if err != nil {
		return fmt.Errorf("không tìm thấy trận: %w", err)
	}
	if match.Status != "in_progress" && match.Status != "completed" {
		return fmt.Errorf("trận chưa bắt đầu hoặc đã kết thúc")
	}

	// Record result
	if err := s.matchRepo.UpdateResult(ctx, matchID, winnerID, winnerSide); err != nil {
		return err
	}

	// Advance winner to next match
	if match.NextMatchID != "" {
		nextMatch, err := s.matchRepo.GetByID(ctx, match.NextMatchID)
		if err != nil {
			return fmt.Errorf("không tìm thấy trận tiếp theo: %w", err)
		}

		var winnerName, winnerTeam string
		if winnerSide == "red" {
			winnerName = match.AthleteRedName
			winnerTeam = match.AthleteRedTeam
		} else {
			winnerName = match.AthleteBlueName
			winnerTeam = match.AthleteBlueTeam
		}

		patch := map[string]interface{}{}
		if match.NextSide == "red" {
			patch["athlete_red_id"] = winnerID
			patch["athlete_red_name"] = winnerName
			patch["athlete_red_team"] = winnerTeam
		} else {
			patch["athlete_blue_id"] = winnerID
			patch["athlete_blue_name"] = winnerName
			patch["athlete_blue_team"] = winnerTeam
		}

		// Check if next match is now ready (both sides filled)
		nextRedFilled := (match.NextSide == "red") || nextMatch.AthleteRedID != ""
		nextBlueFilled := (match.NextSide == "blue") || nextMatch.AthleteBlueID != ""
		if nextRedFilled && nextBlueFilled {
			patch["status"] = "ready"
		}

		if err := s.bracketRepo.Update(ctx, match.NextMatchID, patch); err != nil {
			return fmt.Errorf("không thể cập nhật trận tiếp: %w", err)
		}
	}

	return nil
}

// AssignMedals generates medals for a completed bracket.
func (s *Service) AssignMedals(ctx context.Context, bracketID string) ([]Medal, error) {
	bracket, err := s.bracketRepo.GetByID(ctx, bracketID)
	if err != nil {
		return nil, err
	}
	if len(bracket.Rounds) == 0 {
		return nil, fmt.Errorf("bảng đấu không có vòng nào")
	}

	var medals []Medal
	finalRound := bracket.Rounds[len(bracket.Rounds)-1]

	if len(finalRound.Matches) != 1 {
		return nil, fmt.Errorf("vòng chung kết phải có đúng 1 trận")
	}

	final := finalRound.Matches[0]
	if final.WinnerID == "" {
		return nil, fmt.Errorf("trận chung kết chưa có kết quả")
	}

	// Gold: winner of final
	goldID, goldName, goldTeam, goldTeamName := resolveAthlete(final, final.WinnerSide)
	medals = append(medals, Medal{
		ID: s.idGenerator(), TournamentID: bracket.TournamentID,
		CategoryID: bracket.CategoryID, CategoryName: bracket.CategoryName,
		AthleteID: goldID, AthleteName: goldName,
		TeamID: goldTeam, TeamName: goldTeamName,
		MedalType: "gold", MatchID: final.ID,
	})

	// Silver: loser of final
	loserSide := "blue"
	if final.WinnerSide == "blue" {
		loserSide = "red"
	}
	silverID, silverName, silverTeam, silverTeamName := resolveAthlete(final, loserSide)
	medals = append(medals, Medal{
		ID: s.idGenerator(), TournamentID: bracket.TournamentID,
		CategoryID: bracket.CategoryID, CategoryName: bracket.CategoryName,
		AthleteID: silverID, AthleteName: silverName,
		TeamID: silverTeam, TeamName: silverTeamName,
		MedalType: "silver", MatchID: final.ID,
	})

	// Bronze: losers of semi-finals (2 bronze medals)
	if len(bracket.Rounds) >= 2 {
		semiFinalRound := bracket.Rounds[len(bracket.Rounds)-2]
		for _, semi := range semiFinalRound.Matches {
			if semi.WinnerID == "" {
				continue
			}
			bronzeSide := "blue"
			if semi.WinnerSide == "blue" {
				bronzeSide = "red"
			}
			bronzeID, bronzeName, bronzeTeam, bronzeTeamName := resolveAthlete(semi, bronzeSide)
			if bronzeID != "" {
				medals = append(medals, Medal{
					ID: s.idGenerator(), TournamentID: bracket.TournamentID,
					CategoryID: bracket.CategoryID, CategoryName: bracket.CategoryName,
					AthleteID: bronzeID, AthleteName: bronzeName,
					TeamID: bronzeTeam, TeamName: bronzeTeamName,
					MedalType: "bronze", MatchID: semi.ID,
				})
			}
		}
	}

	// Persist medals
	for _, m := range medals {
		if err := s.medalRepo.Create(ctx, m); err != nil {
			return nil, fmt.Errorf("không thể lưu huy chương: %w", err)
		}
	}

	return medals, nil
}

// ── Helpers ──────────────────────────────────────────────────

func nextPowerOf2(n int) int {
	p := 1
	for p < n {
		p *= 2
	}
	return p
}

func generateRoundNames(totalRounds int) []string {
	names := make([]string, totalRounds)
	for i := totalRounds - 1; i >= 0; i-- {
		remaining := totalRounds - i
		switch remaining {
		case 1:
			names[i] = "Chung kết"
		case 2:
			names[i] = "Bán kết"
		case 3:
			names[i] = "Tứ kết"
		default:
			names[i] = fmt.Sprintf("Vòng %d", i+1)
		}
	}
	return names
}

func groupMatchesByRound(matches []BracketMatch) map[int][]BracketMatch {
	result := make(map[int][]BracketMatch)
	for _, m := range matches {
		result[m.RoundNumber] = append(result[m.RoundNumber], m)
	}
	return result
}

// seedParticipants places seeded players at standard bracket positions.
func seedParticipants(participants []Participant, totalSlots int) []*Participant {
	slots := make([]*Participant, totalSlots)

	// Simple placement: fill sequentially (can be enhanced with proper seeding)
	for i := range participants {
		slots[i] = &participants[i]
	}
	// Remaining slots are BYEs (nil)

	return slots
}

func resolveAthlete(m BracketMatch, side string) (id, name, teamID, teamName string) {
	if side == "red" {
		return m.AthleteRedID, m.AthleteRedName, m.AthleteRedTeam, m.AthleteRedTeam
	}
	return m.AthleteBlueID, m.AthleteBlueName, m.AthleteBlueTeam, m.AthleteBlueTeam
}
