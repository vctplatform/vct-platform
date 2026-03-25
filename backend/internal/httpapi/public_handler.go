package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
)

// ── Public API Handlers ──────────────────────────────────────
// No auth required. Spectator-facing endpoints for live scoring,
// brackets, schedules, and medal tables.
//
// Routes:
//   GET /api/v1/public/scoreboard     — live scoreboard
//   GET /api/v1/public/bracket/{id}   — tournament bracket tree
//   GET /api/v1/public/schedule       — tournament schedule
//   GET /api/v1/public/medals         — medal table (aggregated)
//   GET /api/v1/public/results        — competition results

func (s *Server) handlePublicRoutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/public/")
	path = strings.Trim(path, "/")
	segments := strings.Split(path, "/")

	switch segments[0] {
	case "scoreboard":
		s.handlePublicScoreboard(w, r)
	case "bracket":
		id := ""
		if len(segments) > 1 {
			id = segments[1]
		}
		s.handlePublicBracket(w, r, id)
	case "schedule":
		s.handlePublicSchedule(w, r)
	case "medals":
		s.handlePublicMedals(w, r)
	case "results":
		s.handlePublicResults(w, r)
	case "athletes":
		if len(segments) > 1 && segments[1] == "search" {
			s.handlePublicAthleteSearch(w, r)
		} else {
			notFound(w)
		}
	case "stats":
		s.handlePublicStats(w, r)
	default:
		notFound(w)
	}
}

func (s *Server) handlePublicScoreboard(w http.ResponseWriter, _ *http.Request) {
	// Aggregate live matches from store
	liveMatches := s.store.List("combat_matches")
	livePerformances := s.store.List("form_performances")

	var activeMatches []map[string]any
	for _, raw := range liveMatches {
		var m map[string]any
		if err := json.Unmarshal(raw, &m); err == nil {
			if status, ok := m["trang_thai"].(string); ok && status == "dang_dau" {
				activeMatches = append(activeMatches, m)
			}
		}
	}

	var activePerformances []map[string]any
	for _, raw := range livePerformances {
		var p map[string]any
		if err := json.Unmarshal(raw, &p); err == nil {
			if status, ok := p["trang_thai"].(string); ok && status == "dang_thi" {
				activePerformances = append(activePerformances, p)
			}
		}
	}

	success(w, http.StatusOK, map[string]any{
		"combat_matches":    activeMatches,
		"form_performances": activePerformances,
		"total_active":      len(activeMatches) + len(activePerformances),
	})
}

func (s *Server) handlePublicBracket(w http.ResponseWriter, _ *http.Request, id string) {
	if id == "" {
		// List all brackets
		brackets := s.store.List("brackets")
		var bracketsMap []map[string]any
		for _, raw := range brackets {
			var m map[string]any
			if err := json.Unmarshal(raw, &m); err == nil {
				bracketsMap = append(bracketsMap, m)
			}
		}
		success(w, http.StatusOK, bracketsMap)
		return
	}

	bracket, ok := s.store.GetByID("brackets", id)
	if !ok {
		notFound(w)
		return
	}
	successJSONBytes(w, http.StatusOK, bracket)
}

func (s *Server) handlePublicSchedule(w http.ResponseWriter, r *http.Request) {
	// Optional filter by date
	dateFilter := r.URL.Query().Get("date")
	arenaFilter := r.URL.Query().Get("arena")

	entries := s.store.List("schedule_entries")
	var filtered []map[string]any

	for _, raw := range entries {
		var entry map[string]any
		if err := json.Unmarshal(raw, &entry); err != nil {
			continue
		}
		if dateFilter != "" {
			if ngay, ok := entry["ngay"].(string); ok && ngay != dateFilter {
				continue
			}
		}
		if arenaFilter != "" {
			if arenaID, ok := entry["arena_id"].(string); ok && arenaID != arenaFilter {
				continue
			}
		}
		filtered = append(filtered, entry)
	}

	success(w, http.StatusOK, map[string]any{
		"entries": filtered,
		"total":   len(filtered),
		"filters": map[string]any{
			"date":  dateFilter,
			"arena": arenaFilter,
		},
	})
}

