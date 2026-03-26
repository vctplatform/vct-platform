package httpapi

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"runtime"
	"strings"
	"time"

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/apiversioning"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/config"
	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/domain/btc"
	"vct-platform/backend/internal/domain/certification"
	clubdomain "vct-platform/backend/internal/domain/club"
	"vct-platform/backend/internal/domain/community"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/domain/heritage"
	"vct-platform/backend/internal/domain/international"
	"vct-platform/backend/internal/domain/marketplace"
	"vct-platform/backend/internal/domain/organization"
	"vct-platform/backend/internal/domain/parent"
	"vct-platform/backend/internal/domain/provincial"
	"vct-platform/backend/internal/domain/ranking"
	"vct-platform/backend/internal/domain/scoring"
	"vct-platform/backend/internal/domain/support"
	"vct-platform/backend/internal/domain/tournament"
	"vct-platform/backend/internal/email"
	"vct-platform/backend/internal/events"
	"vct-platform/backend/internal/metrics"
	"vct-platform/backend/internal/realtime"
	"vct-platform/backend/internal/store"
)

// Server is the main HTTP server for the VCT backend.
// Handler methods are split across files:
//   - auth_handler.go     — auth login/refresh/me/logout/revoke/audit
//   - entity_handler.go   — generic entity CRUD, bulk, import, export
//   - middleware.go        — withAuth, withCORS, withLogging, request context
//   - helpers.go           — JSON decode, response helpers, entity registry
//   - wire.go              — New() constructor, resolveStore, dependency injection
//   - router.go            — Handler() route registration
type Server struct {
	cfg              config.Config
	logger           *slog.Logger
	authService      *auth.Service
	store            store.DataStore
	cachedStore      *store.CachedStore
	storageDriver    string
	storageProvider  string
	realtimeHub      *realtime.Hub
	allowedEntities  map[string]struct{}
	allowedOrigins   map[string]struct{}
	rateLimiter      *rateLimiter
	loginRateLimiter *rateLimiter // stricter limit for auth endpoints
	metricsRegistry  *metrics.Registry
	versionRegistry  *apiversioning.Registry

	// ── Core Domain Modules ─────────────────────────────
	Core struct {
		Athlete      *athlete.Service
		Organization *organization.Service
		Scoring      *scoring.Service
		Registration *scoring.RegistrationService
		Tournament   adapter.TournamentCRUD
		Ranking      *ranking.Service
		Heritage     *heritage.Service
		Finance      *finance.Service
		Community    *community.Service
		Club         *clubdomain.Service
	}

	// ── National Federation Modules ─────────────────────
	Federation struct {
		Main          *federation.Service
		Approval      *approval.Service
		WorkflowRepo  approval.WorkflowRepository
		Certification *certification.Service
		Discipline    *discipline.Service
		Document      *document.Service
		International *international.Service
	}

	// ── Provincial Federation Modules ───────────────────
	Provincial struct {
		Main            *provincial.Service
		TournamentStore provincial.TournamentStore
		FinanceStore    provincial.FinanceStore
		CertStore       provincial.CertStore
		DisciplineStore provincial.DisciplineStore
		DocStore        provincial.DocStore
	}

	// ── Extended Application Modules ────────────────────
	Extended struct {
		AthleteProfile  *athlete.ProfileService
		TrainingSession *athlete.TrainingService
		BTC             *btc.Service
		Parent          *parent.Service
		TournamentMgmt  *tournament.MgmtService
		Marketplace     *marketplace.Service
		Support         *support.Service
		Subscription    *finance.SubscriptionService
	}

	// ── Event Bus ─────────────────────────────────────────
	eventBus *events.InMemoryBus

	// ── SQL DB (for PG adapters when storage driver is postgres) ──
	sqlDB *sql.DB

	// ── Email Service (Resend) ────────────────────────────
	emailService *email.ResendProvider
}

// ═══════════════════════════════════════════════════════════════
// Lifecycle & Utility Methods
// ═══════════════════════════════════════════════════════════════

