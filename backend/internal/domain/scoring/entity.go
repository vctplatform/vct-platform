package scoring

import "time"

// ── Match Event Types ────────────────────────────────────────
// Event Sourcing: match state is computed from append-only events.

type MatchEventType string

const (
	EventMatchStart      MatchEventType = "MATCH_START"
	EventMatchEnd        MatchEventType = "MATCH_END"
	EventRoundStart      MatchEventType = "ROUND_START"
	EventRoundEnd        MatchEventType = "ROUND_END"
	EventScoreRed        MatchEventType = "SCORE_RED"
	EventScoreBlue       MatchEventType = "SCORE_BLUE"
	EventPenaltyRed      MatchEventType = "PENALTY_RED"
	EventPenaltyBlue     MatchEventType = "PENALTY_BLUE"
	EventTimeout         MatchEventType = "TIMEOUT"
	EventTimeoutEnd      MatchEventType = "TIMEOUT_END"
	EventMedicalStop     MatchEventType = "MEDICAL_STOP"
	EventDisqualify      MatchEventType = "DISQUALIFY"
	EventFormScoreSubmit MatchEventType = "FORM_SCORE_SUBMIT"
	EventFormFinalize    MatchEventType = "FORM_FINALIZE"
)

// MatchEvent represents a single immutable event in a match's lifecycle.
// All match state is derived by replaying these events in sequence order.
type MatchEvent struct {
	ID             string         `json:"id"`
	MatchID        string         `json:"match_id"`
	MatchType      string         `json:"match_type"` // "combat" or "forms"
	EventType      MatchEventType `json:"event_type"`
	EventData      map[string]any `json:"event_data"`
	SequenceNumber int64          `json:"sequence_number"`
	RoundNumber    int            `json:"round_number,omitempty"`
	RecordedAt     time.Time      `json:"recorded_at"`
	RecordedBy     string         `json:"recorded_by,omitempty"`
	DeviceID       string         `json:"device_id,omitempty"`
	SyncStatus     string         `json:"sync_status"`
}

// ── Combat Scoring ───────────────────────────────────────────

// CombatRoundScore holds per-round scoring data for a combat match.
type CombatRoundScore struct {
	Round         int     `json:"round"`
	ScoreRed      float64 `json:"score_red"`
	ScoreBlue     float64 `json:"score_blue"`
	PenaltiesRed  float64 `json:"penalties_red"`
	PenaltiesBlue float64 `json:"penalties_blue"`
}

// CombatMatchState is the materialized state of a combat match,
// computed from replaying match_events.
type CombatMatchState struct {
	MatchID        string             `json:"match_id"`
	Status         string             `json:"status"` // chua_dau, dang_dau, ket_thuc
	CurrentRound   int                `json:"current_round"`
	TotalRounds    int                `json:"total_rounds"`
	RoundScores    []CombatRoundScore `json:"round_scores"`
	TotalScoreRed  float64            `json:"total_score_red"`
	TotalScoreBlue float64            `json:"total_score_blue"`
	WinnerID       string             `json:"winner_id,omitempty"`
	WinMethod      string             `json:"win_method,omitempty"` // points, ko, disqualify, medical
	StartedAt      *time.Time         `json:"started_at,omitempty"`
	EndedAt        *time.Time         `json:"ended_at,omitempty"`
}

// ── Forms Scoring ────────────────────────────────────────────

// JudgeScore represents a single judge's score for a forms performance.
type JudgeScore struct {
	ID          string    `json:"id"`
	MatchID     string    `json:"match_id"`
	RefereeID   string    `json:"referee_id"`
	AthleteID   string    `json:"athlete_id"`
	Score       float64   `json:"score"`
	Penalties   float64   `json:"penalties"`
	IsFinal     bool      `json:"is_final"`
	SubmittedAt time.Time `json:"submitted_at"`
}

// FormsPerformanceState is the materialized state of a forms performance.
type FormsPerformanceState struct {
	PerformanceID string       `json:"performance_id"`
	AthleteID     string       `json:"athlete_id"`
	Status        string       `json:"status"` // cho_thi, dang_thi, da_cham, hoan
	JudgeScores   []JudgeScore `json:"judge_scores"`
	AvgScore      float64      `json:"avg_score"`
	HighDropped   float64      `json:"high_dropped"`
	LowDropped    float64      `json:"low_dropped"`
	FinalScore    float64      `json:"final_score"`
	Rank          int          `json:"rank,omitempty"`
}

// ── Scoring Rules ────────────────────────────────────────────

// ScoringConfig holds configurable scoring parameters for a tournament.
type ScoringConfig struct {
	// Combat
	CombatRounds     int  `json:"combat_rounds"`      // typically 3
	RoundDurationSec int  `json:"round_duration_sec"` // typically 120
	BreakDurationSec int  `json:"break_duration_sec"` // typically 60
	CombatJudgeCount int  `json:"combat_judge_count"` // 3 or 5
	KOWinsMatch      bool `json:"ko_wins_match"`

	// Forms
	FormsJudgeCount  int     `json:"forms_judge_count"`   // 5 or 7
	FormsDropHighLow bool    `json:"forms_drop_high_low"` // typically true
	FormsMaxScore    float64 `json:"forms_max_score"`     // typically 10.0

	// Medal system
	MedalSystem string `json:"medal_system"` // "mot_hcb" or "hai_hcd"
}

// DefaultScoringConfig returns standard scoring rules for VCT.
func DefaultScoringConfig() ScoringConfig {
	return ScoringConfig{
		CombatRounds:     3,
		RoundDurationSec: 120,
		BreakDurationSec: 60,
		CombatJudgeCount: 3,
		KOWinsMatch:      true,
		FormsJudgeCount:  5,
		FormsDropHighLow: true,
		FormsMaxScore:    10.0,
		MedalSystem:      "hai_hcd",
	}
}
