package certification

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — CERTIFICATION DOMAIN
// Manage certificates for coaches, referees, clubs, athletes.
// Lifecycle: issue → valid → expiring → expired → renewed/revoked.
// ═══════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────

type CertType string

const (
	CertCoach     CertType = "coach_license"     // Chứng nhận HLV
	CertReferee   CertType = "referee_license"   // Chứng chỉ trọng tài
	CertClub      CertType = "club_license"      // Giấy phép CLB
	CertBeltRank  CertType = "belt_rank"         // Chứng nhận đẳng cấp
	CertMedical   CertType = "medical_clearance" // Chứng nhận y tế
	CertInsurance CertType = "insurance"         // Bảo hiểm thể thao
)

type CertStatus string

const (
	CertStatusActive   CertStatus = "active"
	CertStatusExpiring CertStatus = "expiring" // < 30 days
	CertStatusExpired  CertStatus = "expired"
	CertStatusRevoked  CertStatus = "revoked"
	CertStatusPending  CertStatus = "pending"  // Chờ phê duyệt
	CertStatusRenewing CertStatus = "renewing" // Đang gia hạn
)

// ── Domain Models ────────────────────────────────────────────

// Certificate represents a verifiable certification.
type Certificate struct {
	ID            string         `json:"id"`
	CertNumber    string         `json:"cert_number"` // e.g. HLV-2026-0042
	Type          CertType       `json:"type"`
	HolderType    string         `json:"holder_type"` // "person", "club"
	HolderID      string         `json:"holder_id"`
	HolderName    string         `json:"holder_name"`
	Grade         string         `json:"grade,omitempty"` // e.g. "Cấp 1", "Quốc gia", "Đai đen nhị đẳng"
	Status        CertStatus     `json:"status"`
	IssuedBy      string         `json:"issued_by"`
	IssuedByName  string         `json:"issued_by_name"`
	IssuedAt      time.Time      `json:"issued_at"`
	ValidFrom     string         `json:"valid_from"`
	ValidUntil    string         `json:"valid_until,omitempty"`
	RenewedFrom   string         `json:"renewed_from,omitempty"` // Previous cert ID
	VerifyCode    string         `json:"verify_code"`            // Public QR verification code
	ProvinceID    string         `json:"province_id,omitempty"`
	DecisionNo    string         `json:"decision_no,omitempty"` // QĐ cấp chứng nhận
	Metadata      map[string]any `json:"metadata,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	RevokedAt     *time.Time     `json:"revoked_at,omitempty"`
	RevokedReason string         `json:"revoked_reason,omitempty"`
}

// ── Repository ───────────────────────────────────────────────

type Repository interface {
	Create(ctx context.Context, c Certificate) (*Certificate, error)
	GetByID(ctx context.Context, id string) (*Certificate, error)
	GetByVerifyCode(ctx context.Context, code string) (*Certificate, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	List(ctx context.Context) ([]Certificate, error)
	ListByHolder(ctx context.Context, holderType, holderID string) ([]Certificate, error)
	ListByType(ctx context.Context, certType CertType) ([]Certificate, error)
	ListByStatus(ctx context.Context, status CertStatus) ([]Certificate, error)
	ListExpiring(ctx context.Context, daysThreshold int) ([]Certificate, error)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	repo  Repository
	idGen func() string
}

func NewService(repo Repository, idGen func() string) *Service {
	return &Service{repo: repo, idGen: idGen}
}

// Issue creates a new active certificate.
func (s *Service) Issue(ctx context.Context, c Certificate) (*Certificate, error) {
	if c.Type == "" || c.HolderID == "" || c.HolderName == "" {
		return nil, fmt.Errorf("type, holder_id, holder_name là bắt buộc")
	}
	c.ID = s.idGen()
	c.Status = CertStatusActive
	c.VerifyCode = fmt.Sprintf("VCT-%s-%s", c.ID[:8], time.Now().Format("060102"))
	now := time.Now().UTC()
	c.IssuedAt = now
	c.CreatedAt = now
	c.UpdatedAt = now

	return s.repo.Create(ctx, c)
}

// Verify checks a certificate by its public code.
func (s *Service) Verify(ctx context.Context, code string) (*Certificate, error) {
	cert, err := s.repo.GetByVerifyCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("chứng nhận không tìm thấy: %w", err)
	}
	return cert, nil
}

// Renew creates a new certificate and links to old one.
func (s *Service) Renew(ctx context.Context, oldID string, newValidUntil string) (*Certificate, error) {
	old, err := s.repo.GetByID(ctx, oldID)
	if err != nil {
		return nil, err
	}
	if old.Status != CertStatusActive && old.Status != CertStatusExpiring && old.Status != CertStatusExpired {
		return nil, fmt.Errorf("chứng nhận không ở trạng thái có thể gia hạn")
	}

	// Expire old cert
	_ = s.repo.Update(ctx, oldID, map[string]interface{}{
		"status":     string(CertStatusExpired),
		"updated_at": time.Now().UTC(),
	})

	// Issue new one
	newCert := *old
	newCert.RenewedFrom = oldID
	newCert.ValidUntil = newValidUntil
	return s.Issue(ctx, newCert)
}

// Revoke revokes a certificate.
func (s *Service) Revoke(ctx context.Context, id, reason string) error {
	if reason == "" {
		return fmt.Errorf("lý do thu hồi là bắt buộc")
	}
	now := time.Now().UTC()
	return s.repo.Update(ctx, id, map[string]interface{}{
		"status":         string(CertStatusRevoked),
		"revoked_at":     now,
		"revoked_reason": reason,
		"updated_at":     now,
	})
}

// ── Query Methods ────────────────────────────────────────────

func (s *Service) GetCertificate(ctx context.Context, id string) (*Certificate, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ListByHolder(ctx context.Context, holderType, holderID string) ([]Certificate, error) {
	return s.repo.ListByHolder(ctx, holderType, holderID)
}

func (s *Service) ListExpiring(ctx context.Context, daysThreshold int) ([]Certificate, error) {
	return s.repo.ListExpiring(ctx, daysThreshold)
}
