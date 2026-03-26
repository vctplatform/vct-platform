package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain"
)

func (s *Server) handleRefereeRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/referees")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "referees", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.Core.Organization.ListReferees(r.Context())
			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "referees", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Referee
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Organization.CreateReferee(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("referees", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
			return
		default:
			apiMethodNotAllowed(w)
			return
		}
	}

	segments := strings.Split(path, "/")
	id := segments[0]

	switch len(segments) {
	case 1:
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "referees", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			ref, err := s.Core.Organization.GetReferee(r.Context(), id)
			if err != nil {
				apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
				return
			}
			success(w, http.StatusOK, ref)
			return
		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "referees", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid json")
				return
			}
			b, err := json.Marshal(patch)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			updatedStore, err := s.store.Update("referees", id, b)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			var updatedMap map[string]any
			json.Unmarshal(updatedStore, &updatedMap)
			s.broadcastEntityChange("referees", "updated", id, updatedMap, nil)
			successJSONBytes(w, http.StatusOK, updatedStore)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "referees", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			s.store.Delete("referees", id)
			s.broadcastEntityChange("referees", "deleted", id, nil, nil)
			w.WriteHeader(http.StatusNoContent)
			return
		default:
			apiMethodNotAllowed(w)
			return
		}
	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
}

func (s *Server) handleArenaRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/arenas")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "arenas", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.Core.Organization.ListArenas(r.Context())
			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "arenas", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Arena
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Organization.CreateArena(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("arenas", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
			return
		default:
			apiMethodNotAllowed(w)
			return
		}
	}

	segments := strings.Split(path, "/")
	id := segments[0]

	switch len(segments) {
	case 1:
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "arenas", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			arena, err := s.Core.Organization.GetArena(r.Context(), id)
			if err != nil {
				apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
				return
			}
			success(w, http.StatusOK, arena)
			return
		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "arenas", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid json")
				return
			}
			b, err := json.Marshal(patch)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			updatedStore, err := s.store.Update("arenas", id, b)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			var updatedMap map[string]any
			json.Unmarshal(updatedStore, &updatedMap)
			s.broadcastEntityChange("arenas", "updated", id, updatedMap, nil)
			successJSONBytes(w, http.StatusOK, updatedStore)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "arenas", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			s.store.Delete("arenas", id)
			s.broadcastEntityChange("arenas", "deleted", id, nil, nil)
			w.WriteHeader(http.StatusNoContent)
			return
		default:
			apiMethodNotAllowed(w)
			return
		}
	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
}
