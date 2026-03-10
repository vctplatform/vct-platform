package httpapi

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/config"
	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/domain/certification"
	"vct-platform/backend/internal/domain/community"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/domain/heritage"
	"vct-platform/backend/internal/domain/international"
	"vct-platform/backend/internal/domain/organization"
	"vct-platform/backend/internal/domain/provincial"
	"vct-platform/backend/internal/domain/ranking"
	"vct-platform/backend/internal/domain/scoring"
	"vct-platform/backend/internal/events"
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
	rateLimiter     *rateLimiter

	athleteService      *athlete.Service
	orgService          *organization.Service
	scoringService      *scoring.Service
	registrationService *scoring.RegistrationService
	tournamentCRUD      adapter.TournamentCRUD
	rankingService      *ranking.Service
	heritageService     *heritage.Service
	financeService      *finance.Service
	communityService    *community.Service

	// ── National Federation Services ─────────────────────
	federationSvc    *federation.Service
	approvalSvc      *approval.Service
	workflowRepo     approval.WorkflowRepository
	certificationSvc *certification.Service
	disciplineSvc    *discipline.Service
	documentSvc      *document.Service
	internationalSvc *international.Service

	// ── Provincial Federation Services ──────────────────
	provincialSvc *provincial.Service

	// ── Provincial Phase 2 Stores ───────────────────────
	tournamentStore *provincial.InMemTournamentStore
	financeStore    *provincial.InMemFinanceStore
	certStore       *provincial.InMemCertStore
	disciplineStore *provincial.InMemDisciplineStore
	docStore        *provincial.InMemDocStore

	// ── Event Bus ──────────────────────────────────────────────
	eventBus *events.InMemoryBus
}

