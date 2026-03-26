package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/finance"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SUBSCRIPTION & BILLING API HANDLERS
// Manages subscription plans, active subscriptions, billing
// cycles, and renewal history.
// ═══════════════════════════════════════════════════════════════

// ── Helper: domain error → HTTP status ──────────────────────

func subscriptionError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, finance.ErrNotFound):
		apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
	case errors.Is(err, finance.ErrConflict):
		apiConflict(w, err.Error())
	case errors.Is(err, finance.ErrForbidden):
		apiError(w, http.StatusForbidden, CodeForbidden, err.Error())
	case errors.Is(err, finance.ErrValidation):
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
	default:
		apiInternal(w, err)
	}
}

// ── Subscription Plans ───────────────────────────────────────

// handlePlanList handles GET /api/v1/finance/plans
func (s *Server) handlePlanList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	entityType := r.URL.Query().Get("entity_type")
	plans, err := s.Extended.Subscription.ListPlans(r.Context(), entityType)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if plans == nil {
		plans = []finance.SubscriptionPlan{}
	}
	success(w, http.StatusOK, plans)
}

// handlePlanCreate handles POST /api/v1/finance/plans
func (s *Server) handlePlanCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	// RBAC: only admin can create plans
	if p.User.Role != "admin" && p.User.Role != "super_admin" {
		apiError(w, http.StatusForbidden, CodeForbidden, "Chỉ admin mới có quyền tạo gói dịch vụ")
		return
	}

	var plan finance.SubscriptionPlan
	if err := json.NewDecoder(r.Body).Decode(&plan); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Request body không hợp lệ")
		return
	}
	created, err := s.Extended.Subscription.CreatePlan(r.Context(), plan)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusCreated, created)
}

// handlePlanUpdate handles PUT /api/v1/finance/plans/{id}
func (s *Server) handlePlanUpdate(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	// RBAC: only admin can update plans
	if p.User.Role != "admin" && p.User.Role != "super_admin" {
		apiError(w, http.StatusForbidden, CodeForbidden, "Chỉ admin mới có quyền cập nhật gói dịch vụ")
		return
	}

	var patch map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Request body không hợp lệ")
		return
	}
	updated, err := s.Extended.Subscription.UpdatePlan(r.Context(), id, patch)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, updated)
}

// handlePlanDeactivate handles DELETE /api/v1/finance/plans/{id}
func (s *Server) handlePlanDeactivate(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	// RBAC: only admin
	if p.User.Role != "admin" && p.User.Role != "super_admin" {
		apiError(w, http.StatusForbidden, CodeForbidden, "Chỉ admin mới có quyền hủy gói dịch vụ")
		return
	}

	if err := s.Extended.Subscription.DeactivatePlan(r.Context(), id); err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "deactivated"})
}

// handlePlanRoutes dispatches /api/v1/finance/plans based on method.
func (s *Server) handlePlanRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	// Check for /api/v1/finance/plans/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/finance/plans")
	path = strings.TrimPrefix(path, "/")

	if path != "" {
		// /api/v1/finance/plans/{id}
		id := path
		switch r.Method {
		case http.MethodPut:
			s.handlePlanUpdate(w, r, p, id)
		case http.MethodDelete:
			s.handlePlanDeactivate(w, r, p, id)
		case http.MethodGet:
			plan, err := s.Extended.Subscription.GetPlan(r.Context(), id)
			if err != nil {
				subscriptionError(w, err)
				return
			}
			success(w, http.StatusOK, plan)
		default:
			apiMethodNotAllowed(w)
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.handlePlanList(w, r, p)
	case http.MethodPost:
		s.handlePlanCreate(w, r, p)
	default:
		apiMethodNotAllowed(w)
	}
}

// ── Subscriptions ────────────────────────────────────────────

