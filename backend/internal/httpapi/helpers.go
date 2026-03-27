package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"vct-platform/backend/internal/apierror"
	"vct-platform/backend/internal/auth"
)

// ── JSON Helpers ─────────────────────────────────────────────

func decodeObject(r *http.Request) (map[string]any, error) {
	var payload map[string]any
	if err := decodeJSON(r, &payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func decodeJSON(r *http.Request, output any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(output); err != nil {
		return fmt.Errorf("json không hợp lệ: %w", err)
	}
	return nil
}

// ── Response Helpers ─────────────────────────────────────────

func success(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func successJSONBytes(w http.ResponseWriter, status int, payload []byte) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(payload)
}

// requireRole checks if the principal has one of the allowed roles.
// Returns true if access is granted (caller should continue). Returns false and writes 403 if denied.
func requireRole(w http.ResponseWriter, p auth.Principal, roles ...auth.UserRole) bool {
	for _, r := range roles {
		if p.User.Role == r {
			return true // access granted
		}
	}
	apiError(w, http.StatusForbidden, CodeForbidden, "Bạn không có quyền thực hiện thao tác này")
	return false // access denied
}

func writeError(w http.ResponseWriter, err error) {
	var apiErr *apierror.Error
	if errors.As(err, &apiErr) {
		status := http.StatusInternalServerError
		// Basic status mapping based on Code prefix or specific codes
		switch {
		case strings.HasPrefix(apiErr.Code, "AUTH_401"), strings.HasPrefix(apiErr.Code, "AUTH_ERR"):
			status = http.StatusUnauthorized
		case strings.HasPrefix(apiErr.Code, "AUTH_403"), strings.HasPrefix(apiErr.Code, "FORBIDDEN"):
			status = http.StatusForbidden
		case strings.HasPrefix(apiErr.Code, "STORE_404"), strings.HasPrefix(apiErr.Code, "TENANT_404"), strings.HasPrefix(apiErr.Code, "TEMPLATE_404"):
			status = http.StatusNotFound
		case strings.HasPrefix(apiErr.Code, "STORE_409"), strings.HasPrefix(apiErr.Code, "BIZ_409"), strings.HasPrefix(apiErr.Code, "AUTH_409"):
			status = http.StatusConflict
		case strings.HasPrefix(apiErr.Code, "VAL_400"), strings.HasPrefix(apiErr.Code, "STORE_400"), strings.HasPrefix(apiErr.Code, "BIZ_400"), strings.HasPrefix(apiErr.Code, "WORKER_ERR"), strings.HasPrefix(apiErr.Code, "AUTH_400"):
			status = http.StatusBadRequest
		case strings.HasPrefix(apiErr.Code, "BIZ_429"), strings.HasPrefix(apiErr.Code, "AUTH_429"):
			status = http.StatusTooManyRequests
		case strings.HasPrefix(apiErr.Code, "WEBHOOK_ERR"):
			status = http.StatusBadGateway
		}
		apiError(w, status, apiErr.Code, apiErr.Message)
		return
	}

	// Fallback for non-structured errors
	apiInternal(w, err)
}

func writeAuthError(w http.ResponseWriter, err error) {
	// If it's already a structured error, use the generic writer
	var apiErr *apierror.Error
	if errors.As(err, &apiErr) {
		writeError(w, err)
		return
	}

	status := http.StatusUnauthorized
	code := CodeUnauthorized

	switch {
	case errors.Is(err, auth.ErrConflict):
		status = http.StatusConflict
		code = CodeConflict
	case errors.Is(err, auth.ErrBadRequest):
		status = http.StatusBadRequest
		code = CodeBadRequest
	case errors.Is(err, auth.ErrInvalidCredentials):
		status = http.StatusUnauthorized
		code = auth.CodeInvalidCredentials
	case errors.Is(err, auth.ErrForbidden):
		status = http.StatusForbidden
		code = CodeForbidden
	case errors.Is(err, auth.ErrUnauthorized):
		status = http.StatusUnauthorized
		code = CodeUnauthorized
	}

	msg := err.Error()
	// Legacy parsing for "CODE: message"
	parts := strings.SplitN(err.Error(), ":", 2)
	if len(parts) >= 2 {
		potentialCode := strings.TrimSpace(parts[0])
		if strings.HasPrefix(potentialCode, "ERR_") || strings.Contains(potentialCode, "_") {
			code = potentialCode
			msg = strings.TrimSpace(parts[1])
		}
	}

	apiError(w, status, code, msg)
}

// ── Entity Registry ──────────────────────────────────────────

func defaultEntitySet() map[string]struct{} {
	entities := []string{
		"teams",
		"athletes",
		"registration",
		"results",
		"medals",
		"brackets",
		"schedule",
		"arenas",
		"referees",
		"appeals",
		"weigh-ins",
		"combat-matches",
		"form-performances",
		"content-categories",
		"referee-assignments",
		"tournament-config",
	}
	sort.Strings(entities)
	set := make(map[string]struct{}, len(entities))
	for entity := range entities {
		set[entities[entity]] = struct{}{}
	}
	return set
}
