package webhook

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

var idCounter int64

func testIDFunc() string {
	n := atomic.AddInt64(&idCounter, 1)
	return fmt.Sprintf("wh_%d", n)
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestSubscribe_Publish(t *testing.T) {
	received := make(chan Event, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Webhook-Event") == "" {
			t.Error("missing event header")
		}
		received <- Event{} // signal received
		w.WriteHeader(200)
	}))
	defer server.Close()

	cfg := DefaultConfig()
	cfg.RetryBaseWait = 10 * time.Millisecond
	svc := NewService(cfg, testLogger(), testIDFunc)
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Subscribe(Subscription{
		ID:     "sub_1",
		URL:    server.URL,
		Events: []EventType{EventTournamentCreated},
	})

	svc.Publish(Event{
		Type: EventTournamentCreated,
		Data: map[string]interface{}{"name": "Giải VCT 2026"},
	})

	select {
	case <-received:
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for webhook delivery")
	}
}

func TestPublish_FiltersByEventType(t *testing.T) {
	calls := int64(0)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt64(&calls, 1)
		w.WriteHeader(200)
	}))
	defer server.Close()

	svc := NewService(DefaultConfig(), testLogger(), testIDFunc)
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Subscribe(Subscription{
		ID:     "sub_match",
		URL:    server.URL,
		Events: []EventType{EventMatchStarted},
	})

	// Publish a tournament event — should NOT trigger
	svc.Publish(Event{Type: EventTournamentCreated})
	time.Sleep(100 * time.Millisecond)

	if atomic.LoadInt64(&calls) != 0 {
		t.Error("webhook should not fire for unsubscribed event")
	}
}

func TestHMAC_Signature(t *testing.T) {
	var receivedSig string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedSig = r.Header.Get("X-Webhook-Signature")
		w.WriteHeader(200)
	}))
	defer server.Close()

	cfg := DefaultConfig()
	svc := NewService(cfg, testLogger(), testIDFunc)
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Subscribe(Subscription{
		ID:     "sub_signed",
		URL:    server.URL,
		Secret: "my-webhook-secret-2026",
		Events: []EventType{EventAthleteRegistered},
	})

	svc.Publish(Event{Type: EventAthleteRegistered, Data: map[string]interface{}{"id": "a1"}})
	time.Sleep(200 * time.Millisecond)

	if receivedSig == "" {
		t.Fatal("expected HMAC signature header")
	}
	if len(receivedSig) < 10 {
		t.Errorf("signature too short: %s", receivedSig)
	}
}

func TestVerifySignature(t *testing.T) {
	payload := []byte(`{"type":"test"}`)
	secret := "my-secret"
	sig := "sha256=" + signPayload(payload, secret)

	if !VerifySignature(payload, sig, secret) {
		t.Error("valid signature should verify")
	}
	if VerifySignature(payload, "sha256=wrong", secret) {
		t.Error("invalid signature should not verify")
	}
}

func TestRetry_EventualSuccess(t *testing.T) {
	attempts := int64(0)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt64(&attempts, 1)
		if n < 3 {
			w.WriteHeader(500)
			return
		}
		w.WriteHeader(200)
	}))
	defer server.Close()

	cfg := DefaultConfig()
	cfg.RetryBaseWait = 10 * time.Millisecond
	cfg.MaxRetries = 5
	svc := NewService(cfg, testLogger(), testIDFunc)
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Subscribe(Subscription{ID: "sub_retry", URL: server.URL})
	svc.Publish(Event{Type: EventMatchFinished})

	time.Sleep(500 * time.Millisecond)

	if atomic.LoadInt64(&attempts) < 3 {
		t.Errorf("expected at least 3 attempts, got %d", atomic.LoadInt64(&attempts))
	}

	deliveries := svc.Deliveries()
	found := false
	for _, d := range deliveries {
		if d.Status == DeliverySuccess {
			found = true
		}
	}
	if !found {
		t.Error("expected a successful delivery after retries")
	}
}

func TestUnsubscribe(t *testing.T) {
	calls := int64(0)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt64(&calls, 1)
		w.WriteHeader(200)
	}))
	defer server.Close()

	svc := NewService(DefaultConfig(), testLogger(), testIDFunc)
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Subscribe(Subscription{ID: "sub_unsub", URL: server.URL})
	svc.Unsubscribe("sub_unsub")
	svc.Publish(Event{Type: EventTournamentCreated})

	time.Sleep(100 * time.Millisecond)
	if atomic.LoadInt64(&calls) != 0 {
		t.Error("unsubscribed endpoint should not receive events")
	}
}
