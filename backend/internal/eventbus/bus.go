// Package eventbus provides an in-process domain event bus with
// sync/async dispatch, typed handler registration, and event history.
package eventbus

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Event — Core types
// ═══════════════════════════════════════════════════════════════

// Event is the base interface for all domain events.
type Event interface {
	EventName() string
}

// Envelope wraps an event with metadata.
type Envelope struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Timestamp time.Time `json:"timestamp"`
	Payload   Event     `json:"payload"`
}

// Handler processes a single event type.
type Handler func(ctx context.Context, event Event) error

// ═══════════════════════════════════════════════════════════════
// Bus — Event dispatcher
// ═══════════════════════════════════════════════════════════════

// Bus is an in-process event bus.
type Bus struct {
	handlers map[string][]Handler
	history  []Envelope
	mu       sync.RWMutex
	logger   *slog.Logger
	seq      uint64
}

// New creates a new event bus.
func New(logger *slog.Logger) *Bus {
	return &Bus{
		handlers: make(map[string][]Handler),
		logger:   logger.With(slog.String("component", "eventbus")),
	}
}

// Subscribe registers a handler for a specific event name.
func (b *Bus) Subscribe(eventName string, handler Handler) {
	b.mu.Lock()
	b.handlers[eventName] = append(b.handlers[eventName], handler)
	b.mu.Unlock()
}

// Publish dispatches an event synchronously to all registered handlers.
// All handlers run in sequence; the first error is returned.
func (b *Bus) Publish(ctx context.Context, event Event) error {
	envelope := b.record(event)

	b.mu.RLock()
	handlers := b.handlers[event.EventName()]
	b.mu.RUnlock()

	for _, h := range handlers {
		if err := h(ctx, envelope.Payload); err != nil {
			b.logger.Error("event handler failed",
				"event", event.EventName(),
				"error", err)
			return err
		}
	}
	return nil
}

// PublishAsync dispatches an event asynchronously. Errors are logged, not returned.
func (b *Bus) PublishAsync(ctx context.Context, event Event) {
	envelope := b.record(event)

	b.mu.RLock()
	handlers := make([]Handler, len(b.handlers[event.EventName()]))
	copy(handlers, b.handlers[event.EventName()])
	b.mu.RUnlock()

	for _, h := range handlers {
		go func(handler Handler) {
			if err := handler(ctx, envelope.Payload); err != nil {
				b.logger.Error("async event handler failed",
					"event", event.EventName(),
					"error", err)
			}
		}(h)
	}
}

func (b *Bus) record(event Event) Envelope {
	b.mu.Lock()
	b.seq++
	env := Envelope{
		ID:        formatID(b.seq),
		Name:      event.EventName(),
		Timestamp: time.Now().UTC(),
		Payload:   event,
	}
	b.history = append(b.history, env)
	b.mu.Unlock()
	return env
}

// History returns all recorded events (for debugging/audit).
func (b *Bus) History() []Envelope {
	b.mu.RLock()
	defer b.mu.RUnlock()
	result := make([]Envelope, len(b.history))
	copy(result, b.history)
	return result
}

// HistoryByName returns events filtered by event name.
func (b *Bus) HistoryByName(name string) []Envelope {
	b.mu.RLock()
	defer b.mu.RUnlock()
	var result []Envelope
	for _, e := range b.history {
		if e.Name == name {
			result = append(result, e)
		}
	}
	return result
}

// Reset clears all handlers and history.
func (b *Bus) Reset() {
	b.mu.Lock()
	b.handlers = make(map[string][]Handler)
	b.history = nil
	b.seq = 0
	b.mu.Unlock()
}

// HandlerCount returns the number of handlers for a given event.
func (b *Bus) HandlerCount(eventName string) int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.handlers[eventName])
}

func formatID(seq uint64) string {
	return "evt-" + itoa(seq)
}

func itoa(n uint64) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 20)
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
