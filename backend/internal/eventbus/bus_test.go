package eventbus

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

// ── Test events ──────────────────────

type ScoreUpdated struct {
	MatchID string
	Red     int
	Blue    int
}

func (e ScoreUpdated) EventName() string { return "match.score_updated" }

type AthleteRegistered struct {
	AthleteID string
	Name      string
}

func (e AthleteRegistered) EventName() string { return "athlete.registered" }

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestPublish_Sync(t *testing.T) {
	bus := New(testLogger())
	var received atomic.Int32

	bus.Subscribe("match.score_updated", func(ctx context.Context, event Event) error {
		received.Add(1)
		score := event.(ScoreUpdated)
		if score.MatchID != "m1" {
			t.Errorf("expected m1, got %s", score.MatchID)
		}
		return nil
	})

	err := bus.Publish(context.Background(), ScoreUpdated{MatchID: "m1", Red: 10, Blue: 8})
	if err != nil {
		t.Fatal(err)
	}
	if received.Load() != 1 {
		t.Errorf("expected 1 handler call, got %d", received.Load())
	}
}

func TestPublish_MultipleHandlers(t *testing.T) {
	bus := New(testLogger())
	var count atomic.Int32

	bus.Subscribe("athlete.registered", func(ctx context.Context, event Event) error {
		count.Add(1)
		return nil
	})
	bus.Subscribe("athlete.registered", func(ctx context.Context, event Event) error {
		count.Add(1)
		return nil
	})

	bus.Publish(context.Background(), AthleteRegistered{AthleteID: "a1", Name: "Nguyen"})

	if count.Load() != 2 {
		t.Errorf("expected 2, got %d", count.Load())
	}
}

func TestPublish_ErrorPropagation(t *testing.T) {
	bus := New(testLogger())

	bus.Subscribe("match.score_updated", func(ctx context.Context, event Event) error {
		return errors.New("handler error")
	})

	err := bus.Publish(context.Background(), ScoreUpdated{MatchID: "m1"})
	if err == nil {
		t.Error("expected error from handler")
	}
}

func TestPublishAsync(t *testing.T) {
	bus := New(testLogger())
	var received atomic.Int32

	bus.Subscribe("match.score_updated", func(ctx context.Context, event Event) error {
		received.Add(1)
		return nil
	})

	bus.PublishAsync(context.Background(), ScoreUpdated{MatchID: "m1"})
	time.Sleep(50 * time.Millisecond)

	if received.Load() != 1 {
		t.Errorf("expected 1, got %d", received.Load())
	}
}

func TestHistory(t *testing.T) {
	bus := New(testLogger())

	bus.Publish(context.Background(), ScoreUpdated{MatchID: "m1"})
	bus.Publish(context.Background(), AthleteRegistered{AthleteID: "a1"})
	bus.Publish(context.Background(), ScoreUpdated{MatchID: "m2"})

	all := bus.History()
	if len(all) != 3 {
		t.Errorf("expected 3 events, got %d", len(all))
	}

	scores := bus.HistoryByName("match.score_updated")
	if len(scores) != 2 {
		t.Errorf("expected 2 score events, got %d", len(scores))
	}
}

func TestNoSubscribers(t *testing.T) {
	bus := New(testLogger())
	// Should not panic
	err := bus.Publish(context.Background(), ScoreUpdated{MatchID: "m1"})
	if err != nil {
		t.Error("no subscribers = no error")
	}

	if len(bus.History()) != 1 {
		t.Error("event should still be recorded in history")
	}
}

func TestReset(t *testing.T) {
	bus := New(testLogger())
	bus.Subscribe("match.score_updated", func(ctx context.Context, event Event) error { return nil })
	bus.Publish(context.Background(), ScoreUpdated{MatchID: "m1"})

	bus.Reset()

	if bus.HandlerCount("match.score_updated") != 0 {
		t.Error("expected 0 handlers after reset")
	}
	if len(bus.History()) != 0 {
		t.Error("expected empty history after reset")
	}
}

func TestHandlerCount(t *testing.T) {
	bus := New(testLogger())
	if bus.HandlerCount("x") != 0 {
		t.Error("expected 0")
	}
	bus.Subscribe("x", func(ctx context.Context, event Event) error { return nil })
	bus.Subscribe("x", func(ctx context.Context, event Event) error { return nil })
	if bus.HandlerCount("x") != 2 {
		t.Errorf("expected 2, got %d", bus.HandlerCount("x"))
	}
}
