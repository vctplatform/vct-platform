package events

import (
	"log/slog"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — EVENT BUS
// Lightweight pub/sub for domain events. Enables real-time
// notifications, WebSocket broadcasting, and audit logging.
// Enhanced with structured logging, subscriber IDs, async dispatch.
// ═══════════════════════════════════════════════════════════════

// EventType categorizes domain events.
type EventType string

const (
	// Approval Events
	EventApprovalSubmitted EventType = "approval.submitted"
	EventApprovalApproved  EventType = "approval.approved"
	EventApprovalRejected  EventType = "approval.rejected"
	EventApprovalReturned  EventType = "approval.returned"
	EventApprovalCancelled EventType = "approval.cancelled"

	// Document Events
	EventDocumentDrafted   EventType = "document.drafted"
	EventDocumentSubmitted EventType = "document.submitted"
	EventDocumentApproved  EventType = "document.approved"
	EventDocumentPublished EventType = "document.published"
	EventDocumentRevoked   EventType = "document.revoked"

	// Certification Events
	EventCertIssued   EventType = "certification.issued"
	EventCertRenewed  EventType = "certification.renewed"
	EventCertRevoked  EventType = "certification.revoked"
	EventCertExpiring EventType = "certification.expiring"

	// Discipline Events
	EventCaseReported     EventType = "discipline.reported"
	EventCaseInvestigated EventType = "discipline.investigated"
	EventHearingScheduled EventType = "discipline.hearing_scheduled"
	EventCaseDismissed    EventType = "discipline.dismissed"

	// International Events
	EventPartnerCreated   EventType = "international.partner_created"
	EventEventCreated     EventType = "international.event_created"
	EventDelegationFormed EventType = "international.delegation_formed"

	// Federation Events
	EventProvinceCreated   EventType = "federation.province_created"
	EventUnitCreated       EventType = "federation.unit_created"
	EventPersonnelAssigned EventType = "federation.personnel_assigned"
)

// DomainEvent represents a domain event emitted by services.
type DomainEvent struct {
	Type       EventType      `json:"type"`
	EntityType string         `json:"entity_type"`
	EntityID   string         `json:"entity_id"`
	ActorID    string         `json:"actor_id"`
	Payload    map[string]any `json:"payload,omitempty"`
	Timestamp  time.Time      `json:"timestamp"`
}

// Handler is a function that processes domain events.
type Handler func(event DomainEvent)

// Bus is the event bus interface.
type Bus interface {
	// Publish emits an event to all subscribers (synchronous).
	Publish(event DomainEvent)
	// PublishAsync emits an event to all subscribers (non-blocking).
	PublishAsync(event DomainEvent)
	// Subscribe registers a handler for specific event types.
	// Pass empty types slice to subscribe to ALL events.
	// Returns a subscription ID for unsubscribing.
	Subscribe(handler Handler, types ...EventType) string
	// Unsubscribe removes a subscriber by ID.
	Unsubscribe(id string)
}

// BusStats holds event bus statistics.
type BusStats struct {
	TotalPublished int64 `json:"total_published"`
	TotalDelivered int64 `json:"total_delivered"`
	TotalPanics    int64 `json:"total_panics"`
	Subscribers    int   `json:"subscribers"`
	HistoryLen     int   `json:"history_len"`
}

// ── In-Memory Implementation ─────────────────────────────────

type subscription struct {
	id      string
	handler Handler
	types   map[EventType]bool // nil = all events
}

// InMemoryBus is an in-memory event bus with sync and async dispatch.
type InMemoryBus struct {
	mu          sync.RWMutex
	subscribers []subscription
	history     []DomainEvent
	maxHistory  int
	nextID      int
	logger      *slog.Logger

	// Atomic stats
	totalPublished atomic.Int64
	totalDelivered atomic.Int64
	totalPanics    atomic.Int64
}

// NewBus creates a new in-memory event bus.
func NewBus() *InMemoryBus {
	return &InMemoryBus{
		maxHistory: 1000,
		logger:     slog.Default().With("component", "eventbus"),
	}
}

// Publish sends an event to all matching subscribers synchronously.
func (b *InMemoryBus) Publish(event DomainEvent) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}

	b.mu.Lock()
	b.history = append(b.history, event)
	if len(b.history) > b.maxHistory {
		b.history = b.history[len(b.history)-b.maxHistory:]
	}
	subs := make([]subscription, len(b.subscribers))
	copy(subs, b.subscribers)
	b.mu.Unlock()

	b.totalPublished.Add(1)

	for _, sub := range subs {
		if sub.types == nil || sub.types[event.Type] {
			func() {
				defer func() {
					if r := recover(); r != nil {
						b.totalPanics.Add(1)
						b.logger.Error("handler panic",
							"event_type", string(event.Type),
							"subscriber_id", sub.id,
							"panic", r,
						)
					}
				}()
				sub.handler(event)
				b.totalDelivered.Add(1)
			}()
		}
	}
}

