package audit

import (
	"context"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — AUDIT TRAIL
// Records who did what, when, where.
// Queryable via API for compliance and debugging.
// ═══════════════════════════════════════════════════════════════

// Action categorises audit events.
type Action string

const (
	ActionCreate  Action = "create"
	ActionUpdate  Action = "update"
	ActionDelete  Action = "delete"
	ActionLogin   Action = "login"
	ActionExport  Action = "export"
	ActionApprove Action = "approve"
	ActionReject  Action = "reject"
)

// Entry is a single audit log entry.
type Entry struct {
	ID         string            `json:"id"`
	UserID     string            `json:"user_id"`
	UserName   string            `json:"user_name"`
	UserRole   string            `json:"user_role"`
	Action     Action            `json:"action"`
	Resource   string            `json:"resource"`    // e.g. "athlete", "tournament"
	ResourceID string            `json:"resource_id"` // e.g. "ATH-001"
	Changes    map[string]Change `json:"changes,omitempty"`
	IPAddress  string            `json:"ip_address"`
	UserAgent  string            `json:"user_agent"`
	RequestID  string            `json:"request_id"`
	Timestamp  time.Time         `json:"timestamp"`
}

// Change records before/after for a field.
type Change struct {
	Before interface{} `json:"before"`
	After  interface{} `json:"after"`
}

// Query filters audit entries.
type Query struct {
	UserID     string    `json:"user_id,omitempty"`
	Action     Action    `json:"action,omitempty"`
	Resource   string    `json:"resource,omitempty"`
	ResourceID string    `json:"resource_id,omitempty"`
	From       time.Time `json:"from,omitempty"`
	To         time.Time `json:"to,omitempty"`
	Limit      int       `json:"limit,omitempty"`
	Offset     int       `json:"offset,omitempty"`
}

// Store persists audit entries.
type Store interface {
	Append(ctx context.Context, entry Entry) error
	Query(ctx context.Context, q Query) ([]Entry, int, error)
}

// Service provides audit logging.
type Service struct {
	store Store
	idGen func() string
}

// NewService creates a new audit service.
func NewService(store Store, idGen func() string) *Service {
	return &Service{store: store, idGen: idGen}
}

// Log records an audit event.
func (s *Service) Log(ctx context.Context, userID, userName, userRole string, action Action, resource, resourceID string, changes map[string]Change) {
	entry := Entry{
		ID:         s.idGen(),
		UserID:     userID,
		UserName:   userName,
		UserRole:   userRole,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Changes:    changes,
		Timestamp:  time.Now().UTC(),
	}

	// Best-effort — don't block the main operation
	go func() {
		_ = s.store.Append(context.Background(), entry)
	}()
}

// Search queries the audit trail.
func (s *Service) Search(ctx context.Context, q Query) ([]Entry, int, error) {
	if q.Limit <= 0 {
		q.Limit = 50
	}
	return s.store.Query(ctx, q)
}
