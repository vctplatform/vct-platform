package approval

import (
	"context"
	"fmt"
	"sync/atomic"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — APPROVAL ENGINE TESTS
// ═══════════════════════════════════════════════════════════════

// ── Mock Repositories ────────────────────────────────────────

type mockWorkflowRepo struct {
	data map[string]WorkflowDefinition
}

func (m *mockWorkflowRepo) GetByCode(_ context.Context, code string) (*WorkflowDefinition, error) {
	wf, ok := m.data[code]
	if !ok {
		return nil, fmt.Errorf("workflow '%s' not found", code)
	}
	return &wf, nil
}
func (m *mockWorkflowRepo) List(_ context.Context) ([]WorkflowDefinition, error) {
	var out []WorkflowDefinition
	for _, w := range m.data {
		out = append(out, w)
	}
	return out, nil
}
func (m *mockWorkflowRepo) Create(_ context.Context, wf WorkflowDefinition) error {
	m.data[wf.WorkflowCode] = wf
	return nil
}

type mockRequestRepo struct {
	data map[string]*ApprovalRequest
}

func (m *mockRequestRepo) Create(_ context.Context, req ApprovalRequest) (*ApprovalRequest, error) {
	m.data[req.ID] = &req
	return &req, nil
}
func (m *mockRequestRepo) GetByID(_ context.Context, id string) (*ApprovalRequest, error) {
	r, ok := m.data[id]
	if !ok {
		return nil, fmt.Errorf("request %s not found", id)
	}
	return r, nil
}
func (m *mockRequestRepo) Update(_ context.Context, id string, patch map[string]interface{}) error {
	r, ok := m.data[id]
	if !ok {
		return fmt.Errorf("not found")
	}
	if v, ok := patch["status"]; ok {
		r.Status = RequestStatus(v.(string))
	}
	if v, ok := patch["current_step"]; ok {
		r.CurrentStep = v.(int)
	}
	if v, ok := patch["final_decision"]; ok {
		r.FinalDecision = v.(string)
	}
	return nil
}
func (m *mockRequestRepo) ListByStatus(_ context.Context, status RequestStatus) ([]ApprovalRequest, error) {
	var out []ApprovalRequest
	for _, r := range m.data {
		if r.Status == status {
			out = append(out, *r)
		}
	}
	return out, nil
}
func (m *mockRequestRepo) ListByApproverRole(_ context.Context, _ string) ([]ApprovalRequest, error) {
	return nil, nil
}
func (m *mockRequestRepo) ListByRequester(_ context.Context, userID string) ([]ApprovalRequest, error) {
	var out []ApprovalRequest
	for _, r := range m.data {
		if r.RequestedBy == userID {
			out = append(out, *r)
		}
	}
	return out, nil
}

type mockStepRepo struct {
	steps map[string][]ApprovalStep
}

func (m *mockStepRepo) Create(_ context.Context, step ApprovalStep) error {
	m.steps[step.RequestID] = append(m.steps[step.RequestID], step)
	return nil
}
func (m *mockStepRepo) GetCurrentStep(_ context.Context, requestID string, stepNumber int) (*ApprovalStep, error) {
	for i, s := range m.steps[requestID] {
		if s.StepNumber == stepNumber {
			return &m.steps[requestID][i], nil
		}
	}
	return nil, fmt.Errorf("step %d not found", stepNumber)
}
func (m *mockStepRepo) UpdateDecision(_ context.Context, stepID string, decision StepDecision, decidedBy string, comment string) error {
	for rid := range m.steps {
		for i, s := range m.steps[rid] {
			if s.ID == stepID {
				m.steps[rid][i].Decision = decision
				m.steps[rid][i].DecisionBy = decidedBy
				m.steps[rid][i].Comment = comment
				return nil
			}
		}
	}
	return nil
}
func (m *mockStepRepo) ListByRequest(_ context.Context, requestID string) ([]ApprovalStep, error) {
	return m.steps[requestID], nil
}

type mockHistoryRepo struct {
	entries []ApprovalHistory
}

func (m *mockHistoryRepo) Append(_ context.Context, h ApprovalHistory) error {
	m.entries = append(m.entries, h)
	return nil
}
func (m *mockHistoryRepo) ListByRequest(_ context.Context, requestID string) ([]ApprovalHistory, error) {
	var out []ApprovalHistory
	for _, e := range m.entries {
		if e.RequestID == requestID {
			out = append(out, e)
		}
	}
	return out, nil
}

// ── Test Helpers ─────────────────────────────────────────────

var testIDSeq atomic.Int64

func testIDGen() string {
	return fmt.Sprintf("test-%d", testIDSeq.Add(1))
}

func newTestService() *Service {
	wfRepo := &mockWorkflowRepo{data: map[string]WorkflowDefinition{
		"team_registration": {
			ID:           "wf-team",
			WorkflowCode: "team_registration",
			EntityType:   "team",
			DisplayName:  "Phê duyệt đội",
			IsActive:     true,
			Steps: []StepTemplate{
				{StepNumber: 1, StepName: "BTC duyệt", ApproverRole: "btc", ScopeRule: "any"},
			},
		},
		"club_registration": {
			ID:           "wf-club",
			WorkflowCode: "club_registration",
			EntityType:   "club",
			DisplayName:  "Đăng ký mở CLB",
			IsActive:     true,
			Steps: []StepTemplate{
				{StepNumber: 1, StepName: "LĐ Tỉnh duyệt", ApproverRole: "provincial_admin", ScopeRule: "same_province"},
				{StepNumber: 2, StepName: "LĐ Trung ương duyệt", ApproverRole: "federation_president", ScopeRule: "federation"},
			},
		},
		"disabled_workflow": {
			ID:           "wf-disabled",
			WorkflowCode: "disabled_workflow",
			EntityType:   "test",
			DisplayName:  "Disabled",
			IsActive:     false,
			Steps: []StepTemplate{
				{StepNumber: 1, StepName: "Step 1", ApproverRole: "admin"},
			},
		},
	}}
	reqRepo := &mockRequestRepo{data: make(map[string]*ApprovalRequest)}
	stepRepo := &mockStepRepo{steps: make(map[string][]ApprovalStep)}
	histRepo := &mockHistoryRepo{}

	return NewService(wfRepo, reqRepo, stepRepo, histRepo, testIDGen)
}

// ── Tests ────────────────────────────────────────────────────

func TestSubmitAndApprove(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-001",
		Title:        "Đăng ký đội CLB Bình Dương",
		RequestedBy:  "coach-001",
	})
	if err != nil {
		t.Fatalf("Submit failed: %v", err)
	}
	if req.Status != StatusPending {
		t.Errorf("expected pending, got %s", req.Status)
	}
	if req.TotalSteps != 1 {
		t.Errorf("expected 1 step, got %d", req.TotalSteps)
	}

	// Approve
	if err := svc.Approve(ctx, req.ID, "btc-admin", "Đồng ý"); err != nil {
		t.Fatalf("Approve failed: %v", err)
	}

	// Verify final status
	updated, _ := svc.GetRequest(ctx, req.ID)
	if updated.Status != StatusApproved {
		t.Errorf("expected approved, got %s", updated.Status)
	}
	if updated.FinalDecision != "approved" {
		t.Errorf("expected final_decision approved, got %s", updated.FinalDecision)
	}
}

