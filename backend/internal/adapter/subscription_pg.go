package adapter

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"vct-platform/backend/internal/domain/finance"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — POSTGRESQL SUBSCRIPTION STORES
// Production implementations using database/sql for platform.* schema.
// Moved from domain/finance to adapter layer (Clean Architecture).
// ═══════════════════════════════════════════════════════════════

// ── Subscription Plan Store ──────────────────────────────────

type pgPlanRepo struct {
	db *sql.DB
}

func NewPgPlanRepo(db *sql.DB) finance.SubscriptionPlanRepository {
	return &pgPlanRepo{db: db}
}

func (r *pgPlanRepo) Create(ctx context.Context, plan finance.SubscriptionPlan) (*finance.SubscriptionPlan, error) {
	q := `
		INSERT INTO platform.subscription_plans (
			id, tenant_id, code, name, description, entity_type, features,
			price_monthly, price_yearly, currency, max_members, max_tournaments,
			max_athletes, is_active, sort_order, created_at, updated_at
		) VALUES (
			$1, (SELECT id FROM core.tenants WHERE code='default' LIMIT 1), $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12, $13, $14, $15, $15
		) RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		plan.ID, plan.Code, plan.Name, plan.Description, plan.EntityType, plan.Features,
		plan.PriceMonthly, plan.PriceYearly, plan.Currency, plan.MaxMembers, plan.MaxTournaments,
		plan.MaxAthletes, plan.IsActive, plan.SortOrder, plan.CreatedAt,
	).Scan(&plan.ID)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") {
			return nil, finance.ErrConflict
		}
		return nil, fmt.Errorf("insert plan: %w", err)
	}

	return &plan, nil
}

func (r *pgPlanRepo) GetByID(ctx context.Context, id string) (*finance.SubscriptionPlan, error) {
	q := `
		SELECT id, code, name, description, entity_type, features,
		       price_monthly, price_yearly, currency, max_members, max_tournaments,
		       max_athletes, is_active, sort_order, created_at, updated_at
		FROM platform.subscription_plans
		WHERE id = $1 AND is_deleted = false`

	var p finance.SubscriptionPlan
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&p.ID, &p.Code, &p.Name, &p.Description, &p.EntityType, &p.Features,
		&p.PriceMonthly, &p.PriceYearly, &p.Currency, &p.MaxMembers, &p.MaxTournaments,
		&p.MaxAthletes, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, finance.ErrNotFound
		}
		return nil, fmt.Errorf("select plan: %w", err)
	}

	return &p, nil
}

func (r *pgPlanRepo) GetByCode(ctx context.Context, code string, entityType string) (*finance.SubscriptionPlan, error) {
	q := `
		SELECT id, code, name, description, entity_type, features,
		       price_monthly, price_yearly, currency, max_members, max_tournaments,
		       max_athletes, is_active, sort_order, created_at, updated_at
		FROM platform.subscription_plans
		WHERE code = $1 AND entity_type = $2 AND is_deleted = false`

	var p finance.SubscriptionPlan
	err := r.db.QueryRowContext(ctx, q, code, entityType).Scan(
		&p.ID, &p.Code, &p.Name, &p.Description, &p.EntityType, &p.Features,
		&p.PriceMonthly, &p.PriceYearly, &p.Currency, &p.MaxMembers, &p.MaxTournaments,
		&p.MaxAthletes, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, finance.ErrNotFound
		}
		return nil, fmt.Errorf("select plan by code: %w", err)
	}

	return &p, nil
}

func (r *pgPlanRepo) List(ctx context.Context, entityType string) ([]finance.SubscriptionPlan, error) {
	q := `
		SELECT id, code, name, description, entity_type, features,
		       price_monthly, price_yearly, currency, max_members, max_tournaments,
		       max_athletes, is_active, sort_order, created_at, updated_at
		FROM platform.subscription_plans
		WHERE is_deleted = false AND is_active = true`

	args := []any{}
	if entityType != "" {
		q += " AND entity_type = $1"
		args = append(args, entityType)
	}

	q += " ORDER BY sort_order ASC, price_yearly ASC"

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list plans: %w", err)
	}
	defer rows.Close()

	var plans []finance.SubscriptionPlan
	for rows.Next() {
		var p finance.SubscriptionPlan
		if err := rows.Scan(
			&p.ID, &p.Code, &p.Name, &p.Description, &p.EntityType, &p.Features,
			&p.PriceMonthly, &p.PriceYearly, &p.Currency, &p.MaxMembers, &p.MaxTournaments,
			&p.MaxAthletes, &p.IsActive, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan plan: %w", err)
		}
		plans = append(plans, p)
	}

	return plans, rows.Err()
}

func (r *pgPlanRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	if len(patch) == 0 {
		return nil
	}

	setFields := []string{}
	args := []any{id}
	argIdx := 2

	for k, v := range patch {
		if k != "name" && k != "description" && k != "is_active" && k != "price_monthly" &&
			k != "price_yearly" && k != "max_members" && k != "max_tournaments" &&
			k != "max_athletes" && k != "features" && k != "sort_order" && k != "updated_at" {
			continue
		}
		setFields = append(setFields, fmt.Sprintf("%s = $%d", k, argIdx))
		args = append(args, v)
		argIdx++
	}

	if len(setFields) == 0 {
		return nil
	}

	q := fmt.Sprintf(`UPDATE platform.subscription_plans SET %s WHERE id = $1 AND is_deleted = false`, strings.Join(setFields, ", "))

	cmd, err := r.db.ExecContext(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("update plan: %w", err)
	}
	rowsAffected, _ := cmd.RowsAffected()
	if rowsAffected == 0 {
		return finance.ErrNotFound
	}

	return nil
}

func (r *pgPlanRepo) Delete(ctx context.Context, id string) error {
	q := `UPDATE platform.subscription_plans SET is_deleted = true, is_active = false, updated_at = NOW() WHERE id = $1`
	cmd, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete plan: %w", err)
	}
	rowsAffected, _ := cmd.RowsAffected()
	if rowsAffected == 0 {
		return finance.ErrNotFound
	}
	return nil
}

// ── Subscription Store ───────────────────────────────────────

type pgSubRepo struct {
	db *sql.DB
}

func NewPgSubRepo(db *sql.DB) finance.SubscriptionRepository {
	return &pgSubRepo{db: db}
}

func (r *pgSubRepo) Create(ctx context.Context, sub finance.Subscription) (*finance.Subscription, error) {
	q := `
		INSERT INTO platform.subscriptions (
			id, tenant_id, plan_id, plan_code, plan_name, entity_type, entity_id, entity_name,
			status, billing_cycle_type, current_period_start, current_period_end, trial_end_date,
			auto_renew, created_by, created_at, updated_at
		) VALUES (
			$1, (SELECT id FROM core.tenants WHERE code='default' LIMIT 1), $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13, $14, $15, $15
		) RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		sub.ID, sub.PlanID, sub.PlanCode, sub.PlanName, sub.EntityType, sub.EntityID, sub.EntityName,
		sub.Status, sub.BillingCycleType, sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.TrialEndDate,
		sub.AutoRenew, sub.CreatedBy, sub.CreatedAt,
	).Scan(&sub.ID)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") {
			return nil, finance.ErrConflict
		}
		return nil, fmt.Errorf("insert subscription: %w", err)
	}

	return &sub, nil
}

