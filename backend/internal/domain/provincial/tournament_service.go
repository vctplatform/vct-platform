package provincial

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL TOURNAMENT SERVICE
// Manages provincial-level tournaments, registrations, results.
// ═══════════════════════════════════════════════════════════════

// ── Tournament Models ────────────────────────────────────────

type TournamentStatus string

const (
	TournamentStatusDraft      TournamentStatus = "draft"
	TournamentStatusOpen       TournamentStatus = "open"
	TournamentStatusInProgress TournamentStatus = "in_progress"
	TournamentStatusCompleted  TournamentStatus = "completed"
	TournamentStatusCancelled  TournamentStatus = "cancelled"
)

type ProvincialTournament struct {
	ID              string           `json:"id"`
	ProvinceID      string           `json:"province_id"`
	Name            string           `json:"name"`
	Year            int              `json:"year"`
	Type            string           `json:"type"` // annual | friendly | championship
	StartDate       string           `json:"start_date"`
	EndDate         string           `json:"end_date"`
	Venue           string           `json:"venue"`
	Description     string           `json:"description,omitempty"`
	Status          TournamentStatus `json:"status"`
	MaxTeams        int              `json:"max_teams"`
	RegisteredTeams int              `json:"registered_teams"`
	TotalAthletes   int              `json:"total_athletes"`
	Categories      []string         `json:"categories,omitempty"` // Nội dung thi đấu
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

type TournamentRegistration struct {
	ID           string    `json:"id"`
	TournamentID string    `json:"tournament_id"`
	ClubID       string    `json:"club_id"`
	ClubName     string    `json:"club_name"`
	AthleteCount int       `json:"athlete_count"`
	CoachName    string    `json:"coach_name"`
	Status       string    `json:"status"` // pending | approved | rejected
	SubmittedAt  time.Time `json:"submitted_at"`
}

type TournamentResult struct {
	ID           string  `json:"id"`
	TournamentID string  `json:"tournament_id"`
	Category     string  `json:"category"`
	AthleteID    string  `json:"athlete_id"`
	AthleteName  string  `json:"athlete_name"`
	ClubName     string  `json:"club_name"`
	Medal        string  `json:"medal"` // gold | silver | bronze
	Score        float64 `json:"score,omitempty"`
}

// ── In-Memory Stores ─────────────────────────────────────────

type InMemTournamentStore struct {
	mu          sync.RWMutex
	tournaments map[string]ProvincialTournament
	regs        map[string]TournamentRegistration
	results     map[string]TournamentResult
}

func NewInMemTournamentStore() *InMemTournamentStore {
	s := &InMemTournamentStore{
		tournaments: make(map[string]ProvincialTournament),
		regs:        make(map[string]TournamentRegistration),
		results:     make(map[string]TournamentResult),
	}
	s.seed()
	return s
}

func (s *InMemTournamentStore) seed() {
	now := time.Now().UTC()
	for _, t := range []ProvincialTournament{
		{ID: "TOURN-HCM-2026", ProvinceID: "PROV-HCM", Name: "Giải Võ cổ truyền TP.HCM mở rộng 2026", Year: 2026, Type: "annual", StartDate: "2026-06-15", EndDate: "2026-06-18", Venue: "Nhà thi đấu Phú Thọ", Status: TournamentStatusOpen, MaxTeams: 20, RegisteredTeams: 4, TotalAthletes: 45, Categories: []string{"Đối kháng nam", "Đối kháng nữ", "Quyền nam", "Quyền nữ", "Biểu diễn đồng đội"}, CreatedAt: now, UpdatedAt: now},
		{ID: "TOURN-HCM-2025", ProvinceID: "PROV-HCM", Name: "Giải VCT TP.HCM 2025", Year: 2025, Type: "annual", StartDate: "2025-07-20", EndDate: "2025-07-23", Venue: "Nhà thi đấu Phú Thọ", Status: TournamentStatusCompleted, MaxTeams: 18, RegisteredTeams: 15, TotalAthletes: 180, Categories: []string{"Đối kháng nam", "Đối kháng nữ", "Quyền"}, CreatedAt: now, UpdatedAt: now},
		{ID: "TOURN-HN-2026", ProvinceID: "PROV-HN", Name: "Giải Võ cổ truyền Hà Nội 2026", Year: 2026, Type: "annual", StartDate: "2026-08-10", EndDate: "2026-08-13", Venue: "Nhà thi đấu Trịnh Hoài Đức", Status: TournamentStatusDraft, MaxTeams: 24, RegisteredTeams: 0, TotalAthletes: 0, Categories: []string{"Đối kháng", "Quyền", "Binh khí"}, CreatedAt: now, UpdatedAt: now},
	} {
		s.tournaments[t.ID] = t
	}
	for _, r := range []TournamentResult{
		{ID: "RES-001", TournamentID: "TOURN-HCM-2025", Category: "Đối kháng nam 60kg", AthleteID: "VDV-HCM-001", AthleteName: "Nguyễn Hoàng Anh", ClubName: "VCT Q1", Medal: "gold", Score: 9.5},
		{ID: "RES-002", TournamentID: "TOURN-HCM-2025", Category: "Đối kháng nữ 52kg", AthleteID: "VDV-HCM-002", AthleteName: "Trần Minh Tú", ClubName: "VCT Q1", Medal: "silver", Score: 8.8},
		{ID: "RES-003", TournamentID: "TOURN-HCM-2025", Category: "Đối kháng nam 68kg", AthleteID: "VDV-HCM-003", AthleteName: "Lê Văn Hùng", ClubName: "VCT TĐ", Medal: "gold", Score: 9.2},
	} {
		s.results[r.ID] = r
	}
}

func (s *InMemTournamentStore) ListTournaments(_ context.Context, provinceID string) ([]ProvincialTournament, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []ProvincialTournament
	for _, t := range s.tournaments {
		if provinceID == "" || t.ProvinceID == provinceID {
			result = append(result, t)
		}
	}
	return result, nil
}

func (s *InMemTournamentStore) GetTournament(_ context.Context, id string) (*ProvincialTournament, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.tournaments[id]
	if !ok {
		return nil, fmt.Errorf("tournament not found: %s", id)
	}
	return &t, nil
}

func (s *InMemTournamentStore) CreateTournament(_ context.Context, t ProvincialTournament) (*ProvincialTournament, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tournaments[t.ID] = t
	return &t, nil
}

func (s *InMemTournamentStore) UpdateTournament(_ context.Context, id string, patch map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.tournaments[id]
	if !ok {
		return fmt.Errorf("tournament not found: %s", id)
	}
	if v, ok := patch["status"].(string); ok {
		t.Status = TournamentStatus(v)
	}
	t.UpdatedAt = time.Now().UTC()
	s.tournaments[id] = t
	return nil
}

func (s *InMemTournamentStore) ListRegistrations(_ context.Context, tournamentID string) ([]TournamentRegistration, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []TournamentRegistration
	for _, r := range s.regs {
		if r.TournamentID == tournamentID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemTournamentStore) CreateRegistration(_ context.Context, r TournamentRegistration) (*TournamentRegistration, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.regs[r.ID] = r
	return &r, nil
}

func (s *InMemTournamentStore) ListResults(_ context.Context, tournamentID string) ([]TournamentResult, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []TournamentResult
	for _, r := range s.results {
		if r.TournamentID == tournamentID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (s *InMemTournamentStore) CreateResult(_ context.Context, r TournamentResult) (*TournamentResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.results[r.ID] = r
	return &r, nil
}
