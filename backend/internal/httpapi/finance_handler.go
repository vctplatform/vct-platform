package httpapi

import (
	"net/http"
	"strings"

	"vct-platform/backend/internal/authz"
	"vct-platform/backend/internal/domain/finance"
)

// handleTransactionRoutes handles /api/v1/transactions
func (s *Server) handleTransactionRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/transactions")
	path = strings.Trim(path, "/")

	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			if err := s.authorizeEntityAction(&principal, "transactions", authz.ActionView); err != nil {
				writeAuthError(w, err)
				return
			}
			list, fetchErr := s.financeService.ListTransactions(r.Context())
			if fetchErr != nil {
				internalError(w, fetchErr)
				return
			}
			success(w, http.StatusOK, list)
		case http.MethodPost:
			if err := s.authorizeEntityAction(&principal, "transactions", authz.ActionCreate); err != nil {
				writeAuthError(w, err)
				return
			}
			var payload finance.Transaction
			if err := decodeJSON(r, &payload); err != nil {
				badRequest(w, err.Error())
				return
			}
			created, err := s.financeService.CreateTransaction(r.Context(), payload)
			if err != nil {
				badRequest(w, err.Error())
				return
			}
			raw, _ := toMap(created)
			s.broadcastEntityChange("transactions", "created", created.ID, raw, nil)
			success(w, http.StatusCreated, created)
		default:
			methodNotAllowed(w)
		}
		return
	}

	id := strings.Split(path, "/")[0]
	if err := s.authorizeEntityAction(&principal, "transactions", authz.ActionView); err != nil {
		writeAuthError(w, err)
		return
	}
	tx, err := s.financeService.GetTransaction(r.Context(), id)
	if err != nil {
		notFound(w)
		return
	}
	success(w, http.StatusOK, tx)
}

// handleBudgetRoutes handles /api/v1/budgets
func (s *Server) handleBudgetRoutes(w http.ResponseWriter, r *http.Request) {
	principal, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}
	if err := s.authorizeEntityAction(&principal, "budgets", authz.ActionView); err != nil {
		writeAuthError(w, err)
		return
	}
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	list, fetchErr := s.financeService.ListBudgets(r.Context())
	if fetchErr != nil {
		internalError(w, fetchErr)
		return
	}
	success(w, http.StatusOK, list)
}
