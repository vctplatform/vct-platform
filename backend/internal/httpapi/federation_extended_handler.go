package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PR / INTERNATIONAL / WORKFLOW HANDLERS
// Full CRUD for news articles, partners, events, workflows.
// ═══════════════════════════════════════════════════════════════

// ── Route Registration ───────────────────────────────────────

func (s *Server) handleExtendedFederationRoutes(mux *http.ServeMux) {
	// PR
	mux.HandleFunc("/api/v1/federation/articles/", s.withAuth(s.handleArticleByID))
	mux.HandleFunc("/api/v1/federation/articles", s.withAuth(s.handleArticles))
	// International
	mux.HandleFunc("/api/v1/federation/partners/", s.withAuth(s.handlePartnerByID))
	mux.HandleFunc("/api/v1/federation/partners", s.withAuth(s.handlePartners))
	mux.HandleFunc("/api/v1/federation/intl-events/", s.withAuth(s.handleIntlEventByID))
	mux.HandleFunc("/api/v1/federation/intl-events", s.withAuth(s.handleIntlEvents))
	// Workflow
	mux.HandleFunc("/api/v1/federation/workflows/", s.withAuth(s.handleWorkflowByID))
	mux.HandleFunc("/api/v1/federation/workflows", s.withAuth(s.handleWorkflows))
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PR HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

func (s *Server) handleArticles(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	switch r.Method {
	case "GET":
		if !requireRole(w, p, federationReadRoles...) {
			return
		}
		articles, err := s.Federation.Main.ListArticles(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		params := parsePagination(r)
		// Filter by status if provided
		status := r.URL.Query().Get("status")
		if status != "" {
			var filtered []federation.NewsArticle
			for _, a := range articles {
				if string(a.Status) == status {
					filtered = append(filtered, a)
				}
			}
			articles = filtered
		}
		result := federation.Paginate(articles, params)
		success(w, http.StatusOK, result)

	case "POST":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var article federation.NewsArticle
		if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		article.AuthorID = p.User.ID
		if article.Author == "" {
			article.Author = p.User.DisplayName
		}
		if err := s.Federation.Main.CreateArticle(r.Context(), article); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "article_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleArticleByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/articles/")

	switch r.Method {
	case "GET":
		a, err := s.Federation.Main.GetArticle(r.Context(), id)
		if err != nil {
			federationNotFound(w, "Bài viết", id)
			return
		}
		success(w, http.StatusOK, a)

	case "PUT":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var article federation.NewsArticle
		if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		article.ID = id
		if err := s.Federation.Main.UpdateArticle(r.Context(), article); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "article_updated"})

	case "DELETE":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		if err := s.Federation.Main.DeleteArticle(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "article_deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERNATIONAL HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

func (s *Server) handlePartners(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	switch r.Method {
	case "GET":
		if !requireRole(w, p, federationReadRoles...) {
			return
		}
		partners, err := s.Federation.Main.ListPartners(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		params := parsePagination(r)
		result := federation.Paginate(partners, params)
		success(w, http.StatusOK, result)

	case "POST":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var partner federation.InternationalPartner
		if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Federation.Main.CreatePartner(r.Context(), partner); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "partner_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handlePartnerByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/partners/")
	switch r.Method {
	case "GET":
		partner, err := s.Federation.Main.GetPartner(r.Context(), id)
		if err != nil {
			federationNotFound(w, "Đối tác", id)
			return
		}
		success(w, http.StatusOK, partner)
	case "PUT":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var partner federation.InternationalPartner
		if err := json.NewDecoder(r.Body).Decode(&partner); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		partner.ID = id
		if err := s.Federation.Main.UpdatePartner(r.Context(), partner); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "partner_updated"})
	case "DELETE":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		s.Federation.Main.DeletePartner(r.Context(), id)
		success(w, http.StatusOK, map[string]string{"status": "partner_deleted"})
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleIntlEvents(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	switch r.Method {
	case "GET":
		if !requireRole(w, p, federationReadRoles...) {
			return
		}
		events, err := s.Federation.Main.ListIntlEvents(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		params := parsePagination(r)
		result := federation.Paginate(events, params)
		success(w, http.StatusOK, result)

	case "POST":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var event federation.InternationalEvent
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Federation.Main.CreateIntlEvent(r.Context(), event); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "event_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleIntlEventByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/intl-events/")
	switch r.Method {
	case "GET":
		event, err := s.Federation.Main.GetIntlEvent(r.Context(), id)
		if err != nil {
			federationNotFound(w, "Sự kiện QT", id)
			return
		}
		success(w, http.StatusOK, event)
	case "PUT":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var event federation.InternationalEvent
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		event.ID = id
		if err := s.Federation.Main.UpdateIntlEvent(r.Context(), event); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "event_updated"})
	case "DELETE":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		s.Federation.Main.DeleteIntlEvent(r.Context(), id)
		success(w, http.StatusOK, map[string]string{"status": "event_deleted"})
	default:
		methodNotAllowed(w)
	}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORKFLOW HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

func (s *Server) handleWorkflows(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	switch r.Method {
	case "GET":
		if !requireRole(w, p, federationReadRoles...) {
			return
		}
		workflows, err := s.Federation.Main.ListWorkflows(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		params := parsePagination(r)
		result := federation.Paginate(workflows, params)
		success(w, http.StatusOK, result)

	case "POST":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var wf federation.WorkflowDefinition
		if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Federation.Main.CreateWorkflow(r.Context(), wf); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "workflow_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleWorkflowByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/workflows/")
	switch r.Method {
	case "GET":
		wf, err := s.Federation.Main.GetWorkflow(r.Context(), id)
		if err != nil {
			federationNotFound(w, "Quy trình", id)
			return
		}
		success(w, http.StatusOK, wf)
	case "PUT":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		var wf federation.WorkflowDefinition
		if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		wf.ID = id
		if err := s.Federation.Main.UpdateWorkflow(r.Context(), wf); err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "workflow_updated"})
	case "DELETE":
		if !requireRole(w, p, federationWriteRoles...) {
			return
		}
		s.Federation.Main.DeleteWorkflow(r.Context(), id)
		success(w, http.StatusOK, map[string]string{"status": "workflow_deleted"})
	default:
		methodNotAllowed(w)
	}
}
