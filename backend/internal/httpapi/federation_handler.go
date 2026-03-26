package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/certification"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION API HANDLERS
// National-level federation, document, discipline, certification
// All handlers now wired to actual domain services.
// ═══════════════════════════════════════════════════════════════

// ── Federation Provinces & Units ─────────────────────────────

func (s *Server) handleFederationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/federation/provinces/", s.withAuth(s.handleFederationProvinceRoutes))
	mux.HandleFunc("/api/v1/federation/provinces", s.withAuth(s.handleFederationProvinceRoutes))
	mux.HandleFunc("/api/v1/federation/units/", s.withAuth(s.handleFederationUnitRoutes))
	mux.HandleFunc("/api/v1/federation/units", s.withAuth(s.handleFederationUnitRoutes))
	mux.HandleFunc("/api/v1/federation/org-chart", s.withAuth(s.handleOrgChart))
	mux.HandleFunc("/api/v1/federation/stats", s.withAuth(s.handleFederationStats))
	mux.HandleFunc("/api/v1/federation/statistics", s.withAuth(s.handleFederationStats))
	mux.HandleFunc("/api/v1/federation/personnel/", s.withAuth(s.handlePersonnelRoutes))
	mux.HandleFunc("/api/v1/federation/personnel", s.withAuth(s.handlePersonnelRoutes))
	// ── Master Data ──
	mux.HandleFunc("/api/v1/federation/master/belts/", s.withAuth(s.handleMasterBeltByID))
	mux.HandleFunc("/api/v1/federation/master/belts", s.withAuth(s.handleMasterBelts))
	mux.HandleFunc("/api/v1/federation/master/weights/", s.withAuth(s.handleMasterWeightByID))
	mux.HandleFunc("/api/v1/federation/master/weights", s.withAuth(s.handleMasterWeights))
	mux.HandleFunc("/api/v1/federation/master/ages/", s.withAuth(s.handleMasterAgeByID))
	mux.HandleFunc("/api/v1/federation/master/ages", s.withAuth(s.handleMasterAges))
	mux.HandleFunc("/api/v1/federation/master/contents/", s.withAuth(s.handleMasterContentByID))
	mux.HandleFunc("/api/v1/federation/master/contents", s.withAuth(s.handleMasterContents))
	// ── Approval Center ──
	mux.HandleFunc("/api/v1/federation/approvals/", s.withAuth(s.handleFederationApprovals))
	mux.HandleFunc("/api/v1/federation/approvals", s.withAuth(s.handleFederationApprovals))
}

func (s *Server) handleFederationProvinceRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/provinces")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		if !requireFederationRead(w, p) {
			return
		}
		params := parsePagination(r)
		region := r.URL.Query().Get("region")

		var provinces []federation.Province
		var err error
		if region != "" {
			provinces, err = s.Federation.Main.ListProvincesByRegion(r.Context(), federation.RegionCode(region))
		} else {
			provinces, err = s.Federation.Main.ListProvinces(r.Context())
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		// Apply search filter
		if params.Search != "" {
			q := strings.ToLower(params.Search)
			var filtered []federation.Province
			for _, pv := range provinces {
				if strings.Contains(strings.ToLower(pv.Name), q) || strings.Contains(strings.ToLower(pv.Code), q) {
					filtered = append(filtered, pv)
				}
			}
			provinces = filtered
		}
		result := federation.Paginate(provinces, params)
		success(w, http.StatusOK, result)

	case r.Method == "POST" && id == "":
		if !requireFederationWrite(w, p) {
			return
		}
		var prov federation.Province
		if err := json.NewDecoder(r.Body).Decode(&prov); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Federation.Main.CreateProvince(r.Context(), prov)
		if err != nil {
			federationValidationError(w, err)
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		if !requireFederationRead(w, p) {
			return
		}
		prov, err := s.Federation.Main.GetProvince(r.Context(), id)
		if err != nil {
			federationNotFound(w, "Tỉnh/TP", id)
			return
		}
		success(w, http.StatusOK, prov)

	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleFederationUnitRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/units")
	id := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET" && id == "":
		if !requireFederationRead(w, p) {
			return
		}
		units, err := s.Federation.Main.ListUnits(r.Context())
		if err != nil {
			apiInternal(w, err)
			return
		}
		params := parsePagination(r)
		result := federation.Paginate(units, params)
		success(w, http.StatusOK, result)

	case r.Method == "POST" && id == "":
		if !requireFederationWrite(w, p) {
			return
		}
		var unit federation.FederationUnit
		if err := json.NewDecoder(r.Body).Decode(&unit); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		created, err := s.Federation.Main.CreateUnit(r.Context(), unit)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "":
		if !requireFederationRead(w, p) {
			return
		}
		unit, err := s.Federation.Main.GetUnit(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "unit not found")
			return
		}
		success(w, http.StatusOK, unit)

	default:
		apiMethodNotAllowed(w)
	}
}

