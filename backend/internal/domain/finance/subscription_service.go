package finance

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SUBSCRIPTION SERVICE
// Business logic for subscription lifecycle management.
// ═══════════════════════════════════════════════════════════════

// SubscriptionService manages the full subscription lifecycle.
type SubscriptionService struct {
	planRepo    SubscriptionPlanRepository
	subRepo     SubscriptionRepository
	billingRepo BillingCycleRepository
	renewalRepo RenewalLogRepository
	invoiceRepo InvoiceRepository // reuse existing finance invoice
	idGenerator func() string
}

// NewSubscriptionService creates a new subscription service.
func NewSubscriptionService(
	plan SubscriptionPlanRepository,
	sub SubscriptionRepository,
	billing BillingCycleRepository,
	renewal RenewalLogRepository,
	invoice InvoiceRepository,
	idGen func() string,
) *SubscriptionService {
	return &SubscriptionService{
		planRepo:    plan,
		subRepo:     sub,
		billingRepo: billing,
		renewalRepo: renewal,
		invoiceRepo: invoice,
		idGenerator: idGen,
	}
}

// ── Plan Management ──────────────────────────────────────────

// CreatePlan creates a new subscription plan.
func (s *SubscriptionService) CreatePlan(ctx context.Context, plan SubscriptionPlan) (*SubscriptionPlan, error) {
	if plan.Code == "" {
		return nil, fmt.Errorf("%w: mã gói (code) không được để trống", ErrValidation)
	}
	if plan.Name == "" {
		return nil, fmt.Errorf("%w: tên gói không được để trống", ErrValidation)
	}
	if plan.EntityType == "" {
		return nil, fmt.Errorf("%w: loại đối tượng (entity_type) không được để trống", ErrValidation)
	}
	if plan.PriceMonthly <= 0 && plan.PriceYearly <= 0 {
		return nil, fmt.Errorf("%w: phải có ít nhất một mức giá (tháng hoặc năm) > 0", ErrValidation)
	}

	// Check for duplicate code+entity_type
	existing, _ := s.planRepo.GetByCode(ctx, plan.Code, plan.EntityType)
	if existing != nil {
		return nil, fmt.Errorf("%w: gói '%s' cho '%s' đã tồn tại", ErrConflict, plan.Code, plan.EntityType)
	}

	plan.ID = s.idGenerator()
	if plan.Currency == "" {
		plan.Currency = "VND"
	}
	plan.IsActive = true
	plan.CreatedAt = time.Now().UTC()
	plan.UpdatedAt = plan.CreatedAt

	return s.planRepo.Create(ctx, plan)
}

// UpdatePlan updates an existing subscription plan.
func (s *SubscriptionService) UpdatePlan(ctx context.Context, id string, patch map[string]interface{}) (*SubscriptionPlan, error) {
	plan, err := s.planRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w: gói dịch vụ không tìm thấy", ErrNotFound)
	}

	patch["updated_at"] = time.Now().UTC()
	if err := s.planRepo.Update(ctx, plan.ID, patch); err != nil {
		return nil, fmt.Errorf("không thể cập nhật gói: %w", err)
	}

	return s.planRepo.GetByID(ctx, id)
}

// DeactivatePlan soft-deletes a subscription plan.
func (s *SubscriptionService) DeactivatePlan(ctx context.Context, id string) error {
	_, err := s.planRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("%w: gói dịch vụ không tìm thấy", ErrNotFound)
	}
	return s.planRepo.Delete(ctx, id)
}

// ListPlans returns available plans for an entity type.
func (s *SubscriptionService) ListPlans(ctx context.Context, entityType string) ([]SubscriptionPlan, error) {
	return s.planRepo.List(ctx, entityType)
}

// GetPlan returns a plan by ID.
func (s *SubscriptionService) GetPlan(ctx context.Context, id string) (*SubscriptionPlan, error) {
	plan, err := s.planRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w: gói dịch vụ không tìm thấy", ErrNotFound)
	}
	return plan, nil
}

// ── Subscription Lifecycle ───────────────────────────────────

