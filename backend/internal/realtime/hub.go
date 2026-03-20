package realtime

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

type outboundMessage struct {
	channel string
	payload []byte
}

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	logger *slog.Logger

	// Registered clients.
	clients map[*Client]bool

	// Channels mapping client to joined rooms (Channel -> Client -> true)
	channels map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan outboundMessage

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	allowedOrigins map[string]struct{}
	authValidator  func(string) error
	closeCh        chan struct{}
	closeOnce      sync.Once
	mu             sync.RWMutex
}

// NewHub creates a new WebSocket hub.
func NewHub(logger *slog.Logger, allowedOrigins ...string) *Hub {
	if logger == nil {
		logger = slog.Default()
	}

	originSet := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			originSet[trimmed] = struct{}{}
		}
	}

	return &Hub{
		broadcast:      make(chan outboundMessage, 256),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		clients:        make(map[*Client]bool),
		channels:       make(map[string]map[*Client]bool),
		logger:         logger.With(slog.String("component", "websocket_hub")),
		allowedOrigins: originSet,
		closeCh:        make(chan struct{}),
	}
}

// Run starts the hub's main event loop.
func (h *Hub) Run(ctx context.Context) {
	h.logger.Info("websocket hub started")
	for {
		select {
		case <-ctx.Done():
			h.logger.Info("websocket hub stopping")
			return
		case <-h.closeCh:
			h.logger.Info("websocket hub closed")
			return
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			h.logger.Debug("client connected", "user_id", client.userID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// Remove client from all channels
				client.mu.RLock()
				for channel := range client.channels {
					delete(h.channels[channel], client)
					if len(h.channels[channel]) == 0 {
						delete(h.channels, channel)
					}
				}
				client.mu.RUnlock()
			}
			h.mu.Unlock()
			h.logger.Debug("client disconnected", "user_id", client.userID)

		case message := <-h.broadcast:
			h.mu.RLock()
			clientsInChannel, ok := h.channels[message.channel]
			if !ok {
				h.mu.RUnlock()
				continue
			}

			for client := range clientsInChannel {
				select {
				case client.send <- append([]byte(nil), message.payload...):
				default:
					// Send buffer is full, drop the client
					h.logger.Warn("client send buffer full, dropping connection")
					go func(c *Client) { h.unregister <- c }(client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Subscribe adds a client to a channel.
func (h *Hub) Subscribe(client *Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channels[channel] == nil {
		h.channels[channel] = make(map[*Client]bool)
	}
	h.channels[channel][client] = true

	client.mu.Lock()
	client.channels[channel] = true
	client.mu.Unlock()

	h.logger.Debug("client subscribed", "channel", channel, "user_id", client.userID)
}

// Unsubscribe removes a client from a channel.
func (h *Hub) Unsubscribe(client *Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.channels[channel]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.channels, channel)
		}
	}

	client.mu.Lock()
	delete(client.channels, channel)
	client.mu.Unlock()

	h.logger.Debug("client unsubscribed", "channel", channel, "user_id", client.userID)
}

// Broadcast sends a message to all clients subscribed to the specified channel.
func (h *Hub) Broadcast(message Message) {
	payload, err := json.Marshal(message)
	if err != nil {
		h.logger.Error("failed to marshal broadcast message", "error", err)
		return
	}
	h.enqueueBroadcast(strings.TrimSpace(message.Channel), payload)
}

// BroadcastToChannel sends any JSON payload to a specific channel.
func (h *Hub) BroadcastToChannel(channel string, payload any) {
	trimmedChannel := strings.TrimSpace(channel)
	if trimmedChannel == "" {
		return
	}

	switch event := payload.(type) {
	case EntityEvent:
		event.Channel = trimmedChannel
		payload = event
	case *EntityEvent:
		if event != nil {
			cloned := *event
			cloned.Channel = trimmedChannel
			payload = cloned
		}
	}

	bytes, err := json.Marshal(payload)
	if err != nil {
		h.logger.Error("failed to marshal channel payload", "channel", trimmedChannel, "error", err)
		return
	}
	h.enqueueBroadcast(trimmedChannel, bytes)
}

func (h *Hub) enqueueBroadcast(channel string, payload []byte) {
	if channel == "" {
		return
	}
	select {
	case h.broadcast <- outboundMessage{channel: channel, payload: payload}:
	default:
		h.logger.Warn("hub broadcast channel full, message dropped")
	}
}

// ServeWS handles WebSocket requests from peers.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID ...string) error {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     h.checkOrigin,
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Error("websocket upgrade failed", "error", err)
		return fmt.Errorf("upgrade websocket: %w", err)
	}

	resolvedUserID := ""
	if len(userID) > 0 {
		resolvedUserID = strings.TrimSpace(userID[0])
	}

	client := &Client{
		hub:           h,
		conn:          conn,
		send:          make(chan []byte, 256),
		userID:        resolvedUserID,
		channels:      make(map[string]bool),
		authenticated: resolvedUserID != "" || !h.requiresAuth(),
		authRequired:  h.requiresAuth() && resolvedUserID == "",
		logger:        h.logger,
	}

	select {
	case <-h.closeCh:
		_ = conn.Close()
		return fmt.Errorf("websocket hub closed")
	case h.register <- client:
	}

	go client.writePump()
	go client.readPump()
	return nil
}

func (h *Hub) ActiveConnections() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

func (h *Hub) ActiveConnectionsInChannel(channel string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.channels[channel])
}

func (h *Hub) CountClients() int {
	return h.ActiveConnections()
}

func (h *Hub) SetAuthValidator(validator func(string) error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.authValidator = validator
}

func (h *Hub) validateToken(token string) error {
	h.mu.RLock()
	validator := h.authValidator
	h.mu.RUnlock()

	if validator == nil {
		return nil
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return fmt.Errorf("missing auth token")
	}
	return validator(token)
}

func (h *Hub) requiresAuth() bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.authValidator != nil
}

func (h *Hub) Close() {
	h.closeOnce.Do(func() {
		close(h.closeCh)

		h.mu.Lock()
		clients := make([]*Client, 0, len(h.clients))
		for client := range h.clients {
			clients = append(clients, client)
		}
		h.clients = make(map[*Client]bool)
		h.channels = make(map[string]map[*Client]bool)
		h.mu.Unlock()

		for _, client := range clients {
			_ = client.conn.Close()
		}
	})
}

func (h *Hub) checkOrigin(r *http.Request) bool {
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return true
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if len(h.allowedOrigins) == 0 {
		return true
	}
	if _, ok := h.allowedOrigins[origin]; ok {
		return true
	}
	for pattern := range h.allowedOrigins {
		if pattern == "*" {
			return true
		}
		if strings.HasPrefix(pattern, "*.") {
			suffix := pattern[1:]
			if strings.HasSuffix(origin, suffix) {
				return true
			}
		}
	}
	return false
}
