package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/parent"
)

// ═══════════════════════════════════════════════════════════════
// Parent / Guardian API Handlers
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleParentRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/parent/dashboard", s.withAuth(s.handleParentDashboard))
	mux.HandleFunc("/api/v1/parent/children", s.withAuth(s.handleParentChildren))
	mux.HandleFunc("/api/v1/parent/children/link", s.withAuth(s.handleParentLinkChild))
	mux.HandleFunc("/api/v1/parent/children/", s.withAuth(s.handleParentChildDetail))
	mux.HandleFunc("/api/v1/parent/consents", s.withAuth(s.handleParentConsents))
	mux.HandleFunc("/api/v1/parent/consents/", s.withAuth(s.handleParentConsentAction))
}

// requireParentRole verifies the principal has the parent role.
// Returns true if OK, false if denied (and writes the HTTP error).
func requireParentRole(w http.ResponseWriter, p auth.Principal) bool {
	if p.User.Role != auth.RoleParent {
		http.Error(w, "forbidden: requires parent role", http.StatusForbidden)
		return false
	}
	return true
}

// GET /api/v1/parent/dashboard
func (s *Server) handleParentDashboard(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireParentRole(w, p) {
		return
	}
	dash, err := s.Extended.Parent.GetDashboard(r.Context(), p.User.ID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, dash)
}

// GET /api/v1/parent/children
func (s *Server) handleParentChildren(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireParentRole(w, p) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		links, err := s.Extended.Parent.ListAllLinks(r.Context(), p.User.ID)
		if err != nil {
			internalError(w, err)
			return
		}
		if links == nil {
			links = []parent.ParentLink{}
		}
		success(w, http.StatusOK, links)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// POST /api/v1/parent/children/link
func (s *Server) handleParentLinkChild(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireParentRole(w, p) {
		return
	}
	var req struct {
		AthleteID   string `json:"athlete_id"`
		AthleteName string `json:"athlete_name"`
		Relation    string `json:"relation"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	link := parent.ParentLink{
		ParentID:    p.User.ID,
		ParentName:  p.User.DisplayName,
		AthleteID:   req.AthleteID,
		AthleteName: req.AthleteName,
		Relation:    req.Relation,
	}
	created, err := s.Extended.Parent.RequestLink(r.Context(), link)
	if err != nil {
		// Validation errors are returned as 400, not 500
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	success(w, http.StatusCreated, created)
}

// GET /api/v1/parent/children/{id}/attendance
// GET /api/v1/parent/children/{id}/results
// DELETE /api/v1/parent/children/{id}
func (s *Server) handleParentChildDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireParentRole(w, p) {
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/parent/children/")
	parts := strings.SplitN(path, "/", 2)

	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "missing child link id", http.StatusBadRequest)
		return
	}

	linkID := parts[0]

	// DELETE /api/v1/parent/children/{linkID} — unlink child
	if r.Method == http.MethodDelete {
		// Verify ownership: make sure this link belongs to the parent
		link, err := s.Extended.Parent.GetLinkByID(r.Context(), linkID)
		if err != nil {
			http.Error(w, "link not found", http.StatusNotFound)
			return
		}
		if link.ParentID != p.User.ID {
			http.Error(w, "forbidden: link does not belong to you", http.StatusForbidden)
			return
		}
		if err := s.Extended.Parent.DeleteLink(r.Context(), linkID); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "deleted", "id": linkID})
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// For GET sub-resources, we need {id}/{sub}
	if len(parts) < 2 {
		http.Error(w, "missing sub-resource (attendance|results)", http.StatusBadRequest)
		return
	}

	athleteID := parts[0]
	sub := parts[1]

	// Ownership check: verify this athlete is linked to the parent
	if !s.Extended.Parent.IsChildOfParent(r.Context(), p.User.ID, athleteID) {
		http.Error(w, "forbidden: athlete is not linked to your account", http.StatusForbidden)
		return
	}

	switch sub {
	case "attendance":
		records, err := s.Extended.Parent.GetChildAttendance(r.Context(), athleteID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, records)
	case "results":
		results, err := s.Extended.Parent.GetChildResults(r.Context(), athleteID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, results)
	default:
		http.Error(w, "unknown sub-resource", http.StatusBadRequest)
	}
}

// GET  /api/v1/parent/consents
// POST /api/v1/parent/consents
func (s *Server) handleParentConsents(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireParentRole(w, p) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		consents, err := s.Extended.Parent.ListConsents(r.Context(), p.User.ID)
		if err != nil {
			internalError(w, err)
			return
		}
		if consents == nil {
			consents = []parent.ConsentRecord{}
		}
		success(w, http.StatusOK, consents)

	case http.MethodPost:
		var req struct {
			AthleteID   string `json:"athlete_id"`
			AthleteName string `json:"athlete_name"`
			Type        string `json:"type"`
			Title       string `json:"title"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}

		// Verify the athlete is linked to this parent
		if !s.Extended.Parent.IsChildOfParent(r.Context(), p.User.ID, req.AthleteID) {
			http.Error(w, "forbidden: athlete is not linked to your account", http.StatusForbidden)
			return
		}

		c := parent.ConsentRecord{
			ParentID:    p.User.ID,
			AthleteID:   req.AthleteID,
			AthleteName: req.AthleteName,
			Type:        parent.ConsentType(req.Type),
			Title:       req.Title,
			Description: req.Description,
		}
		created, err := s.Extended.Parent.CreateConsent(r.Context(), c)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// DELETE /api/v1/parent/consents/{id}
func (s *Server) handleParentConsentAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireParentRole(w, p) {
		return
	}
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/parent/consents/")
	if id == "" {
		http.Error(w, "missing consent id", http.StatusBadRequest)
		return
	}
	// RevokeConsent now verifies ownership internally
	if err := s.Extended.Parent.RevokeConsent(r.Context(), id, p.User.ID); err != nil {
		if strings.Contains(err.Error(), "does not belong") || strings.Contains(err.Error(), "not active") {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "revoked", "id": id})
}
