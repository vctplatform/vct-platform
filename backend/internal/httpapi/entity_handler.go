package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"vct-platform/backend/internal/apierror"
	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/pkg"
)

// ── Entity CRUD Handlers ─────────────────────────────────────

func (s *Server) handleEntityRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/")
	path = strings.Trim(path, "/")
	if path == "" {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}

	segments := strings.Split(path, "/")
	entity := segments[0]
	if entity == "auth" {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
	if _, allowed := s.allowedEntities[entity]; !allowed {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}

	var principal *auth.Principal
	if !s.cfg.DisableAuthForData {
		authPrincipal, err := s.principalFromRequest(r)
		if err != nil {
			writeAuthError(w, err)
			return
		}
		principal = &authPrincipal
	}

	s.store.EnsureEntity(entity)

	switch len(segments) {
	case 1:
		s.handleEntityCollection(entity, principal, w, r)
	case 2:
		s.handleEntityAction(entity, segments[1], principal, w, r)
	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
	}
}

func (s *Server) handleEntityCollection(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionView); err != nil {
			writeAuthError(w, err)
			return
		}
		items := s.store.List(entity)
		pageReq := pkg.ParsePagination(r)
		success(w, http.StatusOK, pkg.Paginate(items, pageReq))
	case http.MethodPost:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionCreate); err != nil {
			writeAuthError(w, err)
			return
		}
		item, err := decodeObject(r)
		if err != nil {
			apiBadRequest(w, err)
			return
		}
		b, err := json.Marshal(item)
		if err != nil {
			apiBadRequest(w, err)
			return
		}
		created, err := s.store.Create(entity, b)
		if err != nil {
			if errors.Is(err, apierror.ErrDuplicateID) {
				apiConflict(w, "Mã ID đã tồn tại")
				return
			}
			apiBadRequest(w, err)
			return
		}
		var createdMap map[string]any
		json.Unmarshal(created, &createdMap)
		createdID, _ := createdMap["id"].(string)
		s.broadcastEntityChange(entity, "created", createdID, createdMap, nil)
		successJSONBytes(w, http.StatusCreated, created)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleEntityAction(entity, action string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	switch action {
	case "bulk":
		s.handleBulkReplace(entity, principal, w, r)
		return
	case "import":
		s.handleImport(entity, principal, w, r)
		return
	case "export":
		s.handleExport(entity, principal, w, r)
		return
	}

	id := action
	switch r.Method {
	case http.MethodGet:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionView); err != nil {
			writeAuthError(w, err)
			return
		}
		item, ok := s.store.GetByID(entity, id)
		if !ok {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		successJSONBytes(w, http.StatusOK, item)
	case http.MethodPatch:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionUpdate); err != nil {
			writeAuthError(w, err)
			return
		}
		patch, err := decodeObject(r)
		if err != nil {
			apiBadRequest(w, err)
			return
		}
		b, err := json.Marshal(patch)
		if err != nil {
			apiBadRequest(w, err)
			return
		}
		updated, err := s.store.Update(entity, id, b)
		if err != nil {
			if errors.Is(err, apierror.ErrNotFound) {
				apiNotFound(w, entity, id)
				return
			}
			apiBadRequest(w, err)
			return
		}
		var updatedMap map[string]any
		json.Unmarshal(updated, &updatedMap)
		s.broadcastEntityChange(entity, "updated", id, updatedMap, nil)
		successJSONBytes(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionDelete); err != nil {
			writeAuthError(w, err)
			return
		}
		s.store.Delete(entity, id)
		s.broadcastEntityChange(entity, "deleted", id, nil, nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleBulkReplace(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		apiMethodNotAllowed(w)
		return
	}
	if err := s.authorizeEntityAction(principal, entity, authz.ActionUpdate); err != nil {
		writeAuthError(w, err)
		return
	}

	var payload struct {
		Items []map[string]any `json:"items"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	var byteItems [][]byte
	for _, item := range payload.Items {
		b, _ := json.Marshal(item)
		byteItems = append(byteItems, b)
	}
	replaced, err := s.store.ReplaceAll(entity, byteItems)
	if err != nil {
		apiBadRequest(w, err)
		return
	}
	s.broadcastEntityChange(entity, "replaced", "", nil, map[string]any{
		"count": len(replaced),
	})
	// replaced is []map[string]any but the return of ReplaceAll should be ... wait, let's see what ReplaceAll returns.
	// ReplaceAll returns `[][]byte`?
	// successJSONBytes wouldn't work easily here, let's marshal the `[][]byte` into a valid JSON array or unmarshal the whole thing
	var replacedMaps []map[string]any
	for _, item := range replaced {
		var m map[string]any
		json.Unmarshal(item, &m)
		replacedMaps = append(replacedMaps, m)
	}
	success(w, http.StatusOK, replacedMaps)
}

func (s *Server) handleImport(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if err := s.authorizeEntityAction(principal, entity, authz.ActionImport); err != nil {
		writeAuthError(w, err)
		return
	}

	var payload struct {
		Items []any `json:"items"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	report := s.store.Import(entity, payload.Items)
	s.broadcastEntityChange(entity, "imported", "", nil, map[string]any{
		"imported": len(report.Imported),
		"rejected": len(report.Rejected),
	})
	success(w, http.StatusOK, report)
}

func (s *Server) handleExport(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if err := s.authorizeEntityAction(principal, entity, authz.ActionExport); err != nil {
		writeAuthError(w, err)
		return
	}

	format := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("format")))
	if format == "" {
		format = "json"
	}

	var (
		payload string
		err     error
	)
	switch format {
	case "json":
		payload, err = s.store.ExportJSON(entity)
	case "csv":
		payload, err = s.store.ExportCSV(entity)
	default:
		apiError(w, http.StatusBadRequest, CodeBadRequest, "format không hỗ trợ, chỉ nhận json hoặc csv")
		return
	}
	if err != nil {
		apiInternal(w, err)
		return
	}

	contentType := "application/json; charset=utf-8"
	if format == "csv" {
		contentType = "text/csv; charset=utf-8"
	}
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(payload))
}
