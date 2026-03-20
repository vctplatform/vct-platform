package rbac

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// Existing Tests (preserved and enhanced)
// ═══════════════════════════════════════════════════════════════

func TestDefaultRoles(t *testing.T) {
	e := NewEnforcer()

	tests := []struct {
		role string
		perm Permission
		want bool
	}{
		// Viewer
		{"viewer", PermAthleteRead, true},
		{"viewer", PermMatchRead, true},
		{"viewer", PermAthleteWrite, false},
		{"viewer", PermSystemAdmin, false},
		// Scorer inherits viewer
		{"scorer", PermAthleteRead, true},
		{"scorer", PermMatchScore, true},
		{"scorer", PermMatchWrite, false},
		// Editor inherits viewer
		{"editor", PermAthleteRead, true},
		{"editor", PermAthleteWrite, true},
		{"editor", PermMatchWrite, true},
		{"editor", PermMatchScore, false},
		{"editor", PermSystemAdmin, false},
		// Admin inherits editor + scorer
		{"admin", PermAthleteRead, true},
		{"admin", PermAthleteWrite, true},
		{"admin", PermMatchScore, true},
		{"admin", PermAthleteDelete, true},
		{"admin", PermUserManage, true},
		{"admin", PermSystemAdmin, true},
		// Unknown role
		{"unknown", PermAthleteRead, false},
	}

	for _, tt := range tests {
		got := e.HasPermission(tt.role, tt.perm)
		if got != tt.want {
			t.Errorf("HasPermission(%q, %q) = %v, want %v", tt.role, tt.perm, got, tt.want)
		}
	}
}

func TestWildcardPermission(t *testing.T) {
	e := NewEnforcer()
	e.AddRole(&Role{
		Name:        "super_editor",
		Permissions: []Permission{"athletes:*"},
	})

	if !e.HasPermission("super_editor", PermAthleteRead) {
		t.Error("wildcard should match athletes:read")
	}
	if !e.HasPermission("super_editor", PermAthleteWrite) {
		t.Error("wildcard should match athletes:write")
	}
	if e.HasPermission("super_editor", PermMatchRead) {
		t.Error("wildcard should NOT match matches:read")
	}
}

func TestAddRole_DefensiveCopyAndNormalization(t *testing.T) {
	e := NewEnforcer()
	source := &Role{
		Name:        "  SUPER_EDITOR  ",
		Description: "  Can edit athletes  ",
		Parents:     []string{" VIEWER ", "viewer", "super_editor"},
		Permissions: []Permission{" ATHLETES:* ", "athletes:*", " matches:read "},
	}

	e.AddRole(source)

	source.Name = "mutated"
	source.Parents[0] = "admin"
	source.Permissions[0] = "system:admin"

	if !e.HasPermission("super_editor", PermAthleteWrite) {
		t.Fatal("sanitized role should keep wildcard athlete permission")
	}
	if !e.HasPermission("super_editor", PermMatchRead) {
		t.Fatal("sanitized role should keep normalized direct permission")
	}

	stored, ok := e.GetRole("SUPER_EDITOR")
	if !ok {
		t.Fatal("expected normalized role lookup to succeed")
	}
	if stored.Name != "super_editor" {
		t.Fatalf("expected normalized role name, got %q", stored.Name)
	}
	if len(stored.Parents) != 1 || stored.Parents[0] != "viewer" {
		t.Fatalf("expected deduped parents, got %#v", stored.Parents)
	}
	if stored.Description != "Can edit athletes" {
		t.Fatalf("expected trimmed description, got %q", stored.Description)
	}

	stored.Permissions[0] = "system:admin"
	again, ok := e.GetRole("super_editor")
	if !ok {
		t.Fatal("expected second role lookup to succeed")
	}
	for _, perm := range again.Permissions {
		if perm == "system:admin" {
			t.Fatal("GetRole should return a defensive copy")
		}
	}
}

func TestCycleProtection(t *testing.T) {
	e := NewEnforcer()
	e.AddRole(&Role{Name: "a", Parents: []string{"b"}, Permissions: []Permission{"x:read"}})
	e.AddRole(&Role{Name: "b", Parents: []string{"a"}})

	// Should not infinite loop
	got := e.HasPermission("a", "x:read")
	if !got {
		t.Error("should find x:read despite cycle")
	}
	got2 := e.HasPermission("b", "x:read")
	if !got2 {
		t.Error("b inherits from a, should find x:read")
	}
}

