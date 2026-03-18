package httpapi

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // registers "pgx" driver for database/sql

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/config"
	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/athlete"
	"vct-platform/backend/internal/domain/btc"
	"vct-platform/backend/internal/domain/certification"
	clubdomain "vct-platform/backend/internal/domain/club"
	"vct-platform/backend/internal/domain/community"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/divisions"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/domain/heritage"
	"vct-platform/backend/internal/domain/international"
	"vct-platform/backend/internal/domain/organization"
	"vct-platform/backend/internal/domain/parent"
	"vct-platform/backend/internal/domain/provincial"
	"vct-platform/backend/internal/domain/ranking"
	"vct-platform/backend/internal/domain/scoring"
	"vct-platform/backend/internal/domain/support"
	"vct-platform/backend/internal/domain/tournament"
	"vct-platform/backend/internal/email"
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
	cfg              config.Config
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

	// ── Athlete Profile Service ─────────────────────────
	athleteProfileSvc  *athlete.ProfileService
	trainingSessionSvc *athlete.TrainingService

	// ── Provincial Federation Services ──────────────────
	provincialSvc *provincial.Service

	// ── Provincial Phase 2 Stores ───────────────────────
	tournamentStore provincial.TournamentStore
	financeStore    provincial.FinanceStore
	certStore       provincial.CertStore
	disciplineStore provincial.DisciplineStore
	docStore        provincial.DocStore

	// ── BTC (Ban Tổ Chức giải) ──────────────────────────────
	btcSvc *btc.Service

	// ── Event Bus ──────────────────────────────────────────────
	eventBus *events.InMemoryBus

	// ── Parent / Guardian Service ──────────────────────────────
	parentSvc *parent.Service

	// ── Club Module (Attendance, Equipment, Facilities) ─────
	clubSvc *clubdomain.Service

	// ── Tournament Management Service ─────────────────────────
	tournamentMgmtSvc *tournament.MgmtService

	// ── Customer Support & Technical Assistance ─────────────
	supportSvc *support.Service

	// ── Subscription & Billing ──────────────────────────────
	subscriptionSvc *finance.SubscriptionService

	// ── SQL DB (for PG adapters when storage driver is postgres) ──
	sqlDB *sql.DB

	// ── Email Service (Resend) ────────────────────────────────
	emailService *email.Service
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
		store:            cachedStore,
		cachedStore:      cachedStore,
		storageDriver:    storageDriver,
		storageProvider:  storageProvider,
		realtimeHub:      realtime.NewHub(cfg.AllowedOrigins),
		allowedEntities:  defaultEntitySet(),
		allowedOrigins:   originSet,
		rateLimiter:      newRateLimiter(10, time.Second, 100), // 100 burst, 10/s refill
		loginRateLimiter: newRateLimiter(1, time.Second, 5),    // 5 burst, 1/s — stricter for auth

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
			adapter.NewPgProvinceRepo(cachedStore),
			adapter.NewPgUnitRepo(cachedStore),
			adapter.NewPgPersonnelRepo(cachedStore),
			adapter.NewPgMasterDataStore(cachedStore),
			newUUID,
		),
		approvalSvc: approval.NewService( // Use the extracted wfRepo
			wfRepo,
			adapter.NewPgRequestRepo(cachedStore),
			adapter.NewPgStepRepo(cachedStore),
			adapter.NewPgHistoryRepo(cachedStore),
			newUUID,
		),
		workflowRepo:     wfRepo, // Assign to s.workflowRepo
		certificationSvc: certification.NewService(adapter.NewPgCertAdminRepo(cachedStore), newUUID),
		disciplineSvc:    discipline.NewService(adapter.NewPgCaseRepo(cachedStore), adapter.NewPgHearingRepo(cachedStore), newUUID),
		documentSvc:      document.NewService(adapter.NewPgDocumentRepo(cachedStore), newUUID),
		internationalSvc: international.NewService(
			adapter.NewPgPartnerRepo(cachedStore),
			adapter.NewPgIntlEventRepo(cachedStore),
			adapter.NewPgDelegationRepo(cachedStore),
		),

		// ── Wire Athlete Profile Service ─────────────
		athleteProfileSvc: athlete.NewProfileService(
			athlete.NewInMemProfileStore(),
			athlete.NewInMemMembershipStore(),
			athlete.NewInMemEntryStore(),
			newUUID,
		), // overridden below when PG is available
		trainingSessionSvc: athlete.NewTrainingService(
			athlete.NewInMemTrainingStore(),
			newUUID,
		),

		// ── Wire Provincial Services ─────────────────
		provincialSvc: provincial.NewService(
			adapter.NewPgAssociationRepo(cachedStore),
			adapter.NewPgSubAssociationRepo(cachedStore),
			adapter.NewPgClubRepo(cachedStore),
			adapter.NewPgAthleteRepo(cachedStore),
			adapter.NewPgCoachRepo(cachedStore),
			adapter.NewPgRefereeRepo(cachedStore),
			adapter.NewPgRefereeCertRepo(cachedStore),
			adapter.NewPgCommitteeRepo(cachedStore),
			adapter.NewPgTransferRepo(cachedStore),
			adapter.NewPgClubClassRepo(cachedStore),
			adapter.NewPgClubMemberRepo(cachedStore),
			adapter.NewPgClubFinanceRepo(cachedStore),
			adapter.NewPgVoSinhRepo(cachedStore),
			adapter.NewPgBeltHistoryRepo(cachedStore),
			newUUID,
		),

		// ── Wire Provincial Phase 2 Stores ──────────
		tournamentStore: adapter.NewPgTournamentStore(cachedStore),
		financeStore:    adapter.NewPgFinanceStore(cachedStore),
		certStore:       adapter.NewPgCertStore(cachedStore),
		disciplineStore: adapter.NewPgDisciplineStore(cachedStore),
		docStore:        adapter.NewPgDocStore(cachedStore),

		// ── Wire BTC Service ─────────────────────────
		btcSvc: btc.NewService(btc.NewInMemStore(), newUUID),

		eventBus: events.NewBus(),

		// ── Wire Parent Service ──────────────────────────
		parentSvc: parent.NewService(
			parent.NewInMemParentLinkStore(),
			parent.NewInMemConsentStore(),
			parent.NewInMemAttendanceStore(),
			parent.NewInMemResultStore(),
			newUUID,
		),

		// ── Wire Club Module (Attendance, Equipment, Facilities) ──
		clubSvc: clubdomain.NewService(
			clubdomain.NewInMemAttendanceStore(),
			clubdomain.NewInMemEquipmentStore(),
			clubdomain.NewInMemFacilityStore(),
			newUUID,
		), // overridden below when PG is available

		// ── Wire Tournament Management Service ──────────
		tournamentMgmtSvc: tournament.NewMgmtService(
			adapter.NewInMemTournamentMgmtStore(),
			newUUID,
		), // overridden below when PG is available

		// ── Email Service (Resend for OTP) ────────────────
		emailService: email.NewService(cfg.ResendAPIKey, cfg.ResendFromEmail),

		// ── Wire Customer Support Service ────────────────
		supportSvc: support.NewService(
			support.NewInMemTicketRepo(),
			support.NewInMemCategoryRepo(),
			support.NewInMemFAQRepo(),
			newUUID,
		),

		// ── Wire Subscription & Billing Service ───────────
		subscriptionSvc: finance.NewSubscriptionService(
			finance.NewInMemPlanRepo(),
			finance.NewInMemSubRepo(),
			finance.NewInMemBillingRepo(),
			finance.NewInMemRenewalRepo(),
			nil, // invoice repo — will wire when invoice store is available
			newUUID,
		),
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

	// ── Upgrade to PG adapters when storage driver is postgres ──
	if storageDriver == "postgres" && cfg.PostgresURL != "" {
		db, err := sql.Open("pgx", cfg.PostgresURL)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err != nil {
			log.Fatalf("PG adapters: sql.Open failed (%v)", err)
		} else if err := db.PingContext(ctx); err != nil {
			_ = db.Close()
			log.Fatalf("PG adapters: db.PingContext failed (%v)", err)
		} else {
			s.sqlDB = db
			log.Println("PG adapters: connected — wiring PostgreSQL stores")

			// Re-create auth service with DB for persistent user storage
			s.authService.Stop() // stop existing cleanup goroutine
			s.authService = auth.NewService(auth.ServiceConfig{
				Secret:          cfg.JWTSecret,
				Issuer:          cfg.JWTIssuer,
				AccessTTL:       cfg.AccessTokenTTL,
				RefreshTTL:      cfg.RefreshTokenTTL,
				AuditLimit:      cfg.AuditLimit,
				CleanupInterval: 5 * time.Minute,
				AllowDemoUsers:  cfg.AllowDemoUsers,
				CredentialsJSON: cfg.BootstrapUsersJSON,
				DB:              db, // enable persistent user storage
			})
			log.Println("PG adapters: auth service re-created with database user store")

			// Club module
			s.clubSvc = clubdomain.NewService(
				adapter.NewPgAttendanceStore(db),
				adapter.NewPgEquipmentStore(db),
				adapter.NewPgFacilityStore(db),
				newUUID,
			)

			// Athlete profile module
			s.athleteProfileSvc = athlete.NewProfileService(
				adapter.NewPgAthleteProfileRepo(db),
				adapter.NewPgClubMembershipRepo(db),
				adapter.NewPgTournamentEntryRepo(db),
				newUUID,
			)

			// Scoring module
			s.scoringService = scoring.NewService(
				adapter.NewPgScoringRepository(db),
				scoring.DefaultScoringConfig(),
			)

			// Tournament management
			s.tournamentMgmtSvc = tournament.NewMgmtService(
				adapter.NewPgTournamentMgmtStore(db),
				newUUID,
			)

			// BTC module (Ban Tổ Chức)
			s.btcSvc = btc.NewService(adapter.NewPgBTCStore(db), newUUID)

			// Parent/Guardian module
			s.parentSvc = parent.NewService(
				adapter.NewPgParentLinkStore(db),
				adapter.NewPgConsentStore(db),
				adapter.NewPgParentAttendanceStore(db),
				adapter.NewPgParentResultStore(db),
				newUUID,
			)

			// Subscription & Billing
			s.subscriptionSvc = finance.NewSubscriptionService(
				finance.NewPgPlanRepo(db),
				finance.NewPgSubRepo(db),
				finance.NewPgBillingRepo(db),
				finance.NewPgRenewalRepo(db),
				nil, // invoice repo will be provided later
				newUUID,
			)
		}
	}

	// Wire provincial in-memory repos into federation service
	s.federationSvc.SetProvincialRepos(
		adapter.NewMemProvincialClubRepo(),
		adapter.NewMemProvincialAthleteRepo(),
		adapter.NewMemProvincialCoachRepo(),
		adapter.NewMemProvincialReportRepo(),
	)

	// Wire PR, International, Workflow in-memory stores
	s.federationSvc.SetExtendedStores(
		federation.NewMemPRStore(),
		federation.NewMemIntlStore(),
		federation.NewMemWorkflowStore(),
	)

	return s
}

