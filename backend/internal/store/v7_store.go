package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"vct-platform/backend/internal/apierror"

	"github.com/jackc/pgx/v5"
)

// ═══════════════════════════════════════════════════════════════
// V7.0 STORE — CRUD operations for V7.0 tables
// ═══════════════════════════════════════════════════════════════

// ── Authorization (ReBAC) ─────────────────────────────────────

type AuthzCheckInput struct {
	ObjectType  string
	ObjectID    string
	Relation    string
	SubjectType string
	SubjectID   string
}

func (s *PostgresStore) CheckAuthorization(ctx context.Context, input AuthzCheckInput) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM core.authorization_tuples
			WHERE object_type = $1 AND object_id = $2::UUID AND relation = $3
			  AND subject_type = $4 AND subject_id = $5::UUID
			  AND revoked_at IS NULL
			  AND (expires_at IS NULL OR expires_at > now())
		)
	`, input.ObjectType, input.ObjectID, input.Relation, input.SubjectType, input.SubjectID).Scan(&exists)
	if err != nil {
		return false, apierror.Wrap(err, "STORE_AUTHZ_001", "kiểm tra quyền hạn thất bại")
	}
	return exists, nil
}

func (s *PostgresStore) GrantAuthorization(ctx context.Context, input AuthzCheckInput, grantedBy string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO core.authorization_tuples
			(object_type, object_id, relation, subject_type, subject_id, granted_by)
		VALUES ($1, $2::UUID, $3, $4, $5::UUID, $6::UUID)
		ON CONFLICT (object_type, object_id, relation, subject_type, subject_id) DO UPDATE
		SET revoked_at = NULL, expires_at = NULL
	`, input.ObjectType, input.ObjectID, input.Relation, input.SubjectType, input.SubjectID, grantedBy)
	if err != nil {
		return apierror.Wrap(err, "STORE_AUTHZ_002", "cấp quyền hạn thất bại")
	}
	return nil
}

func (s *PostgresStore) RevokeAuthorization(ctx context.Context, input AuthzCheckInput, revokedBy string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE core.authorization_tuples
		SET revoked_at = now(), revoked_by = $6::UUID
		WHERE object_type = $1 AND object_id = $2::UUID AND relation = $3
		  AND subject_type = $4 AND subject_id = $5::UUID
		  AND revoked_at IS NULL
	`, input.ObjectType, input.ObjectID, input.Relation, input.SubjectType, input.SubjectID, revokedBy)
	if err != nil {
		return apierror.Wrap(err, "STORE_AUTHZ_003", "thu hồi quyền hạn thất bại")
	}
	return nil
}

// ── Data Quality ──────────────────────────────────────────────

type DataQualityScore struct {
	TableName         string    `json:"table_name"`
	OverallScore      float64   `json:"overall_score"`
	CompletenessScore *float64  `json:"completeness_score,omitempty"`
	AccuracyScore     *float64  `json:"accuracy_score,omitempty"`
	ConsistencyScore  *float64  `json:"consistency_score,omitempty"`
	TimelinessScore   *float64  `json:"timeliness_score,omitempty"`
	CalculatedAt      time.Time `json:"calculated_at"`
}

func (s *PostgresStore) ListDataQualityScores(ctx context.Context) ([]DataQualityScore, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT table_name, overall_score, completeness_score, accuracy_score,
		       consistency_score, timeliness_score, calculated_at
		FROM api_v1.data_quality_dashboard
		ORDER BY overall_score ASC
	`)
	if err != nil {
		return nil, apierror.Wrap(err, "STORE_DQ_001", "liệt kê điểm chất lượng dữ liệu thất bại")
	}
	defer rows.Close()

	var result []DataQualityScore
	for rows.Next() {
		var s DataQualityScore
		if scanErr := rows.Scan(
			&s.TableName, &s.OverallScore, &s.CompletenessScore,
			&s.AccuracyScore, &s.ConsistencyScore, &s.TimelinessScore,
			&s.CalculatedAt,
		); scanErr != nil {
			continue
		}
		result = append(result, s)
	}
	return result, nil
}

func (s *PostgresStore) UpsertDataQualityScore(ctx context.Context, score DataQualityScore) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO system.data_quality_scores
			(table_name, overall_score, completeness_score, accuracy_score, consistency_score, timeliness_score)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, score.TableName, score.OverallScore, score.CompletenessScore,
		score.AccuracyScore, score.ConsistencyScore, score.TimelinessScore)
	if err != nil {
		return apierror.Wrap(err, "STORE_DQ_002", "cập nhật điểm chất lượng dữ liệu thất bại")
	}
	return nil
}