func TestAllPermissions(t *testing.T) {
	e := NewEnforcer()
	perms := e.AllPermissions("admin")
	if len(perms) == 0 {
		t.Fatal("admin should have many permissions")
	}

	// Admin should have everything
	permSet := make(map[Permission]bool, len(perms))
	for _, p := range perms {
		permSet[p] = true
	}

	for _, expected := range []Permission{PermAthleteRead, PermMatchScore, PermSystemAdmin} {
		if !permSet[expected] {
			t.Errorf("admin missing %s", expected)
		}
	}
}

func TestContextHelpers(t *testing.T) {
	ctx := context.Background()
	ctx = ContextWithRole(ctx, "admin")
	ctx = ContextWithUserID(ctx, "user-123")

	if RoleFromContext(ctx) != "admin" {
		t.Error("expected admin role")
	}
	if UserIDFromContext(ctx) != "user-123" {
		t.Error("expected user-123")
	}

	multiCtx := ContextWithRoles(context.Background(), " viewer ", "EDITOR", "viewer")
	roles := RolesFromContext(multiCtx)
	if len(roles) != 2 {
		t.Fatalf("expected 2 normalized roles, got %d", len(roles))
	}
	if roles[0] != "viewer" || roles[1] != "editor" {
		t.Fatalf("unexpected role set: %#v", roles)
	}
	if RoleFromContext(multiCtx) != "viewer" {
		t.Fatalf("expected first normalized role, got %q", RoleFromContext(multiCtx))
	}

	// Empty context
	if RoleFromContext(context.Background()) != "" {
		t.Error("expected empty role from bare context")
	}
	if len(RolesFromContext(context.Background())) != 0 {
		t.Error("expected no roles from bare context")
	}
}

func TestRequirePermission_Allowed(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermAthleteRead)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "viewer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestRequirePermission_Forbidden(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermSystemAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/admin", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "viewer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
}

func TestRequirePermission_NoRole(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermAthleteRead)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAnyPermission(t *testing.T) {
	e := NewEnforcer()
	handler := RequireAnyPermission(e, PermMatchScore, PermMatchWrite)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	// Scorer has MatchScore
	req := httptest.NewRequest("POST", "/matches/1/score", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "scorer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Errorf("scorer should pass RequireAny, got %d", rec.Code)
	}

	// Viewer has neither
	req2 := httptest.NewRequest("POST", "/matches/1/score", nil)
	req2 = req2.WithContext(ContextWithRole(req2.Context(), "viewer"))
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusForbidden {
		t.Errorf("viewer should be forbidden, got %d", rec2.Code)
	}
}

func TestRequirePermission_MultiRoleContext(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermMatchScore)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("POST", "/matches/1/score", nil)
	req = req.WithContext(ContextWithRoles(req.Context(), "viewer", "scorer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected multi-role context to authorize, got %d", rec.Code)
	}
}

func TestRequireRole(t *testing.T) {
	handler := RequireRole("admin", "editor")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	// Admin passes
	req := httptest.NewRequest("GET", "/", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "admin"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Errorf("admin should pass, got %d", rec.Code)
	}

	// Viewer blocked
	req2 := httptest.NewRequest("GET", "/", nil)
	req2 = req2.WithContext(ContextWithRole(req2.Context(), "viewer"))
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusForbidden {
		t.Errorf("viewer should be blocked, got %d", rec2.Code)
	}
}

func TestRequireRole_NoRole(t *testing.T) {
	handler := RequireRole("admin")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing role, got %d", rec.Code)
	}
	if contentType := rec.Header().Get("Content-Type"); !strings.Contains(contentType, "application/json") {
		t.Fatalf("expected json content type, got %q", contentType)
	}
}