func (s *Server) handleOrgChart(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireFederationRead(w, p) {
		return
	}
	chart, err := s.Federation.Main.BuildOrgChart(r.Context())
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{"root": chart})
}

func (s *Server) handleFederationStats(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireFederationRead(w, p) {
		return
	}
	stats, err := s.Federation.Main.GetNationalStatistics(r.Context())
	if err != nil {
		apiInternal(w, err)
		return
	}
	success(w, http.StatusOK, stats)
}

func (s *Server) handlePersonnelRoutes(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/personnel")
	unitID := strings.TrimPrefix(path, "/")

	switch {
	case r.Method == "GET":
		if !requireFederationRead(w, p) {
			return
		}
		queryUnitID := r.URL.Query().Get("unit_id")
		if unitID == "" {
			unitID = queryUnitID
		}
		list, err := s.Federation.Main.ListPersonnel(r.Context(), unitID)
		if err != nil {
			apiInternal(w, err)
			return
		}
		params := parsePagination(r)
		result := federation.Paginate(list, params)
		success(w, http.StatusOK, result)

	case r.Method == "POST":
		if !requireFederationWrite(w, p) {
			return
		}
		var assign federation.PersonnelAssignment
		if err := json.NewDecoder(r.Body).Decode(&assign); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if err := s.Federation.Main.AssignPersonnel(r.Context(), assign); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "personnel_assigned"})

	default:
		apiMethodNotAllowed(w)
	}
}

// ── Document Management ──────────────────────────────────────

func (s *Server) handleDocumentRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/documents/", s.withAuth(s.handleDocumentCRUD))
	mux.HandleFunc("/api/v1/documents", s.withAuth(s.handleDocumentCRUD))
}

func (s *Server) handleDocumentCRUD(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/documents")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		if !requireFederationRead(w, p) {
			return
		}
		docs, err := s.Federation.Document.ListDocuments(r.Context())
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"documents": docs, "total": len(docs)})

	case r.Method == "POST" && id == "":
		if !requireFederationWrite(w, p) {
			return
		}
		var doc document.OfficialDocument
		if err := json.NewDecoder(r.Body).Decode(&doc); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		doc.IssuedBy = p.User.ID
		created, err := s.Federation.Document.CreateDraft(r.Context(), doc)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireFederationRead(w, p) {
			return
		}
		doc, err := s.Federation.Document.GetDocument(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "document not found")
			return
		}
		success(w, http.StatusOK, doc)

	case r.Method == "POST" && action == "submit":
		if !requireFederationWrite(w, p) {
			return
		}
		if err := s.Federation.Document.SubmitForApproval(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "pending_approval"})

	case r.Method == "POST" && action == "approve":
		if !requireFederationWrite(w, p) {
			return
		}
		if err := s.Federation.Document.Approve(r.Context(), id, p.User.ID, p.User.DisplayName); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && action == "publish":
		if !requireFederationWrite(w, p) {
			return
		}
		if err := s.Federation.Document.Publish(r.Context(), id); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "published"})

	case r.Method == "POST" && action == "revoke":
		if !requireFederationWrite(w, p) {
			return
		}
		var body struct {
			Reason string `json:"reason"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.Federation.Document.Revoke(r.Context(), id, body.Reason); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "revoked"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "endpoint not found")
	}
}

// ── Discipline ───────────────────────────────────────────────

func (s *Server) handleDisciplineRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/discipline/cases/", s.withAuth(s.handleDisciplineCRUD))
	mux.HandleFunc("/api/v1/discipline/cases", s.withAuth(s.handleDisciplineCRUD))
}

func (s *Server) handleDisciplineCRUD(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/discipline/cases")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		if !requireFederationRead(w, p) {
			return
		}
		status := r.URL.Query().Get("status")
		var cases []discipline.DisciplineCase
		var err error
		if status != "" {
			cases, err = s.Federation.Discipline.ListByStatus(r.Context(), discipline.CaseStatus(status))
		} else {
			cases, err = s.Federation.Discipline.ListCases(r.Context())
		}
		if err != nil {
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"cases": cases, "total": len(cases)})

	case r.Method == "POST" && id == "":
		if !requireFederationWrite(w, p) {
			return
		}
		var dc discipline.DisciplineCase
		if err := json.NewDecoder(r.Body).Decode(&dc); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		dc.ReportedBy = p.User.ID
		created, err := s.Federation.Discipline.ReportViolation(r.Context(), dc)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "GET" && id != "" && action == "":
		if !requireFederationRead(w, p) {
			return
		}
		dc, err := s.Federation.Discipline.GetCase(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "case not found")
			return
		}
		success(w, http.StatusOK, dc)

	case r.Method == "POST" && action == "investigate":
		if !requireFederationWrite(w, p) {
			return
		}
		var body struct {
			InvestigatorID string `json:"investigator_id"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.Federation.Discipline.AssignInvestigator(r.Context(), id, body.InvestigatorID); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "investigating"})

	case r.Method == "POST" && action == "hearing":
		if !requireFederationWrite(w, p) {
			return
		}
		var h discipline.Hearing
		if err := json.NewDecoder(r.Body).Decode(&h); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		h.CaseID = id
		created, err := s.Federation.Discipline.ScheduleHearing(r.Context(), h)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, created)

	case r.Method == "POST" && action == "dismiss":
		if !requireFederationWrite(w, p) {
			return
		}
		if err := s.Federation.Discipline.DismissCase(r.Context(), id, p.User.ID); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "dismissed"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "endpoint not found")
	}
}

