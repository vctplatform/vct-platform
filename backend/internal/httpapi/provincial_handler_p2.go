package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/provincial"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL PHASE 2 HTTP HANDLERS
// Tournament, Finance, Certification, Discipline, Documents.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleProvincialPhase2Routes(mux *http.ServeMux) {
	// ── Tournaments ────────────────────────────
	mux.HandleFunc("/api/v1/provincial/tournaments", s.withAuth(s.handleProvincialTournaments))
	mux.HandleFunc("/api/v1/provincial/tournaments/", s.withAuth(s.handleProvincialTournamentDetail))

	// ── Finance ────────────────────────────────
	mux.HandleFunc("/api/v1/provincial/finance", s.withAuth(s.handleProvincialFinance))
	mux.HandleFunc("/api/v1/provincial/finance/summary", s.withAuth(s.handleProvincialFinanceSummary))

	// ── Certifications ─────────────────────────
	mux.HandleFunc("/api/v1/provincial/certifications", s.withAuth(s.handleProvincialCertifications))

	// ── Discipline ─────────────────────────────
	mux.HandleFunc("/api/v1/provincial/discipline", s.withAuth(s.handleProvincialDiscipline))
	mux.HandleFunc("/api/v1/provincial/discipline/", s.withAuth(s.handleProvincialDisciplineAction))

	// ── Documents ──────────────────────────────
	mux.HandleFunc("/api/v1/provincial/documents", s.withAuth(s.handleProvincialDocuments))
	mux.HandleFunc("/api/v1/provincial/documents/", s.withAuth(s.handleProvincialDocumentAction))
}

// ─── Tournaments ────────────────────────────────────────────

