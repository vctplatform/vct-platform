package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/athlete"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE PROFILE HTTP HANDLER
// REST endpoints for athlete profile, club membership,
// and tournament entry management.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleAthleteProfileRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/athlete-profiles/me", s.withAuth(s.handleAthleteProfileMe))
	mux.HandleFunc("/api/v1/athlete-profiles/stats", s.withAuth(s.handleAthleteProfileStats))
	mux.HandleFunc("/api/v1/athlete-profiles/search", s.withAuth(s.handleAthleteProfileSearch))
	mux.HandleFunc("/api/v1/athlete-profiles/", s.withAuth(s.handleAthleteProfileByID))
	mux.HandleFunc("/api/v1/athlete-profiles", s.withAuth(s.handleAthleteProfileList))
	mux.HandleFunc("/api/v1/club-memberships/", s.withAuth(s.handleClubMembershipByID))
	mux.HandleFunc("/api/v1/club-memberships", s.withAuth(s.handleClubMembershipList))
	mux.HandleFunc("/api/v1/tournament-entries/", s.withAuth(s.handleTournamentEntryByID))
	mux.HandleFunc("/api/v1/tournament-entries", s.withAuth(s.handleTournamentEntryList))
	mux.HandleFunc("/api/v1/training-sessions/stats", s.withAuth(s.handleTrainingSessionStats))
	mux.HandleFunc("/api/v1/training-sessions/", s.withAuth(s.handleTrainingSessionByID))
	mux.HandleFunc("/api/v1/training-sessions", s.withAuth(s.handleTrainingSessionList))
}

// ── Profile List/Create ──────────────────────────────────────

