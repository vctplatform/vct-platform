package httpapi

import (
	"net/http"

	"vct-platform/backend/internal/auth"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET & TOURNAMENT API HANDLERS
// ═══════════════════════════════════════════════════════════════

// ── Bracket ──────────────────────────────────────────────────

// handleBracketGenerate handles POST /api/v1/tournaments-action/generate-bracket
func (s *Server) handleBracketGenerate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "bracket_generate handler registered",
	})
}

// handleBracketGet handles GET /api/v1/tournaments-action/brackets
func (s *Server) handleBracketGet(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "bracket_get handler registered",
	})
}

// ── Tournament Orchestrated Actions ──────────────────────────

// handleTournamentOpenRegistration handles POST /api/v1/tournaments-action/open-registration
func (s *Server) handleTournamentOpenRegistration(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "open_registration handler registered",
	})
}

// handleTournamentLockRegistration handles POST /api/v1/tournaments-action/lock-registration
func (s *Server) handleTournamentLockRegistration(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "lock_registration handler registered",
	})
}

// handleTournamentStart handles POST /api/v1/tournaments-action/start
func (s *Server) handleTournamentStart(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "tournament_start handler registered",
	})
}

// handleTournamentEnd handles POST /api/v1/tournaments-action/end
func (s *Server) handleTournamentEnd(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "tournament_end handler registered",
	})
}

// ── Registration Validation ──────────────────────────────────

// handleRegistrationValidate handles POST /api/v1/registrations/validate
func (s *Server) handleRegistrationValidate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "registration_validate handler registered",
	})
}

// ── Team Approval ────────────────────────────────────────────

// handleTeamApprove handles POST /api/v1/teams-action/approve
func (s *Server) handleTeamApprove(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "team_approve handler registered",
	})
}

// handleTeamReject handles POST /api/v1/teams-action/reject
func (s *Server) handleTeamReject(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "team_reject handler registered",
	})
}

// handleTeamCheckin handles POST /api/v1/teams-action/checkin
func (s *Server) handleTeamCheckin(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "team_checkin handler registered",
	})
}

// ── Results & Medals ─────────────────────────────────────────

// handleAssignMedals handles POST /api/v1/brackets/{id}/medals
func (s *Server) handleAssignMedals(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "assign_medals handler registered",
	})
}