// ── Certification ────────────────────────────────────────────

func (s *Server) handleCertificationRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/certifications/verify/", s.handleCertVerifyPublic) // Public (no auth)
	mux.HandleFunc("/api/v1/certifications/", s.withAuth(s.handleCertCRUD))
	mux.HandleFunc("/api/v1/certifications", s.withAuth(s.handleCertCRUD))
}

func (s *Server) handleCertCRUD(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/certifications")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		if !requireFederationRead(w, p) {
			return
		}
		certs, err := s.Federation.Certification.ListByHolder(r.Context(), "", "")
		if err != nil {
			// Fallback: try to list via repo if ListByHolder returns error for empty args
			apiInternal(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"certifications": certs, "total": len(certs)})

	case r.Method == "POST" && id == "":
		if !requireFederationWrite(w, p) {
			return
		}
		var cert certification.Certificate
		if err := json.NewDecoder(r.Body).Decode(&cert); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, "invalid JSON: "+err.Error())
			return
		}
		cert.IssuedBy = p.User.ID
		issued, err := s.Federation.Certification.Issue(r.Context(), cert)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusCreated, issued)

	case r.Method == "GET" && id != "" && action == "":
		if !requireFederationRead(w, p) {
			return
		}
		cert, err := s.Federation.Certification.GetCertificate(r.Context(), id)
		if err != nil {
			apiError(w, http.StatusNotFound, CodeNotFound, "certification not found")
			return
		}
		success(w, http.StatusOK, cert)

	case r.Method == "POST" && action == "renew":
		if !requireFederationWrite(w, p) {
			return
		}
		var body struct {
			ValidUntil string `json:"valid_until"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		renewed, err := s.Federation.Certification.Renew(r.Context(), id, body.ValidUntil)
		if err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, renewed)

	case r.Method == "POST" && action == "revoke":
		if !requireFederationWrite(w, p) {
			return
		}
		var body struct {
			Reason string `json:"reason"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.Federation.Certification.Revoke(r.Context(), id, body.Reason); err != nil {
			apiError(w, http.StatusBadRequest, CodeBadRequest, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "revoked"})

	default:
		apiError(w, http.StatusNotFound, CodeNotFound, "endpoint not found")
	}
}

func (s *Server) handleCertVerifyPublic(w http.ResponseWriter, r *http.Request) {
	code := strings.TrimPrefix(r.URL.Path, "/api/v1/certifications/verify/")
	if code == "" {
		apiError(w, http.StatusBadRequest, CodeBadRequest, "verification code required")
		return
	}
	cert, err := s.Federation.Certification.Verify(r.Context(), code)
	if err != nil {
		success(w, http.StatusOK, map[string]any{"found": false, "code": code})
		return
	}
	success(w, http.StatusOK, map[string]any{
		"found":       true,
		"code":        code,
		"cert_number": cert.CertNumber,
		"holder_name": cert.HolderName,
		"type":        cert.Type,
		"status":      cert.Status,
		"valid_from":  cert.ValidFrom,
		"valid_until": cert.ValidUntil,
		"issued_at":   cert.IssuedAt,
	})
}