// ── Notification Preferences ──────────────────────────────────

type NotificationPreference struct {
	UserID   string          `json:"user_id"`
	Category string          `json:"category"`
	Channels json.RawMessage `json:"channels"`
}

func (s *PostgresStore) GetNotificationPreferences(ctx context.Context, userID string) ([]NotificationPreference, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT user_id, category, channels
		FROM system.notification_preferences
		WHERE user_id = $1::UUID
	`, userID)
	if err != nil {
		return nil, apierror.Wrap(err, "STORE_NOTIF_001", "lấy cấu hình thông báo thất bại")
	}
	defer rows.Close()

	var result []NotificationPreference
	for rows.Next() {
		var p NotificationPreference
		if scanErr := rows.Scan(&p.UserID, &p.Category, &p.Channels); scanErr != nil {
			continue
		}
		result = append(result, p)
	}
	return result, nil
}

func (s *PostgresStore) UpsertNotificationPreference(ctx context.Context, pref NotificationPreference) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO system.notification_preferences (user_id, category, channels)
		VALUES ($1::UUID, $2, $3)
		ON CONFLICT (user_id, category) DO UPDATE SET channels = EXCLUDED.channels, updated_at = now()
	`, pref.UserID, pref.Category, pref.Channels)
	if err != nil {
		return apierror.Wrap(err, "STORE_NOTIF_002", "cập nhật cấu hình thông báo thất bại")
	}
	return nil
}

// ── Notification Deliveries ───────────────────────────────────

type NotificationDelivery struct {
	ID                string          `json:"id"`
	UserID            string          `json:"user_id"`
	Category          string          `json:"category"`
	Title             string          `json:"title"`
	Body              string          `json:"body"`
	Status            string          `json:"status"`
	ChannelsAttempted []string        `json:"channels_attempted"`
	ChannelsDelivered []string        `json:"channels_delivered"`
	CreatedAt         time.Time       `json:"created_at"`
	Metadata          json.RawMessage `json:"metadata,omitempty"`
}

func (s *PostgresStore) CreateNotificationDelivery(ctx context.Context, d NotificationDelivery) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO system.notification_deliveries
			(user_id, category, title, body, channels_attempted, status, metadata)
		VALUES ($1::UUID, $2, $3, $4, $5, 'PENDING', COALESCE($6, '{}'))
	`, d.UserID, d.Category, d.Title, d.Body, d.ChannelsAttempted, d.Metadata)
	if err != nil {
		return apierror.Wrap(err, "STORE_NOTIF_003", "tạo bản ghi gửi thông báo thất bại")
	}
	return nil
}

func (s *PostgresStore) MarkNotificationDelivered(ctx context.Context, id string, channels []string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE system.notification_deliveries
		SET status = 'DELIVERED', channels_delivered = $2, delivered_at = now()
		WHERE id = $1::UUID
	`, id, channels)
	if err != nil {
		return apierror.Wrap(err, "STORE_NOTIF_004", "đánh dấu đã gửi thông báo thất bại")
	}
	return nil
}

func (s *PostgresStore) MarkNotificationRead(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE system.notification_deliveries
		SET status = 'READ', read_at = now()
		WHERE id = $1::UUID AND status != 'READ'
	`, id)
	if err != nil {
		return apierror.Wrap(err, "STORE_NOTIF_005", "đánh dấu đã đọc thông báo thất bại")
	}
	return nil
}

// ── Integrity Alerts ──────────────────────────────────────────

type IntegrityAlert struct {
	ID            string          `json:"id"`
	AlertType     string          `json:"alert_type"`
	Severity      string          `json:"severity"`
	TriggerSource string          `json:"trigger_source"`
	TriggerData   json.RawMessage `json:"trigger_data"`
	TournamentID  *string         `json:"tournament_id,omitempty"`
	Status        string          `json:"status"`
	AssignedTo    *string         `json:"assigned_to,omitempty"`
	ReportedAt    time.Time       `json:"reported_at"`
}

func (s *PostgresStore) CreateIntegrityAlert(ctx context.Context, alert IntegrityAlert) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO tournament.integrity_alerts
			(alert_type, severity, trigger_source, trigger_data, tournament_id)
		VALUES ($1, $2, $3, $4, $5::UUID)
		RETURNING id
	`, alert.AlertType, alert.Severity, alert.TriggerSource, alert.TriggerData, alert.TournamentID).Scan(&id)
	if err != nil {
		return "", apierror.Wrap(err, "STORE_ALERT_001", "tạo cảnh báo liêm chính thất bại")
	}
	return id, nil
}

