// Package webhook provides event subscription, HMAC-signed delivery,
// retry with exponential backoff, and delivery status tracking.
package webhook

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"math"
	"net/http"
	"sync"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// Event Types — VCT Platform domain events
// ═══════════════════════════════════════════════════════════════

type EventType string

const (
	EventTournamentCreated  EventType = "tournament.created"
	EventTournamentUpdated  EventType = "tournament.updated"
	EventTournamentStarted  EventType = "tournament.started"
	EventTournamentFinished EventType = "tournament.finished"
	EventAthleteRegistered  EventType = "athlete.registered"
	EventAthleteUpdated     EventType = "athlete.updated"
	EventMatchStarted       EventType = "match.started"
	EventMatchScored        EventType = "match.scored"
	EventMatchFinished      EventType = "match.finished"
	EventBracketGenerated   EventType = "bracket.generated"
	EventResultPublished    EventType = "result.published"
)

// Event is a webhook payload.
type Event struct {
	ID        string                 `json:"id"`
	Type      EventType              `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// ═══════════════════════════════════════════════════════════════
// Subscription — Who receives which events
// ═══════════════════════════════════════════════════════════════

// Subscription defines a webhook endpoint.
type Subscription struct {
	ID     string      `json:"id"`
	URL    string      `json:"url"`
	Secret string      `json:"secret"` // HMAC signing key
	Events []EventType `json:"events"` // subscribed event types
	Active bool        `json:"active"`
}

// ═══════════════════════════════════════════════════════════════
// Delivery — Tracking and retry
// ═══════════════════════════════════════════════════════════════

// DeliveryStatus tracks a delivery attempt.
type DeliveryStatus string

const (
	DeliveryPending   DeliveryStatus = "pending"
	DeliverySuccess   DeliveryStatus = "success"
	DeliveryFailed    DeliveryStatus = "failed"
	DeliveryExhausted DeliveryStatus = "exhausted"
)

// Delivery records a webhook delivery attempt.
type Delivery struct {
	ID             string         `json:"id"`
	SubscriptionID string         `json:"subscription_id"`
	EventID        string         `json:"event_id"`
	URL            string         `json:"url"`
	Status         DeliveryStatus `json:"status"`
	StatusCode     int            `json:"status_code"`
	Attempts       int            `json:"attempts"`
	MaxRetries     int            `json:"max_retries"`
	LastError      string         `json:"last_error,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	DeliveredAt    *time.Time     `json:"delivered_at,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// Service — Core webhook engine
// ═══════════════════════════════════════════════════════════════

// Config holds webhook service configuration.
type Config struct {
	MaxRetries    int
	RetryBaseWait time.Duration
	RetryMaxWait  time.Duration
	Timeout       time.Duration
	Workers       int
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() Config {
	return Config{
		MaxRetries:    5,
		RetryBaseWait: 1 * time.Second,
		RetryMaxWait:  5 * time.Minute,
		Timeout:       10 * time.Second,
		Workers:       4,
	}
}

// Service manages webhook subscriptions and delivery.
type Service struct {
	cfg        Config
	subs       map[string]*Subscription
	deliveries []Delivery
	client     *http.Client
	logger     *slog.Logger
	idFunc     func() string
	queue      chan deliveryTask
	mu         sync.RWMutex
	wg         sync.WaitGroup
	cancel     context.CancelFunc
}

type deliveryTask struct {
	sub   Subscription
	event Event
}

// NewService creates a webhook service.
func NewService(cfg Config, logger *slog.Logger, idFunc func() string) *Service {
	return &Service{
		cfg:    cfg,
		subs:   make(map[string]*Subscription),
		client: &http.Client{Timeout: cfg.Timeout},
		logger: logger.With(slog.String("component", "webhook")),
		idFunc: idFunc,
		queue:  make(chan deliveryTask, 500),
	}
}

// Subscribe registers a webhook endpoint.
func (s *Service) Subscribe(sub Subscription) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if sub.ID == "" {
		sub.ID = s.idFunc()
	}
	sub.Active = true
	s.subs[sub.ID] = &sub
}

// Unsubscribe removes a webhook endpoint.
func (s *Service) Unsubscribe(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if sub, ok := s.subs[id]; ok {
		sub.Active = false
	}
}

// Publish sends an event to all matching subscriptions.
func (s *Service) Publish(event Event) {
	if event.ID == "" {
		event.ID = s.idFunc()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, sub := range s.subs {
		if !sub.Active {
			continue
		}
		if !s.isSubscribed(sub, event.Type) {
			continue
		}
		select {
		case s.queue <- deliveryTask{sub: *sub, event: event}:
		default:
			s.logger.Warn("webhook queue full, dropping",
				slog.String("sub_id", sub.ID),
				slog.String("event", string(event.Type)),
			)
		}
	}
}

// Start launches delivery workers.
func (s *Service) Start(ctx context.Context) {
	ctx, s.cancel = context.WithCancel(ctx)
	for i := 0; i < s.cfg.Workers; i++ {
		s.wg.Add(1)
		go s.worker(ctx, i)
	}
	s.logger.Info("webhook service started", slog.Int("workers", s.cfg.Workers))
}

// Stop halts delivery workers.
func (s *Service) Stop() {
	s.cancel()
	s.wg.Wait()
	s.logger.Info("webhook service stopped")
}

// Deliveries returns all delivery records.
func (s *Service) Deliveries() []Delivery {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Delivery, len(s.deliveries))
	copy(result, s.deliveries)
	return result
}

// ── Internal ─────────────────────────────

func (s *Service) worker(ctx context.Context, id int) {
	defer s.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case task := <-s.queue:
			s.deliver(ctx, task)
		}
	}
}