func (r *pgSubRepo) GetByID(ctx context.Context, id string) (*finance.Subscription, error) {
	q := `
		SELECT id, plan_id, plan_code, plan_name, entity_type, entity_id, entity_name,
		       status, billing_cycle_type, current_period_start::text, current_period_end::text, 
		       trial_end_date::text, cancelled_at, cancel_reason, auto_renew,
		       created_by, created_at, updated_at
		FROM platform.subscriptions
		WHERE id = $1 AND is_deleted = false`

	var s finance.Subscription
	var trialEnd *string
	var start, end string

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&s.ID, &s.PlanID, &s.PlanCode, &s.PlanName, &s.EntityType, &s.EntityID, &s.EntityName,
		&s.Status, &s.BillingCycleType, &start, &end,
		&trialEnd, &s.CancelledAt, &s.CancelReason, &s.AutoRenew,
		&s.CreatedBy, &s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, finance.ErrNotFound
		}
		return nil, fmt.Errorf("select subscription: %w", err)
	}

	s.CurrentPeriodStart = strings.Split(start, " ")[0]
	s.CurrentPeriodEnd = strings.Split(end, " ")[0]
	if trialEnd != nil {
		t := strings.Split(*trialEnd, " ")[0]
		s.TrialEndDate = &t
	}

	return &s, nil
}

