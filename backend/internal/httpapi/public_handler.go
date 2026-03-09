package httpapi

import (
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
	default:
		notFound(w)
	}
}

func (s *Server) handlePublicScoreboard(w http.ResponseWriter, _ *http.Request) {
	// Aggregate live matches from store
	liveMatches := s.store.List("combat_matches")
	livePerformances := s.store.List("form_performances")

	var activeMatches []map[string]any
	for _, m := range liveMatches {
		if status, ok := m["trang_thai"].(string); ok && status == "dang_dau" {
			activeMatches = append(activeMatches, m)
		}
	}

	var activePerformances []map[string]any
	for _, p := range livePerformances {
		if status, ok := p["trang_thai"].(string); ok && status == "dang_thi" {
			activePerformances = append(activePerformances, p)
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
		success(w, http.StatusOK, brackets)
		return
	}

	bracket, ok := s.store.GetByID("brackets", id)
	if !ok {
		notFound(w)
		return
	}
	success(w, http.StatusOK, bracket)
}

func (s *Server) handlePublicSchedule(w http.ResponseWriter, r *http.Request) {
	// Optional filter by date
	dateFilter := r.URL.Query().Get("date")
	arenaFilter := r.URL.Query().Get("arena")

	entries := s.store.List("schedule_entries")
	var filtered []map[string]any

	for _, entry := range entries {
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
	success(w, http.StatusOK, map[string]any{
		"medals": medals,
		"total":  len(medals),
	})
}

func (s *Server) handlePublicResults(w http.ResponseWriter, r *http.Request) {
	categoryFilter := r.URL.Query().Get("category")

	results := s.store.List("results")
	var filtered []map[string]any

	for _, result := range results {
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
