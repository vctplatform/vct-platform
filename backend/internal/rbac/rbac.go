// Package rbac provides role-based access control with permission checking,
// role hierarchy, resource-scoped authorization, audit-trail integration,
// and HTTP middleware for authorization enforcement.
package rbac

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sort"
	"strings"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// Models
// ═══════════════════════════════════════════════════════════════

// Permission represents a single action on a resource.
// Format: "resource:action" (e.g., "athletes:read", "matches:write")
type Permission string

// Role represents a named set of permissions.
type Role struct {
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	Permissions []Permission `json:"permissions"`
	Parents     []string     `json:"parents,omitempty"` // Inherited roles
	IsBuiltIn   bool         `json:"is_built_in"`       // System-defined vs custom
}

// RoleInfo is the API-friendly representation of a role with resolved permissions.
type RoleInfo struct {
	Name           string       `json:"name"`
	Description    string       `json:"description,omitempty"`
	IsBuiltIn      bool         `json:"is_built_in"`
	DirectPerms    []Permission `json:"direct_permissions"`
	InheritedPerms []Permission `json:"inherited_permissions"`
	Parents        []string     `json:"parents,omitempty"`
}

// AuthzDecision records the outcome of an authorization check.
type AuthzDecision struct {
	Role       string     `json:"role"`
	Permission Permission `json:"permission"`
	Allowed    bool       `json:"allowed"`
	UserID     string     `json:"user_id,omitempty"`
	Resource   string     `json:"resource,omitempty"`
	ResourceID string     `json:"resource_id,omitempty"`
	Path       string     `json:"path,omitempty"`
	Method     string     `json:"method,omitempty"`
}

// ScopeChecker determines if an actor owns a specific resource instance.
// Implementations are domain-specific (e.g., "does user X own athlete Y?").
type ScopeChecker interface {
	IsOwner(ctx context.Context, actorID, resourceID string) (bool, error)
}

// DeniedHandler is called when an authorization check fails.
// Implement this to integrate with audit logging or alerting.
type DeniedHandler interface {
	OnDenied(ctx context.Context, decision AuthzDecision)
}

// ═══════════════════════════════════════════════════════════════
// Built-in permissions for VCT Platform
// ═══════════════════════════════════════════════════════════════

var (
	PermAthleteRead   Permission = "athletes:read"
	PermAthleteWrite  Permission = "athletes:write"
	PermAthleteDelete Permission = "athletes:delete"
	PermMatchRead     Permission = "matches:read"
	PermMatchWrite    Permission = "matches:write"
	PermMatchScore    Permission = "matches:score"
	PermClubRead      Permission = "clubs:read"
	PermClubWrite     Permission = "clubs:write"
	PermEventRead     Permission = "events:read"
	PermEventWrite    Permission = "events:write"
	PermUserManage    Permission = "users:manage"
	PermSystemAdmin   Permission = "system:admin"
)

// ═══════════════════════════════════════════════════════════════
// Enforcer — Central authorization engine
// ═══════════════════════════════════════════════════════════════

// Enforcer evaluates RBAC policies.
type Enforcer struct {
	roles         map[string]*Role
	mu            sync.RWMutex
	logger        *slog.Logger
	deniedHandler DeniedHandler
}

// NewEnforcer creates an RBAC enforcer with predefined roles.
func NewEnforcer() *Enforcer {
	e := &Enforcer{
		roles:  make(map[string]*Role),
		logger: slog.Default(),
	}
	e.loadDefaults()
	return e
}

// WithLogger sets a structured logger for authorization decisions.
func (e *Enforcer) WithLogger(logger *slog.Logger) *Enforcer {
	e.logger = logger
	return e
}

// WithDeniedHandler registers a handler called on every denied access.
func (e *Enforcer) WithDeniedHandler(h DeniedHandler) *Enforcer {
	e.deniedHandler = h
	return e
}

