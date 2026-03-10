package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/events"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — APPROVAL ENGINE HTTP HANDLERS
// All wired to approvalSvc with real service calls.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleApprovalRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/approvals/my-pending", s.withAuth(s.handleApprovalMyPending))
	mux.HandleFunc("/api/v1/approvals/my-requests", s.withAuth(s.handleApprovalMyRequests))
	mux.HandleFunc("/api/v1/approvals/workflows", s.withAuth(s.handleWorkflowDefinitions))
	mux.HandleFunc("/api/v1/approvals/", s.withAuth(s.handleApprovalCRUD))
}

// ── Submit / Get / List ──────────────────────────────────────

func (s *Server) handleApprovalCRUD(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/approvals/")
	parts := strings.Split(path, "/")

	// POST /api/v1/approvals/ → submit new request
	if len(parts) == 1 && parts[0] == "" && r.Method == http.MethodPost {
		s.handleApprovalSubmit(w, r, p)
		return
	}

	if len(parts) < 1 || parts[0] == "" {
		notFound(w)
		return
	}
	requestID := parts[0]

	// GET /api/v1/approvals/:id
	if len(parts) == 1 && r.Method == http.MethodGet {
		s.handleApprovalGet(w, r, requestID)
		return
	}

	// GET /api/v1/approvals/:id/steps
	if len(parts) == 2 && parts[1] == "steps" && r.Method == http.MethodGet {
		s.handleApprovalSteps(w, r, requestID)
		return
	}

	// GET /api/v1/approvals/:id/history
	if len(parts) == 2 && parts[1] == "history" && r.Method == http.MethodGet {
		s.handleApprovalHistory(w, r, requestID)
		return
	}

	// POST /api/v1/approvals/:id/approve|reject|return|cancel
	if len(parts) == 2 && r.Method == http.MethodPost {
		action := parts[1]
		s.handleApprovalAction(w, r, p, requestID, action)
		return
	}

	notFound(w)
}

func (s *Server) handleApprovalSubmit(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	var input approval.SubmitInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		badRequest(w, "invalid request body")
		return
	}
	if input.WorkflowCode == "" || input.Title == "" {
		badRequest(w, "workflow_code và title là bắt buộc")
		return
	}
	input.RequestedBy = p.User.ID

	created, err := s.approvalSvc.Submit(r.Context(), input)
	if err != nil {
		badRequest(w, err.Error())
		return
	}

	// Emit event
	s.eventBus.Publish(events.NewEvent(
		events.EventApprovalSubmitted, "approval", created.ID, p.User.ID,
	))

	success(w, http.StatusCreated, created)
}

func (s *Server) handleApprovalGet(w http.ResponseWriter, r *http.Request, requestID string) {
	req, err := s.approvalSvc.GetRequest(r.Context(), requestID)
	if err != nil {
		notFoundError(w, "approval request not found")
		return
	}
	success(w, http.StatusOK, req)
}

func (s *Server) handleApprovalSteps(w http.ResponseWriter, r *http.Request, requestID string) {
	steps, err := s.approvalSvc.GetSteps(r.Context(), requestID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"request_id": requestID, "steps": steps})
}

func (s *Server) handleApprovalHistory(w http.ResponseWriter, r *http.Request, requestID string) {
	history, err := s.approvalSvc.GetHistory(r.Context(), requestID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"request_id": requestID, "history": history})
}

