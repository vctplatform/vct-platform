package httpapi

import (
	"log"
	"net/http"
	"strings"
	"time"

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/config"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/domain/community"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/domain/heritage"
	"vct-platform/backend/internal/domain/organization"
	"vct-platform/backend/internal/domain/ranking"
	"vct-platform/backend/internal/domain/scoring"
	"vct-platform/backend/internal/realtime"
	"vct-platform/backend/internal/store"
)

// Server is the main HTTP server for the VCT backend.
// Handler methods are split across files:
//   - auth_handler.go     — auth login/refresh/me/logout/revoke/audit
//   - entity_handler.go   — generic entity CRUD, bulk, import, export
//   - middleware.go        — withAuth, withCORS, withLogging, request context
//   - helpers.go           — JSON decode, response helpers, entity registry
type Server struct {
	cfg             config.Config
	authService     *auth.Service
	store           store.DataStore
	cachedStore     *store.CachedStore
	storageDriver   string
	storageProvider string
	realtimeHub     *realtime.Hub
	allowedEntities map[string]struct{}
	allowedOrigins  map[string]struct{}

	athleteService      *athlete.Service
	orgService          *organization.Service
	scoringService      *scoring.Service
	registrationService *scoring.RegistrationService
	tournamentCRUD      adapter.TournamentCRUD
	rankingService      *ranking.Service
	heritageService     *heritage.Service
	financeService      *finance.Service
	communityService    *community.Service
}

func New(cfg config.Config) *Server {
	originSet := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, origin := range cfg.AllowedOrigins {
		originSet[origin] = struct{}{}
	}

	baseStore, storageDriver, storageProvider := resolveStore(cfg)
	cachedStore := store.NewCachedStore(baseStore, cfg.CacheTTL, cfg.CacheMaxEntries)

	return &Server{
		cfg: cfg,
		authService: auth.NewService(auth.ServiceConfig{
			Secret:          cfg.JWTSecret,
			Issuer:          cfg.JWTIssuer,
			AccessTTL:       cfg.AccessTokenTTL,
			RefreshTTL:      cfg.RefreshTokenTTL,
			AuditLimit:      cfg.AuditLimit,
			CleanupInterval: 5 * time.Minute,
			AllowDemoUsers:  cfg.AllowDemoUsers,
			CredentialsJSON: cfg.BootstrapUsersJSON,
		}),
		store:           cachedStore,
		cachedStore:     cachedStore,
		storageDriver:   storageDriver,
		storageProvider: storageProvider,
		realtimeHub:     realtime.NewHub(cfg.AllowedOrigins),
		allowedEntities: defaultEntitySet(),
		allowedOrigins:  originSet,

		athleteService: athlete.NewService(adapter.NewAthleteRepository(cachedStore)),
		orgService: organization.NewService(
			adapter.NewTeamRepository(cachedStore),
			adapter.NewRefereeRepository(cachedStore),
			adapter.NewArenaRepository(cachedStore),
		),
		scoringService:      scoring.NewService(adapter.NewScoringRepository(), scoring.DefaultScoringConfig()),
		registrationService: scoring.NewRegistrationService(adapter.NewRegistrationRepository(cachedStore)),
		tournamentCRUD:      adapter.NewTournamentRepository(cachedStore),
		rankingService:      ranking.NewService(adapter.NewAthleteRankingRepository(cachedStore), adapter.NewTeamRankingRepository(cachedStore)),
		heritageService:     heritage.NewService(adapter.NewBeltRankRepository(cachedStore), adapter.NewTechniqueRepository(cachedStore)),
		financeService:      finance.NewService(adapter.NewTransactionRepository(cachedStore), adapter.NewBudgetRepository(cachedStore)),
		communityService:    community.NewService(adapter.NewClubRepository(cachedStore), adapter.NewMemberRepository(cachedStore), adapter.NewEventRepository(cachedStore)),
	}
}

