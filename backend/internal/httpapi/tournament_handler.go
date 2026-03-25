package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain"
)

func (s *Server) handleTournamentRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/tournaments")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "tournaments", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.Core.Tournament.List(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "tournaments", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Tournament
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.Core.Tournament.Create(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("tournaments", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
			return
		default:
			methodNotAllowed(w)
			return
		}
	}

	segments := strings.Split(path, "/")
	id := segments[0]

	switch len(segments) {
	case 1:
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "tournaments", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			t, err := s.Core.Tournament.GetByID(r.Context(), id)
			if err != nil {
				notFound(w)
				return
			}
			success(w, http.StatusOK, t)
			return
		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "tournaments", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				badRequest(w, "invalid json")
				return
			}
			updated, err := s.Core.Tournament.Update(r.Context(), id, patch)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(updated)
			s.broadcastEntityChange("tournaments", "updated", id, raw, nil)
			success(w, http.StatusOK, updated)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "tournaments", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			if err := s.Core.Tournament.Delete(r.Context(), id); err != nil {
				badRequest(w, err.Error())
				return
			}
			s.broadcastEntityChange("tournaments", "deleted", id, nil, nil)
			w.WriteHeader(http.StatusNoContent)
			return
		default:
			methodNotAllowed(w)
			return
		}
	default:
		notFound(w)
		return
	}
}
