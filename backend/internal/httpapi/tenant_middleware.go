package httpapi

import (
	"fmt"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
)

// ── Tenant/Workspace Isolation Middleware ────────────────────────

// withTenantValidation ensures that the X-Context-Scope header provided by the client
// matches the user's active TenantID from their JWT token.
// This enforces strict context boundaries, preventing cross-tenant data leaks and
// ensuring that users cannot perform actions in a workspace they haven't explicitly
// switched to via the /api/v1/auth/switch-context endpoint.
func (s *Server) withTenantValidation(next func(http.ResponseWriter, *http.Request, auth.Principal)) func(http.ResponseWriter, *http.Request, auth.Principal) {
	return func(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
		// Skip validation if auth for data is disabled entirely (e.g., local dev overlay)
		if s.cfg.DisableAuthForData {
			next(w, r, principal)
			return
		}

		contextScope := strings.TrimSpace(r.Header.Get("X-Context-Scope"))

		// Validate the scope if the client explicitly declares what context they are acting in
		if contextScope != "" {
			// Prevent users from accessing data belonging to a scope they are not currently logged into
			if principal.User.TenantID != "" && contextScope != principal.User.TenantID {
				writeAuthError(w, fmt.Errorf("%w: Header X-Context-Scope (%s) bị từ chối do không khớp với Active Session (%s)",
					auth.ErrForbidden, contextScope, principal.User.TenantID))
				return
			}
		}

		next(w, r, principal)
	}
}