func TestAllPermissions_SortedAndDeduped(t *testing.T) {
	e := NewEnforcer()
	e.AddRole(&Role{
		Name:        "combo",
		Permissions: []Permission{"matches:write", "athletes:read", "matches:write"},
		Parents:     []string{"viewer"},
	})

	perms := e.AllPermissions("combo")
	if len(perms) < 3 {
		t.Fatalf("expected inherited and direct permissions, got %#v", perms)
	}
	for i := 1; i < len(perms); i++ {
		if perms[i-1] > perms[i] {
			t.Fatalf("permissions should be sorted, got %#v", perms)
		}
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — RequireAllPermissions
// ═══════════════════════════════════════════════════════════════

func TestRequireAllPermissions_AdminPasses(t *testing.T) {
	e := NewEnforcer()
	handler := RequireAllPermissions(e, PermAthleteWrite, PermMatchWrite)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("POST", "/bulk", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "admin"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("admin should have ALL perms, got %d", rec.Code)
	}
}

func TestRequireAllPermissions_ScorerFails(t *testing.T) {
	e := NewEnforcer()
	// Scorer has MatchScore but NOT AthleteWrite
	handler := RequireAllPermissions(e, PermMatchScore, PermAthleteWrite)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("POST", "/bulk", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "scorer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("scorer missing AthleteWrite, expected 403, got %d", rec.Code)
	}
}

func TestRequireAllPermissions_NoRole(t *testing.T) {
	e := NewEnforcer()
	handler := RequireAllPermissions(e, PermAthleteRead)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 with no role, got %d", rec.Code)
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — Structured JSON Error Responses
// ═══════════════════════════════════════════════════════════════

func TestStructuredErrorResponse_Forbidden(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermSystemAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/admin", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "viewer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	// Check Content-Type
	ct := rec.Header().Get("Content-Type")
	if !strings.Contains(ct, "application/json") {
		t.Errorf("expected JSON content-type, got %q", ct)
	}

	// Check debug header
	deniedPerm := rec.Header().Get("X-VCT-Denied-Permission")
	if deniedPerm != string(PermSystemAdmin) {
		t.Errorf("expected X-VCT-Denied-Permission=%q, got %q", PermSystemAdmin, deniedPerm)
	}

	// Decode body
	var errBody authzError
	if err := json.NewDecoder(rec.Body).Decode(&errBody); err != nil {
		t.Fatalf("failed to decode error body: %v", err)
	}
	if errBody.Error != "forbidden" {
		t.Errorf("expected error=forbidden, got %q", errBody.Error)
	}
	if errBody.Permission != string(PermSystemAdmin) {
		t.Errorf("expected permission=%q, got %q", PermSystemAdmin, errBody.Permission)
	}
}

func TestStructuredErrorResponse_Unauthorized(t *testing.T) {
	e := NewEnforcer()
	handler := RequirePermission(e, PermAthleteRead)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	var errBody authzError
	if err := json.NewDecoder(rec.Body).Decode(&errBody); err != nil {
		t.Fatalf("failed to decode error body: %v", err)
	}
	if errBody.Error != "unauthorized" {
		t.Errorf("expected error=unauthorized, got %q", errBody.Error)
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — Audit / DeniedHandler Integration
// ═══════════════════════════════════════════════════════════════

// mockDeniedHandler records denied decisions for testing.
type mockDeniedHandler struct {
	mu        sync.Mutex
	decisions []AuthzDecision
}

func (m *mockDeniedHandler) OnDenied(_ context.Context, d AuthzDecision) {
	m.mu.Lock()
	m.decisions = append(m.decisions, d)
	m.mu.Unlock()
}

func TestAuditOnDenied(t *testing.T) {
	mock := &mockDeniedHandler{}
	e := NewEnforcer().WithDeniedHandler(mock)

	handler := RequirePermission(e, PermSystemAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("DELETE", "/admin/reset", nil)
	ctx := ContextWithRole(req.Context(), "viewer")
	ctx = ContextWithUserID(ctx, "user-456")
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}

	mock.mu.Lock()
	defer mock.mu.Unlock()
	if len(mock.decisions) != 1 {
		t.Fatalf("expected 1 denied decision, got %d", len(mock.decisions))
	}

	d := mock.decisions[0]
	if d.Role != "viewer" {
		t.Errorf("denied decision role = %q, want viewer", d.Role)
	}
	if d.Permission != PermSystemAdmin {
		t.Errorf("denied decision perm = %q, want %q", d.Permission, PermSystemAdmin)
	}
	if d.UserID != "user-456" {
		t.Errorf("denied decision userID = %q, want user-456", d.UserID)
	}
	if d.Allowed {
		t.Error("denied decision should have Allowed=false")
	}
}

func TestAuditNotCalledOnSuccess(t *testing.T) {
	mock := &mockDeniedHandler{}
	e := NewEnforcer().WithDeniedHandler(mock)

	handler := RequirePermission(e, PermAthleteRead)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/athletes", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "viewer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	mock.mu.Lock()
	defer mock.mu.Unlock()
	if len(mock.decisions) != 0 {
		t.Errorf("denied handler should NOT be called on success, got %d calls", len(mock.decisions))
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — Resource-Scoped Permission
// ═══════════════════════════════════════════════════════════════

type mockScopeChecker struct {
	ownerMap map[string]string // resourceID -> ownerUserID
}

func (m *mockScopeChecker) IsOwner(_ context.Context, actorID, resourceID string) (bool, error) {
	return m.ownerMap[resourceID] == actorID, nil
}

func TestScopedPermission_OwnerAllowed(t *testing.T) {
	e := NewEnforcer()
	checker := &mockScopeChecker{ownerMap: map[string]string{"ATH-001": "user-10"}}

	ctx := ContextWithUserID(context.Background(), "user-10")
	got := e.HasScopedPermission(ctx, "editor", PermAthleteWrite, "ATH-001", checker)
	if !got {
		t.Error("owner editor should be allowed to write own athlete")
	}
}

func TestScopedPermission_NonOwnerDenied(t *testing.T) {
	e := NewEnforcer()
	checker := &mockScopeChecker{ownerMap: map[string]string{"ATH-001": "user-10"}}

	ctx := ContextWithUserID(context.Background(), "user-99")
	got := e.HasScopedPermission(ctx, "editor", PermAthleteWrite, "ATH-001", checker)
	if got {
		t.Error("non-owner editor should NOT be allowed to write another's athlete")
	}
}

func TestScopedPermission_AdminBypassesOwnership(t *testing.T) {
	e := NewEnforcer()
	checker := &mockScopeChecker{ownerMap: map[string]string{"ATH-001": "user-10"}}

	ctx := ContextWithUserID(context.Background(), "admin-user")
	got := e.HasScopedPermission(ctx, "admin", PermAthleteWrite, "ATH-001", checker)
	if !got {
		t.Error("admin should bypass ownership check")
	}
}

func TestScopedPermission_NoPermAtAll(t *testing.T) {
	e := NewEnforcer()
	checker := &mockScopeChecker{ownerMap: map[string]string{"ATH-001": "user-10"}}

	ctx := ContextWithUserID(context.Background(), "user-10")
	got := e.HasScopedPermission(ctx, "viewer", PermAthleteWrite, "ATH-001", checker)
	if got {
		t.Error("viewer lacks AthleteWrite, even if they are the owner")
	}
}

func TestScopedPermission_NilChecker(t *testing.T) {
	e := NewEnforcer()

	ctx := ContextWithUserID(context.Background(), "user-10")
	got := e.HasScopedPermission(ctx, "editor", PermAthleteWrite, "ATH-001", nil)
	if !got {
		t.Error("nil checker should fall back to role-only permission (editor has AthleteWrite)")
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — ListRoles
// ═══════════════════════════════════════════════════════════════

func TestListRoles(t *testing.T) {
	e := NewEnforcer()
	roles := e.ListRoles()

	if len(roles) < 4 {
		t.Fatalf("expected at least 4 built-in roles, got %d", len(roles))
	}

	// Should be sorted
	for i := 1; i < len(roles); i++ {
		if roles[i].Name < roles[i-1].Name {
			t.Errorf("roles not sorted: %q came after %q", roles[i].Name, roles[i-1].Name)
		}
	}

	// Find admin
	var admin *RoleInfo
	for i := range roles {
		if roles[i].Name == "admin" {
			admin = &roles[i]
			break
		}
	}
	if admin == nil {
		t.Fatal("admin role not found in ListRoles")
	}
	if !admin.IsBuiltIn {
		t.Error("admin should be marked as built-in")
	}
	if len(admin.InheritedPerms) == 0 {
		t.Error("admin should have inherited permissions from editor+scorer")
	}
}

func TestListRoles_CustomRoleNotBuiltIn(t *testing.T) {
	e := NewEnforcer()
	e.AddRole(&Role{Name: "custom_role", Permissions: []Permission{"custom:read"}})

	roles := e.ListRoles()
	var custom *RoleInfo
	for i := range roles {
		if roles[i].Name == "custom_role" {
			custom = &roles[i]
			break
		}
	}
	if custom == nil {
		t.Fatal("custom_role not found")
	}
	if custom.IsBuiltIn {
		t.Error("custom_role should NOT be marked as built-in")
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — slog Integration
// ═══════════════════════════════════════════════════════════════

func TestLoggerIntegration(t *testing.T) {
	// Just verify it doesn't panic with a real logger
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	e := NewEnforcer().WithLogger(logger)

	handler := RequirePermission(e, PermSystemAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/admin", nil)
	req = req.WithContext(ContextWithRole(req.Context(), "viewer"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
}
