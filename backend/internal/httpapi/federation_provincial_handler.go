package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL FEDERATION API HANDLERS
// Provincial-level: clubs, athletes, coaches, reports, stats
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleProvincialFederationRoutes(mux *http.ServeMux) {
	// NOTE: /api/v1/provincial/clubs, athletes, coaches routes are registered
	// in provincial_handler.go (handleProvincialRoutes) — do NOT re-register here.
	// Federation-level provincial endpoints for reports and stats:
	mux.HandleFunc("/api/v1/provincial/reports/", s.withAuth(s.handleProvReportRoutes))
	mux.HandleFunc("/api/v1/provincial/reports", s.withAuth(s.handleProvReportRoutes))
	mux.HandleFunc("/api/v1/provincial/stats", s.withAuth(s.handleProvStats))
}

// ── Provincial Clubs ─────────────────────────────────────────

func (s *Server) handleProvClubRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/clubs")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provinceID := r.URL.Query().Get("province_id")
		clubs, err := s.federationSvc.ListProvincialClubs(r.Context(), provinceID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"clubs": clubs, "total": len(clubs)})

	case r.Method == "POST" && id == "":
		var club federation.ProvincialClub
		if err := json.NewDecoder(r.Body).Decode(&club); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.federationSvc.CreateProvincialClub(r.Context(), club)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		club, err := s.federationSvc.GetProvincialClub(r.Context(), id)
		if err != nil {
			notFoundError(w, "club not found")
			return
		}
		success(w, http.StatusOK, club)

	case r.Method == "DELETE" && id != "":
		if err := s.federationSvc.DeleteProvincialClub(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ── Provincial Athletes ──────────────────────────────────────

func (s *Server) handleProvAthleteRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/athletes")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provinceID := r.URL.Query().Get("province_id")
		clubID := r.URL.Query().Get("club_id")
		var athletes []federation.ProvincialAthlete
		var err error
		if clubID != "" {
			athletes, err = s.federationSvc.ListAthletesByClub(r.Context(), clubID)
		} else {
			athletes, err = s.federationSvc.ListProvincialAthletes(r.Context(), provinceID)
		}
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})

	case r.Method == "POST" && id == "":
		var athlete federation.ProvincialAthlete
		if err := json.NewDecoder(r.Body).Decode(&athlete); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.federationSvc.CreateProvincialAthlete(r.Context(), athlete)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		athlete, err := s.federationSvc.GetProvincialAthlete(r.Context(), id)
		if err != nil {
			notFoundError(w, "athlete not found")
			return
		}
		success(w, http.StatusOK, athlete)

	default:
		methodNotAllowed(w)
	}
}

// ── Provincial Coaches ───────────────────────────────────────

func (s *Server) handleProvCoachRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/coaches")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provinceID := r.URL.Query().Get("province_id")
		coaches, err := s.federationSvc.ListProvincialCoaches(r.Context(), provinceID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"coaches": coaches, "total": len(coaches)})

	case r.Method == "POST" && id == "":
		var coach federation.ProvincialCoach
		if err := json.NewDecoder(r.Body).Decode(&coach); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.federationSvc.CreateProvincialCoach(r.Context(), coach)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		coach, err := s.federationSvc.GetProvincialCoach(r.Context(), id)
		if err != nil {
			notFoundError(w, "coach not found")
			return
		}
		success(w, http.StatusOK, coach)

	default:
		methodNotAllowed(w)
	}
}

// ── Provincial Reports ───────────────────────────────────────

func (s *Server) handleProvReportRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/reports")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provinceID := r.URL.Query().Get("province_id")
		reports, err := s.federationSvc.ListProvincialReports(r.Context(), provinceID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"reports": reports, "total": len(reports)})

	case r.Method == "POST" && id == "":
		var report federation.ProvincialReport
		if err := json.NewDecoder(r.Body).Decode(&report); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.federationSvc.CreateProvincialReport(r.Context(), report)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		methodNotAllowed(w)
	}
}

// ── Provincial Statistics ────────────────────────────────────

func (s *Server) handleProvStats(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	provinceID := r.URL.Query().Get("province_id")
	if provinceID == "" {
		badRequest(w, "province_id is required")
		return
	}
	stats, err := s.federationSvc.GetProvincialStatistics(r.Context(), provinceID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}
