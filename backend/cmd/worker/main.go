package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"vct-platform/backend/internal/worker"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Background Worker Process
//
// Usage:
//   go run ./cmd/worker
//
// Environment:
//   VCT_WORKER_COUNT     — number of parallel workers (default: 4)
//   VCT_WORKER_QUEUE     — task queue capacity (default: 100)
//   VCT_WORKER_RETRIES   — max retries per task (default: 3)
//
// This process runs independently of the HTTP server.
// Tasks can be submitted via the dispatcher's Submit method
// (future: integrate with a message broker like Redis/NATS).
// ═══════════════════════════════════════════════════════════════

func main() {
	config := worker.DefaultConfig()

	// Override from environment
	if v := os.Getenv("VCT_WORKER_COUNT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			config.WorkerCount = n
		}
	}
	if v := os.Getenv("VCT_WORKER_QUEUE"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			config.QueueSize = n
		}
	}
	if v := os.Getenv("VCT_WORKER_RETRIES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			config.DefaultRetries = n
		}
	}

	cfgJSON, _ := json.Marshal(config)
	log.Printf("[worker] config: %s", cfgJSON)

	// Create dispatcher and register all task handlers
	dispatcher := worker.NewDispatcher(config)
	worker.RegisterAll(dispatcher)

	// Start the worker pool
	dispatcher.Start()
	log.Printf("[worker] VCT background worker started")

	// Schedule periodic cleanup task
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			_ = dispatcher.Submit(&worker.Task{
				ID:   "periodic-cleanup-" + time.Now().Format("20060102-150405"),
				Type: "cleanup_expired_tokens",
				Payload: map[string]any{
					"older_than_hours": 72,
				},
			})
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	log.Printf("[worker] received signal %v, shutting down...", sig)

	dispatcher.Stop()
	log.Printf("[worker] shutdown complete")
}
