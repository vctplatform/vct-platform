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

func (s *Server) handleProvincialDashboard(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireProvincialRead(w, p) {
		return
	}
	provID := resolveProvinceID(r)
	stats, err := s.Provincial.Main.GetDashboard(r.Context(), provID)
	if err != nil {
		apiInternal(w, err)
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
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		clubs, err := s.Provincial.Main.ListClubs(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"clubs": clubs, "total": len(clubs)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var club provincial.ProvincialClub
		if err := json.NewDecoder(r.Body).Decode(&club); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if club.ProvinceID == "" {
			club.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateClub(r.Context(), club)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		club, err := s.Provincial.Main.GetClub(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "club not found")
			return
		}
		success(w, http.StatusOK, club)

	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveClub(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.SuspendClub(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
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
		if !requireProvincialRead(w, p) {
			return
		}
		clubID := r.URL.Query().Get("club_id")
		if clubID != "" {
			athletes, err := s.Provincial.Main.ListAthletesByClub(r.Context(), clubID)
			if err != nil {
				apiInternal(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})
			return
		}
		provID := resolveProvinceID(r)
		athletes, err := s.Provincial.Main.ListAthletes(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"athletes": athletes, "total": len(athletes)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var athlete provincial.ProvincialAthlete
		if err := json.NewDecoder(r.Body).Decode(&athlete); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if athlete.ProvinceID == "" {
			athlete.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateAthlete(r.Context(), athlete)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		athlete, err := s.Provincial.Main.GetAthlete(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "athlete not found")
			return
		}
		success(w, http.StatusOK, athlete)

	// PATCH /athletes/{id} (update)
	case (r.Method == "PATCH" || r.Method == "PUT") && id != "" && action == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Provincial.Main.UpdateAthlete(r.Context(), id, patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "updated"})

	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveAthlete(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	// POST /athletes/{id}/deactivate
	case r.Method == "POST" && action == "deactivate":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeactivateAthlete(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "inactive"})

	// POST /athletes/{id}/reactivate
	case r.Method == "POST" && action == "reactivate":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ReactivateAthlete(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "active"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
	}
}

// ── Võ Sinh ──────────────────────────────────────────────────

func (s *Server) handleProvincialVoSinh(w http.ResponseWriter, r *http.Request, p auth.Principal) {
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
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		stats, err := s.Provincial.Main.GetVoSinhStats(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, stats)

	// GET /vo-sinh (list)
	case r.Method == "GET" && id == "":
		if !requireProvincialRead(w, p) {
			return
		}
		clubID := r.URL.Query().Get("club_id")
		if clubID != "" {
			list, err := s.Provincial.Main.ListVoSinhByClub(r.Context(), clubID)
			if err != nil {
				apiInternal(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"vo_sinh": list, "total": len(list)})
			return
		}
		provID := resolveProvinceID(r)
		list, err := s.Provincial.Main.ListVoSinh(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"vo_sinh": list, "total": len(list)})

	// POST /vo-sinh (create)
	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var vs provincial.VoSinh
		if err := json.NewDecoder(r.Body).Decode(&vs); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if vs.ProvinceID == "" {
			vs.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateVoSinh(r.Context(), vs)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	// GET /vo-sinh/{id}
	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		vs, err := s.Provincial.Main.GetVoSinh(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "võ sinh not found")
			return
		}
		success(w, http.StatusOK, vs)

	// POST /vo-sinh/{id}/approve
	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveVoSinh(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	// POST /vo-sinh/{id}/deactivate
	case r.Method == "POST" && action == "deactivate":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeactivateVoSinh(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "inactive"})

	// POST /vo-sinh/{id}/reactivate
	case r.Method == "POST" && action == "reactivate":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ReactivateVoSinh(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "active"})

	// GET /vo-sinh/{id}/belt-history
	case r.Method == "GET" && action == "belt-history":
		if !requireProvincialRead(w, p) {
			return
		}
		hist, err := s.Provincial.Main.ListBeltHistory(r.Context(), id)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"belt_history": hist, "total": len(hist)})

	// PATCH /vo-sinh/{id} (update)
	case (r.Method == "PATCH" || r.Method == "PUT") && id != "" && action == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Provincial.Main.UpdateVoSinh(r.Context(), id, patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		// Return the updated record
		updated, err := s.Provincial.Main.GetVoSinh(r.Context(), id)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, updated)

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
	}
}

// ── Coaches ──────────────────────────────────────────────────

func (s *Server) handleProvincialCoaches(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/coaches")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		coaches, err := s.Provincial.Main.ListCoaches(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"coaches": coaches, "total": len(coaches)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var coach provincial.ProvincialCoach
		if err := json.NewDecoder(r.Body).Decode(&coach); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if coach.ProvinceID == "" {
			coach.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateCoach(r.Context(), coach)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		coach, err := s.Provincial.Main.GetCoach(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "coach not found")
			return
		}
		success(w, http.StatusOK, coach)

	// PATCH /coaches/{id} (update)
	case (r.Method == "PATCH" || r.Method == "PUT") && id != "" && action == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Provincial.Main.UpdateCoach(r.Context(), id, patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "updated"})

	// POST /coaches/{id}/approve
	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveCoach(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	// POST /coaches/{id}/deactivate
	case r.Method == "POST" && action == "deactivate":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeactivateCoach(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "inactive"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
	}
}