// Subscribe creates a new subscription for an entity.
func (s *SubscriptionService) Subscribe(ctx context.Context, input SubscribeInput) (*Subscription, *BillingCycle, error) {
	// Validate plan exists
	plan, err := s.planRepo.GetByID(ctx, input.PlanID)
	if err != nil {
		return nil, nil, fmt.Errorf("%w: không tìm thấy gói dịch vụ", ErrNotFound)
	}
	if !plan.IsActive {
		return nil, nil, fmt.Errorf("%w: gói '%s' hiện không khả dụng", ErrValidation, plan.Name)
	}

	// Check entity doesn't already have an active subscription
	existing, _ := s.subRepo.GetByEntity(ctx, input.EntityType, input.EntityID)
	if existing != nil && existing.Status != SubStatusCancelled && existing.Status != SubStatusExpired {
		return nil, nil, fmt.Errorf("%w: đối tượng đã có subscription đang hoạt động (trạng thái: %s)", ErrConflict, existing.Status)
	}

	now := time.Now().UTC()

	// Calculate period
	periodStart := now.Format("2006-01-02")
	var periodEnd string
	var amount float64

	billingCycle := input.BillingCycleType
	if billingCycle == "" {
		billingCycle = "yearly"
	}

	switch billingCycle {
	case "monthly":
		periodEnd = now.AddDate(0, 1, 0).Format("2006-01-02")
		amount = plan.PriceMonthly
	case "yearly":
		periodEnd = now.AddDate(1, 0, 0).Format("2006-01-02")
		amount = plan.PriceYearly
	default:
		return nil, nil, fmt.Errorf("%w: billing cycle không hợp lệ: %s (chỉ hỗ trợ 'monthly' hoặc 'yearly')", ErrValidation, billingCycle)
	}

	// Handle trial period
	status := SubStatusActive
	var trialEnd *string
	if input.TrialDays > 0 {
		status = SubStatusTrial
		te := now.AddDate(0, 0, input.TrialDays).Format("2006-01-02")
		trialEnd = &te
	}

	// Create subscription
	sub := Subscription{
		ID:                 s.idGenerator(),
		PlanID:             plan.ID,
		PlanCode:           plan.Code,
		PlanName:           plan.Name,
		EntityType:         input.EntityType,
		EntityID:           input.EntityID,
		EntityName:         input.EntityName,
		Status:             status,
		BillingCycleType:   billingCycle,
		CurrentPeriodStart: periodStart,
		CurrentPeriodEnd:   periodEnd,
		TrialEndDate:       trialEnd,
		AutoRenew:          true,
		CreatedBy:          input.CreatedBy,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	created, err := s.subRepo.Create(ctx, sub)
	if err != nil {
		return nil, nil, fmt.Errorf("không thể tạo subscription: %w", err)
	}

	// Create first billing cycle
	dueDate := now.AddDate(0, 0, 15).Format("2006-01-02") // 15 days to pay
	if input.TrialDays > 0 {
		// If trial, due date = end of trial
		dueDate = *trialEnd
	}

	bc := BillingCycle{
		ID:             s.idGenerator(),
		SubscriptionID: created.ID,
		PeriodStart:    periodStart,
		PeriodEnd:      periodEnd,
		Amount:         amount,
		Currency:       plan.Currency,
		Status:         BillingPending,
		DueDate:        dueDate,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	createdBC, err := s.billingRepo.Create(ctx, bc)
	if err != nil {
		return nil, nil, fmt.Errorf("không thể tạo billing cycle: %w", err)
	}

	// Log the action
	_ = s.logRenewal(ctx, created.ID, RenewalManual, nil, &plan.ID, "", status, amount, "Đăng ký gói mới", input.CreatedBy)

	return created, createdBC, nil
}

// ── SubscribeInput ───────────────────────────────────────────

// SubscribeInput contains input parameters for creating a subscription.
type SubscribeInput struct {
	PlanID           string `json:"plan_id"`
	EntityType       string `json:"entity_type"`
	EntityID         string `json:"entity_id"`
	EntityName       string `json:"entity_name"`
	BillingCycleType string `json:"billing_cycle_type"` // "monthly" or "yearly"
	TrialDays        int    `json:"trial_days,omitempty"`
	CreatedBy        string `json:"created_by"`
}

// ── Renewal ──────────────────────────────────────────────────

// RenewSubscription extends a subscription for a new period.
func (s *SubscriptionService) RenewSubscription(ctx context.Context, subscriptionID, performedBy string) (*BillingCycle, error) {
	sub, err := s.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return nil, fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	// Only active or past_due can be renewed
	if sub.Status != SubStatusActive && sub.Status != SubStatusPastDue && sub.Status != SubStatusExpired {
		return nil, fmt.Errorf("%w: không thể gia hạn subscription ở trạng thái '%s'", ErrValidation, sub.Status)
	}

	plan, err := s.planRepo.GetByID(ctx, sub.PlanID)
	if err != nil {
		return nil, fmt.Errorf("%w: không tìm thấy gói dịch vụ", ErrNotFound)
	}

	// Calculate new period from end of current period
	currentEnd, err := time.Parse("2006-01-02", sub.CurrentPeriodEnd)
	if err != nil {
		currentEnd = time.Now().UTC()
	}

	// If current period has already ended, start from now
	if currentEnd.Before(time.Now().UTC()) {
		currentEnd = time.Now().UTC()
	}

	newStart := currentEnd.Format("2006-01-02")
	var newEnd string
	var amount float64

	switch sub.BillingCycleType {
	case "monthly":
		newEnd = currentEnd.AddDate(0, 1, 0).Format("2006-01-02")
		amount = plan.PriceMonthly
	default: // yearly
		newEnd = currentEnd.AddDate(1, 0, 0).Format("2006-01-02")
		amount = plan.PriceYearly
	}

	now := time.Now().UTC()
	dueDate := now.AddDate(0, 0, 15).Format("2006-01-02")

	// Create new billing cycle
	bc := BillingCycle{
		ID:             s.idGenerator(),
		SubscriptionID: sub.ID,
		PeriodStart:    newStart,
		PeriodEnd:      newEnd,
		Amount:         amount,
		Currency:       plan.Currency,
		Status:         BillingPending,
		DueDate:        dueDate,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	createdBC, err := s.billingRepo.Create(ctx, bc)
	if err != nil {
		return nil, fmt.Errorf("không thể tạo billing cycle: %w", err)
	}

	// Update subscription period and status
	oldStatus := sub.Status
	if err := s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"current_period_start": newStart,
		"current_period_end":   newEnd,
		"status":               string(SubStatusActive),
		"updated_at":           now,
	}); err != nil {
		return nil, fmt.Errorf("không thể cập nhật subscription: %w", err)
	}

	_ = s.logRenewal(ctx, sub.ID, RenewalManual, &sub.PlanID, &sub.PlanID, oldStatus, SubStatusActive, amount, "Gia hạn subscription", performedBy)

	return createdBC, nil
}

// ── Reactivation ─────────────────────────────────────────────

// ReactivateSubscription reactivates a suspended subscription.
func (s *SubscriptionService) ReactivateSubscription(ctx context.Context, subscriptionID, performedBy string) error {
	sub, err := s.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	if !CanTransition(sub.Status, SubStatusActive) {
		return fmt.Errorf("%w: không thể kích hoạt lại subscription ở trạng thái '%s'", ErrValidation, sub.Status)
	}

	now := time.Now().UTC()
	oldStatus := sub.Status

	if err := s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"status":     string(SubStatusActive),
		"auto_renew": true,
		"updated_at": now,
	}); err != nil {
		return fmt.Errorf("không thể kích hoạt lại subscription: %w", err)
	}

	_ = s.logRenewal(ctx, sub.ID, RenewalReactivate, &sub.PlanID, nil, oldStatus, SubStatusActive, 0, "Kích hoạt lại subscription", performedBy)
	return nil
}

