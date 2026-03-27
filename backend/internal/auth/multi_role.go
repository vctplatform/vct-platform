package auth

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — MULTI-ROLE CONTEXT SYSTEM
// Supports users with multiple roles across different organizations,
// tournaments, and clubs — with real-time context switching.
//
// Architecture:
//   User (UUID) → N RoleBindings → each: Role + Scope (org/tournament/club)
//   At any time, user has ONE "active context" = current role + scope.
//   SwitchContext() re-issues JWT with new active role.
// ═══════════════════════════════════════════════════════════════

// ── Role Binding Model ───────────────────────────────────────

// RoleBinding represents a user-role-scope assignment.
// Example: User X is "coach" scoped to Club "CLB-001", AND "referee" scoped to Tournament "T-2026-01".
type RoleBinding struct {
	ID        string   `json:"id"`
	UserID    string   `json:"user_id"`
	Role      UserRole `json:"role"`
	ScopeType string   `json:"scope_type"` // "system","federation","tournament","club","self"
	ScopeID   string   `json:"scope_id"`   // e.g. "T-2026-01", "CLB-001"
	ScopeName string   `json:"scope_name"` // e.g. "Giải VCT 2026", "CLB Bình Dương"
	GrantedBy string   `json:"granted_by"` // admin who granted
	GrantedAt string   `json:"granted_at"`
	ExpiresAt string   `json:"expires_at,omitempty"` // optional expiry for temp roles
	IsActive  bool     `json:"is_active"`
}

// ActiveContext represents the user's currently-active role and scope.
type ActiveContext struct {
	RoleBindingID string   `json:"role_binding_id"`
	Role          UserRole `json:"role"`
	ScopeType     string   `json:"scope_type"`
	ScopeID       string   `json:"scope_id"`
	ScopeName     string   `json:"scope_name"`
}

// SwitchContextRequest is the input for context switching.
type SwitchContextRequest struct {
	RoleBindingID string `json:"role_binding_id"` // which binding to activate
}

// SwitchContextResult is the output of a successful context switch.
type SwitchContextResult struct {
	TokenResponse
	ActiveContext ActiveContext     `json:"activeContext"`
	User          AuthUser          `json:"user"`
	Roles         []RoleAssignment  `json:"roles"`
	Permissions   []string          `json:"permissions"`
	Workspaces    []WorkspaceAccess `json:"workspaces"`
}

// ── Multi-Role Store ─────────────────────────────────────────

// RoleBindingStore is the in-memory store for role bindings.
// TODO: Replace with database-backed store (core.user_role_bindings).
type RoleBindingStore struct {
	mu       sync.RWMutex
	bindings map[string][]RoleBinding // userID → bindings
}

// NewRoleBindingStore creates a new in-memory role binding store.
func NewRoleBindingStore() *RoleBindingStore {
	return &RoleBindingStore{
		bindings: make(map[string][]RoleBinding),
	}
}

// BindRole adds a role binding for a user.
func (s *RoleBindingStore) BindRole(binding RoleBinding) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if binding.GrantedAt == "" {
		binding.GrantedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if binding.ID == "" {
		binding.ID = fmt.Sprintf("rb-%s-%s-%s", shortID(binding.UserID), binding.Role, binding.ScopeID)
	}
	binding.IsActive = true

	s.bindings[binding.UserID] = append(s.bindings[binding.UserID], binding)
}

// UnbindRole deactivates a role binding.
func (s *RoleBindingStore) UnbindRole(userID, bindingID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	bindings := s.bindings[userID]
	for i, b := range bindings {
		if b.ID == bindingID {
			bindings[i].IsActive = false
			return true
		}
	}
	return false
}

// GetBindings returns all active role bindings for a user.
func (s *RoleBindingStore) GetBindings(userID string) []RoleBinding {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var active []RoleBinding
	now := time.Now().UTC()
	for _, b := range s.bindings[userID] {
		if !b.IsActive {
			continue
		}
		// Check expiry
		if b.ExpiresAt != "" {
			exp, err := time.Parse(time.RFC3339, b.ExpiresAt)
			if err == nil && now.After(exp) {
				continue
			}
		}
		active = append(active, b)
	}
	return active
}

// GetBinding returns a specific binding by ID.
func (s *RoleBindingStore) GetBinding(userID, bindingID string) (RoleBinding, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, b := range s.bindings[userID] {
		if b.ID == bindingID && b.IsActive {
			return b, true
		}
	}
	return RoleBinding{}, false
}