func (s *Server) handlePublicMedals(w http.ResponseWriter, _ *http.Request) {
	medals := s.store.List("medals")
	var medalsMap []map[string]any
	for _, raw := range medals {
		var m map[string]any
		if err := json.Unmarshal(raw, &m); err == nil {
			medalsMap = append(medalsMap, m)
		}
	}
	success(w, http.StatusOK, map[string]any{
		"medals": medalsMap,
		"total":  len(medalsMap),
	})
}

func (s *Server) handlePublicResults(w http.ResponseWriter, r *http.Request) {
	categoryFilter := r.URL.Query().Get("category")

	results := s.store.List("results")
	var filtered []map[string]any

	for _, raw := range results {
		var result map[string]any
		if err := json.Unmarshal(raw, &result); err != nil {
			continue
		}
		if categoryFilter != "" {
			if cat, ok := result["loai"].(string); ok && cat != categoryFilter {
				continue
			}
		}
		filtered = append(filtered, result)
	}

	success(w, http.StatusOK, map[string]any{
		"results": filtered,
		"total":   len(filtered),
	})
}

// ── Spectator: Athlete Search ────────────────────────────────

func (s *Server) handlePublicAthleteSearch(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	if query == "" {
		success(w, http.StatusOK, map[string]any{"athletes": []any{}, "total": 0})
		return
	}

	athletes := s.store.List("athletes")
	var matched []map[string]any
	for _, raw := range athletes {
		var a map[string]any
		if err := json.Unmarshal(raw, &a); err != nil {
			continue
		}
		name, _ := a["ho_ten"].(string)
		if name == "" {
			name, _ = a["name"].(string)
		}
		if strings.Contains(strings.ToLower(name), query) {
			matched = append(matched, a)
		}
	}

	// Fallback demo data when store is empty
	if len(athletes) == 0 {
		demo := []map[string]any{
			{"id": "ATH-001", "ho_ten": "Nguyễn Văn An", "club": "CLB Thanh Long", "belt": "Hoàng đai", "province": "TP.HCM"},
			{"id": "ATH-002", "ho_ten": "Nguyễn Thị Bình", "club": "CLB Thanh Long", "belt": "Lam đai", "province": "TP.HCM"},
			{"id": "ATH-003", "ho_ten": "Trần Minh Đức", "club": "CLB Bạch Hổ", "belt": "Vàng đai 1", "province": "Hà Nội"},
			{"id": "ATH-004", "ho_ten": "Lê Thị Cẩm Tú", "club": "CLB Phượng Hoàng", "belt": "Hoàng đai", "province": "Đà Nẵng"},
			{"id": "ATH-005", "ho_ten": "Phạm Quốc Anh", "club": "CLB Rồng Vàng", "belt": "Lam đai 2", "province": "Bình Dương"},
		}
		matched = nil
		for _, d := range demo {
			name, _ := d["ho_ten"].(string)
			if strings.Contains(strings.ToLower(name), query) {
				matched = append(matched, d)
			}
		}
	}

	success(w, http.StatusOK, map[string]any{
		"athletes": matched,
		"total":    len(matched),
		"query":    query,
	})
}

// ── Spectator: Tournament Statistics ─────────────────────────

func (s *Server) handlePublicStats(w http.ResponseWriter, _ *http.Request) {
	athletes := s.store.List("athletes")
	matches := s.store.List("combat_matches")
	medals := s.store.List("medals")
	teams := s.store.List("teams")

	totalAthletes := len(athletes)
	totalMatches := len(matches)
	totalMedals := len(medals)
	totalTeams := len(teams)

	// Fallback demo stats
	if totalAthletes == 0 {
		totalAthletes = 324
	}
	if totalMatches == 0 {
		totalMatches = 186
	}
	if totalMedals == 0 {
		totalMedals = 96
	}
	if totalTeams == 0 {
		totalTeams = 42
	}

	success(w, http.StatusOK, map[string]any{
		"total_athletes":  totalAthletes,
		"total_matches":   totalMatches,
		"total_medals":    totalMedals,
		"total_teams":     totalTeams,
		"categories":      12,
		"arenas":          6,
		"tournament_name": "Giải Vovinam Toàn Quốc 2026",
		"tournament_date": "15-20/03/2026",
		"location":        "Nhà thi đấu Phú Thọ, TP.HCM",
	})
}