// ── Upgrade / Downgrade ──────────────────────────────────────

// UpgradeDowngradeInput contains input for plan change.
type UpgradeDowngradeInput struct {
	SubscriptionID string `json:"subscription_id"`
	NewPlanID      string `json:"new_plan_id"`
	PerformedBy    string `json:"performed_by"`
}

// UpgradeDowngrade changes the plan for a subscription.
func (s *SubscriptionService) UpgradeDowngrade(ctx context.Context, input UpgradeDowngradeInput) (*Subscription, error) {
	sub, err := s.subRepo.GetByID(ctx, input.SubscriptionID)
	if err != nil {
		return nil, fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	if sub.Status != SubStatusActive && sub.Status != SubStatusTrial {
		return nil, fmt.Errorf("%w: chỉ có thể đổi gói khi subscription đang active hoặc trial", ErrValidation)
	}

	newPlan, err := s.planRepo.GetByID(ctx, input.NewPlanID)
	if err != nil {
		return nil, fmt.Errorf("%w: không tìm thấy gói mới", ErrNotFound)
	}

	if newPlan.EntityType != sub.EntityType {
		return nil, fmt.Errorf("%w: gói mới phải cùng loại đối tượng (%s)", ErrValidation, sub.EntityType)
	}

	if sub.PlanID == input.NewPlanID {
		return nil, fmt.Errorf("%w: đã đang sử dụng gói này", ErrConflict)
	}

	oldPlanID := sub.PlanID

	// Determine action
	action := RenewalUpgrade
	oldPlan, _ := s.planRepo.GetByID(ctx, oldPlanID)
	if oldPlan != nil && newPlan.PriceYearly < oldPlan.PriceYearly {
		action = RenewalDowngrade
	}

	now := time.Now().UTC()

	// Update subscription with new plan
	if err := s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"plan_id":    input.NewPlanID,
		"plan_code":  newPlan.Code,
		"plan_name":  newPlan.Name,
		"updated_at": now,
	}); err != nil {
		return nil, fmt.Errorf("không thể cập nhật subscription: %w", err)
	}

	oldPlanName := "N/A"
	if oldPlan != nil {
		oldPlanName = oldPlan.Name
	}
	_ = s.logRenewal(ctx, sub.ID, action, &oldPlanID, &input.NewPlanID, sub.Status, sub.Status, 0, fmt.Sprintf("Đổi gói: %s → %s", oldPlanName, newPlan.Name), input.PerformedBy)

	// Return updated subscription
	return s.subRepo.GetByID(ctx, sub.ID)
}