// EnsureDefaultBinding ensures a user has at least one binding matching their primary role.
// Admin users get all 4 workspace scopes (system, federation, tournament, club).
func (s *RoleBindingStore) EnsureDefaultBinding(user AuthUser) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// If user already has bindings, skip
	if len(s.bindings[user.ID]) > 0 {
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Admin and Owner get bindings for all scopes they manage
	if user.Role == RoleAdmin || user.Role == RoleOwner {
		s.bindings[user.ID] = []RoleBinding{
			{ID: fmt.Sprintf("rb-%s-sys", shortID(user.ID)), UserID: user.ID, Role: RoleAdmin, ScopeType: "system", ScopeID: "SYS", ScopeName: "Quản trị hệ thống", GrantedBy: "system", GrantedAt: now, IsActive: true},
			{ID: fmt.Sprintf("rb-%s-fed", shortID(user.ID)), UserID: user.ID, Role: RoleAdmin, ScopeType: "federation", ScopeID: "FED", ScopeName: "Liên đoàn VCT", GrantedBy: "system", GrantedAt: now, IsActive: true},
			{ID: fmt.Sprintf("rb-%s-tourn", shortID(user.ID)), UserID: user.ID, Role: RoleAdmin, ScopeType: "tournament", ScopeID: "TOURN", ScopeName: "Giải đấu", GrantedBy: "system", GrantedAt: now, IsActive: true},
			{ID: fmt.Sprintf("rb-%s-club", shortID(user.ID)), UserID: user.ID, Role: RoleAdmin, ScopeType: "club", ScopeID: "CLUB", ScopeName: "CLB", GrantedBy: "system", GrantedAt: now, IsActive: true},
		}
		return
	}

	// Create default binding from primary role
	scope := roleScopeType(user.Role)
	s.bindings[user.ID] = []RoleBinding{
		{
			ID:        fmt.Sprintf("rb-%s-default", shortID(user.ID)),
			UserID:    user.ID,
			Role:      user.Role,
			ScopeType: strings.ToLower(scope),
			ScopeID:   scopeIDForDefault(scope),
			ScopeName: scopeNameForDefault(scope),
			GrantedBy: "system",
			GrantedAt: now,
			IsActive:  true,
		},
	}
}

// ── Enhanced RBAC Resolver (Multi-role) ──────────────────────

// ResolveRBACMultiRole builds the full RBAC picture from all active bindings.
func ResolveRBACMultiRole(bindings []RoleBinding) ([]RoleAssignment, []string, []WorkspaceAccess) {
	var roles []RoleAssignment
	permSet := make(map[string]bool)
	var workspaces []WorkspaceAccess

	for _, b := range bindings {
		// Role assignment
		roles = append(roles, RoleAssignment{
			RoleID:    b.ID,
			RoleName:  roleDisplayName(b.Role),
			RoleCode:  string(b.Role),
			ScopeType: b.ScopeType,
			ScopeID:   b.ScopeID,
			ScopeName: b.ScopeName,
			GrantedAt: b.GrantedAt,
		})

		// Merge permissions (union of all bound roles)
		for _, p := range resolvePermissionsForRole(b.Role) {
			permSet[p] = true
		}

		// Workspace from binding
		ws := bindingToWorkspace(b)
		workspaces = append(workspaces, ws)
	}

	// Deduplicate permissions
	var perms []string
	// Wildcard supersedes
	if permSet["*"] {
		perms = []string{"*"}
	} else {
		for p := range permSet {
			perms = append(perms, p)
		}
		sort.Strings(perms)
	}

	// Everyone gets spectator
	workspaces = append(workspaces, WorkspaceAccess{
		Type: "public_spectator", ScopeID: "PUBLIC", ScopeName: "Xem trực tiếp", Role: "viewer",
	})

	return roles, perms, workspaces
}

// ── Context Switch on Service ────────────────────────────────

