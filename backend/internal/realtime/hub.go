package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// In production, you should check origin
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	logger *slog.Logger

	// Registered clients.
	clients map[*Client]bool

	// Channels mapping client to joined rooms (Channel -> Client -> true)
	channels map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	mu sync.RWMutex
}

// NewHub creates a new WebSocket hub.
func NewHub(logger *slog.Logger) *Hub {
	return &Hub{
		broadcast:  make(chan Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		channels:   make(map[string]map[*Client]bool),
		logger:     logger.With(slog.String("component", "websocket_hub")),
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
			clientsInChannel, ok := h.channels[message.Channel]
			if !ok {
				h.mu.RUnlock()
				continue
			}

			payload, err := json.Marshal(message)
			if err != nil {
				h.logger.Error("failed to marshal broadcast message", "error", err)
				h.mu.RUnlock()
				continue
			}

			for client := range clientsInChannel {
				select {
				case client.send <- payload:
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
	select {
	case h.broadcast <- message:
	default:
		h.logger.Warn("hub broadcast channel full, message dropped")
	}
}

// ServeWS handles WebSocket requests from peers.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Error("websocket upgrade failed", "error", err)
		return
	}

	client := &Client{
		hub:      h,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		channels: make(map[string]bool),
		logger:   h.logger,
	}

	h.register <- client

	go client.writePump()
	go client.readPump()
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
