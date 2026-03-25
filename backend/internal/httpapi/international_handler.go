package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/international"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — INTERNATIONAL RELATIONS HANDLER
// HTTP endpoints for managing international partners, events,
// and delegations. All wired to internationalSvc.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleInternationalRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/international/partners/", s.withAuth(s.handlePartnerCRUD))
	mux.HandleFunc("/api/v1/international/partners", s.withAuth(s.handlePartnerList))
	mux.HandleFunc("/api/v1/international/events/", s.withAuth(s.handleIntlEventCRUD))
	mux.HandleFunc("/api/v1/international/events", s.withAuth(s.handleIntlEventList))
	mux.HandleFunc("/api/v1/international/delegations/", s.withAuth(s.handleDelegationCRUD))
	mux.HandleFunc("/api/v1/international/delegations", s.withAuth(s.handleDelegationList))
}

// ── Partners ─────────────────────────────────────────────────

func (s *Server) handlePartnerList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method == http.MethodPost {
		s.handlePartnerCreate(w, r)
		return
	}
	country := r.URL.Query().Get("country")
	var partners []international.PartnerOrganization
	var err error
	if country != "" {
		partners, err = s.Federation.International.ListPartnersByCountry(r.Context(), country)
	} else {
		partners, err = s.Federation.International.ListPartners(r.Context())
	}
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"partners": partners, "total": len(partners)})
}

func (s *Server) handlePartnerCreate(w http.ResponseWriter, r *http.Request) {
	var partner international.PartnerOrganization
	if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
		badRequest(w, "invalid JSON: "+err.Error())
		return
	}
	created, err := s.Federation.International.CreatePartner(r.Context(), partner)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	success(w, http.StatusCreated, created)
}

func (s *Server) handlePartnerCRUD(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/international/partners/")
	if id == "" {
		badRequest(w, "partner ID required")
		return
	}
	switch r.Method {
	case http.MethodGet:
		partner, err := s.Federation.International.GetPartner(r.Context(), id)
		if err != nil {
			notFoundError(w, "partner not found")
			return
		}
		success(w, http.StatusOK, partner)
	case http.MethodPut:
		var partner international.PartnerOrganization
		if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		updated, err := s.Federation.International.UpdatePartner(r.Context(), id, partner)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	default:
		success(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

// ── International Events ─────────────────────────────────────

func (s *Server) handleIntlEventList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method == http.MethodPost {
		s.handleIntlEventCreate(w, r)
		return
	}
	events, err := s.Federation.International.ListEvents(r.Context())
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"events": events, "total": len(events)})
}

func (s *Server) handleIntlEventCreate(w http.ResponseWriter, r *http.Request) {
	var event international.InternationalEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		badRequest(w, "invalid JSON: "+err.Error())
		return
	}
	created, err := s.Federation.International.CreateEvent(r.Context(), event)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	success(w, http.StatusCreated, created)
}

func (s *Server) handleIntlEventCRUD(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/international/events/")
	if id == "" {
		badRequest(w, "event ID required")
		return
	}
	event, err := s.Federation.International.GetEvent(r.Context(), id)
	if err != nil {
		notFoundError(w, "event not found")
		return
	}
	success(w, http.StatusOK, event)
}

// ── Delegations ──────────────────────────────────────────────

func (s *Server) handleDelegationList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method == http.MethodPost {
		s.handleDelegationCreate(w, r)
		return
	}
	eventID := r.URL.Query().Get("event_id")
	var delegations []international.Delegation
	var err error
	if eventID != "" {
		delegations, err = s.Federation.International.ListDelegationsByEvent(r.Context(), eventID)
	} else {
		// No event filter — list all delegations via empty event query
		delegations, err = s.Federation.International.ListDelegationsByEvent(r.Context(), "")
	}
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"delegations": delegations, "total": len(delegations)})
}

func (s *Server) handleDelegationCreate(w http.ResponseWriter, r *http.Request) {
	var deleg international.Delegation
	if err := json.NewDecoder(r.Body).Decode(&deleg); err != nil {
		badRequest(w, "invalid JSON: "+err.Error())
		return
	}
	created, err := s.Federation.International.CreateDelegation(r.Context(), deleg)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	success(w, http.StatusCreated, created)
}

func (s *Server) handleDelegationCRUD(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/international/delegations/")
	if id == "" {
		badRequest(w, "delegation ID required")
		return
	}
	switch r.Method {
	case http.MethodGet:
		deleg, err := s.Federation.International.GetDelegation(r.Context(), id)
		if err != nil {
			notFoundError(w, "delegation not found")
			return
		}
		success(w, http.StatusOK, deleg)
	case http.MethodPut:
		var deleg international.Delegation
		if err := json.NewDecoder(r.Body).Decode(&deleg); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		updated, err := s.Federation.International.UpdateDelegation(r.Context(), id, deleg)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	default:
		success(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}
