package featureflag

import (
	"context"
	"testing"
)

func TestEvaluate_FlagNotFound(t *testing.T) {
	svc := NewService(NewMemoryStore(), "production")
	result := svc.Evaluate(context.Background(), "nonexistent", "user1")
	if result.Enabled {
		t.Error("expected disabled for nonexistent flag")
	}
	if result.Reason != "flag_not_found" {
		t.Errorf("expected reason flag_not_found, got %s", result.Reason)
	}
}

func TestEvaluate_Disabled(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{Key: "dark_mode", Enabled: false})
	svc := NewService(store, "production")

	result := svc.Evaluate(context.Background(), "dark_mode", "user1")
	if result.Enabled {
		t.Error("expected disabled")
	}
	if result.Reason != "flag_disabled" {
		t.Errorf("expected reason flag_disabled, got %s", result.Reason)
	}
}

func TestEvaluate_FullRollout(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{Key: "new_ui", Enabled: true, Percentage: 100})
	svc := NewService(store, "production")

	result := svc.Evaluate(context.Background(), "new_ui", "user1")
	if !result.Enabled {
		t.Error("expected enabled for 100% rollout")
	}
}

func TestEvaluate_AllowList(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{
		Key: "beta", Enabled: true, Percentage: 0,
		AllowList: []string{"vip_user"},
	})
	svc := NewService(store, "production")

	if !svc.IsEnabled(context.Background(), "beta", "vip_user") {
		t.Error("allow-listed user should be enabled")
	}
	if svc.IsEnabled(context.Background(), "beta", "normal_user") {
		t.Error("non-listed user should be disabled at 0%")
	}
}

func TestEvaluate_DenyList(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{
		Key: "feature", Enabled: true, Percentage: 100,
		DenyList: []string{"banned_user"},
	})
	svc := NewService(store, "production")

	if svc.IsEnabled(context.Background(), "feature", "banned_user") {
		t.Error("deny-listed user should be disabled")
	}
	if !svc.IsEnabled(context.Background(), "feature", "normal_user") {
		t.Error("normal user should be enabled at 100%")
	}
}

func TestEvaluate_PercentageRollout_Deterministic(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{Key: "gradual", Enabled: true, Percentage: 50})
	svc := NewService(store, "production")

	// Same user should always get same result
	r1 := svc.IsEnabled(context.Background(), "gradual", "consistent_user")
	r2 := svc.IsEnabled(context.Background(), "gradual", "consistent_user")
	if r1 != r2 {
		t.Error("percentage rollout should be deterministic for same user")
	}
}

func TestEvaluate_EnvironmentMismatch(t *testing.T) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{
		Key: "staging_only", Enabled: true, Percentage: 100,
		Environment: "staging",
	})
	svc := NewService(store, "production")

	if svc.IsEnabled(context.Background(), "staging_only", "user1") {
		t.Error("should be disabled in production when flag is staging-only")
	}
}

func BenchmarkEvaluate(b *testing.B) {
	store := NewMemoryStore()
	store.Set(context.Background(), &Flag{Key: "perf", Enabled: true, Percentage: 50})
	svc := NewService(store, "production")
	ctx := context.Background()

	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		svc.Evaluate(ctx, "perf", "user_123")
	}
}