// Handler returns the fully wired HTTP handler with CORS and logging.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/api/v1/ws", s.handleWebSocket)
	mux.HandleFunc("/api/v1/auth/login", s.handleAuthLogin)
	mux.HandleFunc("/api/v1/auth/refresh", s.handleAuthRefresh)
	mux.HandleFunc("/api/v1/auth/me", s.withAuth(s.handleAuthMe))
	mux.HandleFunc("/api/v1/auth/logout", s.withAuth(s.handleAuthLogout))
	mux.HandleFunc("/api/v1/auth/revoke", s.withAuth(s.handleAuthRevoke))
	mux.HandleFunc("/api/v1/auth/audit", s.withAuth(s.handleAuthAudit))
	// Scoring API (requires auth)
	mux.HandleFunc("/api/v1/scoring/", s.handleScoringRoutes)
	// Public API (no auth)
	mux.HandleFunc("/api/v1/public/", s.handlePublicRoutes)
	// Specific domain entities
	mux.HandleFunc("/api/v1/athletes/", s.handleAthleteRoutes)
	mux.HandleFunc("/api/v1/athletes", s.handleAthleteRoutes)
	mux.HandleFunc("/api/v1/teams/", s.handleTeamRoutes)
	mux.HandleFunc("/api/v1/teams", s.handleTeamRoutes)
	mux.HandleFunc("/api/v1/referees/", s.handleRefereeRoutes)
	mux.HandleFunc("/api/v1/referees", s.handleRefereeRoutes)
	mux.HandleFunc("/api/v1/arenas/", s.handleArenaRoutes)
	mux.HandleFunc("/api/v1/arenas", s.handleArenaRoutes)
	mux.HandleFunc("/api/v1/registration/", s.handleRegistrationRoutes)
	mux.HandleFunc("/api/v1/registration", s.handleRegistrationRoutes)
	mux.HandleFunc("/api/v1/tournaments/", s.handleTournamentRoutes)
	mux.HandleFunc("/api/v1/tournaments", s.handleTournamentRoutes)
	// Ranking
	mux.HandleFunc("/api/v1/rankings/", s.handleRankingRoutes)
	mux.HandleFunc("/api/v1/rankings", s.handleRankingRoutes)
	// Heritage
	mux.HandleFunc("/api/v1/belts/", s.handleBeltRoutes)
	mux.HandleFunc("/api/v1/belts", s.handleBeltRoutes)
	mux.HandleFunc("/api/v1/techniques/", s.handleTechniqueRoutes)
	mux.HandleFunc("/api/v1/techniques", s.handleTechniqueRoutes)
	// Finance
	mux.HandleFunc("/api/v1/transactions/", s.handleTransactionRoutes)
	mux.HandleFunc("/api/v1/transactions", s.handleTransactionRoutes)
	mux.HandleFunc("/api/v1/budgets", s.handleBudgetRoutes)
	// Community
	mux.HandleFunc("/api/v1/clubs/", s.handleClubRoutes)
	mux.HandleFunc("/api/v1/clubs", s.handleClubRoutes)
	mux.HandleFunc("/api/v1/members/", s.handleMemberRoutes)
	mux.HandleFunc("/api/v1/members", s.handleMemberRoutes)
	mux.HandleFunc("/api/v1/community-events/", s.handleCommunityEventRoutes)
	mux.HandleFunc("/api/v1/community-events", s.handleCommunityEventRoutes)
	// Generic entity CRUD (catch-all for unmigrated entities)
	mux.HandleFunc("/api/v1/", s.handleEntityRoutes)
	return s.withCORS(s.withLogging(mux))
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	cacheStats := map[string]any{}
	if s.cachedStore != nil {
		cacheStats = s.cachedStore.CacheStats()
	}

	success(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"service": "vct-backend",
		"time":    time.Now().UTC(),
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

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.DisableAuthForData {
		token := tokenFromRequest(r)
		if token == "" {
			unauthorized(w, "thiếu token cho websocket realtime")
			return
		}
		if _, err := s.authService.AuthenticateAccessToken(token, requestContextFromRequest(r)); err != nil {
			writeAuthError(w, err)
			return
		}
	}

	if err := s.realtimeHub.ServeWS(w, r); err != nil {
		internalError(w, err)
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

	s.realtimeHub.Broadcast(realtime.EntityEvent{
		Type:      "entity.changed",
		Entity:    entity,
		Action:    action,
		ItemID:    strings.TrimSpace(itemID),
		Payload:   combinedPayload,
		Timestamp: time.Now().UTC(),
	})
}

func resolveStore(cfg config.Config) (store.DataStore, string, string) {
	driver := strings.ToLower(strings.TrimSpace(cfg.StorageDriver))
	if driver == "postgres" {
		if strings.TrimSpace(cfg.PostgresURL) == "" {
			log.Printf("VCT_STORAGE_DRIVER=postgres nhưng VCT_POSTGRES_URL trống, fallback memory")
			return store.NewStore(), "memory", "fallback"
		}

		postgresStore, err := store.NewPostgresStore(cfg.PostgresURL, cfg.DBAutoMigrate)
		if err != nil {
			log.Printf("postgres init failed (%v), fallback memory", err)
			return store.NewStore(), "memory", "fallback"
		}

		provider := strings.ToLower(strings.TrimSpace(cfg.PostgresProvider))
		if provider == "" {
			provider = "selfhost"
		}
		return postgresStore, "postgres", provider
	}

	return store.NewStore(), "memory", "memory"
}

func (s *Server) Close() error {
	if s.store == nil {
		return nil
	}
	return s.store.Close()
}
