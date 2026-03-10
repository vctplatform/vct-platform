package httpapi

import (
	"encoding/json"
	"net/http"

	"vct-platform/backend/internal/auth"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FINANCE API HANDLERS
// ═══════════════════════════════════════════════════════════════

// ── Invoice ──────────────────────────────────────────────────

// handleInvoiceList handles GET /api/v1/finance/invoices
func (s *Server) handleInvoiceList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "invoice_list handler registered",
	})
}

// handleInvoiceGet handles GET /api/v1/finance/invoices/{id}
func (s *Server) handleInvoiceGet(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "invoice_get handler registered",
	})
}

// handleInvoiceCreate handles POST /api/v1/finance/invoices
func (s *Server) handleInvoiceCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "invoice_create handler registered",
	})
}

// ── Payment ──────────────────────────────────────────────────

// handlePaymentRecord handles POST /api/v1/finance/payments
func (s *Server) handlePaymentRecord(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	var body struct {
		InvoiceID     string  `json:"invoice_id"`
		Amount        float64 `json:"amount"`
		Method        string  `json:"method"`
		ReferenceCode string  `json:"reference_code,omitempty"`
		ProofURL      string  `json:"proof_url,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		badRequest(w, "Request body không hợp lệ")
		return
	}
	success(w, http.StatusOK, map[string]string{
		"status": "payment_record handler registered",
	})
}

// handlePaymentConfirm handles POST /api/v1/finance/payments/{id}/confirm
func (s *Server) handlePaymentConfirm(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "payment_confirm handler registered",
	})
}

// ── Fee Schedule ─────────────────────────────────────────────

// handleFeeScheduleList handles GET /api/v1/finance/fee-schedules
func (s *Server) handleFeeScheduleList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "fee_schedule_list handler registered",
	})
}

// ── Budget ───────────────────────────────────────────────────

// handleBudgetList handles GET /api/v1/finance/budgets
func (s *Server) handleBudgetList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "budget_list handler registered",
	})
}

// ── Sponsorship ──────────────────────────────────────────────

// handleSponsorshipList handles GET /api/v1/finance/sponsorships
func (s *Server) handleSponsorshipList(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "sponsorship_list handler registered",
	})
}

// handleSponsorshipCreate handles POST /api/v1/finance/sponsorships
func (s *Server) handleSponsorshipCreate(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	success(w, http.StatusOK, map[string]string{
		"status": "sponsorship_create handler registered",
	})
}

// ── Legacy Route Stubs (referenced in server.go) ─────────────

// handleTransactionRoutes handles /api/v1/transactions routes.
func (s *Server) handleTransactionRoutes(w http.ResponseWriter, r *http.Request) {
	success(w, http.StatusOK, map[string]string{
		"status": "transaction_routes handler registered",
		"info":   "use /api/v1/finance/* for new endpoints",
	})
}

// handleBudgetRoutes handles /api/v1/budgets routes.
func (s *Server) handleBudgetRoutes(w http.ResponseWriter, r *http.Request) {
	success(w, http.StatusOK, map[string]string{
		"status": "budget_routes handler registered",
		"info":   "use /api/v1/finance/budgets for new endpoints",
	})
}