// handleSubscriptionList handles GET /api/v1/finance/subscriptions
func (s *Server) handleSubscriptionList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	filter := finance.SubscriptionFilter{
		EntityType: r.URL.Query().Get("entity_type"),
		SortBy:     r.URL.Query().Get("sort_by"),
		SortDir:    r.URL.Query().Get("sort_dir"),
	}
	if st := r.URL.Query().Get("status"); st != "" {
		filter.Status = finance.SubscriptionStatus(st)
	}
	subs, err := s.Extended.Subscription.ListSubscriptions(r.Context(), filter)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if subs == nil {
		subs = []finance.Subscription{}
	}
	success(w, http.StatusOK, subs)
}

// handleSubscriptionCreate handles POST /api/v1/finance/subscriptions
func (s *Server) handleSubscriptionCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	var input finance.SubscribeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Request body không hợp lệ")
		return
	}
	input.CreatedBy = p.User.ID

	sub, bc, err := s.Extended.Subscription.Subscribe(r.Context(), input)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusCreated, map[string]interface{}{
		"subscription":  sub,
		"billing_cycle": bc,
	})
}

// handleSubscriptionRoutes dispatches /api/v1/finance/subscriptions
func (s *Server) handleSubscriptionRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		s.handleSubscriptionList(w, r, p)
	case http.MethodPost:
		s.handleSubscriptionCreate(w, r, p)
	default:
		apiMethodNotAllowed(w)
	}
}

// handleSubscriptionDetail handles /api/v1/finance/subscriptions/{id}/*
func (s *Server) handleSubscriptionDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	// Parse: /api/v1/finance/subscriptions/{id} or /api/v1/finance/subscriptions/{id}/renew etc.
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/finance/subscriptions/")
	parts := strings.SplitN(path, "/", 2)
	id := parts[0]

	if id == "" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "subscription ID is required")
		return
	}

	// Check for sub-paths: renew, cancel, upgrade, reactivate, suspend, auto-renew
	if len(parts) == 2 {
		action := parts[1]
		switch action {
		case "renew":
			s.handleSubscriptionRenew(w, r, p, id)
		case "cancel":
			s.handleSubscriptionCancel(w, r, p, id)
		case "upgrade":
			s.handleSubscriptionUpgrade(w, r, p, id)
		case "reactivate":
			s.handleSubscriptionReactivate(w, r, p, id)
		case "suspend":
			s.handleSubscriptionSuspend(w, r, p, id)
		case "auto-renew":
			s.handleSubscriptionAutoRenew(w, r, p, id)
		case "billing-cycles":
			s.handleSubscriptionBillingCycles(w, r, p, id)
		case "renewal-logs":
			s.handleSubscriptionRenewalLogs(w, r, p, id)
		default:
			http.NotFound(w, r)
		}
		return
	}

	// GET /api/v1/finance/subscriptions/{id}
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	sub, err := s.Extended.Subscription.GetSubscription(r.Context(), id)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, sub)
}

// handleSubscriptionRenew handles POST /api/v1/finance/subscriptions/{id}/renew
func (s *Server) handleSubscriptionRenew(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	bc, err := s.Extended.Subscription.RenewSubscription(r.Context(), id, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, bc)
}

// handleSubscriptionCancel handles POST /api/v1/finance/subscriptions/{id}/cancel
func (s *Server) handleSubscriptionCancel(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	var body struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	err := s.Extended.Subscription.CancelSubscription(r.Context(), id, body.Reason, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "cancelled"})
}

