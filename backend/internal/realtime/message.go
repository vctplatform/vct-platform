// Package realtime provides a full-featured WebSocket pub/sub service
// with channel rooms, client connection management, and heartbeat.
package realtime

import "encoding/json"

// Message represents a structured payload sent over WebSocket.
type Message struct {
	// Channel defines the room/topic (e.g., "match:123", "athlete:456")
	Channel string `json:"channel"`
	// Event classifies the action (e.g., "score_updated", "status_changed")
	Event string `json:"event"`
	// Payload is the arbitrary data associated with the event
	Payload json.RawMessage `json:"payload,omitempty"`
}

// ClientMessage is sent from the client to subscribe/unsubscribe.
type ClientMessage struct {
	Action  string `json:"action"` // "subscribe", "unsubscribe"
	Channel string `json:"channel"`
}
