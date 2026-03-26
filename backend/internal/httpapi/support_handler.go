package httpapi

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/support"
)

// ── Role Groups for Support ─────────────────────────────────

// Roles that can manage ALL tickets (admin, BTC, federation leadership)
var supportAdminRoles = []auth.UserRole{
	auth.RoleAdmin, auth.RoleBTC, auth.RoleFederationPresident,
	auth.RoleFederationSecretary, auth.RoleTechnicalDirector,
}

// Roles that can create tickets (any authenticated user)
var supportCreateRoles = []auth.UserRole{
	auth.RoleAdmin, auth.RoleBTC, auth.RoleFederationPresident,
	auth.RoleFederationSecretary, auth.RoleTechnicalDirector,
	auth.RoleProvincialAdmin, auth.RoleProvincialPresident,
	auth.RoleClubLeader, auth.RoleClubViceLeader,
	auth.RoleCoach, auth.RoleRefereeManager, auth.RoleReferee,
	auth.RoleAthlete, auth.RoleDelegate, auth.RoleParent,
	auth.RoleMedicalStaff, auth.RoleClubSecretary, auth.RoleClubAccountant,
}

func isSupportAdmin(role auth.UserRole) bool {
	for _, r := range supportAdminRoles {
		if r == role {
			return true
		}
	}
	return false
}

// handleSupportRoutes registers all /api/v1/support/* routes.
func (s *Server) handleSupportRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/support/tickets", s.withAuth(s.handleSupportTicketList))
	mux.HandleFunc("/api/v1/support/tickets/", s.withAuth(s.handleSupportTicketDetail))
	mux.HandleFunc("/api/v1/support/categories", s.withAuth(s.handleSupportCategoryList))
	mux.HandleFunc("/api/v1/support/categories/", s.withAuth(s.handleSupportCategoryDetail))
	mux.HandleFunc("/api/v1/support/faqs", s.withAuth(s.handleSupportFAQList))
	mux.HandleFunc("/api/v1/support/faqs/", s.withAuth(s.handleSupportFAQDetail))
	mux.HandleFunc("/api/v1/support/stats", s.withAuth(s.handleSupportStats))
}

// ── Tickets ──────────────────────────────────────────────────

func (s *Server) handleSupportTicketList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		filter := parseSupportFilter(r)
		// Non-admin users can only see their own tickets
		if !isSupportAdmin(p.User.Role) {
			filter.UserID = p.User.ID
		}
		result, err := s.Extended.Support.ListTickets(ctx, filter)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, result)
	case http.MethodPost:
		var t support.SupportTicket
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		// Set creator from token
		t.NguoiTaoID = p.User.ID
		if t.NguoiTaoTen == "" {
			t.NguoiTaoTen = p.User.Username
		}
		created, err := s.Extended.Support.CreateTicket(ctx, t)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleSupportTicketDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/support/tickets/")

	// Check for sub-routes: tickets/{id}/reply, tickets/{id}/replies
	parts := strings.SplitN(path, "/", 2)
	ticketID := parts[0]

	if len(parts) == 2 && parts[1] == "reply" {
		s.handleSupportTicketReply(w, r, ticketID, p)
		return
	}
	if len(parts) == 2 && parts[1] == "replies" {
		s.handleSupportTicketReplies(w, r, ticketID, p)
		return
	}

	switch r.Method {
	case http.MethodGet:
		ticket, err := s.Extended.Support.GetTicket(ctx, ticketID)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		// Non-admin can only view own tickets
		if !isSupportAdmin(p.User.Role) && ticket.NguoiTaoID != p.User.ID {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, ticket)
	case http.MethodPut, http.MethodPatch:
		// Only admins can update tickets (or the ticket owner for limited fields)
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền cập nhật ticket")
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		updated, err := s.Extended.Support.UpdateTicket(ctx, ticketID, patch)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	case http.MethodDelete:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền xóa ticket")
			return
		}
		if err := s.Extended.Support.DeleteTicket(ctx, ticketID); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã xóa ticket"})
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleSupportTicketReply(w http.ResponseWriter, r *http.Request, ticketID string, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	var reply support.TicketReply
	if err := json.NewDecoder(r.Body).Decode(&reply); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
		return
	}
	reply.TicketID = ticketID
	reply.NguoiTraID = p.User.ID
	if reply.NguoiTra == "" {
		reply.NguoiTra = p.User.Username
	}
	reply.IsStaff = isSupportAdmin(p.User.Role)
	created, err := s.Extended.Support.CreateReply(r.Context(), reply)
	if err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, created)
}