func (r *pgSubRepo) GetByEntity(ctx context.Context, entityType, entityID string) (*finance.Subscription, error) {
	q := `
		SELECT id, plan_id, plan_code, plan_name, entity_type, entity_id, entity_name,
		       status, billing_cycle_type, current_period_start::text, current_period_end::text, 
		       trial_end_date::text, cancelled_at, cancel_reason, auto_renew,
		       created_by, created_at, updated_at
		FROM platform.subscriptions
		WHERE entity_type = $1 AND entity_id = $2 
		  AND status NOT IN ('cancelled', 'expired') 
		  AND is_deleted = false
		ORDER BY created_at DESC LIMIT 1`

	var s finance.Subscription
	var trialEnd *string
	var start, end string

	err := r.db.QueryRowContext(ctx, q, entityType, entityID).Scan(
		&s.ID, &s.PlanID, &s.PlanCode, &s.PlanName, &s.EntityType, &s.EntityID, &s.EntityName,
		&s.Status, &s.BillingCycleType, &start, &end,
		&trialEnd, &s.CancelledAt, &s.CancelReason, &s.AutoRenew,
		&s.CreatedBy, &s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, finance.ErrNotFound
		}
		return nil, fmt.Errorf("select active subscription: %w", err)
	}

	s.CurrentPeriodStart = strings.Split(start, " ")[0]
	s.CurrentPeriodEnd = strings.Split(end, " ")[0]
	if trialEnd != nil {
		t := strings.Split(*trialEnd, " ")[0]
		s.TrialEndDate = &t
	}

	return &s, nil
}

func (r *pgSubRepo) List(ctx context.Context, filter finance.SubscriptionFilter) ([]finance.Subscription, error) {
	q := `
		SELECT id, plan_id, plan_code, plan_name, entity_type, entity_id, entity_name,
		       status, billing_cycle_type, current_period_start::text, current_period_end::text, 
		       trial_end_date::text, cancelled_at, cancel_reason, auto_renew,
		       created_by, created_at, updated_at
		FROM platform.subscriptions
		WHERE is_deleted = false`

	args := []any{}
	argIdx := 1

	if filter.EntityType != "" {
		q += fmt.Sprintf(" AND entity_type = $%d", argIdx)
		args = append(args, filter.EntityType)
		argIdx++
	}

	if filter.Status != "" {
		q += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}

	if filter.ExpiringBefore != "" {
		q += fmt.Sprintf(" AND current_period_end <= $%d", argIdx)
		args = append(args, filter.ExpiringBefore)
		argIdx++
	}

	sortCol := "created_at"
	sortDir := "DESC"

	if filter.SortBy == "entity_name" || filter.SortBy == "current_period_end" || filter.SortBy == "status" || filter.SortBy == "plan_name" {
		sortCol = filter.SortBy
	}
	if filter.SortDir == "asc" || filter.SortDir == "ASC" {
		sortDir = "ASC"
	}

	q += fmt.Sprintf(" ORDER BY %s %s", sortCol, sortDir)

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list subscriptions: %w", err)
	}
	defer rows.Close()

	var subs []finance.Subscription
	for rows.Next() {
		var s finance.Subscription
		var trialEnd *string
		var start, end string

		if err := rows.Scan(
			&s.ID, &s.PlanID, &s.PlanCode, &s.PlanName, &s.EntityType, &s.EntityID, &s.EntityName,
			&s.Status, &s.BillingCycleType, &start, &end,
			&trialEnd, &s.CancelledAt, &s.CancelReason, &s.AutoRenew,
			&s.CreatedBy, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan sub: %w", err)
		}

		s.CurrentPeriodStart = strings.Split(start, " ")[0]
		s.CurrentPeriodEnd = strings.Split(end, " ")[0]
		if trialEnd != nil {
			t := strings.Split(*trialEnd, " ")[0]
			s.TrialEndDate = &t
		}

		subs = append(subs, s)
	}

	return subs, rows.Err()
}

