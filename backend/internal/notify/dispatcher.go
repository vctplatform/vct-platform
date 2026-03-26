// Package notify provides a multi-channel notification dispatcher with
// pluggable channels (email, SMS, push, in-app), user preferences,
// priority routing, and delivery tracking.
package notify

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Channel Types
// ═══════════════════════════════════════════════════════════════

// ChannelType identifies a notification delivery channel.
type ChannelType string

const (
	ChannelEmail ChannelType = "email"
	ChannelSMS   ChannelType = "sms"
	ChannelPush  ChannelType = "push"
	ChannelInApp ChannelType = "in_app"
)

// Priority defines notification urgency.
type Priority int

const (
	PriorityLow      Priority = 0
	PriorityNormal   Priority = 1
	PriorityHigh     Priority = 2
	PriorityCritical Priority = 3
)

// ═══════════════════════════════════════════════════════════════
// Message
// ═══════════════════════════════════════════════════════════════

// Message is a notification to be dispatched.
type Message struct {
	ID        string            `json:"id"`
	Type      string            `json:"type"`      // e.g., "match.started", "registration.approved"
	Recipient string            `json:"recipient"` // User ID
	Title     string            `json:"title"`
	Body      string            `json:"body"`
	Data      map[string]string `json:"data,omitempty"`
	Priority  Priority          `json:"priority"`
	Channels  []ChannelType     `json:"channels"` // Desired channels
	CreatedAt time.Time         `json:"created_at"`
}

// DeliveryResult tracks delivery per channel.
type DeliveryResult struct {
	Channel   ChannelType `json:"channel"`
	Delivered bool        `json:"delivered"`
	Error     string      `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// ═══════════════════════════════════════════════════════════════
// Channel Interface
// ═══════════════════════════════════════════════════════════════

// Channel delivers notifications through a specific medium.
type Channel interface {
	Type() ChannelType
	Send(ctx context.Context, msg *Message) error
}

// ═══════════════════════════════════════════════════════════════
// User Preferences
// ═══════════════════════════════════════════════════════════════

// UserPreferences controls which channels a user wants.
type UserPreferences struct {
	UserID          string               `json:"user_id"`
	EnabledChannels map[ChannelType]bool `json:"enabled_channels"`
	Quiet           bool                 `json:"quiet"` // Mute all except critical
}

// PreferenceStore resolves user notification preferences.
type PreferenceStore interface {
	Get(ctx context.Context, userID string) (*UserPreferences, error)
}

// ═══════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════

// Dispatcher routes notifications to channels based on user preferences.
type Dispatcher struct {
	channels map[ChannelType]Channel
	prefs    PreferenceStore
	history  []DeliveryResult
	mu       sync.Mutex
	seq      atomic.Uint64

	// Stats
	sent     atomic.Int64
	failed   atomic.Int64
	filtered atomic.Int64
}

// NewDispatcher creates a notification dispatcher.
func NewDispatcher(prefs PreferenceStore) *Dispatcher {
	return &Dispatcher{
		channels: make(map[ChannelType]Channel),
		prefs:    prefs,
	}
}

// RegisterChannel adds a delivery channel.
func (d *Dispatcher) RegisterChannel(ch Channel) {
	d.mu.Lock()
	d.channels[ch.Type()] = ch
	d.mu.Unlock()
}

// Dispatch sends a notification through eligible channels.
func (d *Dispatcher) Dispatch(ctx context.Context, msg *Message) []DeliveryResult {
	if msg.ID == "" {
		msg.ID = fmt.Sprintf("notif-%d", d.seq.Add(1))
	}
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = time.Now().UTC()
	}

	// Resolve user preferences
	channels := d.resolveChannels(ctx, msg)

	var results []DeliveryResult
	for _, chType := range channels {
		d.mu.Lock()
		ch, ok := d.channels[chType]
		d.mu.Unlock()

		if !ok {
			continue
		}

		result := DeliveryResult{
			Channel:   chType,
			Timestamp: time.Now().UTC(),
		}

		if err := ch.Send(ctx, msg); err != nil {
			result.Error = err.Error()
			d.failed.Add(1)
		} else {
			result.Delivered = true
			d.sent.Add(1)
		}

		results = append(results, result)
	}

	d.mu.Lock()
	d.history = append(d.history, results...)
	d.mu.Unlock()

	return results
}

func (d *Dispatcher) resolveChannels(ctx context.Context, msg *Message) []ChannelType {
	if d.prefs == nil {
		return msg.Channels
	}

	prefs, err := d.prefs.Get(ctx, msg.Recipient)
	if err != nil || prefs == nil {
		return msg.Channels
	}

	// Quiet mode: only critical gets through
	if prefs.Quiet && msg.Priority < PriorityCritical {
		d.filtered.Add(1)
		return nil
	}

	// Filter by user preferences
	var allowed []ChannelType
	for _, ch := range msg.Channels {
		if enabled, ok := prefs.EnabledChannels[ch]; ok && enabled {
			allowed = append(allowed, ch)
		}
	}

	if len(allowed) == 0 {
		d.filtered.Add(1)
	}
	return allowed
}

// Stats returns dispatcher statistics.
type Stats struct {
	Sent     int64 `json:"sent"`
	Failed   int64 `json:"failed"`
	Filtered int64 `json:"filtered"`
	Channels int   `json:"channels"`
}

func (d *Dispatcher) Stats() Stats {
	d.mu.Lock()
	chCount := len(d.channels)
	d.mu.Unlock()

	return Stats{
		Sent:     d.sent.Load(),
		Failed:   d.failed.Load(),
		Filtered: d.filtered.Load(),
		Channels: chCount,
	}
}

// History returns delivery history.
func (d *Dispatcher) History() []DeliveryResult {
	d.mu.Lock()
	defer d.mu.Unlock()
	h := make([]DeliveryResult, len(d.history))
	copy(h, d.history)
	return h
}
