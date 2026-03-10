package approval

import (
	"context"
	"fmt"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — APPROVAL ENGINE
// Central approval workflow engine for all entities.
// ═══════════════════════════════════════════════════════════════

// ── Status Constants ─────────────────────────────────────────

type RequestStatus string

const (
	StatusPending   RequestStatus = "pending"
	StatusInReview  RequestStatus = "in_review"
	StatusApproved  RequestStatus = "approved"
	StatusRejected  RequestStatus = "rejected"
	StatusReturned  RequestStatus = "returned"
	StatusCancelled RequestStatus = "cancelled"
	StatusExpired   RequestStatus = "expired"
)

type StepDecision string

const (
	DecisionApproved StepDecision = "approved"
	DecisionRejected StepDecision = "rejected"
	DecisionReturned StepDecision = "returned"
)

type ActionType string

const (
	ActionSubmitted  ActionType = "submitted"
	ActionApproved   ActionType = "approved"
	ActionRejected   ActionType = "rejected"
	ActionReturned   ActionType = "returned"
	ActionCancelled  ActionType = "cancelled"
	ActionReassigned ActionType = "reassigned"
	ActionEscalated  ActionType = "escalated"
	ActionExpired    ActionType = "expired"
)

// ── Domain Models ────────────────────────────────────────────

// WorkflowDefinition defines a reusable approval workflow template.
type WorkflowDefinition struct {
	ID           string         `json:"id"`
	WorkflowCode string         `json:"workflow_code"` // e.g. "club_registration", "tournament_hosting"
	EntityType   string         `json:"entity_type"`   // e.g. "club", "tournament", "team"
	DisplayName  string         `json:"display_name"`
	Steps        []StepTemplate `json:"steps"`
	Conditions   map[string]any `json:"conditions,omitempty"` // when to apply this workflow
	IsActive     bool           `json:"is_active"`
}

// StepTemplate defines one step in a workflow definition.
type StepTemplate struct {
	StepNumber   int    `json:"step_number"`
	StepName     string `json:"step_name"`     // e.g. "LĐ Tỉnh phê duyệt"
	ApproverRole string `json:"approver_role"` // e.g. "provincial_admin"
	ScopeRule    string `json:"scope_rule"`    // "same_province", "federation", "any"
	RequiresAll  bool   `json:"requires_all"`  // committee vote
	MinApprovals int    `json:"min_approvals"` // for committee
}

// ApprovalRequest represents a pending approval request.
type ApprovalRequest struct {
	ID            string        `json:"id"`
	EntityType    string        `json:"entity_type"`
	EntityID      string        `json:"entity_id"`
	WorkflowCode  string        `json:"workflow_code"`
	CurrentStep   int           `json:"current_step"`
	TotalSteps    int           `json:"total_steps"`
	Status        RequestStatus `json:"status"`
	RequestedBy   string        `json:"requested_by"`
	RequestedAt   time.Time     `json:"requested_at"`
	ScopeType     string        `json:"scope_type,omitempty"`
	ScopeID       string        `json:"scope_id,omitempty"`
	TournamentID  string        `json:"tournament_id,omitempty"`
	Title         string        `json:"title"`
	Description   string        `json:"description,omitempty"`
	Attachments   []Attachment  `json:"attachments,omitempty"`
	Deadline      *time.Time    `json:"deadline,omitempty"`
	AutoAction    string        `json:"auto_action,omitempty"` // "auto_approve","auto_reject","notify"
	FinalDecision string        `json:"final_decision,omitempty"`
	CompletedAt   *time.Time    `json:"completed_at,omitempty"`
}

// Attachment for supporting documents.
type Attachment struct {
	Name string `json:"name"`
	URL  string `json:"url"`
	Type string `json:"type"` // "pdf","image","document"
}

// ApprovalStep represents one step in an approval request.
type ApprovalStep struct {
	ID            string       `json:"id"`
	RequestID     string       `json:"request_id"`
	StepNumber    int          `json:"step_number"`
	StepName      string       `json:"step_name"`
	ApproverRole  string       `json:"approver_role"`
	ApproverScope string       `json:"approver_scope,omitempty"`
	AssignedTo    string       `json:"assigned_to,omitempty"`
	Decision      StepDecision `json:"decision,omitempty"`
	DecisionBy    string       `json:"decision_by,omitempty"`
	DecisionAt    *time.Time   `json:"decision_at,omitempty"`
	Comment       string       `json:"comment,omitempty"`
	RequiresAll   bool         `json:"requires_all"`
	MinApprovals  int          `json:"min_approvals"`
}

// ApprovalHistory records every action taken on a request.
type ApprovalHistory struct {
	ID        string         `json:"id"`
	RequestID string         `json:"request_id"`
	Action    ActionType     `json:"action"`
	ActionBy  string         `json:"action_by,omitempty"`
	ActionAt  time.Time      `json:"action_at"`
	FromStep  int            `json:"from_step,omitempty"`
	ToStep    int            `json:"to_step,omitempty"`
	Comment   string         `json:"comment,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

// ── Repository ───────────────────────────────────────────────

type WorkflowRepository interface {
	GetByCode(ctx context.Context, code string) (*WorkflowDefinition, error)
	List(ctx context.Context) ([]WorkflowDefinition, error)
	Create(ctx context.Context, wf WorkflowDefinition) error
}

type RequestRepository interface {
	Create(ctx context.Context, req ApprovalRequest) (*ApprovalRequest, error)
	GetByID(ctx context.Context, id string) (*ApprovalRequest, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	ListByStatus(ctx context.Context, status RequestStatus) ([]ApprovalRequest, error)
	ListByApproverRole(ctx context.Context, role string) ([]ApprovalRequest, error)
	ListByRequester(ctx context.Context, userID string) ([]ApprovalRequest, error)
}

type StepRepository interface {
	Create(ctx context.Context, step ApprovalStep) error
	GetCurrentStep(ctx context.Context, requestID string, stepNumber int) (*ApprovalStep, error)
	UpdateDecision(ctx context.Context, stepID string, decision StepDecision, decidedBy string, comment string) error
	ListByRequest(ctx context.Context, requestID string) ([]ApprovalStep, error)
}

type HistoryRepository interface {
	Append(ctx context.Context, entry ApprovalHistory) error
	ListByRequest(ctx context.Context, requestID string) ([]ApprovalHistory, error)
}

// ── Service ──────────────────────────────────────────────────

// Service is the central Approval Engine.
type Service struct {
	workflowRepo WorkflowRepository
	requestRepo  RequestRepository
	stepRepo     StepRepository
	historyRepo  HistoryRepository
	idGenerator  func() string
}

// NewService creates a new Approval Engine service.
func NewService(
	wf WorkflowRepository,
	req RequestRepository,
	step StepRepository,
	hist HistoryRepository,
	idGen func() string,
) *Service {
	return &Service{
		workflowRepo: wf,
		requestRepo:  req,
		stepRepo:     step,
		historyRepo:  hist,
		idGenerator:  idGen,
	}
}

// SubmitRequest creates a new approval request from a workflow definition.
type SubmitInput struct {
	WorkflowCode string       `json:"workflow_code"`
	EntityType   string       `json:"entity_type"`
	EntityID     string       `json:"entity_id"`
	Title        string       `json:"title"`
	Description  string       `json:"description,omitempty"`
	Attachments  []Attachment `json:"attachments,omitempty"`
	ScopeType    string       `json:"scope_type,omitempty"`
	ScopeID      string       `json:"scope_id,omitempty"`
	TournamentID string       `json:"tournament_id,omitempty"`
	RequestedBy  string       `json:"requested_by"`
	Deadline     *time.Time   `json:"deadline,omitempty"`
}

func (s *Service) Submit(ctx context.Context, input SubmitInput) (*ApprovalRequest, error) {
	if input.WorkflowCode == "" || input.EntityID == "" || input.Title == "" || input.RequestedBy == "" {
		return nil, fmt.Errorf("workflow_code, entity_id, title, và requested_by là bắt buộc")
	}

	// Lookup workflow definition
	wf, err := s.workflowRepo.GetByCode(ctx, input.WorkflowCode)
	if err != nil {
		return nil, fmt.Errorf("không tìm thấy workflow '%s': %w", input.WorkflowCode, err)
	}
	if !wf.IsActive {
		return nil, fmt.Errorf("workflow '%s' đã bị vô hiệu hóa", input.WorkflowCode)
	}
	if len(wf.Steps) == 0 {
		return nil, fmt.Errorf("workflow '%s' không có bước phê duyệt nào", input.WorkflowCode)
	}

	now := time.Now().UTC()
	requestID := s.idGenerator()

	req := ApprovalRequest{
		ID:           requestID,
		EntityType:   input.EntityType,
		EntityID:     input.EntityID,
		WorkflowCode: input.WorkflowCode,
		CurrentStep:  1,
		TotalSteps:   len(wf.Steps),
		Status:       StatusPending,
		RequestedBy:  input.RequestedBy,
		RequestedAt:  now,
		ScopeType:    input.ScopeType,
		ScopeID:      input.ScopeID,
		TournamentID: input.TournamentID,
		Title:        input.Title,
		Description:  input.Description,
		Attachments:  input.Attachments,
		Deadline:     input.Deadline,
	}

	created, err := s.requestRepo.Create(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("không thể tạo yêu cầu: %w", err)
	}

	// Create all steps from workflow definition
	for _, tmpl := range wf.Steps {
		step := ApprovalStep{
			ID:            s.idGenerator(),
			RequestID:     requestID,
			StepNumber:    tmpl.StepNumber,
			StepName:      tmpl.StepName,
			ApproverRole:  tmpl.ApproverRole,
			ApproverScope: tmpl.ScopeRule,
			RequiresAll:   tmpl.RequiresAll,
			MinApprovals:  tmpl.MinApprovals,
		}
		if err := s.stepRepo.Create(ctx, step); err != nil {
			return nil, fmt.Errorf("không thể tạo bước %d: %w", tmpl.StepNumber, err)
		}
	}

	// Record history
	_ = s.historyRepo.Append(ctx, ApprovalHistory{
		ID:        s.idGenerator(),
		RequestID: requestID,
		Action:    ActionSubmitted,
		ActionBy:  input.RequestedBy,
		ActionAt:  now,
		ToStep:    1,
		Comment:   "Yêu cầu phê duyệt được tạo",
	})

	return created, nil
}

// Approve approves the current step and advances the request.
func (s *Service) Approve(ctx context.Context, requestID, approverID, comment string) error {
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil {
		return fmt.Errorf("không tìm thấy yêu cầu: %w", err)
	}
	if req.Status != StatusPending && req.Status != StatusInReview {
		return fmt.Errorf("yêu cầu ở trạng thái '%s', không thể phê duyệt", req.Status)
	}

	// Get current step
	step, err := s.stepRepo.GetCurrentStep(ctx, requestID, req.CurrentStep)
	if err != nil {
		return fmt.Errorf("không tìm thấy bước hiện tại: %w", err)
	}

	now := time.Now().UTC()

	// Record step decision
	if err := s.stepRepo.UpdateDecision(ctx, step.ID, DecisionApproved, approverID, comment); err != nil {
		return fmt.Errorf("không thể cập nhật quyết định: %w", err)
	}

	// Check if this was the last step
	if req.CurrentStep >= req.TotalSteps {
		// Final approval — mark request as approved
		if err := s.requestRepo.Update(ctx, requestID, map[string]interface{}{
			"status":         string(StatusApproved),
			"final_decision": "approved",
			"completed_at":   now,
		}); err != nil {
			return err
		}
	} else {
		// Advance to next step
		if err := s.requestRepo.Update(ctx, requestID, map[string]interface{}{
			"current_step": req.CurrentStep + 1,
			"status":       string(StatusPending),
		}); err != nil {
			return err
		}
	}

	// Record history
	_ = s.historyRepo.Append(ctx, ApprovalHistory{
		ID:        s.idGenerator(),
		RequestID: requestID,
		Action:    ActionApproved,
		ActionBy:  approverID,
		ActionAt:  now,
		FromStep:  req.CurrentStep,
		ToStep:    req.CurrentStep + 1,
		Comment:   comment,
	})

	return nil
}

// Reject rejects the request at the current step.
func (s *Service) Reject(ctx context.Context, requestID, approverID, reason string) error {
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil {
		return fmt.Errorf("không tìm thấy yêu cầu: %w", err)
	}
	if req.Status != StatusPending && req.Status != StatusInReview {
		return fmt.Errorf("yêu cầu ở trạng thái '%s', không thể từ chối", req.Status)
	}
	if reason == "" {
		return fmt.Errorf("lý do từ chối là bắt buộc")
	}

	step, err := s.stepRepo.GetCurrentStep(ctx, requestID, req.CurrentStep)
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	_ = s.stepRepo.UpdateDecision(ctx, step.ID, DecisionRejected, approverID, reason)

	if err := s.requestRepo.Update(ctx, requestID, map[string]interface{}{
		"status":         string(StatusRejected),
		"final_decision": "rejected",
		"completed_at":   now,
	}); err != nil {
		return err
	}

	_ = s.historyRepo.Append(ctx, ApprovalHistory{
		ID:        s.idGenerator(),
		RequestID: requestID,
		Action:    ActionRejected,
		ActionBy:  approverID,
		ActionAt:  now,
		FromStep:  req.CurrentStep,
		Comment:   reason,
	})

	return nil
}

// Return sends the request back to the requester for revision.
func (s *Service) Return(ctx context.Context, requestID, approverID, reason string) error {
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil {
		return fmt.Errorf("không tìm thấy yêu cầu: %w", err)
	}
	if req.Status != StatusPending && req.Status != StatusInReview {
		return fmt.Errorf("yêu cầu ở trạng thái '%s', không thể trả lại", req.Status)
	}
	if reason == "" {
		return fmt.Errorf("lý do trả lại là bắt buộc")
	}

	step, err := s.stepRepo.GetCurrentStep(ctx, requestID, req.CurrentStep)
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	_ = s.stepRepo.UpdateDecision(ctx, step.ID, DecisionReturned, approverID, reason)

	if err := s.requestRepo.Update(ctx, requestID, map[string]interface{}{
		"status":       string(StatusReturned),
		"current_step": 1, // reset to step 1 for re-submission
	}); err != nil {
		return err
	}

	_ = s.historyRepo.Append(ctx, ApprovalHistory{
		ID:        s.idGenerator(),
		RequestID: requestID,
		Action:    ActionReturned,
		ActionBy:  approverID,
		ActionAt:  now,
		FromStep:  req.CurrentStep,
		ToStep:    1,
		Comment:   reason,
	})

	return nil
}

// Cancel cancels the request (only by requester).
func (s *Service) Cancel(ctx context.Context, requestID, userID string) error {
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil {
		return fmt.Errorf("không tìm thấy yêu cầu: %w", err)
	}
	if req.RequestedBy != userID {
		return fmt.Errorf("chỉ người tạo mới có thể hủy yêu cầu")
	}
	if req.Status == StatusApproved || req.Status == StatusRejected {
		return fmt.Errorf("không thể hủy yêu cầu đã hoàn tất")
	}

	now := time.Now().UTC()

	if err := s.requestRepo.Update(ctx, requestID, map[string]interface{}{
		"status":       string(StatusCancelled),
		"completed_at": now,
	}); err != nil {
		return err
	}

	_ = s.historyRepo.Append(ctx, ApprovalHistory{
		ID:        s.idGenerator(),
		RequestID: requestID,
		Action:    ActionCancelled,
		ActionBy:  userID,
		ActionAt:  now,
		Comment:   "Người tạo tự hủy yêu cầu",
	})

	return nil
}

// ── Query Methods ────────────────────────────────────────────

// GetRequest returns a request with its steps and history.
func (s *Service) GetRequest(ctx context.Context, id string) (*ApprovalRequest, error) {
	return s.requestRepo.GetByID(ctx, id)
}

// ListPendingForRole returns requests waiting for a specific role.
func (s *Service) ListPendingForRole(ctx context.Context, role string) ([]ApprovalRequest, error) {
	return s.requestRepo.ListByApproverRole(ctx, role)
}

// ListMyRequests returns requests created by a user.
func (s *Service) ListMyRequests(ctx context.Context, userID string) ([]ApprovalRequest, error) {
	return s.requestRepo.ListByRequester(ctx, userID)
}

// GetSteps returns all steps for a request.
func (s *Service) GetSteps(ctx context.Context, requestID string) ([]ApprovalStep, error) {
	return s.stepRepo.ListByRequest(ctx, requestID)
}

// GetHistory returns the audit trail for a request.
func (s *Service) GetHistory(ctx context.Context, requestID string) ([]ApprovalHistory, error) {
	return s.historyRepo.ListByRequest(ctx, requestID)
}
