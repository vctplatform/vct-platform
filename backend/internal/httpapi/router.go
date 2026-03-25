package httpapi

import (
	"net/http"

	"vct-platform/backend/internal/apiversioning"
	"vct-platform/backend/internal/domain/divisions"
	"vct-platform/backend/internal/metrics"
)

// Handler returns the fully wired HTTP handler with CORS, logging, and middleware chain.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/readyz", s.handleReadiness)
	mux.Handle("/metrics", s.metricsRegistry.ExposeHandler())

	// API Documentation (OpenAPI / Scalar UI)
	mux.HandleFunc("/api/docs", s.handleAPIDocs)
	mux.HandleFunc("/api/openapi.yaml", s.handleAPISpec)

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
	// VCT Marketplace
	mux.HandleFunc("/api/v1/marketplace/products/", s.handleMarketplaceProductDetail)
	mux.HandleFunc("/api/v1/marketplace/products", s.handleMarketplaceProducts)
	mux.HandleFunc("/api/v1/marketplace/orders", s.handleMarketplaceOrders)
	mux.HandleFunc("/api/v1/marketplace/stats", s.handleMarketplaceStats)
	mux.HandleFunc("/api/v1/marketplace/seller/dashboard", s.withAuth(s.handleMarketplaceSellerDashboard))
	mux.HandleFunc("/api/v1/marketplace/seller/products/", s.withAuth(s.handleMarketplaceSellerProductDetail))
	mux.HandleFunc("/api/v1/marketplace/seller/products", s.withAuth(s.handleMarketplaceSellerProducts))
	mux.HandleFunc("/api/v1/marketplace/seller/orders/", s.withAuth(s.handleMarketplaceSellerOrderDetail))
	mux.HandleFunc("/api/v1/marketplace/seller/orders", s.withAuth(s.handleMarketplaceSellerOrders))
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

	return apiversioning.Middleware(s.versionRegistry)(
		metrics.HTTPMiddleware(s.metricsRegistry)(
			withRecover(
				withRequestID(
					withSecurityHeaders(
						withRateLimit(s.rateLimiter)(
							withBodyLimit(
								s.withCSRF(
									s.withCORS(
										s.withLogging(mux),
									),
								),
							),
						),
					),
				),
			),
		),
	)
}
