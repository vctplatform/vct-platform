package realtime

import (
	"context"
	"encoding/json"
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
