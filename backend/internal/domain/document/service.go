package document

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — OFFICIAL DOCUMENT DOMAIN
// Legal/official documents: decisions, circulars, regulations,
// certificates with versioning and entity linking.
// ═══════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────

type DocType string

const (
	DocTypeDecision    DocType = "decision"    // Quyết định
	DocTypeCircular    DocType = "circular"    // Thông tư / Công văn
	DocTypeRegulation  DocType = "regulation"  // Quy chế / Nội quy
	DocTypeReport      DocType = "report"      // Báo cáo
	DocTypeMinutes     DocType = "minutes"     // Biên bản
	DocTypeCertificate DocType = "certificate" // Giấy chứng nhận
	DocTypeNotice      DocType = "notice"      // Thông báo
)

type DocStatus string

const (
	DocStatusDraft     DocStatus = "draft"
	DocStatusPending   DocStatus = "pending_approval"
	DocStatusApproved  DocStatus = "approved"
	DocStatusPublished DocStatus = "published"
	DocStatusRevoked   DocStatus = "revoked"
	DocStatusExpired   DocStatus = "expired"
	DocStatusArchived  DocStatus = "archived"
)

type EntityLinkType string

const (
	LinkClub       EntityLinkType = "club"
	LinkTournament EntityLinkType = "tournament"
	LinkAthlete    EntityLinkType = "athlete"
	LinkCoach      EntityLinkType = "coach"
	LinkReferee    EntityLinkType = "referee"
	LinkProvince   EntityLinkType = "province"
	LinkFedUnit    EntityLinkType = "federation_unit"
)

// ── Domain Models ────────────────────────────────────────────

