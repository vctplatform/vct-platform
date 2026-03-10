package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/provincial"
)

// handleClubInternalRoutes registers all /api/v1/club/… endpoints.
func (s *Server) handleClubInternalRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/club/dashboard", s.withAuth(s.handleClubDashboard))
	mux.HandleFunc("/api/v1/club/members/", s.withAuth(s.handleClubMemberAction))
	mux.HandleFunc("/api/v1/club/members", s.withAuth(s.handleClubMembers))
	mux.HandleFunc("/api/v1/club/classes/", s.withAuth(s.handleClubClassAction))
	mux.HandleFunc("/api/v1/club/classes", s.withAuth(s.handleClubClasses))
	mux.HandleFunc("/api/v1/club/finance/summary", s.withAuth(s.handleClubFinanceSummary))
	mux.HandleFunc("/api/v1/club/finance", s.withAuth(s.handleClubFinance))
	mux.HandleFunc("/api/v1/club/settings", s.withAuth(s.handleClubSettings))
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Server) handleClubDashboard(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}
	stats, err := s.provincialSvc.GetClubDashboard(r.Context(), clubID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": stats})
}

// ── Members ──────────────────────────────────────────────────

func (s *Server) handleClubMembers(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		members, err := s.provincialSvc.ListClubMembers(r.Context(), clubID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"members": members, "total": len(members)}})

	case http.MethodPost:
		var m provincial.ClubMember
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if m.ClubID == "" {
			m.ClubID = clubID
		}
		created, err := s.provincialSvc.CreateClubMember(r.Context(), m)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubMemberAction(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/club/members/")
	parts := strings.SplitN(path, "/", 2)
	id := parts[0]

	if len(parts) == 2 {
		action := parts[1]
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		switch action {
		case "approve":
			if err := s.provincialSvc.ApproveClubMember(r.Context(), id); err != nil {
				internalError(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"message": "member approved"})
		case "reject":
			if err := s.provincialSvc.RejectClubMember(r.Context(), id); err != nil {
				internalError(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"message": "member rejected"})
		default:
			http.Error(w, "unknown action", http.StatusBadRequest)
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		m, err := s.provincialSvc.GetClubMember(r.Context(), id)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": m})

	case http.MethodPut:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			badRequest(w, "invalid body")
			return
		}
		if err := s.provincialSvc.UpdateClubMember(r.Context(), id, patch); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if err := s.provincialSvc.DeleteClubMember(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// ── Classes ──────────────────────────────────────────────────

func (s *Server) handleClubClasses(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		classes, err := s.provincialSvc.ListClubClasses(r.Context(), clubID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"classes": classes, "total": len(classes)}})

	case http.MethodPost:
		var c provincial.ClubClass
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if c.ClubID == "" {
			c.ClubID = clubID
		}
		created, err := s.provincialSvc.CreateClubClass(r.Context(), c)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubClassAction(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club/classes/")

	switch r.Method {
	case http.MethodGet:
		c, err := s.provincialSvc.GetClubClass(r.Context(), id)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": c})

	case http.MethodPut:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			badRequest(w, "invalid body")
			return
		}
		if err := s.provincialSvc.UpdateClubClass(r.Context(), id, patch); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if err := s.provincialSvc.DeleteClubClass(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// ── Finance ──────────────────────────────────────────────────

func (s *Server) handleClubFinance(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		entries, err := s.provincialSvc.ListClubFinance(r.Context(), clubID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"entries": entries, "total": len(entries)}})

	case http.MethodPost:
		var f provincial.ClubFinanceEntry
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if f.ClubID == "" {
			f.ClubID = clubID
		}
		created, err := s.provincialSvc.CreateClubFinanceEntry(r.Context(), f)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubFinanceSummary(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}
	summary, err := s.provincialSvc.GetClubFinanceSummary(r.Context(), clubID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": summary})
}

// ── Settings ─────────────────────────────────────────────────

func (s *Server) handleClubSettings(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		club, err := s.provincialSvc.GetClub(r.Context(), clubID)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": club})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
