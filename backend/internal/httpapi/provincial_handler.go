package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/provincial"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL API HANDLERS
// Provincial-level management: dashboard, clubs, athletes,
// coaches, referees, committee, transfers.
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleProvincialRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/provincial/dashboard", s.withAuth(s.handleProvincialDashboard))
	mux.HandleFunc("/api/v1/provincial/associations/", s.withAuth(s.handleProvincialAssociations))
	mux.HandleFunc("/api/v1/provincial/associations", s.withAuth(s.handleProvincialAssociations))
	mux.HandleFunc("/api/v1/provincial/sub-associations/", s.withAuth(s.handleProvincialSubAssociations))
	mux.HandleFunc("/api/v1/provincial/sub-associations", s.withAuth(s.handleProvincialSubAssociations))
	mux.HandleFunc("/api/v1/provincial/clubs/", s.withAuth(s.handleProvincialClubs))
	mux.HandleFunc("/api/v1/provincial/clubs", s.withAuth(s.handleProvincialClubs))
	mux.HandleFunc("/api/v1/provincial/athletes/", s.withAuth(s.handleProvincialAthletes))
	mux.HandleFunc("/api/v1/provincial/athletes", s.withAuth(s.handleProvincialAthletes))
	mux.HandleFunc("/api/v1/provincial/coaches/", s.withAuth(s.handleProvincialCoaches))
	mux.HandleFunc("/api/v1/provincial/coaches", s.withAuth(s.handleProvincialCoaches))
	mux.HandleFunc("/api/v1/provincial/referees/", s.withAuth(s.handleProvincialReferees))
	mux.HandleFunc("/api/v1/provincial/referees", s.withAuth(s.handleProvincialReferees))
	mux.HandleFunc("/api/v1/provincial/committee/", s.withAuth(s.handleProvincialCommittee))
	mux.HandleFunc("/api/v1/provincial/committee", s.withAuth(s.handleProvincialCommittee))
	mux.HandleFunc("/api/v1/provincial/transfers/", s.withAuth(s.handleProvincialTransfers))
	mux.HandleFunc("/api/v1/provincial/transfers", s.withAuth(s.handleProvincialTransfers))
	mux.HandleFunc("/api/v1/provincial/vo-sinh/", s.withAuth(s.handleProvincialVoSinh))
	mux.HandleFunc("/api/v1/provincial/vo-sinh", s.withAuth(s.handleProvincialVoSinh))
}

// resolveProvinceID extracts province scope from user context.
// In production, this would come from the JWT/scope. For now, defaults to query param or "PROV-HCM".
func resolveProvinceID(r *http.Request) string {
	if prov := r.URL.Query().Get("province_id"); prov != "" {
		return prov
	}
	return "PROV-HCM"
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Server) handleProvincialDashboard(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	provID := resolveProvinceID(r)
	stats, err := s.provincialSvc.GetDashboard(r.Context(), provID)
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}

// ── Clubs ────────────────────────────────────────────────────

