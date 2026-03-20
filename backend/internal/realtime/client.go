package realtime

import (
	"encoding/json"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
)

// Client represents an active WebSocket connection.
type Client struct {
	hub           *Hub
	conn          *websocket.Conn
	send          chan []byte
	userID        string
	channels      map[string]bool
	authenticated bool
	authRequired  bool
	mu            sync.RWMutex
	logger        *slog.Logger
}

// UserID returns the authenticated user ID of this client (if any).
func (c *Client) UserID() string {
	return c.userID
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.logger.Error("websocket read error", "error", err)
			}
			break
		}

		// Handle client actions like subscribe/unsubscribe
		var msg ClientMessage
		if err := json.Unmarshal(message, &msg); err == nil {
			switch msg.Action {
			case "auth":
				if !c.authRequired {
					c.authenticated = true
					continue
				}
				if err := c.hub.validateToken(msg.Token); err != nil {
					c.logger.Warn("websocket auth failed", "error", err)
					return
				}
				c.authenticated = true
				if c.userID == "" {
					c.userID = "authenticated"
				}
			case "subscribe":
				if c.authRequired && !c.authenticated {
					continue
				}
				if channel := strings.TrimSpace(msg.Channel); channel != "" {
					c.hub.Subscribe(c, channel)
				}
			case "unsubscribe":
				if c.authRequired && !c.authenticated {
					continue
				}
				if channel := strings.TrimSpace(msg.Channel); channel != "" {
					c.hub.Unsubscribe(c, channel)
				}
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			for i := 0; i < len(c.send); i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