// PublishAsync sends an event to all matching subscribers asynchronously.
func (b *InMemoryBus) PublishAsync(event DomainEvent) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}

	b.mu.Lock()
	b.history = append(b.history, event)
	if len(b.history) > b.maxHistory {
		b.history = b.history[len(b.history)-b.maxHistory:]
	}
	subs := make([]subscription, len(b.subscribers))
	copy(subs, b.subscribers)
	b.mu.Unlock()

	b.totalPublished.Add(1)

	for _, sub := range subs {
		if sub.types == nil || sub.types[event.Type] {
			go func(s subscription) {
				defer func() {
					if r := recover(); r != nil {
						b.totalPanics.Add(1)
						b.logger.Error("async handler panic",
							"event_type", string(event.Type),
							"subscriber_id", s.id,
							"panic", r,
						)
					}
				}()
				s.handler(event)
				b.totalDelivered.Add(1)
			}(sub)
		}
	}
}

// Subscribe registers an event handler. Returns subscription ID.
func (b *InMemoryBus) Subscribe(handler Handler, types ...EventType) string {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.nextID++
	id := "sub_" + time.Now().Format("20060102150405") + "_" + itoa(b.nextID)

	sub := subscription{id: id, handler: handler}
	if len(types) > 0 {
		sub.types = make(map[EventType]bool)
		for _, t := range types {
			sub.types[t] = true
		}
	}
	b.subscribers = append(b.subscribers, sub)

	b.logger.Info("subscriber registered",
		"subscriber_id", id,
		"event_types", len(types),
	)
	return id
}

// Unsubscribe removes a subscriber by ID.
func (b *InMemoryBus) Unsubscribe(id string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	for i, sub := range b.subscribers {
		if sub.id == id {
			b.subscribers = append(b.subscribers[:i], b.subscribers[i+1:]...)
			b.logger.Info("subscriber removed", "subscriber_id", id)
			return
		}
	}
}

// RecentEvents returns the N most recent events.
func (b *InMemoryBus) RecentEvents(n int) []DomainEvent {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if n > len(b.history) {
		n = len(b.history)
	}
	result := make([]DomainEvent, n)
	copy(result, b.history[len(b.history)-n:])
	return result
}

// EventsByType returns recent events filtered by type.
func (b *InMemoryBus) EventsByType(eventType EventType, limit int) []DomainEvent {
	b.mu.RLock()
	defer b.mu.RUnlock()

	result := make([]DomainEvent, 0, limit)
	for i := len(b.history) - 1; i >= 0 && len(result) < limit; i-- {
		if b.history[i].Type == eventType {
			result = append(result, b.history[i])
		}
	}
	return result
}

// Stats returns bus statistics.
func (b *InMemoryBus) Stats() BusStats {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return BusStats{
		TotalPublished: b.totalPublished.Load(),
		TotalDelivered: b.totalDelivered.Load(),
		TotalPanics:    b.totalPanics.Load(),
		Subscribers:    len(b.subscribers),
		HistoryLen:     len(b.history),
	}
}

// ── Helpers ──────────────────────────────────────────────────

// NewEvent creates a DomainEvent with common fields filled.
func NewEvent(eventType EventType, entityType, entityID, actorID string) DomainEvent {
	return DomainEvent{
		Type:       eventType,
		EntityType: entityType,
		EntityID:   entityID,
		ActorID:    actorID,
		Payload:    map[string]any{},
		Timestamp:  time.Now().UTC(),
	}
}

// itoa is a minimal int-to-string without importing strconv.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 10)
	for n > 0 {
		buf = append(buf, byte('0'+n%10))
		n /= 10
	}
	// reverse
	for i, j := 0, len(buf)-1; i < j; i, j = i+1, j-1 {
		buf[i], buf[j] = buf[j], buf[i]
	}
	return string(buf)
}