// Close gracefully shuts down all resources held by the Server.
func (s *Server) Close() error {
	// 1. Close all WebSocket connections gracefully
	if s.realtimeHub != nil {
		s.realtimeHub.Close()
	}
	// 2. Stop auth cleanup goroutine
	if s.authService != nil {
		s.authService.Stop()
	}
	// 3. Close SQL DB (PG adapters)
	if s.sqlDB != nil {
		_ = s.sqlDB.Close()
	}
	// 4. Close data store
	if s.store != nil {
		return s.store.Close()
	}
	return nil
}

// handleRoot returns a JSON welcome response at the root path.
func (s *Server) handleRoot(w http.ResponseWriter, r *http.Request) {
	// Only respond to exact root path; let other unmatched paths 404
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"service": "vct-platform-api",
		"status":  "running",
		"version": "1.0.0",
		"time":    time.Now().UTC(),
		"endpoints": map[string]string{
			"health": "/healthz",
			"ready":  "/readyz",
			"api":    "/api/v1/",
		},
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	cacheStats := map[string]any{}
	if s.cachedStore != nil {
		cacheStats = s.cachedStore.CacheStats()
	}

	success(w, http.StatusOK, map[string]any{
		"status":     "ok",
		"service":    "vct-backend",
		"time":       time.Now().UTC(),
		"go_version": goVersion(),
		"storage": map[string]any{
			"driver":   s.storageDriver,
			"provider": s.storageProvider,
		},
		"cache": cacheStats,
		"realtime": map[string]any{
			"clients": s.realtimeHub.CountClients(),
		},
	})
}

// handleReadiness is a deeper health check that verifies all dependencies.
// Kubernetes/load balancers should use /readyz; /healthz is the liveness probe.
func (s *Server) handleReadiness(w http.ResponseWriter, r *http.Request) {
	checks := map[string]any{}
	overallOK := true

	// 1. Database connectivity
	if s.sqlDB != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := s.sqlDB.PingContext(ctx); err != nil {
			checks["database"] = map[string]any{"status": "unhealthy", "error": err.Error()}
			overallOK = false
		} else {
			dbStats := s.sqlDB.Stats()
			checks["database"] = map[string]any{
				"status":     "healthy",
				"open_conns": dbStats.OpenConnections,
				"in_use":     dbStats.InUse,
				"idle":       dbStats.Idle,
			}
		}
	} else {
		checks["database"] = map[string]any{"status": "not_configured", "driver": s.storageDriver}
	}

	// 2. Cache
	if s.cachedStore != nil {
		checks["cache"] = s.cachedStore.CacheStats()
	} else {
		checks["cache"] = map[string]any{"status": "disabled"}
	}

	// 3. Realtime hub
	checks["realtime"] = map[string]any{"clients": s.realtimeHub.CountClients()}

	status := http.StatusOK
	statusStr := "ready"
	if !overallOK {
		status = http.StatusServiceUnavailable
		statusStr = "not_ready"
	}

	success(w, status, map[string]any{
		"status":     statusStr,
		"service":    "vct-backend",
		"time":       time.Now().UTC(),
		"go_version": goVersion(),
		"checks":     checks,
	})
}

func goVersion() string {
	return runtime.Version()
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// WebSocket authentication is handled via first-message auth
	// (client sends {"action":"auth","token":"xxx"} after connection opens)
	if err := s.realtimeHub.ServeWS(w, r); err != nil {
		apiInternal(w, err)
	}
}

func (s *Server) broadcastEntityChange(
	entity string,
	action string,
	itemID string,
	payload map[string]any,
	meta map[string]any,
) {
	if s.realtimeHub == nil {
		return
	}

	combinedPayload := map[string]any{}
	for key, value := range payload {
		combinedPayload[key] = value
	}
	for key, value := range meta {
		combinedPayload[key] = value
	}

	event := realtime.EntityEvent{
		Type:      "entity.changed",
		Entity:    entity,
		Action:    action,
		ItemID:    strings.TrimSpace(itemID),
		Payload:   combinedPayload,
		Timestamp: time.Now().UTC(),
	}

	// Use channel-targeted broadcast for entity-specific events
	channel := entity
	if itemID != "" {
		channel = entity + ":" + strings.TrimSpace(itemID)
	}
	s.realtimeHub.BroadcastToChannel(channel, event)
	// Also broadcast to the entity-level channel
	if itemID != "" {
		s.realtimeHub.BroadcastToChannel(entity, event)
	}
}

// newUUID generates a v4 UUID string used by federation domain services.
func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
