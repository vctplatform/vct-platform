package realtime

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func newTestHub() *Hub {
	return NewHub([]string{"*"})
}

func connectWS(t *testing.T, hub *Hub) (*websocket.Conn, func()) {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := hub.ServeWS(w, r); err != nil {
			t.Logf("ServeWS error: %v", err)
		}
	}))

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect websocket: %v", err)
	}

	// Read welcome message
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, _, _ = conn.ReadMessage()

	return conn, func() {
		conn.Close()
		server.Close()
	}
}

func TestHub_ClientConnect(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()
	_ = conn

	time.Sleep(50 * time.Millisecond) // let goroutines settle
	if hub.CountClients() != 1 {
		t.Errorf("expected 1 client, got %d", hub.CountClients())
	}
}

func TestHub_ClientDisconnect(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()

	conn.Close()
	time.Sleep(100 * time.Millisecond) // let cleanup propagate

	if hub.CountClients() != 0 {
		t.Errorf("expected 0 clients after disconnect, got %d", hub.CountClients())
	}
}

func TestHub_Subscribe(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()

	// Send subscribe command
	cmd := clientCommand{Action: "subscribe", Channel: "scoring:match-1"}
	data, _ := json.Marshal(cmd)
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		t.Fatalf("failed to send subscribe: %v", err)
	}

	time.Sleep(50 * time.Millisecond)

	// Verify subscription
	hub.mu.RLock()
	subs, ok := hub.channels["scoring:match-1"]
	hub.mu.RUnlock()

	if !ok || len(subs) != 1 {
		t.Errorf("expected 1 subscriber to scoring:match-1")
	}
}

func TestHub_BroadcastToChannel(t *testing.T) {
	hub := newTestHub()

	// Connect two clients
	conn1, cleanup1 := connectWS(t, hub)
	defer cleanup1()
	conn2, cleanup2 := connectWS(t, hub)
	defer cleanup2()

	// Subscribe conn1 to "match-1" channel
	cmd := clientCommand{Action: "subscribe", Channel: "match-1"}
	data, _ := json.Marshal(cmd)
	conn1.WriteMessage(websocket.TextMessage, data)

	time.Sleep(50 * time.Millisecond)

	// Broadcast to "match-1" channel
	hub.BroadcastToChannel("match-1", EntityEvent{
		Entity: "scoring",
		Action: "score_update",
		ItemID: "score-1",
	})

	// conn1 should receive the event
	conn1.SetReadDeadline(time.Now().Add(1 * time.Second))
	_, msg, err := conn1.ReadMessage()
	if err != nil {
		t.Fatalf("conn1 should have received broadcast: %v", err)
	}

	var event EntityEvent
	if err := json.Unmarshal(msg, &event); err != nil {
		t.Fatalf("failed to parse event: %v", err)
	}
	if event.Entity != "scoring" {
		t.Errorf("expected entity 'scoring', got '%s'", event.Entity)
	}

	// conn2 should NOT receive (not subscribed to match-1)
	conn2.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	_, _, err = conn2.ReadMessage()
	if err == nil {
		t.Error("conn2 should not have received channel-specific broadcast")
	}
}

func TestHub_GlobalBroadcast(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()

	time.Sleep(50 * time.Millisecond)

	hub.Broadcast(EntityEvent{
		Entity: "system",
		Action: "announcement",
	})

	conn.SetReadDeadline(time.Now().Add(1 * time.Second))
	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("expected to receive global broadcast: %v", err)
	}

	var event EntityEvent
	json.Unmarshal(msg, &event)
	if event.Entity != "system" {
		t.Errorf("expected entity 'system', got '%s'", event.Entity)
	}
}

func TestHub_Presence(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()

	// Subscribe to channel
	sub := clientCommand{Action: "subscribe", Channel: "arena-1"}
	data, _ := json.Marshal(sub)
	conn.WriteMessage(websocket.TextMessage, data)

	// Set presence
	presence := clientCommand{
		Action: "presence",
		UserID: "user-1",
		Name:   "Admin",
		Role:   "admin",
	}
	data, _ = json.Marshal(presence)
	conn.WriteMessage(websocket.TextMessage, data)

	time.Sleep(50 * time.Millisecond)

	// Get channel presence
	presenceList := hub.GetChannelPresence("arena-1")
	if len(presenceList) != 1 {
		t.Fatalf("expected 1 presence entry, got %d", len(presenceList))
	}
	if presenceList[0].UserID != "user-1" {
		t.Errorf("expected user-1, got %s", presenceList[0].UserID)
	}
	if presenceList[0].Username != "Admin" {
		t.Errorf("expected Admin, got %s", presenceList[0].Username)
	}
}

func TestHub_Unsubscribe(t *testing.T) {
	hub := newTestHub()
	conn, cleanup := connectWS(t, hub)
	defer cleanup()

	// Subscribe
	sub := clientCommand{Action: "subscribe", Channel: "test-ch"}
	data, _ := json.Marshal(sub)
	conn.WriteMessage(websocket.TextMessage, data)
	time.Sleep(30 * time.Millisecond)

	// Unsubscribe
	unsub := clientCommand{Action: "unsubscribe", Channel: "test-ch"}
	data, _ = json.Marshal(unsub)
	conn.WriteMessage(websocket.TextMessage, data)
	time.Sleep(30 * time.Millisecond)

	// Verify no subscribers
	hub.mu.RLock()
	_, ok := hub.channels["test-ch"]
	hub.mu.RUnlock()

	if ok {
		t.Error("expected channel to be removed after unsubscribe")
	}
}

func TestHub_OriginCheck(t *testing.T) {
	hub := NewHub([]string{"https://example.com"})

	if !hub.isAllowedOrigin("https://example.com") {
		t.Error("expected allowed origin to pass")
	}
	if hub.isAllowedOrigin("https://evil.com") {
		t.Error("expected unknown origin to be rejected")
	}
	if !hub.isAllowedOrigin("") {
		t.Error("expected empty origin to be allowed (same-origin)")
	}
}

func TestHub_WildcardOrigin(t *testing.T) {
	hub := NewHub([]string{"*"})

	if !hub.isAllowedOrigin("https://anything.com") {
		t.Error("expected wildcard to allow any origin")
	}
}