func (s *Server) handleProvincialClubs(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/clubs")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		clubs, err := s.provincialSvc.ListClubs(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"clubs": clubs, "total": len(clubs)})

	case r.Method == "POST" && id == "":
		var club provincial.ProvincialClub
		if err := json.NewDecoder(r.Body).Decode(&club); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if club.ProvinceID == "" {
			club.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateClub(r.Context(), club)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		club, err := s.provincialSvc.GetClub(r.Context(), id)
		if err != nil {
			notFoundError(w, "club not found")
			return
		}
		success(w, http.StatusOK, club)

	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveClub(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if err := s.provincialSvc.SuspendClub(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Athletes ─────────────────────────────────────────────────

func (s *Server) handleProvincialAthletes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/athletes")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		clubID := r.URL.Query().Get("club_id")
		if clubID != "" {
			athletes, err := s.provincialSvc.ListAthletesByClub(r.Context(), clubID)
			if err != nil {
				internalError(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})
			return
		}
		provID := resolveProvinceID(r)
		athletes, err := s.provincialSvc.ListAthletes(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})

	case r.Method == "POST" && id == "":
		var athlete provincial.ProvincialAthlete
		if err := json.NewDecoder(r.Body).Decode(&athlete); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if athlete.ProvinceID == "" {
			athlete.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateAthlete(r.Context(), athlete)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		athlete, err := s.provincialSvc.GetAthlete(r.Context(), id)
		if err != nil {
			notFoundError(w, "athlete not found")
			return
		}
		success(w, http.StatusOK, athlete)

	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveAthlete(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Võ Sinh ──────────────────────────────────────────────────

func (s *Server) handleProvincialVoSinh(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/vo-sinh")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	// GET /vo-sinh/stats
	case r.Method == "GET" && id == "stats":
		provID := resolveProvinceID(r)
		stats, err := s.provincialSvc.GetVoSinhStats(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, stats)

	// GET /vo-sinh (list)
	case r.Method == "GET" && id == "":
		clubID := r.URL.Query().Get("club_id")
		if clubID != "" {
			list, err := s.provincialSvc.ListVoSinhByClub(r.Context(), clubID)
			if err != nil {
				internalError(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"vo_sinh": list, "total": len(list)})
			return
		}
		provID := resolveProvinceID(r)
		list, err := s.provincialSvc.ListVoSinh(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"vo_sinh": list, "total": len(list)})

	// POST /vo-sinh (create)
	case r.Method == "POST" && id == "":
		var vs provincial.VoSinh
		if err := json.NewDecoder(r.Body).Decode(&vs); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if vs.ProvinceID == "" {
			vs.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateVoSinh(r.Context(), vs)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	// GET /vo-sinh/{id}
	case r.Method == "GET" && id != "" && action == "":
		vs, err := s.provincialSvc.GetVoSinh(r.Context(), id)
		if err != nil {
			notFoundError(w, "võ sinh not found")
			return
		}
		success(w, http.StatusOK, vs)

	// POST /vo-sinh/{id}/approve
	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveVoSinh(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Coaches ──────────────────────────────────────────────────

func (s *Server) handleProvincialCoaches(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/coaches")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		coaches, err := s.provincialSvc.ListCoaches(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"coaches": coaches, "total": len(coaches)})

	case r.Method == "POST" && id == "":
		var coach provincial.ProvincialCoach
		if err := json.NewDecoder(r.Body).Decode(&coach); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if coach.ProvinceID == "" {
			coach.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateCoach(r.Context(), coach)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		coach, err := s.provincialSvc.GetCoach(r.Context(), id)
		if err != nil {
			notFoundError(w, "coach not found")
			return
		}
		success(w, http.StatusOK, coach)

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Referees ─────────────────────────────────────────────────

func (s *Server) handleProvincialReferees(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/referees")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		referees, err := s.provincialSvc.ListReferees(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"referees": referees, "total": len(referees)})

	case r.Method == "POST" && id == "":
		var ref provincial.ProvincialReferee
		if err := json.NewDecoder(r.Body).Decode(&ref); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if ref.ProvinceID == "" {
			ref.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateReferee(r.Context(), ref)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		ref, err := s.provincialSvc.GetReferee(r.Context(), id)
		if err != nil {
			notFoundError(w, "referee not found")
			return
		}
		success(w, http.StatusOK, ref)

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Committee ────────────────────────────────────────────────

func (s *Server) handleProvincialCommittee(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/committee")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		members, err := s.provincialSvc.ListCommittee(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"committee": members, "total": len(members)})

	case r.Method == "POST" && id == "":
		var member provincial.CommitteeMember
		if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if member.ProvinceID == "" {
			member.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.AddCommitteeMember(r.Context(), member)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		member, err := s.provincialSvc.GetCommitteeMember(r.Context(), id)
		if err != nil {
			notFoundError(w, "member not found")
			return
		}
		success(w, http.StatusOK, member)

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Transfers ────────────────────────────────────────────────

func (s *Server) handleProvincialTransfers(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/transfers")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		transfers, err := s.provincialSvc.ListTransfers(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"transfers": transfers, "total": len(transfers)})

	case r.Method == "POST" && id == "":
		var transfer provincial.ClubTransfer
		if err := json.NewDecoder(r.Body).Decode(&transfer); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if transfer.ProvinceID == "" {
			transfer.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.RequestTransfer(r.Context(), transfer)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveTransfer(r.Context(), id, p.User.ID); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "reject":
		if err := s.provincialSvc.RejectTransfer(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "rejected"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Associations (Hội Quận/Huyện) ────────────────────────────

func (s *Server) handleProvincialAssociations(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/associations")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		provID := resolveProvinceID(r)
		associations, err := s.provincialSvc.ListAssociations(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"associations": associations, "total": len(associations)})

	case r.Method == "POST" && id == "":
		var assoc provincial.Association
		if err := json.NewDecoder(r.Body).Decode(&assoc); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if assoc.ProvinceID == "" {
			assoc.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateAssociation(r.Context(), assoc)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		assoc, err := s.provincialSvc.GetAssociation(r.Context(), id)
		if err != nil {
			notFoundError(w, "association not found")
			return
		}
		success(w, http.StatusOK, assoc)

	case r.Method == "GET" && id != "" && action == "dashboard":
		stats, err := s.provincialSvc.GetAssociationDashboard(r.Context(), id)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, stats)

	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveAssociation(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if err := s.provincialSvc.SuspendAssociation(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

// ── Sub-Associations (Chi hội Phường/Xã) ─────────────────────

func (s *Server) handleProvincialSubAssociations(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/sub-associations")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		assocID := r.URL.Query().Get("association_id")
		if assocID != "" {
			subAssocs, err := s.provincialSvc.ListSubAssociationsByAssociation(r.Context(), assocID)
			if err != nil {
				internalError(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"sub_associations": subAssocs, "total": len(subAssocs)})
			return
		}
		provID := resolveProvinceID(r)
		subAssocs, err := s.provincialSvc.ListSubAssociations(r.Context(), provID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"sub_associations": subAssocs, "total": len(subAssocs)})

	case r.Method == "POST" && id == "":
		var sa provincial.SubAssociation
		if err := json.NewDecoder(r.Body).Decode(&sa); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if sa.ProvinceID == "" {
			sa.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.provincialSvc.CreateSubAssociation(r.Context(), sa)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		sa, err := s.provincialSvc.GetSubAssociation(r.Context(), id)
		if err != nil {
			notFoundError(w, "sub-association not found")
			return
		}
		success(w, http.StatusOK, sa)

	case r.Method == "POST" && action == "approve":
		if err := s.provincialSvc.ApproveSubAssociation(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if err := s.provincialSvc.SuspendSubAssociation(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}
