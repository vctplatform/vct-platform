package finance

import (
	"context"
	"fmt"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SUBSCRIPTION SERVICE TESTS
// ═══════════════════════════════════════════════════════════════

var testIDCounter int

func testIDGen() string {
	testIDCounter++
	return fmt.Sprintf("test-id-%d", testIDCounter)
}

func setupTestService() *SubscriptionService {
	testIDCounter = 0
	return NewSubscriptionService(
		NewInMemPlanRepo(),
		NewInMemSubRepo(),
		NewInMemBillingRepo(),
		NewInMemRenewalRepo(),
		nil, // invoice repo not needed for these tests
		testIDGen,
	)
}

func createTestPlan(t *testing.T, svc *SubscriptionService, code, entityType string) *SubscriptionPlan {
	t.Helper()
	plan, err := svc.CreatePlan(context.Background(), SubscriptionPlan{
		Code:           code,
		Name:           "Gói " + code,
		EntityType:     entityType,
		PriceMonthly:   1_000_000,
		PriceYearly:    10_000_000,
		Currency:       "VND",
		MaxMembers:     50,
		MaxTournaments: 5,
	})
	if err != nil {
		t.Fatalf("failed to create plan: %v", err)
	}
	return plan
}

// ── Test: Plan Creation ──────────────────────────────────────

func TestCreatePlan(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan, err := svc.CreatePlan(ctx, SubscriptionPlan{
		Code:         "basic",
		Name:         "Gói Cơ bản",
		EntityType:   "federation",
		PriceMonthly: 500_000,
		PriceYearly:  5_000_000,
		Currency:     "VND",
	})
	if err != nil {
		t.Fatalf("CreatePlan failed: %v", err)
	}
	if plan.ID == "" {
		t.Error("expected plan ID to be set")
	}
	if !plan.IsActive {
		t.Error("expected new plan to be active")
	}
}

func TestCreatePlan_DuplicateCode(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	createTestPlan(t, svc, "basic", "federation")

	_, err := svc.CreatePlan(ctx, SubscriptionPlan{
		Code:         "basic",
		Name:         "Duplicate",
		EntityType:   "federation",
		PriceMonthly: 500_000,
	})
	if err == nil {
		t.Error("expected error for duplicate plan code+entity_type")
	}
}

func TestCreatePlan_Validation(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	tests := []struct {
		name string
		plan SubscriptionPlan
	}{
		{"empty code", SubscriptionPlan{Name: "Test", EntityType: "federation", PriceMonthly: 1000}},
		{"empty name", SubscriptionPlan{Code: "test", EntityType: "federation", PriceMonthly: 1000}},
		{"empty entity type", SubscriptionPlan{Code: "test", Name: "Test", PriceMonthly: 1000}},
		{"zero price", SubscriptionPlan{Code: "test", Name: "Test", EntityType: "federation"}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := svc.CreatePlan(ctx, tc.plan)
			if err == nil {
				t.Errorf("expected validation error for %s", tc.name)
			}
		})
	}
}

// ── Test: Subscribe ──────────────────────────────────────────

func TestSubscribe(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "professional", "organization")

	sub, bc, err := svc.Subscribe(ctx, SubscribeInput{
		PlanID:           plan.ID,
		EntityType:       "organization",
		EntityID:         "org-001",
		EntityName:       "CLB VCT Bình Định",
		BillingCycleType: "yearly",
		CreatedBy:        "admin-001",
	})
	if err != nil {
		t.Fatalf("Subscribe failed: %v", err)
	}

	if sub.Status != SubStatusActive {
		t.Errorf("expected active status, got %s", sub.Status)
	}
	if sub.PlanID != plan.ID {
		t.Errorf("expected plan ID %s, got %s", plan.ID, sub.PlanID)
	}
	if sub.AutoRenew != true {
		t.Error("expected auto_renew to be true")
	}
	if bc.Amount != plan.PriceYearly {
		t.Errorf("expected billing amount %f, got %f", plan.PriceYearly, bc.Amount)
	}
	if bc.Status != BillingPending {
		t.Errorf("expected billing status pending, got %s", bc.Status)
	}
}

