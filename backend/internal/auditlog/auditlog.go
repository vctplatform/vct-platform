// Package auditlog provides structured audit logging with actor tracking,
// resource snapshots, query filtering, and retention management.
package auditlog

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Action Types
// ═══════════════════════════════════════════════════════════════

// Action describes what happened.
type Action string

const (
	ActionCreate Action = "create"
	ActionRead   Action = "read"
	ActionUpdate Action = "update"
	ActionDelete Action = "delete"
	ActionLogin  Action = "login"
	ActionLogout Action = "logout"
	ActionExport Action = "export"
	ActionGrant  Action = "grant"
	ActionRevoke Action = "revoke"
)

// ═══════════════════════════════════════════════════════════════
// Actor
// ═══════════════════════════════════════════════════════════════

// ActorType identifies who performed the action.
type ActorType string

const (
	ActorUser   ActorType = "user"
	ActorSystem ActorType = "system"
	ActorAPIKey ActorType = "api_key"
)

// Actor represents who performed the action.
type Actor struct {
	Type ActorType `json:"type"`
	ID   string    `json:"id"`
	Name string    `json:"name,omitempty"`
	IP   string    `json:"ip,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// Entry
// ═══════════════════════════════════════════════════════════════

// Entry is a single audit log record.
type Entry struct {
	ID         string            `json:"id"`
	Timestamp  time.Time         `json:"timestamp"`
	Action     Action            `json:"action"`
	Resource   string            `json:"resource"` // e.g., "athlete", "tournament"
	ResourceID string            `json:"resource_id"`
	Actor      Actor             `json:"actor"`
	TenantID   string            `json:"tenant_id,omitempty"`
	Changes    map[string]Change `json:"changes,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
	Success    bool              `json:"success"`
	Error      string            `json:"error,omitempty"`
}

// Change tracks a field-level diff.
type Change struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// ═══════════════════════════════════════════════════════════════
// Query Filter
// ═══════════════════════════════════════════════════════════════

// Filter for querying audit log entries.
type Filter struct {
	Action     Action
	Resource   string
	ResourceID string
	ActorID    string
	TenantID   string
	From       time.Time
	To         time.Time
	Limit      int
}

func (f Filter) matches(e *Entry) bool {
	if f.Action != "" && e.Action != f.Action {
		return false
	}
	if f.Resource != "" && e.Resource != f.Resource {
		return false
	}
	if f.ResourceID != "" && e.ResourceID != f.ResourceID {
		return false
	}
	if f.ActorID != "" && e.Actor.ID != f.ActorID {
		return false
	}
	if f.TenantID != "" && e.TenantID != f.TenantID {
		return false
	}
	if !f.From.IsZero() && e.Timestamp.Before(f.From) {
		return false
	}
	if !f.To.IsZero() && e.Timestamp.After(f.To) {
		return false
	}
	return true
}

// ═══════════════════════════════════════════════════════════════
// Logger
// ═══════════════════════════════════════════════════════════════

// Logger records and queries audit log entries.
type Logger struct {
	entries []*Entry
	mu      sync.RWMutex
	seq     atomic.Uint64
	total   atomic.Int64
}

// New creates an audit logger.
func New() *Logger {
	return &Logger{}
}

// Log records an audit entry.
func (l *Logger) Log(ctx context.Context, e *Entry) {
	if e.ID == "" {
		e.ID = fmt.Sprintf("audit-%d", l.seq.Add(1))
	}
	if e.Timestamp.IsZero() {
		e.Timestamp = time.Now().UTC()
	}

	l.mu.Lock()
	l.entries = append(l.entries, e)
	l.mu.Unlock()
	l.total.Add(1)
}

// Query returns entries matching the filter.
func (l *Logger) Query(f Filter) []*Entry {
	l.mu.RLock()
	defer l.mu.RUnlock()

	limit := f.Limit
	if limit <= 0 {
		limit = 100
	}

	var results []*Entry
	// Iterate in reverse (newest first)
	for i := len(l.entries) - 1; i >= 0 && len(results) < limit; i-- {
		if f.matches(l.entries[i]) {
			results = append(results, l.entries[i])
		}
	}
	return results
}

// Count returns total entries.
func (l *Logger) Count() int64 {
	return l.total.Load()
}

// ResourceHistory returns all changes for a specific resource.
func (l *Logger) ResourceHistory(resource, resourceID string) []*Entry {
	return l.Query(Filter{Resource: resource, ResourceID: resourceID, Limit: 1000})
}

// ═══════════════════════════════════════════════════════════════
// Builder — Fluent API
// ═══════════════════════════════════════════════════════════════

// Builder provides a fluent API for creating audit entries.
type Builder struct {
	entry  *Entry
	logger *Logger
}

// Record starts building an audit entry.
func (l *Logger) Record(action Action) *Builder {
	return &Builder{
		entry:  &Entry{Action: action, Success: true},
		logger: l,
	}
}

func (b *Builder) Resource(resource, id string) *Builder {
	b.entry.Resource = resource
	b.entry.ResourceID = id
	return b
}

func (b *Builder) By(actorType ActorType, id, name string) *Builder {
	b.entry.Actor = Actor{Type: actorType, ID: id, Name: name}
	return b
}

func (b *Builder) IP(ip string) *Builder {
	b.entry.Actor.IP = ip
	return b
}

func (b *Builder) Tenant(id string) *Builder {
	b.entry.TenantID = id
	return b
}

func (b *Builder) Changed(field, from, to string) *Builder {
	if b.entry.Changes == nil {
		b.entry.Changes = make(map[string]Change)
	}
	b.entry.Changes[field] = Change{From: from, To: to}
	return b
}

func (b *Builder) Meta(key, value string) *Builder {
	if b.entry.Metadata == nil {
		b.entry.Metadata = make(map[string]string)
	}
	b.entry.Metadata[key] = value
	return b
}

func (b *Builder) Failed(err string) *Builder {
	b.entry.Success = false
	b.entry.Error = err
	return b
}

func (b *Builder) Commit(ctx context.Context) {
	b.logger.Log(ctx, b.entry)
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

// Summarize returns a human-readable summary of an entry.
func Summarize(e *Entry) string {
	var sb strings.Builder
	fmt.Fprintf(&sb, "[%s] %s %s %s/%s", e.Timestamp.Format("2006-01-02 15:04"), e.Actor.Name, e.Action, e.Resource, e.ResourceID)
	if len(e.Changes) > 0 {
		sb.WriteString(" changes: ")
		for field, ch := range e.Changes {
			fmt.Fprintf(&sb, "%s(%s→%s) ", field, ch.From, ch.To)
		}
	}
	if !e.Success {
		fmt.Fprintf(&sb, " FAILED: %s", e.Error)
	}
	return sb.String()
}