func (s *Server) handleSupportTicketReplies(w http.ResponseWriter, r *http.Request, ticketID string, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	// Check ticket access
	ticket, err := s.Extended.Support.GetTicket(r.Context(), ticketID)
	if err != nil {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
	if !isSupportAdmin(p.User.Role) && ticket.NguoiTaoID != p.User.ID {
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
		return
	}
	replies, err := s.Extended.Support.ListReplies(r.Context(), ticketID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	if replies == nil {
		replies = []support.TicketReply{}
	}
	success(w, http.StatusOK, replies)
}

// ── Categories ───────────────────────────────────────────────

func (s *Server) handleSupportCategoryList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		categories, err := s.Extended.Support.ListCategories(ctx)
		if err != nil {
			apiInternal(w, err)
			return
		}
		if categories == nil {
			categories = []support.SupportCategory{}
		}
		success(w, http.StatusOK, categories)
	case http.MethodPost:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền tạo danh mục")
			return
		}
		var c support.SupportCategory
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		created, err := s.Extended.Support.CreateCategory(ctx, c)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleSupportCategoryDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/support/categories/")
	switch r.Method {
	case http.MethodGet:
		cat, err := s.Extended.Support.GetCategory(ctx, id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, cat)
	case http.MethodPut, http.MethodPatch:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền cập nhật danh mục")
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		updated, err := s.Extended.Support.UpdateCategory(ctx, id, patch)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	case http.MethodDelete:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền xóa danh mục")
			return
		}
		if err := s.Extended.Support.DeleteCategory(ctx, id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã xóa danh mục"})
	default:
		apiMethodNotAllowed(w)
	}
}

// ── FAQs ─────────────────────────────────────────────────────

func (s *Server) handleSupportFAQList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		faqs, err := s.Extended.Support.ListFAQs(ctx)
		if err != nil {
			apiInternal(w, err)
			return
		}
		if faqs == nil {
			faqs = []support.FAQ{}
		}
		success(w, http.StatusOK, faqs)
	case http.MethodPost:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền tạo FAQ")
			return
		}
		var f support.FAQ
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		created, err := s.Extended.Support.CreateFAQ(ctx, f)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)
	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleSupportFAQDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	ctx := r.Context()
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/support/faqs/")
	switch r.Method {
	case http.MethodGet:
		faq, err := s.Extended.Support.GetFAQ(ctx, id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy tài nguyên")
			return
		}
		success(w, http.StatusOK, faq)
	case http.MethodPut, http.MethodPatch:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền cập nhật FAQ")
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid request body")
			return
		}
		updated, err := s.Extended.Support.UpdateFAQ(ctx, id, patch)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	case http.MethodDelete:
		if !isSupportAdmin(p.User.Role) {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền xóa FAQ")
			return
		}
		if err := s.Extended.Support.DeleteFAQ(ctx, id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã xóa FAQ"})
	default:
		apiMethodNotAllowed(w)
	}
}

// ── Stats ────────────────────────────────────────────────────

func (s *Server) handleSupportStats(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	// Only admin roles can view global stats
	if !isSupportAdmin(p.User.Role) {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "Bạn không có quyền xem thống kê")
		return
	}
	stats, err := s.Extended.Support.GetStats(r.Context())
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}

// ── Helpers ──────────────────────────────────────────────────

func parseSupportFilter(r *http.Request) support.ListFilter {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	return support.ListFilter{
		Page:     page,
		Limit:    limit,
		Status:   q.Get("status"),
		Priority: q.Get("priority"),
		Type:     q.Get("type"),
		Search:   q.Get("search"),
	}
}