// ── Referees ─────────────────────────────────────────────────

func (s *Server) handleProvincialReferees(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/referees")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	// GET /referees/stats
	case r.Method == "GET" && id == "stats":
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		stats, err := s.Provincial.Main.GetRefereeStats(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, stats)

	// GET /referees (list)
	case r.Method == "GET" && id == "":
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		referees, err := s.Provincial.Main.ListReferees(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"referees": referees, "total": len(referees)})

	// POST /referees (create)
	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var ref provincial.ProvincialReferee
		if err := json.NewDecoder(r.Body).Decode(&ref); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if ref.ProvinceID == "" {
			ref.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateReferee(r.Context(), ref)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	// GET /referees/{id}
	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		ref, err := s.Provincial.Main.GetReferee(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "referee not found")
			return
		}
		success(w, http.StatusOK, ref)

	// PATCH /referees/{id} (update)
	case (r.Method == "PATCH" || r.Method == "PUT") && id != "" && action == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Provincial.Main.UpdateReferee(r.Context(), id, patch); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "updated"})

	// DELETE /referees/{id}
	case r.Method == "DELETE" && id != "":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.DeleteReferee(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusNoContent, nil)

	// POST /referees/{id}/approve
	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveReferee(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	// POST /referees/{id}/reject
	case r.Method == "POST" && action == "reject":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.RejectReferee(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "rejected"})

	// GET /referees/{id}/certificates
	case r.Method == "GET" && action == "certificates":
		if !requireProvincialRead(w, p) {
			return
		}
		certs, err := s.Provincial.Main.ListRefereeCertificates(r.Context(), id)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"certificates": certs, "total": len(certs)})

	// POST /referees/{id}/certificates
	case r.Method == "POST" && action == "certificates":
		if !requireProvincialWrite(w, p) {
			return
		}
		var cert provincial.RefereeCertificate
		if err := json.NewDecoder(r.Body).Decode(&cert); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		cert.RefereeID = id
		created, err := s.Provincial.Main.CreateRefereeCertificate(r.Context(), cert)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
	}
}

// ── Committee ────────────────────────────────────────────────

func (s *Server) handleProvincialCommittee(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/provincial/committee")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		members, err := s.Provincial.Main.ListCommittee(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"committee": members, "total": len(members)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var member provincial.CommitteeMember
		if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if member.ProvinceID == "" {
			member.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.AddCommitteeMember(r.Context(), member)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		if !requireProvincialRead(w, p) {
			return
		}
		member, err := s.Provincial.Main.GetCommitteeMember(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "member not found")
			return
		}
		success(w, http.StatusOK, member)

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
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
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		transfers, err := s.Provincial.Main.ListTransfers(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"transfers": transfers, "total": len(transfers)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var transfer provincial.ClubTransfer
		if err := json.NewDecoder(r.Body).Decode(&transfer); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if transfer.ProvinceID == "" {
			transfer.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.RequestTransfer(r.Context(), transfer)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveTransfer(r.Context(), id, p.User.ID); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "reject":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.RejectTransfer(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "rejected"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
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
		if !requireProvincialRead(w, p) {
			return
		}
		provID := resolveProvinceID(r)
		associations, err := s.Provincial.Main.ListAssociations(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"associations": associations, "total": len(associations)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var assoc provincial.Association
		if err := json.NewDecoder(r.Body).Decode(&assoc); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if assoc.ProvinceID == "" {
			assoc.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateAssociation(r.Context(), assoc)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		assoc, err := s.Provincial.Main.GetAssociation(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "association not found")
			return
		}
		success(w, http.StatusOK, assoc)

	case r.Method == "GET" && id != "" && action == "dashboard":
		if !requireProvincialRead(w, p) {
			return
		}
		stats, err := s.Provincial.Main.GetAssociationDashboard(r.Context(), id)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, stats)

	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveAssociation(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.SuspendAssociation(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
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
		if !requireProvincialRead(w, p) {
			return
		}
		assocID := r.URL.Query().Get("association_id")
		if assocID != "" {
			subAssocs, err := s.Provincial.Main.ListSubAssociationsByAssociation(r.Context(), assocID)
			if err != nil {
				apiInternal(w, err)
				return
			}
			success(w, http.StatusOK, map[string]any{"sub_associations": subAssocs, "total": len(subAssocs)})
			return
		}
		provID := resolveProvinceID(r)
		subAssocs, err := s.Provincial.Main.ListSubAssociations(r.Context(), provID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"sub_associations": subAssocs, "total": len(subAssocs)})

	case r.Method == "POST" && id == "":
		if !requireProvincialWrite(w, p) {
			return
		}
		var sa provincial.SubAssociation
		if err := json.NewDecoder(r.Body).Decode(&sa); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if sa.ProvinceID == "" {
			sa.ProvinceID = resolveProvinceID(r)
		}
		created, err := s.Provincial.Main.CreateSubAssociation(r.Context(), sa)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireProvincialRead(w, p) {
			return
		}
		sa, err := s.Provincial.Main.GetSubAssociation(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "sub-association not found")
			return
		}
		success(w, http.StatusOK, sa)

	case r.Method == "POST" && action == "approve":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.ApproveSubAssociation(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "suspend":
		if !requireProvincialWrite(w, p) {
			return
		}
		if err := s.Provincial.Main.SuspendSubAssociation(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "suspended"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "Không tìm thấy dữ liệu")
	}
}
