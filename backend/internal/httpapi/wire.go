package httpapi

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // registers "pgx" driver for database/sql

	"vct-platform/backend/internal/adapter"
	"vct-platform/backend/internal/apiversioning"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/shared/httputil"
	"vct-platform/backend/internal/cache"
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
	"vct-platform/backend/internal/worker"
	natsadapter "vct-platform/backend/internal/adapter/nats"
	// Decentralized Modules (Hybrid Architecture)
	athletemod "vct-platform/backend/internal/athlete"
	communitymod "vct-platform/backend/internal/community"
	federationmod "vct-platform/backend/internal/federation"
	financemod "vct-platform/backend/internal/finance"
	heritagemod "vct-platform/backend/internal/heritage"
	marketplacemod "vct-platform/backend/internal/marketplace"
	provincialmod "vct-platform/backend/internal/provincial"
	rankingmod "vct-platform/backend/internal/ranking"
	scoringmod "vct-platform/backend/internal/scoring"
	supportmod "vct-platform/backend/internal/support"
	tournamentmod "vct-platform/backend/internal/tournament"
	organizationmod "vct-platform/backend/internal/organization"
	clubmod "vct-platform/backend/internal/club"
	parentmod "vct-platform/backend/internal/parent"
)

// New creates a fully wired Server, resolving storage, injecting all domain
// services, and upgrading to PostgreSQL adapters when the driver is "postgres".
func New(cfg config.Config, logger *slog.Logger, modules ...httputil.Module) (*Server, error) {
	if logger == nil {
		logger = slog.Default()
	}

	redisCache, err := cache.NewRedisCache(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	originSet := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, origin := range cfg.AllowedOrigins {
		originSet[origin] = struct{}{}
	}

	baseStore, storageDriver, storageProvider, err := resolveStore(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("resolve store: %w", err)
	}
	cachedStore := store.NewCachedStore(baseStore, cfg.CacheTTL, cfg.CacheMaxEntries)

	wfRepo := adapter.NewMemWorkflowRepo()

	var (
		provRepo   federation.ProvinceRepository
		unitRepo   federation.FederationUnitRepository
		personRepo federation.PersonnelRepository
		masterRepo federation.MasterDataStore
	)

	if pgStore, ok := cachedStore.Base().(*store.PostgresStore); ok {
		pool := pgStore.Pool()
		provRepo = adapter.NewSqlProvinceRepo(pool)
		unitRepo = adapter.NewSqlUnitRepo(pool)
		personRepo = adapter.NewSqlPersonnelRepo(pool)
		masterRepo = adapter.NewSqlMasterDataStore(pool)
	} else {
		provRepo = adapter.NewGenericProvinceRepo(cachedStore)
		unitRepo = adapter.NewGenericUnitRepo(cachedStore)
		personRepo = adapter.NewGenericPersonnelRepo(cachedStore)
		masterRepo = adapter.NewGenericMasterDataStore(cachedStore)
	}

	s := &Server{
		cfg:    cfg,
		logger: logger,
		authService: auth.NewService(auth.ServiceConfig{
			Secret:          cfg.JWTSecret,
			Issuer:          cfg.JWTIssuer,
			AccessTTL:       cfg.AccessTokenTTL,
			RefreshTTL:      cfg.RefreshTokenTTL,
			AuditLimit:      cfg.AuditLimit,
			AllowDemoUsers:  cfg.AllowDemoUsers,
			CredentialsJSON: cfg.BootstrapUsersJSON,
			Cache:           redisCache,
		}),
		store:            cachedStore,
		cachedStore:      cachedStore,
		storageDriver:    storageDriver,
		storageProvider:  storageProvider,
		realtimeHub:      realtime.NewHub(logger, cfg.AllowedOrigins...),
		allowedEntities:  defaultEntitySet(),
		allowedOrigins:   originSet,
		rateLimiter:      newRateLimiter(10, time.Second, 100), // 100 burst, 10/s refill
		loginRateLimiter: newRateLimiter(1, time.Second, 5),    // 5 burst, 1/s — stricter for auth
		metricsRegistry:  metrics.NewRegistry(),
		versionRegistry:  apiversioning.NewRegistry(),
		modules:          modules,

		Core: struct {
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
		}{
			Athlete: athlete.NewService(adapter.NewAthleteRepository(cachedStore)),
			Organization: organization.NewService(
				adapter.NewTeamRepository(cachedStore),
				adapter.NewRefereeRepository(cachedStore),
				adapter.NewArenaRepository(cachedStore),
			),
			Scoring:      scoring.NewService(adapter.NewScoringRepository(), scoring.DefaultScoringConfig()),
			Registration: scoring.NewRegistrationService(adapter.NewRegistrationRepository(cachedStore)),
			Tournament:   adapter.NewTournamentRepository(cachedStore),
			Ranking:      ranking.NewService(adapter.NewAthleteRankingRepository(cachedStore), adapter.NewTeamRankingRepository(cachedStore)),
			Heritage:     heritage.NewService(adapter.NewBeltRankRepository(cachedStore), adapter.NewTechniqueRepository(cachedStore)),
			Finance:      finance.NewService(adapter.NewTransactionRepository(cachedStore), adapter.NewBudgetRepository(cachedStore)),
			Community:    community.NewService(adapter.NewClubRepository(cachedStore), adapter.NewMemberRepository(cachedStore), adapter.NewEventRepository(cachedStore)),
			Club: clubdomain.NewService(
				adapter.NewInMemAttendanceStore(),
				adapter.NewInMemEquipmentStore(),
				adapter.NewInMemFacilityStore(),
				newUUID,
			),
		},

		Federation: struct {
			Main          *federation.Service
			Approval      *approval.Service
			WorkflowRepo  approval.WorkflowRepository
			Certification *certification.Service
			Discipline    *discipline.Service
			Document      *document.Service
			International *international.Service
		}{
			Main: federation.NewService(
				provRepo,
				unitRepo,
				personRepo,
				masterRepo,
				newUUID,
			),
			Approval: approval.NewService(
				wfRepo,
				adapter.NewPgRequestRepo(cachedStore),
				adapter.NewPgStepRepo(cachedStore),
				adapter.NewPgHistoryRepo(cachedStore),
				newUUID,
			),
			WorkflowRepo:  wfRepo,
			Certification: certification.NewService(adapter.NewPgCertAdminRepo(cachedStore), newUUID),
			Discipline:    discipline.NewService(adapter.NewPgCaseRepo(cachedStore), adapter.NewPgHearingRepo(cachedStore), newUUID),
			Document:      document.NewService(adapter.NewPgDocumentRepo(cachedStore), newUUID),
			International: international.NewService(
				adapter.NewPgPartnerRepo(cachedStore),
				adapter.NewPgIntlEventRepo(cachedStore),
				adapter.NewPgDelegationRepo(cachedStore),
			),
		},

		Provincial: struct {
			Main            *provincial.Service
			TournamentStore provincial.TournamentStore
			FinanceStore    provincial.FinanceStore
			CertStore       provincial.CertStore
			DisciplineStore provincial.DisciplineStore
			DocStore        provincial.DocStore
		}{
			Main: provincial.NewService(
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
			TournamentStore: adapter.NewPgTournamentStore(cachedStore),
			FinanceStore:    adapter.NewPgFinanceStore(cachedStore),
			CertStore:       adapter.NewPgCertStore(cachedStore),
			DisciplineStore: adapter.NewPgDisciplineStore(cachedStore),
			DocStore:        adapter.NewPgDocStore(cachedStore),
		},

		Extended: struct {
			AthleteProfile  *athlete.ProfileService
			TrainingSession *athlete.TrainingService
			BTC             *btc.Service
			Parent          *parent.Service
			TournamentMgmt  *tournament.MgmtService
			Marketplace     *marketplace.Service
			Support         *support.Service
			Subscription    *finance.SubscriptionService
		}{
			AthleteProfile: athlete.NewProfileService(
				athlete.NewInMemProfileStore(),
				athlete.NewInMemMembershipStore(),
				athlete.NewInMemEntryStore(),
				newUUID,
			),
			TrainingSession: athlete.NewTrainingService(
				athlete.NewInMemTrainingStore(),
				newUUID,
			),
			BTC: btc.NewService(btc.NewInMemStore(), newUUID),
			Parent: parent.NewService(
				parent.NewInMemParentLinkStore(),
				parent.NewInMemConsentStore(),
				parent.NewInMemAttendanceStore(),
				parent.NewInMemResultStore(),
				newUUID,
			),
			TournamentMgmt: tournament.NewMgmtService(
				adapter.NewInMemTournamentMgmtStore(),
				newUUID,
			),
			Marketplace: marketplace.NewService(
				adapter.NewMarketplaceProductRepository(cachedStore),
				adapter.NewMarketplaceOrderRepository(cachedStore),
				newUUID,
			),
			Support: support.NewService(
				support.NewInMemTicketRepo(),
				support.NewInMemCategoryRepo(),
				support.NewInMemFAQRepo(),
				newUUID,
			),
			Subscription: finance.NewSubscriptionService(
				adapter.NewInMemPlanRepo(),
				adapter.NewInMemSubRepo(),
				adapter.NewInMemBillingRepo(),
				adapter.NewInMemRenewalRepo(),
				nil,
				newUUID,
			),
		},

		eventBus:     events.NewBus(),
		taskPublisher: worker.NewLogPublisher(logger),
		emailService: email.NewResendProvider(cfg.ResendAPIKey, cfg.ResendFromEmail),
	}

	// Connect to NATS JetStream if provided
	if cfg.NatsURL != "" {
		natsClient, err := natsadapter.NewClient(context.Background(), cfg.NatsURL, logger)
		if err != nil {
			logger.Warn("Failed to connect to NATS, using fallback LogPublisher", "err", err)
		} else {
			s.taskPublisher = worker.NewNatsPublisher(natsClient.JetStream(), "vct_worker_tasks")
			logger.Info("NATS Publisher wired to API Server", "stream", "vct_worker_tasks")
		}
	}

	if s.realtimeHub != nil {
		go s.realtimeHub.Run(context.Background())
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
		s.BroadcastEntityChange(
			event.EntityType,
			string(event.Type),
			event.EntityID,
			event.Payload,
			map[string]any{"actor_id": event.ActorID, "timestamp": event.Timestamp},
		)
	})

	// Seed default approval workflows (deferred to after federation module init)

	// ── Upgrade to PG adapters when storage driver is postgres ──
	if storageDriver == "postgres" && cfg.PostgresURL != "" {
		db, err := sql.Open("pgx", cfg.PostgresURL)
		if err != nil {
			return nil, fmt.Errorf("PG adapters: sql.Open failed: %w", err)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("PG adapters: db.PingContext failed: %w", err)
		}

		s.sqlDB = db
		s.replicaDB = db
		logger.Info("PG adapters connected — wiring PostgreSQL stores")

		if cfg.PostgresReplicaURL != "" {
			rdb, err := sql.Open("pgx", cfg.PostgresReplicaURL)
			if err != nil {
				logger.Warn("PG adapters: replica connection failed, falling back to master", "err", err)
			} else {
				ctxReplica, cancelReplica := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancelReplica()
				if err := rdb.PingContext(ctxReplica); err != nil {
					_ = rdb.Close()
					logger.Warn("PG adapters: replica ping failed, falling back to master", "err", err)
				} else {
					s.replicaDB = rdb
					logger.Info("PG adapters: replica DB connected for OLAP workloads")
				}
			}
		}

		// Re-create auth service with DB for persistent user storage
		s.authService.Stop()
		s.authService = auth.NewService(auth.ServiceConfig{
			Secret:          cfg.JWTSecret,
			Issuer:          cfg.JWTIssuer,
			AccessTTL:       cfg.AccessTokenTTL,
			RefreshTTL:      cfg.RefreshTokenTTL,
			AuditLimit:      cfg.AuditLimit,
			AllowDemoUsers:  cfg.AllowDemoUsers,
			CredentialsJSON: cfg.BootstrapUsersJSON,
			DBStore:         cachedStore.Base().(*store.PostgresStore),
			Cache:           redisCache,
		})
		logger.Info("auth service re-created with database user store")

		// Club module
		s.Core.Club = clubdomain.NewService(
			adapter.NewPgAttendanceStore(db),
			adapter.NewPgEquipmentStore(db),
			adapter.NewPgFacilityStore(db),
			newUUID,
		)

		// Athlete profile module
		s.Extended.AthleteProfile = athlete.NewProfileService(
			adapter.NewPgAthleteProfileRepo(db),
			adapter.NewPgClubMembershipRepo(db),
			adapter.NewPgTournamentEntryRepo(db),
			newUUID,
		)

		// Scoring module
		s.Core.Scoring = scoring.NewService(
			adapter.NewPgScoringRepository(db),
			scoring.DefaultScoringConfig(),
		)

		// Tournament management
		s.Extended.TournamentMgmt = tournament.NewMgmtService(
			adapter.NewPgTournamentMgmtStore(db),
			newUUID,
		)

		// VCT Marketplace
		s.Extended.Marketplace = marketplace.NewService(
			adapter.NewPgMarketplaceProductRepo(db),
			adapter.NewPgMarketplaceOrderRepo(db),
			newUUID,
		)

		// BTC module (Ban Tổ Chức)
		s.Extended.BTC = btc.NewService(adapter.NewPgBTCStore(db), newUUID)

		// Parent/Guardian module
		s.Extended.Parent = parent.NewService(
			adapter.NewPgParentLinkStore(db),
			adapter.NewPgConsentStore(db),
			adapter.NewPgParentAttendanceStore(db),
			adapter.NewPgParentResultStore(db),
			newUUID,
		)

		// Subscription & Billing
		s.Extended.Subscription = finance.NewSubscriptionService(
			adapter.NewPgPlanRepo(db),
			adapter.NewPgSubRepo(db),
			adapter.NewPgBillingRepo(db),
			adapter.NewPgRenewalRepo(db),
			nil, // invoice repo will be provided later
			newUUID,
		)
	}

	// Wire provincial in-memory repos into federation service
	s.Federation.Main.SetProvincialRepos(
		adapter.NewMemProvincialClubRepo(),
		adapter.NewMemProvincialAthleteRepo(),
		adapter.NewMemProvincialCoachRepo(),
		adapter.NewMemProvincialReportRepo(),
	)

	// Wire PR, International, Workflow in-memory stores
	s.Federation.Main.SetExtendedStores(
		federation.NewMemPRStore(),
		federation.NewMemIntlStore(),
		federation.NewMemWorkflowStore(),
	)

	s.seedDefaultMarketplaceData()

	s.versionRegistry.Register(apiversioning.Version{
		Name:       "v1",
		Status:     apiversioning.StatusActive,
		ReleasedAt: time.Now().UTC(),
	})

	// ── Hybrid Architecture Modules Registration ──────────
	// These modules are self-contained and self-registering.
	// We instantiate them and pass them as variadic arguments to New().
	// For now, we instantiate them INSIDE New for simplicity, but in a
	// pure DI container they would be passed in.

	authFn := func(r *http.Request) (string, error) {
		p, err := s.principalFromRequest(r)
		if err != nil {
			return "", err
		}
		return p.User.ID, nil
	}

	// 1. Scoring Module
	scoringMod := scoringmod.New(scoringmod.Deps{
		DB:           s.sqlDB,
		Logger:       logger,
		Broadcaster:  s,
		AuthFn:       authFn,
		Config:       scoring.DefaultScoringConfig(),
		Registration: s.Core.Registration,
	})

	// 2. Heritage Module
	heritageMod := heritagemod.New(heritagemod.Deps{
		Service:     s.Core.Heritage,
		Logger:      logger,
		Broadcaster: s,
		AuthFn:      authFn,
	})

	// 3. Ranking Module
	rankingMod := rankingmod.New(rankingmod.Deps{
		Service: s.Core.Ranking,
		Logger:  logger,
		AuthFn:  authFn,
	})

	// 4. Athlete Module
	athleteMod := athletemod.New(athletemod.Deps{
		Service:     s.Core.Athlete,
		Profile:     s.Extended.AthleteProfile,
		Training:    s.Extended.TrainingSession,
		Broadcaster: s,
		AuthFn:      authFn,
		Logger:      logger,
	})

	// 5. Community Module
	communityMod := communitymod.New(communitymod.Deps{
		Service:     s.Core.Community,
		Broadcaster: s,
		Logger:      logger,
	})

	// 6. Support Module
	supportMod := supportmod.New(supportmod.Deps{
		Service: s.Extended.Support,
		Logger:  logger,
	})

	// 7. Marketplace Module
	marketplaceMod := marketplacemod.New(marketplacemod.Deps{
		Service:     s.Extended.Marketplace,
		Broadcaster: s,
		Logger:      logger,
	})

	// 8. Tournament Module
	tournamentMod := tournamentmod.New(tournamentmod.Deps{
		Service:     s.Core.Tournament,
		Mgmt:        s.Extended.TournamentMgmt,
		BTC:         s.Extended.BTC,
		Broadcaster: s,
		Logger:      logger,
	})

	// 9. Finance Module
	financeMod := financemod.New(financemod.Deps{
		Service:      s.Core.Finance,
		Subscription: s.Extended.Subscription,
		Logger:       logger,
	})

	// 10. Federation Module
	federationMod := federationmod.New(federationmod.Deps{
		Main:          s.Federation.Main,
		Approval:      s.Federation.Approval,
		Certification: s.Federation.Certification,
		Discipline:    s.Federation.Discipline,
		Document:      s.Federation.Document,
		International: s.Federation.International,
		AuthFn:        authFn,
		Broadcaster:   s,
		Logger:        logger,
	})

	// Seed default approval workflow definitions via federation module
	federationMod.SeedDefaultWorkflows(context.Background(), s.Federation.WorkflowRepo)

	// 11. Provincial Module
	provincialMod := provincialmod.New(provincialmod.Deps{
		Service:         s.Provincial.Main,
		FedService:      s.Federation.Main,
		TournamentStore: s.Provincial.TournamentStore,
		FinanceStore:    s.Provincial.FinanceStore,
		CertStore:       s.Provincial.CertStore,
		DisciplineStore: s.Provincial.DisciplineStore,
		DocStore:        s.Provincial.DocStore,
		AuthFn:          authFn,
		Logger:          logger,
	})

	// 12. Organization Module
	organizationMod := organizationmod.New(organizationmod.Deps{
		Service:     s.Core.Organization,
		Broadcaster: s,
		Logger:      logger,
	})

	// 13. Club Module
	clubMod := clubmod.New(clubmod.Deps{
		Service:     s.Core.Club,
		Broadcaster: s,
		Logger:      logger,
	})
	
	// 14. Parent Module
	parentMod := parentmod.New(parentmod.Deps{
		Service:     s.Extended.Parent,
		AuthFn:      authFn,
		Logger:      logger,
	})

	// Add to modules slice
	s.modules = append(s.modules,
		scoringMod, heritageMod, rankingMod, athleteMod, communityMod,
		supportMod, marketplaceMod, tournamentMod, financeMod,
		federationMod, provincialMod, organizationMod, clubMod, parentMod,
	)

	return s, nil
}

// resolveStore creates the appropriate DataStore based on configuration.
func resolveStore(cfg config.Config, logger *slog.Logger) (store.DataStore, string, string, error) {
	driver := strings.ToLower(strings.TrimSpace(cfg.StorageDriver))
	if driver == "postgres" {
		postgresURL := strings.TrimSpace(cfg.PostgresURL)
		if postgresURL == "" {
			return nil, "", "", fmt.Errorf("VCT_STORAGE_DRIVER=postgres but VCT_POSTGRES_URL is empty")
		}

		postgresStore, err := store.NewPostgresStore(postgresURL, cfg.DBAutoMigrate)
		if err != nil {
			return nil, "", "", fmt.Errorf("postgres init failed: %w", err)
		}

		provider := strings.ToLower(strings.TrimSpace(cfg.PostgresProvider))
		if provider == "" {
			provider = "selfhost"
		}
		logger.Info("storage initialized", slog.String("driver", "postgres"), slog.String("provider", provider))
		return postgresStore, "postgres", provider, nil
	}

	logger.Info("storage initialized", slog.String("driver", "memory"))
	return store.NewStore(), "memory", "memory", nil
}
