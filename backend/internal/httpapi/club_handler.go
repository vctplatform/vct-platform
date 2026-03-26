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
	// NOTE: /api/v1/club/dashboard is registered in club_v2_handler.go (handleClubV2Routes)
	mux.HandleFunc("/api/v1/club/members/", s.withAuth(s.handleClubMemberAction))
	mux.HandleFunc("/api/v1/club/members", s.withAuth(s.handleClubMembers))
	mux.HandleFunc("/api/v1/club/classes/", s.withAuth(s.handleClubClassAction))
	mux.HandleFunc("/api/v1/club/classes", s.withAuth(s.handleClubClasses))
	mux.HandleFunc("/api/v1/club/finance/summary", s.withAuth(s.handleClubFinanceSummary))
	mux.HandleFunc("/api/v1/club/finance", s.withAuth(s.handleClubFinance))
	mux.HandleFunc("/api/v1/club/settings", s.withAuth(s.handleClubSettings))
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Server) handleClubDashboard(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireClubRead(w, p) {
		return
	}
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}
	stats, err := s.Provincial.Main.GetClubDashboard(r.Context(), clubID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": stats})
}

// ── Members ──────────────────────────────────────────────────

func (s *Server) handleClubMembers(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		if !requireClubRead(w, p) {
			return
		}
		members, err := s.Provincial.Main.ListClubMembers(r.Context(), clubID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"members": members, "total": len(members)}})

	case http.MethodPost:
		if !requireClubWrite(w, p) {
			return
		}
		var m provincial.ClubMember
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		if m.ClubID == "" {
			m.ClubID = clubID
		}
		created, err := s.Provincial.Main.CreateClubMember(r.Context(), m)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleClubMemberAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/club/members/")
	parts := strings.SplitN(path, "/", 2)
	id := parts[0]

	if len(parts) == 2 {
		action := parts[1]
		if r.Method != http.MethodPost {
			apiMethodNotAllowed(w)
			return
		}
		if !requireClubWrite(w, p) {
			return
		}
		switch action {
		case "approve":
			if err := s.Provincial.Main.ApproveClubMember(r.Context(), id); err != nil {
				apiInternal(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"message": "member approved"})
		case "reject":
			if err := s.Provincial.Main.RejectClubMember(r.Context(), id); err != nil {
				apiInternal(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"message": "member rejected"})
		default:
			apiValidation(w, "Hành động không hợp lệ")
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		if !requireClubRead(w, p) {
			return
		}
		m, err := s.Provincial.Main.GetClubMember(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, map[string]any{"data": m})

	case http.MethodPut:
		if !requireClubWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid body")
			return
		}
		if err := s.Provincial.Main.UpdateClubMember(r.Context(), id, patch); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if !requireClubWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeleteClubMember(r.Context(), id); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		apiMethodNotAllowed(w)
	}
}

// ── Classes ──────────────────────────────────────────────────

func (s *Server) handleClubClasses(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		if !requireClubRead(w, p) {
			return
		}
		classes, err := s.Provincial.Main.ListClubClasses(r.Context(), clubID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"classes": classes, "total": len(classes)}})

	case http.MethodPost:
		if !requireClubWrite(w, p) {
			return
		}
		var c provincial.ClubClass
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		if c.ClubID == "" {
			c.ClubID = clubID
		}
		created, err := s.Provincial.Main.CreateClubClass(r.Context(), c)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleClubClassAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club/classes/")

	switch r.Method {
	case http.MethodGet:
		if !requireClubRead(w, p) {
			return
		}
		c, err := s.Provincial.Main.GetClubClass(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, map[string]any{"data": c})

	case http.MethodPut:
		if !requireClubWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid body")
			return
		}
		if err := s.Provincial.Main.UpdateClubClass(r.Context(), id, patch); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if !requireClubWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeleteClubClass(r.Context(), id); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		apiMethodNotAllowed(w)
	}
}

// ── Finance ──────────────────────────────────────────────────

func (s *Server) handleClubFinance(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		if !requireClubRead(w, p) {
			return
		}
		entries, err := s.Provincial.Main.ListClubFinance(r.Context(), clubID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"entries": entries, "total": len(entries)}})

	case http.MethodPost:
		if !requireClubWrite(w, p) {
			return
		}
		var f provincial.ClubFinanceEntry
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		if f.ClubID == "" {
			f.ClubID = clubID
		}
		created, err := s.Provincial.Main.CreateClubFinanceEntry(r.Context(), f)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleClubFinanceSummary(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireClubRead(w, p) {
		return
	}
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}
	summary, err := s.Provincial.Main.GetClubFinanceSummary(r.Context(), clubID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": summary})
}

// ── Settings ─────────────────────────────────────────────────

func (s *Server) handleClubSettings(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireClubRead(w, p) {
		return
	}
	clubID := r.URL.Query().Get("club_id")
	if clubID == "" {
		clubID = "CLB-001"
	}

	switch r.Method {
	case http.MethodGet:
		club, err := s.Provincial.Main.GetClub(r.Context(), clubID)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, map[string]any{"data": club})

	default:
		apiMethodNotAllowed(w)
	}
}