func (s *Server) handleApprovalAction(w http.ResponseWriter, r *http.Request, p auth.Principal, requestID, action string) {
	var body struct {
		Comment string `json:"comment"`
		Reason  string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	var err error
	switch action {
	case "approve":
		err = s.approvalSvc.Approve(r.Context(), requestID, p.User.ID, body.Comment)
	case "reject":
		err = s.approvalSvc.Reject(r.Context(), requestID, p.User.ID, body.Reason)
	case "return":
		err = s.approvalSvc.Return(r.Context(), requestID, p.User.ID, body.Reason)
	case "cancel":
		err = s.approvalSvc.Cancel(r.Context(), requestID, p.User.ID)
	default:
		badRequest(w, "unknown action: "+action)
		return
	}

	if err != nil {
		badRequest(w, err.Error())
		return
	}

	// Emit event for the action
	eventTypeMap := map[string]events.EventType{
		"approve": events.EventApprovalApproved,
		"reject":  events.EventApprovalRejected,
		"return":  events.EventApprovalReturned,
		"cancel":  events.EventApprovalCancelled,
	}
	if et, ok := eventTypeMap[action]; ok {
		s.eventBus.Publish(events.NewEvent(et, "approval", requestID, p.User.ID))
	}

	success(w, http.StatusOK, map[string]string{"status": action + "d", "request_id": requestID})
}

// ── Role-based queries ───────────────────────────────────────

func (s *Server) handleApprovalMyPending(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	role := r.URL.Query().Get("role")
	if role == "" {
		role = string(p.User.Role)
	}

	requests, err := s.approvalSvc.ListPendingForRole(r.Context(), role)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"role":     role,
		"requests": requests,
		"total":    len(requests),
	})
}

func (s *Server) handleApprovalMyRequests(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	requests, err := s.approvalSvc.ListMyRequests(r.Context(), p.User.ID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"user_id":  p.User.ID,
		"requests": requests,
		"total":    len(requests),
	})
}

// ── Workflow Definitions ─────────────────────────────────────

func (s *Server) handleWorkflowDefinitions(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	workflows := getDefaultWorkflowDefinitions()
	success(w, http.StatusOK, workflows)
}