// loadDefaults registers VCT Platform built-in roles.
func (e *Enforcer) loadDefaults() {
	e.AddRole(&Role{
		Name:        "viewer",
		Description: "Read-only access",
		IsBuiltIn:   true,
		Permissions: []Permission{
			PermAthleteRead, PermMatchRead, PermClubRead, PermEventRead,
		},
	})

	e.AddRole(&Role{
		Name:        "scorer",
		Description: "Can score matches",
		IsBuiltIn:   true,
		Parents:     []string{"viewer"},
		Permissions: []Permission{PermMatchScore},
	})

	e.AddRole(&Role{
		Name:        "editor",
		Description: "Can manage athletes, clubs, events",
		IsBuiltIn:   true,
		Parents:     []string{"viewer"},
		Permissions: []Permission{
			PermAthleteWrite, PermClubWrite, PermEventWrite, PermMatchWrite,
		},
	})

	e.AddRole(&Role{
		Name:        "admin",
		Description: "Full platform access",
		IsBuiltIn:   true,
		Parents:     []string{"editor", "scorer"},
		Permissions: []Permission{
			PermAthleteDelete, PermUserManage, PermSystemAdmin,
		},
	})
}

// AddRole registers or updates a role.
func (e *Enforcer) AddRole(role *Role) {
	if role == nil {
		return
	}

	sanitized := sanitizeRole(role)
	if sanitized.Name == "" {
		return
	}

	e.mu.Lock()
	e.roles[sanitized.Name] = sanitized
	e.mu.Unlock()
}

// RemoveRole deletes a role.
func (e *Enforcer) RemoveRole(name string) {
	name = normalizeRoleName(name)
	if name == "" {
		return
	}

	e.mu.Lock()
	delete(e.roles, name)
	e.mu.Unlock()
}

// GetRole returns a role by name.
func (e *Enforcer) GetRole(name string) (*Role, bool) {
	name = normalizeRoleName(name)
	if name == "" {
		return nil, false
	}

	e.mu.RLock()
	defer e.mu.RUnlock()
	r, ok := e.roles[name]
	if !ok {
		return nil, false
	}
	return cloneRole(r), true
}

// ListRoles returns all registered roles with their resolved permissions, sorted by name.
func (e *Enforcer) ListRoles() []RoleInfo {
	e.mu.RLock()
	defer e.mu.RUnlock()

	infos := make([]RoleInfo, 0, len(e.roles))
	for _, role := range e.roles {
		// Collect all inherited permissions
		allPerms := make(map[Permission]bool)
		e.collectPermissions(role.Name, allPerms, make(map[string]bool))

		directSet := make(map[Permission]bool, len(role.Permissions))
		for _, p := range role.Permissions {
			directSet[p] = true
		}

		inherited := make([]Permission, 0)
		for p := range allPerms {
			if !directSet[p] {
				inherited = append(inherited, p)
			}
		}
		sort.Slice(inherited, func(i, j int) bool { return inherited[i] < inherited[j] })

		direct := make([]Permission, len(role.Permissions))
		copy(direct, role.Permissions)
		sort.Slice(direct, func(i, j int) bool { return direct[i] < direct[j] })

		infos = append(infos, RoleInfo{
			Name:           role.Name,
			Description:    role.Description,
			IsBuiltIn:      role.IsBuiltIn,
			DirectPerms:    direct,
			InheritedPerms: inherited,
			Parents:        append([]string(nil), role.Parents...),
		})
	}

	sort.Slice(infos, func(i, j int) bool { return infos[i].Name < infos[j].Name })
	return infos
}

// HasPermission checks if a role (including inherited) has a specific permission.
func (e *Enforcer) HasPermission(roleName string, perm Permission) bool {
	roleName = normalizeRoleName(roleName)
	perm = normalizePermission(perm)
	if roleName == "" || perm == "" {
		return false
	}

	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.hasPermissionRecursive(roleName, perm, make(map[string]bool))
}

// HasPermissionForRoles checks whether any assigned role grants the permission.
func (e *Enforcer) HasPermissionForRoles(roleNames []string, perm Permission) bool {
	perm = normalizePermission(perm)
	if perm == "" {
		return false
	}

	for _, roleName := range roleNames {
		if e.HasPermission(roleName, perm) {
			return true
		}
	}
	return false
}

