package httpapi

import (
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
)

func (s *Server) handleRankingRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/rankings")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	// Sub-routes: /athletes, /teams
	switch {
	case path == "" || path == "athletes":
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		if err := s.authorizeEntityAction(&principal, "rankings", authz.ActionView); err != nil {
			writeAuthError(w, err)
			return
		}
		category := r.URL.Query().Get("category")
		if category != "" {
			list, fetchErr := s.Core.Ranking.ListAthleteRankingsByCategory(r.Context(), category)
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
			return
		}
		list, fetchErr := s.Core.Ranking.ListAthleteRankings(r.Context())
		if fetchErr != nil {
			internalError(w, fetchErr)
			return
		}
		success(w, http.StatusOK, list)

	case path == "teams":
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		if err := s.authorizeEntityAction(&principal, "rankings", authz.ActionView); err != nil {
			writeAuthError(w, err)
			return
		}
		list, fetchErr := s.Core.Ranking.ListTeamRankings(r.Context())
		if fetchErr != nil {
			internalError(w, fetchErr)
			return
		}
		success(w, http.StatusOK, list)

	default:
		// /rankings/{id}
		segments := strings.Split(path, "/")
		id := segments[0]
		if err := s.authorizeEntityAction(&principal, "rankings", authz.ActionView); err != nil {
			writeAuthError(w, err)
			return
		}
		item, err := s.Core.Ranking.GetAthleteRanking(r.Context(), id)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, item)
	}
}