func (r *pgSubRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	if len(patch) == 0 {
		return nil
	}

	setFields := []string{}
	args := []any{id}
	argIdx := 2

	for k, v := range patch {
		if k != "status" && k != "plan_id" && k != "plan_code" && k != "plan_name" &&
			k != "current_period_start" && k != "current_period_end" &&
			k != "cancelled_at" && k != "cancel_reason" && k != "auto_renew" && k != "updated_at" {
			continue
		}
		setFields = append(setFields, fmt.Sprintf("%s = $%d", k, argIdx))
		args = append(args, v)
		argIdx++
	}

	if len(setFields) == 0 {
		return nil
	}

	q := fmt.Sprintf(`UPDATE platform.subscriptions SET %s WHERE id = $1 AND is_deleted = false`, strings.Join(setFields, ", "))

	cmd, err := r.db.ExecContext(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("update subscription: %w", err)
	}
	rowsAffected, _ := cmd.RowsAffected()
	if rowsAffected == 0 {
		return finance.ErrNotFound
	}

	return nil
}

// ── Billing Cycle Store ──────────────────────────────────────

type pgBillingRepo struct {
	db *sql.DB
}

func NewPgBillingRepo(db *sql.DB) finance.BillingCycleRepository {
	return &pgBillingRepo{db: db}
}

