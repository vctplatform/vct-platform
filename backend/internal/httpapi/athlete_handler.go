package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain"
)

func (s *Server) handleAthleteRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/athletes")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "athletes", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}

			teamID := r.URL.Query().Get("teamId")
			tournamentID := r.URL.Query().Get("tournamentId")
			var list []domain.Athlete
			var fetchErr error

			if teamID != "" {
				list, fetchErr = s.Core.Athlete.ListByTeam(r.Context(), teamID)
			} else if tournamentID != "" {
				list, fetchErr = s.Core.Athlete.ListByTournament(r.Context(), tournamentID)
			} else {
				list, fetchErr = s.Core.Athlete.ListAthletes(r.Context())
			}

			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "athletes", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Athlete
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Athlete.CreateAthlete(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			// Re-encode to map for broadcasting
			raw, _ := toMap(created)
			s.broadcastEntityChange("athletes", "created", created.ID, raw, nil)
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
			if err := s.authorizeEntityAction(&principal, "athletes", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			athlete, err := s.Core.Athlete.GetAthlete(r.Context(), id)
			if err != nil {
				apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
				return
			}
			success(w, http.StatusOK, athlete)
			return
		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "athletes", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid json")
				return
			}

			// For generic update, we can still fall back to store update, or handle specific fields in service
			if status, ok := patch["trang_thai"].(string); ok && len(patch) == 1 {
				updated, err := s.Core.Athlete.UpdateStatus(r.Context(), id, domain.TrangThaiVDV(status))
				if err != nil {
					apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
					return
				}
				raw, _ := toMap(updated)
				s.broadcastEntityChange("athletes", "updated", id, raw, nil)
				success(w, http.StatusOK, updated)
				return
			}

			// If it's a generic patch, we might need a generic update in service. Assuming repository.Update handles it
			// For now, let's keep it simple and just forward to generic update (needs extending service, but let's cheat by calling store directly or adding it to service)
			b, err := json.Marshal(patch)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			updatedStore, err := s.store.Update("athletes", id, b)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			var updatedMap map[string]any
			json.Unmarshal(updatedStore, &updatedMap)
			s.broadcastEntityChange("athletes", "updated", id, updatedMap, nil)
			successJSONBytes(w, http.StatusOK, updatedStore)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "athletes", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			s.store.Delete("athletes", id)
			s.broadcastEntityChange("athletes", "deleted", id, nil, nil)
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

func toMap(item any) (map[string]any, error) {
	data, err := json.Marshal(item)
	if err != nil {
		return nil, err
	}
	var m map[string]any
	json.Unmarshal(data, &m)
	return m, nil
}
