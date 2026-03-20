// Package realtime provides a full-featured WebSocket pub/sub service
// with channel rooms, client connection management, and heartbeat.
package realtime

import (
	"encoding/json"
	"time"
)

// Message represents a structured payload sent over WebSocket.
type Message struct {
	// Channel defines the room/topic (e.g., "match:123", "athlete:456")
	Channel string `json:"channel"`
	// Event classifies the action (e.g., "score_updated", "status_changed")
	Event string `json:"event"`
	// Payload is the arbitrary data associated with the event
	Payload json.RawMessage `json:"payload,omitempty"`
}

// EntityEvent is the canonical event payload emitted by backend entity updates.
type EntityEvent struct {
	Type      string         `json:"type"`
	Entity    string         `json:"entity"`
	Action    string         `json:"action"`
	ItemID    string         `json:"itemId,omitempty"`
	Channel   string         `json:"channel,omitempty"`
	Payload   map[string]any `json:"payload,omitempty"`
	Timestamp time.Time      `json:"timestamp"`
}

// ClientMessage is sent from the client to subscribe/unsubscribe.
type ClientMessage struct {
	Action  string `json:"action"`            // "auth", "subscribe", "unsubscribe"
	Channel string `json:"channel,omitempty"` // target channel for subscribe/unsubscribe
	Token   string `json:"token,omitempty"`   // bearer token for first-message auth
}
