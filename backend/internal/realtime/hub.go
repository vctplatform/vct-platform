package realtime

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ── Event Types ───────────────────────────────────────────────

type EntityEvent struct {
	Type      string         `json:"type"`
	Entity    string         `json:"entity"`
	Action    string         `json:"action"`
	ItemID    string         `json:"itemId,omitempty"`
	Channel   string         `json:"channel,omitempty"`
	Payload   map[string]any `json:"payload,omitempty"`
	Timestamp time.Time      `json:"timestamp"`
}

type presenceInfo struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// ── Client ────────────────────────────────────────────────────

type clientConn struct {
	conn          *websocket.Conn
	mu            sync.Mutex
	channels      map[string]bool // channels the client subscribed to
	presence      *presenceInfo   // who this client is (set after auth)
	authenticated bool            // true after successful first-message auth
}

// ── Hub ───────────────────────────────────────────────────────

// AuthValidator is a callback to validate JWT tokens for WebSocket auth.
// Returns nil if the token is valid, error otherwise.
type AuthValidator func(token string) error

type Hub struct {
	mu             sync.RWMutex
	clients        map[*websocket.Conn]*clientConn
	channels       map[string]map[*websocket.Conn]bool // channel → set of conns
	allowedOrigins map[string]struct{}
	upgrader       websocket.Upgrader
	authValidator  AuthValidator // optional: if set, clients must auth before commands
}

func NewHub(allowedOrigins []string) *Hub {
	originSet := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "" {
			continue
		}
		originSet[trimmed] = struct{}{}
	}

	hub := &Hub{
		clients:        make(map[*websocket.Conn]*clientConn),
		channels:       make(map[string]map[*websocket.Conn]bool),
		allowedOrigins: originSet,
	}
	hub.upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return hub.isAllowedOrigin(strings.TrimSpace(r.Header.Get("Origin")))
		},
	}
	return hub
}

// ── WebSocket Handler ─────────────────────────────────────────

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) error {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}

	client := &clientConn{
		conn:     conn,
		channels: make(map[string]bool),
	}
	h.mu.Lock()
	h.clients[conn] = client
	h.mu.Unlock()

	// Welcome message
	_ = h.write(conn, EntityEvent{
		Type:      "system.hello",
		Action:    "connected",
		Timestamp: time.Now().UTC(),
		Payload: map[string]any{
			"message": "Connected to VCT realtime channel",
		},
	})

	// Ping/pong keepalive
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	})

	// Read loop — handles subscribe/unsubscribe commands
	go func() {
		defer h.removeClient(conn)
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		for {
			_, msg, readErr := conn.ReadMessage()
			if readErr != nil {
				return
			}
			h.handleClientMessage(conn, msg)
		}
	}()

	// Ping ticker
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			h.mu.RLock()
			_, ok := h.clients[conn]
			h.mu.RUnlock()
			if !ok {
				return
			}
			client.mu.Lock()
			_ = client.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			err := client.conn.WriteMessage(websocket.PingMessage, nil)
			client.mu.Unlock()
			if err != nil {
				return
			}
		}
	}()

	return nil
}

// ── Client Commands ───────────────────────────────────────────

type clientCommand struct {
	Action  string `json:"action"`          // auth | subscribe | unsubscribe | presence
	Channel string `json:"channel"`         // e.g. "scoring:match-123"
	Token   string `json:"token,omitempty"` // JWT for auth action
	UserID  string `json:"userId,omitempty"`
	Name    string `json:"name,omitempty"`
	Role    string `json:"role,omitempty"`
}

func (h *Hub) handleClientMessage(conn *websocket.Conn, raw []byte) {
	var cmd clientCommand
	if err := json.Unmarshal(raw, &cmd); err != nil {
		return
	}

	// Handle auth command first — always allowed
	if cmd.Action == "auth" {
		h.handleAuth(conn, cmd.Token)
		return
	}

	// Gate other commands behind authentication if authValidator is set
	if h.authValidator != nil {
		h.mu.RLock()
		client, exists := h.clients[conn]
		h.mu.RUnlock()
		if !exists || !client.authenticated {
			_ = h.write(conn, EntityEvent{
				Type:      "system.error",
				Action:    "auth_required",
				Timestamp: time.Now().UTC(),
				Payload:   map[string]any{"message": "Authentication required. Send {\"action\":\"auth\",\"token\":\"xxx\"} first."},
			})
			return
		}
	}

	switch cmd.Action {
	case "subscribe":
		h.subscribe(conn, cmd.Channel)
	case "unsubscribe":
		h.unsubscribe(conn, cmd.Channel)
	case "presence":
		h.setPresence(conn, cmd.UserID, cmd.Name, cmd.Role)
	}
}

func (h *Hub) handleAuth(conn *websocket.Conn, token string) {
	h.mu.RLock()
	client, exists := h.clients[conn]
	h.mu.RUnlock()
	if !exists {
		return
	}

	// If no validator configured, auto-accept
	if h.authValidator == nil {
		client.authenticated = true
		_ = h.write(conn, EntityEvent{
			Type:      "system.auth",
			Action:    "authenticated",
			Timestamp: time.Now().UTC(),
		})
		return
	}

	if err := h.authValidator(token); err != nil {
		_ = h.write(conn, EntityEvent{
			Type:      "system.error",
			Action:    "auth_failed",
			Timestamp: time.Now().UTC(),
			Payload:   map[string]any{"message": "Invalid token"},
		})
		return
	}

	client.authenticated = true
	_ = h.write(conn, EntityEvent{
		Type:      "system.auth",
		Action:    "authenticated",
		Timestamp: time.Now().UTC(),
	})
}