func TestSubscribe_WithTrial(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "federation")

	sub, _, err := svc.Subscribe(ctx, SubscribeInput{
		PlanID:           plan.ID,
		EntityType:       "federation",
		EntityID:         "fed-001",
		EntityName:       "Liên đoàn VCT TP.HCM",
		BillingCycleType: "monthly",
		TrialDays:        30,
		CreatedBy:        "admin-001",
	})
	if err != nil {
		t.Fatalf("Subscribe with trial failed: %v", err)
	}

	if sub.Status != SubStatusTrial {
		t.Errorf("expected trial status, got %s", sub.Status)
	}
	if sub.TrialEndDate == nil {
		t.Error("expected trial_end_date to be set")
	}
}

func TestSubscribe_DuplicateActive(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "organization")

	_, _, err := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})
	if err != nil {
		t.Fatalf("first Subscribe failed: %v", err)
	}

	_, _, err = svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})
	if err == nil {
		t.Error("expected error for duplicate active subscription")
	}
}

func TestSubscribe_MonthlyBilling(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "tournament")

	_, bc, err := svc.Subscribe(ctx, SubscribeInput{
		PlanID:           plan.ID,
		EntityType:       "tournament",
		EntityID:         "tour-001",
		EntityName:       "Giải VCT Quốc gia",
		BillingCycleType: "monthly",
		CreatedBy:        "admin",
	})
	if err != nil {
		t.Fatalf("Subscribe monthly failed: %v", err)
	}

	if bc.Amount != plan.PriceMonthly {
		t.Errorf("expected monthly price %f, got %f", plan.PriceMonthly, bc.Amount)
	}
}

// ── Test: Renew ──────────────────────────────────────────────

func TestRenewSubscription(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "pro", "federation")

	sub, _, err := svc.Subscribe(ctx, SubscribeInput{
		PlanID:           plan.ID,
		EntityType:       "federation",
		EntityID:         "fed-001",
		EntityName:       "Liên đoàn Test",
		BillingCycleType: "yearly",
		CreatedBy:        "admin",
	})
	if err != nil {
		t.Fatalf("Subscribe failed: %v", err)
	}

	newBC, err := svc.RenewSubscription(ctx, sub.ID, "admin")
	if err != nil {
		t.Fatalf("RenewSubscription failed: %v", err)
	}

	if newBC.Amount != plan.PriceYearly {
		t.Errorf("expected amount %f, got %f", plan.PriceYearly, newBC.Amount)
	}

	// Should have 2 billing cycles now
	cycles, _ := svc.ListBillingCycles(ctx, sub.ID)
	if len(cycles) != 2 {
		t.Errorf("expected 2 billing cycles, got %d", len(cycles))
	}
}

// ── Test: Cancel ─────────────────────────────────────────────

func TestCancelSubscription(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "organization")

	sub, _, _ := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})

	err := svc.CancelSubscription(ctx, sub.ID, "Không cần nữa", "admin")
	if err != nil {
		t.Fatalf("CancelSubscription failed: %v", err)
	}

	// Verify status
	updated, _ := svc.GetSubscription(ctx, sub.ID)
	if updated.Status != SubStatusCancelled {
		t.Errorf("expected cancelled status, got %s", updated.Status)
	}

	// Verify renewal log
	logs, _ := svc.ListRenewalLogs(ctx, sub.ID)
	found := false
	for _, l := range logs {
		if l.Action == RenewalCancel {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected cancel action in renewal logs")
	}
}

func TestCancelSubscription_AlreadyCancelled(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "organization")

	sub, _, _ := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})

	_ = svc.CancelSubscription(ctx, sub.ID, "reason", "admin")
	err := svc.CancelSubscription(ctx, sub.ID, "reason again", "admin")
	if err == nil {
		t.Error("expected error when cancelling already cancelled subscription")
	}
}

// ── Test: Suspend ────────────────────────────────────────────

func TestSuspendSubscription(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "federation")

	sub, _, _ := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "federation",
		EntityID:   "fed-001",
		EntityName: "LĐ Test",
		CreatedBy:  "admin",
	})

	err := svc.SuspendSubscription(ctx, sub.ID, "Chưa thanh toán", "system")
	if err != nil {
		t.Fatalf("SuspendSubscription failed: %v", err)
	}

	updated, _ := svc.GetSubscription(ctx, sub.ID)
	if updated.Status != SubStatusSuspended {
		t.Errorf("expected suspended, got %s", updated.Status)
	}
	if updated.AutoRenew != false {
		t.Error("expected auto_renew to be false after suspension")
	}
}

// ── Test: Upgrade / Downgrade ────────────────────────────────