func New(cfg config.Config) *Server {
	originSet := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, origin := range cfg.AllowedOrigins {
		originSet[origin] = struct{}{}
	}

	baseStore, storageDriver, storageProvider := resolveStore(cfg)
	cachedStore := store.NewCachedStore(baseStore, cfg.CacheTTL, cfg.CacheMaxEntries)

	wfRepo := adapter.NewMemWorkflowRepo()

	s := &Server{
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
		rateLimiter:     newRateLimiter(10, time.Second, 100), // 100 burst, 10/s refill

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

		// ── Wire National Federation Services ────────────
		federationSvc: federation.NewService(
			adapter.NewMemProvinceRepo(),
			adapter.NewMemUnitRepo(),
			adapter.NewMemPersonnelRepo(),
			newUUID,
		),
		approvalSvc: approval.NewService( // Use the extracted wfRepo
			wfRepo,
			adapter.NewMemRequestRepo(),
			adapter.NewMemStepRepo(),
			adapter.NewMemHistoryRepo(),
			newUUID,
		),
		workflowRepo:     wfRepo, // Assign to s.workflowRepo
		certificationSvc: certification.NewService(adapter.NewMemCertRepo(), newUUID),
		disciplineSvc:    discipline.NewService(adapter.NewMemCaseRepo(), adapter.NewMemHearingRepo(), newUUID),
		documentSvc:      document.NewService(adapter.NewMemDocumentRepo(), newUUID),
		internationalSvc: international.NewService(
			adapter.NewMemPartnerRepo(),
			adapter.NewMemIntlEventRepo(),
			adapter.NewMemDelegationRepo(),
		),

		// ── Wire Provincial Services ─────────────────
		provincialSvc: provincial.NewService(
			provincial.NewInMemAssociationStore(),
			provincial.NewInMemSubAssociationStore(),
			provincial.NewInMemClubStore(),
			provincial.NewInMemAthleteStore(),
			provincial.NewInMemCoachStore(),
			provincial.NewInMemRefereeStore(),
			provincial.NewInMemCommitteeStore(),
			provincial.NewInMemTransferStore(),
			provincial.NewInMemClubClassStore(),
			provincial.NewInMemClubMemberStore(),
			provincial.NewInMemClubFinanceEntryStore(),
			provincial.NewInMemVoSinhStore(),
			newUUID,
		),

		// ── Wire Provincial Phase 2 Stores ──────────
		tournamentStore: provincial.NewInMemTournamentStore(),
		financeStore:    provincial.NewInMemFinanceStore(),
		certStore:       provincial.NewInMemCertStore(),
		disciplineStore: provincial.NewInMemDisciplineStore(),
		docStore:        provincial.NewInMemDocStore(),

		eventBus: events.NewBus(),
	}

	// Wire JWT validation into WebSocket hub for first-message auth
	if !cfg.DisableAuthForData {
		s.realtimeHub.SetAuthValidator(func(token string) error {
			_, err := s.authService.AuthenticateAccessToken(token, auth.RequestContext{})
			return err
		})
	}

	// Wire EventBus → WebSocket hub: broadcast domain events to connected clients
	s.eventBus.Subscribe(func(event events.DomainEvent) {
		s.broadcastEntityChange(
			event.EntityType,
			string(event.Type),
			event.EntityID,
			event.Payload,
			map[string]any{"actor_id": event.ActorID, "timestamp": event.Timestamp},
		)
	})

	// Seed default approval workflow definitions into the repository
	s.seedDefaultWorkflows()

	return s
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
	mux.HandleFunc("/api/v1/auth/register", s.handleAuthRegister)
	mux.HandleFunc("/api/v1/auth/switch-context", s.withAuth(s.handleAuthSwitchContext))
	mux.HandleFunc("/api/v1/auth/my-roles", s.withAuth(s.handleAuthMyRoles))
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
	// ── Approval Engine ─────────────────────────────────────
	s.handleApprovalRoutes(mux)
	// ── Finance V2 ──────────────────────────────────────────
	mux.HandleFunc("/api/v1/finance/invoices/", s.withAuth(s.handleInvoiceGet))
	mux.HandleFunc("/api/v1/finance/invoices", s.withAuth(s.handleInvoiceList))
	mux.HandleFunc("/api/v1/finance/payments/", s.withAuth(s.handlePaymentConfirm))
	mux.HandleFunc("/api/v1/finance/payments", s.withAuth(s.handlePaymentRecord))
	mux.HandleFunc("/api/v1/finance/fee-schedules", s.withAuth(s.handleFeeScheduleList))
	mux.HandleFunc("/api/v1/finance/budgets", s.withAuth(s.handleBudgetList))
	mux.HandleFunc("/api/v1/finance/sponsorships/", s.withAuth(s.handleSponsorshipList))
	mux.HandleFunc("/api/v1/finance/sponsorships", s.withAuth(s.handleSponsorshipCreate))
	// ── Bracket & Tournament Orchestration ───────────────────
	mux.HandleFunc("/api/v1/brackets/", s.withAuth(s.handleAssignMedals))
	mux.HandleFunc("/api/v1/tournaments-action/open-registration", s.withAuth(s.handleTournamentOpenRegistration))
	mux.HandleFunc("/api/v1/tournaments-action/lock-registration", s.withAuth(s.handleTournamentLockRegistration))
	mux.HandleFunc("/api/v1/tournaments-action/start", s.withAuth(s.handleTournamentStart))
	mux.HandleFunc("/api/v1/tournaments-action/end", s.withAuth(s.handleTournamentEnd))
	mux.HandleFunc("/api/v1/tournaments-action/generate-bracket", s.withAuth(s.handleBracketGenerate))
	mux.HandleFunc("/api/v1/tournaments-action/brackets", s.withAuth(s.handleBracketGet))
	// ── Registration Validation ──────────────────────────────
	mux.HandleFunc("/api/v1/registrations/validate", s.withAuth(s.handleRegistrationValidate))
	// ── Team Approval Actions ────────────────────────────────
	mux.HandleFunc("/api/v1/teams-action/approve", s.withAuth(s.handleTeamApprove))
	mux.HandleFunc("/api/v1/teams-action/reject", s.withAuth(s.handleTeamReject))
	mux.HandleFunc("/api/v1/teams-action/checkin", s.withAuth(s.handleTeamCheckin))
	// ── Federation (National Level) ──────────────────────────
	s.handleFederationRoutes(mux)
	// ── Official Documents ───────────────────────────────────
	s.handleDocumentRoutes(mux)
	// ── Discipline & Sanctions ───────────────────────────────
	s.handleDisciplineRoutes(mux)
	// ── Certification ────────────────────────────────────────
	s.handleCertificationRoutes(mux)
	// ── International Relations ──────────────────────────────
	s.handleInternationalRoutes(mux)
	// ── Provincial (Provincial Level) ───────────────────
	s.handleProvincialRoutes(mux)
	// ── Provincial Phase 2 (Tournament, Finance, etc.) ──
	s.handleProvincialPhase2Routes(mux)
	// ── Club Internal Management ────────────────────────
	s.handleClubInternalRoutes(mux)
	// ── Domain Events ────────────────────────────────────────
	mux.HandleFunc("/api/v1/events/recent", s.withAuth(s.handleRecentEvents))
	// Generic entity CRUD (catch-all for unmigrated entities)
	mux.HandleFunc("/api/v1/", s.handleEntityRoutes)
	return withRecover(withRequestID(withRateLimit(s.rateLimiter)(withBodyLimit(s.withCORS(s.withLogging(mux))))))
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
	// WebSocket authentication is handled via first-message auth
	// (client sends {"action":"auth","token":"xxx"} after connection opens)
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
	// 1. Close all WebSocket connections gracefully
	if s.realtimeHub != nil {
		s.realtimeHub.Close()
	}
	// 2. Stop auth cleanup goroutine
	if s.authService != nil {
		s.authService.Stop()
	}
	// 3. Close data store
	if s.store != nil {
		return s.store.Close()
	}
	return nil
}

// newUUID generates a v4 UUID string used by federation domain services.
func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
