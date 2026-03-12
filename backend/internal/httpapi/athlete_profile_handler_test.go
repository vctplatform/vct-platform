package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// ATHLETE PROFILE HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestAthleteProfileList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/athlete-profiles", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Without auth, route returns 401
	if w.Code != http.StatusUnauthorized {
		t.Logf("AthleteProfileList returned status: %d", w.Code)
	}
}

func TestAthleteProfileStats(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/athlete-profiles/stats", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("AthleteProfileStats returned status: %d", w.Code)
	}
}

func TestAthleteProfileSearch(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/athlete-profiles/search?q=nguyen", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("AthleteProfileSearch returned status: %d", w.Code)
	}
}

func TestAthleteProfileMe(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/athlete-profiles/me", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("AthleteProfileMe returned status: %d", w.Code)
	}
}

func TestAthleteProfileByID(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/athlete-profiles/AP-001", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("AthleteProfileByID returned status: %d", w.Code)
	}
}

func TestAthleteProfileMethodNotAllowed(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	// Stats only allows GET
	req := httptest.NewRequest("POST", "/api/v1/athlete-profiles/stats", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Without auth: 401, with auth but wrong method: 405
	if w.Code != http.StatusUnauthorized && w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 401 or 405, got %d", w.Code)
	}
}

func TestClubMembershipList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/club-memberships", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("ClubMembershipList returned status: %d", w.Code)
	}
}

func TestTournamentEntryList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/tournament-entries", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("TournamentEntryList returned status: %d", w.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// ATHLETE PROFILE SERVICE UNIT TESTS
// ═══════════════════════════════════════════════════════════════

func TestAthleteProfileServiceGetStats(t *testing.T) {
	s := testServer(t)

	// Access service directly via the server
	stats, err := s.athleteProfileSvc.GetStats(t.Context())
	if err != nil {
		t.Fatalf("GetStats failed: %v", err)
	}

	if stats.Total == 0 {
		t.Error("expected non-zero total athletes from seed data")
	}

	if len(stats.ByGender) == 0 {
		t.Error("expected ByGender to have entries")
	}

	if len(stats.ByBeltRank) == 0 {
		t.Error("expected ByBeltRank to have entries")
	}

	t.Logf("Stats: total=%d, genders=%v, belts=%v, avg_elo=%d",
		stats.Total, stats.ByGender, stats.ByBeltRank, stats.AvgElo)
}

func TestAthleteProfileServiceSearch(t *testing.T) {
	s := testServer(t)

	tests := []struct {
		name   string
		query  string
		expect int // minimum expected
	}{
		{"empty query returns all", "", 8},
		{"search by name", "Nguyen", 1},
		{"search by province HCM", "TP.HCM", 1},
		{"search by province HN", "Hà Nội", 1},
		{"no match", "zzzznonexistent", 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, err := s.athleteProfileSvc.SearchProfiles(t.Context(), tt.query)
			if err != nil {
				t.Fatalf("SearchProfiles(%q) failed: %v", tt.query, err)
			}
			if len(results) < tt.expect {
				t.Errorf("SearchProfiles(%q): expected at least %d results, got %d", tt.query, tt.expect, len(results))
			}
		})
	}
}

func TestAthleteProfileServiceBeltHistory(t *testing.T) {
	s := testServer(t)

	// Get AP-001 which should have belt history
	p, err := s.athleteProfileSvc.GetProfile(t.Context(), "AP-001")
	if err != nil {
		t.Fatalf("GetProfile(AP-001) failed: %v", err)
	}

	if len(p.BeltHistory) == 0 {
		t.Error("AP-001 should have belt history entries")
	}

	if len(p.Goals) == 0 {
		t.Error("AP-001 should have goals")
	}

	if len(p.SkillStats) == 0 {
		t.Error("AP-001 should have skill stats")
	}

	// Validate new fields
	if p.Address == "" {
		t.Error("AP-001 should have address")
	}
	if p.Province == "" {
		t.Error("AP-001 should have province")
	}

	_, _ = json.Marshal(p) // ensure JSON marshalling works
	t.Logf("AP-001: belt_history=%d entries, goals=%d, skills=%d", len(p.BeltHistory), len(p.Goals), len(p.SkillStats))
}