func (s *Server) handleAthleteProfileList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		clubID := r.URL.Query().Get("clubId")
		var list []athlete.AthleteProfile
		var err error
		if clubID != "" {
			list, err = s.Extended.AthleteProfile.ListByClub(r.Context(), clubID)
		} else {
			list, err = s.Extended.AthleteProfile.ListProfiles(r.Context())
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.AthleteProfile
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Extended.AthleteProfile.CreateProfile(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Profile Me (current user) ────────────────────────────────

func (s *Server) handleAthleteProfileMe(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	profile, err := s.Extended.AthleteProfile.GetByUserID(r.Context(), p.User.ID)
	if err != nil {
		apiError(w, http.StatusNotFound, CodeNotFound, "athlete profile not found for current user")
		return
	}
	success(w, http.StatusOK, profile)
}

// ── Profile By ID + Sub-resources ────────────────────────────

func (s *Server) handleAthleteProfileByID(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/athlete-profiles/")
	parts := strings.SplitN(path, "/", 2)
	id := parts[0]

	// Sub-resource routing: /athlete-profiles/:id/clubs or /athlete-profiles/:id/tournaments
	if len(parts) == 2 {
		subResource := parts[1]
		switch {
		case subResource == "clubs" || strings.HasPrefix(subResource, "clubs"):
			s.handleProfileClubs(w, r, p, id)
			return
		case subResource == "tournaments" || strings.HasPrefix(subResource, "tournaments"):
			s.handleProfileTournaments(w, r, p, id)
			return
		}
	}

	switch r.Method {
	case http.MethodGet:
		profile, err := s.Extended.AthleteProfile.GetProfile(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
			return
		}
		success(w, http.StatusOK, profile)

	case http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Extended.AthleteProfile.UpdateProfile(r.Context(), id, patch); err != nil {
			apiInternal(w, err)
			return
		}
		profile, _ := s.Extended.AthleteProfile.GetProfile(r.Context(), id)
		success(w, http.StatusOK, profile)

	case http.MethodDelete:
		if err := s.Extended.AthleteProfile.DeleteProfile(r.Context(), id); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Profile → Clubs Sub-resource ─────────────────────────────

func (s *Server) handleProfileClubs(w http.ResponseWriter, r *http.Request, _ auth.Principal, athleteID string) {
	switch r.Method {
	case http.MethodGet:
		list, err := s.Extended.AthleteProfile.ListMyClubs(r.Context(), athleteID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.ClubMembership
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		payload.AthleteID = athleteID
		created, err := s.Extended.AthleteProfile.JoinClub(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Profile → Tournaments Sub-resource ───────────────────────

func (s *Server) handleProfileTournaments(w http.ResponseWriter, r *http.Request, _ auth.Principal, athleteID string) {
	switch r.Method {
	case http.MethodGet:
		list, err := s.Extended.AthleteProfile.ListMyTournaments(r.Context(), athleteID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.TournamentEntry
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		payload.AthleteID = athleteID
		created, err := s.Extended.AthleteProfile.EnterTournament(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Club Membership CRUD ─────────────────────────────────────

func (s *Server) handleClubMembershipList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		athleteID := r.URL.Query().Get("athleteId")
		clubID := r.URL.Query().Get("clubId")
		var list []athlete.ClubMembership
		var err error
		if athleteID != "" {
			list, err = s.Extended.AthleteProfile.ListMyClubs(r.Context(), athleteID)
		} else if clubID != "" {
			list, err = s.Extended.AthleteProfile.ListClubMembers(r.Context(), clubID)
		} else {
			// Return all — admin view
			list, err = s.Extended.AthleteProfile.ListMyClubs(r.Context(), "")
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		if list == nil {
			list = []athlete.ClubMembership{}
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.ClubMembership
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Extended.AthleteProfile.JoinClub(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubMembershipByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club-memberships/")

	switch r.Method {
	case http.MethodGet:
		m, err := s.Extended.AthleteProfile.ListMyClubs(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
			return
		}
		success(w, http.StatusOK, m)

	case http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Extended.AthleteProfile.UpdateMembership(r.Context(), id, patch); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		if err := s.Extended.AthleteProfile.LeaveClub(r.Context(), id); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Tournament Entry CRUD ────────────────────────────────────

func (s *Server) handleTournamentEntryList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		athleteID := r.URL.Query().Get("athleteId")
		tournamentID := r.URL.Query().Get("tournamentId")
		var list []athlete.TournamentEntry
		var err error
		if athleteID != "" {
			list, err = s.Extended.AthleteProfile.ListMyTournaments(r.Context(), athleteID)
		} else if tournamentID != "" {
			list, err = s.Extended.AthleteProfile.ListByTournament(r.Context(), tournamentID)
		} else {
			list, err = s.Extended.AthleteProfile.ListMyTournaments(r.Context(), "")
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		if list == nil {
			list = []athlete.TournamentEntry{}
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.TournamentEntry
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Extended.AthleteProfile.EnterTournament(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleTournamentEntryByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/tournament-entries/")

	switch r.Method {
	case http.MethodGet:
		entry, err := s.Extended.AthleteProfile.GetEntry(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
			return
		}
		success(w, http.StatusOK, entry)

	case http.MethodPatch:
		var body struct {
			Status string `json:"status"`
			Notes  string `json:"notes,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if body.Status != "" {
			switch body.Status {
			case "approve":
				if err := s.Extended.AthleteProfile.ApproveEntry(r.Context(), id); err != nil {
					apiInternal(w, err)
					return
				}
			case "reject":
				if err := s.Extended.AthleteProfile.RejectEntry(r.Context(), id); err != nil {
					apiInternal(w, err)
					return
				}
			default:
				if err := s.Extended.AthleteProfile.UpdateEntryStatus(r.Context(), id, athlete.EntryStatus(body.Status)); err != nil {
					apiInternal(w, err)
					return
				}
			}
		}
		entry, _ := s.Extended.AthleteProfile.GetEntry(r.Context(), id)
		success(w, http.StatusOK, entry)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// ── Stats Endpoint ───────────────────────────────────────────

func (s *Server) handleAthleteProfileStats(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	stats, err := s.Extended.AthleteProfile.GetStats(r.Context())
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}

// ── Search Endpoint ──────────────────────────────────────────

func (s *Server) handleAthleteProfileSearch(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query().Get("q")
	list, err := s.Extended.AthleteProfile.SearchProfiles(r.Context(), query)
	if err != nil {
		apiInternal(w, err)
		return
	}
	if list == nil {
		list = []athlete.AthleteProfile{}
	}
	success(w, http.StatusOK, list)
}

// ── Training Session Handlers ───────────────────────────────────

func (s *Server) handleTrainingSessionList(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case http.MethodGet:
		athleteID := r.URL.Query().Get("athleteId")
		var list []athlete.TrainingSession
		var err error
		if athleteID != "" {
			list, err = s.Extended.TrainingSession.ListByAthlete(r.Context(), athleteID)
		} else {
			list = []athlete.TrainingSession{}
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		if list == nil {
			list = []athlete.TrainingSession{}
		}
		success(w, http.StatusOK, list)

	case http.MethodPost:
		var payload athlete.TrainingSession
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Extended.TrainingSession.CreateSession(r.Context(), payload)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleTrainingSessionByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/training-sessions/")
	if id == "" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "missing session id")
		return
	}

	switch r.Method {
	case http.MethodGet:
		sess, err := s.Extended.TrainingSession.GetSession(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, err.Error())
			return
		}
		success(w, http.StatusOK, sess)

	case http.MethodPatch:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Extended.TrainingSession.UpdateSession(r.Context(), id, patch); err != nil {
			apiInternal(w, err)
			return
		}
		sess, _ := s.Extended.TrainingSession.GetSession(r.Context(), id)
		success(w, http.StatusOK, sess)

	case http.MethodDelete:
		if err := s.Extended.TrainingSession.DeleteSession(r.Context(), id); err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusNoContent, nil)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleTrainingSessionStats(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	athleteID := r.URL.Query().Get("athleteId")
	if athleteID == "" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "athleteId query parameter is required")
		return
	}
	stats, err := s.Extended.TrainingSession.GetAttendanceStats(r.Context(), athleteID)
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}
