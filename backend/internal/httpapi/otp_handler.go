package httpapi

import (
	"net/http"

	"vct-platform/backend/internal/auth"
)

// handleAuthSendOTP handles POST /api/v1/auth/send-otp
func (s *Server) handleAuthSendOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.SendOTPRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
		return
	}

	result, err := s.authService.SendOTP(input, s.emailService)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

// handleAuthVerifyOTP handles POST /api/v1/auth/verify-otp
func (s *Server) handleAuthVerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.VerifyOTPRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
		return
	}

	result, err := s.authService.VerifyOTP(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusCreated, result)
}
