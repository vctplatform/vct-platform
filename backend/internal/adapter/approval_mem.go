package adapter

import (
	"context"
	"fmt"
	"sync"
	"time"

	"vct-platform/backend/internal/domain/approval"
)

// ════════════════════════════════════════════════════════════════
// IN-MEMORY APPROVAL REPOSITORIES (for testing & development)
// ════════════════════════════════════════════════════════════════

// ── Workflow Definition Repository ───────────────────────────

type MemWorkflowRepo struct {
	mu   sync.RWMutex
	data map[string]approval.WorkflowDefinition
}

func NewMemWorkflowRepo() *MemWorkflowRepo {
	return &MemWorkflowRepo{data: make(map[string]approval.WorkflowDefinition)}
}

func (r *MemWorkflowRepo) GetByCode(_ context.Context, code string) (*approval.WorkflowDefinition, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	wf, ok := r.data[code]
	if !ok {
		return nil, fmt.Errorf("workflow %q not found", code)
	}
	return &wf, nil
}

func (r *MemWorkflowRepo) List(_ context.Context) ([]approval.WorkflowDefinition, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]approval.WorkflowDefinition, 0, len(r.data))
	for _, v := range r.data {
		out = append(out, v)
	}
	return out, nil
}

func (r *MemWorkflowRepo) Create(_ context.Context, wf approval.WorkflowDefinition) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data[wf.WorkflowCode] = wf
	return nil
}

// ── Approval Request Repository ──────────────────────────────

type MemRequestRepo struct {
	mu   sync.RWMutex
	data map[string]approval.ApprovalRequest
	seq  int
}

func NewMemRequestRepo() *MemRequestRepo {
	return &MemRequestRepo{data: make(map[string]approval.ApprovalRequest)}
}

func (r *MemRequestRepo) Create(_ context.Context, req approval.ApprovalRequest) (*approval.ApprovalRequest, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data[req.ID] = req
	return &req, nil
}

func (r *MemRequestRepo) GetByID(_ context.Context, id string) (*approval.ApprovalRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	req, ok := r.data[id]
	if !ok {
		return nil, fmt.Errorf("request %q not found", id)
	}
	return &req, nil
}

func (r *MemRequestRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	req, ok := r.data[id]
	if !ok {
		return fmt.Errorf("request %q not found", id)
	}
	if s, ok := patch["status"]; ok {
		req.Status = approval.RequestStatus(s.(string))
	}
	if step, ok := patch["current_step"]; ok {
		req.CurrentStep = step.(int)
	}
	if fd, ok := patch["final_decision"]; ok {
		req.FinalDecision = fd.(string)
	}
	if ca, ok := patch["completed_at"]; ok {
		t := ca.(time.Time)
		req.CompletedAt = &t
	}
	r.data[id] = req
	return nil
}

func (r *MemRequestRepo) ListByStatus(_ context.Context, status approval.RequestStatus) ([]approval.ApprovalRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []approval.ApprovalRequest
	for _, req := range r.data {
		if req.Status == status {
			out = append(out, req)
		}
	}
	return out, nil
}

func (r *MemRequestRepo) ListByApproverRole(_ context.Context, role string) ([]approval.ApprovalRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	// In-memory: return pending requests (simplified)
	var out []approval.ApprovalRequest
	for _, req := range r.data {
		if req.Status == approval.StatusPending || req.Status == approval.StatusInReview {
			out = append(out, req)
		}
	}
	return out, nil
}

func (r *MemRequestRepo) ListByRequester(_ context.Context, userID string) ([]approval.ApprovalRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []approval.ApprovalRequest
	for _, req := range r.data {
		if req.RequestedBy == userID {
			out = append(out, req)
		}
	}
	return out, nil
}

// ── Approval Step Repository ─────────────────────────────────

type MemStepRepo struct {
	mu   sync.RWMutex
	data []approval.ApprovalStep
}

func NewMemStepRepo() *MemStepRepo {
	return &MemStepRepo{data: make([]approval.ApprovalStep, 0)}
}

func (r *MemStepRepo) Create(_ context.Context, step approval.ApprovalStep) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, step)
	return nil
}

func (r *MemStepRepo) GetCurrentStep(_ context.Context, requestID string, stepNumber int) (*approval.ApprovalStep, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for i := range r.data {
		if r.data[i].RequestID == requestID && r.data[i].StepNumber == stepNumber {
			return &r.data[i], nil
		}
	}
	return nil, fmt.Errorf("step %d not found for request %q", stepNumber, requestID)
}

func (r *MemStepRepo) UpdateDecision(_ context.Context, stepID string, decision approval.StepDecision, decidedBy string, comment string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.data {
		if r.data[i].ID == stepID {
			r.data[i].Decision = decision
			r.data[i].DecisionBy = decidedBy
			now := time.Now()
			r.data[i].DecisionAt = &now
			r.data[i].Comment = comment
			return nil
		}
	}
	return fmt.Errorf("step %q not found", stepID)
}

func (r *MemStepRepo) ListByRequest(_ context.Context, requestID string) ([]approval.ApprovalStep, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []approval.ApprovalStep
	for _, s := range r.data {
		if s.RequestID == requestID {
			out = append(out, s)
		}
	}
	return out, nil
}

// ── Approval History Repository ──────────────────────────────

type MemHistoryRepo struct {
	mu   sync.RWMutex
	data []approval.ApprovalHistory
}

func NewMemHistoryRepo() *MemHistoryRepo {
	return &MemHistoryRepo{data: make([]approval.ApprovalHistory, 0)}
}

func (r *MemHistoryRepo) Append(_ context.Context, entry approval.ApprovalHistory) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data = append(r.data, entry)
	return nil
}

func (r *MemHistoryRepo) ListByRequest(_ context.Context, requestID string) ([]approval.ApprovalHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []approval.ApprovalHistory
	for _, h := range r.data {
		if h.RequestID == requestID {
			out = append(out, h)
		}
	}
	return out, nil
}
