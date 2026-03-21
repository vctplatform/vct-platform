// Package idempotency provides duplicate request prevention using idempotency
// keys with cached response replay, TTL expiration, and HTTP middleware.
package idempotency

import (
	"bytes"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Cached Response
// ═══════════════════════════════════════════════════════════════

// CachedResponse stores the result of a previously processed request.
type CachedResponse struct {
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers,omitempty"`
	Body       []byte            `json:"body"`
	CreatedAt  time.Time         `json:"created_at"`
}

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

type storeEntry struct {
	response  *CachedResponse
	expiresAt time.Time
	locked    bool // In-flight request
}

// Store manages idempotency keys with TTL.
type Store struct {
	entries map[string]*storeEntry
	ttl     time.Duration
	mu      sync.Mutex

	hits   atomic.Int64
	misses atomic.Int64
	locks  atomic.Int64
}

// NewStore creates an idempotency store.
func NewStore(ttl time.Duration) *Store {
	s := &Store{
		entries: make(map[string]*storeEntry),
		ttl:     ttl,
	}
	return s
}

// Check looks up a key. Returns:
//   - (response, true)  → duplicate, replay cached response
//   - (nil, true)       → in-flight, another request is processing
//   - (nil, false)      → new key, caller should process
func (s *Store) Check(key string) (*CachedResponse, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cleanup()

	if e, ok := s.entries[key]; ok {
		if e.locked {
			s.locks.Add(1)
			return nil, true // In-flight
		}
		s.hits.Add(1)
		return e.response, true
	}

	// Lock key for in-flight processing
	s.entries[key] = &storeEntry{locked: true, expiresAt: time.Now().Add(s.ttl)}
	s.misses.Add(1)
	return nil, false
}

// Complete stores the response for a processed key.
func (s *Store) Complete(key string, resp *CachedResponse) {
	s.mu.Lock()
	defer s.mu.Unlock()

	resp.CreatedAt = time.Now()
	s.entries[key] = &storeEntry{
		response:  resp,
		expiresAt: time.Now().Add(s.ttl),
		locked:    false,
	}
}

// Release removes the in-flight lock (on error, allow retry).
func (s *Store) Release(key string) {
	s.mu.Lock()
	delete(s.entries, key)
	s.mu.Unlock()
}

func (s *Store) cleanup() {
	now := time.Now()
	for k, e := range s.entries {
		if now.After(e.expiresAt) {
			delete(s.entries, k)
		}
	}
}

// Size returns current number of cached keys.
func (s *Store) Size() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.entries)
}

// Stats returns store statistics.
type Stats struct {
	Size   int   `json:"size"`
	Hits   int64 `json:"hits"`
	Misses int64 `json:"misses"`
	Locks  int64 `json:"in_flight_collisions"`
}

func (s *Store) Stats() Stats {
	return Stats{
		Size:   s.Size(),
		Hits:   s.hits.Load(),
		Misses: s.misses.Load(),
		Locks:  s.locks.Load(),
	}
}

// ═══════════════════════════════════════════════════════════════
// HTTP Middleware
// ═══════════════════════════════════════════════════════════════

const HeaderIdempotencyKey = "Idempotency-Key"

// responseCapture captures the response for caching.
type responseCapture struct {
	http.ResponseWriter
	statusCode int
	body       bytes.Buffer
	headers    map[string]string
}

func (rc *responseCapture) WriteHeader(code int) {
	rc.statusCode = code
	rc.ResponseWriter.WriteHeader(code)
}

func (rc *responseCapture) Write(b []byte) (int, error) {
	rc.body.Write(b)
	return rc.ResponseWriter.Write(b)
}

// Middleware enforces idempotency for mutating requests (POST, PUT, PATCH).
func Middleware(store *Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only apply to mutating methods
			if r.Method != http.MethodPost && r.Method != http.MethodPut && r.Method != http.MethodPatch {
				next.ServeHTTP(w, r)
				return
			}

			key := r.Header.Get(HeaderIdempotencyKey)
			if key == "" {
				next.ServeHTTP(w, r)
				return
			}

			cached, exists := store.Check(key)
			if exists && cached != nil {
				// Replay cached response
				for k, v := range cached.Headers {
					w.Header().Set(k, v)
				}
				w.Header().Set("X-Idempotent-Replayed", "true")
				w.WriteHeader(cached.StatusCode)
				w.Write(cached.Body)
				return
			}
			if exists {
				// In-flight collision
				http.Error(w, fmt.Sprintf(`{"error":"conflict","message":"request %s is already being processed"}`, key),
					http.StatusConflict)
				return
			}

			// Process and cache
			capture := &responseCapture{
				ResponseWriter: w,
				statusCode:     200,
				headers:        make(map[string]string),
			}
			next.ServeHTTP(capture, r)

			store.Complete(key, &CachedResponse{
				StatusCode: capture.statusCode,
				Body:       capture.body.Bytes(),
			})
		})
	}
}
