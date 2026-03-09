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
		methodNotAllowed(w)
		return
	}

	var input auth.LoginRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
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
		methodNotAllowed(w)
		return
	}

	var input auth.RefreshRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
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
		methodNotAllowed(w)
		return
	}
	success(w, http.StatusOK, s.authService.Me(principal))
}

func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	s.authService.Logout(principal, requestContextFromRequest(r))
	success(w, http.StatusOK, map[string]any{"message": "Đã đăng xuất và thu hồi phiên"})
}

func (s *Server) handleAuthRevoke(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.RevokeRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
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
		methodNotAllowed(w)
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
