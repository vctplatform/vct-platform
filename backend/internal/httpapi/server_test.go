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

func loginAccessToken(
	t *testing.T,
	handler http.Handler,
	username string,
	password string,
	role string,
) string {
	t.Helper()
	login := requestJSON(t, handler, http.MethodPost, "/api/v1/auth/login", map[string]any{
		"username":       username,
		"password":       password,
		"role":           role,
		"tournamentCode": "VCT-2026",
		"operationShift": "sang",
	}, "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200 for %s, got %d (%s)", username, login.Code, login.Body.String())
	}
	payload := decodeBody[authPayload](t, login)
	if payload.AccessToken == "" {
		t.Fatalf("expected access token for %s login, got %s", username, login.Body.String())
	}
	return payload.AccessToken
}

func newTestServer() *Server {
	return New(config.Config{
		Address:            ":0",
		AllowedOrigins:     []string{"*"},
		DisableAuthForData: false,
		AllowDemoUsers:     true,
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

func TestEntityAuthorizationMatrix(t *testing.T) {
	server := newTestServer()
	handler := server.Handler()

	adminToken := loginAccessToken(t, handler, "admin", "Admin@123", "admin")
	btcToken := loginAccessToken(t, handler, "btc", "Btc@123", "btc")
	delegateToken := loginAccessToken(t, handler, "delegate", "Delegate@123", "delegate")

	createTeam := requestJSON(t, handler, http.MethodPost, "/api/v1/teams", map[string]any{
		"id":   "TEAM-T01",
		"ten":  "Team Test",
		"ma":   "TT-01",
		"tinh": "Binh Dinh",
	}, btcToken)
	if createTeam.Code != http.StatusCreated {
		t.Fatalf("expected btc create team 201, got %d (%s)", createTeam.Code, createTeam.Body.String())
	}

	deleteByBtc := requestJSON(t, handler, http.MethodDelete, "/api/v1/teams/TEAM-T01", nil, btcToken)
	if deleteByBtc.Code != http.StatusForbidden {
		t.Fatalf("expected btc delete team 403, got %d (%s)", deleteByBtc.Code, deleteByBtc.Body.String())
	}

	deleteByAdmin := requestJSON(t, handler, http.MethodDelete, "/api/v1/teams/TEAM-T01", nil, adminToken)
	if deleteByAdmin.Code != http.StatusNoContent {
		t.Fatalf("expected admin delete team 204, got %d (%s)", deleteByAdmin.Code, deleteByAdmin.Body.String())
	}

	createAppeal := requestJSON(t, handler, http.MethodPost, "/api/v1/appeals", map[string]any{
		"id":         "KN-T01",
		"doan_ten":   "Doan A",
		"ly_do":      "Kiem tra ket qua",
		"trang_thai": "moi",
	}, delegateToken)
	if createAppeal.Code != http.StatusCreated {
		t.Fatalf("expected delegate create appeal 201, got %d (%s)", createAppeal.Code, createAppeal.Body.String())
	}

	updateAppeal := requestJSON(t, handler, http.MethodPatch, "/api/v1/appeals/KN-T01", map[string]any{
		"ket_luan": "Da cap nhat",
	}, delegateToken)
	if updateAppeal.Code != http.StatusForbidden {
		t.Fatalf("expected delegate patch appeal 403, got %d (%s)", updateAppeal.Code, updateAppeal.Body.String())
	}

	createMedal := requestJSON(t, handler, http.MethodPost, "/api/v1/medals", map[string]any{
		"id":   "MEDAL-T01",
		"team": "Doan A",
	}, adminToken)
	if createMedal.Code != http.StatusCreated {
		t.Fatalf("expected admin create medal 201, got %d (%s)", createMedal.Code, createMedal.Body.String())
	}

	updateMedalByBtc := requestJSON(t, handler, http.MethodPatch, "/api/v1/medals/MEDAL-T01", map[string]any{
		"hcv": 1,
	}, btcToken)
	if updateMedalByBtc.Code != http.StatusOK {
		t.Fatalf("expected btc update medal 200, got %d (%s)", updateMedalByBtc.Code, updateMedalByBtc.Body.String())
	}

	updateMedalByDelegate := requestJSON(t, handler, http.MethodPatch, "/api/v1/medals/MEDAL-T01", map[string]any{
		"hcv": 2,
	}, delegateToken)
	if updateMedalByDelegate.Code != http.StatusForbidden {
		t.Fatalf("expected delegate update medal 403, got %d (%s)", updateMedalByDelegate.Code, updateMedalByDelegate.Body.String())
	}

	createBracket := requestJSON(t, handler, http.MethodPost, "/api/v1/brackets", map[string]any{
		"id":       "BRKT-T01",
		"category": "Nam 60kg",
	}, adminToken)
	if createBracket.Code != http.StatusCreated {
		t.Fatalf("expected admin create bracket 201, got %d (%s)", createBracket.Code, createBracket.Body.String())
	}

	viewBracketByDelegate := requestJSON(t, handler, http.MethodGet, "/api/v1/brackets", nil, delegateToken)
	if viewBracketByDelegate.Code != http.StatusForbidden {
		t.Fatalf("expected delegate view brackets 403, got %d (%s)", viewBracketByDelegate.Code, viewBracketByDelegate.Body.String())
	}
}
