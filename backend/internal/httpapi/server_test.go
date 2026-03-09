package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"vct-platform/backend/internal/config"
)

type authPayload struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

func newTestServer() *Server {
	return New(config.Config{
		Address:            ":0",
		AllowedOrigins:     []string{"*"},
		DisableAuthForData: false,
		JWTSecret:          "http-test-secret",
		JWTIssuer:          "http-test",
		AccessTokenTTL:     10 * time.Minute,
		RefreshTokenTTL:    2 * time.Hour,
		AuditLimit:         500,
	})
}

func requestJSON(
	t *testing.T,
	handler http.Handler,
	method string,
	path string,
	body any,
	token string,
) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		data, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal request body: %v", err)
		}
		reader = bytes.NewReader(data)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return rr
}

func decodeBody[T any](t *testing.T, rr *httptest.ResponseRecorder) T {
	t.Helper()
	var output T
	if err := json.Unmarshal(rr.Body.Bytes(), &output); err != nil {
		t.Fatalf("failed to decode response body (%s): %v", rr.Body.String(), err)
	}
	return output
}

func TestAuthHTTPContracts(t *testing.T) {
	server := newTestServer()
	handler := server.Handler()

	login := requestJSON(t, handler, http.MethodPost, "/api/v1/auth/login", map[string]any{
		"username":       "admin",
		"password":       "Admin@123",
		"role":           "admin",
		"tournamentCode": "VCT-2026",
		"operationShift": "sang",
	}, "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d (%s)", login.Code, login.Body.String())
	}
	loginPayload := decodeBody[authPayload](t, login)
	if loginPayload.AccessToken == "" || loginPayload.RefreshToken == "" {
		t.Fatalf("expected login payload with accessToken/refreshToken, got %s", login.Body.String())
	}

	refresh := requestJSON(t, handler, http.MethodPost, "/api/v1/auth/refresh", map[string]any{
		"refreshToken": loginPayload.RefreshToken,
	}, "")
	if refresh.Code != http.StatusOK {
		t.Fatalf("expected refresh 200, got %d (%s)", refresh.Code, refresh.Body.String())
	}
	refreshedPayload := decodeBody[authPayload](t, refresh)
	if refreshedPayload.AccessToken == "" || refreshedPayload.RefreshToken == "" {
		t.Fatalf("expected refreshed token pair, got %s", refresh.Body.String())
	}

	audit := requestJSON(t, handler, http.MethodGet, "/api/v1/auth/audit?action=auth.login&limit=20", nil, refreshedPayload.AccessToken)
	if audit.Code != http.StatusOK {
		t.Fatalf("expected audit 200, got %d (%s)", audit.Code, audit.Body.String())
	}

	revoke := requestJSON(t, handler, http.MethodPost, "/api/v1/auth/revoke", map[string]any{
		"refreshToken": refreshedPayload.RefreshToken,
		"accessToken":  refreshedPayload.AccessToken,
		"reason":       "test_revoke",
	}, refreshedPayload.AccessToken)
	if revoke.Code != http.StatusOK {
		t.Fatalf("expected revoke 200, got %d (%s)", revoke.Code, revoke.Body.String())
	}

	meAfterRevoke := requestJSON(t, handler, http.MethodGet, "/api/v1/auth/me", nil, refreshedPayload.AccessToken)
	if meAfterRevoke.Code != http.StatusUnauthorized {
		t.Fatalf("expected me after revoke to return 401, got %d (%s)", meAfterRevoke.Code, meAfterRevoke.Body.String())
	}
}
