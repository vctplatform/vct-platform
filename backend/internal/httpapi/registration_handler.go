package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain"
)

func (s *Server) handleRegistrationRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/registration")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "registration", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}

			athleteID := r.URL.Query().Get("athleteId")
			tournamentID := r.URL.Query().Get("tournamentId")
			var list []domain.Registration
			var fetchErr error

			if athleteID != "" {
				list, fetchErr = s.Core.Registration.ListByAthlete(r.Context(), athleteID)
			} else if tournamentID != "" {
				list, fetchErr = s.Core.Registration.ListByTournament(r.Context(), tournamentID)
			} else {
				list, fetchErr = s.Core.Registration.ListRegistrations(r.Context())
			}

			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return

		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "registration", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload domain.Registration
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Registration.CreateRegistration(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("registration", "created", created.ID, raw, nil)
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
			if err := s.authorizeEntityAction(&principal, "registration", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			reg, err := s.Core.Registration.GetRegistration(r.Context(), id)
			if err != nil {
				apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
				return
			}
			success(w, http.StatusOK, reg)
			return

		case http.MethodPatch:
			if err := s.authorizeEntityAction(&principal, "registration", authz.ActionUpdate); err != nil {
				writeAuthError(w, err)
				return
			}
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid json")
				return
			}
			updated, err := s.Core.Registration.UpdateRegistration(r.Context(), id, patch)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(updated)
			s.broadcastEntityChange("registration", "updated", id, raw, nil)
			success(w, http.StatusOK, updated)
			return

		case http.MethodDelete:
			if err := s.authorizeEntityAction(&principal, "registration", authz.ActionDelete); err != nil {
				writeAuthError(w, err)
				return
			}
			if err := s.Core.Registration.DeleteRegistration(r.Context(), id); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			s.broadcastEntityChange("registration", "deleted", id, nil, nil)
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
