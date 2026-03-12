package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Audit Trail
// Records all significant actions for tournament management
// ═══════════════════════════════════════════════════════════════

import "time"

// AuditAction represents the type of action taken.
type AuditAction string

const (
	AuditActionCreate          AuditAction = "create"
	AuditActionUpdate          AuditAction = "update"
	AuditActionDelete          AuditAction = "delete"
	AuditActionSubmit          AuditAction = "submit"
	AuditActionApprove         AuditAction = "approve"
	AuditActionReject          AuditAction = "reject"
	AuditActionFinalize        AuditAction = "finalize"
	AuditActionExport          AuditAction = "export"
	AuditActionBatchApprove    AuditAction = "batch_approve"
	AuditActionBatchReject     AuditAction = "batch_reject"
	AuditActionRecalcStandings AuditAction = "recalc_standings"
)

// AuditEntry represents a single audit record.
type AuditEntry struct {
	ID           string            `json:"id"`
	TournamentID string            `json:"tournament_id"`
	EntityType   string            `json:"entity_type"`   // category, registration, schedule, result, standing
	EntityID     string            `json:"entity_id"`
	Action       AuditAction       `json:"action"`
	ActorID      string            `json:"actor_id"`
	ActorName    string            `json:"actor_name"`
	ActorRole    string            `json:"actor_role"`
	Details      map[string]string `json:"details,omitempty"` // key-value pairs of change details
	IPAddress    string            `json:"ip_address,omitempty"`
	Timestamp    time.Time         `json:"timestamp"`
}

// AuditTrail manages a list of audit entries (in-memory for now).
type AuditTrail struct {
	entries []AuditEntry
}

// NewAuditTrail creates a new empty audit trail.
func NewAuditTrail() *AuditTrail {
	return &AuditTrail{entries: make([]AuditEntry, 0)}
}

// Record adds a new entry to the audit trail.
func (at *AuditTrail) Record(entry AuditEntry) {
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}
	at.entries = append(at.entries, entry)
}

// ListByTournament returns all audit entries for a given tournament, newest first.
func (at *AuditTrail) ListByTournament(tournamentID string) []AuditEntry {
	var out []AuditEntry
	for i := len(at.entries) - 1; i >= 0; i-- {
		if at.entries[i].TournamentID == tournamentID {
			out = append(out, at.entries[i])
		}
	}
	return out
}

// ListByEntity returns audit entries for a specific entity.
func (at *AuditTrail) ListByEntity(entityType, entityID string) []AuditEntry {
	var out []AuditEntry
	for i := len(at.entries) - 1; i >= 0; i-- {
		e := at.entries[i]
		if e.EntityType == entityType && e.EntityID == entityID {
			out = append(out, e)
		}
	}
	return out
}

// ListByActor returns audit entries by a specific actor.
func (at *AuditTrail) ListByActor(actorID string) []AuditEntry {
	var out []AuditEntry
	for i := len(at.entries) - 1; i >= 0; i-- {
		if at.entries[i].ActorID == actorID {
			out = append(out, at.entries[i])
		}
	}
	return out
}

// Count returns the total number of audit entries.
func (at *AuditTrail) Count() int {
	return len(at.entries)
}
