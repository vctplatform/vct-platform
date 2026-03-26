package httpapi

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"vct-platform/backend/internal/auth"
)

// ── Auth Handlers ────────────────────────────────────────────

func (s *Server) handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var input auth.LoginRequest
	if err := decodeJSON(r, &input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	result, err := s.authService.Login(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

func (s *Server) handleAuthRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var input auth.RefreshRequest
	if err := decodeJSON(r, &input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	result, err := s.authService.Refresh(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

func (s *Server) handleAuthMe(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	// Get base user and workspace data
	result := s.authService.Me(principal)

	// For VCT Portal Hub, we inject real-time or simulated pending task counts
	// In production, you would fetch this from a workflow/notification service.
	response := map[string]any{
		"token":            result.Token,
		"accessToken":      result.AccessToken,
		"refreshToken":     result.RefreshToken,
		"tokenType":        result.TokenType,
		"expiresAt":        result.ExpiresAt,
		"refreshExpiresAt": result.RefreshExpiresAt,
		"user":             result.User,
		"roles":            result.Roles,
		"permissions":      result.Permissions,
		"workspaces":       result.Workspaces,
		"tournamentCode":   result.TournamentCode,
		"operationShift":   result.OperationShift,
		"pendingTasks":     3, // Metric giả lập phục vụ Portal Hub
	}

	success(w, http.StatusOK, response)
}

func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	s.authService.Logout(principal, requestContextFromRequest(r))
	success(w, http.StatusOK, map[string]any{"message": "Đã đăng xuất và thu hồi phiên"})
}

func (s *Server) handleAuthRevoke(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var input auth.RevokeRequest
	if err := decodeJSON(r, &input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	revokedCount, err := s.authService.Revoke(principal, input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"message":      "Thu hồi token thành công",
		"revokedCount": revokedCount,
	})
}

func (s *Server) handleAuthAudit(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	if principal.User.Role != auth.RoleAdmin && principal.User.Role != auth.RoleBTC {
		writeAuthError(w, fmt.Errorf("%w: Không đủ quyền xem audit logs", auth.ErrForbidden))
		return
	}

	limit, err := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get("limit")))
	if err != nil {
		limit = 100
	}
	actor := strings.TrimSpace(r.URL.Query().Get("actor"))
	action := strings.TrimSpace(r.URL.Query().Get("action"))

	auditLogs := s.authService.GetAuditLogs(limit, actor, action)
	success(w, http.StatusOK, map[string]any{
		"items": auditLogs,
		"count": len(auditLogs),
	})
}

func (s *Server) handleAuthRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var input auth.RegisterRequest
	if err := decodeJSON(r, &input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	result, err := s.authService.Register(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusCreated, result)
}

// handleAuthSwitchContext handles POST /api/v1/auth/switch-context
func (s *Server) handleAuthSwitchContext(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}

	var input auth.SwitchContextRequest
	if err := decodeJSON(r, &input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}

	result, err := s.authService.SwitchContext(p, input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

// handleAuthMyRoles handles GET /api/v1/auth/my-roles
func (s *Server) handleAuthMyRoles(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	roles := s.authService.ListMyRoles(p)
	success(w, http.StatusOK, map[string]any{
		"user_id":  p.User.ID,
		"bindings": roles,
	})
}
