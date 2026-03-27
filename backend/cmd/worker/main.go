package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	natsadapter "vct-platform/backend/internal/adapter/nats"
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

	// Initialize NATS if configured
	if natsURL := os.Getenv("VCT_NATS_URL"); natsURL != "" {
		natsClient, err := natsadapter.NewClient(context.Background(), natsURL, slog.Default())
		if err != nil {
			slog.Error("failed to connect to NATS", "error", err)
			os.Exit(1)
		}
		defer natsClient.Close()
		config.NatsJS = natsClient.JetStream()
		slog.Info("NATS JetStream enabled for background workers", slog.String("url", natsURL))
	} else {
		slog.Warn("VCT_NATS_URL not set, falling back to local memory queue")
	}

	cfgJSON, _ := json.Marshal(config)
	slog.Info("worker config", slog.String("config", string(cfgJSON)))

	// Connect to Database (OLAP Read-Replica preferred)
	dbURL := os.Getenv("VCT_POSTGRES_REPLICA_URL")
	mode := "read-replica (OLAP)"
	if dbURL == "" {
		slog.Warn("VCT_POSTGRES_REPLICA_URL not found, falling back to master DB (OLTP). Analytical tasks may impact performance.")
		dbURL = os.Getenv("VCT_POSTGRES_URL")
		mode = "master (OLTP)"
	}

	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("pgx", dbURL)
		if err != nil {
			slog.Error("failed to open database connection", "error", err)
			os.Exit(1)
		}
		if err = db.PingContext(context.Background()); err != nil {
			slog.Error("failed to ping database", "error", err)
			os.Exit(1)
		}
		slog.Info("database connected for async processing", slog.String("mode", mode))
	} else {
		slog.Warn("no database URL provided, handlers will run with nil DB")
	}

	// Create dispatcher and register all task handlers
	dispatcher := worker.NewDispatcher(config)
	worker.RegisterCoreHandlers(dispatcher, db)

	// Start the worker pool
	dispatcher.Start()
	slog.Info("VCT background worker started")

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
	slog.Info("received shutdown signal", slog.String("signal", sig.String()))

	dispatcher.Stop()
	if db != nil {
		_ = db.Close()
	}
	slog.Info("worker shutdown complete")
}
