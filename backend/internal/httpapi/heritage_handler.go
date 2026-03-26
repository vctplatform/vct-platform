package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain/heritage"
)

// handleBeltRoutes handles /api/v1/belts
func (s *Server) handleBeltRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/belts")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "belts", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.Core.Heritage.ListBelts(r.Context())
			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "belts", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload heritage.BeltRank
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Heritage.CreateBelt(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("belts", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			apiMethodNotAllowed(w)
		}
		return
	}

	id := strings.Split(path, "/")[0]
	if err := s.authorizeEntityAction(&principal, "belts", authz.ActionView); err != nil {
		writeAuthError(w, err)
		return
	}
	belt, err := s.Core.Heritage.GetBelt(r.Context(), id)
	if err != nil {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
	success(w, http.StatusOK, belt)
}

// handleTechniqueRoutes handles /api/v1/techniques
func (s *Server) handleTechniqueRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/techniques")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "techniques", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			category := r.URL.Query().Get("loai")
			if category != "" {
				list, fetchErr := s.Core.Heritage.ListTechniquesByCategory(r.Context(), category)
				if fetchErr != nil {
					apiInternal(w, fetchErr)
					return
				}
				success(w, http.StatusOK, list)
				return
			}
			list, fetchErr := s.Core.Heritage.ListTechniques(r.Context())
			if fetchErr != nil {
				apiInternal(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "techniques", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload heritage.Technique
			if err := decodeJSON(r, &payload); err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			created, err := s.Core.Heritage.CreateTechnique(r.Context(), payload)
			if err != nil {
				apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("techniques", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			apiMethodNotAllowed(w)
		}
		return
	}

	id := strings.Split(path, "/")[0]
	if err := s.authorizeEntityAction(&principal, "techniques", authz.ActionView); err != nil {
		writeAuthError(w, err)
		return
	}
	tech, err := s.Core.Heritage.GetTechnique(r.Context(), id)
	if err != nil {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
	success(w, http.StatusOK, tech)
}

// Suppress unused import warning
var _ = json.NewDecoder