// ── Cancellation ─────────────────────────────────────────────

// CancelSubscription cancels a subscription.
func (s *SubscriptionService) CancelSubscription(ctx context.Context, subscriptionID, reason, performedBy string) error {
	sub, err := s.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	if !CanTransition(sub.Status, SubStatusCancelled) {
		return fmt.Errorf("%w: không thể hủy subscription ở trạng thái '%s'", ErrValidation, sub.Status)
	}

	now := time.Now().UTC()
	oldStatus := sub.Status

	if err := s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"status":        string(SubStatusCancelled),
		"cancelled_at":  now,
		"cancel_reason": reason,
		"auto_renew":    false,
		"updated_at":    now,
	}); err != nil {
		return fmt.Errorf("không thể hủy subscription: %w", err)
	}

	_ = s.logRenewal(ctx, sub.ID, RenewalCancel, &sub.PlanID, nil, oldStatus, SubStatusCancelled, 0, reason, performedBy)
	return nil
}

// ── Suspension ───────────────────────────────────────────────

// SuspendSubscription suspends a subscription due to non-payment.
func (s *SubscriptionService) SuspendSubscription(ctx context.Context, subscriptionID, reason, performedBy string) error {
	sub, err := s.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	if !CanTransition(sub.Status, SubStatusSuspended) {
		return fmt.Errorf("%w: không thể tạm ngưng subscription ở trạng thái '%s'", ErrValidation, sub.Status)
	}

	now := time.Now().UTC()
	oldStatus := sub.Status

	if err := s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"status":     string(SubStatusSuspended),
		"auto_renew": false,
		"updated_at": now,
	}); err != nil {
		return fmt.Errorf("không thể tạm ngưng subscription: %w", err)
	}

	_ = s.logRenewal(ctx, sub.ID, RenewalSuspend, &sub.PlanID, nil, oldStatus, SubStatusSuspended, 0, reason, performedBy)
	return nil
}

// ── Auto-Renew Toggle ────────────────────────────────────────

// ToggleAutoRenew enables or disables auto-renewal on a subscription.
func (s *SubscriptionService) ToggleAutoRenew(ctx context.Context, subscriptionID string, autoRenew bool, performedBy string) error {
	sub, err := s.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return fmt.Errorf("%w: không tìm thấy subscription", ErrNotFound)
	}

	if sub.Status == SubStatusCancelled || sub.Status == SubStatusExpired {
		return fmt.Errorf("%w: không thể thay đổi tự gia hạn cho subscription đã hủy/hết hạn", ErrValidation)
	}

	now := time.Now().UTC()
	return s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
		"auto_renew": autoRenew,
		"updated_at": now,
	})
}

// ── Billing Payment ──────────────────────────────────────────

