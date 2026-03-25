package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain"
)

func (s *Server) handleTeamRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/teams")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "teams", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.Core.Organization.ListTeams(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "teams", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Team
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.Core.Organization.CreateTeam(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("teams", "created", created.ID, raw, nil)
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
			if err := s.authorizeEntityAction(&principal, "teams", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			team, err := s.Core.Organization.GetTeam(r.Context(), id)
			if err != nil {
				notFound(w)
				return
			}
			success(w, http.StatusOK, team)
			return
		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "teams", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				badRequest(w, "invalid json")
				return
			}
			b, err := json.Marshal(patch)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			updatedStore, err := s.store.Update("teams", id, b)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			var updatedMap map[string]any
			json.Unmarshal(updatedStore, &updatedMap)
			s.broadcastEntityChange("teams", "updated", id, updatedMap, nil)
			successJSONBytes(w, http.StatusOK, updatedStore)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "teams", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			s.store.Delete("teams", id)
			s.broadcastEntityChange("teams", "deleted", id, nil, nil)
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
