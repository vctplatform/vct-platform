package finance

import (
	"context"
	"fmt"
	"sync"
)

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY SUBSCRIPTION TEST HELPERS (domain-level testing only)
// These exist so domain tests do not import the adapter package.
// ═══════════════════════════════════════════════════════════════

// ── Plan Repo ────────────────────────────────────────────────

type memPlanRepo struct {
	mu    sync.RWMutex
	plans map[string]*SubscriptionPlan
}

func NewInMemPlanRepo() SubscriptionPlanRepository {
	return &memPlanRepo{plans: make(map[string]*SubscriptionPlan)}
}

func (r *memPlanRepo) Create(_ context.Context, p SubscriptionPlan) (*SubscriptionPlan, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.plans[p.ID] = &p
	return &p, nil
}

func (r *memPlanRepo) GetByID(_ context.Context, id string) (*SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.plans[id]
	if !ok {
		return nil, fmt.Errorf("plan not found: %s", id)
	}
	return p, nil
}

func (r *memPlanRepo) GetByCode(_ context.Context, code, entityType string) (*SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.plans {
		if p.Code == code && p.EntityType == entityType {
			return p, nil
		}
	}
	return nil, fmt.Errorf("plan not found: %s/%s", code, entityType)
}

func (r *memPlanRepo) List(_ context.Context, entityType string) ([]SubscriptionPlan, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []SubscriptionPlan
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

func (r *memPlanRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
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

func (r *memPlanRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.plans[id]
	if !ok {
		return fmt.Errorf("plan not found: %s", id)
	}
	p.IsActive = false
	return nil
}

// ── Subscription Repo ────────────────────────────────────────

type memSubRepo struct {
	mu   sync.RWMutex
	subs map[string]*Subscription
}

func NewInMemSubRepo() SubscriptionRepository {
	return &memSubRepo{subs: make(map[string]*Subscription)}
}

func (r *memSubRepo) Create(_ context.Context, s Subscription) (*Subscription, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.subs[s.ID] = &s
	return &s, nil
}

func (r *memSubRepo) GetByID(_ context.Context, id string) (*Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.subs[id]
	if !ok {
		return nil, fmt.Errorf("subscription not found: %s", id)
	}
	return s, nil
}

func (r *memSubRepo) GetByEntity(_ context.Context, entityType, entityID string) (*Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, s := range r.subs {
		if s.EntityType == entityType && s.EntityID == entityID &&
			s.Status != SubStatusCancelled && s.Status != SubStatusExpired {
			return s, nil
		}
	}
	return nil, fmt.Errorf("no active subscription for %s/%s", entityType, entityID)
}

func (r *memSubRepo) List(_ context.Context, filter SubscriptionFilter) ([]Subscription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []Subscription
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

func (r *memSubRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.subs[id]
	if !ok {
		return fmt.Errorf("subscription not found: %s", id)
	}
	for k, v := range patch {
		switch k {
		case "status":
			s.Status = SubscriptionStatus(v.(string))
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
		case "cancel_reason":
			s.CancelReason = v.(string)
		case "auto_renew":
			s.AutoRenew = v.(bool)
		}
	}
	return nil
}

// ── Billing Cycle Repo ───────────────────────────────────────

type memBillingRepo struct {
	mu     sync.RWMutex
	cycles map[string]*BillingCycle
}

func NewInMemBillingRepo() BillingCycleRepository {
	return &memBillingRepo{cycles: make(map[string]*BillingCycle)}
}

func (r *memBillingRepo) Create(_ context.Context, bc BillingCycle) (*BillingCycle, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cycles[bc.ID] = &bc
	return &bc, nil
}

func (r *memBillingRepo) GetByID(_ context.Context, id string) (*BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	bc, ok := r.cycles[id]
	if !ok {
		return nil, fmt.Errorf("billing cycle not found: %s", id)
	}
	return bc, nil
}

func (r *memBillingRepo) ListBySubscription(_ context.Context, subID string) ([]BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []BillingCycle
	for _, bc := range r.cycles {
		if bc.SubscriptionID == subID {
			out = append(out, *bc)
		}
	}
	return out, nil
}

func (r *memBillingRepo) List(_ context.Context, filter BillingCycleFilter) ([]BillingCycle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []BillingCycle
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

func (r *memBillingRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	bc, ok := r.cycles[id]
	if !ok {
		return fmt.Errorf("billing cycle not found: %s", id)
	}
	for k, v := range patch {
		switch k {
		case "status":
			bc.Status = BillingCycleStatus(v.(string))
		case "invoice_id":
			s := v.(string)
			bc.InvoiceID = &s
		}
	}
	return nil
}

// ── Renewal Log Repo ─────────────────────────────────────────

type memRenewalRepo struct {
	mu   sync.RWMutex
	logs map[string]*RenewalLog
}

func NewInMemRenewalRepo() RenewalLogRepository {
	return &memRenewalRepo{logs: make(map[string]*RenewalLog)}
}

func (r *memRenewalRepo) Create(_ context.Context, log RenewalLog) (*RenewalLog, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.logs[log.ID] = &log
	return &log, nil
}

func (r *memRenewalRepo) ListBySubscription(_ context.Context, subID string) ([]RenewalLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []RenewalLog
	for _, l := range r.logs {
		if l.SubscriptionID == subID {
			out = append(out, *l)
		}
	}
	return out, nil
}