func (s *Server) handleProvincialTournaments(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	ctx := r.Context()
	provID := resolveProvinceID(r)

	switch r.Method {
	case http.MethodGet:
		list, err := s.tournamentStore.ListTournaments(ctx, provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"tournaments": list, "total": len(list)})

	case http.MethodPost:
		var t provincial.ProvincialTournament
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		t.ID = "TOURN-" + newUUID()[:8]
		t.ProvinceID = provID
		t.Status = provincial.TournamentStatusDraft
		t.CreatedAt = time.Now().UTC()
		t.UpdatedAt = t.CreatedAt
		created, err := s.tournamentStore.CreateTournament(ctx, t)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleProvincialTournamentDetail(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/tournaments/")
	parts := strings.SplitN(path, "/", 2)
	tournamentID := parts[0]

	// Action endpoints
	if len(parts) == 2 && r.Method == http.MethodPost {
		action := parts[1]
		switch action {
		case "open":
			s.tournamentStore.UpdateTournament(r.Context(), tournamentID, map[string]interface{}{"status": "open"})
			success(w, http.StatusOK, map[string]string{"message": "Giải đấu đã mở đăng ký"})
		case "start":
			s.tournamentStore.UpdateTournament(r.Context(), tournamentID, map[string]interface{}{"status": "in_progress"})
			success(w, http.StatusOK, map[string]string{"message": "Giải đấu đã bắt đầu"})
		case "complete":
			s.tournamentStore.UpdateTournament(r.Context(), tournamentID, map[string]interface{}{"status": "completed"})
			success(w, http.StatusOK, map[string]string{"message": "Giải đấu đã kết thúc"})
		case "cancel":
			s.tournamentStore.UpdateTournament(r.Context(), tournamentID, map[string]interface{}{"status": "cancelled"})
			success(w, http.StatusOK, map[string]string{"message": "Giải đấu đã bị hủy"})
		case "registrations":
			if r.Method == http.MethodGet {
				list, err := s.tournamentStore.ListRegistrations(r.Context(), tournamentID)
				if err != nil {
					internalError(w, err)
					return
				}
				success(w, http.StatusOK, map[string]any{"registrations": list})
			} else {
				var reg provincial.TournamentRegistration
				if err := json.NewDecoder(r.Body).Decode(&reg); err != nil {
					badRequest(w, "invalid JSON")
					return
				}
				reg.ID = "REG-" + newUUID()[:8]
				reg.TournamentID = tournamentID
				reg.Status = "pending"
				reg.SubmittedAt = time.Now().UTC()
				created, _ := s.tournamentStore.CreateRegistration(r.Context(), reg)
				success(w, http.StatusCreated, created)
			}
		case "results":
			if r.Method == http.MethodGet {
				list, err := s.tournamentStore.ListResults(r.Context(), tournamentID)
				if err != nil {
					internalError(w, err)
					return
				}
				success(w, http.StatusOK, map[string]any{"results": list})
			} else {
				var res provincial.TournamentResult
				if err := json.NewDecoder(r.Body).Decode(&res); err != nil {
					badRequest(w, "invalid JSON")
					return
				}
				res.ID = "RES-" + newUUID()[:8]
				res.TournamentID = tournamentID
				created, _ := s.tournamentStore.CreateResult(r.Context(), res)
				success(w, http.StatusCreated, created)
			}
		default:
			badRequest(w, "unknown action: "+action)
		}
		return
	}

	// GET single tournament
	t, err := s.tournamentStore.GetTournament(r.Context(), tournamentID)
	if err != nil {
		notFoundError(w, "tournament not found")
		return
	}
	success(w, http.StatusOK, t)
}

// ─── Finance ────────────────────────────────────────────────

func (s *Server) handleProvincialFinance(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	ctx := r.Context()
	provID := resolveProvinceID(r)

	switch r.Method {
	case http.MethodGet:
		list, err := s.financeStore.List(ctx, provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"entries": list, "total": len(list)})

	case http.MethodPost:
		var e provincial.FinanceEntry
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		e.ID = "FIN-" + newUUID()[:8]
		e.ProvinceID = provID
		e.CreatedAt = time.Now().UTC()
		created, err := s.financeStore.Create(ctx, e)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleProvincialFinanceSummary(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	provID := resolveProvinceID(r)
	sum, err := s.financeStore.Summary(r.Context(), provID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, sum)
}

// ─── Certifications ─────────────────────────────────────────

func (s *Server) handleProvincialCertifications(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	ctx := r.Context()
	provID := resolveProvinceID(r)

	switch r.Method {
	case http.MethodGet:
		list, err := s.certStore.List(ctx, provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"certifications": list, "total": len(list)})

	case http.MethodPost:
		var c provincial.ProvincialCert
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		c.ID = "CERT-" + newUUID()[:8]
		c.ProvinceID = provID
		c.CreatedAt = time.Now().UTC()
		created, err := s.certStore.Create(ctx, c)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// ─── Discipline ─────────────────────────────────────────────

func (s *Server) handleProvincialDiscipline(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	ctx := r.Context()
	provID := resolveProvinceID(r)

	switch r.Method {
	case http.MethodGet:
		list, err := s.disciplineStore.List(ctx, provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"cases": list, "total": len(list)})

	case http.MethodPost:
		var c provincial.DisciplineCase
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		c.ID = "DISC-" + newUUID()[:8]
		c.ProvinceID = provID
		c.Status = "open"
		c.ReportedAt = time.Now().UTC()
		c.CreatedAt = c.ReportedAt
		created, err := s.disciplineStore.Create(ctx, c)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleProvincialDisciplineAction(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/discipline/")
	parts := strings.SplitN(path, "/", 2)
	caseID := parts[0]
	if r.Method != http.MethodPost || len(parts) < 2 {
		badRequest(w, "invalid request")
		return
	}
	action := parts[1]
	switch action {
	case "resolve":
		var body struct {
			Penalty string `json:"penalty"`
		}
		json.NewDecoder(r.Body).Decode(&body)
		s.disciplineStore.Update(r.Context(), caseID, map[string]interface{}{"status": "resolved", "penalty": body.Penalty})
		success(w, http.StatusOK, map[string]string{"status": "resolved"})
	case "close":
		s.disciplineStore.Update(r.Context(), caseID, map[string]interface{}{"status": "closed"})
		success(w, http.StatusOK, map[string]string{"status": "closed"})
	default:
		badRequest(w, "unknown action: "+action)
	}
}

// ─── Documents ──────────────────────────────────────────────

func (s *Server) handleProvincialDocuments(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	ctx := r.Context()
	provID := resolveProvinceID(r)

	switch r.Method {
	case http.MethodGet:
		list, err := s.docStore.List(ctx, provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"documents": list, "total": len(list)})

	case http.MethodPost:
		var d provincial.ProvincialDoc
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		d.ID = "DOC-" + newUUID()[:8]
		d.ProvinceID = provID
		d.Status = "draft"
		d.CreatedAt = time.Now().UTC()
		d.UpdatedAt = d.CreatedAt
		created, err := s.docStore.Create(ctx, d)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleProvincialDocumentAction(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/documents/")
	parts := strings.SplitN(path, "/", 2)
	docID := parts[0]
	if r.Method != http.MethodPost || len(parts) < 2 {
		badRequest(w, "invalid request")
		return
	}
	action := parts[1]
	switch action {
	case "publish":
		s.docStore.Update(r.Context(), docID, map[string]interface{}{"status": "published"})
		success(w, http.StatusOK, map[string]string{"status": "published"})
	case "archive":
		s.docStore.Update(r.Context(), docID, map[string]interface{}{"status": "archived"})
		success(w, http.StatusOK, map[string]string{"status": "archived"})
	default:
		badRequest(w, "unknown action: "+action)
	}
}