// OfficialDocument represents an official document issued by the federation.
type OfficialDocument struct {
	ID            string         `json:"id"`
	Number        string         `json:"number"` // Số văn bản: QĐ-001/2026/LĐ-VCT
	Type          DocType        `json:"type"`
	Title         string         `json:"title"`
	Summary       string         `json:"summary,omitempty"`
	Content       string         `json:"content,omitempty"` // Rich text / markdown
	Status        DocStatus      `json:"status"`
	IssuedBy      string         `json:"issued_by"` // User ID of issuer
	IssuedByName  string         `json:"issued_by_name"`
	IssuedByTitle string         `json:"issued_by_title"` // e.g. "Chủ tịch LĐ"
	SignedBy      string         `json:"signed_by,omitempty"`
	SignedByName  string         `json:"signed_by_name,omitempty"`
	SignedAt      *time.Time     `json:"signed_at,omitempty"`
	EffectiveDate string         `json:"effective_date,omitempty"`
	ExpiryDate    string         `json:"expiry_date,omitempty"`
	Tags          []string       `json:"tags,omitempty"`
	Attachments   []Attachment   `json:"attachments,omitempty"`
	EntityLinks   []EntityLink   `json:"entity_links,omitempty"`
	Version       int            `json:"version"`
	ParentID      string         `json:"parent_id,omitempty"`   // For versioned documents
	ReplacesID    string         `json:"replaces_id,omitempty"` // Document this supersedes
	Metadata      map[string]any `json:"metadata,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	PublishedAt   *time.Time     `json:"published_at,omitempty"`
	RevokedAt     *time.Time     `json:"revoked_at,omitempty"`
	RevokedReason string         `json:"revoked_reason,omitempty"`
}

type Attachment struct {
	Name     string `json:"name"`
	URL      string `json:"url"`
	MimeType string `json:"mime_type"`
	SizeKB   int    `json:"size_kb"`
}

// EntityLink connects a document to a business entity.
type EntityLink struct {
	EntityType EntityLinkType `json:"entity_type"`
	EntityID   string         `json:"entity_id"`
	EntityName string         `json:"entity_name"`
	LinkType   string         `json:"link_type"` // "grants", "revokes", "references", "certifies"
}

// DocumentSearchInput for filtering documents.
type DocumentSearchInput struct {
	Type       DocType   `json:"type,omitempty"`
	Status     DocStatus `json:"status,omitempty"`
	IssuedBy   string    `json:"issued_by,omitempty"`
	DateFrom   string    `json:"date_from,omitempty"`
	DateTo     string    `json:"date_to,omitempty"`
	Query      string    `json:"query,omitempty"` // Full-text search
	EntityType string    `json:"entity_type,omitempty"`
	EntityID   string    `json:"entity_id,omitempty"`
}

// ── Repository ───────────────────────────────────────────────

type Repository interface {
	Create(ctx context.Context, doc OfficialDocument) (*OfficialDocument, error)
	GetByID(ctx context.Context, id string) (*OfficialDocument, error)
	GetByNumber(ctx context.Context, number string) (*OfficialDocument, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	List(ctx context.Context) ([]OfficialDocument, error)
	ListByStatus(ctx context.Context, status DocStatus) ([]OfficialDocument, error)
	ListByType(ctx context.Context, docType DocType) ([]OfficialDocument, error)
	ListByEntity(ctx context.Context, entityType EntityLinkType, entityID string) ([]OfficialDocument, error)
	Search(ctx context.Context, input DocumentSearchInput) ([]OfficialDocument, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	repo  Repository
	idGen func() string
}

func NewService(repo Repository, idGen func() string) *Service {
	return &Service{repo: repo, idGen: idGen}
}

// CreateDraft creates a new document in draft status.
func (s *Service) CreateDraft(ctx context.Context, doc OfficialDocument) (*OfficialDocument, error) {
	if doc.Number == "" || doc.Title == "" || doc.Type == "" {
		return nil, fmt.Errorf("number, title, và type là bắt buộc")
	}

	doc.ID = s.idGen()
	doc.Status = DocStatusDraft
	doc.Version = 1
	now := time.Now().UTC()
	doc.CreatedAt = now
	doc.UpdatedAt = now

	return s.repo.Create(ctx, doc)
}

// SubmitForApproval moves a draft to pending approval.
func (s *Service) SubmitForApproval(ctx context.Context, id string) error {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if doc.Status != DocStatusDraft {
		return fmt.Errorf("chỉ văn bản nháp mới có thể gửi phê duyệt (hiện tại: %s)", doc.Status)
	}
	return s.repo.Update(ctx, id, map[string]interface{}{
		"status":     string(DocStatusPending),
		"updated_at": time.Now().UTC(),
	})
}

// Approve approves a pending document.
func (s *Service) Approve(ctx context.Context, id, approverID, approverName string) error {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if doc.Status != DocStatusPending {
		return fmt.Errorf("văn bản không ở trạng thái chờ duyệt")
	}
	now := time.Now().UTC()
	return s.repo.Update(ctx, id, map[string]interface{}{
		"status":         string(DocStatusApproved),
		"signed_by":      approverID,
		"signed_by_name": approverName,
		"signed_at":      now,
		"updated_at":     now,
	})
}

// Publish publishes an approved document.
func (s *Service) Publish(ctx context.Context, id string) error {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if doc.Status != DocStatusApproved {
		return fmt.Errorf("chỉ văn bản đã duyệt mới có thể phát hành")
	}
	now := time.Now().UTC()
	return s.repo.Update(ctx, id, map[string]interface{}{
		"status":       string(DocStatusPublished),
		"published_at": now,
		"updated_at":   now,
	})
}

// Revoke revokes a published document.
func (s *Service) Revoke(ctx context.Context, id, reason string) error {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if doc.Status != DocStatusPublished && doc.Status != DocStatusApproved {
		return fmt.Errorf("chỉ văn bản đang hiệu lực mới có thể thu hồi")
	}
	if reason == "" {
		return fmt.Errorf("lý do thu hồi là bắt buộc")
	}
	now := time.Now().UTC()
	return s.repo.Update(ctx, id, map[string]interface{}{
		"status":         string(DocStatusRevoked),
		"revoked_at":     now,
		"revoked_reason": reason,
		"updated_at":     now,
	})
}

// ── Query Methods ────────────────────────────────────────────

func (s *Service) GetDocument(ctx context.Context, id string) (*OfficialDocument, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ListDocuments(ctx context.Context) ([]OfficialDocument, error) {
	return s.repo.List(ctx)
}

func (s *Service) ListByStatus(ctx context.Context, status DocStatus) ([]OfficialDocument, error) {
	return s.repo.ListByStatus(ctx, status)
}

func (s *Service) ListByEntity(ctx context.Context, entityType EntityLinkType, entityID string) ([]OfficialDocument, error) {
	return s.repo.ListByEntity(ctx, entityType, entityID)
}

func (s *Service) SearchDocuments(ctx context.Context, input DocumentSearchInput) ([]OfficialDocument, error) {
	return s.repo.Search(ctx, input)
}
