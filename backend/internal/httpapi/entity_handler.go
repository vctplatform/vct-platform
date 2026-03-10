package httpapi

import (
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/pkg"
)

// ── Entity CRUD Handlers ─────────────────────────────────────

func (s *Server) handleEntityRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/")
	path = strings.Trim(path, "/")
	if path == "" {
		notFound(w)
		return
	}

	segments := strings.Split(path, "/")
	entity := segments[0]
	if entity == "auth" {
		notFound(w)
		return
	}
	if _, allowed := s.allowedEntities[entity]; !allowed {
		notFound(w)
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
		notFound(w)
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
			badRequest(w, err.Error())
			return
		}
		created, err := s.store.Create(entity, item)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		createdID, _ := created["id"].(string)
		s.broadcastEntityChange(entity, "created", createdID, created, nil)
		success(w, http.StatusCreated, created)
	default:
		methodNotAllowed(w)
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
			notFound(w)
			return
		}
		success(w, http.StatusOK, item)
	case http.MethodPatch:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionUpdate); err != nil {
			writeAuthError(w, err)
			return
		}
		patch, err := decodeObject(r)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		updated, err := s.store.Update(entity, id, patch)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		s.broadcastEntityChange(entity, "updated", id, updated, nil)
		success(w, http.StatusOK, updated)
	case http.MethodDelete:
		if err := s.authorizeEntityAction(principal, entity, authz.ActionDelete); err != nil {
			writeAuthError(w, err)
			return
		}
		s.store.Delete(entity, id)
		s.broadcastEntityChange(entity, "deleted", id, nil, nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleBulkReplace(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		methodNotAllowed(w)
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
		badRequest(w, err.Error())
		return
	}
	replaced, err := s.store.ReplaceAll(entity, payload.Items)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	s.broadcastEntityChange(entity, "replaced", "", nil, map[string]any{
		"count": len(replaced),
	})
	success(w, http.StatusOK, replaced)
}

func (s *Server) handleImport(entity string, principal *auth.Principal, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
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
		badRequest(w, err.Error())
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
		methodNotAllowed(w)
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
		badRequest(w, "format không hỗ trợ, chỉ nhận json hoặc csv")
		return
	}
	if err != nil {
		internalError(w, err)
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
