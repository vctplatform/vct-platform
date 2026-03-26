package realtime

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func TestHub_ClientRegistration(t *testing.T) {
	hub := NewHub(testLogger())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r, "user123")
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer conn.Close()

	// Wait for registration
	time.Sleep(100 * time.Millisecond)

	if hub.ActiveConnections() != 1 {
		t.Errorf("expected 1 connection, got %d", hub.ActiveConnections())
	}

	conn.Close()
	// Wait for unregistration
	time.Sleep(100 * time.Millisecond)

	if hub.ActiveConnections() != 0 {
		t.Errorf("expected 0 connections, got %d", hub.ActiveConnections())
	}
}

func TestHub_PubSub(t *testing.T) {
	hub := NewHub(testLogger())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r, "user123")
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	// Client 1
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer conn1.Close()

	// Client 2
	conn2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer conn2.Close()

	time.Sleep(50 * time.Millisecond) // Let connections settle

	// Subscribe Client 1 to "match:1"
	subMsg := ClientMessage{Action: "subscribe", Channel: "match:1"}
	if err := conn1.WriteJSON(subMsg); err != nil {
		t.Fatal(err)
	}

	// Wait for subscription to process
	time.Sleep(100 * time.Millisecond)

	if hub.ActiveConnectionsInChannel("match:1") != 1 {
		t.Errorf("expected 1 client in channel, got %d", hub.ActiveConnectionsInChannel("match:1"))
	}

	// Broadcast to "match:1"
	hub.Broadcast(Message{
		Channel: "match:1",
		Event:   "score_updated",
		Payload: json.RawMessage(`{"score":10}`),
	})

	// Client 1 should receive it
	conn1.SetReadDeadline(time.Now().Add(1 * time.Second))
	var received Message
	if err := conn1.ReadJSON(&received); err != nil {
		t.Fatalf("client 1 failed to read message: %v", err)
	}

	if received.Event != "score_updated" {
		t.Errorf("expected score_updated, got %s", received.Event)
	}

	// Client 2 should NOT receive it
	conn2.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
	_, _, err = conn2.ReadMessage()
	if err == nil {
		t.Fatal("client 2 should not have received a message")
	}

	// Unsubscribe Client 1
	unsubMsg := ClientMessage{Action: "unsubscribe", Channel: "match:1"}
	if err := conn1.WriteJSON(unsubMsg); err != nil {
		t.Fatal(err)
	}

	time.Sleep(100 * time.Millisecond)

	if hub.ActiveConnectionsInChannel("match:1") != 0 {
		t.Errorf("expected 0 clients in channel, got %d", hub.ActiveConnectionsInChannel("match:1"))
	}
}

