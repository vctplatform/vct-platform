package audit

import (
	"encoding/json"
	"log/slog"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — AUDIT EXTENSIONS
// Enhanced actions, slog integration, and serialization helpers.
// Extends the core audit service in service.go.
// ═══════════════════════════════════════════════════════════════

// Additional audit actions (extending the base set in service.go).
const (
	ActionLogout        Action = "logout"
	ActionLoginFailed   Action = "login_failed"
	ActionBulkUpdate    Action = "bulk_update"
	ActionRoleChange    Action = "role_change"
	ActionPasswordReset Action = "password_reset"
	ActionConfigChange  Action = "config_change"
)

// SlogAttrs converts an Entry to slog attributes for structured logging.
func SlogAttrs(entry Entry) []any {
	attrs := []any{
		slog.String("audit_id", entry.ID),
		slog.String("user_id", entry.UserID),
		slog.String("action", string(entry.Action)),
		slog.String("resource", entry.Resource),
	}
	if entry.ResourceID != "" {
		attrs = append(attrs, slog.String("resource_id", entry.ResourceID))
	}
	if entry.IPAddress != "" {
		attrs = append(attrs, slog.String("ip", entry.IPAddress))
	}
	if entry.RequestID != "" {
		attrs = append(attrs, slog.String("request_id", entry.RequestID))
	}
	return attrs
}

// MarshalEntry serializes an entry for external consumption.
func MarshalEntry(entry Entry) ([]byte, error) {
	return json.Marshal(entry)
}

// LogAndStream records an entry and also emits it as a structured slog event.
func LogAndStream(svc *Service, logger *slog.Logger, entry Entry) {
	svc.Log(
		nil,
		entry.UserID, entry.UserName, entry.UserRole,
		entry.Action, entry.Resource, entry.ResourceID,
		entry.Changes,
	)
	attrs := SlogAttrs(entry)
	logger.Info("audit_event", attrs...)
}