// HasScopedPermission checks permission AND resource ownership.
// Admin/system roles bypass the ownership check.
// Returns true if the user has the permission AND (is admin OR owns the resource).
func (e *Enforcer) HasScopedPermission(ctx context.Context, roleName string, perm Permission, resourceID string, checker ScopeChecker) bool {
	if !e.HasPermission(roleName, perm) {
		return false
	}

	// Admin bypasses resource-scoped checks
	if e.HasPermission(roleName, PermSystemAdmin) {
		return true
	}

	if checker == nil {
		return true // No scope checker configured — fall back to role-only
	}

	actorID := UserIDFromContext(ctx)
	if actorID == "" {
		return false
	}

	isOwner, err := checker.IsOwner(ctx, actorID, resourceID)
	if err != nil {
		e.logger.Error("scope check failed",
			slog.String("actor", actorID),
			slog.String("resource_id", resourceID),
			slog.Any("error", err),
		)
		return false // Fail closed
	}
	return isOwner
}

func (e *Enforcer) hasPermissionRecursive(roleName string, perm Permission, visited map[string]bool) bool {
	if visited[roleName] {
		return false // Prevent infinite loops
	}
	visited[roleName] = true

	role, ok := e.roles[roleName]
	if !ok {
		return false
	}

	// Check direct permissions
	for _, p := range role.Permissions {
		if p == perm {
			return true
		}
		// Wildcard: "athletes:*" matches "athletes:read"
		if strings.HasSuffix(string(p), ":*") {
			resource := strings.TrimSuffix(string(p), ":*")
			if strings.HasPrefix(string(perm), resource+":") {
				return true
			}
		}
	}

	// Check inherited permissions
	for _, parent := range role.Parents {
		if e.hasPermissionRecursive(parent, perm, visited) {
			return true
		}
	}

	return false
}

// AllPermissions returns all permissions for a role, including inherited.
func (e *Enforcer) AllPermissions(roleName string) []Permission {
	roleName = normalizeRoleName(roleName)
	if roleName == "" {
		return nil
	}

	e.mu.RLock()
	defer e.mu.RUnlock()

	seen := make(map[Permission]bool)
	e.collectPermissions(roleName, seen, make(map[string]bool))

	perms := make([]Permission, 0, len(seen))
	for p := range seen {
		perms = append(perms, p)
	}
	sort.Slice(perms, func(i, j int) bool { return perms[i] < perms[j] })
	return perms
}

func (e *Enforcer) collectPermissions(roleName string, perms map[Permission]bool, visited map[string]bool) {
	if visited[roleName] {
		return
	}
	visited[roleName] = true

	role, ok := e.roles[roleName]
	if !ok {
		return
	}

	for _, p := range role.Permissions {
		perms[p] = true
	}
	for _, parent := range role.Parents {
		e.collectPermissions(parent, perms, visited)
	}
}

// ═══════════════════════════════════════════════════════════════
// Context helpers
// ═══════════════════════════════════════════════════════════════

type contextKey string

const (
	roleContextKey   contextKey = "rbac_role"
	rolesContextKey  contextKey = "rbac_roles"
	userIDContextKey contextKey = "rbac_user_id"
)

// ContextWithRole stores a role in context.
func ContextWithRole(ctx context.Context, role string) context.Context {
	roles := normalizeRoles([]string{role})
	if len(roles) == 0 {
		return ctx
	}

	ctx = context.WithValue(ctx, roleContextKey, roles[0])
	return context.WithValue(ctx, rolesContextKey, roles)
}

// ContextWithRoles stores a normalized set of roles in context.
func ContextWithRoles(ctx context.Context, roles ...string) context.Context {
	normalized := normalizeRoles(roles)
	if len(normalized) == 0 {
		return ctx
	}

	ctx = context.WithValue(ctx, roleContextKey, normalized[0])
	return context.WithValue(ctx, rolesContextKey, normalized)
}

// RoleFromContext extracts the role from context.
func RoleFromContext(ctx context.Context) string {
	if roles := RolesFromContext(ctx); len(roles) > 0 {
		return roles[0]
	}
	return ""
}