func (s *Service) deliver(ctx context.Context, task deliveryTask) {
	delivery := Delivery{
		ID:             s.idFunc(),
		SubscriptionID: task.sub.ID,
		EventID:        task.event.ID,
		URL:            task.sub.URL,
		Status:         DeliveryPending,
		MaxRetries:     s.cfg.MaxRetries,
		CreatedAt:      time.Now().UTC(),
	}

	for attempt := 0; attempt <= s.cfg.MaxRetries; attempt++ {
		delivery.Attempts = attempt + 1

		err := s.send(task.sub, task.event)
		if err == nil {
			now := time.Now().UTC()
			delivery.Status = DeliverySuccess
			delivery.StatusCode = 200
			delivery.DeliveredAt = &now
			s.recordDelivery(delivery)
			return
		}

		delivery.LastError = err.Error()
		s.logger.Warn("webhook delivery failed",
			slog.String("sub_id", task.sub.ID),
			slog.String("url", task.sub.URL),
			slog.Int("attempt", attempt+1),
			slog.String("error", err.Error()),
		)

		if attempt < s.cfg.MaxRetries {
			wait := s.backoff(attempt)
			select {
			case <-time.After(wait):
			case <-ctx.Done():
				delivery.Status = DeliveryFailed
				s.recordDelivery(delivery)
				return
			}
		}
	}

	delivery.Status = DeliveryExhausted
	s.recordDelivery(delivery)
	s.logger.Error("webhook delivery exhausted",
		slog.String("sub_id", task.sub.ID),
		slog.Int("attempts", delivery.Attempts),
	)
}

func (s *Service) send(sub Subscription, event Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return apierror.Wrap(err, "WEBHOOK_500_MARSHAL", "lỗi mã hóa dữ liệu webhook")
	}

	req, err := http.NewRequest("POST", sub.URL, bytes.NewReader(payload))
	if err != nil {
		return apierror.Wrap(err, "WEBHOOK_500_REQUEST", "lỗi tạo yêu cầu webhook")
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Event", string(event.Type))
	req.Header.Set("X-Webhook-ID", event.ID)
	req.Header.Set("X-Webhook-Timestamp", event.Timestamp.Format(time.RFC3339))

	// HMAC-SHA256 signature
	if sub.Secret != "" {
		sig := signPayload(payload, sub.Secret)
		req.Header.Set("X-Webhook-Signature", "sha256="+sig)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return apierror.Wrap(err, "WEBHOOK_500_SEND", "lỗi gửi yêu cầu webhook")
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return apierror.Newf("WEBHOOK_ERR_RESPONSE", "phản hồi HTTP không hợp lệ: %d", resp.StatusCode)
}

func signPayload(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifySignature checks an incoming webhook's HMAC signature.
func VerifySignature(payload []byte, signature, secret string) bool {
	expected := "sha256=" + signPayload(payload, secret)
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (s *Service) backoff(attempt int) time.Duration {
	wait := time.Duration(float64(s.cfg.RetryBaseWait) * math.Pow(2, float64(attempt)))
	if wait > s.cfg.RetryMaxWait {
		wait = s.cfg.RetryMaxWait
	}
	return wait
}

func (s *Service) isSubscribed(sub *Subscription, eventType EventType) bool {
	if len(sub.Events) == 0 {
		return true // wildcard
	}
	for _, e := range sub.Events {
		if e == eventType {
			return true
		}
	}
	return false
}

func (s *Service) recordDelivery(d Delivery) {
	s.mu.Lock()
	s.deliveries = append(s.deliveries, d)
	s.mu.Unlock()
}