// getDefaultWorkflowDefinitions returns all 15 approval workflow templates.
func getDefaultWorkflowDefinitions() []map[string]any {
	return []map[string]any{
		// ── Group A: Administrative ──
		{
			"code": "club_registration", "entity_type": "club",
			"display_name": "Đăng ký thành lập CLB / Võ đường",
			"steps": []map[string]any{
				{"step": 1, "name": "LĐ Tỉnh xem xét", "role": "provincial_admin"},
				{"step": 2, "name": "LĐ Quốc gia xác nhận", "role": "federation_secretary"},
			},
		},
		{
			"code": "member_registration", "entity_type": "member",
			"display_name": "Đăng ký hội viên vào CLB",
			"steps": []map[string]any{
				{"step": 1, "name": "HLV xác nhận", "role": "coach"},
			},
		},
		{
			"code": "referee_card", "entity_type": "referee",
			"display_name": "Cấp/Gia hạn Thẻ Trọng tài",
			"steps": []map[string]any{
				{"step": 1, "name": "GĐ Kỹ thuật kiểm tra", "role": "technical_director"},
				{"step": 2, "name": "LĐ Quốc gia ký", "role": "president"},
			},
		},
		// ── Group B: Tournament ──
		{
			"code": "tournament_hosting", "entity_type": "tournament",
			"display_name": "Đăng ký Tổ chức Giải đấu",
			"steps": []map[string]any{
				{"step": 1, "name": "Thư ký LĐ thẩm định", "role": "federation_secretary"},
				{"step": 2, "name": "GĐ Kỹ thuật kiểm tra", "role": "technical_director"},
				{"step": 3, "name": "Chủ tịch LĐ phê duyệt", "role": "president"},
			},
		},
		{
			"code": "team_registration", "entity_type": "team",
			"display_name": "Đoàn Đăng ký Tham gia Giải",
			"steps": []map[string]any{
				{"step": 1, "name": "BTC giải duyệt", "role": "tournament_director"},
			},
		},
		{
			"code": "athlete_registration", "entity_type": "registration",
			"display_name": "VĐV Đăng ký Nội dung Thi đấu",
			"steps": []map[string]any{
				{"step": 1, "name": "Auto-validate + BTC duyệt", "role": "tournament_director"},
			},
		},
		{
			"code": "result_approval", "entity_type": "match_result",
			"display_name": "Phê duyệt Kết quả Thi đấu",
			"steps": []map[string]any{
				{"step": 1, "name": "Trọng tài chính xác nhận", "role": "chief_referee"},
				{"step": 2, "name": "BTC phê duyệt", "role": "tournament_director"},
			},
		},
		// ── Group C: Finance ──
		{
			"code": "expense_small", "entity_type": "transaction",
			"display_name": "Phê duyệt Chi tiêu (≤ 5 triệu)",
			"steps": []map[string]any{
				{"step": 1, "name": "Thư ký LĐ duyệt", "role": "federation_secretary"},
			},
		},
		{
			"code": "expense_medium", "entity_type": "transaction",
			"display_name": "Phê duyệt Chi tiêu (5-50 triệu)",
			"steps": []map[string]any{
				{"step": 1, "name": "Thư ký LĐ duyệt", "role": "federation_secretary"},
				{"step": 2, "name": "Chủ tịch LĐ phê duyệt", "role": "president"},
			},
		},
		{
			"code": "expense_large", "entity_type": "transaction",
			"display_name": "Phê duyệt Chi tiêu (> 50 triệu)",
			"steps": []map[string]any{
				{"step": 1, "name": "Thư ký LĐ duyệt", "role": "federation_secretary"},
				{"step": 2, "name": "Chủ tịch LĐ phê duyệt", "role": "president"},
				{"step": 3, "name": "Ban thường vụ (2/3 đồng ý)", "role": "executive_board", "requires_all": false, "min_approvals": 3},
			},
		},
		{
			"code": "fee_confirmation", "entity_type": "payment",
			"display_name": "Xác nhận Đóng Lệ phí Đoàn",
			"steps": []map[string]any{
				{"step": 1, "name": "Kế toán xác nhận", "role": "accountant"},
			},
		},
		// ── Group D: Training & Heritage ──
		{
			"code": "belt_promotion", "entity_type": "belt_exam",
			"display_name": "Thi Thăng Đai",
			"steps": []map[string]any{
				{"step": 1, "name": "Ban chuyên môn xét điều kiện", "role": "technical_director"},
				{"step": 2, "name": "LĐ cấp bằng", "role": "president"},
			},
		},
		{
			"code": "training_class", "entity_type": "training_class",
			"display_name": "Mở Lớp Đào tạo / Tập huấn",
			"steps": []map[string]any{
				{"step": 1, "name": "GĐ Kỹ thuật thẩm định", "role": "technical_director"},
				{"step": 2, "name": "LĐ phê duyệt", "role": "president"},
			},
		},
		// ── Group E: Content & Community ──
		{
			"code": "news_publish", "entity_type": "news",
			"display_name": "Phê duyệt Tin tức / Thông báo",
			"steps": []map[string]any{
				{"step": 1, "name": "Thư ký duyệt", "role": "federation_secretary"},
			},
		},
		{
			"code": "complaint", "entity_type": "complaint",
			"display_name": "Khiếu nại & Kháng nghị",
			"steps": []map[string]any{
				{"step": 1, "name": "Ban giải quyết KN xem xét", "role": "discipline_board"},
				{"step": 2, "name": "BTC ra quyết định", "role": "tournament_director"},
			},
		},
	}
}

// seedDefaultWorkflows converts the hardcoded workflow templates into
// WorkflowDefinition objects and seeds them into the approvalSvc.
func (s *Server) seedDefaultWorkflows() {
	defs := getDefaultWorkflowDefinitions()
	ctx := context.Background()

	for _, d := range defs {
		code, _ := d["code"].(string)
		entityType, _ := d["entity_type"].(string)
		displayName, _ := d["display_name"].(string)
		rawSteps, _ := d["steps"].([]map[string]any)

		var steps []approval.StepTemplate
		for _, rs := range rawSteps {
			stepNum, _ := rs["step"].(int)
			name, _ := rs["name"].(string)
			role, _ := rs["role"].(string)
			requiresAll, _ := rs["requires_all"].(bool)
			minApprovals, _ := rs["min_approvals"].(int)
			steps = append(steps, approval.StepTemplate{
				StepNumber:   stepNum,
				StepName:     name,
				ApproverRole: role,
				RequiresAll:  requiresAll,
				MinApprovals: minApprovals,
			})
		}

		wf := approval.WorkflowDefinition{
			ID:           newUUID(),
			WorkflowCode: code,
			EntityType:   entityType,
			DisplayName:  displayName,
			Steps:        steps,
			IsActive:     true,
		}

		_ = s.workflowRepo.Create(ctx, wf)
	}
}