func TestSubmitAndReject(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-002",
		Title:        "Đăng ký đội test",
		RequestedBy:  "coach-002",
	})
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}

	if err := svc.Reject(ctx, req.ID, "btc-admin", "Thiếu giấy tờ"); err != nil {
		t.Fatalf("Reject: %v", err)
	}

	updated, _ := svc.GetRequest(ctx, req.ID)
	if updated.Status != StatusRejected {
		t.Errorf("expected rejected, got %s", updated.Status)
	}
}

func TestSubmitAndCancel(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-003",
		Title:        "Đăng ký đội hủy",
		RequestedBy:  "coach-003",
	})
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}

	if err := svc.Cancel(ctx, req.ID, "coach-003"); err != nil {
		t.Fatalf("Cancel: %v", err)
	}

	updated, _ := svc.GetRequest(ctx, req.ID)
	if updated.Status != StatusCancelled {
		t.Errorf("expected cancelled, got %s", updated.Status)
	}
}

func TestCancelByNonOwner(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, _ := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-004",
		Title:        "Test cancel by non-owner",
		RequestedBy:  "coach-004",
	})

	err := svc.Cancel(ctx, req.ID, "someone-else")
	if err == nil {
		t.Fatal("expected error for non-owner cancel")
	}
}

func TestMultiStepApproval(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "club_registration",
		EntityType:   "club",
		EntityID:     "CLB-001",
		Title:        "Mở CLB Võ cổ truyền Bình Dương",
		RequestedBy:  "coach-005",
	})
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}
	if req.TotalSteps != 2 {
		t.Errorf("expected 2 steps, got %d", req.TotalSteps)
	}

	// Step 1: Provincial admin approves
	if err := svc.Approve(ctx, req.ID, "provincial-admin", "OK tỉnh"); err != nil {
		t.Fatalf("Step 1 Approve: %v", err)
	}

	mid, _ := svc.GetRequest(ctx, req.ID)
	if mid.CurrentStep != 2 {
		t.Errorf("expected step 2, got %d", mid.CurrentStep)
	}
	if mid.Status != StatusPending {
		t.Errorf("expected pending (step 2), got %s", mid.Status)
	}

	// Step 2: Federation president approves
	if err := svc.Approve(ctx, req.ID, "fed-president", "OK trung ương"); err != nil {
		t.Fatalf("Step 2 Approve: %v", err)
	}

	final, _ := svc.GetRequest(ctx, req.ID)
	if final.Status != StatusApproved {
		t.Errorf("expected approved, got %s", final.Status)
	}
}

