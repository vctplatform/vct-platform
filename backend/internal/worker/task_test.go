package worker

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Worker Tests
// ═══════════════════════════════════════════════════════════════

// ── Mock Handler ─────────────────────────────────────────────

type mockHandler struct {
	handledCount atomic.Int32
	shouldFail   bool
}

func (h *mockHandler) TaskType() string { return "test_task" }

func (h *mockHandler) Handle(_ context.Context, _ map[string]any) error {
	h.handledCount.Add(1)
	if h.shouldFail {
		return errors.New("mock failure")
	}
	return nil
}

// ── Dispatcher Tests ─────────────────────────────────────────

func TestDispatcherStartStop(t *testing.T) {
	d := NewDispatcher(DefaultConfig())
	d.Start()
	stats := d.Stats()
	if !stats.Running {
		t.Error("expected running=true after Start")
	}
	d.Stop()

	stats = d.Stats()
	if stats.Running {
		t.Error("expected running=false after Stop")
	}
}

func TestSubmitAndProcess(t *testing.T) {
	handler := &mockHandler{}
	d := NewDispatcher(DispatcherConfig{WorkerCount: 2, QueueSize: 10, RetryDelay: time.Millisecond, DefaultRetries: 1})
	d.Register(handler)
	d.Start()
	defer d.Stop()

	task := &Task{ID: "T-001", Type: "test_task", Payload: map[string]any{"key": "value"}}
	if err := d.Submit(task); err != nil {
		t.Fatalf("Submit: %v", err)
	}

	// Wait for processing
	time.Sleep(100 * time.Millisecond)
	if handler.handledCount.Load() != 1 {
		t.Errorf("expected 1 handled, got %d", handler.handledCount.Load())
	}

	stats := d.Stats()
	if stats.Processed != 1 {
		t.Errorf("expected processed=1, got %d", stats.Processed)
	}
}

func TestSubmitUnknownTaskType(t *testing.T) {
	d := NewDispatcher(DefaultConfig())
	d.Start()
	defer d.Stop()

	err := d.Submit(&Task{ID: "T-UNK", Type: "unknown_type"})
	if err == nil {
		t.Error("expected error for unknown task type")
	}
}

func TestSubmitWhenStopped(t *testing.T) {
	d := NewDispatcher(DefaultConfig())
	// Don't start
	err := d.Submit(&Task{ID: "T-STOP", Type: "test_task"})
	if err == nil {
		t.Error("expected error when submitting to stopped dispatcher")
	}
}

func TestRetryOnFailure(t *testing.T) {
	handler := &mockHandler{shouldFail: true}
	d := NewDispatcher(DispatcherConfig{
		WorkerCount:    1,
		QueueSize:      10,
		RetryDelay:     10 * time.Millisecond,
		DefaultRetries: 3,
	})
	d.Register(handler)
	d.Start()
	defer d.Stop()

	_ = d.Submit(&Task{ID: "T-RETRY", Type: "test_task"})
	time.Sleep(200 * time.Millisecond)

	// Should have been called 3 times (initial + 2 retries)
	count := handler.handledCount.Load()
	if count < 2 {
		t.Errorf("expected at least 2 attempts (retries), got %d", count)
	}
}

func TestRegisterAll(t *testing.T) {
	d := NewDispatcher(DefaultConfig())
	RegisterAll(d)

	stats := d.Stats()
	if stats.Handlers != 4 {
		t.Errorf("expected 4 registered handlers, got %d", stats.Handlers)
	}
}

// ── Task Handler Tests ───────────────────────────────────────

func TestNotificationHandlerValidation(t *testing.T) {
	h := &NotificationHandler{}
	if h.TaskType() != "send_notification" {
		t.Errorf("expected task type send_notification")
	}
	// Missing fields should error
	err := h.Handle(context.Background(), map[string]any{})
	if err == nil {
		t.Error("expected error for missing fields")
	}
	// Valid payload
	err = h.Handle(context.Background(), map[string]any{
		"recipient_id": "U-001", "template": "welcome", "channel": "email",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestExportReportHandlerValidation(t *testing.T) {
	h := &ExportReportHandler{}
	if h.TaskType() != "export_tournament_report" {
		t.Errorf("expected task type export_tournament_report")
	}
	err := h.Handle(context.Background(), map[string]any{})
	if err == nil {
		t.Error("expected error for missing tournament_id")
	}
	err = h.Handle(context.Background(), map[string]any{"tournament_id": "TRN-1"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSyncEloHandler(t *testing.T) {
	h := &SyncEloHandler{}
	if h.TaskType() != "sync_elo_ratings" {
		t.Errorf("expected task type sync_elo_ratings")
	}
	err := h.Handle(context.Background(), map[string]any{"tournament_id": "TRN-1"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCleanupTokensHandler(t *testing.T) {
	h := &CleanupTokensHandler{}
	if h.TaskType() != "cleanup_expired_tokens" {
		t.Errorf("expected task type cleanup_expired_tokens")
	}
	err := h.Handle(context.Background(), map[string]any{"older_than_hours": float64(24)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