func (s *PostgresStore) UpdateIntegrityAlertStatus(ctx context.Context, id, status string, assignedTo *string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE tournament.integrity_alerts
		SET status = $2, assigned_to = $3::UUID,
		    resolved_at = CASE WHEN $2 IN ('CLOSED', 'UNSUBSTANTIATED', 'SUBSTANTIATED') THEN now() ELSE NULL END
		WHERE id = $1::UUID
	`, id, status, assignedTo)
	if err != nil {
		return apierror.Wrap(err, "STORE_ALERT_002", "cập nhật trạng thái cảnh báo liêm chính thất bại")
	}
	return nil
}

func (s *PostgresStore) ListActiveIntegrityAlerts(ctx context.Context, tournamentID *string) ([]IntegrityAlert, error) {
	query := `
		SELECT id, alert_type, severity, trigger_source, trigger_data,
		       tournament_id, status, assigned_to, reported_at
		FROM api_v1.active_integrity_alerts
	`
	var rows pgx.Rows
	var err error
	if tournamentID != nil {
		query += ` WHERE tournament_id = $1::UUID`
		rows, err = s.pool.Query(ctx, query, *tournamentID)
	} else {
		rows, err = s.pool.Query(ctx, query)
	}
	if err != nil {
		return nil, apierror.Wrap(err, "STORE_ALERT_003", "liệt kê cảnh báo liêm chính thất bại")
	}
	defer rows.Close()

	var result []IntegrityAlert
	for rows.Next() {
		var a IntegrityAlert
		if scanErr := rows.Scan(
			&a.ID, &a.AlertType, &a.Severity, &a.TriggerSource, &a.TriggerData,
			&a.TournamentID, &a.Status, &a.AssignedTo, &a.ReportedAt,
		); scanErr != nil {
			continue
		}
		result = append(result, a)
	}
	return result, nil
}

// ── Issued Documents ──────────────────────────────────────────

type IssuedDocumentInput struct {
	TemplateID       string          `json:"template_id"`
	RecipientType    string          `json:"recipient_type"`
	RecipientID      string          `json:"recipient_id"`
	DocumentData     json.RawMessage `json:"document_data"`
	DocumentNumber   string          `json:"document_number"`
	VerificationCode string          `json:"verification_code"`
	IssuedBy         string          `json:"issued_by"`
}

func (s *PostgresStore) IssueDocument(ctx context.Context, input IssuedDocumentInput) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO platform.issued_documents
			(template_id, recipient_type, recipient_id, document_data,
			 document_number, verification_code, issued_by)
		VALUES ($1::UUID, $2, $3::UUID, $4, $5, $6, $7::UUID)
		RETURNING id
	`, input.TemplateID, input.RecipientType, input.RecipientID,
		input.DocumentData, input.DocumentNumber, input.VerificationCode, input.IssuedBy).Scan(&id)
	if err != nil {
		return "", apierror.Wrap(err, "STORE_DOC_001", "cấp phát tài liệu thất bại")
	}
	return id, nil
}

func (s *PostgresStore) VerifyDocument(ctx context.Context, verificationCode string) (map[string]any, error) {
	var data json.RawMessage
	var docNumber, recipientType, status string
	var issuedAt time.Time

	err := s.pool.QueryRow(ctx, `
		SELECT document_number, recipient_type, document_data, document_status, issued_at
		FROM api_v1.issued_documents_list
		WHERE verification_code = $1
	`, verificationCode).Scan(&docNumber, &recipientType, &data, &status, &issuedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, apierror.Wrap(err, "STORE_DOC_002", "xác minh tài liệu thất bại")
	}

	return map[string]any{
		"valid":           status == "VALID",
		"document_number": docNumber,
		"recipient_type":  recipientType,
		"status":          status,
		"issued_at":       issuedAt,
	}, nil
}

// ── Config Changelog ──────────────────────────────────────────

func (s *PostgresStore) RecordConfigChange(ctx context.Context, table string, configID string,
	changeType string, prevValue, newValue json.RawMessage, reason string, changedBy string, tournamentID *string) error {

	var diff json.RawMessage
	// Simple diff: store both values, app can compute detailed diff
	_, err := s.pool.Exec(ctx, `
		INSERT INTO system.config_changelog
			(config_table, config_id, change_type, previous_value, new_value, diff, reason, changed_by, tournament_id)
		VALUES ($1, $2::UUID, $3, $4, $5, $6, $7, $8::UUID, $9::UUID)
	`, table, configID, changeType, prevValue, newValue, diff, reason, changedBy, tournamentID)
	if err != nil {
		return apierror.Wrap(err, "STORE_SYS_001", "ghi nhật ký thay đổi cấu hình thất bại")
	}
	return nil
}
