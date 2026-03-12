package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION MASTER DATA & APPROVAL HANDLERS
// ═══════════════════════════════════════════════════════════════

// ── Master Belts ─────────────────────────────────────────────

func (s *Server) handleMasterBelts(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case "GET":
		belts, err := s.federationSvc.ListMasterBelts(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"belts": belts, "total": len(belts)})

	case "POST":
		var belt federation.MasterBelt
		if err := json.NewDecoder(r.Body).Decode(&belt); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.federationSvc.CreateMasterBelt(r.Context(), belt); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "belt_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleMasterBeltByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	level := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/master/belts/")
	if level == "" {
		badRequest(w, "belt level required")
		return
	}

	switch r.Method {
	case "GET":
		belt, err := s.federationSvc.GetMasterBelt(r.Context(), level)
		if err != nil {
			notFoundError(w, "belt not found")
			return
		}
		success(w, http.StatusOK, belt)

	case "PUT":
		var belt federation.MasterBelt
		if err := json.NewDecoder(r.Body).Decode(&belt); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		// Parse path level param to int for MasterBelt.Level
		var levelInt int
		if _, err := fmt.Sscanf(level, "%d", &levelInt); err != nil {
			badRequest(w, "invalid belt level: "+level)
			return
		}
		belt.Level = levelInt
		if err := s.federationSvc.UpdateMasterBelt(r.Context(), belt); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "belt_updated"})

	case "DELETE":
		if err := s.federationSvc.DeleteMasterBelt(r.Context(), level); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "belt_deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ── Master Weights ───────────────────────────────────────────

func (s *Server) handleMasterWeights(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case "GET":
		weights, err := s.federationSvc.ListMasterWeights(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"weight_classes": weights, "total": len(weights)})

	case "POST":
		var wc federation.MasterWeightClass
		if err := json.NewDecoder(r.Body).Decode(&wc); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.federationSvc.CreateMasterWeight(r.Context(), wc); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "weight_class_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleMasterWeightByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/master/weights/")
	if id == "" {
		badRequest(w, "weight class id required")
		return
	}

	switch r.Method {
	case "GET":
		wc, err := s.federationSvc.GetMasterWeight(r.Context(), id)
		if err != nil {
			notFoundError(w, "weight class not found")
			return
		}
		success(w, http.StatusOK, wc)

	case "PUT":
		var wc federation.MasterWeightClass
		if err := json.NewDecoder(r.Body).Decode(&wc); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		wc.ID = id
		if err := s.federationSvc.UpdateMasterWeight(r.Context(), wc); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "weight_class_updated"})

	case "DELETE":
		if err := s.federationSvc.DeleteMasterWeight(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "weight_class_deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ── Master Age Groups ────────────────────────────────────────

func (s *Server) handleMasterAges(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case "GET":
		ages, err := s.federationSvc.ListMasterAges(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"age_groups": ages, "total": len(ages)})

	case "POST":
		var ag federation.MasterAgeGroup
		if err := json.NewDecoder(r.Body).Decode(&ag); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.federationSvc.CreateMasterAge(r.Context(), ag); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "age_group_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleMasterAgeByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/master/ages/")
	if id == "" {
		badRequest(w, "age group id required")
		return
	}

	switch r.Method {
	case "GET":
		ag, err := s.federationSvc.GetMasterAge(r.Context(), id)
		if err != nil {
			notFoundError(w, "age group not found")
			return
		}
		success(w, http.StatusOK, ag)

	case "PUT":
		var ag federation.MasterAgeGroup
		if err := json.NewDecoder(r.Body).Decode(&ag); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		ag.ID = id
		if err := s.federationSvc.UpdateMasterAge(r.Context(), ag); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "age_group_updated"})

	case "DELETE":
		if err := s.federationSvc.DeleteMasterAge(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "age_group_deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ── Master Competition Contents ──────────────────────────────

func (s *Server) handleMasterContents(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	switch r.Method {
	case "GET":
		contents, err := s.federationSvc.ListMasterContents(r.Context())
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"contents": contents, "total": len(contents)})

	case "POST":
		var c federation.MasterCompetitionContent
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		if err := s.federationSvc.CreateMasterContent(r.Context(), c); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]string{"status": "content_created"})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleMasterContentByID(w http.ResponseWriter, r *http.Request, _ auth.Principal) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/master/contents/")
	if id == "" {
		badRequest(w, "content id required")
		return
	}

	switch r.Method {
	case "GET":
		c, err := s.federationSvc.GetMasterContent(r.Context(), id)
		if err != nil {
			notFoundError(w, "content not found")
			return
		}
		success(w, http.StatusOK, c)

	case "PUT":
		var c federation.MasterCompetitionContent
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			badRequest(w, "invalid JSON: "+err.Error())
			return
		}
		c.ID = id
		if err := s.federationSvc.UpdateMasterContent(r.Context(), c); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "content_updated"})

	case "DELETE":
		if err := s.federationSvc.DeleteMasterContent(r.Context(), id); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "content_deleted"})

	default:
		methodNotAllowed(w)
	}
}

// ── Approval Workflow Center ─────────────────────────────────

func (s *Server) handleFederationApprovals(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/federation/approvals")
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	id := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case r.Method == "GET" && id == "":
		status := r.URL.Query().Get("status")
		reqs, err := s.federationSvc.GetAllApprovals(r.Context(), status)
		if err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]any{"approvals": reqs, "total": len(reqs)})

	case r.Method == "POST" && id != "" && action == "approve":
		var body struct {
			Notes string `json:"notes"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.federationSvc.ProcessApproval(r.Context(), id, "APPROVE", body.Notes); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "approved"})

	case r.Method == "POST" && id != "" && action == "reject":
		var body struct {
			Notes string `json:"notes"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if err := s.federationSvc.ProcessApproval(r.Context(), id, "REJECT", body.Notes); err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, map[string]string{"status": "rejected"})

	default:
		methodNotAllowed(w)
	}
}
