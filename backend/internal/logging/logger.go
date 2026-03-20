// Package logging provides structured JSON logging with slog,
// request context propagation, and OpenTelemetry trace correlation.
package logging

import (
	"context"
	"io"
	"log/slog"
	"os"
	"runtime"
	"time"
)

type contextKey string

const loggerKey contextKey = "logger"

// Config holds logger configuration.
type Config struct {
	Level       slog.Level // Minimum log level
	Format      string     // "json" or "text"
	Output      io.Writer  // Output destination
	ServiceName string     // Service identifier
	Environment string     // staging/production
	AddSource   bool       // Include source file info
}

// DefaultConfig returns production-ready defaults.
func DefaultConfig() Config {
	return Config{
		Level:       slog.LevelInfo,
		Format:      "json",
		Output:      os.Stdout,
		ServiceName: "vct-api",
		Environment: "production",
		AddSource:   true,
	}
}

// NewLogger creates a configured structured logger.
func NewLogger(cfg Config) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level:     cfg.Level,
		AddSource: cfg.AddSource,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Use RFC3339 timestamps
			if a.Key == slog.TimeKey {
				a.Value = slog.StringValue(a.Value.Time().Format(time.RFC3339Nano))
			}
			// Shorten source paths
			if a.Key == slog.SourceKey {
				if src, ok := a.Value.Any().(*slog.Source); ok {
					src.File = shortPath(src.File)
				}
			}
			return a
		},
	}

	var handler slog.Handler
	if cfg.Format == "json" {
		handler = slog.NewJSONHandler(cfg.Output, opts)
	} else {
		handler = slog.NewTextHandler(cfg.Output, opts)
	}

	return slog.New(handler).With(
		slog.String("service", cfg.ServiceName),
		slog.String("environment", cfg.Environment),
		slog.String("go_version", runtime.Version()),
	)
}

// WithContext stores a logger in the context.
func WithContext(ctx context.Context, logger *slog.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, logger)
}

// FromContext retrieves the logger from context, or returns the default.
func FromContext(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
		return logger
	}
	return slog.Default()
}

// shortPath reduces absolute file paths for readability.
func shortPath(path string) string {
	// Find the last two path segments
	count := 0
	for i := len(path) - 1; i >= 0; i-- {
		if path[i] == '/' || path[i] == '\\' {
			count++
			if count == 3 {
				return path[i+1:]
			}
		}
	}
	return path
}