func (r *pgBillingRepo) Create(ctx context.Context, bc finance.BillingCycle) (*finance.BillingCycle, error) {
	q := `
		INSERT INTO platform.billing_cycles (
			id, tenant_id, subscription_id, period_start, period_end, amount,
			currency, status, due_date, created_at, updated_at
		) VALUES (
			$1, (SELECT id FROM core.tenants WHERE code='default' LIMIT 1), $2, $3, $4, $5,
			$6, $7, $8, $9, $9
		) RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		bc.ID, bc.SubscriptionID, bc.PeriodStart, bc.PeriodEnd, bc.Amount,
		bc.Currency, bc.Status, bc.DueDate, bc.CreatedAt,
	).Scan(&bc.ID)

	if err != nil {
		return nil, fmt.Errorf("insert billing cycle: %w", err)
	}

	return &bc, nil
}

func (r *pgBillingRepo) GetByID(ctx context.Context, id string) (*finance.BillingCycle, error) {
	q := `
		SELECT id, subscription_id, period_start::text, period_end::text, amount,
		       currency, invoice_id, status, due_date::text, paid_at, created_at, updated_at
		FROM platform.billing_cycles
		WHERE id = $1 AND is_deleted = false`

	var bc finance.BillingCycle
	var start, end, due string

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&bc.ID, &bc.SubscriptionID, &start, &end, &bc.Amount,
		&bc.Currency, &bc.InvoiceID, &bc.Status, &due, &bc.PaidAt, &bc.CreatedAt, &bc.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, finance.ErrNotFound
		}
		return nil, fmt.Errorf("select billing cycle: %w", err)
	}

	bc.PeriodStart = strings.Split(start, " ")[0]
	bc.PeriodEnd = strings.Split(end, " ")[0]
	bc.DueDate = strings.Split(due, " ")[0]

	return &bc, nil
}

func (r *pgBillingRepo) ListBySubscription(ctx context.Context, subID string) ([]finance.BillingCycle, error) {
	q := `
		SELECT id, subscription_id, period_start::text, period_end::text, amount,
		       currency, invoice_id, status, due_date::text, paid_at, created_at, updated_at
		FROM platform.billing_cycles
		WHERE subscription_id = $1 AND is_deleted = false
		ORDER BY period_start DESC`

	rows, err := r.db.QueryContext(ctx, q, subID)
	if err != nil {
		return nil, fmt.Errorf("list billing cycles: %w", err)
	}
	defer rows.Close()

	var cycles []finance.BillingCycle
	for rows.Next() {
		var bc finance.BillingCycle
		var start, end, due string
		if err := rows.Scan(
			&bc.ID, &bc.SubscriptionID, &start, &end, &bc.Amount,
			&bc.Currency, &bc.InvoiceID, &bc.Status, &due, &bc.PaidAt, &bc.CreatedAt, &bc.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan billing cycle: %w", err)
		}
		bc.PeriodStart = strings.Split(start, " ")[0]
		bc.PeriodEnd = strings.Split(end, " ")[0]
		bc.DueDate = strings.Split(due, " ")[0]
		cycles = append(cycles, bc)
	}

	return cycles, rows.Err()
}

func (r *pgBillingRepo) List(ctx context.Context, filter finance.BillingCycleFilter) ([]finance.BillingCycle, error) {
	q := `
		SELECT id, subscription_id, period_start::text, period_end::text, amount,
		       currency, invoice_id, status, due_date::text, paid_at, created_at, updated_at
		FROM platform.billing_cycles
		WHERE is_deleted = false`

	args := []any{}
	argIdx := 1

	if filter.SubscriptionID != "" {
		q += fmt.Sprintf(" AND subscription_id = $%d", argIdx)
		args = append(args, filter.SubscriptionID)
		argIdx++
	}

	if filter.Status != "" {
		q += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}

	q += " ORDER BY due_date DESC"

	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list all billing cycles: %w", err)
	}
	defer rows.Close()

	var cycles []finance.BillingCycle
	for rows.Next() {
		var bc finance.BillingCycle
		var start, end, due string
		if err := rows.Scan(
			&bc.ID, &bc.SubscriptionID, &start, &end, &bc.Amount,
			&bc.Currency, &bc.InvoiceID, &bc.Status, &due, &bc.PaidAt, &bc.CreatedAt, &bc.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan billing cycle: %w", err)
		}
		bc.PeriodStart = strings.Split(start, " ")[0]
		bc.PeriodEnd = strings.Split(end, " ")[0]
		bc.DueDate = strings.Split(due, " ")[0]
		cycles = append(cycles, bc)
	}

	return cycles, rows.Err()
}

func (r *pgBillingRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	if len(patch) == 0 {
		return nil
	}

	setFields := []string{}
	args := []any{id}
	argIdx := 2

	for k, v := range patch {
		if k != "status" && k != "invoice_id" && k != "paid_at" && k != "updated_at" {
			continue
		}
		setFields = append(setFields, fmt.Sprintf("%s = $%d", k, argIdx))
		args = append(args, v)
		argIdx++
	}

	if len(setFields) == 0 {
		return nil
	}

	q := fmt.Sprintf(`UPDATE platform.billing_cycles SET %s WHERE id = $1 AND is_deleted = false`, strings.Join(setFields, ", "))

	cmd, err := r.db.ExecContext(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("update billing cycle: %w", err)
	}
	rowsAffected, _ := cmd.RowsAffected()
	if rowsAffected == 0 {
		return finance.ErrNotFound
	}

	return nil
}

// ── Renewal Log Store ────────────────────────────────────────

type pgRenewalRepo struct {
	db *sql.DB
}

func NewPgRenewalRepo(db *sql.DB) finance.RenewalLogRepository {
	return &pgRenewalRepo{db: db}
}

func (r *pgRenewalRepo) Create(ctx context.Context, log finance.RenewalLog) (*finance.RenewalLog, error) {
	q := `
		INSERT INTO platform.renewal_logs (
			id, tenant_id, subscription_id, action, old_plan_id, new_plan_id,
			old_status, new_status, amount, notes, performed_by, created_at
		) VALUES (
			$1, (SELECT id FROM core.tenants WHERE code='default' LIMIT 1), $2, $3, $4, $5,
			$6, $7, $8, $9, $10, $11
		) RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		log.ID, log.SubscriptionID, log.Action, log.OldPlanID, log.NewPlanID,
		log.OldStatus, log.NewStatus, log.Amount, log.Notes, log.PerformedBy, log.CreatedAt,
	).Scan(&log.ID)

	if err != nil {
		return nil, fmt.Errorf("insert renewal log: %w", err)
	}

	return &log, nil
}

func (r *pgRenewalRepo) ListBySubscription(ctx context.Context, subID string) ([]finance.RenewalLog, error) {
	q := `
		SELECT id, subscription_id, action, old_plan_id, new_plan_id,
		       old_status, new_status, amount, notes, performed_by, created_at
		FROM platform.renewal_logs
		WHERE subscription_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, q, subID)
	if err != nil {
		return nil, fmt.Errorf("list renewal logs: %w", err)
	}
	defer rows.Close()

	var logs []finance.RenewalLog
	for rows.Next() {
		var l finance.RenewalLog
		if err := rows.Scan(
			&l.ID, &l.SubscriptionID, &l.Action, &l.OldPlanID, &l.NewPlanID,
			&l.OldStatus, &l.NewStatus, &l.Amount, &l.Notes, &l.PerformedBy, &l.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan renewal log: %w", err)
		}
		logs = append(logs, l)
	}

	return logs, rows.Err()
}
