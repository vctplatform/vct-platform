package domain

import "time"

// ═══════════════════════════════════════════════════════════════
// V7.0 LAYER A — Contradiction Fix Models
// ═══════════════════════════════════════════════════════════════

// AthleteDataKey — per-athlete DEK for crypto-shredding (GDPR right-to-erasure)
type AthleteDataKey struct {
	ID                     string     `json:"id"`
	AthleteID              string     `json:"athlete_id"`
	KeyPurpose             string     `json:"key_purpose"`
	EncryptedDEK           []byte     `json:"encrypted_dek"`
	KEKReference           string     `json:"kek_reference"`
	KeyVersion             int        `json:"key_version"`
	Status                 string     `json:"status"` // ACTIVE, PENDING_DESTRUCTION, DESTROYED
	DestructionRequestedAt *time.Time `json:"destruction_requested_at,omitempty"`
	DestructionRequestedBy string     `json:"destruction_requested_by,omitempty"`
	DestructionExecutedAt  *time.Time `json:"destruction_executed_at,omitempty"`
	DestructionCertificate string     `json:"destruction_certificate,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
}

// ErasureTombstone — tracks data erasure compliance records
type ErasureTombstone struct {
	ID                     string     `json:"id"`
	OriginalAthleteID      string     `json:"original_athlete_id"`
	ErasureType            string     `json:"erasure_type"` // FULL, PARTIAL, PSEUDONYMIZED
	AffectedTables         []string   `json:"affected_tables"`
	AffectedEventCount     int        `json:"affected_event_count"`
	LegalBasis             string     `json:"legal_basis"`
	LegalReference         string     `json:"legal_reference,omitempty"`
	RetainedFields         []string   `json:"retained_fields,omitempty"`
	RetentionJustification string     `json:"retention_justification,omitempty"`
	RequestedAt            time.Time  `json:"requested_at"`
	ExecutedAt             *time.Time `json:"executed_at,omitempty"`
	VerifiedBy             string     `json:"verified_by,omitempty"`
	VerificationAt         *time.Time `json:"verification_at,omitempty"`
}

// SyncConflict — offline merge conflict between devices
type SyncConflict struct {
	ID                 string     `json:"id"`
	TableName          string     `json:"table_name"`
	RecordID           string     `json:"record_id"`
	VersionA           any        `json:"version_a"`
	VersionADeviceID   string     `json:"version_a_device_id"`
	VersionATimestamp  time.Time  `json:"version_a_timestamp"`
	VersionAUserID     string     `json:"version_a_user_id"`
	VersionB           any        `json:"version_b"`
	VersionBDeviceID   string     `json:"version_b_device_id"`
	VersionBTimestamp  time.Time  `json:"version_b_timestamp"`
	VersionBUserID     string     `json:"version_b_user_id"`
	ResolutionStrategy string     `json:"resolution_strategy"`
	DomainRuleID       string     `json:"domain_rule_id,omitempty"`
	Status             string     `json:"status"` // DETECTED, AUTO_RESOLVED, PENDING_MANUAL, RESOLVED, ESCALATED
	ResolvedVersion    any        `json:"resolved_version,omitempty"`
	ResolvedBy         string     `json:"resolved_by,omitempty"`
	ResolvedAt         *time.Time `json:"resolved_at,omitempty"`
	ResolutionNotes    string     `json:"resolution_notes,omitempty"`
	DetectedAt         time.Time  `json:"detected_at"`
}

// ConflictResolutionRule — configurable merge strategy
type ConflictResolutionRule struct {
	ID            string `json:"id"`
	TableName     string `json:"table_name"`
	FieldName     string `json:"field_name,omitempty"`
	Strategy      string `json:"strategy"` // LAST_WRITE_WINS, HIGHER_AUTHORITY, MANUAL, MERGE, DOMAIN_RULE
	PriorityField string `json:"priority_field,omitempty"`
	MergeLogic    any    `json:"merge_logic,omitempty"`
	DomainLogic   string `json:"domain_logic,omitempty"`
	AppliesWhen   any    `json:"applies_when,omitempty"`
	IsActive      bool   `json:"is_active"`
}

// ConfigChangelog — configuration versioning with rollback
type ConfigChangelog struct {
	ID               string     `json:"id"`
	ConfigTable      string     `json:"config_table"`
	ConfigID         string     `json:"config_id"`
	ChangeType       string     `json:"change_type"` // CREATE, UPDATE, DEACTIVATE, ROLLBACK
	PreviousValue    any        `json:"previous_value,omitempty"`
	NewValue         any        `json:"new_value"`
	Diff             any        `json:"diff,omitempty"`
	Reason           string     `json:"reason"`
	TournamentID     string     `json:"tournament_id,omitempty"`
	IsRollbackOf     string     `json:"is_rollback_of,omitempty"`
	CanRollback      bool       `json:"can_rollback"`
	ChangedBy        string     `json:"changed_by"`
	ChangedAt        time.Time  `json:"changed_at"`
	RequiresApproval bool       `json:"requires_approval"`
	ApprovedBy       string     `json:"approved_by,omitempty"`
	ApprovedAt       *time.Time `json:"approved_at,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// V7.0 LAYER B — New Dimension Models
// ═══════════════════════════════════════════════════════════════

// EventSchema — event schema registry for governance
type EventSchema struct {
	ID                     string     `json:"id"`
	EventType              string     `json:"event_type"`
	SchemaVersion          int        `json:"schema_version"`
	SchemaDefinition       any        `json:"schema_definition"`
	CompatibilityMode      string     `json:"compatibility_mode"` // BACKWARD, FORWARD, FULL, NONE
	Status                 string     `json:"status"`             // DRAFT, ACTIVE, DEPRECATED, RETIRED
	OwnerService           string     `json:"owner_service"`
	Consumers              []string   `json:"consumers,omitempty"`
	TotalEventsValidated   int64      `json:"total_events_validated"`
	ValidationFailureCount int64      `json:"validation_failure_count"`
	LastValidationFailure  any        `json:"last_validation_failure,omitempty"`
	PublishedAt            *time.Time `json:"published_at,omitempty"`
	DeprecatedAt           *time.Time `json:"deprecated_at,omitempty"`
	RetiredAt              *time.Time `json:"retired_at,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
}

// AuthorizationTuple — Zanzibar-style ReBAC relationship
type AuthorizationTuple struct {
	ID          string     `json:"id"`
	ObjectType  string     `json:"object_type"`
	ObjectID    string     `json:"object_id"`
	Relation    string     `json:"relation"`
	SubjectType string     `json:"subject_type"`
	SubjectID   string     `json:"subject_id"`
	Condition   any        `json:"condition,omitempty"`
	GrantedBy   string     `json:"granted_by,omitempty"`
	GrantedAt   time.Time  `json:"granted_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
	RevokedBy   string     `json:"revoked_by,omitempty"`
}

// AuthorizationRule — permission derivation rule
type AuthorizationRule struct {
	ID                string `json:"id"`
	RuleName          string `json:"rule_name"`
	Description       string `json:"description,omitempty"`
	SourceRelation    string `json:"source_relation"`
	SourceObjectType  string `json:"source_object_type"`
	DerivedPermission string `json:"derived_permission"`
	TargetObjectType  string `json:"target_object_type"`
	TraversalPath     string `json:"traversal_path"`
	IsActive          bool   `json:"is_active"`
}

// DigitalSignature — tamper-proof verification for legal documents
type DigitalSignature struct {
	ID                  string     `json:"id"`
	SignedTable         string     `json:"signed_table"`
	SignedRecordID      string     `json:"signed_record_id"`
	SignedDataHash      string     `json:"signed_data_hash"`
	Signature           []byte     `json:"signature"`
	SigningAlgorithm    string     `json:"signing_algorithm"`
	SignerPublicKeyID   string     `json:"signer_public_key_id"`
	SignatureType       string     `json:"signature_type"` // RESULT_CERTIFICATION, MEDAL_AWARD, ...
	IsValid             bool       `json:"is_valid"`
	RevokedAt           *time.Time `json:"revoked_at,omitempty"`
	RevocationReason    string     `json:"revocation_reason,omitempty"`
	PreviousSignatureID string     `json:"previous_signature_id,omitempty"`
	ChainHash           string     `json:"chain_hash,omitempty"`
	SignedAt            time.Time  `json:"signed_at"`
	SignedBy            string     `json:"signed_by"`
}

// SigningKey — PKI key management
type SigningKey struct {
	ID           string     `json:"id"`
	KeyOwnerType string     `json:"key_owner_type"` // FEDERATION, TOURNAMENT, PLATFORM
	KeyOwnerID   string     `json:"key_owner_id,omitempty"`
	PublicKey    []byte     `json:"public_key"`
	Algorithm    string     `json:"algorithm"`
	Fingerprint  string     `json:"fingerprint"`
	Status       string     `json:"status"` // ACTIVE, ROTATED, REVOKED
	ValidFrom    time.Time  `json:"valid_from"`
	ValidUntil   *time.Time `json:"valid_until,omitempty"`
	RevokedAt    *time.Time `json:"revoked_at,omitempty"`
	IssuerKeyID  string     `json:"issuer_key_id,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// Translation — centralized i18n
type Translation struct {
	ID                string    `json:"id"`
	EntityType        string    `json:"entity_type"`
	EntityID          string    `json:"entity_id"`
	FieldName         string    `json:"field_name"`
	Locale            string    `json:"locale"`
	TranslatedText    string    `json:"translated_text"`
	TranslationStatus string    `json:"translation_status"` // DRAFT, MACHINE, HUMAN_REVIEWED, OFFICIAL
	TranslatedBy      string    `json:"translated_by,omitempty"`
	ReviewedBy        string    `json:"reviewed_by,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// DataQualityRule — quality monitoring rule definition
type DataQualityRule struct {
	ID                string  `json:"id"`
	RuleName          string  `json:"rule_name"`
	TableName         string  `json:"table_name"`
	RuleType          string  `json:"rule_type"` // COMPLETENESS, ACCURACY, etc.
	CheckSQL          string  `json:"check_sql"`
	Severity          string  `json:"severity"` // CRITICAL, WARNING, INFO
	ThresholdWarning  float64 `json:"threshold_warning"`
	ThresholdCritical float64 `json:"threshold_critical"`
	IsActive          bool    `json:"is_active"`
	Schedule          string  `json:"schedule"` // HOURLY, DAILY, WEEKLY, ON_DEMAND
}

// DataQualityResult — quality check result
type DataQualityResult struct {
	ID               string    `json:"id"`
	RuleID           string    `json:"rule_id"`
	TotalRecords     int64     `json:"total_records"`
	ViolationCount   int64     `json:"violation_count"`
	ViolationRate    float64   `json:"violation_rate"`
	SampleViolations any       `json:"sample_violations,omitempty"`
	Status           string    `json:"status"` // PASS, WARNING, CRITICAL
	PreviousResultID string    `json:"previous_result_id,omitempty"`
	RateChange       float64   `json:"rate_change"`
	CheckedAt        time.Time `json:"checked_at"`
}

// DataQualityScore — aggregate quality per table
type DataQualityScore struct {
	ID                string    `json:"id"`
	TableName         string    `json:"table_name"`
	OverallScore      float64   `json:"overall_score"`
	CompletenessScore float64   `json:"completeness_score"`
	AccuracyScore     float64   `json:"accuracy_score"`
	ConsistencyScore  float64   `json:"consistency_score"`
	TimelinessScore   float64   `json:"timeliness_score"`
	CalculatedAt      time.Time `json:"calculated_at"`
}

// NotificationPreference — multi-channel preferences per user
type NotificationPreference struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"user_id"`
	Category           string    `json:"category"`
	Channels           any       `json:"channels"`
	QuietHoursStart    string    `json:"quiet_hours_start,omitempty"`
	QuietHoursEnd      string    `json:"quiet_hours_end,omitempty"`
	QuietHoursTimezone string    `json:"quiet_hours_timezone"`
	QuietHoursOverride []string  `json:"quiet_hours_override,omitempty"`
	PreferredLocale    string    `json:"preferred_locale"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// NotificationDelivery — delivery tracking
type NotificationDelivery struct {
	ID                string     `json:"id"`
	UserID            string     `json:"user_id"`
	Category          string     `json:"category"`
	Title             string     `json:"title"`
	Body              string     `json:"body"`
	ActionURL         string     `json:"action_url,omitempty"`
	SourceEventID     string     `json:"source_event_id,omitempty"`
	SourceContext     any        `json:"source_context,omitempty"`
	ChannelsAttempted []string   `json:"channels_attempted"`
	ChannelsDelivered []string   `json:"channels_delivered,omitempty"`
	ChannelsFailed    []string   `json:"channels_failed,omitempty"`
	ChannelDetails    any        `json:"channel_details,omitempty"`
	Status            string     `json:"status"` // PENDING, SENT, DELIVERED, READ, FAILED, CANCELLED
	CreatedAt         time.Time  `json:"created_at"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty"`
	ReadAt            *time.Time `json:"read_at,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// V7.0 LAYER C — Enterprise Pattern Models
// ═══════════════════════════════════════════════════════════════

// ResourceAvailability — scheduling resource windows
type ResourceAvailability struct {
	ID                  string    `json:"id"`
	ResourceType        string    `json:"resource_type"` // TATAMI, REFEREE, MEDICAL_TEAM
	ResourceID          string    `json:"resource_id"`
	AvailableFrom       time.Time `json:"available_from"`
	AvailableUntil      time.Time `json:"available_until"`
	MaxContinuousHours  float64   `json:"max_continuous_hours"`
	BreakMinutes        int       `json:"break_minutes"`
	ConflictResourceIDs []string  `json:"conflict_resource_ids,omitempty"`
	TournamentID        string    `json:"tournament_id"`
}

// SchedulingConstraint — constraint-based scheduling rule
type SchedulingConstraint struct {
	ID               string `json:"id"`
	TournamentID     string `json:"tournament_id"`
	ConstraintType   string `json:"constraint_type"` // SAME_ATHLETE_GAP, CATEGORY_ORDER, etc.
	Parameters       any    `json:"parameters"`
	Priority         int    `json:"priority"`
	IsHardConstraint bool   `json:"is_hard_constraint"`
}

// GeneratedSchedule — optimized schedule output
type GeneratedSchedule struct {
	ID                   string     `json:"id"`
	TournamentID         string     `json:"tournament_id"`
	Version              int        `json:"version"`
	Status               string     `json:"status"` // DRAFT, OPTIMIZING, READY, PUBLISHED
	TotalDurationMinutes int        `json:"total_duration_minutes"`
	UtilizationRate      float64    `json:"utilization_rate"`
	ConstraintViolations int        `json:"constraint_violations"`
	OptimizationScore    float64    `json:"optimization_score"`
	ScheduleData         any        `json:"schedule_data"`
	GeneratedBy          string     `json:"generated_by"`
	GeneratedAt          time.Time  `json:"generated_at"`
	PublishedAt          *time.Time `json:"published_at,omitempty"`
	PublishedBy          string     `json:"published_by,omitempty"`
}

// DocumentTemplate — certificate/document HTML template
type DocumentTemplate struct {
	ID             string   `json:"id"`
	TemplateType   string   `json:"template_type"` // MEDAL_CERTIFICATE, BELT_PROMOTION_CERT, etc.
	TemplateHTML   string   `json:"template_html"`
	TemplateCSS    string   `json:"template_css,omitempty"`
	RequiredFields []string `json:"required_fields"`
	FederationID   string   `json:"federation_id,omitempty"`
	Version        int      `json:"version"`
	IsActive       bool     `json:"is_active"`
}

// IssuedDocument — issued document with QR verification
type IssuedDocument struct {
	ID               string     `json:"id"`
	TemplateID       string     `json:"template_id"`
	RecipientType    string     `json:"recipient_type"` // ATHLETE, REFEREE, CLUB
	RecipientID      string     `json:"recipient_id"`
	DocumentData     any        `json:"document_data"`
	DocumentNumber   string     `json:"document_number"`
	SignatureID      string     `json:"signature_id,omitempty"`
	VerificationCode string     `json:"verification_code"`
	VerificationURL  string     `json:"verification_url,omitempty"`
	PDFStoragePath   string     `json:"pdf_storage_path,omitempty"`
	IssuedAt         time.Time  `json:"issued_at"`
	IssuedBy         string     `json:"issued_by"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	RevocationReason string     `json:"revocation_reason,omitempty"`
}

// IntegrityAlert — anti-match-fixing integrity alert
type IntegrityAlert struct {
	ID                    string     `json:"id"`
	AlertType             string     `json:"alert_type"` // UNUSUAL_SCORING_PATTERN, etc.
	Severity              string     `json:"severity"`   // LOW, MEDIUM, HIGH, CRITICAL
	TriggerSource         string     `json:"trigger_source"`
	TriggerData           any        `json:"trigger_data"`
	TournamentID          string     `json:"tournament_id,omitempty"`
	MatchID               string     `json:"match_id,omitempty"`
	AthleteIDs            []string   `json:"athlete_ids,omitempty"`
	RefereeIDs            []string   `json:"referee_ids,omitempty"`
	Status                string     `json:"status"` // NEW, UNDER_REVIEW, INVESTIGATING, etc.
	AssignedTo            string     `json:"assigned_to,omitempty"`
	InvestigationNotes    string     `json:"investigation_notes,omitempty"`
	Outcome               string     `json:"outcome,omitempty"`
	DisciplinaryActionIDs []string   `json:"disciplinary_action_ids,omitempty"`
	ReportedAt            time.Time  `json:"reported_at"`
	ResolvedAt            *time.Time `json:"resolved_at,omitempty"`
}

// ScoringBaseline — statistical baselines for anomaly detection
type ScoringBaseline struct {
	ID                 string    `json:"id"`
	CategoryType       string    `json:"category_type"`
	StatType           string    `json:"stat_type"`
	BaselineValue      float64   `json:"baseline_value"`
	SampleSize         int       `json:"sample_size"`
	ConfidenceInterval float64   `json:"confidence_interval"`
	WarningDeviation   float64   `json:"warning_deviation"`
	CriticalDeviation  float64   `json:"critical_deviation"`
	CalculatedFrom     time.Time `json:"calculated_from"`
	CalculatedTo       time.Time `json:"calculated_to"`
	CalculatedAt       time.Time `json:"calculated_at"`
}

// ═══════════════════════════════════════════════════════════════
// V7.0 LAYER D — Stress Test Models
// ═══════════════════════════════════════════════════════════════

// FederationMerge — federation merge/acquisition tracking
type FederationMerge struct {
	ID                 string     `json:"id"`
	SourceFederationID string     `json:"source_federation_id"`
	TargetFederationID string     `json:"target_federation_id"`
	Status             string     `json:"status"` // PLANNED, MAPPING, EXECUTING, etc.
	EntityMappings     any        `json:"entity_mappings"`
	DuplicateAthletes  any        `json:"duplicate_athletes,omitempty"`
	DuplicateClubs     any        `json:"duplicate_clubs,omitempty"`
	RollbackSnapshotID string     `json:"rollback_snapshot_id,omitempty"`
	PlannedAt          time.Time  `json:"planned_at"`
	ExecutedAt         *time.Time `json:"executed_at,omitempty"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	ExecutedBy         string     `json:"executed_by,omitempty"`
}

// SportProfile — multi-sport configuration
type SportProfile struct {
	ID                      string `json:"id"`
	SportCode               string `json:"sport_code"`
	SportName               string `json:"sport_name"`
	CompetitionTypes        any    `json:"competition_types"`
	WeightClassConfig       any    `json:"weight_class_config"`
	DefaultMatchConfig      any    `json:"default_match_config"`
	RankingConfig           any    `json:"ranking_config,omitempty"`
	EquipmentConfig         any    `json:"equipment_config,omitempty"`
	InternationalFederation string `json:"international_federation,omitempty"`
	NationalFederation      string `json:"national_federation,omitempty"`
	IsActive                bool   `json:"is_active"`
}

// TeamEntry — team event athlete composition
type TeamEntry struct {
	ID                 string `json:"id"`
	EntryID            string `json:"entry_id"`
	AthleteID          string `json:"athlete_id"`
	RoleInTeam         string `json:"role_in_team"` // CAPTAIN, MEMBER, RESERVE
	OrderInTeam        int    `json:"order_in_team"`
	WeightClass        string `json:"weight_class,omitempty"`
	Status             string `json:"status"` // ACTIVE, SUBSTITUTED, WITHDRAWN
	SubstitutedBy      string `json:"substituted_by,omitempty"`
	SubstitutionReason string `json:"substitution_reason,omitempty"`
}

// MatchBout — individual bout within a team match
type MatchBout struct {
	ID              string     `json:"id"`
	MatchID         string     `json:"match_id"`
	BoutNumber      int        `json:"bout_number"`
	RedAthleteID    string     `json:"red_athlete_id"`
	BlueAthleteID   string     `json:"blue_athlete_id"`
	WinnerAthleteID string     `json:"winner_athlete_id,omitempty"`
	ResultType      string     `json:"result_type,omitempty"` // POINTS, KO, SUBMISSION, WALKOVER
	RedScore        any        `json:"red_score,omitempty"`
	BlueScore       any        `json:"blue_score,omitempty"`
	Status          string     `json:"status"` // PENDING, IN_PROGRESS, COMPLETED
	StartedAt       *time.Time `json:"started_at,omitempty"`
	EndedAt         *time.Time `json:"ended_at,omitempty"`
}

// AthleteDailyLoad — safety load tracking per athlete per day
type AthleteDailyLoad struct {
	ID                           string    `json:"id"`
	AthleteID                    string    `json:"athlete_id"`
	TournamentID                 string    `json:"tournament_id"`
	CompetitionDate              string    `json:"competition_date"`
	TotalMatches                 int       `json:"total_matches"`
	TotalRounds                  int       `json:"total_rounds"`
	TotalCompetitionMinutes      int       `json:"total_competition_minutes"`
	TotalRestMinutes             int       `json:"total_rest_minutes"`
	MaxMatchesPerDay             int       `json:"max_matches_per_day"`
	MaxRoundsPerDay              int       `json:"max_rounds_per_day"`
	MaxCompetitionMinutesPerDay  int       `json:"max_competition_minutes_per_day"`
	MinRestBetweenMatchesMinutes int       `json:"min_rest_between_matches_minutes"`
	LoadStatus                   string    `json:"load_status"` // NORMAL, HIGH, EXCESSIVE, BLOCKED
	MedicalClearance             bool      `json:"medical_clearance"`
	MedicalClearedBy             string    `json:"medical_cleared_by,omitempty"`
	LastUpdated                  time.Time `json:"last_updated"`
}

// AuthProviderMapping — auth vendor abstraction
type AuthProviderMapping struct {
	ID                   string     `json:"id"`
	InternalUserID       string     `json:"internal_user_id"`
	Provider             string     `json:"provider"` // SUPABASE, AUTH0, FIREBASE, KEYCLOAK
	ProviderUserID       string     `json:"provider_user_id"`
	MigratedFromProvider string     `json:"migrated_from_provider,omitempty"`
	MigratedAt           *time.Time `json:"migrated_at,omitempty"`
	IsActive             bool       `json:"is_active"`
	CreatedAt            time.Time  `json:"created_at"`
}

// StorageProviderMapping — storage vendor abstraction
type StorageProviderMapping struct {
	ID             string    `json:"id"`
	LogicalPath    string    `json:"logical_path"`
	Provider       string    `json:"provider"` // SUPABASE_STORAGE, S3, GCS
	ProviderPath   string    `json:"provider_path"`
	ProviderBucket string    `json:"provider_bucket,omitempty"`
	FileSize       int64     `json:"file_size"`
	ContentType    string    `json:"content_type,omitempty"`
	Checksum       string    `json:"checksum,omitempty"`
	UploadedAt     time.Time `json:"uploaded_at"`
}