// SetAuthValidator sets the callback to validate JWT tokens for WS first-message auth.
func (h *Hub) SetAuthValidator(validator AuthValidator) {
	h.authValidator = validator
}

func (h *Hub) subscribe(conn *websocket.Conn, channel string) {
	if channel == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	client, ok := h.clients[conn]
	if !ok {
		return
	}
	client.channels[channel] = true

	if h.channels[channel] == nil {
		h.channels[channel] = make(map[*websocket.Conn]bool)
	}
	h.channels[channel][conn] = true
}

func (h *Hub) unsubscribe(conn *websocket.Conn, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client, ok := h.clients[conn]
	if !ok {
		return
	}
	delete(client.channels, channel)

	if subs := h.channels[channel]; subs != nil {
		delete(subs, conn)
		if len(subs) == 0 {
			delete(h.channels, channel)
		}
	}
}

func (h *Hub) setPresence(conn *websocket.Conn, userID, name, role string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client, ok := h.clients[conn]
	if !ok {
		return
	}
	client.presence = &presenceInfo{UserID: userID, Username: name, Role: role}
}

// ── Broadcast ─────────────────────────────────────────────────

// Broadcast sends event to ALL connected clients.
func (h *Hub) Broadcast(event EntityEvent) {
	h.prepareEvent(&event)
	body, err := json.Marshal(event)
	if err != nil {
		return
	}

	h.mu.RLock()
	conns := make([]*websocket.Conn, 0, len(h.clients))
	for conn := range h.clients {
		conns = append(conns, conn)
	}
	h.mu.RUnlock()

	for _, conn := range conns {
		if writeErr := h.writeRaw(conn, body); writeErr != nil {
			h.removeClient(conn)
		}
	}
}

// BroadcastToChannel sends event to clients subscribed to a specific channel.
func (h *Hub) BroadcastToChannel(channel string, event EntityEvent) {
	h.prepareEvent(&event)
	event.Channel = channel
	body, err := json.Marshal(event)
	if err != nil {
		return
	}

	h.mu.RLock()
	subs := h.channels[channel]
	conns := make([]*websocket.Conn, 0, len(subs))
	for conn := range subs {
		conns = append(conns, conn)
	}
	h.mu.RUnlock()

	for _, conn := range conns {
		if writeErr := h.writeRaw(conn, body); writeErr != nil {
			h.removeClient(conn)
		}
	}
}

// GetChannelPresence returns who is present in a channel.
func (h *Hub) GetChannelPresence(channel string) []presenceInfo {
	h.mu.RLock()
	defer h.mu.RUnlock()

	subs := h.channels[channel]
	result := make([]presenceInfo, 0, len(subs))
	for conn := range subs {
		client, ok := h.clients[conn]
		if ok && client.presence != nil {
			result = append(result, *client.presence)
		}
	}
	return result
}

func (h *Hub) CountClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// Close gracefully closes all WebSocket connections and clears internal state.
func (h *Hub) Close() {
	h.mu.Lock()
	conns := make([]*websocket.Conn, 0, len(h.clients))
	for conn := range h.clients {
		conns = append(conns, conn)
	}
	h.clients = make(map[*websocket.Conn]*clientConn)
	h.channels = make(map[string]map[*websocket.Conn]bool)
	h.mu.Unlock()

	for _, conn := range conns {
		_ = conn.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseGoingAway, "server shutting down"),
			time.Now().Add(2*time.Second),
		)
		_ = conn.Close()
	}
}

func (h *Hub) removeClient(conn *websocket.Conn) {
	h.mu.Lock()
	client, ok := h.clients[conn]
	if ok {
		// Clean up channel subscriptions
		for ch := range client.channels {
			if subs := h.channels[ch]; subs != nil {
				delete(subs, conn)
				if len(subs) == 0 {
					delete(h.channels, ch)
				}
			}
		}
		delete(h.clients, conn)
	}
	h.mu.Unlock()

	if ok {
		client.mu.Lock()
		_ = client.conn.Close()
		client.mu.Unlock()
	}
}

func (h *Hub) prepareEvent(event *EntityEvent) {
	if event.Type == "" {
		event.Type = "entity.changed"
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}
}

func (h *Hub) write(conn *websocket.Conn, event EntityEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return h.writeRaw(conn, payload)
}

func (h *Hub) writeRaw(conn *websocket.Conn, payload []byte) error {
	h.mu.RLock()
	client, ok := h.clients[conn]
	h.mu.RUnlock()
	if !ok {
		return websocket.ErrCloseSent
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	_ = client.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
	return client.conn.WriteMessage(websocket.TextMessage, payload)
}

func (h *Hub) isAllowedOrigin(origin string) bool {
	if origin == "" {
		return true
	}
	if _, allowAll := h.allowedOrigins["*"]; allowAll {
		return true
	}
	_, ok := h.allowedOrigins[origin]
	return ok
}
