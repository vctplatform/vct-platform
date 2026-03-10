package httpapi

import (
	"net/http"
	"strconv"

	"vct-platform/backend/internal/auth"
)

// handleRecentEvents returns recent domain events for the dashboard.
func (s *Server) handleRecentEvents(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	n := 20
	if q := r.URL.Query().Get("limit"); q != "" {
		if parsed, err := strconv.Atoi(q); err == nil && parsed > 0 && parsed <= 100 {
			n = parsed
		}
	}

	recent := s.eventBus.RecentEvents(n)
	success(w, http.StatusOK, map[string]any{
		"events": recent,
		"total":  len(recent),
	})
}
