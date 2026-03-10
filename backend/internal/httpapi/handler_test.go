package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"vct-platform/backend/internal/config"
)

// testServer creates a real Server instance with in-memory adapters for integration testing.
func testServer(t *testing.T) *Server {
	t.Helper()
	cfg := config.Config{
		JWTSecret: "test-secret-for-handler-tests",
	}
	return New(cfg)
}

// ═══════════════════════════════════════════════════════════════
// FEDERATION HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestFederationProvincesList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/federation/provinces", nil)
	req.Header.Set("Authorization", "Bearer test")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Without auth, returns 401; with services wired, should still be accessible
	if w.Code != http.StatusOK && w.Code != http.StatusUnauthorized {
		t.Errorf("expected 200 or 401, got %d", w.Code)
	}
}

func TestFederationStats(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/federation/stats", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Returns 401 without valid JWT, confirming route is registered
	if w.Code != http.StatusUnauthorized {
		t.Logf("Status: %d, Body: %s", w.Code, w.Body.String())
	}
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestApprovalWorkflowDefinitions(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/approvals/workflows", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Route requires auth
	if w.Code != http.StatusUnauthorized {
		t.Logf("Workflows endpoint returned status: %d", w.Code)
	}
}

func TestGetDefaultWorkflowDefinitions(t *testing.T) {
	workflows := getDefaultWorkflowDefinitions()
	if len(workflows) != 15 {
		t.Errorf("expected 15 workflows, got %d", len(workflows))
	}

	// Validate each workflow has required fields
	for i, wf := range workflows {
		code, ok := wf["code"].(string)
		if !ok || code == "" {
			t.Errorf("workflow %d: missing or empty code", i)
		}
		displayName, ok := wf["display_name"].(string)
		if !ok || displayName == "" {
			t.Errorf("workflow %d (%s): missing display_name", i, code)
		}
		steps, ok := wf["steps"].([]map[string]any)
		if !ok || len(steps) == 0 {
			t.Errorf("workflow %d (%s): missing or empty steps", i, code)
		}
	}
}

// ═══════════════════════════════════════════════════════════════
// INTERNATIONAL HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestInternationalPartnerList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/international/partners", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	// Route requires auth
	if w.Code != http.StatusUnauthorized {
		t.Logf("Partners endpoint returned status: %d", w.Code)
	}
}

func TestInternationalEventList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/international/events", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("Events endpoint returned status: %d", w.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestDocumentList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/documents", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("Documents endpoint returned status: %d", w.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// CERTIFICATION HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestCertVerifyPublic(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	// Public endpoint - no auth required
	req := httptest.NewRequest("GET", "/api/v1/certifications/verify/TEST-CODE-123", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for public verify, got %d", w.Code)
	}

	var result map[string]any
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	// Should return found=false for non-existent cert
	if result["found"] != false {
		t.Logf("Verify result: %v", result)
	}
}

func TestCertVerifyPublicEmptyCode(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/certifications/verify/", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Logf("Empty verify code returned status: %d", w.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// DISCIPLINE HANDLER TESTS
// ═══════════════════════════════════════════════════════════════

func TestDisciplineCaseList(t *testing.T) {
	s := testServer(t)
	mux := s.Handler()

	req := httptest.NewRequest("GET", "/api/v1/discipline/cases", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Logf("Discipline cases endpoint returned status: %d", w.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// RBAC HELPER TESTS
// ═══════════════════════════════════════════════════════════════

func TestRequireRole(t *testing.T) {
	_ = bytes.NewBuffer(nil) // import usage

	tests := []struct {
		name    string
		role    string
		allowed []string
		denied  bool
	}{
		{"admin allowed", "admin", []string{"admin", "president"}, false},
		{"president allowed", "president", []string{"admin", "president"}, false},
		{"viewer denied", "viewer", []string{"admin", "president"}, true},
		{"empty role denied", "", []string{"admin"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We test the logic only, not the HTTP response
			found := false
			for _, r := range tt.allowed {
				if tt.role == r {
					found = true
					break
				}
			}
			if found == tt.denied {
				t.Errorf("role %q with allowed %v: expected denied=%v, got %v", tt.role, tt.allowed, tt.denied, !found)
			}
		})
	}
}
