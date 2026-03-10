package adapter

import (
	"context"
	"fmt"

	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/bracket"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/store"
)

// ═══════════════════════════════════════════════════════════════
// ADAPTER REPOSITORIES — Wave 3/4 Domain Packages
// Approval, Finance V2, Bracket
// ═══════════════════════════════════════════════════════════════

// ── Approval Workflow Repository ─────────────────────────────

type approvalWorkflowRepo struct {
	*StoreAdapter[approval.WorkflowDefinition]
}

func NewApprovalWorkflowRepository(ds store.DataStore) approval.WorkflowRepository {
	return &approvalWorkflowRepo{
		StoreAdapter: NewStoreAdapter[approval.WorkflowDefinition](ds, "approval_workflows"),
	}
}

func (r *approvalWorkflowRepo) GetByCode(ctx context.Context, code string) (*approval.WorkflowDefinition, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for _, w := range all {
		if w.WorkflowCode == code {
			return &w, nil
		}
	}
	return nil, fmt.Errorf("workflow '%s' không tìm thấy", code)
}

func (r *approvalWorkflowRepo) List(ctx context.Context) ([]approval.WorkflowDefinition, error) {
	return r.StoreAdapter.List()
}

func (r *approvalWorkflowRepo) Create(ctx context.Context, wf approval.WorkflowDefinition) error {
	_, err := r.StoreAdapter.Create(wf)
	return err
}

// ── Approval Request Repository ──────────────────────────────

type approvalRequestRepo struct {
	*StoreAdapter[approval.ApprovalRequest]
}

func NewApprovalRequestRepository(ds store.DataStore) approval.RequestRepository {
	return &approvalRequestRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalRequest](ds, "approval_requests"),
	}
}

func (r *approvalRequestRepo) Create(ctx context.Context, req approval.ApprovalRequest) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.Create(req)
}
func (r *approvalRequestRepo) GetByID(ctx context.Context, id string) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *approvalRequestRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *approvalRequestRepo) ListByStatus(ctx context.Context, status approval.RequestStatus) ([]approval.ApprovalRequest, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalRequest
	for _, req := range all {
		if req.Status == status {
			out = append(out, req)
		}
	}
	return out, nil
}
func (r *approvalRequestRepo) ListByApproverRole(ctx context.Context, role string) ([]approval.ApprovalRequest, error) {
	// Placeholder: returns pending requests (step matching requires join with steps)
	return r.ListByStatus(ctx, approval.StatusPending)
}
func (r *approvalRequestRepo) ListByRequester(ctx context.Context, userID string) ([]approval.ApprovalRequest, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalRequest
	for _, req := range all {
		if req.RequestedBy == userID {
			out = append(out, req)
		}
	}
	return out, nil
}

// ── Approval Step Repository ─────────────────────────────────

type approvalStepRepo struct {
	*StoreAdapter[approval.ApprovalStep]
}

func NewApprovalStepRepository(ds store.DataStore) approval.StepRepository {
	return &approvalStepRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalStep](ds, "approval_steps"),
	}
}

func (r *approvalStepRepo) Create(ctx context.Context, step approval.ApprovalStep) error {
	_, err := r.StoreAdapter.Create(step)
	return err
}
func (r *approvalStepRepo) GetCurrentStep(ctx context.Context, requestID string, stepNumber int) (*approval.ApprovalStep, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for _, s := range all {
		if s.RequestID == requestID && s.StepNumber == stepNumber {
			return &s, nil
		}
	}
	return nil, fmt.Errorf("step %d for request %s not found", stepNumber, requestID)
}
func (r *approvalStepRepo) UpdateDecision(ctx context.Context, stepID string, decision approval.StepDecision, decidedBy string, comment string) error {
	_, err := r.StoreAdapter.Update(stepID, map[string]interface{}{
		"decision":    string(decision),
		"decision_by": decidedBy,
		"comment":     comment,
	})
	return err
}
func (r *approvalStepRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalStep, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalStep
	for _, s := range all {
		if s.RequestID == requestID {
			out = append(out, s)
		}
	}
	return out, nil
}

// ── Approval History Repository ──────────────────────────────

type approvalHistoryRepo struct {
	*StoreAdapter[approval.ApprovalHistory]
}

func NewApprovalHistoryRepository(ds store.DataStore) approval.HistoryRepository {
	return &approvalHistoryRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalHistory](ds, "approval_history"),
	}
}

func (r *approvalHistoryRepo) Append(ctx context.Context, entry approval.ApprovalHistory) error {
	_, err := r.StoreAdapter.Create(entry)
	return err
}
func (r *approvalHistoryRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalHistory, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalHistory
	for _, h := range all {
		if h.RequestID == requestID {
			out = append(out, h)
		}
	}
	return out, nil
}

// ── Finance V2 — Invoice Repository ─────────────────────────

type invoiceRepo struct {
	*StoreAdapter[finance.Invoice]
}

func NewInvoiceRepository(ds store.DataStore) *invoiceRepo {
	return &invoiceRepo{
		StoreAdapter: NewStoreAdapter[finance.Invoice](ds, "invoices"),
	}
}

func (r *invoiceRepo) Create(ctx context.Context, inv finance.Invoice) (*finance.Invoice, error) {
	return r.StoreAdapter.Create(inv)
}
func (r *invoiceRepo) GetByID(ctx context.Context, id string) (*finance.Invoice, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *invoiceRepo) List(ctx context.Context) ([]finance.Invoice, error) {
	return r.StoreAdapter.List()
}
func (r *invoiceRepo) UpdateStatus(ctx context.Context, id string, status string) error {
	_, err := r.StoreAdapter.Update(id, map[string]interface{}{"status": status})
	return err
}

// ── Finance V2 — Fee Schedule Repository ────────────────────

type feeScheduleRepo struct {
	*StoreAdapter[finance.FeeSchedule]
}

func NewFeeScheduleRepository(ds store.DataStore) *feeScheduleRepo {
	return &feeScheduleRepo{
		StoreAdapter: NewStoreAdapter[finance.FeeSchedule](ds, "fee_schedules"),
	}
}

func (r *feeScheduleRepo) Create(ctx context.Context, fs finance.FeeSchedule) (*finance.FeeSchedule, error) {
	return r.StoreAdapter.Create(fs)
}
func (r *feeScheduleRepo) GetByID(ctx context.Context, id string) (*finance.FeeSchedule, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *feeScheduleRepo) List(ctx context.Context) ([]finance.FeeSchedule, error) {
	return r.StoreAdapter.List()
}

// ── Bracket Repository ───────────────────────────────────────

type bracketRepo struct {
	*StoreAdapter[bracket.Bracket]
}

func NewBracketRepository(ds store.DataStore) *bracketRepo {
	return &bracketRepo{
		StoreAdapter: NewStoreAdapter[bracket.Bracket](ds, "brackets"),
	}
}

func (r *bracketRepo) Create(ctx context.Context, b bracket.Bracket) (*bracket.Bracket, error) {
	return r.StoreAdapter.Create(b)
}
func (r *bracketRepo) GetByID(ctx context.Context, id string) (*bracket.Bracket, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *bracketRepo) GetByTournament(ctx context.Context, tournamentID, categoryID string) (*bracket.Bracket, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for _, b := range all {
		if b.TournamentID == tournamentID && b.CategoryID == categoryID {
			return &b, nil
		}
	}
	return nil, fmt.Errorf("bracket not found for tournament %s, category %s", tournamentID, categoryID)
}
func (r *bracketRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*bracket.Bracket, error) {
	return r.StoreAdapter.Update(id, patch)
}
