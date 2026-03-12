package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT MANAGEMENT DOMAIN ENTITIES
// Categories, Registrations, Schedule, Arena, Results, Standings
// ═══════════════════════════════════════════════════════════════

import "time"

// ── Category (Nội dung thi đấu trong giải) ───────────────────

// Category represents a competition content category within a tournament.
// Links a tournament to a specific competition content type + age group + weight class.
type Category struct {
	ID           string `json:"id"`
	TournamentID string `json:"tournament_id"`
	ContentType  string `json:"content_type"` // doi_khang, quyen, song_luyen, etc.
	AgeGroup     string `json:"age_group"`    // thieu_nien_1, thieu_nien_2, thanh_nien, etc.
	WeightClass  string `json:"weight_class"` // only for doi_khang
	Gender       string `json:"gender"`       // nam, nu
	Name         string `json:"name"`         // auto-generated display name
	MaxAthletes  int    `json:"max_athletes"`
	MinAthletes  int    `json:"min_athletes"`
	IsTeamEvent  bool   `json:"is_team_event"`
	Status       string `json:"status"` // active, closed, cancelled
	SortOrder    int    `json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ── Registration (Đăng ký tham gia giải) ─────────────────────

// Registration represents a team/delegation registration for a tournament.
type Registration struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	TeamID       string    `json:"team_id"`
	TeamName     string    `json:"team_name"`
	Province     string    `json:"province"`
	TeamType     string    `json:"team_type"`   // doan_tinh, clb, ca_nhan
	Status       string    `json:"status"`      // nhap, cho_duyet, da_duyet, tu_choi, yeu_cau_bo_sung
	HeadCoach    string    `json:"head_coach"`
	HeadCoachID  string    `json:"head_coach_id"`
	TotalAthletes int     `json:"total_athletes"`
	TotalContents int     `json:"total_contents"`
	SubmittedAt  *time.Time `json:"submitted_at,omitempty"`
	ApprovedBy   string    `json:"approved_by,omitempty"`
	ApprovedAt   *time.Time `json:"approved_at,omitempty"`
	RejectedBy   string    `json:"rejected_by,omitempty"`
	RejectReason string    `json:"reject_reason,omitempty"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// RegistrationAthlete links an athlete to a registration with specific content entries.
type RegistrationAthlete struct {
	ID             string   `json:"id"`
	RegistrationID string   `json:"registration_id"`
	AthleteID      string   `json:"athlete_id"`
	AthleteName    string   `json:"athlete_name"`
	DateOfBirth    string   `json:"date_of_birth"`
	Gender         string   `json:"gender"`
	Weight         float64  `json:"weight"`
	BeltRank       string   `json:"belt_rank"`
	CategoryIDs    []string `json:"category_ids"` // which categories this athlete competes in
	Status         string   `json:"status"`       // du_dieu_kien, thieu_ho_so, cho_xac_nhan
	Notes          string   `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
}

// ── Schedule (Lịch thi đấu) ─────────────────────────────────

// ScheduleSlot represents a time slot for competition on a specific arena.
type ScheduleSlot struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	ArenaID      string    `json:"arena_id"`
	ArenaName    string    `json:"arena_name"`
	Date         string    `json:"date"`
	Session      string    `json:"session"`    // sang, chieu, toi
	StartTime    string    `json:"start_time"` // HH:MM
	EndTime      string    `json:"end_time"`   // HH:MM
	CategoryID   string    `json:"category_id"`
	CategoryName string    `json:"category_name"`
	ContentType  string    `json:"content_type"`
	MatchCount   int       `json:"match_count"`
	Status       string    `json:"status"` // du_kien, xac_nhan, dang_dien_ra, hoan_thanh, hoan
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ArenaAssignment assigns an arena to handle specific content types on a given day.
type ArenaAssignment struct {
	ID           string   `json:"id"`
	TournamentID string   `json:"tournament_id"`
	ArenaID      string   `json:"arena_id"`
	ArenaName    string   `json:"arena_name"`
	Date         string   `json:"date"`
	ContentTypes []string `json:"content_types"` // which content types this arena handles
	Session      string   `json:"session"`       // sang, chieu, toi, ca_ngay
	IsActive     bool     `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

// ── Results (Kết quả thi đấu) ───────────────────────────────

// TournamentResult stores the final result for a specific content category.
type TournamentResult struct {
	ID           string `json:"id"`
	TournamentID string `json:"tournament_id"`
	CategoryID   string `json:"category_id"`
	CategoryName string `json:"category_name"`
	ContentType  string `json:"content_type"`
	GoldID       string `json:"gold_id"`
	GoldName     string `json:"gold_name"`
	GoldTeam     string `json:"gold_team"`
	SilverID     string `json:"silver_id"`
	SilverName   string `json:"silver_name"`
	SilverTeam   string `json:"silver_team"`
	Bronze1ID    string `json:"bronze1_id"`
	Bronze1Name  string `json:"bronze1_name"`
	Bronze1Team  string `json:"bronze1_team"`
	Bronze2ID    string `json:"bronze2_id"`
	Bronze2Name  string `json:"bronze2_name"`
	Bronze2Team  string `json:"bronze2_team"`
	IsFinalized  bool   `json:"is_finalized"`
	FinalizedBy  string `json:"finalized_by,omitempty"`
	FinalizedAt  *time.Time `json:"finalized_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// TeamStanding represents the overall team ranking (toàn đoàn).
type TeamStanding struct {
	ID           string `json:"id"`
	TournamentID string `json:"tournament_id"`
	TeamID       string `json:"team_id"`
	TeamName     string `json:"team_name"`
	Province     string `json:"province"`
	Gold         int    `json:"gold"`
	Silver       int    `json:"silver"`
	Bronze       int    `json:"bronze"`
	TotalMedals  int    `json:"total_medals"`
	Points       int    `json:"points"`
	Rank         int    `json:"rank"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ── Dashboard Stats ─────────────────────────────────────────

// MgmtStats holds aggregated statistics for the tournament management dashboard.
type MgmtStats struct {
	TotalCategories      int     `json:"total_categories"`
	TotalRegistrations   int     `json:"total_registrations"`
	PendingRegistrations int     `json:"pending_registrations"`
	ApprovedRegistrations int    `json:"approved_registrations"`
	TotalAthletes        int     `json:"total_athletes"`
	TotalTeams           int     `json:"total_teams"`
	TotalScheduleSlots   int     `json:"total_schedule_slots"`
	CompletedSlots       int     `json:"completed_slots"`
	TotalResults         int     `json:"total_results"`
	FinalizedResults     int     `json:"finalized_results"`
	TotalGold            int     `json:"total_gold"`
	TotalSilver          int     `json:"total_silver"`
	TotalBronze          int     `json:"total_bronze"`
	RegistrationRate     float64 `json:"registration_rate"`
	CompletionRate       float64 `json:"completion_rate"`
}
