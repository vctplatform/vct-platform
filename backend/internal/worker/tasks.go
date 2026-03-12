package worker

import (
	"context"
	"fmt"
	"log"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Concrete Task Handlers (Stubs)
//
// Each handler implements TaskHandler and processes a specific
// type of background work. Currently stubs — wire real services
// as dependencies when ready.
// ═══════════════════════════════════════════════════════════════

// ── Send Notification ────────────────────────────────────────

// NotificationHandler sends email/push notifications.
type NotificationHandler struct{}

func (h *NotificationHandler) TaskType() string { return "send_notification" }

func (h *NotificationHandler) Handle(ctx context.Context, payload map[string]any) error {
	recipientID, _ := payload["recipient_id"].(string)
	channel, _ := payload["channel"].(string)   // "email", "push", "sms"
	template, _ := payload["template"].(string)  // template name

	if recipientID == "" || template == "" {
		return fmt.Errorf("missing recipient_id or template")
	}

	log.Printf("[notify] sending %s notification to %s (template: %s)", channel, recipientID, template)

	// TODO: Wire real notification service
	// - Email: SMTP / SendGrid / AWS SES
	// - Push: Firebase Cloud Messaging
	// - SMS: Twilio / VN SMS gateway
	_ = ctx

	log.Printf("[notify] ✓ notification sent to %s", recipientID)
	return nil
}

// ── Export Tournament Report ─────────────────────────────────

// ExportReportHandler generates CSV/PDF tournament reports.
type ExportReportHandler struct{}

func (h *ExportReportHandler) TaskType() string { return "export_tournament_report" }

func (h *ExportReportHandler) Handle(ctx context.Context, payload map[string]any) error {
	tournamentID, _ := payload["tournament_id"].(string)
	format, _ := payload["format"].(string)       // "csv", "pdf", "xlsx"
	requestedBy, _ := payload["requested_by"].(string)

	if tournamentID == "" {
		return fmt.Errorf("missing tournament_id")
	}
	if format == "" {
		format = "csv"
	}

	log.Printf("[export] generating %s report for tournament %s (requested by: %s)",
		format, tournamentID, requestedBy)

	// TODO: Wire real export service
	// 1. Fetch tournament data (brackets, results, medals)
	// 2. Format into CSV/PDF
	// 3. Upload to storage / send to user
	_ = ctx

	log.Printf("[export] ✓ report generated for tournament %s (%s)", tournamentID, format)
	return nil
}

// ── Sync Elo Ratings ─────────────────────────────────────────

// SyncEloHandler recalculates Elo ratings in batch.
type SyncEloHandler struct{}

func (h *SyncEloHandler) TaskType() string { return "sync_elo_ratings" }

func (h *SyncEloHandler) Handle(ctx context.Context, payload map[string]any) error {
	tournamentID, _ := payload["tournament_id"].(string)
	batchSize := 100
	if bs, ok := payload["batch_size"].(float64); ok && bs > 0 {
		batchSize = int(bs)
	}

	log.Printf("[elo] syncing Elo ratings (tournament: %s, batch: %d)", tournamentID, batchSize)

	// TODO: Wire real Elo calculation service
	// 1. Fetch all completed matches from tournament
	// 2. For each match result, compute Elo delta
	// 3. Apply ratings batch-update
	// 4. Publish updated rankings
	_ = ctx

	log.Printf("[elo] ✓ Elo ratings synced")
	return nil
}

// ── Cleanup Expired Tokens ───────────────────────────────────

// CleanupTokensHandler removes expired auth tokens.
type CleanupTokensHandler struct{}

func (h *CleanupTokensHandler) TaskType() string { return "cleanup_expired_tokens" }

func (h *CleanupTokensHandler) Handle(ctx context.Context, payload map[string]any) error {
	olderThan := 24 * time.Hour
	if hours, ok := payload["older_than_hours"].(float64); ok && hours > 0 {
		olderThan = time.Duration(hours) * time.Hour
	}

	cutoff := time.Now().Add(-olderThan)
	log.Printf("[cleanup] removing tokens expired before %s", cutoff.Format(time.RFC3339))

	// TODO: Wire real token store
	// 1. Query tokens where expires_at < cutoff
	// 2. Batch delete
	// 3. Log count removed
	_ = ctx

	log.Printf("[cleanup] ✓ expired tokens cleaned up")
	return nil
}

// ── Register All ─────────────────────────────────────────────

// RegisterAll registers all built-in task handlers with the dispatcher.
func RegisterAll(d *Dispatcher) {
	d.Register(&NotificationHandler{})
	d.Register(&ExportReportHandler{})
	d.Register(&SyncEloHandler{})
	d.Register(&CleanupTokensHandler{})
}