// RolesFromContext extracts all assigned roles from context.
func RolesFromContext(ctx context.Context) []string {
	if v, ok := ctx.Value(rolesContextKey).([]string); ok {
		return append([]string(nil), normalizeRoles(v)...)
	}
	if v, ok := ctx.Value(roleContextKey).(string); ok {
		return normalizeRoles([]string{v})
	}
	return nil
}

// ContextWithUserID stores a user ID in context.
func ContextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDContextKey, userID)
}

// UserIDFromContext extracts the user ID from context.
func UserIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(userIDContextKey).(string); ok {
		return v
	}
	return ""
}

// ═══════════════════════════════════════════════════════════════
// Structured JSON error helpers
// ═══════════════════════════════════════════════════════════════

// authzError is the standard JSON error envelope for authorization failures.
type authzError struct {
	Error      string `json:"error"`
	Message    string `json:"message"`
	Permission string `json:"required_permission,omitempty"`
}

func writeAuthzError(w http.ResponseWriter, status int, errCode, message string, perm Permission) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if perm != "" {
		w.Header().Set("X-VCT-Denied-Permission", string(perm))
	}
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(authzError{
		Error:      errCode,
		Message:    message,
		Permission: string(perm),
	})
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware
// ═══════════════════════════════════════════════════════════════

// logAndNotify emits a structured slog entry and calls the DeniedHandler if set.
func (e *Enforcer) logAndNotify(r *http.Request, decision AuthzDecision) {
	if decision.Allowed {
		e.logger.Debug("authz_allowed",
			slog.String("role", decision.Role),
			slog.String("permission", string(decision.Permission)),
			slog.String("path", decision.Path),
			slog.String("method", decision.Method),
		)
	} else {
		e.logger.Warn("authz_denied",
			slog.String("role", decision.Role),
			slog.String("permission", string(decision.Permission)),
			slog.String("user_id", decision.UserID),
			slog.String("path", decision.Path),
			slog.String("method", decision.Method),
		)
		if e.deniedHandler != nil {
			e.deniedHandler.OnDenied(r.Context(), decision)
		}
	}
}

// RequirePermission returns middleware that enforces a permission.
func RequirePermission(enforcer *Enforcer, perm Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roles := RolesFromContext(r.Context())
			if len(roles) == 0 {
				writeAuthzError(w, http.StatusUnauthorized, "unauthorized", "No role assigned. Authentication required.", "")
				return
			}

			allowed := enforcer.HasPermissionForRoles(roles, perm)
			decision := AuthzDecision{
				Role:       strings.Join(roles, ","),
				Permission: normalizePermission(perm),
				Allowed:    allowed,
				UserID:     UserIDFromContext(r.Context()),
				Path:       r.URL.Path,
				Method:     r.Method,
			}
			enforcer.logAndNotify(r, decision)

			if !allowed {
				writeAuthzError(w, http.StatusForbidden, "forbidden", "You do not have the required permission.", perm)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireAnyPermission returns middleware that passes if any of the listed permissions is granted.
func RequireAnyPermission(enforcer *Enforcer, perms ...Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roles := RolesFromContext(r.Context())
			if len(roles) == 0 {
				writeAuthzError(w, http.StatusUnauthorized, "unauthorized", "No role assigned. Authentication required.", "")
				return
			}

			for _, perm := range perms {
				if enforcer.HasPermissionForRoles(roles, perm) {
					enforcer.logAndNotify(r, AuthzDecision{
						Role: strings.Join(roles, ","), Permission: normalizePermission(perm), Allowed: true,
						UserID: UserIDFromContext(r.Context()),
						Path:   r.URL.Path, Method: r.Method,
					})
					next.ServeHTTP(w, r)
					return
				}
			}

			// Build a readable list of required permissions
			permStrs := make([]string, len(perms))
			for i, p := range perms {
				permStrs[i] = string(p)
			}
			enforcer.logAndNotify(r, AuthzDecision{
				Role: strings.Join(roles, ","), Permission: Permission(strings.Join(permStrs, "|")), Allowed: false,
				UserID: UserIDFromContext(r.Context()),
				Path:   r.URL.Path, Method: r.Method,
			})
			writeAuthzError(w, http.StatusForbidden, "forbidden", "Insufficient permissions. One of the required permissions is needed.", "")
		})
	}
}

