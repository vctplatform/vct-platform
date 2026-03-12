package httpapi

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT MANAGEMENT API HANDLERS
// Categories, Registrations, Schedule, Arena, Results, Stats
// ═══════════════════════════════════════════════════════════════

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/tournament"
)

var tournamentReadRoles = []auth.UserRole{"admin", "president", "vice_president", "secretary", "btc_truong", "btc_member", "viewer"}
var tournamentWriteRoles = []auth.UserRole{"admin", "president", "vice_president", "secretary", "btc_truong", "btc_member"}

func (s *Server) handleTournamentMgmtRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/tournament-mgmt/", s.withAuth(s.handleTournamentMgmt))
}

func (s *Server) handleTournamentMgmt(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	// Parse: /api/v1/tournament-mgmt/{tournamentId}/{resource}/{subId}/{action}
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/tournament-mgmt/")
	parts := strings.Split(strings.TrimRight(path, "/"), "/")

	if len(parts) < 1 || parts[0] == "" {
		badRequest(w, "tournament ID required")
		return
	}

	tournamentID := parts[0]
	resource := ""
	subID := ""
	action := ""

	if len(parts) > 1 {
		resource = parts[1]
	}
	if len(parts) > 2 {
		subID = parts[2]
	}
	if len(parts) > 3 {
		action = parts[3]
	}

	switch resource {
	case "categories":
		s.handleTournamentCategories(w, r, p, tournamentID, subID)
	case "registrations":
		s.handleTournamentRegistrations(w, r, p, tournamentID, subID, action)
	case "schedule":
		s.handleTournamentSchedule(w, r, p, tournamentID, subID)
	case "arenas":
		s.handleTournamentArenas(w, r, p, tournamentID, subID)
	case "results":
		s.handleTournamentResults(w, r, p, tournamentID, subID, action)
	case "standings":
		s.handleTournamentStandings(w, r, p, tournamentID)
	case "stats":
		s.handleTournamentStats(w, r, p, tournamentID)
	case "export":
		s.handleTournamentExport(w, r, p, tournamentID, subID)
	case "batch":
		s.handleTournamentBatch(w, r, p, tournamentID, subID)
	default:
		notFoundError(w, "unknown resource: "+resource)
	}
}

// ── Categories ──────────────────────────────────────────────

