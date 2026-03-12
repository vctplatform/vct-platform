package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/club"
)

// handleClubV2Routes registers the new comprehensive club endpoints.
func (s *Server) handleClubV2Routes(mux *http.ServeMux) {
	// Dashboard
	mux.HandleFunc("/api/v1/club/dashboard", s.withAuth(s.handleClubDashboardV2))
	// Attendance
	mux.HandleFunc("/api/v1/club/attendance/summary", s.withAuth(s.handleClubAttendanceSummary))
	mux.HandleFunc("/api/v1/club/attendance/export", s.withAuth(s.handleClubAttendanceExport))
	mux.HandleFunc("/api/v1/club/attendance/bulk", s.withAuth(s.handleClubAttendanceBulk))
	mux.HandleFunc("/api/v1/club/attendance/", s.withAuth(s.handleClubAttendanceAction))
	mux.HandleFunc("/api/v1/club/attendance", s.withAuth(s.handleClubAttendance))
	// Equipment
	mux.HandleFunc("/api/v1/club/equipment/summary", s.withAuth(s.handleClubEquipmentSummary))
	mux.HandleFunc("/api/v1/club/equipment/export", s.withAuth(s.handleClubEquipmentExport))
	mux.HandleFunc("/api/v1/club/equipment/", s.withAuth(s.handleClubEquipmentAction))
	mux.HandleFunc("/api/v1/club/equipment", s.withAuth(s.handleClubEquipment))
	// Facilities
	mux.HandleFunc("/api/v1/club/facilities/summary", s.withAuth(s.handleClubFacilitySummary))
	mux.HandleFunc("/api/v1/club/facilities/export", s.withAuth(s.handleClubFacilitiesExport))
	mux.HandleFunc("/api/v1/club/facilities/", s.withAuth(s.handleClubFacilityAction))
	mux.HandleFunc("/api/v1/club/facilities", s.withAuth(s.handleClubFacilities))
}

func clubIDFromQuery(r *http.Request) string {
	id := r.URL.Query().Get("club_id")
	if id == "" {
		return "CLB-001"
	}
	return id
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Server) handleClubDashboardV2(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	d, err := s.clubSvc.GetDashboard(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": d})
}

// ── Attendance ───────────────────────────────────────────────

func (s *Server) handleClubAttendance(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := clubIDFromQuery(r)

	switch r.Method {
	case http.MethodGet:
		if !requireRole(w, p, clubReadRoles...) {
			return
		}
		classID := r.URL.Query().Get("class_id")
		date := r.URL.Query().Get("date")

		var records []club.Attendance
		var err error
		if date != "" {
			records, err = s.clubSvc.ListAttendanceByDate(r.Context(), clubID, date)
		} else if classID != "" {
			records, err = s.clubSvc.ListAttendanceByClass(r.Context(), clubID, classID)
		} else {
			records, err = s.clubSvc.ListAttendance(r.Context(), clubID)
		}
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"records": records, "total": len(records)}})

	case http.MethodPost:
		if !requireRole(w, p, clubWriteRoles...) {
			return
		}
		var a club.Attendance
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if a.ClubID == "" {
			a.ClubID = clubID
		}
		created, err := s.clubSvc.RecordAttendance(r.Context(), a)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubAttendanceAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireRole(w, p, clubWriteRoles...) {
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club/attendance/")

	switch r.Method {
	case http.MethodDelete:
		if err := s.clubSvc.DeleteAttendance(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubAttendanceSummary(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	summary, err := s.clubSvc.GetAttendanceSummary(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": summary})
}

func (s *Server) handleClubAttendanceBulk(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubWriteRoles...) {
		return
	}
	var body struct {
		Records []club.Attendance `json:"records"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		badRequest(w, "invalid request body")
		return
	}
	clubID := clubIDFromQuery(r)
	for i := range body.Records {
		if body.Records[i].ClubID == "" {
			body.Records[i].ClubID = clubID
		}
	}
	created, err := s.clubSvc.BulkRecordAttendance(r.Context(), body.Records)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	success(w, http.StatusCreated, map[string]any{"data": map[string]any{"created": len(created), "records": created}})
}

func (s *Server) handleClubAttendanceExport(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	csv, err := s.clubSvc.ExportAttendanceCSV(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=attendance.csv")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(csv))
}

// ── Equipment ────────────────────────────────────────────────

func (s *Server) handleClubEquipment(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := clubIDFromQuery(r)

	switch r.Method {
	case http.MethodGet:
		if !requireRole(w, p, clubReadRoles...) {
			return
		}
		items, err := s.clubSvc.ListEquipment(r.Context(), clubID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"items": items, "total": len(items)}})

	case http.MethodPost:
		if !requireRole(w, p, clubWriteRoles...) {
			return
		}
		var e club.Equipment
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if e.ClubID == "" {
			e.ClubID = clubID
		}
		created, err := s.clubSvc.CreateEquipment(r.Context(), e)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubEquipmentAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club/equipment/")

	switch r.Method {
	case http.MethodGet:
		e, err := s.clubSvc.GetEquipment(r.Context(), id)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": e})

	case http.MethodPut:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			badRequest(w, "invalid body")
			return
		}
		if err := s.clubSvc.UpdateEquipment(r.Context(), id, patch); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if err := s.clubSvc.DeleteEquipment(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubEquipmentSummary(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	summary, err := s.clubSvc.GetEquipmentSummary(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": summary})
}

func (s *Server) handleClubEquipmentExport(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	csv, err := s.clubSvc.ExportEquipmentCSV(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=equipment.csv")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(csv))
}

// ── Facilities ───────────────────────────────────────────────

func (s *Server) handleClubFacilities(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	clubID := clubIDFromQuery(r)

	switch r.Method {
	case http.MethodGet:
		if !requireRole(w, p, clubReadRoles...) {
			return
		}
		items, err := s.clubSvc.ListFacilities(r.Context(), clubID)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": map[string]any{"items": items, "total": len(items)}})

	case http.MethodPost:
		if !requireRole(w, p, clubWriteRoles...) {
			return
		}
		var f club.Facility
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if f.ClubID == "" {
			f.ClubID = clubID
		}
		created, err := s.clubSvc.CreateFacility(r.Context(), f)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]any{"data": created})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubFacilityAction(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/club/facilities/")

	switch r.Method {
	case http.MethodGet:
		f, err := s.clubSvc.GetFacility(r.Context(), id)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{"data": f})

	case http.MethodPut:
		var patch map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			badRequest(w, "invalid body")
			return
		}
		if err := s.clubSvc.UpdateFacility(r.Context(), id, patch); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "updated"})

	case http.MethodDelete:
		if err := s.clubSvc.DeleteFacility(r.Context(), id); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"message": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleClubFacilitySummary(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	summary, err := s.clubSvc.GetFacilitySummary(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"data": summary})
}

func (s *Server) handleClubFacilitiesExport(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireRole(w, p, clubReadRoles...) {
		return
	}
	csv, err := s.clubSvc.ExportFacilitiesCSV(r.Context(), clubIDFromQuery(r))
	if err != nil {
		internalError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=facilities.csv")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(csv))
}
