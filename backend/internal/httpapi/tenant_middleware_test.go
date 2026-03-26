package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"vct-platform/backend/internal/auth"
)

func TestTenantValidationMiddleware(t *testing.T) {
	s := &Server{}

	tests := []struct {
		name           string
		cfgDisableAuth bool
		headerScope    string
		jwtTenantID    string
		expectCode     int
	}{
		{
			name:           "DisableAuthForData allows any request",
			cfgDisableAuth: true,
			headerScope:    "wrong-scope",
			jwtTenantID:    "real-scope",
			expectCode:     http.StatusOK,
		},
		{
			name:           "No X-Context-Scope header allows request",
			cfgDisableAuth: false,
			headerScope:    "",
			jwtTenantID:    "some-scope",
			expectCode:     http.StatusOK, // Backward compatible
		},
		{
			name:           "Matching scopes allows request",
			cfgDisableAuth: false,
			headerScope:    "match-scope",
			jwtTenantID:    "match-scope",
			expectCode:     http.StatusOK,
		},
		{
			name:           "Mismatched scopes denies request",
			cfgDisableAuth: false,
			headerScope:    "hack-scope",
			jwtTenantID:    "user-scope",
			expectCode:     http.StatusForbidden,
		},
		{
			name:           "Empty JWT tenant with explicit header allows request (Admin case)",
			cfgDisableAuth: false,
			headerScope:    "some-scope",
			jwtTenantID:    "", // Some super admins might have empty tenant
			expectCode:     http.StatusOK,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			s.cfg.DisableAuthForData = tc.cfgDisableAuth

			// Mock inner handler
			innerHandler := func(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
				w.WriteHeader(http.StatusOK)
			}

			middleware := s.withTenantValidation(innerHandler)

			// Setup request
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tc.headerScope != "" {
				req.Header.Set("X-Context-Scope", tc.headerScope)
			}

			// Setup mock principal
			principal := auth.Principal{
				User: auth.AuthUser{
					TenantID: tc.jwtTenantID,
				},
			}

			w := httptest.NewRecorder()
			middleware(w, req, principal)

			if w.Code != tc.expectCode {
				t.Errorf("Expected status %d, got %d", tc.expectCode, w.Code)
			}
		})
	}
}
