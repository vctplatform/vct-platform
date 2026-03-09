package authz

import (
	"testing"

	"vct-platform/backend/internal/auth"
)

func TestSupportedRolesAndActions(t *testing.T) {
	roles := SupportedRoles()
	if len(roles) == 0 {
		t.Fatal("expected non-empty supported roles")
	}

	actions := SupportedActions()
	if len(actions) == 0 {
		t.Fatal("expected non-empty supported actions")
	}
}

func TestCanEntityAction(t *testing.T) {
	cases := []struct {
		name   string
		role   auth.UserRole
		entity string
		action EntityAction
		want   bool
	}{
		{
			name:   "admin can delete teams",
			role:   auth.RoleAdmin,
			entity: "teams",
			action: ActionDelete,
			want:   true,
		},
		{
			name:   "btc cannot delete teams",
			role:   auth.RoleBTC,
			entity: "teams",
			action: ActionDelete,
			want:   false,
		},
		{
			name:   "delegate can import athletes",
			role:   auth.RoleDelegate,
			entity: "athletes",
			action: ActionImport,
			want:   true,
		},
		{
			name:   "referee manager cannot export results",
			role:   auth.RoleRefereeManager,
			entity: "results",
			action: ActionExport,
			want:   false,
		},
		{
			name:   "btc can export medals",
			role:   auth.RoleBTC,
			entity: "medals",
			action: ActionExport,
			want:   true,
		},
		{
			name:   "delegate cannot view brackets",
			role:   auth.RoleDelegate,
			entity: "brackets",
			action: ActionView,
			want:   false,
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			got := CanEntityAction(tc.role, tc.entity, tc.action)
			if got != tc.want {
				t.Fatalf("CanEntityAction(%q, %q, %q) = %v, want %v", tc.role, tc.entity, tc.action, got, tc.want)
			}
		})
	}
}