// Handler returns the fully wired HTTP handler with CORS and logging.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/readyz", s.handleReadiness)
	mux.HandleFunc("/api/v1/ws", s.handleWebSocket)
	// Auth routes — stricter rate limiting + smaller body limit for login/register
	loginRL := withRateLimit(s.loginRateLimiter)
	loginBody := withBodyLimitSize(2 * 1024) // 2KB body limit
	mux.Handle("/api/v1/auth/login", loginRL(loginBody(http.HandlerFunc(s.handleAuthLogin))))
	mux.Handle("/api/v1/auth/register", loginRL(loginBody(http.HandlerFunc(s.handleAuthRegister))))
	mux.HandleFunc("/api/v1/auth/refresh", s.handleAuthRefresh)
	mux.HandleFunc("/api/v1/auth/me", s.withAuth(s.handleAuthMe))
	mux.HandleFunc("/api/v1/auth/logout", s.withAuth(s.handleAuthLogout))
	mux.HandleFunc("/api/v1/auth/revoke", s.withAuth(s.handleAuthRevoke))
	mux.HandleFunc("/api/v1/auth/audit", s.withAuth(s.handleAuthAudit))
	mux.HandleFunc("/api/v1/auth/switch-context", s.withAuth(s.handleAuthSwitchContext))
	mux.HandleFunc("/api/v1/auth/my-roles", s.withAuth(s.handleAuthMyRoles))
	// OTP routes — same rate limit as login
	mux.Handle("/api/v1/auth/send-otp", loginRL(loginBody(http.HandlerFunc(s.handleAuthSendOTP))))
	mux.Handle("/api/v1/auth/verify-otp", loginRL(loginBody(http.HandlerFunc(s.handleAuthVerifyOTP))))
	// Scoring API (requires auth)
	mux.HandleFunc("/api/v1/scoring/", s.handleScoringRoutes)
	// Public API (no auth)
	mux.HandleFunc("/api/v1/public/", s.handlePublicRoutes)
	// Specific domain entities — Use subtree patterns only to avoid 307 redirects
	// in Go 1.22+ ServeMux (exact + subtree double registration causes 307).
	mux.HandleFunc("/api/v1/athletes/", s.handleAthleteRoutes)
	mux.HandleFunc("/api/v1/teams/", s.handleTeamRoutes)
	mux.HandleFunc("/api/v1/referees/", s.handleRefereeRoutes)
	mux.HandleFunc("/api/v1/arenas/", s.handleArenaRoutes)
	mux.HandleFunc("/api/v1/registration/", s.handleRegistrationRoutes)
	mux.HandleFunc("/api/v1/tournaments/", s.handleTournamentRoutes)
	// Ranking
	mux.HandleFunc("/api/v1/rankings/", s.handleRankingRoutes)
	// Heritage
	mux.HandleFunc("/api/v1/belts/", s.handleBeltRoutes)
	mux.HandleFunc("/api/v1/techniques/", s.handleTechniqueRoutes)
	// Finance
	mux.HandleFunc("/api/v1/transactions/", s.handleTransactionRoutes)
	mux.HandleFunc("/api/v1/budgets", s.handleBudgetRoutes)
	// Community
	mux.HandleFunc("/api/v1/clubs/", s.handleClubRoutes)
	mux.HandleFunc("/api/v1/members/", s.handleMemberRoutes)
	mux.HandleFunc("/api/v1/community-events/", s.handleCommunityEventRoutes)
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
	// ── Subscription & Billing ──────────────────────────────
	mux.HandleFunc("/api/v1/finance/plans/", s.withAuth(s.handlePlanRoutes))
	mux.HandleFunc("/api/v1/finance/plans", s.withAuth(s.handlePlanRoutes))
	mux.HandleFunc("/api/v1/finance/subscriptions/expiring", s.withAuth(s.handleExpiringSubscriptions))
	mux.HandleFunc("/api/v1/finance/subscriptions/", s.withAuth(s.handleSubscriptionDetail))
	mux.HandleFunc("/api/v1/finance/subscriptions", s.withAuth(s.handleSubscriptionRoutes))
	mux.HandleFunc("/api/v1/finance/billing-cycles/", s.withAuth(s.handleBillingCycleMarkPaid))
	mux.HandleFunc("/api/v1/finance/billing-cycles", s.withAuth(s.handleBillingCycleList))
	// ── Bracket & Tournament Orchestration ───────────────────
	mux.HandleFunc("/api/v1/brackets-action/assign-medals", s.withAuth(s.handleAssignMedals))
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
	// ── Federation Extended (PR, International, Workflow) ────
	s.handleExtendedFederationRoutes(mux)
	// ── Official Documents ───────────────────────────────────
	s.handleDocumentRoutes(mux)
	// ── Discipline & Sanctions ───────────────────────────────
	s.handleDisciplineRoutes(mux)
	// ── Certification ────────────────────────────────────────
	s.handleCertificationRoutes(mux)
	// ── International Relations ──────────────────────────────
	s.handleInternationalRoutes(mux)
	// ── Athlete Profiles ─────────────────────────────────
	s.handleAthleteProfileRoutes(mux)
	// ── Provincial (Provincial Level) ───────────────────
	s.handleProvincialRoutes(mux)
	// ── Provincial Phase 2 (Tournament, Finance, etc.) ──
	s.handleProvincialPhase2Routes(mux)
	// ── Club Internal Management ────────────────────────
	s.handleClubInternalRoutes(mux)
	// ── Club V2 (Attendance, Equipment, Facilities) ────
	s.handleClubV2Routes(mux)
	// ── BTC (Ban Tổ Chức giải) ─────────────────────────
	s.handleBTCRoutes(mux)
	// ── Parent / Guardian ──────────────────────────────────
	s.handleParentRoutes(mux)
	// ── Tournament Management ─────────────────────────────
	s.handleTournamentMgmtRoutes(mux)
	// ── Provincial Federation (CLB, VĐV, HLV cấp tỉnh) ──
	s.handleProvincialFederationRoutes(mux)
	// ── Administrative Divisions (Tỉnh/Xã/Phường) ──────────
	divisions.NewHandler().RegisterRoutes(mux)
	// ── Customer Support ─────────────────────────────────────
	s.handleSupportRoutes(mux)
	// ── Admin Module (System Health, Config, Users, Roles, Flags) ──
	s.handleAdminRoutes(mux)
	// ── Domain Events ────────────────────────────────────────
	mux.HandleFunc("/api/v1/events/recent", s.withAuth(s.handleRecentEvents))
	// Generic entity CRUD (catch-all for unmigrated entities)
	mux.HandleFunc("/api/v1/", s.handleEntityRoutes)
	return withRecover(withRequestID(withSecurityHeaders(withRateLimit(s.rateLimiter)(withBodyLimit(s.withCSRF(s.withCORS(s.withLogging(mux))))))))
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
		postgresURL := strings.TrimSpace(cfg.PostgresURL)
		if postgresURL == "" {
			log.Fatalf("VCT_STORAGE_DRIVER=postgres nhưng VCT_POSTGRES_URL trống")
		}

		postgresStore, err := store.NewPostgresStore(postgresURL, cfg.DBAutoMigrate)
		if err != nil {
			log.Fatalf("postgres init failed (%v)", err)
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

// newUUID generates a v4 UUID string used by federation domain services.
func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
