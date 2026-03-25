package adapter

import (
	"context"
	"fmt"
	"sync"

	"vct-platform/backend/internal/domain/finance"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — IN-MEMORY SUBSCRIPTION STORES
// Lightweight implementations for testing and development.
// Moved from domain/finance to adapter layer (Clean Architecture).
// ═══════════════════════════════════════════════════════════════

// ── Subscription Plan Store ──────────────────────────────────

type inMemPlanRepo struct {
	mu    sync.RWMutex
	plans map[string]*finance.SubscriptionPlan
}

// NewInMemPlanRepo creates an in-memory plan repository.
func NewInMemPlanRepo() finance.SubscriptionPlanRepository {
	return &inMemPlanRepo{plans: make(map[string]*finance.SubscriptionPlan)}
}

func (r *inMemPlanRepo) Create(_ context.Context, plan finance.SubscriptionPlan) (*finance.SubscriptionPlan, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.plans[plan.ID] = &plan
	return &plan, nil
}

func (r *inMemPlanRepo) GetByID(_ context.Context, id string) (*finance.SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.plans[id]
	if !ok {
		return nil, fmt.Errorf("plan not found: %s", id)
	}
	return p, nil
}

func (r *inMemPlanRepo) GetByCode(_ context.Context, code string, entityType string) (*finance.SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.plans {
		if p.Code == code && p.EntityType == entityType {
			return p, nil
		}
	}
	return nil, fmt.Errorf("plan not found: %s/%s", code, entityType)
}

func (r *inMemPlanRepo) List(_ context.Context, entityType string) ([]finance.SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []finance.SubscriptionPlan
	for _, p := range r.plans {
		if !p.IsActive {
			continue
		}
		if entityType == "" || p.EntityType == entityType {
			out = append(out, *p)
		}
	}
	return out, nil
}

func (r *inMemPlanRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.plans[id]
	if !ok {
		return fmt.Errorf("plan not found: %s", id)
	}
	for k, v := range patch {
		switch k {
		case "name":
			p.Name = v.(string)
		case "description":
			p.Description = v.(string)
		case "is_active":
			p.IsActive = v.(bool)
		case "price_monthly":
			p.PriceMonthly = v.(float64)
		case "price_yearly":
			p.PriceYearly = v.(float64)
		case "max_members":
			p.MaxMembers = v.(int)
		case "max_tournaments":
			p.MaxTournaments = v.(int)
		case "max_athletes":
			p.MaxAthletes = v.(int)
		}
	}
	return nil
}

func (r *inMemPlanRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.plans[id]
	if !ok {
		return fmt.Errorf("plan not found: %s", id)
	}
	p.IsActive = false
	return nil
}

// ── Subscription Store ───────────────────────────────────────

type inMemSubRepo struct {
	mu   sync.RWMutex
	subs map[string]*finance.Subscription
}

// NewInMemSubRepo creates an in-memory subscription repository.
func NewInMemSubRepo() finance.SubscriptionRepository {
	return &inMemSubRepo{subs: make(map[string]*finance.Subscription)}
}

func (r *inMemSubRepo) Create(_ context.Context, sub finance.Subscription) (*finance.Subscription, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.subs[sub.ID] = &sub
	return &sub, nil
}

func (r *inMemSubRepo) GetByID(_ context.Context, id string) (*finance.Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.subs[id]
	if !ok {
		return nil, fmt.Errorf("subscription not found: %s", id)
	}
	return s, nil
}

func (r *inMemSubRepo) GetByEntity(_ context.Context, entityType, entityID string) (*finance.Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, s := range r.subs {
		if s.EntityType == entityType && s.EntityID == entityID &&
			s.Status != finance.SubStatusCancelled && s.Status != finance.SubStatusExpired {
			return s, nil
		}
	}
	return nil, fmt.Errorf("no active subscription for %s/%s", entityType, entityID)
}

func (r *inMemSubRepo) List(_ context.Context, filter finance.SubscriptionFilter) ([]finance.Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []finance.Subscription
	for _, s := range r.subs {
		if filter.EntityType != "" && s.EntityType != filter.EntityType {
			continue
		}
		if filter.Status != "" && s.Status != filter.Status {
			continue
		}
		if filter.ExpiringBefore != "" && s.CurrentPeriodEnd > filter.ExpiringBefore {
			continue
		}
		out = append(out, *s)
	}
	return out, nil
}

func (r *inMemSubRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.subs[id]
	if !ok {
		return fmt.Errorf("subscription not found: %s", id)
	}
	for k, v := range patch {
		switch k {
		case "status":
			s.Status = finance.SubscriptionStatus(v.(string))
		case "plan_id":
			s.PlanID = v.(string)
		case "plan_code":
			s.PlanCode = v.(string)
		case "plan_name":
			s.PlanName = v.(string)
		case "current_period_start":
			s.CurrentPeriodStart = v.(string)
		case "current_period_end":
			s.CurrentPeriodEnd = v.(string)
		case "cancelled_at":
			if t, ok := v.(interface{ UTC() interface{} }); ok {
				_ = t
			}
		case "cancel_reason":
			s.CancelReason = v.(string)
		case "auto_renew":
			s.AutoRenew = v.(bool)
		}
	}
	return nil
}

// ── Billing Cycle Store ──────────────────────────────────────

type inMemBillingRepo struct {
	mu     sync.RWMutex
	cycles map[string]*finance.BillingCycle
}

// NewInMemBillingRepo creates an in-memory billing cycle repository.
func NewInMemBillingRepo() finance.BillingCycleRepository {
	return &inMemBillingRepo{cycles: make(map[string]*finance.BillingCycle)}
}

func (r *inMemBillingRepo) Create(_ context.Context, bc finance.BillingCycle) (*finance.BillingCycle, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cycles[bc.ID] = &bc
	return &bc, nil
}

func (r *inMemBillingRepo) GetByID(_ context.Context, id string) (*finance.BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	bc, ok := r.cycles[id]
	if !ok {
		return nil, fmt.Errorf("billing cycle not found: %s", id)
	}
	return bc, nil
}

func (r *inMemBillingRepo) ListBySubscription(_ context.Context, subID string) ([]finance.BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []finance.BillingCycle
	for _, bc := range r.cycles {
		if bc.SubscriptionID == subID {
			out = append(out, *bc)
		}
	}
	return out, nil
}

func (r *inMemBillingRepo) List(_ context.Context, filter finance.BillingCycleFilter) ([]finance.BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []finance.BillingCycle
	for _, bc := range r.cycles {
		if filter.SubscriptionID != "" && bc.SubscriptionID != filter.SubscriptionID {
			continue
		}
		if filter.Status != "" && bc.Status != filter.Status {
			continue
		}
		out = append(out, *bc)
	}
	return out, nil
}

func (r *inMemBillingRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	bc, ok := r.cycles[id]
	if !ok {
		return fmt.Errorf("billing cycle not found: %s", id)
	}
	for k, v := range patch {
		switch k {
		case "status":
			bc.Status = finance.BillingCycleStatus(v.(string))
		case "invoice_id":
			s := v.(string)
			bc.InvoiceID = &s
		}
	}
	return nil
}

// ── Renewal Log Store ────────────────────────────────────────

type inMemRenewalRepo struct {
	mu   sync.RWMutex
	logs map[string]*finance.RenewalLog
}

// NewInMemRenewalRepo creates an in-memory renewal log repository.
func NewInMemRenewalRepo() finance.RenewalLogRepository {
	return &inMemRenewalRepo{logs: make(map[string]*finance.RenewalLog)}
}

func (r *inMemRenewalRepo) Create(_ context.Context, log finance.RenewalLog) (*finance.RenewalLog, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.logs[log.ID] = &log
	return &log, nil
}

func (r *inMemRenewalRepo) ListBySubscription(_ context.Context, subID string) ([]finance.RenewalLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []finance.RenewalLog
	for _, l := range r.logs {
		if l.SubscriptionID == subID {
			out = append(out, *l)
		}
	}
	return out, nil
}
