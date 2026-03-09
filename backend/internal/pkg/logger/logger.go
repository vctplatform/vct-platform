package logger

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — STRUCTURED LOGGER
// ════════════════════════════════════════════════════════════════

import (
	"log/slog"
	"os"
)

var defaultLogger *slog.Logger

func init() {
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	env := os.Getenv("APP_ENV")
	if env == "development" || env == "" {
		// Text handler for development (human-readable)
		defaultLogger = slog.New(slog.NewTextHandler(os.Stdout, opts))
	} else {
		// JSON handler for production (machine-parseable)
		defaultLogger = slog.New(slog.NewJSONHandler(os.Stdout, opts))
	}

	slog.SetDefault(defaultLogger)
}

// Get returns the default structured logger
func Get() *slog.Logger {
	return defaultLogger
}
