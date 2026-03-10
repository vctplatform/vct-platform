package auth

import (
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — MULTI-ROLE TESTS
// Tests for RoleBindingStore and ResolveRBACMultiRole
// ═══════════════════════════════════════════════════════════════

func TestRoleBindingStore_BindAndGet(t *testing.T) {
	store := NewRoleBindingStore()

	store.BindRole(RoleBinding{
		UserID:    "user-001-abc-def",
		Role:      RoleCoach,
		ScopeType: "club",
		ScopeID:   "CLB-001",
		ScopeName: "CLB Bình Dương",
	})
	store.BindRole(RoleBinding{
		UserID:    "user-001-abc-def",
		Role:      RoleReferee,
		ScopeType: "tournament",
		ScopeID:   "T-2026-01",
		ScopeName: "Giải VCT 2026",
	})

	bindings := store.GetBindings("user-001-abc-def")
	if len(bindings) != 2 {
		t.Fatalf("expected 2 bindings, got %d", len(bindings))
	}
	if bindings[0].Role != RoleCoach {
		t.Errorf("binding 0: expected coach, got %s", bindings[0].Role)
	}
	if bindings[1].Role != RoleReferee {
		t.Errorf("binding 1: expected referee, got %s", bindings[1].Role)
	}
}

func TestRoleBindingStore_UnbindRole(t *testing.T) {
	store := NewRoleBindingStore()

	store.BindRole(RoleBinding{
		ID:        "rb-test-unbind",
		UserID:    "user-002-abc-def",
		Role:      RoleAthlete,
		ScopeType: "self",
		ScopeID:   "SELF",
		ScopeName: "Cá nhân",
	})

	// Unbind
	ok := store.UnbindRole("user-002-abc-def", "rb-test-unbind")
	if !ok {
		t.Fatal("UnbindRole returned false")
	}

	// Verify empty
	bindings := store.GetBindings("user-002-abc-def")
	if len(bindings) != 0 {
		t.Errorf("expected 0 bindings after unbind, got %d", len(bindings))
	}
}

func TestRoleBindingStore_EnsureDefaultBinding(t *testing.T) {
	store := NewRoleBindingStore()

	user := AuthUser{
		ID:       "user-003-abc-def",
		Username: "test-coach",
		Role:     RoleCoach,
	}

	store.EnsureDefaultBinding(user)
	bindings := store.GetBindings(user.ID)
	if len(bindings) != 1 {
		t.Fatalf("expected 1 default binding, got %d", len(bindings))
	}
	if bindings[0].Role != RoleCoach {
		t.Errorf("expected coach, got %s", bindings[0].Role)
	}

	// Calling again should NOT add a duplicate
	store.EnsureDefaultBinding(user)
	bindings = store.GetBindings(user.ID)
	if len(bindings) != 1 {
		t.Errorf("expected still 1 binding after double ensure, got %d", len(bindings))
	}
}

func TestResolveRBACMultiRole_MergesPermissions(t *testing.T) {
	bindings := []RoleBinding{
		{Role: RoleCoach, ScopeType: "club", ScopeID: "CLB-001", ScopeName: "CLB BD", GrantedAt: "2026-01-01T00:00:00Z"},
		{Role: RoleReferee, ScopeType: "tournament", ScopeID: "T-001", ScopeName: "Giải 2026", GrantedAt: "2026-01-01T00:00:00Z"},
	}

	roles, perms, workspaces := ResolveRBACMultiRole(bindings)

	// Should have 2 role assignments + spectator
	if len(roles) != 2 {
		t.Errorf("expected 2 roles, got %d", len(roles))
	}

	// Permissions should be union of coach + referee
	permSet := make(map[string]bool)
	for _, p := range perms {
		permSet[p] = true
	}
	// Coach has training.*, referee has scoring.record
	if !permSet["training.*"] {
		t.Error("expected training.* from coach role")
	}
	if !permSet["scoring.record"] {
		t.Error("expected scoring.record from referee role")
	}

	// Workspaces: 2 from bindings + 1 spectator
	if len(workspaces) != 3 {
		t.Errorf("expected 3 workspaces, got %d", len(workspaces))
	}
}

func TestResolveRBACMultiRole_AdminWildcard(t *testing.T) {
	bindings := []RoleBinding{
		{Role: RoleAdmin, ScopeType: "system", ScopeID: "SYS", ScopeName: "Hệ thống", GrantedAt: "2026-01-01T00:00:00Z"},
		{Role: RoleCoach, ScopeType: "club", ScopeID: "CLB-001", ScopeName: "CLB BD", GrantedAt: "2026-01-01T00:00:00Z"},
	}

	_, perms, _ := ResolveRBACMultiRole(bindings)

	// Admin wildcard supersedes all
	if len(perms) != 1 || perms[0] != "*" {
		t.Errorf("expected [\"*\"], got %v", perms)
	}
}

func TestGetBinding_ByID(t *testing.T) {
	store := NewRoleBindingStore()

	store.BindRole(RoleBinding{
		ID:        "rb-specific",
		UserID:    "user-004-abc-def",
		Role:      RoleDelegate,
		ScopeType: "tournament",
		ScopeID:   "T-002",
		ScopeName: "Giải test",
	})

	b, ok := store.GetBinding("user-004-abc-def", "rb-specific")
	if !ok {
		t.Fatal("GetBinding returned false")
	}
	if b.Role != RoleDelegate {
		t.Errorf("expected delegate, got %s", b.Role)
	}

	// Non-existent
	_, ok = store.GetBinding("user-004-abc-def", "rb-not-exist")
	if ok {
		t.Fatal("expected false for non-existent binding")
	}
}
