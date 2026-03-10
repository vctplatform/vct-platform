package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strings"

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

func badRequest(w http.ResponseWriter, message string) {
	success(w, http.StatusBadRequest, map[string]string{"message": message})
}

func unauthorized(w http.ResponseWriter, message string) {
	success(w, http.StatusUnauthorized, map[string]string{"message": message})
}

func notFound(w http.ResponseWriter) {
	success(w, http.StatusNotFound, map[string]string{"message": "không tìm thấy tài nguyên"})
}

func methodNotAllowed(w http.ResponseWriter) {
	success(w, http.StatusMethodNotAllowed, map[string]string{"message": "method không được hỗ trợ"})
}

func internalError(w http.ResponseWriter, err error) {
	success(w, http.StatusInternalServerError, map[string]string{"message": err.Error()})
}

func conflict(w http.ResponseWriter, message string) {
	success(w, http.StatusConflict, map[string]string{"message": message})
}

func notFoundError(w http.ResponseWriter, message string) {
	success(w, http.StatusNotFound, map[string]string{"message": message})
}

func forbidden(w http.ResponseWriter, message string) {
	success(w, http.StatusForbidden, map[string]string{"message": message})
}

// requireRole checks if the principal has one of the allowed roles.
// Returns true if access is denied (caller should return immediately).
func requireRole(w http.ResponseWriter, p auth.Principal, roles ...string) bool {
	for _, r := range roles {
		if string(p.User.Role) == r {
			return false // access granted
		}
	}
	forbidden(w, "Bạn không có quyền thực hiện thao tác này")
	return true // access denied
}

func writeAuthError(w http.ResponseWriter, err error) {
	status := http.StatusUnauthorized
	switch {
	case errors.Is(err, auth.ErrConflict):
		status = http.StatusConflict
	case errors.Is(err, auth.ErrBadRequest):
		status = http.StatusBadRequest
	case errors.Is(err, auth.ErrInvalidCredentials):
		status = http.StatusUnauthorized
	case errors.Is(err, auth.ErrForbidden):
		status = http.StatusForbidden
	case errors.Is(err, auth.ErrUnauthorized):
		status = http.StatusUnauthorized
	}
	success(w, status, map[string]string{"message": authMessage(err)})
}

func authMessage(err error) string {
	parts := strings.SplitN(err.Error(), ":", 2)
	if len(parts) < 2 {
		return err.Error()
	}
	return strings.TrimSpace(parts[1])
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
