// Package tenant provides multi-tenant context propagation, tenant resolution
// from HTTP requests (header/subdomain/path), and tenant-aware query helpers.
package tenant

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// Tenant Model
// ═══════════════════════════════════════════════════════════════

// Tenant represents an organization / federation in the platform.
type Tenant struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Slug      string            `json:"slug"` // URL-safe identifier
	Plan      string            `json:"plan"` // "free", "pro", "enterprise"
	Active    bool              `json:"active"`
	Settings  map[string]string `json:"settings"`
	CreatedAt time.Time         `json:"created_at"`
}

// ═══════════════════════════════════════════════════════════════
// Context Propagation
// ═══════════════════════════════════════════════════════════════

type tenantCtxKey struct{}

// WithTenant stores a tenant in context.
func WithTenant(ctx context.Context, t *Tenant) context.Context {
	return context.WithValue(ctx, tenantCtxKey{}, t)
}

// FromContext extracts the tenant from context.
func FromContext(ctx context.Context) *Tenant {
	if t, ok := ctx.Value(tenantCtxKey{}).(*Tenant); ok {
		return t
	}
	return nil
}

// MustFromContext extracts tenant or panics (for handlers behind middleware).
func MustFromContext(ctx context.Context) *Tenant {
	t := FromContext(ctx)
	if t == nil {
		panic("tenant: no tenant in context — ensure ResolverMiddleware is applied")
	}
	return t
}

// IDFromContext is a shortcut to get just the tenant ID.
func IDFromContext(ctx context.Context) string {
	if t := FromContext(ctx); t != nil {
		return t.ID
	}
	return ""
}

// ═══════════════════════════════════════════════════════════════
// Resolver — Find tenant from HTTP request
// ═══════════════════════════════════════════════════════════════

// Resolver looks up a tenant by identifier.
type Resolver interface {
	ByID(ctx context.Context, id string) (*Tenant, error)
	BySlug(ctx context.Context, slug string) (*Tenant, error)
}

// Strategy determines how the tenant identifier is extracted from the request.
type Strategy int

const (
	StrategyHeader     Strategy = iota // X-Tenant-ID header
	StrategySubdomain                  // subdomain: {slug}.example.com
	StrategyPathPrefix                 // path: /t/{slug}/...
)

const (
	// HeaderTenantID is the header used for tenant identification.
	HeaderTenantID = "X-Tenant-ID"
)

// ResolverMiddleware resolves tenant from HTTP request and stores in context.
func ResolverMiddleware(resolver Resolver, strategy Strategy) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			identifier := extractIdentifier(r, strategy)
			if identifier == "" {
				http.Error(w, `{"error":"tenant_required","message":"tenant identifier is missing"}`, http.StatusBadRequest)
				return
			}

			var t *Tenant
			var err error

			switch strategy {
			case StrategyHeader:
				t, err = resolver.ByID(r.Context(), identifier)
			default:
				t, err = resolver.BySlug(r.Context(), identifier)
			}

			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"tenant_not_found","message":"%s"}`, err.Error()), http.StatusNotFound)
				return
			}

			if !t.Active {
				http.Error(w, `{"error":"tenant_inactive","message":"tenant account is suspended"}`, http.StatusForbidden)
				return
			}

			ctx := WithTenant(r.Context(), t)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractIdentifier(r *http.Request, strategy Strategy) string {
	switch strategy {
	case StrategyHeader:
		return strings.TrimSpace(r.Header.Get(HeaderTenantID))

	case StrategySubdomain:
		host := r.Host
		// Remove port
		if idx := strings.Index(host, ":"); idx > 0 {
			host = host[:idx]
		}
		parts := strings.SplitN(host, ".", 2)
		if len(parts) >= 2 {
			return parts[0]
		}
		return ""

	case StrategyPathPrefix:
		// /t/{slug}/... → slug
		path := strings.TrimPrefix(r.URL.Path, "/t/")
		if path == r.URL.Path {
			return "" // no /t/ prefix
		}
		parts := strings.SplitN(path, "/", 2)
		return parts[0]
	}
	return ""
}

// ═══════════════════════════════════════════════════════════════
// SQL Helpers
// ═══════════════════════════════════════════════════════════════

// ScopeQuery appends a tenant_id WHERE clause to a query.
func ScopeQuery(ctx context.Context, baseQuery string, args []any) (string, []any) {
	tenantID := IDFromContext(ctx)
	if tenantID == "" {
		return baseQuery, args
	}

	paramIdx := len(args) + 1
	if strings.Contains(baseQuery, "WHERE") {
		baseQuery += fmt.Sprintf(" AND tenant_id = $%d", paramIdx)
	} else {
		baseQuery += fmt.Sprintf(" WHERE tenant_id = $%d", paramIdx)
	}
	args = append(args, tenantID)
	return baseQuery, args
}

// ═══════════════════════════════════════════════════════════════
// In-Memory Resolver (for testing)
// ═══════════════════════════════════════════════════════════════

// MemoryResolver is an in-memory tenant resolver.
type MemoryResolver struct {
	tenants map[string]*Tenant // id -> Tenant
	slugs   map[string]string  // slug -> id
	mu      sync.RWMutex
}

// NewMemoryResolver creates a memory-backed resolver.
func NewMemoryResolver() *MemoryResolver {
	return &MemoryResolver{
		tenants: make(map[string]*Tenant),
		slugs:   make(map[string]string),
	}
}

// Add registers a tenant.
func (m *MemoryResolver) Add(t *Tenant) {
	m.mu.Lock()
	m.tenants[t.ID] = t
	m.slugs[t.Slug] = t.ID
	m.mu.Unlock()
}

func (m *MemoryResolver) ByID(_ context.Context, id string) (*Tenant, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if t, ok := m.tenants[id]; ok {
		return t, nil
	}
	return nil, apierror.Newf("TENANT_404", "không tìm thấy tenant %q", id)
}

func (m *MemoryResolver) BySlug(_ context.Context, slug string) (*Tenant, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if id, ok := m.slugs[slug]; ok {
		return m.tenants[id], nil
	}
	return nil, apierror.Newf("TENANT_404_SLUG", "không tìm thấy tenant với slug %q", slug)
}
