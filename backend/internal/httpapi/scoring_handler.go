package httpapi

import (
	"net/http"
	"strings"
)

// ── Scoring API Handlers ─────────────────────────────────────
// All scoring operations now go through scoring.Service which persists
// events via the ScoringRepository (event sourcing).
//
// Routes:
//   POST /api/v1/scoring/combat/{matchID}/start
//   POST /api/v1/scoring/combat/{matchID}/score
//   POST /api/v1/scoring/combat/{matchID}/penalty
//   POST /api/v1/scoring/combat/{matchID}/end
//   GET  /api/v1/scoring/combat/{matchID}/state
//   POST /api/v1/scoring/forms/{perfID}/score
//   POST /api/v1/scoring/forms/{perfID}/finalize

func (s *Server) handleScoringRoutes(w http.ResponseWriter, r *http.Request) {
	// Path: /api/v1/scoring/{type}/{id}/{action}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/scoring/")
	path = strings.Trim(path, "/")
	segments := strings.Split(path, "/")

	if len(segments) < 2 {
		badRequest(w, "invalid scoring path, expected /scoring/{type}/{id}/{action}")
		return
	}

	// Auth check
	principal, err := s.principalFromRequest(r)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	matchType := segments[0] // "combat" or "forms"
	matchID := segments[1]
	action := ""
	if len(segments) >= 3 {
		action = segments[2]
	}

	switch matchType {
	case "combat":
		s.handleCombatScoring(w, r, matchID, action, principal.User.ID)
	case "forms":
		s.handleFormsScoring(w, r, matchID, action, principal.User.ID)
	default:
		badRequest(w, "match type phải là 'combat' hoặc 'forms'")
	}
}

// ── Combat Scoring ───────────────────────────────────────────

func (s *Server) handleCombatScoring(w http.ResponseWriter, r *http.Request, matchID, action, userID string) {
	switch action {
	case "start":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleCombatStart(w, r, matchID, userID)

	case "score":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleCombatScore(w, r, matchID, userID)

	case "penalty":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleCombatPenalty(w, r, matchID, userID)

	case "end":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleCombatEnd(w, r, matchID, userID)

	case "state", "":
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		s.handleCombatState(w, r, matchID)

	default:
		notFound(w)
	}
}

func (s *Server) handleCombatStart(w http.ResponseWriter, r *http.Request, matchID, userID string) {
	if err := s.scoringService.StartCombatMatch(r.Context(), matchID, userID); err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("combat_matches", "match_started", matchID, map[string]any{
		"id":      matchID,
		"status":  "dang_dau",
		"user_id": userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"match_id": matchID,
		"status":   "dang_dau",
		"message":  "Trận đấu đã bắt đầu",
	})
}

func (s *Server) handleCombatScore(w http.ResponseWriter, r *http.Request, matchID, userID string) {
	var payload struct {
		Round  int     `json:"round"`
		Corner string  `json:"corner"` // "red" or "blue"
		Points float64 `json:"points"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		badRequest(w, err.Error())
		return
	}

	if payload.Corner != "red" && payload.Corner != "blue" {
		badRequest(w, "corner phải là 'red' hoặc 'blue'")
		return
	}
	if payload.Round < 1 {
		badRequest(w, "round phải >= 1")
		return
	}

	if err := s.scoringService.RecordCombatScore(r.Context(), matchID, userID, payload.Round, payload.Corner, payload.Points); err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("combat_matches", "scored", matchID, map[string]any{
		"round":   payload.Round,
		"corner":  payload.Corner,
		"points":  payload.Points,
		"user_id": userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"match_id": matchID,
		"round":    payload.Round,
		"corner":   payload.Corner,
		"points":   payload.Points,
		"message":  "Đã ghi nhận điểm",
	})
}

func (s *Server) handleCombatPenalty(w http.ResponseWriter, r *http.Request, matchID, userID string) {
	var payload struct {
		Round     int     `json:"round"`
		Corner    string  `json:"corner"`
		Deduction float64 `json:"deduction"`
		Reason    string  `json:"reason"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		badRequest(w, err.Error())
		return
	}

	if err := s.scoringService.RecordPenalty(r.Context(), matchID, userID, payload.Round, payload.Corner, payload.Deduction, payload.Reason); err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("combat_matches", "penalty", matchID, map[string]any{
		"round":     payload.Round,
		"corner":    payload.Corner,
		"deduction": payload.Deduction,
		"reason":    payload.Reason,
		"user_id":   userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"match_id":  matchID,
		"corner":    payload.Corner,
		"deduction": payload.Deduction,
		"message":   "Đã ghi nhận lỗi/phạt",
	})
}

func (s *Server) handleCombatEnd(w http.ResponseWriter, r *http.Request, matchID, userID string) {
	result, err := s.scoringService.EndCombatMatch(r.Context(), matchID, userID)
	if err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("combat_matches", "match_ended", matchID, map[string]any{
		"id":      matchID,
		"status":  "ket_thuc",
		"winner":  result.Winner,
		"method":  result.Method,
		"user_id": userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"match_id": matchID,
		"status":   "ket_thuc",
		"winner":   result.Winner,
		"method":   result.Method,
		"message":  "Trận đấu đã kết thúc",
	})
}

func (s *Server) handleCombatState(w http.ResponseWriter, r *http.Request, matchID string) {
	state, err := s.scoringService.BuildCombatState(r.Context(), matchID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, state)
}

// ── Forms Scoring ────────────────────────────────────────────

func (s *Server) handleFormsScoring(w http.ResponseWriter, r *http.Request, perfID, action, userID string) {
	switch action {
	case "score":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleFormsScore(w, r, perfID, userID)

	case "finalize":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		s.handleFormsFinalize(w, r, perfID, userID)

	default:
		notFound(w)
	}
}

func (s *Server) handleFormsScore(w http.ResponseWriter, r *http.Request, perfID, userID string) {
	var payload struct {
		RefereeID string  `json:"referee_id"`
		AthleteID string  `json:"athlete_id"`
		Score     float64 `json:"score"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		badRequest(w, err.Error())
		return
	}

	if payload.Score < 0 || payload.Score > 10 {
		badRequest(w, "điểm phải từ 0 đến 10")
		return
	}

	if err := s.scoringService.SubmitFormsScore(r.Context(), perfID, payload.RefereeID, payload.AthleteID, payload.Score); err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("form_performances", "judge_scored", perfID, map[string]any{
		"referee_id": payload.RefereeID,
		"athlete_id": payload.AthleteID,
		"score":      payload.Score,
		"user_id":    userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"performance_id": perfID,
		"referee_id":     payload.RefereeID,
		"score":          payload.Score,
		"message":        "Đã ghi nhận điểm giám khảo",
	})
}

func (s *Server) handleFormsFinalize(w http.ResponseWriter, r *http.Request, perfID, userID string) {
	result, err := s.scoringService.FinalizeFormsPerformance(r.Context(), perfID)
	if err != nil {
		internalError(w, err)
		return
	}

	s.broadcastEntityChange("form_performances", "finalized", perfID, map[string]any{
		"id":          perfID,
		"status":      "da_cham",
		"final_score": result.FinalScore,
		"judge_count": result.JudgeCount,
		"user_id":     userID,
	}, nil)

	success(w, http.StatusOK, map[string]any{
		"performance_id": perfID,
		"status":         "da_cham",
		"final_score":    result.FinalScore,
		"judge_count":    result.JudgeCount,
		"message":        "Đã hoàn tất chấm điểm quyền",
	})
}
