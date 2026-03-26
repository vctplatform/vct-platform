package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/btc"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — BTC HANDLER
// REST API endpoints for BTC (Ban Tổ Chức) giải management.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleBTCRoutes(mux *http.ServeMux) {
	// BTC Members
	mux.HandleFunc("/api/v1/btc/members", s.withAuth(s.handleBTCMemberList))
	mux.HandleFunc("/api/v1/btc/members/create", s.withAuth(s.handleBTCMemberCreate))
	mux.HandleFunc("/api/v1/btc/members/", s.withAuth(s.handleBTCMemberByID)) // GET, PATCH, DELETE by ID

	// Weigh-In
	mux.HandleFunc("/api/v1/btc/weigh-in", s.withAuth(s.handleBTCWeighInList))
	mux.HandleFunc("/api/v1/btc/weigh-in/create", s.withAuth(s.handleBTCWeighInCreate))

	// Draw
	mux.HandleFunc("/api/v1/btc/draws", s.withAuth(s.handleBTCDrawList))
	mux.HandleFunc("/api/v1/btc/draws/generate", s.withAuth(s.handleBTCDrawGenerate))

	// Referee Assignments
	mux.HandleFunc("/api/v1/btc/referee-assignments", s.withAuth(s.handleBTCAssignmentList))
	mux.HandleFunc("/api/v1/btc/referee-assignments/create", s.withAuth(s.handleBTCAssignmentCreate))

	// Results
	mux.HandleFunc("/api/v1/btc/results", s.withAuth(s.handleBTCTeamResults))
	mux.HandleFunc("/api/v1/btc/results/content", s.withAuth(s.handleBTCContentResults))

	// Finance
	mux.HandleFunc("/api/v1/btc/finance", s.withAuth(s.handleBTCFinanceList))
	mux.HandleFunc("/api/v1/btc/finance/create", s.withAuth(s.handleBTCFinanceCreate))
	mux.HandleFunc("/api/v1/btc/finance/summary", s.withAuth(s.handleBTCFinanceSummary))

	// Technical Meetings
	mux.HandleFunc("/api/v1/btc/meetings", s.withAuth(s.handleBTCMeetingList))
	mux.HandleFunc("/api/v1/btc/meetings/create", s.withAuth(s.handleBTCMeetingCreate))

	// Protests
	mux.HandleFunc("/api/v1/btc/protests", s.withAuth(s.handleBTCProtestList))
	mux.HandleFunc("/api/v1/btc/protests/create", s.withAuth(s.handleBTCProtestCreate))
	mux.HandleFunc("/api/v1/btc/protests/", s.withAuth(s.handleBTCProtestUpdate))

	// Stats
	mux.HandleFunc("/api/v1/btc/stats", s.withAuth(s.handleBTCStats))
}

// ── BTC Members ─────────────────────────────────────────────

func (s *Server) handleBTCMemberList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	members, err := s.Extended.BTC.ListMembers(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, members)
}

func (s *Server) handleBTCMemberCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var m btc.BTCMember
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateMember(r.Context(), &m); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, m)
}

func (s *Server) handleBTCMemberByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	memberID := parts[len(parts)-1]
	if memberID == "" || memberID == "members" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "missing member ID")
		return
	}

	switch r.Method {
	case http.MethodGet:
		m, err := s.Extended.BTC.GetMember(r.Context(), memberID)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, m)

	case http.MethodPatch:
		var m btc.BTCMember
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		m.ID = memberID
		if err := s.Extended.BTC.UpdateMember(r.Context(), &m); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, m)

	case http.MethodDelete:
		if err := s.Extended.BTC.DeleteMember(r.Context(), memberID); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "deleted"})

	default:
		apiMethodNotAllowed(w)
	}
}

// ── Weigh-In ────────────────────────────────────────────────

func (s *Server) handleBTCWeighInList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	records, err := s.Extended.BTC.ListWeighIns(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, records)
}

func (s *Server) handleBTCWeighInCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var wi btc.WeighInRecord
	if err := json.NewDecoder(r.Body).Decode(&wi); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateWeighIn(r.Context(), &wi); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, wi)
}

// ── Draw ────────────────────────────────────────────────────

func (s *Server) handleBTCDrawList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	draws, err := s.Extended.BTC.ListDraws(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, draws)
}

func (s *Server) handleBTCDrawGenerate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var input btc.DrawInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	result, err := s.Extended.BTC.GenerateDraw(r.Context(), input)
	if err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, result)
}

// ── Referee Assignments ─────────────────────────────────────

func (s *Server) handleBTCAssignmentList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	assignments, err := s.Extended.BTC.ListAssignments(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, assignments)
}

func (s *Server) handleBTCAssignmentCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var a btc.RefereeAssignment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateAssignment(r.Context(), &a); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, a)
}

// ── Results ─────────────────────────────────────────────────

func (s *Server) handleBTCTeamResults(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	results, err := s.Extended.BTC.ListTeamResults(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, results)
}

func (s *Server) handleBTCContentResults(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	results, err := s.Extended.BTC.ListContentResults(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, results)
}

// ── Finance ─────────────────────────────────────────────────

func (s *Server) handleBTCFinanceList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	entries, err := s.Extended.BTC.ListFinance(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, entries)
}

func (s *Server) handleBTCFinanceCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var f btc.FinanceEntry
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateFinance(r.Context(), &f); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, f)
}

func (s *Server) handleBTCFinanceSummary(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	summary, err := s.Extended.BTC.FinanceSummary(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, summary)
}

// ── Technical Meetings ──────────────────────────────────────

func (s *Server) handleBTCMeetingList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	meetings, err := s.Extended.BTC.ListMeetings(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, meetings)
}

func (s *Server) handleBTCMeetingCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	var m btc.TechnicalMeeting
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateMeeting(r.Context(), &m); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, m)
}

// ── Protests ────────────────────────────────────────────────

func (s *Server) handleBTCProtestList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	protests, err := s.Extended.BTC.ListProtests(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, protests)
}

func (s *Server) handleBTCProtestCreate(w http.ResponseWriter, r *http.Request, pr auth.Principal) {
	if r.Method != http.MethodPost {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, pr, btcWriteRoles...) {
		return
	}
	var p btc.Protest
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if err := s.Extended.BTC.CreateProtest(r.Context(), &p); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusCreated, p)
}

func (s *Server) handleBTCProtestUpdate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPatch {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcWriteRoles...) {
		return
	}
	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	protestID := parts[len(parts)-1]
	if protestID == "" || protestID == "protests" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "missing protest ID")
		return
	}

	var body struct {
		TrangThai string `json:"trang_thai"`
		NguoiXL   string `json:"nguoi_xl"`
		QuyetDinh string `json:"quyet_dinh"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
		return
	}

	if err := s.Extended.BTC.UpdateProtestStatus(r.Context(), protestID, body.TrangThai, body.NguoiXL, body.QuyetDinh); err != nil {
		apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
		return
	}
	success(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ── Stats ───────────────────────────────────────────────────

func (s *Server) handleBTCStats(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}
	if !requireRole(w, p, btcReadRoles...) {
		return
	}
	giaiID := r.URL.Query().Get("giai_id")
	stats, err := s.Extended.BTC.GetStats(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}