// RequireAllPermissions returns middleware that passes ONLY if the role has ALL listed permissions.
func RequireAllPermissions(enforcer *Enforcer, perms ...Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roles := RolesFromContext(r.Context())
			if len(roles) == 0 {
				writeAuthzError(w, http.StatusUnauthorized, "unauthorized", "No role assigned. Authentication required.", "")
				return
			}

			for _, perm := range perms {
				if !enforcer.HasPermissionForRoles(roles, perm) {
					enforcer.logAndNotify(r, AuthzDecision{
						Role: strings.Join(roles, ","), Permission: normalizePermission(perm), Allowed: false,
						UserID: UserIDFromContext(r.Context()),
						Path:   r.URL.Path, Method: r.Method,
					})
					writeAuthzError(w, http.StatusForbidden, "forbidden", "All required permissions must be granted.", perm)
					return
				}
			}

			enforcer.logAndNotify(r, AuthzDecision{
				Role: strings.Join(roles, ","), Permission: "all_satisfied", Allowed: true,
				UserID: UserIDFromContext(r.Context()),
				Path:   r.URL.Path, Method: r.Method,
			})
			next.ServeHTTP(w, r)
		})
	}
}

// RequireRole returns middleware that enforces a specific role (not permission-based).
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	normalizedAllowed := normalizeRoles(roles)
	allowed := make(map[string]bool, len(normalizedAllowed))
	for _, r := range normalizedAllowed {
		allowed[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assignedRoles := RolesFromContext(r.Context())
			if len(assignedRoles) == 0 {
				writeAuthzError(w, http.StatusUnauthorized, "unauthorized", "No role assigned. Authentication required.", "")
				return
			}
			for _, role := range assignedRoles {
				if allowed[role] {
					next.ServeHTTP(w, r)
					return
				}
			}
			if len(assignedRoles) > 0 {
				writeAuthzError(w, http.StatusForbidden, "forbidden", "Your role does not have access to this resource.", "")
				return
			}
		})
	}
}

func sanitizeRole(role *Role) *Role {
	clone := &Role{
		Name:        normalizeRoleName(role.Name),
		Description: strings.TrimSpace(role.Description),
		IsBuiltIn:   role.IsBuiltIn,
		Permissions: make([]Permission, 0, len(role.Permissions)),
		Parents:     make([]string, 0, len(role.Parents)),
	}

	seenPerms := make(map[Permission]struct{}, len(role.Permissions))
	for _, perm := range role.Permissions {
		normalized := normalizePermission(perm)
		if normalized == "" {
			continue
		}
		if _, ok := seenPerms[normalized]; ok {
			continue
		}
		seenPerms[normalized] = struct{}{}
		clone.Permissions = append(clone.Permissions, normalized)
	}

	seenParents := make(map[string]struct{}, len(role.Parents))
	for _, parent := range role.Parents {
		normalized := normalizeRoleName(parent)
		if normalized == "" || normalized == clone.Name {
			continue
		}
		if _, ok := seenParents[normalized]; ok {
			continue
		}
		seenParents[normalized] = struct{}{}
		clone.Parents = append(clone.Parents, normalized)
	}

	sort.Slice(clone.Permissions, func(i, j int) bool { return clone.Permissions[i] < clone.Permissions[j] })
	sort.Strings(clone.Parents)
	return clone
}

func cloneRole(role *Role) *Role {
	if role == nil {
		return nil
	}

	return &Role{
		Name:        role.Name,
		Description: role.Description,
		Permissions: append([]Permission(nil), role.Permissions...),
		Parents:     append([]string(nil), role.Parents...),
		IsBuiltIn:   role.IsBuiltIn,
	}
}

func normalizeRoleName(role string) string {
	return strings.TrimSpace(strings.ToLower(role))
}

func normalizePermission(perm Permission) Permission {
	return Permission(strings.TrimSpace(strings.ToLower(string(perm))))
}

func normalizeRoles(roles []string) []string {
	normalized := make([]string, 0, len(roles))
	seen := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		name := normalizeRoleName(role)
		if name == "" {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		normalized = append(normalized, name)
	}
	return normalized
}