// MarkBillingCyclePaid marks a billing cycle as paid.
func (s *SubscriptionService) MarkBillingCyclePaid(ctx context.Context, billingCycleID, performedBy string) (*BillingCycle, error) {
	bc, err := s.billingRepo.GetByID(ctx, billingCycleID)
	if err != nil {
		return nil, fmt.Errorf("%w: không tìm thấy billing cycle", ErrNotFound)
	}

	if bc.Status == BillingPaid {
		return nil, fmt.Errorf("%w: billing cycle đã được thanh toán", ErrConflict)
	}
	if bc.Status == BillingVoid {
		return nil, fmt.Errorf("%w: billing cycle đã bị hủy", ErrValidation)
	}

	now := time.Now().UTC()
	if err := s.billingRepo.Update(ctx, bc.ID, map[string]interface{}{
		"status":  string(BillingPaid),
		"paid_at": now,
	}); err != nil {
		return nil, fmt.Errorf("không thể cập nhật billing cycle: %w", err)
	}

	// If subscription is past_due, reactivate it
	sub, _ := s.subRepo.GetByID(ctx, bc.SubscriptionID)
	if sub != nil && sub.Status == SubStatusPastDue {
		_ = s.subRepo.Update(ctx, sub.ID, map[string]interface{}{
			"status":     string(SubStatusActive),
			"updated_at": now,
		})
		_ = s.logRenewal(ctx, sub.ID, RenewalReactivate, &sub.PlanID, nil, SubStatusPastDue, SubStatusActive, bc.Amount, "Thanh toán thành công — kích hoạt lại", performedBy)
	}

	return s.billingRepo.GetByID(ctx, bc.ID)
}

// ── Queries ──────────────────────────────────────────────────

// GetSubscription returns a subscription by ID.
func (s *SubscriptionService) GetSubscription(ctx context.Context, id string) (*Subscription, error) {
	sub, err := s.subRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w: subscription không tìm thấy", ErrNotFound)
	}
	return sub, nil
}

// GetSubscriptionByEntity returns the current subscription for an entity.
func (s *SubscriptionService) GetSubscriptionByEntity(ctx context.Context, entityType, entityID string) (*Subscription, error) {
	return s.subRepo.GetByEntity(ctx, entityType, entityID)
}

// ListSubscriptions returns filtered subscriptions.
func (s *SubscriptionService) ListSubscriptions(ctx context.Context, filter SubscriptionFilter) ([]Subscription, error) {
	return s.subRepo.List(ctx, filter)
}

// ListExpiringSubscriptions returns subscriptions expiring within N days.
func (s *SubscriptionService) ListExpiringSubscriptions(ctx context.Context, withinDays int) ([]Subscription, error) {
	deadline := time.Now().UTC().AddDate(0, 0, withinDays).Format("2006-01-02")
	return s.subRepo.List(ctx, SubscriptionFilter{
		Status:         SubStatusActive,
		ExpiringBefore: deadline,
	})
}

// ListBillingCycles returns billing cycles for a subscription.
func (s *SubscriptionService) ListBillingCycles(ctx context.Context, subscriptionID string) ([]BillingCycle, error) {
	return s.billingRepo.ListBySubscription(ctx, subscriptionID)
}

// ListAllBillingCycles returns filtered billing cycles.
func (s *SubscriptionService) ListAllBillingCycles(ctx context.Context, filter BillingCycleFilter) ([]BillingCycle, error) {
	return s.billingRepo.List(ctx, filter)
}

// ListRenewalLogs returns renewal history for a subscription.
func (s *SubscriptionService) ListRenewalLogs(ctx context.Context, subscriptionID string) ([]RenewalLog, error) {
	return s.renewalRepo.ListBySubscription(ctx, subscriptionID)
}

// ── Helpers ──────────────────────────────────────────────────

func (s *SubscriptionService) logRenewal(ctx context.Context, subID string, action RenewalAction, oldPlanID, newPlanID *string, oldStatus, newStatus SubscriptionStatus, amount float64, notes, performedBy string) error {
	log := RenewalLog{
		ID:             s.idGenerator(),
		SubscriptionID: subID,
		Action:         action,
		OldPlanID:      oldPlanID,
		NewPlanID:      newPlanID,
		OldStatus:      oldStatus,
		NewStatus:      newStatus,
		Amount:         amount,
		Notes:          notes,
		PerformedBy:    performedBy,
		CreatedAt:      time.Now().UTC(),
	}
	_, err := s.renewalRepo.Create(ctx, log)
	return err
}
