package finance

import (
	"context"
	"errors"
	"time"
)

// ── Domain Errors ────────────────────────────────────────────

var (
	ErrNotFound   = errors.New("not_found")
	ErrConflict   = errors.New("conflict")
	ErrValidation = errors.New("validation")
	ErrForbidden  = errors.New("forbidden")
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SUBSCRIPTION & BILLING MODELS
// Manages subscriptions, billing cycles, and renewal tracking
// for federations, organizations, and tournaments.
// ═══════════════════════════════════════════════════════════════

// ── Subscription Plan (Gói dịch vụ) ─────────────────────────

// SubscriptionPlan defines a service tier that entities can subscribe to.
type SubscriptionPlan struct {
	ID             string         `json:"id"`
	Code           string         `json:"code"`        // "basic", "professional", "enterprise"
	Name           string         `json:"name"`        // "Gói Cơ bản", "Gói Chuyên nghiệp"
	Description    string         `json:"description"` // Mô tả gói
	EntityType     string         `json:"entity_type"` // "federation", "organization", "tournament"
	Features       map[string]any `json:"features,omitempty"`
	PriceMonthly   float64        `json:"price_monthly"`
	PriceYearly    float64        `json:"price_yearly"`
	Currency       string         `json:"currency"` // "VND"
	MaxMembers     int            `json:"max_members"`
	MaxTournaments int            `json:"max_tournaments"`
	MaxAthletes    int            `json:"max_athletes"`
	IsActive       bool           `json:"is_active"`
	SortOrder      int            `json:"sort_order"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// ── Subscription (Đăng ký gói) ───────────────────────────────

// SubscriptionStatus represents the lifecycle status of a subscription.
type SubscriptionStatus string

const (
	SubStatusTrial     SubscriptionStatus = "trial"
	SubStatusActive    SubscriptionStatus = "active"
	SubStatusPastDue   SubscriptionStatus = "past_due"
	SubStatusSuspended SubscriptionStatus = "suspended"
	SubStatusCancelled SubscriptionStatus = "cancelled"
	SubStatusExpired   SubscriptionStatus = "expired"
)

// Subscription represents an active service subscription for an entity.
type Subscription struct {
	ID                 string             `json:"id"`
	PlanID             string             `json:"plan_id"`
	PlanCode           string             `json:"plan_code,omitempty"` // denormalized for display
	PlanName           string             `json:"plan_name,omitempty"` // denormalized for display
	EntityType         string             `json:"entity_type"`         // "federation", "organization", "tournament"
	EntityID           string             `json:"entity_id"`           // ID of the federation/org/tournament
	EntityName         string             `json:"entity_name"`         // Tên hiển thị
	Status             SubscriptionStatus `json:"status"`
	BillingCycleType   string             `json:"billing_cycle_type"`   // "monthly", "yearly"
	CurrentPeriodStart string             `json:"current_period_start"` // YYYY-MM-DD
	CurrentPeriodEnd   string             `json:"current_period_end"`   // YYYY-MM-DD
	TrialEndDate       *string            `json:"trial_end_date,omitempty"`
	CancelledAt        *time.Time         `json:"cancelled_at,omitempty"`
	CancelReason       string             `json:"cancel_reason,omitempty"`
	AutoRenew          bool               `json:"auto_renew"`
	PaymentMethodID    *string            `json:"payment_method_id,omitempty"` // future: saved payment method
	CreatedBy          string             `json:"created_by"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

// ── Billing Cycle (Kỳ thanh toán) ────────────────────────────

// BillingCycleStatus represents the status of a single billing period.
type BillingCycleStatus string

const (
	BillingPending  BillingCycleStatus = "pending"
	BillingInvoiced BillingCycleStatus = "invoiced"
	BillingPaid     BillingCycleStatus = "paid"
	BillingOverdue  BillingCycleStatus = "overdue"
	BillingVoid     BillingCycleStatus = "void"
)

// BillingCycle represents a single billing period within a subscription.
type BillingCycle struct {
	ID             string             `json:"id"`
	SubscriptionID string             `json:"subscription_id"`
	PeriodStart    string             `json:"period_start"` // YYYY-MM-DD
	PeriodEnd      string             `json:"period_end"`   // YYYY-MM-DD
	Amount         float64            `json:"amount"`
	Currency       string             `json:"currency"`
	InvoiceID      *string            `json:"invoice_id,omitempty"` // link to Invoice
	Status         BillingCycleStatus `json:"status"`
	DueDate        string             `json:"due_date"` // YYYY-MM-DD
	PaidAt         *time.Time         `json:"paid_at,omitempty"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
}

// ── Renewal Log (Nhật ký gia hạn) ────────────────────────────

// RenewalAction represents the type of subscription change.
type RenewalAction string

const (
	RenewalAutoRenew  RenewalAction = "auto_renew"
	RenewalManual     RenewalAction = "manual_renew"
	RenewalUpgrade    RenewalAction = "upgrade"
	RenewalDowngrade  RenewalAction = "downgrade"
	RenewalCancel     RenewalAction = "cancel"
	RenewalSuspend    RenewalAction = "suspend"
	RenewalReactivate RenewalAction = "reactivate"
)

// RenewalLog records every change to a subscription for audit purposes.
type RenewalLog struct {
	ID             string             `json:"id"`
	SubscriptionID string             `json:"subscription_id"`
	Action         RenewalAction      `json:"action"`
	OldPlanID      *string            `json:"old_plan_id,omitempty"`
	NewPlanID      *string            `json:"new_plan_id,omitempty"`
	OldStatus      SubscriptionStatus `json:"old_status"`
	NewStatus      SubscriptionStatus `json:"new_status"`
	Amount         float64            `json:"amount,omitempty"` // amount charged/refunded
	Notes          string             `json:"notes,omitempty"`
	PerformedBy    string             `json:"performed_by"`
	CreatedAt      time.Time          `json:"created_at"`
}

// ── Repository Interfaces ────────────────────────────────────

// SubscriptionPlanRepository defines operations for subscription plans.
type SubscriptionPlanRepository interface {
	Create(ctx context.Context, plan SubscriptionPlan) (*SubscriptionPlan, error)
	GetByID(ctx context.Context, id string) (*SubscriptionPlan, error)
	GetByCode(ctx context.Context, code string, entityType string) (*SubscriptionPlan, error)
	List(ctx context.Context, entityType string) ([]SubscriptionPlan, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error // soft-delete
}

// SubscriptionRepository defines operations for subscriptions.
type SubscriptionRepository interface {
	Create(ctx context.Context, sub Subscription) (*Subscription, error)
	GetByID(ctx context.Context, id string) (*Subscription, error)
	GetByEntity(ctx context.Context, entityType, entityID string) (*Subscription, error)
	List(ctx context.Context, filter SubscriptionFilter) ([]Subscription, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

// Pagination defines pagination parameters for list queries.
type Pagination struct {
	Page  int `json:"page"`  // 1-indexed, default 1
	Limit int `json:"limit"` // items per page, default 20, max 100
}

// PaginatedResult wraps a list result with pagination metadata.
type PaginatedResult[T any] struct {
	Items      []T `json:"items"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

// NormalizePagination ensures valid page/limit values.
func NormalizePagination(p Pagination) Pagination {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}
	return p
}

// SubscriptionFilter defines criteria for listing subscriptions.
type SubscriptionFilter struct {
	EntityType     string             `json:"entity_type,omitempty"`
	Status         SubscriptionStatus `json:"status,omitempty"`
	ExpiringBefore string             `json:"expiring_before,omitempty"` // YYYY-MM-DD
	Pagination     Pagination         `json:"pagination"`
	SortBy         string             `json:"sort_by,omitempty"`  // "entity_name", "current_period_end", "created_at"
	SortDir        string             `json:"sort_dir,omitempty"` // "asc" or "desc"
}

// BillingCycleRepository defines operations for billing cycles.
type BillingCycleRepository interface {
	Create(ctx context.Context, bc BillingCycle) (*BillingCycle, error)
	GetByID(ctx context.Context, id string) (*BillingCycle, error)
	ListBySubscription(ctx context.Context, subscriptionID string) ([]BillingCycle, error)
	List(ctx context.Context, filter BillingCycleFilter) ([]BillingCycle, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

// BillingCycleFilter defines criteria for listing billing cycles.
type BillingCycleFilter struct {
	SubscriptionID string             `json:"subscription_id,omitempty"`
	Status         BillingCycleStatus `json:"status,omitempty"`
	Pagination     Pagination         `json:"pagination"`
}

// RenewalLogRepository defines operations for renewal logs.
type RenewalLogRepository interface {
	Create(ctx context.Context, log RenewalLog) (*RenewalLog, error)
	ListBySubscription(ctx context.Context, subscriptionID string) ([]RenewalLog, error)
}

// ── Status Transition Validation ─────────────────────────────

// validSubscriptionTransitions defines allowed status changes.
var validSubscriptionTransitions = map[SubscriptionStatus][]SubscriptionStatus{
	SubStatusTrial:     {SubStatusActive, SubStatusCancelled, SubStatusExpired},
	SubStatusActive:    {SubStatusPastDue, SubStatusSuspended, SubStatusCancelled, SubStatusExpired},
	SubStatusPastDue:   {SubStatusActive, SubStatusSuspended, SubStatusCancelled},
	SubStatusSuspended: {SubStatusActive, SubStatusCancelled},
	SubStatusCancelled: {},                // terminal state
	SubStatusExpired:   {SubStatusActive}, // can reactivate
}

// CanTransition checks if a subscription status change is valid.
func CanTransition(from, to SubscriptionStatus) bool {
	allowed, ok := validSubscriptionTransitions[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}
