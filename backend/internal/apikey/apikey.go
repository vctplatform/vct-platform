// Package apikey provides API key generation, validation, scoped permissions,
// and HTTP authentication middleware for machine-to-machine communication.
package apikey

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Models
// ═══════════════════════════════════════════════════════════════

// Key represents an API key with metadata and scoped permissions.
type Key struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Prefix     string    `json:"prefix"`   // Visible prefix (e.g., "vct_")
	Hash       string    `json:"-"`        // SHA-256 hash of the full key (never stored raw)
	Scopes     []string  `json:"scopes"`   // e.g., ["athletes:read", "matches:read"]
	OwnerID    string    `json:"owner_id"` // User or service that owns this key
	ExpiresAt  time.Time `json:"expires_at,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	LastUsedAt time.Time `json:"last_used_at,omitempty"`
	Active     bool      `json:"active"`
}

// IsExpired checks if the key has expired.
func (k *Key) IsExpired() bool {
	if k.ExpiresAt.IsZero() {
		return false
	}
	return time.Now().After(k.ExpiresAt)
}

// HasScope checks if the key has a specific scope.
func (k *Key) HasScope(scope string) bool {
	for _, s := range k.Scopes {
		if s == scope || s == "*" {
			return true
		}
		// Wildcard: "athletes:*" matches "athletes:read"
		if strings.HasSuffix(s, ":*") {
			resource := strings.TrimSuffix(s, ":*")
			if strings.HasPrefix(scope, resource+":") {
				return true
			}
		}
	}
	return false
}

// CreateResult is returned when a new key is created.
// The RawKey is shown only once and never stored.
type CreateResult struct {
	Key    *Key   `json:"key"`
	RawKey string `json:"raw_key"` // Show once, then discard
}

// ═══════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════

// Service manages API keys.
type Service struct {
	keys map[string]*Key // hash -> Key
	mu   sync.RWMutex
	seq  uint64
}

// NewService creates an API key service.
func NewService() *Service {
	return &Service{
		keys: make(map[string]*Key),
	}
}

// Create generates a new API key with the given scopes.
func (s *Service) Create(name, ownerID string, scopes []string, expiresAt time.Time) CreateResult {
	rawKey := generateRawKey()
	hash := hashKey(rawKey)

	s.mu.Lock()
	s.seq++
	key := &Key{
		ID:        fmt.Sprintf("ak_%d", s.seq),
		Name:      name,
		Prefix:    rawKey[:8], // First 8 chars visible
		Hash:      hash,
		Scopes:    scopes,
		OwnerID:   ownerID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now().UTC(),
		Active:    true,
	}
	s.keys[hash] = key
	s.mu.Unlock()

	return CreateResult{Key: key, RawKey: rawKey}
}

// Validate checks if a raw API key is valid and returns the associated Key.
func (s *Service) Validate(rawKey string) (*Key, error) {
	hash := hashKey(rawKey)

	s.mu.RLock()
	key, ok := s.keys[hash]
	s.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("invalid API key")
	}
	if !key.Active {
		return nil, fmt.Errorf("API key is deactivated")
	}
	if key.IsExpired() {
		return nil, fmt.Errorf("API key has expired")
	}

	// Update last used (best-effort)
	s.mu.Lock()
	key.LastUsedAt = time.Now().UTC()
	s.mu.Unlock()

	return key, nil
}

// Revoke deactivates an API key by ID.
func (s *Service) Revoke(keyID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, key := range s.keys {
		if key.ID == keyID {
			key.Active = false
			return true
		}
	}
	return false
}

// List returns all keys for an owner.
func (s *Service) List(ownerID string) []*Key {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Key
	for _, key := range s.keys {
		if key.OwnerID == ownerID {
			result = append(result, key)
		}
	}
	return result
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware
// ═══════════════════════════════════════════════════════════════

type apiKeyContextKey struct{}

// KeyFromContext extracts the validated API key from request context.
func KeyFromContext(ctx context.Context) *Key {
	if k, ok := ctx.Value(apiKeyContextKey{}).(*Key); ok {
		return k
	}
	return nil
}

// AuthMiddleware validates API keys from the Authorization header.
// Supports: "Bearer vct_..." or "ApiKey vct_..."
func AuthMiddleware(svc *Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rawKey := extractKey(r)
			if rawKey == "" {
				http.Error(w, `{"error":"unauthorized","message":"API key required"}`, http.StatusUnauthorized)
				return
			}

			key, err := svc.Validate(rawKey)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error":"unauthorized","message":"%s"}`, err.Error()), http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), apiKeyContextKey{}, key)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireScope wraps AuthMiddleware and additionally checks for a specific scope.
func RequireScope(svc *Service, scope string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return AuthMiddleware(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := KeyFromContext(r.Context())
			if key == nil || !key.HasScope(scope) {
				http.Error(w, fmt.Sprintf(`{"error":"forbidden","message":"scope '%s' required"}`, scope), http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

// ── Helpers ──────────────────────────

func generateRawKey() string {
	b := make([]byte, 32) // 256-bit key
	rand.Read(b)
	return "vct_" + hex.EncodeToString(b)
}

func hashKey(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func extractKey(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		// Fallback: query param (not recommended for production)
		return r.URL.Query().Get("api_key")
	}

	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 {
		return ""
	}

	scheme := strings.ToLower(parts[0])
	if scheme == "bearer" || scheme == "apikey" {
		return parts[1]
	}
	return ""
}