// handleSubscriptionUpgrade handles POST /api/v1/finance/subscriptions/{id}/upgrade
func (s *Server) handleSubscriptionUpgrade(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	var body struct {
		NewPlanID string `json:"new_plan_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Request body không hợp lệ")
		return
	}

	updated, err := s.Extended.Subscription.UpgradeDowngrade(r.Context(), finance.UpgradeDowngradeInput{
		SubscriptionID: id,
		NewPlanID:      body.NewPlanID,
		PerformedBy:    p.User.ID,
	})
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, updated)
}

// handleSubscriptionReactivate handles POST /api/v1/finance/subscriptions/{id}/reactivate
func (s *Server) handleSubscriptionReactivate(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	// RBAC: only admin can reactivate
	if p.User.Role != "admin" && p.User.Role != "super_admin" {
		apiError(w, http.StatusForbidden, CodeForbidden, "Chỉ admin mới có quyền kích hoạt lại subscription")
		return
	}

	err := s.Extended.Subscription.ReactivateSubscription(r.Context(), id, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "reactivated"})
}

// handleSubscriptionSuspend handles POST /api/v1/finance/subscriptions/{id}/suspend
func (s *Server) handleSubscriptionSuspend(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	// RBAC: only admin can suspend
	if p.User.Role != "admin" && p.User.Role != "super_admin" {
		apiError(w, http.StatusForbidden, CodeForbidden, "Chỉ admin mới có quyền tạm ngưng subscription")
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	err := s.Extended.Subscription.SuspendSubscription(r.Context(), id, body.Reason, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "suspended"})
}

// handleSubscriptionAutoRenew handles PUT /api/v1/finance/subscriptions/{id}/auto-renew
func (s *Server) handleSubscriptionAutoRenew(w http.ResponseWriter, r *http.Request, p auth.Principal, id string) {
	if r.Method != http.MethodPut {
		apiMethodNotAllowed(w)
		return
	}
	var body struct {
		AutoRenew bool `json:"auto_renew"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Request body không hợp lệ")
		return
	}

	err := s.Extended.Subscription.ToggleAutoRenew(r.Context(), id, body.AutoRenew, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]bool{"auto_renew": body.AutoRenew})
}

// handleSubscriptionBillingCycles handles GET /api/v1/finance/subscriptions/{id}/billing-cycles
func (s *Server) handleSubscriptionBillingCycles(w http.ResponseWriter, r *http.Request, _ auth.Principal, id string) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	cycles, err := s.Extended.Subscription.ListBillingCycles(r.Context(), id)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if cycles == nil {
		cycles = []finance.BillingCycle{}
	}
	success(w, http.StatusOK, cycles)
}

// handleSubscriptionRenewalLogs handles GET /api/v1/finance/subscriptions/{id}/renewal-logs
func (s *Server) handleSubscriptionRenewalLogs(w http.ResponseWriter, r *http.Request, _ auth.Principal, id string) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	logs, err := s.Extended.Subscription.ListRenewalLogs(r.Context(), id)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if logs == nil {
		logs = []finance.RenewalLog{}
	}
	success(w, http.StatusOK, logs)
}

// ── Expiring Subscriptions ───────────────────────────────────

// handleExpiringSubscriptions handles GET /api/v1/finance/subscriptions/expiring
func (s *Server) handleExpiringSubscriptions(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	subs, err := s.Extended.Subscription.ListExpiringSubscriptions(r.Context(), 30) // within 30 days
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if subs == nil {
		subs = []finance.Subscription{}
	}
	success(w, http.StatusOK, subs)
}

// ── Billing Cycles ───────────────────────────────────────────

// handleBillingCycleList handles GET /api/v1/finance/billing-cycles
func (s *Server) handleBillingCycleList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	filter := finance.BillingCycleFilter{
		SubscriptionID: r.URL.Query().Get("subscription_id"),
	}
	if st := r.URL.Query().Get("status"); st != "" {
		filter.Status = finance.BillingCycleStatus(st)
	}
	cycles, err := s.Extended.Subscription.ListAllBillingCycles(r.Context(), filter)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	if cycles == nil {
		cycles = []finance.BillingCycle{}
	}
	success(w, http.StatusOK, cycles)
}

// handleBillingCycleMarkPaid handles POST /api/v1/finance/billing-cycles/{id}/pay
func (s *Server) handleBillingCycleMarkPaid(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/finance/billing-cycles/")
	id = strings.TrimSuffix(id, "/pay")

	bc, err := s.Extended.Subscription.MarkBillingCyclePaid(r.Context(), id, p.User.ID)
	if err != nil {
		subscriptionError(w, err)
		return
	}
	success(w, http.StatusOK, bc)
}