func TestHub_BroadcastFullBuffer(t *testing.T) {
	hub := NewHub(testLogger())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	// Create a dummy client manually to test buffer overflow
	client := &Client{
		hub:      hub,
		send:     make(chan []byte, 1), // tiny buffer
		userID:   "user1",
		channels: make(map[string]bool),
		logger:   testLogger(),
	}

	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	hub.Subscribe(client, "test")

	// Fill the buffer
	client.send <- []byte("full")

	// This should not block, but will drop the client because the buffer is full
	hub.Broadcast(Message{Channel: "test", Event: "ping"})
	time.Sleep(50 * time.Millisecond)

	if hub.ActiveConnections() != 0 {
		t.Errorf("Expected client to be disconnected after buffer full")
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — Channel Authorization
// ═══════════════════════════════════════════════════════════════

type mockAuthorizer struct {
	denied map[string]bool // channel -> denied
}

func (m *mockAuthorizer) Authorize(_ context.Context, userID, channel string) error {
	if m.denied[channel] {
		return fmt.Errorf("subscription to %s denied for %s", channel, userID)
	}
	return nil
}

func TestChannelAuthorization_Allowed(t *testing.T) {
	hub := NewHub(testLogger())
	hub.SetChannelAuthorizer(&mockAuthorizer{denied: map[string]bool{"admin": true}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	client := &Client{
		hub:      hub,
		send:     make(chan []byte, 10),
		userID:   "user1",
		channels: make(map[string]bool),
		logger:   testLogger(),
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	// Subscribe to allowed channel
	err := hub.Subscribe(client, "public")
	if err != nil {
		t.Errorf("expected nil error for allowed channel, got %v", err)
	}
	if hub.ActiveConnectionsInChannel("public") != 1 {
		t.Errorf("expected 1 client in public, got %d", hub.ActiveConnectionsInChannel("public"))
	}
}

func TestChannelAuthorization_Denied(t *testing.T) {
	hub := NewHub(testLogger())
	hub.SetChannelAuthorizer(&mockAuthorizer{denied: map[string]bool{"admin": true}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	client := &Client{
		hub:      hub,
		send:     make(chan []byte, 10),
		userID:   "viewer1",
		channels: make(map[string]bool),
		logger:   testLogger(),
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	// Subscribe to denied channel
	err := hub.Subscribe(client, "admin")
	if err == nil {
		t.Error("expected error for denied channel")
	}
	if hub.ActiveConnectionsInChannel("admin") != 0 {
		t.Errorf("expected 0 clients in admin, got %d", hub.ActiveConnectionsInChannel("admin"))
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — SendToUser
// ═══════════════════════════════════════════════════════════════

func TestSendToUser(t *testing.T) {
	hub := NewHub(testLogger())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("uid")
		hub.ServeWS(w, r, userID)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	// Connect user-A
	connA, _, err := websocket.DefaultDialer.Dial(wsURL+"?uid=user-A", nil)
	if err != nil {
		t.Fatalf("failed to connect user-A: %v", err)
	}
	defer connA.Close()

	// Connect user-B
	connB, _, err := websocket.DefaultDialer.Dial(wsURL+"?uid=user-B", nil)
	if err != nil {
		t.Fatalf("failed to connect user-B: %v", err)
	}
	defer connB.Close()

	time.Sleep(100 * time.Millisecond)

	// Send targeted message to user-A
	hub.SendToUser("user-A", Message{
		Channel: "direct",
		Event:   "notification",
		Payload: json.RawMessage(`{"text":"hello A"}`),
	})

	// user-A should receive it
	connA.SetReadDeadline(time.Now().Add(1 * time.Second))
	var received Message
	if err := connA.ReadJSON(&received); err != nil {
		t.Fatalf("user-A failed to read: %v", err)
	}
	if received.Event != "notification" {
		t.Errorf("expected notification, got %s", received.Event)
	}

	// user-B should NOT receive it
	connB.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
	_, _, err = connB.ReadMessage()
	if err == nil {
		t.Error("user-B should not have received user-A's message")
	}
}

// ═══════════════════════════════════════════════════════════════
// NEW TESTS — HubMetrics
// ═══════════════════════════════════════════════════════════════

func TestHubMetrics(t *testing.T) {
	hub := NewHub(testLogger())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go hub.Run(ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r, "metrics-user")
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	// Before connect
	m := hub.Metrics()
	if m.TotalConnects != 0 {
		t.Errorf("expected 0 connects, got %d", m.TotalConnects)
	}

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	time.Sleep(100 * time.Millisecond)

	m = hub.Metrics()
	if m.TotalConnects != 1 {
		t.Errorf("expected 1 connect, got %d", m.TotalConnects)
	}
	if m.ActiveClients != 1 {
		t.Errorf("expected 1 active, got %d", m.ActiveClients)
	}

	conn.Close()
	time.Sleep(100 * time.Millisecond)

	m = hub.Metrics()
	if m.TotalDisconnects != 1 {
		t.Errorf("expected 1 disconnect, got %d", m.TotalDisconnects)
	}
	if m.ActiveClients != 0 {
		t.Errorf("expected 0 active, got %d", m.ActiveClients)
	}
}
