package worker

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Concrete Task Handlers (Stubs)
//
// Refactored to accept Database dependencies. Analytical workloads
// (like Exporting) are expected to receive a Read-Replica connection
// to honor OLTP/OLAP workload separation.
// ═══════════════════════════════════════════════════════════════

// ── Send Notification ────────────────────────────────────────

// NotificationHandler sends email/push notifications.
type NotificationHandler struct {
	db *sql.DB
}

func NewNotificationHandler(db *sql.DB) *NotificationHandler {
	return &NotificationHandler{db: db}
}

func (h *NotificationHandler) TaskType() string { return "send_notification" }

func (h *NotificationHandler) Handle(ctx context.Context, payload map[string]any) error {
	recipientID, _ := payload["recipient_id"].(string)
	channel, _ := payload["channel"].(string)   // "email", "push", "sms"
	template, _ := payload["template"].(string) // template name

	if recipientID == "" || template == "" {
		return apierror.New("VAL_400_NOTIFICATION", "thiếu người nhận hoặc mẫu thông báo")
	}

	slog.Info("sending notification", slog.String("channel", channel), slog.String("recipient", recipientID), slog.String("template", template))

	// TODO: Wire real notification service
	// - Email: SMTP / SendGrid / AWS SES
	// - Push: Firebase Cloud Messaging
	// - SMS: Twilio / VN SMS gateway
	_ = ctx

	slog.Info("notification sent", slog.String("recipient", recipientID))
	return nil
}

// ── Export Tournament Report ─────────────────────────────────

// ExportReportHandler generates CSV/PDF tournament reports.
type ExportReportHandler struct {
	db *sql.DB // Enforced: Must be OLAP Read-Replica
}

func NewExportReportHandler(db *sql.DB) *ExportReportHandler {
	return &ExportReportHandler{db: db}
}

func (h *ExportReportHandler) TaskType() string { return "export_tournament_report" }

func (h *ExportReportHandler) Handle(ctx context.Context, payload map[string]any) error {
	tournamentID, _ := payload["tournament_id"].(string)
	format, _ := payload["format"].(string) // "csv", "pdf", "xlsx"
	requestedBy, _ := payload["requested_by"].(string)

	if tournamentID == "" {
		return apierror.New("VAL_400_TOURNAMENT", "thiếu mã định danh giải đấu")
	}
	if format == "" {
		format = "csv"
	}

	slog.Info("generating report",
		slog.String("format", format), slog.String("tournament", tournamentID), slog.String("requestedBy", requestedBy))

	// TODO: Wire real export service
	// 1. Fetch tournament data (brackets, results, medals)
	// 2. Format into CSV/PDF
	// 3. Upload to storage / send to user
	_ = ctx

	slog.Info("report generated", slog.String("tournament", tournamentID), slog.String("format", format))
	return nil
}

// ── Sync Elo Ratings ─────────────────────────────────────────

// SyncEloHandler recalculates Elo ratings in batch.
type SyncEloHandler struct {
	db *sql.DB
}

func NewSyncEloHandler(db *sql.DB) *SyncEloHandler {
	return &SyncEloHandler{db: db}
}

func (h *SyncEloHandler) TaskType() string { return "sync_elo_ratings" }

func (h *SyncEloHandler) Handle(ctx context.Context, payload map[string]any) error {
	tournamentID, _ := payload["tournament_id"].(string)
	batchSize := 100
	if bs, ok := payload["batch_size"].(float64); ok && bs > 0 {
		batchSize = int(bs)
	}

	slog.Info("syncing Elo ratings", slog.String("tournament", tournamentID), slog.Int("batchSize", batchSize))

	// TODO: Wire real Elo calculation service
	// 1. Fetch all completed matches from tournament
	// 2. For each match result, compute Elo delta
	// 3. Apply ratings batch-update
	// 4. Publish updated rankings
	_ = ctx

	slog.Info("Elo ratings synced")
	return nil
}

// ── Cleanup Expired Tokens ───────────────────────────────────

// CleanupTokensHandler removes expired auth tokens.
type CleanupTokensHandler struct {
	db *sql.DB
}

func NewCleanupTokensHandler(db *sql.DB) *CleanupTokensHandler {
	return &CleanupTokensHandler{db: db}
}

func (h *CleanupTokensHandler) TaskType() string { return "cleanup_expired_tokens" }

func (h *CleanupTokensHandler) Handle(ctx context.Context, payload map[string]any) error {
	olderThan := 24 * time.Hour
	if hours, ok := payload["older_than_hours"].(float64); ok && hours > 0 {
		olderThan = time.Duration(hours) * time.Hour
	}

	cutoff := time.Now().Add(-olderThan)
	slog.Info("cleaning up expired tokens", slog.String("cutoff", cutoff.Format(time.RFC3339)))

	// TODO: Wire real token store
	// 1. Query tokens where expires_at < cutoff
	// 2. Batch delete
	// 3. Log count removed
	_ = ctx

	slog.Info("expired tokens cleaned up")
	return nil
}

// ── Register All ─────────────────────────────────────────────

// RegisterCoreHandlers registers all built-in task handlers with dependencies.
func RegisterCoreHandlers(d *Dispatcher, db *sql.DB) {
	d.Register(NewNotificationHandler(db))
	d.Register(NewExportReportHandler(db)) // OLAP Read-Replica expected
	d.Register(NewSyncEloHandler(db))
	d.Register(NewCleanupTokensHandler(db))
}