func (s *Server) handleTournamentCategories(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, catID string) {
	switch {
	case r.Method == "GET" && catID == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		cats, err := s.tournamentMgmtSvc.ListCategories(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if cats == nil {
			cats = []*tournament.Category{}
		}
		success(w, http.StatusOK, map[string]any{"categories": cats, "total": len(cats)})

	case r.Method == "POST" && catID == "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var cat tournament.Category
		if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		cat.TournamentID = tournamentID
		created, err := s.tournamentMgmtSvc.CreateCategory(r.Context(), &cat)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && catID != "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		cat, err := s.tournamentMgmtSvc.GetCategory(r.Context(), catID)
		if err != nil {
			notFoundError(w, "category not found")
			return
		}
		success(w, http.StatusOK, cat)

	case r.Method == "PUT" && catID != "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var cat tournament.Category
		if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		cat.ID = catID
		updated, err := s.tournamentMgmtSvc.UpdateCategory(r.Context(), &cat)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)

	case r.Method == "DELETE" && catID != "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.DeleteCategory(r.Context(), catID); err != nil {
			badRequest(w, err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		methodNotAllowed(w)
	}
}

// ── Registrations ───────────────────────────────────────────

func (s *Server) handleTournamentRegistrations(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, regID, action string) {
	switch {
	case r.Method == "GET" && regID == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		regs, err := s.tournamentMgmtSvc.ListRegistrations(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if regs == nil {
			regs = []*tournament.Registration{}
		}
		success(w, http.StatusOK, map[string]any{"registrations": regs, "total": len(regs)})

	case r.Method == "POST" && regID == "" && action == "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var reg tournament.Registration
		if err := json.NewDecoder(r.Body).Decode(&reg); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		reg.TournamentID = tournamentID
		created, err := s.tournamentMgmtSvc.RegisterTeam(r.Context(), &reg)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && regID != "" && action == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		reg, err := s.tournamentMgmtSvc.GetRegistration(r.Context(), regID)
		if err != nil {
			notFoundError(w, "registration not found")
			return
		}
		success(w, http.StatusOK, reg)

	case r.Method == "GET" && regID != "" && action == "athletes":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		athletes, err := s.tournamentMgmtSvc.ListRegistrationAthletes(r.Context(), regID)
		if err != nil {
			internalError(w, err)
			return
		}
		if athletes == nil {
			athletes = []*tournament.RegistrationAthlete{}
		}
		success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})

	case r.Method == "POST" && regID != "" && action == "athletes":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var athlete tournament.RegistrationAthlete
		if err := json.NewDecoder(r.Body).Decode(&athlete); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		athlete.RegistrationID = regID
		created, err := s.tournamentMgmtSvc.AddAthleteToRegistration(r.Context(), &athlete)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "POST" && regID != "" && action == "submit":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.SubmitRegistration(r.Context(), regID); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "submitted"})

	case r.Method == "POST" && regID != "" && action == "approve":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.ApproveRegistration(r.Context(), regID, p.User.ID); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && regID != "" && action == "reject":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var body struct {
			Reason string `json:"reason"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.tournamentMgmtSvc.RejectRegistration(r.Context(), regID, p.User.ID, body.Reason); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "rejected"})

	default:
		methodNotAllowed(w)
	}
}

// ── Schedule ────────────────────────────────────────────────

func (s *Server) handleTournamentSchedule(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, slotID string) {
	switch {
	case r.Method == "GET" && slotID == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		slots, err := s.tournamentMgmtSvc.ListScheduleSlots(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if slots == nil {
			slots = []*tournament.ScheduleSlot{}
		}
		success(w, http.StatusOK, map[string]any{"schedule": slots, "total": len(slots)})

	case r.Method == "POST" && slotID == "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var slot tournament.ScheduleSlot
		if err := json.NewDecoder(r.Body).Decode(&slot); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		slot.TournamentID = tournamentID
		created, err := s.tournamentMgmtSvc.CreateScheduleSlot(r.Context(), &slot)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && slotID != "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		slot, err := s.tournamentMgmtSvc.GetScheduleSlot(r.Context(), slotID)
		if err != nil {
			notFoundError(w, "schedule slot not found")
			return
		}
		success(w, http.StatusOK, slot)

	case r.Method == "PUT" && slotID != "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var slot tournament.ScheduleSlot
		if err := json.NewDecoder(r.Body).Decode(&slot); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		slot.ID = slotID
		updated, err := s.tournamentMgmtSvc.UpdateScheduleSlot(r.Context(), &slot)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)

	case r.Method == "DELETE" && slotID != "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.DeleteScheduleSlot(r.Context(), slotID); err != nil {
			badRequest(w, err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		methodNotAllowed(w)
	}
}

// ── Arenas ──────────────────────────────────────────────────

func (s *Server) handleTournamentArenas(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, assignID string) {
	switch {
	case r.Method == "GET" && assignID == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		assigns, err := s.tournamentMgmtSvc.ListArenaAssignments(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if assigns == nil {
			assigns = []*tournament.ArenaAssignment{}
		}
		success(w, http.StatusOK, map[string]any{"arena_assignments": assigns, "total": len(assigns)})

	case r.Method == "POST" && assignID == "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var assign tournament.ArenaAssignment
		if err := json.NewDecoder(r.Body).Decode(&assign); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		assign.TournamentID = tournamentID
		created, err := s.tournamentMgmtSvc.AssignArena(r.Context(), &assign)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "DELETE" && assignID != "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.RemoveArenaAssignment(r.Context(), assignID); err != nil {
			badRequest(w, err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		methodNotAllowed(w)
	}
}

// ── Results ─────────────────────────────────────────────────

func (s *Server) handleTournamentResults(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, resultID, action string) {
	switch {
	case r.Method == "GET" && resultID == "":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		results, err := s.tournamentMgmtSvc.ListResults(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if results == nil {
			results = []*tournament.TournamentResult{}
		}
		success(w, http.StatusOK, map[string]any{"results": results, "total": len(results)})

	case r.Method == "POST" && resultID == "":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var result tournament.TournamentResult
		if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		result.TournamentID = tournamentID
		created, err := s.tournamentMgmtSvc.RecordResult(r.Context(), &result)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "POST" && resultID != "" && action == "finalize":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		if err := s.tournamentMgmtSvc.FinalizeResult(r.Context(), resultID, p.User.ID); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "finalized"})

	default:
		methodNotAllowed(w)
	}
}

// ── Standings ───────────────────────────────────────────────

func (s *Server) handleTournamentStandings(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID string) {
	switch r.Method {
	case "GET":
		if !requireRole(w, p, tournamentReadRoles...) {
			return
		}
		standings, err := s.tournamentMgmtSvc.GetTeamStandings(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		if standings == nil {
			standings = []*tournament.TeamStanding{}
		}
		success(w, http.StatusOK, map[string]any{"standings": standings, "total": len(standings)})

	case "POST":
		if !requireRole(w, p, tournamentWriteRoles...) {
			return
		}
		var ts tournament.TeamStanding
		if err := json.NewDecoder(r.Body).Decode(&ts); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		ts.TournamentID = tournamentID
		updated, err := s.tournamentMgmtSvc.UpdateTeamStanding(r.Context(), &ts)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)

	default:
		methodNotAllowed(w)
	}
}

// ── Stats ───────────────────────────────────────────────────

func (s *Server) handleTournamentStats(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID string) {
	if r.Method != "GET" {
		methodNotAllowed(w)
		return
	}
	if !requireRole(w, p, tournamentReadRoles...) {
		return
	}
	stats, err := s.tournamentMgmtSvc.GetStats(r.Context(), tournamentID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}

// ── Export CSV ──────────────────────────────────────────────

func (s *Server) handleTournamentExport(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, entity string) {
	if r.Method != "GET" {
		methodNotAllowed(w)
		return
	}
	if !requireRole(w, p, tournamentReadRoles...) {
		return
	}

	var csvContent string
	var filename string

	switch entity {
	case "categories":
		cats, err := s.tournamentMgmtSvc.ListCategories(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		csvContent = tournament.ExportCategoriesToCSV(cats)
		filename = "noi_dung_" + tournamentID + ".csv"

	case "registrations":
		regs, err := s.tournamentMgmtSvc.ListRegistrations(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		csvContent = tournament.ExportRegistrationsToCSV(regs)
		filename = "dang_ky_" + tournamentID + ".csv"

	case "schedule":
		slots, err := s.tournamentMgmtSvc.ListScheduleSlots(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		csvContent = tournament.ExportScheduleToCSV(slots)
		filename = "lich_thi_" + tournamentID + ".csv"

	case "results":
		results, err := s.tournamentMgmtSvc.ListResults(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		csvContent = tournament.ExportResultsToCSV(results)
		filename = "ket_qua_" + tournamentID + ".csv"

	case "standings":
		standings, err := s.tournamentMgmtSvc.GetTeamStandings(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		csvContent = tournament.ExportStandingsToCSV(standings)
		filename = "toan_doan_" + tournamentID + ".csv"

	default:
		badRequest(w, "unknown export entity: "+entity)
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("\xEF\xBB\xBF")) // UTF-8 BOM for Excel
	_, _ = w.Write([]byte(csvContent))
}

// ── Batch Operations ───────────────────────────────────────

func (s *Server) handleTournamentBatch(w http.ResponseWriter, r *http.Request, p auth.Principal, tournamentID, action string) {
	if r.Method != "POST" {
		methodNotAllowed(w)
		return
	}
	if !requireRole(w, p, tournamentWriteRoles...) {
		return
	}

	switch action {
	case "approve-registrations":
		var body struct {
			IDs []string `json:"ids"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		result, err := s.tournamentMgmtSvc.BatchApproveRegistrations(r.Context(), tournamentID, body.IDs, p.User.ID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, result)

	case "reject-registrations":
		var body struct {
			IDs    []string `json:"ids"`
			Reason string   `json:"reason"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		result, err := s.tournamentMgmtSvc.BatchRejectRegistrations(r.Context(), tournamentID, body.IDs, p.User.ID, body.Reason)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, result)

	case "finalize-results":
		var body struct {
			IDs []string `json:"ids"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid JSON")
			return
		}
		result, err := s.tournamentMgmtSvc.BatchFinalizeResults(r.Context(), tournamentID, body.IDs, p.User.ID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, result)

	case "recalculate-standings":
		standings, err := s.tournamentMgmtSvc.RecalculateTeamStandings(r.Context(), tournamentID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"standings": standings, "total": len(standings)})

	default:
		badRequest(w, "unknown batch action: "+action)
	}
}
