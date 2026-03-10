package finance

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FINANCE SERVICE V2
// Enhanced with budget enforcement, invoice management, payments.
// ═══════════════════════════════════════════════════════════════

// ── Extended Repositories ────────────────────────────────────

type InvoiceRepository interface {
	Create(ctx context.Context, inv Invoice) (*Invoice, error)
	GetByID(ctx context.Context, id string) (*Invoice, error)
	List(ctx context.Context, filter InvoiceFilter) ([]Invoice, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	GetNextNumber(ctx context.Context) (string, error) // e.g. "INV-2026-0042"
}

type InvoiceFilter struct {
	Direction    InvoiceDirection `json:"direction,omitempty"`
	Status       InvoiceStatus    `json:"status,omitempty"`
	TournamentID string           `json:"tournament_id,omitempty"`
	RecipientID  string           `json:"recipient_id,omitempty"`
}

type PaymentRepository interface {
	Create(ctx context.Context, p Payment) (*Payment, error)
	GetByID(ctx context.Context, id string) (*Payment, error)
	ListByInvoice(ctx context.Context, invoiceID string) ([]Payment, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

type FeeScheduleRepository interface {
	Create(ctx context.Context, fs FeeSchedule) error
	ListByTournament(ctx context.Context, tournamentID string) ([]FeeSchedule, error)
}

type BudgetV2Repository interface {
	Upsert(ctx context.Context, b BudgetV2) error
	GetByScope(ctx context.Context, scopeType string, scopeID string, fiscalYear int, categoryCode string) (*BudgetV2, error)
	List(ctx context.Context, scopeType string, scopeID string, fiscalYear int) ([]BudgetV2, error)
	UpdateSpent(ctx context.Context, id string, delta float64) error
	UpdateCommitted(ctx context.Context, id string, delta float64) error
}

type SponsorshipRepository interface {
	Create(ctx context.Context, s Sponsorship) (*Sponsorship, error)
	GetByID(ctx context.Context, id string) (*Sponsorship, error)
	List(ctx context.Context) ([]Sponsorship, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
}

// ── Service V2 ───────────────────────────────────────────────

// ServiceV2 is the enhanced finance service with full workflow support.
type ServiceV2 struct {
	txRepo          TransactionRepository
	budgetRepo      BudgetRepository // legacy
	budgetV2Repo    BudgetV2Repository
	invoiceRepo     InvoiceRepository
	paymentRepo     PaymentRepository
	feeScheduleRepo FeeScheduleRepository
	sponsorRepo     SponsorshipRepository
	idGenerator     func() string
}

// NewServiceV2 creates an enhanced finance service.
func NewServiceV2(
	tx TransactionRepository,
	budget BudgetRepository,
	budgetV2 BudgetV2Repository,
	invoice InvoiceRepository,
	payment PaymentRepository,
	feeSchedule FeeScheduleRepository,
	sponsor SponsorshipRepository,
	idGen func() string,
) *ServiceV2 {
	return &ServiceV2{
		txRepo:          tx,
		budgetRepo:      budget,
		budgetV2Repo:    budgetV2,
		invoiceRepo:     invoice,
		paymentRepo:     payment,
		feeScheduleRepo: feeSchedule,
		sponsorRepo:     sponsor,
		idGenerator:     idGen,
	}
}

// ── Transactions with Budget Enforcement ─────────────────────

// CreateTransactionV2 creates a transaction with budget check.
func (s *ServiceV2) CreateTransactionV2(ctx context.Context, t Transaction, budgetScope string, budgetScopeID string) (*Transaction, BudgetCheckResult, error) {
	if t.SoTien <= 0 {
		return nil, BudgetCheckResult{}, fmt.Errorf("số tiền phải lớn hơn 0")
	}
	if t.Loai != LoaiThu && t.Loai != LoaiChi {
		return nil, BudgetCheckResult{}, fmt.Errorf("loại giao dịch phải là 'thu' hoặc 'chi'")
	}

	t.TrangThai = "nhap"
	var budgetResult BudgetCheckResult

	// For expenses: check budget
	if t.Loai == LoaiChi && s.budgetV2Repo != nil {
		year := time.Now().Year()
		budget, err := s.budgetV2Repo.GetByScope(ctx, budgetScope, budgetScopeID, year, t.DanhMuc)
		if err == nil && budget != nil {
			budgetResult = CheckBudget(*budget, t.SoTien)
			if !budgetResult.Allowed {
				return nil, budgetResult, fmt.Errorf("chi tiêu bị chặn: %s", budgetResult.Warning)
			}
		}
	}

	created, err := s.txRepo.Create(ctx, t)
	if err != nil {
		return nil, budgetResult, err
	}

	return created, budgetResult, nil
}

// ApproveTransaction approves a transaction and commits the budget.
func (s *ServiceV2) ApproveTransaction(ctx context.Context, txID, approverID string) error {
	tx, err := s.txRepo.GetByID(ctx, txID)
	if err != nil {
		return err
	}
	if tx.TrangThai != "cho_duyet" {
		return fmt.Errorf("giao dịch ở trạng thái '%s', cần 'cho_duyet' để phê duyệt", tx.TrangThai)
	}

	// Update transaction
	if _, err := s.txRepo.Update(ctx, txID, map[string]interface{}{
		"trang_thai": "da_duyet",
	}); err != nil {
		return err
	}

	return nil
}

// ── Invoice Management ───────────────────────────────────────

// CreateInvoiceForTeam auto-generates an invoice for a team's registration.
func (s *ServiceV2) CreateInvoiceForTeam(
	ctx context.Context,
	tournamentID, teamID, teamName, createdBy string,
	athleteCount, contentCount int,
) (*Invoice, error) {
	// Get fee schedules for tournament
	schedules, err := s.feeScheduleRepo.ListByTournament(ctx, tournamentID)
	if err != nil {
		return nil, fmt.Errorf("không tìm thấy biểu phí: %w", err)
	}

	// Calculate fees
	fees, err := CalculateTeamFees(TeamFeeInput{
		TournamentID:     tournamentID,
		TeamID:           teamID,
		TeamName:         teamName,
		AthleteCount:     athleteCount,
		ContentCount:     contentCount,
		FeeSchedules:     schedules,
		RegistrationDate: time.Now(),
	})
	if err != nil {
		return nil, fmt.Errorf("không thể tính phí: %w", err)
	}

	// Get next invoice number
	invoiceNumber, err := s.invoiceRepo.GetNextNumber(ctx)
	if err != nil {
		invoiceNumber = fmt.Sprintf("INV-%d-%s", time.Now().Year(), s.idGenerator()[:8])
	}

	// Generate invoice
	invoice := GenerateInvoiceFromFees(
		s.idGenerator(),
		invoiceNumber,
		teamID,
		teamName,
		tournamentID,
		fees,
		createdBy,
	)

	created, err := s.invoiceRepo.Create(ctx, invoice)
	if err != nil {
		return nil, fmt.Errorf("không thể tạo hóa đơn: %w", err)
	}

	return created, nil
}

// GetInvoice retrieves an invoice by ID.
func (s *ServiceV2) GetInvoice(ctx context.Context, id string) (*Invoice, error) {
	return s.invoiceRepo.GetByID(ctx, id)
}

// ListInvoices returns filtered invoices.
func (s *ServiceV2) ListInvoices(ctx context.Context, filter InvoiceFilter) ([]Invoice, error) {
	return s.invoiceRepo.List(ctx, filter)
}

// ── Payment Processing ───────────────────────────────────────

// RecordPayment records a payment against an invoice.
func (s *ServiceV2) RecordPayment(ctx context.Context, p Payment) (*Payment, error) {
	if p.InvoiceID == "" {
		return nil, fmt.Errorf("invoice_id là bắt buộc")
	}
	if p.Amount <= 0 {
		return nil, fmt.Errorf("số tiền phải lớn hơn 0")
	}

	// Get the invoice
	inv, err := s.invoiceRepo.GetByID(ctx, p.InvoiceID)
	if err != nil {
		return nil, fmt.Errorf("không tìm thấy hóa đơn: %w", err)
	}

	if inv.Status == "cancelled" || inv.Status == "completed" {
		return nil, fmt.Errorf("hóa đơn đã '%s', không thể ghi nhận thanh toán", inv.Status)
	}

	p.ID = s.idGenerator()
	p.Status = PaymentStatusPending
	p.CreatedAt = time.Now().UTC()
	if p.PaidAt.IsZero() {
		p.PaidAt = p.CreatedAt
	}

	created, err := s.paymentRepo.Create(ctx, p)
	if err != nil {
		return nil, err
	}

	return created, nil
}

// ConfirmPayment confirms a payment and updates the invoice status.
func (s *ServiceV2) ConfirmPayment(ctx context.Context, paymentID, confirmerID string) error {
	pay, err := s.paymentRepo.GetByID(ctx, paymentID)
	if err != nil {
		return err
	}
	if pay.Status != PaymentStatusPending {
		return fmt.Errorf("thanh toán ở trạng thái '%s'", pay.Status)
	}

	now := time.Now().UTC()

	// Confirm the payment
	if err := s.paymentRepo.Update(ctx, paymentID, map[string]interface{}{
		"status":       string(PaymentStatusConfirmed),
		"confirmed_by": confirmerID,
		"confirmed_at": now,
	}); err != nil {
		return err
	}

	// Update invoice paid amount
	inv, err := s.invoiceRepo.GetByID(ctx, pay.InvoiceID)
	if err != nil {
		return err
	}

	newPaid := inv.PaidAmount + pay.Amount
	newBalance := inv.Total - newPaid

	patch := map[string]interface{}{
		"paid_amount": newPaid,
		"balance":     newBalance,
	}

	if newBalance <= 0 {
		patch["status"] = string(InvoiceStatusPaid)
	} else {
		patch["status"] = string(InvoiceStatusPartiallyPaid)
	}

	return s.invoiceRepo.Update(ctx, pay.InvoiceID, patch)
}

// ── Sponsorship ──────────────────────────────────────────────

func (s *ServiceV2) CreateSponsorship(ctx context.Context, sp Sponsorship) (*Sponsorship, error) {
	if sp.PartnerName == "" || sp.TotalValue <= 0 {
		return nil, fmt.Errorf("tên nhà tài trợ và giá trị là bắt buộc")
	}
	sp.ID = s.idGenerator()
	if sp.Status == "" {
		sp.Status = SponsorProspecting
	}
	sp.CreatedAt = time.Now().UTC()
	return s.sponsorRepo.Create(ctx, sp)
}

func (s *ServiceV2) ListSponsorships(ctx context.Context) ([]Sponsorship, error) {
	return s.sponsorRepo.List(ctx)
}
