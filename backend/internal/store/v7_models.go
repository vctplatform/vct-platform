package store

import (
	"encoding/json"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// V7.0 Store Models
// Maps database columns to Go types for SQL scanning
// ═══════════════════════════════════════════════════════════════

// ── Layer A: Contradiction Fixes ─────────────────────────────

type AthleteDataKeyRow struct {
	ID                     string          `json:"id"`
	AthleteID              string          `json:"athlete_id"`
	KeyPurpose             string          `json:"key_purpose"`
	EncryptedDEK           []byte          `json:"encrypted_dek"`
	KEKReference           string          `json:"kek_reference"`
	KeyVersion             int             `json:"key_version"`
	Status                 string          `json:"status"`
	DestructionRequestedAt *time.Time      `json:"destruction_requested_at,omitempty"`
	DestructionRequestedBy string          `json:"destruction_requested_by,omitempty"`
	DestructionExecutedAt  *time.Time      `json:"destruction_executed_at,omitempty"`
	DestructionCertificate string          `json:"destruction_certificate,omitempty"`
	CreatedAt              time.Time       `json:"created_at"`
	Metadata               json.RawMessage `json:"metadata"`
}

type ErasureTombstoneRow struct {
	ID                     string          `json:"id"`
	OriginalAthleteID      string          `json:"original_athlete_id"`
	ErasureType            string          `json:"erasure_type"`
	AffectedTables         []string        `json:"affected_tables"`
	AffectedEventCount     int             `json:"affected_event_count"`
	LegalBasis             string          `json:"legal_basis"`
	LegalReference         string          `json:"legal_reference,omitempty"`
	RetainedFields         []string        `json:"retained_fields,omitempty"`
	RetentionJustification string          `json:"retention_justification,omitempty"`
	RequestedAt            time.Time       `json:"requested_at"`
	ExecutedAt             *time.Time      `json:"executed_at,omitempty"`
	VerifiedBy             string          `json:"verified_by,omitempty"`
	VerificationAt         *time.Time      `json:"verification_at,omitempty"`
	Metadata               json.RawMessage `json:"metadata"`
}

type SyncConflictRow struct {
	ID                 string          `json:"id"`
	TableName          string          `json:"table_name"`
	RecordID           string          `json:"record_id"`
	VersionA           json.RawMessage `json:"version_a"`
	VersionADeviceID   string          `json:"version_a_device_id"`
	VersionATimestamp  time.Time       `json:"version_a_timestamp"`
	VersionAUserID     string          `json:"version_a_user_id"`
	VersionB           json.RawMessage `json:"version_b"`
	VersionBDeviceID   string          `json:"version_b_device_id"`
	VersionBTimestamp  time.Time       `json:"version_b_timestamp"`
	VersionBUserID     string          `json:"version_b_user_id"`
	ResolutionStrategy string          `json:"resolution_strategy"`
	DomainRuleID       string          `json:"domain_rule_id,omitempty"`
	Status             string          `json:"status"`
	ResolvedVersion    json.RawMessage `json:"resolved_version,omitempty"`
	ResolvedBy         string          `json:"resolved_by,omitempty"`
	ResolvedAt         *time.Time      `json:"resolved_at,omitempty"`
	ResolutionNotes    string          `json:"resolution_notes,omitempty"`
	DetectedAt         time.Time       `json:"detected_at"`
	Metadata           json.RawMessage `json:"metadata"`
}

type ConfigChangelogRow struct {
	ID               string          `json:"id"`
	ConfigTable      string          `json:"config_table"`
	ConfigID         string          `json:"config_id"`
	ChangeType       string          `json:"change_type"`
	PreviousValue    json.RawMessage `json:"previous_value,omitempty"`
	NewValue         json.RawMessage `json:"new_value"`
	Diff             json.RawMessage `json:"diff,omitempty"`
	Reason           string          `json:"reason"`
	TournamentID     string          `json:"tournament_id,omitempty"`
	IsRollbackOf     string          `json:"is_rollback_of,omitempty"`
	CanRollback      bool            `json:"can_rollback"`
	ChangedBy        string          `json:"changed_by"`
	ChangedAt        time.Time       `json:"changed_at"`
	RequiresApproval bool            `json:"requires_approval"`
	ApprovedBy       string          `json:"approved_by,omitempty"`
	ApprovedAt       *time.Time      `json:"approved_at,omitempty"`
}

// ── Layer B: New Dimensions ──────────────────────────────────

type EventSchemaRow struct {
	ID                     string          `json:"id"`
	EventType              string          `json:"event_type"`
	SchemaVersion          int             `json:"schema_version"`
	SchemaDefinition       json.RawMessage `json:"schema_definition"`
	CompatibilityMode      string          `json:"compatibility_mode"`
	Status                 string          `json:"status"`
	OwnerService           string          `json:"owner_service"`
	Consumers              []string        `json:"consumers,omitempty"`
	TotalEventsValidated   int64           `json:"total_events_validated"`
	ValidationFailureCount int64           `json:"validation_failure_count"`
	LastValidationFailure  json.RawMessage `json:"last_validation_failure,omitempty"`
	PublishedAt            *time.Time      `json:"published_at,omitempty"`
	DeprecatedAt           *time.Time      `json:"deprecated_at,omitempty"`
	RetiredAt              *time.Time      `json:"retired_at,omitempty"`
	CreatedAt              time.Time       `json:"created_at"`
	Metadata               json.RawMessage `json:"metadata"`
}

type DataQualityRuleRow struct {
	ID                string          `json:"id"`
	RuleName          string          `json:"rule_name"`
	TableName         string          `json:"table_name"`
	RuleType          string          `json:"rule_type"`
	CheckSQL          string          `json:"check_sql"`
	Severity          string          `json:"severity"`
	ThresholdWarning  float64         `json:"threshold_warning"`
	ThresholdCritical float64         `json:"threshold_critical"`
	IsActive          bool            `json:"is_active"`
	Schedule          string          `json:"schedule"`
	Metadata          json.RawMessage `json:"metadata"`
}

type DataQualityResultRow struct {
	ID               string          `json:"id"`
	RuleID           string          `json:"rule_id"`
	TotalRecords     int64           `json:"total_records"`
	ViolationCount   int64           `json:"violation_count"`
	ViolationRate    float64         `json:"violation_rate"`
	SampleViolations json.RawMessage `json:"sample_violations,omitempty"`
	Status           string          `json:"status"`
	PreviousResultID string          `json:"previous_result_id,omitempty"`
	RateChange       float64         `json:"rate_change"`
	CheckedAt        time.Time       `json:"checked_at"`
}

type DataQualityScoreRow struct {
	ID                string    `json:"id"`
	TableName         string    `json:"table_name"`
	OverallScore      float64   `json:"overall_score"`
	CompletenessScore float64   `json:"completeness_score"`
	AccuracyScore     float64   `json:"accuracy_score"`
	ConsistencyScore  float64   `json:"consistency_score"`
	TimelinessScore   float64   `json:"timeliness_score"`
	CalculatedAt      time.Time `json:"calculated_at"`
}

type NotificationDeliveryRow struct {
	ID                string          `json:"id"`
	UserID            string          `json:"user_id"`
	Category          string          `json:"category"`
	Title             string          `json:"title"`
	Body              string          `json:"body"`
	ActionURL         string          `json:"action_url,omitempty"`
	SourceEventID     string          `json:"source_event_id,omitempty"`
	SourceContext     json.RawMessage `json:"source_context,omitempty"`
	ChannelsAttempted []string        `json:"channels_attempted"`
	ChannelsDelivered []string        `json:"channels_delivered,omitempty"`
	ChannelsFailed    []string        `json:"channels_failed,omitempty"`
	ChannelDetails    json.RawMessage `json:"channel_details,omitempty"`
	Status            string          `json:"status"`
	CreatedAt         time.Time       `json:"created_at"`
	DeliveredAt       *time.Time      `json:"delivered_at,omitempty"`
	ReadAt            *time.Time      `json:"read_at,omitempty"`
	Metadata          json.RawMessage `json:"metadata"`
}

// ── Layer C: Enterprise ──────────────────────────────────────

type IntegrityAlertRow struct {
	ID                    string          `json:"id"`
	AlertType             string          `json:"alert_type"`
	Severity              string          `json:"severity"`
	TriggerSource         string          `json:"trigger_source"`
	TriggerData           json.RawMessage `json:"trigger_data"`
	TournamentID          string          `json:"tournament_id,omitempty"`
	MatchID               string          `json:"match_id,omitempty"`
	AthleteIDs            []string        `json:"athlete_ids,omitempty"`
	RefereeIDs            []string        `json:"referee_ids,omitempty"`
	Status                string          `json:"status"`
	AssignedTo            string          `json:"assigned_to,omitempty"`
	InvestigationNotes    string          `json:"investigation_notes,omitempty"`
	Outcome               string          `json:"outcome,omitempty"`
	DisciplinaryActionIDs []string        `json:"disciplinary_action_ids,omitempty"`
	ReportedAt            time.Time       `json:"reported_at"`
	ResolvedAt            *time.Time      `json:"resolved_at,omitempty"`
	Metadata              json.RawMessage `json:"metadata"`
}

type DocumentTemplateRow struct {
	ID             string          `json:"id"`
	TemplateType   string          `json:"template_type"`
	TemplateHTML   string          `json:"template_html"`
	TemplateCSS    string          `json:"template_css,omitempty"`
	RequiredFields []string        `json:"required_fields"`
	FederationID   string          `json:"federation_id,omitempty"`
	Version        int             `json:"version"`
	IsActive       bool            `json:"is_active"`
	Metadata       json.RawMessage `json:"metadata"`
}

type IssuedDocumentRow struct {
	ID               string          `json:"id"`
	TemplateID       string          `json:"template_id"`
	RecipientType    string          `json:"recipient_type"`
	RecipientID      string          `json:"recipient_id"`
	DocumentData     json.RawMessage `json:"document_data"`
	DocumentNumber   string          `json:"document_number"`
	SignatureID      string          `json:"signature_id,omitempty"`
	VerificationCode string          `json:"verification_code"`
	VerificationURL  string          `json:"verification_url,omitempty"`
	PDFStoragePath   string          `json:"pdf_storage_path,omitempty"`
	IssuedAt         time.Time       `json:"issued_at"`
	IssuedBy         string          `json:"issued_by"`
	ExpiresAt        *time.Time      `json:"expires_at,omitempty"`
	RevokedAt        *time.Time      `json:"revoked_at,omitempty"`
	RevocationReason string          `json:"revocation_reason,omitempty"`
	Metadata         json.RawMessage `json:"metadata"`
}

// ── Layer D: Stress Tests ────────────────────────────────────

type SportProfileRow struct {
	ID                      string          `json:"id"`
	SportCode               string          `json:"sport_code"`
	SportName               string          `json:"sport_name"`
	CompetitionTypes        json.RawMessage `json:"competition_types"`
	WeightClassConfig       json.RawMessage `json:"weight_class_config"`
	DefaultMatchConfig      json.RawMessage `json:"default_match_config"`
	RankingConfig           json.RawMessage `json:"ranking_config,omitempty"`
	EquipmentConfig         json.RawMessage `json:"equipment_config,omitempty"`
	InternationalFederation string          `json:"international_federation,omitempty"`
	NationalFederation      string          `json:"national_federation,omitempty"`
	IsActive                bool            `json:"is_active"`
	Metadata                json.RawMessage `json:"metadata"`
}

type TeamEntryRow struct {
	ID                 string          `json:"id"`
	EntryID            string          `json:"entry_id"`
	AthleteID          string          `json:"athlete_id"`
	RoleInTeam         string          `json:"role_in_team"`
	OrderInTeam        int             `json:"order_in_team"`
	WeightClass        string          `json:"weight_class,omitempty"`
	Status             string          `json:"status"`
	SubstitutedBy      string          `json:"substituted_by,omitempty"`
	SubstitutionReason string          `json:"substitution_reason,omitempty"`
	Metadata           json.RawMessage `json:"metadata"`
}

type MatchBoutRow struct {
	ID              string          `json:"id"`
	MatchID         string          `json:"match_id"`
	BoutNumber      int             `json:"bout_number"`
	RedAthleteID    string          `json:"red_athlete_id"`
	BlueAthleteID   string          `json:"blue_athlete_id"`
	WinnerAthleteID string          `json:"winner_athlete_id,omitempty"`
	ResultType      string          `json:"result_type,omitempty"`
	RedScore        json.RawMessage `json:"red_score,omitempty"`
	BlueScore       json.RawMessage `json:"blue_score,omitempty"`
	Status          string          `json:"status"`
	StartedAt       *time.Time      `json:"started_at,omitempty"`
	EndedAt         *time.Time      `json:"ended_at,omitempty"`
	Metadata        json.RawMessage `json:"metadata"`
}

type AthleteDailyLoadRow struct {
	ID                           string          `json:"id"`
	AthleteID                    string          `json:"athlete_id"`
	TournamentID                 string          `json:"tournament_id"`
	CompetitionDate              string          `json:"competition_date"`
	TotalMatches                 int             `json:"total_matches"`
	TotalRounds                  int             `json:"total_rounds"`
	TotalCompetitionMinutes      int             `json:"total_competition_minutes"`
	TotalRestMinutes             int             `json:"total_rest_minutes"`
	MaxMatchesPerDay             int             `json:"max_matches_per_day"`
	MaxRoundsPerDay              int             `json:"max_rounds_per_day"`
	MaxCompetitionMinutesPerDay  int             `json:"max_competition_minutes_per_day"`
	MinRestBetweenMatchesMinutes int             `json:"min_rest_between_matches_minutes"`
	LoadStatus                   string          `json:"load_status"`
	MedicalClearance             bool            `json:"medical_clearance"`
	MedicalClearedBy             string          `json:"medical_cleared_by,omitempty"`
	LastUpdated                  time.Time       `json:"last_updated"`
	Metadata                     json.RawMessage `json:"metadata"`
}