func TestUpgradeDowngrade(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	basic := createTestPlan(t, svc, "basic", "organization")
	pro := createTestPlan(t, svc, "pro", "organization")

	sub, _, _ := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     basic.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})

	// Upgrade
	updated, err := svc.UpgradeDowngrade(ctx, UpgradeDowngradeInput{
		SubscriptionID: sub.ID,
		NewPlanID:      pro.ID,
		PerformedBy:    "admin",
	})
	if err != nil {
		t.Fatalf("Upgrade failed: %v", err)
	}
	if updated.PlanID != pro.ID {
		t.Errorf("expected plan ID %s, got %s", pro.ID, updated.PlanID)
	}

	// Verify log has upgrade action
	logs, _ := svc.ListRenewalLogs(ctx, sub.ID)
	found := false
	for _, l := range logs {
		if l.Action == RenewalUpgrade || l.Action == RenewalDowngrade {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected upgrade/downgrade action in renewal logs")
	}
}

func TestUpgradeDowngrade_SamePlan(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "organization")

	sub, _, _ := svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "organization",
		EntityID:   "org-001",
		EntityName: "CLB Test",
		CreatedBy:  "admin",
	})

	_, err := svc.UpgradeDowngrade(ctx, UpgradeDowngradeInput{
		SubscriptionID: sub.ID,
		NewPlanID:      plan.ID,
		PerformedBy:    "admin",
	})
	if err == nil {
		t.Error("expected error when upgrading to same plan")
	}
}

// ── Test: Status Transitions ─────────────────────────────────

func TestCanTransition(t *testing.T) {
	tests := []struct {
		from, to SubscriptionStatus
		expected bool
	}{
		{SubStatusActive, SubStatusCancelled, true},
		{SubStatusActive, SubStatusSuspended, true},
		{SubStatusActive, SubStatusPastDue, true},
		{SubStatusTrial, SubStatusActive, true},
		{SubStatusTrial, SubStatusCancelled, true},
		{SubStatusCancelled, SubStatusActive, false},    // terminal
		{SubStatusCancelled, SubStatusSuspended, false}, // terminal
		{SubStatusSuspended, SubStatusActive, true},     // reactivate
		{SubStatusExpired, SubStatusActive, true},       // reactivate
		{SubStatusPastDue, SubStatusActive, true},
	}

	for _, tc := range tests {
		t.Run(fmt.Sprintf("%s->%s", tc.from, tc.to), func(t *testing.T) {
			result := CanTransition(tc.from, tc.to)
			if result != tc.expected {
				t.Errorf("CanTransition(%s, %s) = %v, want %v", tc.from, tc.to, result, tc.expected)
			}
		})
	}
}

// ── Test: Queries ────────────────────────────────────────────

func TestGetSubscriptionByEntity(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	plan := createTestPlan(t, svc, "basic", "federation")

	_, _, _ = svc.Subscribe(ctx, SubscribeInput{
		PlanID:     plan.ID,
		EntityType: "federation",
		EntityID:   "fed-001",
		EntityName: "LĐ Test",
		CreatedBy:  "admin",
	})

	found, err := svc.GetSubscriptionByEntity(ctx, "federation", "fed-001")
	if err != nil {
		t.Fatalf("GetSubscriptionByEntity failed: %v", err)
	}
	if found.EntityID != "fed-001" {
		t.Errorf("expected entity ID fed-001, got %s", found.EntityID)
	}
}

func TestListSubscriptions(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	fedPlan := createTestPlan(t, svc, "basic", "federation")
	orgPlan := createTestPlan(t, svc, "basic", "organization")

	svc.Subscribe(ctx, SubscribeInput{PlanID: fedPlan.ID, EntityType: "federation", EntityID: "fed-1", EntityName: "LĐ 1", CreatedBy: "admin"})
	svc.Subscribe(ctx, SubscribeInput{PlanID: orgPlan.ID, EntityType: "organization", EntityID: "org-1", EntityName: "CLB 1", CreatedBy: "admin"})

	// List all
	all, _ := svc.ListSubscriptions(ctx, SubscriptionFilter{})
	if len(all) != 2 {
		t.Errorf("expected 2 subscriptions, got %d", len(all))
	}

	// Filter by entity type
	feds, _ := svc.ListSubscriptions(ctx, SubscriptionFilter{EntityType: "federation"})
	if len(feds) != 1 {
		t.Errorf("expected 1 federation subscription, got %d", len(feds))
	}
}
