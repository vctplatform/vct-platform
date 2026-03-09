package tournament

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT DOMAIN ENTITIES
// ════════════════════════════════════════════════════════════════

import (
	"time"
)

// Tournament represents a martial arts tournament/competition
type Tournament struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Code         string                 `json:"code"`
	Level        string                 `json:"level"` // quoc_gia, khu_vuc, tinh, clb
	Edition      int                    `json:"edition"`
	Year         int                    `json:"year"`
	StartDate    time.Time              `json:"start_date"`
	EndDate      time.Time              `json:"end_date"`
	RegDeadline  time.Time              `json:"reg_deadline"`
	Venue        string                 `json:"venue"`
	Address      string                 `json:"address"`
	Province     string                 `json:"province"`
	Status       string                 `json:"status"` // nhap, dang_ky, khoa_dk, thi_dau, ket_thuc
	FederationID string                 `json:"federation_id"`
	Metadata     map[string]interface{} `json:"metadata"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

// Match represents a single match/bout in a tournament
type Match struct {
	ID            string     `json:"id"`
	TournamentID  string     `json:"tournament_id"`
	CategoryID    string     `json:"category_id"`
	ArenaID       string     `json:"arena_id"`
	Round         string     `json:"round"`  // vong_loai, tu_ket, ban_ket, chung_ket
	Status        string     `json:"status"` // chua_dau, dang_dau, ket_thuc
	RedAthleteID  string     `json:"red_athlete_id"`
	BlueAthleteID string     `json:"blue_athlete_id"`
	RedScore      int        `json:"red_score"`
	BlueScore     int        `json:"blue_score"`
	WinnerID      string     `json:"winner_id"`
	ScheduledAt   time.Time  `json:"scheduled_at"`
	StartedAt     *time.Time `json:"started_at"`
	EndedAt       *time.Time `json:"ended_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// MatchEvent represents an event in the Event Sourcing log (append-only)
type MatchEvent struct {
	ID             string                 `json:"id"`
	MatchID        string                 `json:"match_id"`
	EventType      string                 `json:"event_type"` // SCORE_RED, PENALTY_BLUE, TIMEOUT, ROUND_START...
	EventData      map[string]interface{} `json:"event_data"`
	SequenceNumber int64                  `json:"sequence_number"`
	RecordedAt     time.Time              `json:"recorded_at"`
	RecordedBy     string                 `json:"recorded_by"`
	DeviceID       string                 `json:"device_id"`
	SyncStatus     string                 `json:"sync_status"` // pending, synced, conflict
}