func TestReturnForRevision(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, _ := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-005",
		Title:        "Test return",
		RequestedBy:  "coach-006",
	})

	if err := svc.Return(ctx, req.ID, "btc-admin", "Cần bổ sung hồ sơ"); err != nil {
		t.Fatalf("Return: %v", err)
	}

	updated, _ := svc.GetRequest(ctx, req.ID)
	if updated.Status != StatusReturned {
		t.Errorf("expected returned, got %s", updated.Status)
	}
}

func TestDisabledWorkflow(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "disabled_workflow",
		EntityType:   "test",
		EntityID:     "X-001",
		Title:        "Test disabled",
		RequestedBy:  "someone",
	})
	if err == nil {
		t.Fatal("expected error for disabled workflow")
	}
}

func TestMissingWorkflow(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "nonexistent",
		EntityType:   "unknown",
		EntityID:     "X-002",
		Title:        "Test missing",
		RequestedBy:  "someone",
	})
	if err == nil {
		t.Fatal("expected error for missing workflow")
	}
}

func TestHistoryTracking(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	req, _ := svc.Submit(ctx, SubmitInput{
		WorkflowCode: "team_registration",
		EntityType:   "team",
		EntityID:     "TEAM-006",
		Title:        "Test history",
		RequestedBy:  "coach-007",
	})

	_ = svc.Approve(ctx, req.ID, "btc-admin", "OK")

	history, err := svc.GetHistory(ctx, req.ID)
	if err != nil {
		t.Fatalf("GetHistory: %v", err)
	}
	if len(history) != 2 {
		t.Errorf("expected 2 history entries (submit + approve), got %d", len(history))
	}
	if history[0].Action != ActionSubmitted {
		t.Errorf("entry 0: expected submitted, got %s", history[0].Action)
	}
	if history[1].Action != ActionApproved {
		t.Errorf("entry 1: expected approved, got %s", history[1].Action)
	}
}
