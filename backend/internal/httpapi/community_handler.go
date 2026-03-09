package httpapi

import (
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain/community"
)

// handleClubRoutes handles /api/v1/clubs
func (s *Server) handleClubRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/clubs")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "clubs", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.communityService.ListClubs(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "clubs", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload community.Club
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.communityService.CreateClub(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("clubs", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			methodNotAllowed(w)
		}
		return
	}

	id := strings.Split(path, "/")[0]
	if err := s.authorizeEntityAction(&principal, "clubs", authz.ActionView); err != nil {
		writeAuthError(w, err)
		return
	}
	club, err := s.communityService.GetClub(r.Context(), id)
	if err != nil {
		notFound(w)
		return
	}
	success(w, http.StatusOK, club)
}

// handleMemberRoutes handles /api/v1/members
func (s *Server) handleMemberRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/members")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "members", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			clubID := r.URL.Query().Get("clubId")
			if clubID != "" {
				list, fetchErr := s.communityService.ListMembersByClub(r.Context(), clubID)
				if fetchErr != nil {
					internalError(w, fetchErr)
					return
				}
				success(w, http.StatusOK, list)
				return
			}
			list, fetchErr := s.communityService.ListMembers(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "members", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload community.Member
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.communityService.CreateMember(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("members", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			methodNotAllowed(w)
		}
		return
	}

	notFound(w)
}

// handleCommunityEventRoutes handles /api/v1/community-events
func (s *Server) handleCommunityEventRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/community-events")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "community_events", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.communityService.ListEvents(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "community_events", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload community.Event
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.communityService.CreateEvent(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("community_events", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			methodNotAllowed(w)
		}
		return
	}

	notFound(w)
}