// SwitchContext re-issues a new JWT with a different active role from the user's bindings.
func (svc *Service) SwitchContext(principal Principal, req SwitchContextRequest, requestCtx RequestContext) (SwitchContextResult, error) {
	if req.RoleBindingID == "" {
		return SwitchContextResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "role_binding_id là bắt buộc")
	}

	// Look up the binding
	if svc.roleBindings == nil {
		return SwitchContextResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "multi-role chưa được kích hoạt")
	}

	binding, ok := svc.roleBindings.GetBinding(principal.User.ID, req.RoleBindingID)
	if !ok {
		return SwitchContextResult{}, wrapCodedError(ErrForbidden, CodeForbidden, "role binding không hợp lệ hoặc đã hết hạn")
	}

	// Create new user with switched role
	switchedUser := principal.User
	switchedUser.Role = binding.Role
	switchedUser.TenantID = binding.ScopeID

	now := time.Now().UTC()
	svc.mu.Lock()
	defer svc.mu.Unlock()

	// Re-issue tokens with new role
	sessionID := principal.SessionID
	if sessionID == "" {
		sessionID = randomID(16)
	}
	refreshJTI := randomID(20)
	tokenResp, err := svc.issueTokenPairLocked(switchedUser, principal.TournamentCode, principal.OperationShift, sessionID, refreshJTI, now)
	if err != nil {
		return SwitchContextResult{}, err
	}

	// Update session
	sess := &refreshSession{
		ID:                sessionID,
		User:              switchedUser,
		TournamentCode:    principal.TournamentCode,
		OperationShift:    principal.OperationShift,
		CurrentRefreshJTI: refreshJTI,
		CreatedAt:         now,
		ExpiresAt:         tokenResp.RefreshExpiresAt,
		LastSeenAt:        now,
		LastSeenIP:        requestCtx.IP,
		LastSeenUA:        requestCtx.UserAgent,
	}
	svc.saveSession(context.Background(), sess)

	svc.addAuditLocked("auth.switch_context", true, requestCtx, switchedUser, map[string]any{
		"from_role":       string(principal.User.Role),
		"to_role":         string(binding.Role),
		"role_binding_id": binding.ID,
		"scope_id":        binding.ScopeID,
	})

	// Resolve RBAC for all bindings (full picture)
	roles, perms, ws := svc.resolveRBACSnapshot(switchedUser)

	return SwitchContextResult{
		TokenResponse: tokenResp,
		ActiveContext: ActiveContext{
			RoleBindingID: binding.ID,
			Role:          binding.Role,
			ScopeType:     binding.ScopeType,
			ScopeID:       binding.ScopeID,
			ScopeName:     binding.ScopeName,
		},
		User:        switchedUser,
		Roles:       roles,
		Permissions: perms,
		Workspaces:  ws,
	}, nil
}

// ListMyRoles returns all active role bindings for the authenticated user.
func (svc *Service) ListMyRoles(principal Principal) []RoleBinding {
	if svc.roleBindings == nil {
		return nil
	}
	return svc.roleBindings.GetBindings(principal.User.ID)
}

// ── Helpers ──────────────────────────────────────────────────

func bindingToWorkspace(b RoleBinding) WorkspaceAccess {
	wsType := "custom"
	switch strings.ToLower(b.ScopeType) {
	case "system":
		wsType = "system_admin"
	case "federation":
		wsType = "federation_admin"
	case "province":
		wsType = "federation_provincial"
	case "tournament":
		wsType = "tournament_ops"
	case "club":
		wsType = "club_management"
	case "self":
		wsType = "athlete_portal"
	}
	return WorkspaceAccess{
		Type:      wsType,
		ScopeID:   b.ScopeID,
		ScopeName: b.ScopeName,
		Role:      string(b.Role),
	}
}

func scopeIDForDefault(scopeType string) string {
	switch scopeType {
	case "SYSTEM":
		return "SYS"
	case "FEDERATION":
		return "FED"
	case "PROVINCE":
		return "PROV"
	case "TOURNAMENT":
		return "TOURN"
	case "CLUB":
		return "CLUB"
	default:
		return "SELF"
	}
}

func scopeNameForDefault(scopeType string) string {
	switch scopeType {
	case "SYSTEM":
		return "Hệ thống"
	case "FEDERATION":
		return "Liên đoàn"
	case "PROVINCE":
		return "Liên đoàn tỉnh"
	case "TOURNAMENT":
		return "Giải đấu"
	case "CLUB":
		return "Câu lạc bộ"
	default:
		return "Cá nhân"
	}
}

func shortID(id string) string {
	if len(id) <= 8 {
		return id
	}
	return id[:8]
}
