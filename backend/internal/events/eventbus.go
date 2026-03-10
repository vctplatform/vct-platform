package events

import (
	"log"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — EVENT BUS
// Lightweight pub/sub for domain events. Enables real-time
// notifications, WebSocket broadcasting, and audit logging.
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
	// Publish emits an event to all subscribers.
	Publish(event DomainEvent)
	// Subscribe registers a handler for specific event types.
	// Pass empty types slice to subscribe to ALL events.
	Subscribe(handler Handler, types ...EventType)
}

// ── In-Memory Implementation ─────────────────────────────────

type subscription struct {
	handler Handler
	types   map[EventType]bool // nil = all events
}

// InMemoryBus is a synchronous in-memory event bus.
type InMemoryBus struct {
	mu          sync.RWMutex
	subscribers []subscription
	history     []DomainEvent
	maxHistory  int
}

// NewBus creates a new in-memory event bus.
func NewBus() *InMemoryBus {
	return &InMemoryBus{
		maxHistory: 1000,
	}
}

// Publish sends an event to all matching subscribers.
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

	for _, sub := range subs {
		if sub.types == nil || sub.types[event.Type] {
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("[EventBus] handler panic for %s: %v", event.Type, r)
					}
				}()
				sub.handler(event)
			}()
		}
	}
}

// Subscribe registers an event handler.
func (b *InMemoryBus) Subscribe(handler Handler, types ...EventType) {
	b.mu.Lock()
	defer b.mu.Unlock()

	sub := subscription{handler: handler}
	if len(types) > 0 {
		sub.types = make(map[EventType]bool)
		for _, t := range types {
			sub.types[t] = true
		}
	}
	b.subscribers = append(b.subscribers, sub)
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

// ── Helper to create events quickly ──────────────────────────

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
